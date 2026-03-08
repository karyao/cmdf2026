import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { apiUrl, DEMO_USER_ID } from "../lib/api";
import { LobbyGrid } from "../components/LobbyGrid";
import { EventMember } from "../types/domain";

interface LobbyEvent {
  _id: string;
  title: string;
  city: string;
  intervalMinutes: number;
  joined: boolean;
  memberCount: number;
  members: string[];
}

interface EventPhoto {
  _id: string;
  media_url: string;
  user_id: string | null;
  prompt: string;
  timestamp: string;
  width?: number;
  height?: number;
}

export function LobbyScreen() {
  const [events, setEvents] = useState<LobbyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Camera state
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null | undefined>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedWithFrontCamera, setCapturedWithFrontCamera] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Event photos state
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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
      if (!response.ok) throw new Error(payload?.error ?? "Unknown error");
      setEvents(payload.events ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const activeEvent = useMemo(() => events.find((e) => e._id === activeEventId) ?? null, [events, activeEventId]);

  const activeMembers: EventMember[] = useMemo(() => {
    if (!activeEvent) return [];
    const count = activeEvent.members.length;
    const dummyNames = ["Alex", "Jordan", "Morgan", "Taylor"];
    return Array.from({ length: Math.min(count, 4) }).map((_, i) => ({
      id: activeEvent.members[i] ?? `dummy-${i}`,
      displayName: activeEvent.members[i] === DEMO_USER_ID ? "You" : dummyNames[i % dummyNames.length]
    }));
  }, [activeEvent]);

  const toggleMembership = useCallback(async (event: LobbyEvent) => {
    if (updatingId) return;
    setUpdatingId(event._id);
    try {
      const endpoint = event.joined
        ? apiUrl(`/api/events/${event._id}/leave`)
        : apiUrl(`/api/events/${event._id}/join`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID })
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.error ?? `HTTP ${res.status}`);
      }
      await loadEvents();
    } catch (membershipError: any) {
      setError(membershipError?.message ?? "Failed to update membership");
    } finally {
      setUpdatingId(null);
    }
  }, [updatingId]);

  // Load event photos when opening a joined event
  const loadEventPhotos = useCallback(async (eventId: string) => {
    setLoadingPhotos(true);
    try {
      const res = await fetch(apiUrl(`/api/media?type=photo&eventId=${eventId}`));
      const data = await res.json();
      const photos = (data.media || []).filter((item: any) => {
        const url = item.media_url || "";
        return url.includes("/uploads/") || url.startsWith("data:image") || url.startsWith("http");
      });
      setEventPhotos(photos);
    } catch (err) {
      console.error("Failed to load event photos:", err);
      setEventPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  // When modal opens on a joined event, fetch photos
  useEffect(() => {
    if (activeEvent?.joined && activeEventId) {
      loadEventPhotos(activeEventId);
    } else {
      setEventPhotos([]);
    }
    // Reset camera state when modal changes
    setCapturedUri(null);
    setCapturedBase64(null);
    setDimensions(null);
  }, [activeEventId]);

  // Camera functions
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (photo) {
        setCapturedUri(photo.uri);
        setCapturedBase64(photo.base64);
        setDimensions({ width: photo.width, height: photo.height });
        setCapturedWithFrontCamera(facing === "front");
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setCapturedBase64(null);
    setDimensions(null);
    setCapturedWithFrontCamera(false);
  };

  const handleSubmit = async () => {
    if (!capturedBase64 || !activeEventId) return;
    setIsCapturing(true);
    const imageData = `data:image/jpeg;base64,${capturedBase64}`;

    try {
      const res = await fetch(apiUrl("/api/media"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          prompt: "Show your current moment.",
          event_id: activeEventId,
          userId: DEMO_USER_ID,
          width: dimensions?.width,
          height: dimensions?.height,
          useCloud: false
        })
      });

      if (res.ok) {
        await loadEventPhotos(activeEventId);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setCapturedUri(null);
      setCapturedBase64(null);
      setDimensions(null);
      setIsCapturing(false);
    }
  };

  const handleFlip = () => {
    setFacing((f) => (f === "front" ? "back" : "front"));
  };

  const closeModal = () => {
    setActiveEventId(null);
  };

  const joinedEvent = events.find((e) => e.joined);

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
              <Text style={styles.noticeBody}>Create one via POST /api/events and it will appear here.</Text>
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

      <Modal 
        visible={Boolean(activeEvent)} 
        transparent 
        animationType="fade" 
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {activeEvent ? (
              <>
                <Text style={styles.modalTitle}>{activeEvent.title}</Text>
                <Text style={styles.meta}>{activeEvent.city} • Every {activeEvent.intervalMinutes} min</Text>

                {loadingPhotos ? (
                  <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.text} />
                ) : (
                  <View style={styles.gridWrapper}>
                    <LobbyGrid
                      members={activeMembers}
                      containerHeight={320}
                      isJoined={activeEvent.joined}
                      currentUserId={DEMO_USER_ID}
                      eventPhotos={eventPhotos}
                      cameraRef={cameraRef}
                      capturedUri={capturedUri}
                      capturedWithFrontCamera={capturedWithFrontCamera}
                      isCapturing={isCapturing}
                      cameraPermission={permission}
                      facing={facing}
                      onRequestPermission={requestPermission}
                      onCapture={handleCapture}
                      onRetake={handleRetake}
                      onSubmit={handleSubmit}
                      onFlip={handleFlip}
                    />
                  </View>
                )}

                <Text style={styles.modalBody}>{activeEvent.memberCount} people joined this event.</Text>

                {activeEvent.joined ? (
                  <Pressable
                    onPress={() => toggleMembership(activeEvent)}
                    disabled={updatingId === activeEvent._id}
                    style={[styles.button, styles.leaveButton]}
                  >
                    {updatingId === activeEvent._id ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.joinedButtonText}>Unjoin Event</Text>
                    )}
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => toggleMembership(activeEvent)}
                    disabled={updatingId === activeEvent._id}
                    style={[styles.button, styles.joinedButton]}
                  >
                    {updatingId === activeEvent._id ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.joinedButtonText}>Join Event</Text>
                    )}
                  </Pressable>
                )}
              </>
            ) : null}
            <Pressable onPress={closeModal} style={[styles.button, styles.closeButton]}>
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
  },
  gridWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
});
