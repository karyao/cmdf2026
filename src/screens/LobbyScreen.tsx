import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { apiUrl, DEMO_USER_ID } from "../lib/api";

interface LobbyEvent {
  _id: string;
  title: string;
  city: string;
  intervalMinutes: number;
  joined: boolean;
  memberCount: number;
}

export function LobbyScreen() {
  const [events, setEvents] = useState<LobbyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/events?scope=all&userId=${DEMO_USER_ID}`), { cache: "no-store" });
      const raw = await response.text();
      let payload: any = null;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error(
          "API returned HTML instead of JSON. Run `npm run dev` and set EXPO_PUBLIC_API_BASE_URL=http://localhost:3000."
        );
      }
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load events");
      }
      setEvents(payload.events ?? []);
    } catch (loadError: any) {
      setError(loadError?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const joinedEvent = useMemo(() => events.find((event) => event.joined), [events]);
  const activeEvent = useMemo(
    () => events.find((event) => event._id === activeEventId) ?? null,
    [events, activeEventId]
  );

  const toggleMembership = useCallback(async (event: LobbyEvent) => {
    if (updatingId) return;

    setUpdatingId(event._id);
    setError(null);

    try {
      const method = event.joined ? "DELETE" : "POST";
      const response = await fetch(apiUrl(`/api/events/${event._id}/membership?userId=${DEMO_USER_ID}`), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update membership");
      }

      const updatedEvent = payload.event as LobbyEvent;
      setEvents((prev) => prev.map((item) => (item._id === updatedEvent._id ? updatedEvent : item)));
    } catch (membershipError: any) {
      setError(membershipError?.message ?? "Failed to update membership");
    } finally {
      setUpdatingId(null);
    }
  }, [updatingId]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VANCOUVER LOBBY</Text>
          </View>
          <Text style={styles.title}>Public Lobby</Text>
          <Text style={styles.subtitle}>Join themed events and meet people through prompts.</Text>

          {joinedEvent ? (
            <StickerCard>
              <Text style={styles.joinedEyebrow}>YOU JOINED THIS EVENT</Text>
              <Text style={styles.eventTitle}>{joinedEvent.title}</Text>
              <Text style={styles.meta}>{joinedEvent.city} • Every {joinedEvent.intervalMinutes} min</Text>
              <Text style={styles.joinedCopy}>Membership is synced to MongoDB for this demo user.</Text>
              <Pressable
                disabled={updatingId === joinedEvent._id}
                onPress={() => toggleMembership(joinedEvent)}
                style={[styles.button, styles.joinedButton]}
              >
                {updatingId === joinedEvent._id ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.joinedButtonText}>✓ Joined</Text>
                )}
              </Pressable>
            </StickerCard>
          ) : null}

          {loading ? <Text style={styles.stateText}>Loading events...</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && !events.length ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>No Events Yet</Text>
              <Text style={styles.noticeBody}>Create one via `POST /api/events` and it will appear here.</Text>
            </View>
          ) : null}

          {events.map((event) => (
            <StickerCard key={event._id}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.meta}>
                {event.city} • Every {event.intervalMinutes} min • {event.memberCount} joined
              </Text>
              <Pressable
                onPress={() => toggleMembership(event)}
                disabled={updatingId === event._id}
                style={[styles.button, event.joined ? styles.joinedButton : null]}
              >
                {updatingId === event._id ? (
                  <ActivityIndicator color={event.joined ? "#ffffff" : theme.colors.text} size="small" />
                ) : (
                  <Text style={event.joined ? styles.joinedButtonText : styles.buttonText}>
                    {event.joined ? "✓ Joined" : "Join Event"}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setActiveEventId(event._id)}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={styles.buttonText}>View Event</Text>
              </Pressable>
            </StickerCard>
          ))}
        </View>
      </ScrollView>

      <Modal visible={Boolean(activeEvent)} transparent animationType="fade" onRequestClose={() => setActiveEventId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {activeEvent ? (
              <>
                <Text style={styles.modalTitle}>{activeEvent.title}</Text>
                <Text style={styles.meta}>{activeEvent.city} • Every {activeEvent.intervalMinutes} min</Text>
                <Text style={styles.modalBody}>{activeEvent.memberCount} people joined this event.</Text>
                <Text style={styles.modalBody}>
                  Status: {activeEvent.joined ? "Joined" : "Not joined"}
                </Text>

                <Pressable
                  onPress={() => toggleMembership(activeEvent)}
                  disabled={updatingId === activeEvent._id}
                  style={[styles.button, activeEvent.joined ? styles.leaveButton : styles.joinedButton]}
                >
                  {updatingId === activeEvent._id ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.joinedButtonText}>{activeEvent.joined ? "Unjoin Event" : "Join Event"}</Text>
                  )}
                </Pressable>
              </>
            ) : null}
            <Pressable onPress={() => setActiveEventId(null)} style={[styles.button, styles.closeButton]}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  column: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 14
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.accent2,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedText
  },
  stateText: {
    color: theme.colors.mutedText
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600"
  },
  joinedEyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#8ed6a8",
    backgroundColor: "#ecfff3",
    fontSize: 11,
    fontWeight: "800",
    color: "#1e7b42",
    letterSpacing: 0.4
  },
  eventTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text
  },
  meta: {
    marginTop: 4,
    color: theme.colors.mutedText
  },
  joinedCopy: {
    marginTop: 10,
    color: theme.colors.text
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.md
  },
  buttonText: {
    color: theme.colors.text,
    fontWeight: "700"
  },
  joinedButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    borderColor: "#125f33"
  },
  leaveButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d14343",
    borderColor: "#7b2222"
  },
  secondaryButton: {
    backgroundColor: "#fff8c4",
    borderColor: "#8c7a18"
  },
  closeButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6e2ff",
    borderColor: "#8a83c9"
  },
  joinedButtonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(21, 18, 38, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
    padding: 16
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text
  },
  modalBody: {
    marginTop: 8,
    color: theme.colors.text
  },
  notice: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.text,
    padding: 14,
    backgroundColor: "#e9fff2"
  },
  noticeTitle: {
    fontWeight: "700",
    color: theme.colors.text
  },
  noticeBody: {
    marginTop: 4,
    color: theme.colors.mutedText
  }
});
