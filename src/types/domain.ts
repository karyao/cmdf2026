export type EventType = "private" | "public";
export type SlotStatus = "scheduled" | "window_open" | "submitted" | "skipped_private" | "missed_late";
export type PromptType = "default" | "creative_hint";

export interface EventMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface PromptSlot {
  id: string;
  timestamp: string;
  status: SlotStatus;
  promptText: string;
  promptType: PromptType;
  imageUrl?: string;
  capturedWithFrontCamera?: boolean;
  gifUrl?: string;
  isLate?: boolean;
  isPrivate?: boolean;
}

export interface EventSummary {
  streak: number;
  onTimeRate: number;
  topHour: string;
}

export interface SocialEvent {
  id: string;
  title: string;
  type: EventType;
  city: string;
  intervalMinutes: number;
  members: EventMember[];
  slots: PromptSlot[];
  summary?: EventSummary;
}
