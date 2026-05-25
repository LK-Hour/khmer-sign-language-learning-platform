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
