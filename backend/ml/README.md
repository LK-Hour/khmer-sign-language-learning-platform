# Khmer finger-spelling ML assets

This folder holds **model files and training notebooks**. Production Python code lives in `backend/src/ml/`.

**No TensorFlow required**-the finger-spelling model (`finger_spelling/best_mlp_model.keras`, a Keras 3 export) is read with **h5py + NumPy** for inference only.

## Layout

```
backend/ml/
├── models/
│   ├── finger_spelling/
│   │   ├── best_mlp_model.keras   # Pre-trained MLP (Keras 3 export, NumPy inference)
│   │   └── class_mapping.json     # Output index -> Khmer label (128 classes)
│   ├── sentence_spelling/         # Same model export, used by sentence spelling
│   └── hand_landmarker.task       # MediaPipe hand landmarker
└── notebooks/
    └── extract_keypoints_handedness.ipynb
```

## Setup

From the `backend/` directory:

```bash
pip install -r requirements.txt -r requirements-ml.txt
```

`requirements-ml.txt` includes **h5py**, **mediapipe**, and **Pillow** only-not TensorFlow.

Optional env overrides (in `backend/.env`):

```env
ML_ENABLED=true
ML_MODEL_PATH=ml/models/finger_spelling/best_mlp_model.keras
ML_CLASS_MAPPING_PATH=ml/models/finger_spelling/class_mapping.json
ML_LANDMARKER_PATH=ml/models/hand_landmarker.task
```

## Model input

The MLP expects **126 features**: right-hand keypoints (63) + left-hand keypoints (63). Landmarks are **normalized in the browser** before they reach the API (`frontend/src/features/finger-spelling/ml/handKeypoints.ts`):

| Hands detected | Normalization |
|----------------|---------------|
| 0 | No prediction |
| 1 | Wrist-normalized (re-centered on the wrist, divided by the largest x-y distance), placed in the **Right** slot; the Left slot is zeros |
| 2 | Pair-normalized (shared wrist midpoint and shared scale), Right block then Left block |

Sending raw, un-normalized MediaPipe coordinates will make predictions meaningless.

Network: `126 -> Dense512 -> Dense256 -> Dense128 -> softmax(128)`, each hidden block `Dense -> BatchNorm -> ReLU`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/finger_spelling/practice/predict/status` | Check if models are on disk |
| POST | `/api/finger_spelling/practice/predict/image` | Upload camera frame → keypoints → prediction |
| POST | `/api/finger_spelling/practice/predict/features` | Submit precomputed feature vector |

All predict routes require authentication (same as other practice routes).

## Git

Large binaries (`*.h5`, `*.keras`, `*.task`) are gitignored. Copy them locally or use Git LFS for team sharing.

## Source code

| Module | Purpose |
|--------|---------|
| `src/ml/keypoints.py` | MediaPipe landmark extraction |
| `src/ml/predictor.py` | Load the `.keras` weights and `class_mapping.json`, run NumPy inference and category masking |
| `src/services/finger_spelling/hand_prediction_service.py` | Orchestration layer |
