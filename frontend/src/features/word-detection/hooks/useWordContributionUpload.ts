"use client";

import { useCallback, useState } from "react";
import {
  submitWdRecording,
  type WdContributionUploadResponse,
} from "@/features/word-detection/api/practiceRecordings";

type UploadContributionInput = {
  video: Blob;
  lessonId: number;
  word: string;
  predictedLabel: string;
  confidence: number;
};

export function useWordContributionUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadContribution = useCallback(
    async (input: UploadContributionInput): Promise<WdContributionUploadResponse> => {
      setIsUploading(true);
      setError(null);
      try {
        return await submitWdRecording(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return {
    isUploading,
    error,
    uploadContribution,
  };
}
