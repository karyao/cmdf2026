import { create } from "zustand";
import { CREATIVE_HINTS } from "../constants/creativeHints";
import { PromptSlot, SlotStatus, SocialEvent } from "../types/domain";

interface EventState {
  activeEvent: SocialEvent;
  windowClosesAt?: string;
  openCaptureWindow: (timestamp: string, windowMinutes: number) => void;
  markSlot: (slotId: string, status: SlotStatus, imageUrl?: string, capturedWithFrontCamera?: boolean) => void;
  applyAntiRepetitionPrompt: (slotId: string) => void;
}

const now = new Date();
const seedSlots: PromptSlot[] = Array.from({ length: 8 }).map((_, i) => {
  const timestamp = new Date(now.getTime() - (7 - i) * 60 * 60 * 1000).toISOString();
  return {
    id: `slot-${i + 1}`,
    timestamp,
    status: i === 7 ? "window_open" : "scheduled",
    promptText: "",
    promptType: "default"
  };
});

const seedEvent: SocialEvent = {
  id: "000000000000000000000009",
  title: "Day Strip",
  type: "public",
  city: "Vancouver",
  intervalMinutes: 60,
  members: [
    { id: "u1", displayName: "Camille" },
    { id: "u2", displayName: "Emily" },
    { id: "u3", displayName: "Karen" }
  ],
  slots: seedSlots
};

export const useEventStore = create<EventState>((set) => ({
  activeEvent: seedEvent,
  windowClosesAt: undefined,
  openCaptureWindow: (timestamp, windowMinutes) => {
    const closesAt = new Date(new Date(timestamp).getTime() + windowMinutes * 60 * 1000).toISOString();
    set((state) => ({
      windowClosesAt: closesAt,
      activeEvent: {
        ...state.activeEvent,
        slots: state.activeEvent.slots.map((slot) =>
          slot.timestamp === timestamp ? { ...slot, status: "window_open" } : slot
        )
      }
    }));
  },
  markSlot: (slotId, status, imageUrl, capturedWithFrontCamera) => {
    set((state) => ({
      activeEvent: {
        ...state.activeEvent,
        slots: state.activeEvent.slots.map((slot) =>
          slot.id === slotId ? { ...slot, status, imageUrl, capturedWithFrontCamera } : slot
        )
      }
    }));
  },
  applyAntiRepetitionPrompt: (slotId) => {
    const prompt = CREATIVE_HINTS[Math.floor(Math.random() * CREATIVE_HINTS.length)];
    set((state) => ({
      activeEvent: {
        ...state.activeEvent,
        slots: state.activeEvent.slots.map((slot) =>
          slot.id === slotId ? { ...slot, promptType: "creative_hint", promptText: prompt } : slot
        )
      }
    }));
  }
}));
