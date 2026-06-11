# Khmer finger-spelling ML assets

This folder holds **model files and training notebooks**. Production Python code lives in `backend/src/ml/`.

**No TensorFlow required** — your trained `best_mlp_khmer_model.h5` is loaded with **h5py + NumPy** for inference only.

## Layout

```
backend/ml/
├── models/
│   ├── best_mlp_khmer_model.h5    # Pre-trained MLP (Keras weights, NumPy inference)
│   └── hand_landmarker.task       # MediaPipe hand landmarker
└── notebooks/
    └── extract_keypoints_handedness.ipynb
```

## Setup

From the `backend/` directory:

```bash
pip install -r requirements.txt -r requirements-ml.txt
```

`requirements-ml.txt` includes **h5py**, **mediapipe**, and **Pillow** only — not TensorFlow.

Optional env overrides (in `backend/.env`):

```env
ML_ENABLED=true
ML_MODEL_PATH=ml/models/best_mlp_khmer_model.h5
ML_LANDMARKER_PATH=ml/models/hand_landmarker.task
```

## Model input

The MLP expects **126 features**: right-hand keypoints (63) + left-hand keypoints (63), matching the training notebook (without the handedness column).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/finger_spelling/practice/predict/status` | Check if models are on disk |
| POST | `/api/finger_spelling/practice/predict/image` | Upload camera frame → keypoints → prediction |
| POST | `/api/finger_spelling/practice/predict/features` | Submit precomputed feature vector |

All predict routes require authentication (same as other practice routes).

## Git

Large binaries (`*.h5`, `*.task`) are gitignored. Copy them locally or use Git LFS for team sharing.

## Source code

| Module | Purpose |
|--------|---------|
| `src/ml/keypoints.py` | MediaPipe landmark extraction |
| `src/ml/predictor.py` | Load `.h5` weights and run NumPy inference |
| `src/services/finger_spelling/hand_prediction_service.py` | Orchestration layer |
