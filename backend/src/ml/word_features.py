"""Word-detection feature pipeline: raw landmarks (30, 258) -> model input (30, 686).

NumPy port of the live-test / training notebooks (``live_testing_script.ipynb``,
``landmark_enigne.ipynb``): per-frame extraction (``extract_features``), velocity,
``SignLanguageNormalizer`` and ``FeatureEngineeringEngine``. Motion direction
follows the *training* definition (left-hand centroid shift), since that is
what the model learned.

Raw frame layout, sent by the browser from MediaPipe Holistic on the mirrored
frame (absolute normalized coordinates, zeros for anything not detected):

    pose  33 x (x, y, z, visibility)  = 132
    left  21 x (x, y, z)              =  63
    right 21 x (x, y, z)              =  63      -> 258 per frame
"""

from __future__ import annotations

import numpy as np

SEQUENCE_LENGTH = 30
RAW_FEATURES_PER_FRAME = 258

_POSE_END = 132
_LEFT_END = 195
_NOSE, _L_SHOULDER, _R_SHOULDER, _L_ELBOW, _R_ELBOW, _L_HIP, _R_HIP = 0, 11, 12, 13, 14, 23, 24
_FINGERTIPS = (4, 8, 12, 16, 20)
_JOINT_CHAINS = ((1, 2, 3, 4), (5, 6, 7, 8), (9, 10, 11, 12), (13, 14, 15, 16), (17, 18, 19, 20))
_TARGET_HAND_SIZE = 0.3
_CLIP = 2.0


