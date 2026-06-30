/** Nexa response / thinking modes shown in chat (values map to max_tokens). */
export const THINKING_MODES = [
  { value: "auto", label: "Auto" },
  { value: 768, label: "Fast" },
  { value: 1536, label: "Thinker" },
  { value: 2048, label: "Deep Thinker" },
] as const;

export const RESPONSE_LENGTH_OPTIONS = THINKING_MODES;
