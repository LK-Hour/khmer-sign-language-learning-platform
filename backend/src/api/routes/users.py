from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_admin_user, get_current_user
from src.core.config import settings
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, UserUpdate
from src.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    svc = UserService(db)

    if svc.get_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    if user_data.email and svc.get_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    can_bootstrap_roles = settings.environment.lower() not in {"production", "prod"}

    user = svc.create(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url,
        account_type=user_data.account_type if can_bootstrap_roles else "student",
        auth_provider=user_data.auth_provider,
        is_guest=user_data.is_guest,
    )
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
    svc = UserService(db)
    return svc.list_users(
        skip=skip,
        limit=limit,
        search=q,
        account_type=account_type,
        is_active=is_active,
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    svc = UserService(db)
    user = svc.get_by_id(user_id)
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
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    update_data = user_data.model_dump(exclude_unset=True)

    # Self-action prevention: admin cannot change their own account_type
    if (
        user_id == current_user.id
        and current_user.account_type == "admin"
        and "account_type" in update_data
    ):
        raise HTTPException(status_code=403, detail="Cannot change your own role")

    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    password = update_data.pop("password", None)
    account_type = update_data.pop("account_type", None) if current_user.account_type == "admin" else update_data.pop("account_type", None)

    # Only admins can actually change account_type
    effective_account_type = account_type if current_user.account_type == "admin" else None

    user = svc.update(
        user,
        update_data=update_data,
        password=password,
        account_type=effective_account_type,
    )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK, response_model=UserResponse)
def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    if user_id != current_user.id and current_user.account_type != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Self-action prevention: admin cannot deactivate their own account
    if user_id == current_user.id and current_user.account_type == "admin":
        raise HTTPException(status_code=403, detail="Cannot deactivate your own account")

    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = svc.deactivate(user)
    return user
