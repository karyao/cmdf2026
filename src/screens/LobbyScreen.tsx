import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  type: "public" | "private";
  city: string;
  intervalMinutes: number;
  maxPeople?: number;
  startTime?: string;
  prompts?: string[];
  joinCode?: string;
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

  // Create Event State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"public" | "private">("public");
  const [newEventMaxPeople, setNewEventMaxPeople] = useState("4");
  const [newEventInterval, setNewEventInterval] = useState("60");
  const [newEventPrompts, setNewEventPrompts] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Join Event State
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoiningWithCode, setIsJoiningWithCode] = useState(false);

  // Camera state
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null | undefined>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedWithFrontCamera, setCapturedWithFrontCamera] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [description, setDescription] = useState("");

  // Event photos state
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Video generation state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);

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

  // Calculate the current active prompt based on time elapsed
  const currentPrompt = useMemo(() => {
    if (!activeEvent || !activeEvent.prompts || activeEvent.prompts.length === 0) return null;
    
    // If there is no start time, just use the first prompt
    if (!activeEvent.startTime) return activeEvent.prompts[0];

    const startMs = new Date(activeEvent.startTime).getTime();
    const nowMs = Date.now();
    
    // If event hasn't started yet, use first prompt
    if (nowMs < startMs) return activeEvent.prompts[0];

    const intervalMs = activeEvent.intervalMinutes * 60 * 1000;
    const elapsedIntervals = Math.floor((nowMs - startMs) / intervalMs);
    
    // Use modulo to cycle through prompts if we exceed the length
    const promptIndex = elapsedIntervals % activeEvent.prompts.length;
    return activeEvent.prompts[promptIndex];
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
  }, [updatingId, loadEvents]);

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      let startTime = undefined;
      if (newEventStartTime) {
        // Simple HH:MM today approach
        const date = new Date();
        const [hours, minutes] = newEventStartTime.split(':');
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        startTime = date.toISOString();
      }

      const res = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          title: newEventTitle.trim(),
          type: newEventType,
          maxPeople: parseInt(newEventMaxPeople, 10) || 10,
          intervalMinutes: parseInt(newEventInterval, 10) || 60,
          prompts: newEventPrompts.split(',').map(p => p.trim()).filter(Boolean),
          startTime
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to create event");
      }
      setCreateModalVisible(false);
      // Reset form
      setNewEventTitle("");
      setNewEventMaxPeople("4");
      setNewEventInterval("60");
      setNewEventPrompts("");
      setNewEventStartTime("");
      await loadEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCodeInput.trim()) return;
    setIsJoiningWithCode(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/events/join-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          joinCode: joinCodeInput.trim()
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to join event with code");
      }
      setJoinModalVisible(false);
      setJoinCodeInput("");
      await loadEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoiningWithCode(false);
    }
  };

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
    setDescription("");
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
    setDescription("");
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
          prompt: currentPrompt || "",
          caption: description.trim(),
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
      setDescription("");
      setIsCapturing(false);
    }
  };

  const handleFlip = () => {
    setFacing((f) => (f === "front" ? "back" : "front"));
  };

  const closeModal = () => {
    setActiveEventId(null);
    setVideoMessage(null);
  };

  const handleGenerateRecap = async () => {
    if (!activeEventId || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setVideoMessage(null);
    try {
      const res = await fetch(apiUrl("/api/videos/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEventId, userId: DEMO_USER_ID }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideoMessage(`✅ Recap video created! Check your Profile tab.`);
      } else {
        setVideoMessage(`❌ ${data.error || "Failed to generate video"}`);
      }
    } catch (err) {
      setVideoMessage("❌ Network error while generating video");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const joinedEvent = events.find((e) => e.joined);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VANCOUVER LOBBY</Text>
          </View>
          <Text style={styles.title}>Events Lobby</Text>
          <Text style={styles.subtitle}>Create your own events or join others via code to meet people through prompts.</Text>

          <View style={styles.headerActions}>
            <Pressable onPress={() => setCreateModalVisible(true)} style={[styles.button, styles.actionButton, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>+ Create Event</Text>
            </Pressable>
            <Pressable onPress={() => setJoinModalVisible(true)} style={[styles.button, styles.actionButton]}>
              <Text style={styles.buttonText}>Join via Code</Text>
            </Pressable>
          </View>

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
              {event.type === "private" && (
                <View style={styles.privateBadgeWrap}>
                  <View style={styles.privateBadge}><Text style={styles.privateBadgeText}>PRIVATE</Text></View>
                  {event.joinCode && <Text style={styles.codeText}>Code: {event.joinCode}</Text>}
                </View>
              )}
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.meta}>
                {event.city ? `${event.city} • ` : ''}Every {event.intervalMinutes} min
              </Text>
              <Text style={styles.meta}>
                {event.memberCount}{event.maxPeople ? ` / ${event.maxPeople}` : ''} joined
                {event.startTime && ` • Starts: ${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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
              <View style={styles.modalLayout}>
                <ScrollView
                  style={styles.modalMain}
                  contentContainerStyle={styles.modalMainContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalTitle}>{activeEvent.title}</Text>
                  <Text style={styles.meta}>{activeEvent.city} • Every {activeEvent.intervalMinutes} min</Text>

                  {loadingPhotos ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.text} />
                  ) : (
                    <View style={styles.gridWrapper}>
                      <LobbyGrid
                        members={activeMembers}
                        containerHeight={520}
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
                        onFlip={handleFlip}
                      />
                    </View>
                  )}

                  <Text style={styles.modalBody}>
                    <Text style={{fontWeight:'700'}}>{activeEvent.memberCount}{activeEvent.maxPeople ? ` / ${activeEvent.maxPeople}` : ''}</Text> people joined this event.
                  </Text>
                  
                  {activeEvent.startTime && (
                    <Text style={[styles.meta, {marginTop: 6}]}>
                      Starts at {new Date(activeEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}

                  {currentPrompt && (
                    <View style={{marginTop: 12}}>
                      <Text style={[styles.captionLabel, {marginBottom: 4}]}>Current Prompt</Text>
                      <View style={styles.promptBadge}>
                        <Text style={styles.promptBadgeText}>"{currentPrompt}"</Text>
                      </View>
                    </View>
                  )}
                  
                  {videoMessage ? (
                    <Text style={styles.videoMessage}>{videoMessage}</Text>
                  ) : null}
                </ScrollView>

                <View style={styles.actionRail}>
                  {activeEvent.joined ? (
                    <View style={styles.captionWrap}>
                      <Text style={styles.captionLabel}>Description</Text>
                      <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What is happening in this moment?"
                        placeholderTextColor="#8b8aa5"
                        style={styles.captionInput}
                        multiline
                        maxLength={180}
                      />
                      <Text style={styles.captionHint}>
                        Appears in the timeline after submit.
                      </Text>
                      {capturedUri ? (
                        <Pressable
                          onPress={handleSubmit}
                          disabled={isCapturing}
                          style={[styles.button, styles.railButton, styles.submitPhotoButton]}
                        >
                          {isCapturing ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <Text style={styles.joinedButtonText}>Submit Photo</Text>
                          )}
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}

                  {activeEvent.joined && (
                    <Pressable
                      onPress={handleGenerateRecap}
                      disabled={isGeneratingVideo}
                      style={[styles.button, styles.railButton, styles.recapButton]}
                    >
                      <Text style={styles.recapButtonText}>
                        {isGeneratingVideo ? "Rendering..." : "Generate Recap"}
                      </Text>
                    </Pressable>
                  )}

                  {activeEvent.joined ? (
                    <Pressable
                      onPress={() => toggleMembership(activeEvent)}
                      disabled={updatingId === activeEvent._id}
                      style={[styles.button, styles.railButton, styles.leaveButton]}
                    >
                      {updatingId === activeEvent._id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.joinedButtonText}>Unjoin</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => toggleMembership(activeEvent)}
                      disabled={updatingId === activeEvent._id}
                      style={[styles.button, styles.railButton, styles.joinedButton]}
                    >
                      {updatingId === activeEvent._id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.joinedButtonText}>Join</Text>
                      )}
                    </Pressable>
                  )}

                  <Pressable onPress={closeModal} style={[styles.button, styles.railButton, styles.closeButton]}>
                    <Text style={styles.buttonText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
             <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              
              <Text style={styles.inputLabel}>Event Title</Text>
              <TextInput style={styles.textInput} value={newEventTitle} onChangeText={setNewEventTitle} placeholder="E.g. Sunrise Hike" placeholderTextColor={theme.colors.mutedText} />

              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.segmentedControl}>
                <Pressable onPress={() => setNewEventType("public")} style={[styles.segmentButton, newEventType === "public" && styles.segmentActive]}>
                  <Text style={[styles.segmentText, newEventType === "public" && styles.segmentTextActive]}>Public</Text>
                </Pressable>
                <Pressable onPress={() => setNewEventType("private")} style={[styles.segmentButton, newEventType === "private" && styles.segmentActive]}>
                  <Text style={[styles.segmentText, newEventType === "private" && styles.segmentTextActive]}>Private</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Max People</Text>
              <TextInput style={styles.textInput} value={newEventMaxPeople} onChangeText={setNewEventMaxPeople} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Interval (minutes)</Text>
              <TextInput style={styles.textInput} value={newEventInterval} onChangeText={setNewEventInterval} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Start Time (HH:MM) Optional</Text>
              <TextInput style={styles.textInput} value={newEventStartTime} onChangeText={setNewEventStartTime} placeholder="14:00" placeholderTextColor={theme.colors.mutedText} />

              <Text style={styles.inputLabel}>Prompts (comma separated)</Text>
              <TextInput style={styles.textInput} value={newEventPrompts} onChangeText={setNewEventPrompts} placeholder="Take a selfie, Find a dog" placeholderTextColor={theme.colors.mutedText} />

              <View style={[styles.headerActions, { marginTop: 24, paddingBottom: 24 }]}>
                <Pressable onPress={() => setCreateModalVisible(false)} style={[styles.button, styles.actionButton]}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleCreateEvent} disabled={isCreating} style={[styles.button, styles.actionButton, styles.primaryButton]}>
                  {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Create</Text>}
                </Pressable>
              </View>
             </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Join Code Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade" onRequestClose={() => setJoinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join Event</Text>
            <Text style={styles.inputLabel}>Enter 6-digit Join Code</Text>
            <TextInput 
              style={[styles.textInput, { textAlign: 'center', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase' }]} 
              value={joinCodeInput} 
              onChangeText={setJoinCodeInput} 
              placeholder="XXXXXX" 
              placeholderTextColor={theme.colors.mutedText}
              maxLength={6}
              autoCapitalize="characters"
            />
            
            <View style={[styles.headerActions, { marginTop: 24 }]}>
              <Pressable onPress={() => setJoinModalVisible(false)} style={[styles.button, styles.actionButton]}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleJoinWithCode} disabled={isJoiningWithCode} style={[styles.button, styles.actionButton, styles.primaryButton]}>
                {isJoiningWithCode ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Join</Text>}
              </Pressable>
            </View>
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
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md
  },
  buttonText: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 13
  },
  joinedButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#86efac"
  },
  leaveButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5"
  },
  secondaryButton: {
    backgroundColor: "#dbeafe",
    borderColor: "#cbd5e1"
  },
  closeButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2f7",
    borderColor: "#cbd5e1"
  },
  joinedButtonText: {
    color: "#14532d",
    fontWeight: "800",
    fontSize: 13
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
    maxHeight: "92%",
    alignSelf: "center",
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
    padding: 16
  },
  modalLayout: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  modalMain: {
    flex: 1,
    minWidth: 0
  },
  modalMainContent: {
    paddingBottom: 4
  },
  actionRail: {
    width: 132,
    marginLeft: 10,
    gap: 8
  },
  railButton: {
    marginTop: 0,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8
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
  captionWrap: {
    marginTop: 0,
    gap: 6
  },
  captionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text
  },
  captionInput: {
    minHeight: 74,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: "#fff",
    color: theme.colors.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    textAlignVertical: "top"
  },
  captionHint: {
    fontSize: 12,
    color: theme.colors.mutedText
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
  promptBadge: {
    backgroundColor: theme.colors.popYellow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#e8cd7b'
  },
  promptBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8b701c',
  },
  gridWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  recapButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
  },
  recapButtonText: {
    color: "#1e3a8a",
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center"
  },
  videoMessage: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  submitPhotoButton: {
    marginTop: 6,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#86efac"
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8
  },
  actionButton: {
    marginTop: 0,
    flex: 1,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: "#e88bb0"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13
  },
  inputLabel: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: "#fff",
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden"
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: theme.colors.accent2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.mutedText
  },
  segmentTextActive: {
    color: "#1e7b42"
  },
  privateBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8
  },
  privateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  codeText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 1
  }
});
