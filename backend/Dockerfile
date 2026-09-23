# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS base

FROM base AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# No compiler toolchain: every pinned dependency resolves to a manylinux
# wheel, and psycopg2-binary bundles its own libpq. Adding build-essential
# back costs ~200 MB in this stage and a slow apt run on every cache miss.

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY backend/requirements.txt backend/requirements-ml.txt backend/constraints.txt ./
# --no-compile skips .pyc generation (~100 MB across tensorflow-cpu and its
# deps). Modules are byte-compiled lazily on first import instead.
RUN pip install --upgrade pip && \
    pip install --no-compile -r requirements.txt -r requirements-ml.txt

# Strip artefacts that inference never reads (~246 MB), verified by loading all
# three predictors and serving a request with them removed:
#   tensorflow/include  172 MB of C++ headers, only used to compile custom ops
#   clang                61 MB libclang.so; declared by tensorflow, never imported
#   pip + wheel          13 MB of installer tooling with no runtime role
# setuptools/pkg_resources stay: passlib/pwd.py imports pkg_resources at module
# level, so dropping them would be a latent ImportError for 11 MB.
RUN rm -rf /opt/venv/lib/python*/site-packages/tensorflow/include \
           /opt/venv/lib/python*/site-packages/clang \
           /opt/venv/lib/python*/site-packages/pip \
           /opt/venv/lib/python*/site-packages/wheel

FROM base AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}" \
    APP_ENV=production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* && \
    addgroup --system app && adduser --system --ingroup app app

COPY --from=builder /opt/venv /opt/venv
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
COPY backend/src ./src
COPY backend/seed_data ./seed_data

# Copy only the checkpoints the settings actually point at. The legacy
# finger-spelling MLP (v3 + its label encoder) and the older duplicate weights
# under backend/ml/models are superseded; .dockerignore keeps them out of the
# build context entirely.
COPY backend/ml/models/finger_spelling ./ml/models/finger_spelling
COPY backend/ml/models/sentence_spelling ./ml/models/sentence_spelling

# The word-detection model lives under data_set/ in the repo, which is
# excluded from the context apart from these two files. Relocate it under
# /app and point the settings at the new location, since the defaults in
# src/core/config.py resolve to /data_set inside the image.
COPY data_set/word_detection_model_assets/best_model_25class_fix.h5 \
     data_set/word_detection_model_assets/label_map_25class.json \
     ./ml/word_detection/
ENV WORD_ML_MODEL_PATH=/app/ml/word_detection/best_model_25class_fix.h5 \
    WORD_ML_LABEL_MAP_PATH=/app/ml/word_detection/label_map_25class.json

# Runtime write targets also default under /data_set, which the app user
# cannot create. Bind-mount or volume-mount /app/data in production so
# uploads do not accumulate in the container's writable layer.
ENV WORD_DETECTION_CONTRIBUTIONS_DIR=/app/data/word_detection_contributions \
    MEDIA_UPLOAD_DIR=/app/data/media_uploads
RUN mkdir -p /app/data/word_detection_contributions /app/data/media_uploads && \
    chown -R app:app /app/data

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/').read()"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
