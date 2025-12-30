import { VOICE_SCRIPTS } from "@/data/voiceScripts";

/**
 * Generates a natural voice script for a given task.
 * Uses custom scripts for priority tasks, or generates a fallback from task data.
 */
export function generateVoiceScript(
  taskId: string,
  whyItMatters?: string,
  instructions?: string
): string | null {
  // Check for custom script first
  if (VOICE_SCRIPTS[taskId]) {
    return VOICE_SCRIPTS[taskId];
  }

  // Generate fallback from task data if we have meaningful content
  if (!whyItMatters || typeof whyItMatters !== 'string' || whyItMatters.length < 50) {
    return null;
  }

  // Clean up the whyItMatters text for voice reading
  let script = whyItMatters
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    // Remove bullet points and make more conversational
    .replace(/^[-•]\s*/gm, "")
    // Clean up extra whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Add a gentle intro if the text doesn't start conversationally
  const conversationalStarters = ["this", "your", "when", "the", "a", "an", "before", "after", "here", "now"];
  const firstWord = script.split(" ")[0]?.toLowerCase();
  
  if (firstWord && !conversationalStarters.includes(firstWord)) {
    script = "Here's why this matters. " + script;
  }

  // Keep scripts concise - aim for 30-45 seconds of audio (roughly 100-150 words)
  const words = script.split(" ");
  if (words.length > 150) {
    script = words.slice(0, 150).join(" ");
    // Try to end at a sentence
    const lastSentenceEnd = script.lastIndexOf(".");
    if (lastSentenceEnd > script.length * 0.7) {
      script = script.substring(0, lastSentenceEnd + 1);
    }
  }

  return script;
}

/**
 * Checks if a task has voice snippet support
 */
export function hasVoiceSnippetSupport(taskId: string, whyItMatters?: string): boolean {
  if (VOICE_SCRIPTS[taskId]) {
    return true;
  }
  return Boolean(whyItMatters && whyItMatters.length >= 50);
}
