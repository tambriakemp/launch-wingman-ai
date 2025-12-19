import { useState, useEffect, useRef } from "react";

/**
 * A hook that provides local state for inputs to prevent cursor jumping issues.
 * Updates to parent are debounced, while local typing remains immediate.
 * 
 * @param externalValue - The value from parent state
 * @param onChange - Callback to update parent state (debounced)
 * @param delay - Debounce delay in milliseconds (default: 300)
 */
export const useDebouncedInput = (
  externalValue: string,
  onChange: (value: string) => void,
  delay: number = 300
) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const isInternalChange = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value when external value changes (but not from our own updates)
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(externalValue);
    }
    isInternalChange.current = false;
  }, [externalValue]);

  // Debounced update to parent
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only update parent if local value differs from external
    if (localValue !== externalValue) {
      timeoutRef.current = setTimeout(() => {
        isInternalChange.current = true;
        onChange(localValue);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, externalValue, onChange, delay]);

  return [localValue, setLocalValue] as const;
};
