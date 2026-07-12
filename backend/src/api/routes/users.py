from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from src.api.deps import get_db
from src.api.deps import get_admin_user, get_current_user
from src.core.config import settings
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, UserUpdate
from src.utils.password import hash_password

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check duplicate username
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check duplicate email
    if user_data.email and db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    can_bootstrap_roles = settings.environment.lower() not in {"production", "prod"}

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password) if user_data.password else None,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url,
        account_type=user_data.account_type if can_bootstrap_roles else "student",
        auth_provider=user_data.auth_provider,
        is_guest=user_data.is_guest,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 20,
    q: Optional[str] = Query(default=None, description="Search text matching display_name or email"),
    account_type: Optional[str] = Query(default=None, description="Filter by account type (student, admin, guest)"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    # Apply search filter: match against display_name or email
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                User.display_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    # Apply account_type filter
    if account_type:
        query = query.filter(User.account_type == account_type)

    # Apply is_active filter
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    return query.offset(skip).limit(min(limit, 100)).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Authorization check: can only update self or admin can update any user
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Self-action prevention: admin cannot change their own account_type
    update_data = user_data.model_dump(exclude_unset=True)
    if (
        user_id == current_user.id
        and current_user.account_type == "admin"
        and "account_type" in update_data
    ):
        raise HTTPException(status_code=403, detail="Cannot change your own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    password = update_data.pop("password", None)
    account_type = update_data.pop("account_type", None)
    for field, value in update_data.items():
        setattr(user, field, value)
    if account_type is not None and current_user.account_type == "admin":
        user.account_type = account_type
    if password:
        user.password_hash = hash_password(password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK, response_model=UserResponse)
def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    # Authorization check: can only delete self or admin can delete any user
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Self-action prevention: admin cannot deactivate their own account
    if user_id == current_user.id and current_user.account_type == "admin":
        raise HTTPException(status_code=403, detail="Cannot deactivate your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete: set is_active to False instead of hard delete
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
