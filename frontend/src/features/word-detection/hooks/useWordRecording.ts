"use client";

import { useCallback, useRef, useState } from "react";

export type WordRecordingResult = {
  blob: Blob;
  mimeType: string;
};

const MIME_TYPE_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPE_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useWordRecording() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordForDuration = useCallback(
    (stream: MediaStream, durationMs: number): Promise<WordRecordingResult> => {
      setError(null);

      if (typeof MediaRecorder === "undefined") {
        const message = "Video recording is not supported in this browser.";
        setError(message);
        return Promise.reject(new Error(message));
      }

      if (!stream.active || stream.getVideoTracks().length === 0) {
        const message = "Camera stream is not ready for recording.";
        setError(message);
        return Promise.reject(new Error(message));
      }

      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        const stopTimer = window.setTimeout(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }, durationMs);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onerror = () => {
          window.clearTimeout(stopTimer);
          setIsRecording(false);
          const message = "Recording failed. Please try again.";
          setError(message);
          reject(new Error(message));
        };

        recorder.onstop = () => {
          window.clearTimeout(stopTimer);
          recorderRef.current = null;
          setIsRecording(false);

          if (chunks.length === 0) {
            const message = "Recording finished without video data.";
            setError(message);
            reject(new Error(message));
            return;
          }

          const blobMimeType = recorder.mimeType || mimeType || "video/webm";
          resolve({
            blob: new Blob(chunks, { type: blobMimeType }),
            mimeType: blobMimeType,
          });
        };

        setIsRecording(true);
        recorder.start();
      });
    },
    [],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  return {
    isRecording,
    error,
    recordForDuration,
    stopRecording,
  };
}
