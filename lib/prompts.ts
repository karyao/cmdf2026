export const PROMPTS = [
  "What do you appreciate right now?",
  "What color matches your mood this hour?",
  "Show a tiny detail you normally ignore.",
  "What is giving you energy right now?",
  "Capture the vibe, not the face.",
  "What feels cozy in this moment?"
];

export function getPromptByHour(date = new Date()): string {
  return PROMPTS[date.getHours() % PROMPTS.length];
}
