# Seed Data

This folder is for repeatable data scripts and data files that the team can reuse on any machine.

Use it for:
- default lookup data
- demo or test records
- CSV or JSON imports
- data that should be easy to export and import again later

Recommended pattern:
- keep table structure changes in Alembic migrations
- keep repeatable data loading in this folder
- make the script safe to run more than once

## What the script does

The seed script can do three jobs:

### 1. Export
Export means copying the current rows from the database into a JSON file.

Use this when you want to capture the current database state and reuse it later on another machine.

### 2. Seed from fixture
A fixture is a saved JSON file that contains rows you want to load again.

Seed from fixture means reading that JSON file and inserting the rows into the database.

This is useful when you want the same demo or reference data on every machine.

### 3. Wipe
Wipe means clearing the managed tables before importing the fixture.

Use wipe when you want to start with a clean database and replace the current rows with the rows from the JSON file.

If you do not use wipe, the script tries to keep existing rows and only update matching ones.

## Finger spelling curriculum

The finger-spelling course tree (units → chapters → lessons → letters) is seeded separately:

- The script now also discovers and links image media from `data_set/Fingerspelling data for development`.
- By default it scans PNG files and inserts rows into `medias` and `finger_letter_medias`.

```bash
cd backend
alembic upgrade head   # ensure migrations through 003 (finger_letters uses letter_en / letter_kh)
python seed_data/seed_curriculum.py                    # upsert curriculum + media links (safe to re-run)
python seed_data/seed_curriculum.py --dry-run          # preview summary only, no DB writes
python seed_data/seed_curriculum.py --wipe             # wipe curriculum tables, then re-seed (keeps medias table)
python seed_data/seed_curriculum.py --wipe --wipe-media # wipe curriculum + medias, then re-seed everything
alembic revision --autogenerate -m "description"        # create new migration if you need to change the schema
```

Behavior notes:
- `--wipe` clears curriculum tables and related progress via CASCADE.
- `--wipe-media` only takes effect when used together with `--wipe`.
- Re-running without `--wipe` performs upsert behavior.

### Rename image files + reseed media paths

When you add new cropped/background-removed images, run this helper to normalize file names and refresh `medias.file_url` values:

```bash
cd backend
python seed_data/rename_and_reseed_media.py --dry-run
python seed_data/rename_and_reseed_media.py --reseed
python seed_data/rename_and_reseed_media.py --reseed --wipe --wipe-media
```

Notes:
- `--dry-run` previews rename operations without changing files.
- `--reseed` runs `seed_curriculum.py` after renaming to sync DB media paths.
- `--wipe --wipe-media` is the cleanest full refresh, but it clears curriculum/progress data.

Older databases stamped at Alembic `002` sometimes still had a legacy `letter_code` / `letter_display` layout on `finger_letters`. Migration `003_align_finger_letters_schema` normalizes that table so it matches the ORM and this seed script.

## Users and OAuth (demo accounts)

Demo users live in `seed_data.json` (6 users: 2 email/password students, 1 admin, 3 OAuth-linked accounts).

### Demo login credentials (local dev only)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@cadt.com` | `AdminPass123!` |
| Student | `test@cadt.com` | *(see team — hash in fixture)* |
| Student | `test2@cadt.com` | *(see team — hash in fixture)* |

Load or refresh demo users **without wiping curriculum**:

```bash
cd backend
python seed_data/seed_users.py
```

To replace all managed tables from the full fixture (destructive — clears curriculum too):

```bash
python seed_data/seed_database.py --output seed_data/seed_data.json --wipe
```

Upsert users only (safe, re-runnable):

```bash
python seed_data/seed_database.py --output seed_data/seed_data.json
```

Then sign in at `http://localhost:3000/en/login` → **Admin** tab with `admin@cadt.com` / `AdminPass123!`.

```bash
cd backend
alembic upgrade head   # through 004 (user/auth tables match ORM)
python seed_data/seed_users.py
```

Migration `004_recreate_user_auth_tables` replaces legacy `users` columns (`first_name`, `hashed_password`, etc.) when those tables are still on the old layout. It is safe when user tables are empty.

## Current workflow
```bash
# export the current database into a JSON fixture
python seed_data/seed_database.py --export --output seed_data/seed_data.json

# seed from a fixture without clearing existing rows first
python seed_data/seed_database.py --output seed_data/seed_data.json

# wipe the managed tables first, then import the fixture again
python seed_data/seed_database.py --output seed_data/seed_data.json --wipe
```

## Why this is useful

The script works in chunks, so it can handle bigger tables better than a simple one-shot insert script.
It also updates matching rows instead of blindly duplicating everything.

## Practical rule

- Use export when you want to save the current database state.
- Use seed from fixture when you want to recreate the same data on another machine.
- Use wipe when you want to delete the current managed rows before loading the fixture again.

If you add bulk imports later, keep the source files and the import script together in this folder so teammates can reproduce the same dataset.