def _split(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    return (
        frame[:_POSE_END].reshape(33, 4).copy(),
        frame[_POSE_END:_LEFT_END].reshape(21, 3).copy(),
        frame[_LEFT_END:RAW_FEATURES_PER_FRAME].reshape(21, 3).copy(),
    )


def extract_base(raw: np.ndarray) -> np.ndarray:
    """Live test's ``extract_features``: hip-centered pose, wrist-relative hands."""
    base = np.zeros_like(raw, dtype=np.float32)
    for t, frame in enumerate(raw):
        pose, left, right = _split(frame)
        if pose.any():
            pose[:, :3] -= (pose[_L_HIP, :3] + pose[_R_HIP, :3]) / 2
        if left.any():
            left -= left[0]
        if right.any():
            right -= right[0]
        base[t] = np.concatenate([pose.ravel(), left.ravel(), right.ravel()])
    return base


def _with_velocity(base: np.ndarray) -> np.ndarray:
    velocity = np.zeros_like(base)
    velocity[1:] = base[1:] - base[:-1]
    return np.concatenate([base, velocity], axis=1)


def _scale_hand(hand: np.ndarray) -> np.ndarray:
    size = np.mean([np.linalg.norm(hand[i] - hand[0]) for i in _FINGERTIPS])
    return hand * (_TARGET_HAND_SIZE / size) if size > 0.001 else hand


def normalize_sequence(features: np.ndarray) -> np.ndarray:
    """``SignLanguageNormalizer.normalize_sequence`` with the notebook's settings."""
    frames = []
    for frame in features:
        pose, left, right = _split(frame)
        width = np.linalg.norm(pose[_L_SHOULDER, :3] - pose[_R_SHOULDER, :3])
        pose[:, :3] -= (pose[_L_HIP, :3] + pose[_R_HIP, :3]) / 2
        pose[:, :3] = pose[:, :3] / width if width > 0.001 else 0
        left = _scale_hand(left - left[0])
        right = _scale_hand(right - right[0])
        left[:, 0] = -left[:, 0]  # mirror the left hand onto the right-hand convention
        pose[:, :3] = np.clip(pose[:, :3], -_CLIP, _CLIP)
        left, right = np.clip(left, -_CLIP, _CLIP), np.clip(right, -_CLIP, _CLIP)
        frames.append(np.concatenate([pose.ravel(), left.ravel(), right.ravel()]))
    pose_hands = np.asarray(frames, dtype=np.float32)
    velocity = np.zeros_like(pose_hands)
    velocity[1:] = pose_hands[1:] - pose_hands[:-1]
    return np.concatenate([pose_hands, velocity], axis=1)


def _angle(p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
    v1, v2 = p1 - p2, p3 - p2
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 > 0.001 and n2 > 0.001:
        return float(np.arccos(np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)) * 180 / np.pi)
    return 0.0


def _joint_angles(hand: np.ndarray) -> list[float]:
    return [
        _angle(hand[c[i]], hand[c[i + 1]], hand[c[i + 2]])
        for c in _JOINT_CHAINS
        for i in range(len(c) - 2)
    ]


def _orientation(hand: np.ndarray) -> list[float]:
    normal = np.cross(hand[5] - hand[0], hand[17] - hand[0])
    norm = np.linalg.norm(normal)
    if norm > 0.001:
        normal = normal / norm
    roll = np.arctan2(normal[1], normal[2]) * 180 / np.pi
    pitch = np.arctan2(-normal[0], np.sqrt(normal[1] ** 2 + normal[2] ** 2)) * 180 / np.pi
    return [float(roll), float(pitch)]


def _body_distances(hand: np.ndarray, pose: np.ndarray) -> list[float]:
    center = hand.mean(axis=0)
    keys = (_NOSE, _L_SHOULDER, _R_SHOULDER, _L_HIP, _R_HIP, _L_ELBOW, _R_ELBOW)
    return [float(np.linalg.norm(center - pose[k, :3])) for k in keys]


def _shoulder_ratio(hand: np.ndarray, pose: np.ndarray, shoulder: int) -> list[float]:
    width = np.linalg.norm(pose[_L_SHOULDER, :3] - pose[_R_SHOULDER, :3])
    if width <= 0.001:
        return [0.0]
    return [float(np.linalg.norm(hand[0] - pose[shoulder, :3]) / width)]


def engineer_features(normalized: np.ndarray) -> np.ndarray:
    """``FeatureEngineeringEngine.extract_all_features``: (T, 516) -> (T, 686)."""
    steps = normalized.shape[0]
    velocity = normalized[:, 258:516]
    acceleration = np.zeros_like(velocity)
    acceleration[1:] = velocity[1:] - velocity[:-1]

    centers = np.array([_split(f)[1].mean(axis=0) for f in normalized])  # left-hand centroid
    direction = np.zeros((steps, 2), dtype=np.float32)
    for t in range(1, steps):
        move = centers[t] - centers[t - 1]
        norm = np.linalg.norm(move)
        if norm > 0.001:
            move = move / norm
            direction[t] = [
                np.arctan2(move[1], move[0]) * 180 / np.pi,
                np.arctan2(move[2], np.sqrt(move[0] ** 2 + move[1] ** 2)) * 180 / np.pi,
            ]

    rows = []
    for t in range(steps):
        pose, left, right = _split(normalized[t])
        static = np.concatenate([
            (left - left[0]).ravel(), (right - right[0]).ravel(),
            _body_distances(left, pose), _body_distances(right, pose),
            _joint_angles(left), _joint_angles(right),
            _orientation(left), _orientation(right),
            _shoulder_ratio(left, pose, _L_SHOULDER), _shoulder_ratio(right, pose, _R_SHOULDER),
        ])
        rows.append(np.concatenate([
            static,
            velocity[t],
            [np.linalg.norm(velocity[t])],
            acceleration[t],
            [np.linalg.norm(acceleration[t])],
            direction[t],
        ]))
    return np.asarray(rows, dtype=np.float32)


def build_model_input(raw_sequence: np.ndarray) -> np.ndarray:
    """Raw absolute landmarks (30, 258) -> model input (30, 686)."""
    raw = np.asarray(raw_sequence, dtype=np.float32)
    if raw.shape != (SEQUENCE_LENGTH, RAW_FEATURES_PER_FRAME):
        raise ValueError(
            f"Expected raw landmarks of shape ({SEQUENCE_LENGTH}, {RAW_FEATURES_PER_FRAME}), got {raw.shape}"
        )
    features = engineer_features(normalize_sequence(_with_velocity(extract_base(raw))))
    return np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
