import { useState, useCallback } from 'react';

export function useAnalysis() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async ({ file, testImage, blockSize, zThreshold, topK, varianceThreshold }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (testImage) {
        formData.append('test_image', testImage);
      }
      formData.append('block_size', blockSize);
      formData.append('z_threshold', zThreshold);
      formData.append('top_k', topK);
      formData.append('variance_threshold', varianceThreshold);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Analysis failed (${res.status})`);
      }

      const data = await res.json();
      setResults(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, loading, error, analyze, reset };
}
