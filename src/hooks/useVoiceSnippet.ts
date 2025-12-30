import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseVoiceSnippetOptions {
  taskId: string;
  script: string;
}

interface UseVoiceSnippetReturn {
  isLoading: boolean;
  isPlaying: boolean;
  play: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

// In-memory cache for generated audio per session
const audioCache = new Map<string, string>();

export function useVoiceSnippet({ taskId, script }: UseVoiceSnippetOptions): UseVoiceSnippetReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(async () => {
    // If already playing, stop
    if (isPlaying && audioRef.current) {
      stop();
      return;
    }

    setError(null);

    // Check cache first
    const cachedUrl = audioCache.get(taskId);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setError("Failed to play audio");
        setIsPlaying(false);
      };
      
      await audio.play();
      setIsPlaying(true);
      return;
    }

    // Generate new audio
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: script }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL
      audioCache.set(taskId, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setError("Failed to play audio");
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate audio";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, script, isPlaying, stop]);

  return {
    isLoading,
    isPlaying,
    play,
    stop,
    error,
  };
}
