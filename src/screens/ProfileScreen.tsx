import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { apiUrl, DEMO_USER_ID } from "../lib/api";

const highlights = ["Trips", "Study", "Food", "Friends"];

interface RecapVideo {
  _id: string;
  video_url: string;
  title: string;
  duration_seconds: number;
  photo_count: number;
  participants: string[];
  event_title: string;
  event_city: string;
  createdAt: string;
}

export function ProfileScreen() {
  const [videos, setVideos] = useState<RecapVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<RecapVideo | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  // User profile state
  const [userName, setUserName] = useState("Camille Yao");
  const [userBio, setUserBio] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/user?userId=${DEMO_USER_ID}`));
      const data = await res.json();
      if (data.user) {
        setUserName(data.user.name || "Camille Yao");
        setUserBio(data.user.bio || "");
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/videos?userId=${DEMO_USER_ID}`));
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [photosRes, eventsRes] = await Promise.all([
        fetch(apiUrl(`/api/media?type=photo&userId=${DEMO_USER_ID}`)),
        fetch(apiUrl(`/api/events?scope=all&userId=${DEMO_USER_ID}`)),
      ]);
      const photosData = await photosRes.json();
      const eventsData = await eventsRes.json();
      setPhotoCount(photosData.media?.length ?? 0);
      const joined = (eventsData.events || []).filter((e: any) => e.joined);
      setEventCount(joined.length);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/user"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID, name: editName, bio: editBio }),
      });
      const data = await res.json();
      if (data.user) {
        setUserName(data.user.name);
        setUserBio(data.user.bio);
      }
      setEditModalVisible(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(userName);
    setEditBio(userBio);
    setEditModalVisible(true);
  };

  const handleDeleteVideo = async () => {
    if (!playingVideo) return;
    try {
      const res = await fetch(apiUrl(`/api/videos?id=${playingVideo._id}`), {
        method: "DELETE"
      });
      if (res.ok) {
        setPlayingVideo(null);
        fetchVideos();
      }
    } catch (error) {
      console.error("Failed to delete video", error);
    }
  };

  // Video player configuration for cross-platform playback
  const player = useVideoPlayer(playingVideo?.video_url || null, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    fetchUser();
    fetchVideos();
    fetchStats();
  }, [fetchUser, fetchVideos, fetchStats]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MY PROFILE</Text>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.displayName}>{userName}</Text>
              <Text style={styles.handle}>@{userName.toLowerCase().replace(/\s+/g, "")}</Text>
              {userBio ? <Text style={styles.bio}>{userBio}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{eventCount}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{photoCount}</Text>
              <Text style={styles.statLabel}>Media</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={openEditModal}>
              <Text style={styles.primaryActionText}>Edit Profile</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.secondaryAction]}>
              <Text style={styles.secondaryActionText}>Share</Text>
            </Pressable>
          </View>

          {/* Edit Profile Modal */}
          <Modal
            visible={editModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.editOverlay}>
              <View style={styles.editCard}>
                <Text style={styles.editTitle}>Edit Profile</Text>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor="#999"
                />
                <Text style={styles.editLabel}>Bio</Text>
                <TextInput
                  style={[styles.editInput, styles.editBioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#999"
                  multiline
                />
                <View style={styles.editActions}>
                  <Pressable style={styles.editCancel} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.editSave} onPress={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.editSaveText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Highlights</Text>
          </View>
          <View style={styles.highlightRow}>
            {highlights.map((item) => (
              <View key={item} style={styles.highlightItem}>
                <View style={styles.highlightCircle}>
                  <Text style={styles.highlightLetter}>{item.slice(0, 1)}</Text>
                </View>
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recap Videos</Text>
          </View>

          {loadingVideos ? (
            <ActivityIndicator color={theme.colors.text} style={{ marginTop: 16 }} />
          ) : videos.length === 0 ? (
            <StickerCard>
              <Text style={styles.emptyTitle}>No recaps yet</Text>
              <Text style={styles.emptyBody}>Join an event, take photos, and generate a recap video from the Lobby!</Text>
            </StickerCard>
          ) : (
            <View style={styles.videoGrid}>
              {videos.map((video) => {
                const date = new Date(video.createdAt);
                const dateStr = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const timeStr = date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <Pressable key={video._id} onPress={() => setPlayingVideo(video)}>
                    <StickerCard>
                      <View style={styles.videoCard}>
                        <View style={styles.videoPreview}>
                          <Text style={styles.videoPlayIcon}>▶</Text>
                          <Text style={styles.videoDuration}>
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, "0")}
                          </Text>
                        </View>
                        <Text style={styles.videoTitle}>{video.title}</Text>
                        <Text style={styles.videoMeta}>
                          {video.event_city} • {dateStr} at {timeStr}
                        </Text>
                        <View style={styles.videoStats}>
                          <View style={styles.videoStatPill}>
                            <Text style={styles.videoStatText}>📸 {video.photo_count} photos</Text>
                          </View>
                          <View style={styles.videoStatPill}>
                            <Text style={styles.videoStatText}>👥 {video.participants.length}</Text>
                          </View>
                        </View>
                      </View>
                    </StickerCard>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Video Player Modal */}
          <Modal
            visible={Boolean(playingVideo)}
            transparent
            animationType="fade"
            onRequestClose={() => setPlayingVideo(null)}
          >
            <View style={styles.videoModalOverlay}>
              <View style={styles.videoModalCard}>
                {playingVideo ? (
                  <VideoView
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                    style={{
                      width: "100%",
                      aspectRatio: 9 / 16,
                      maxHeight: "75%",
                      borderRadius: 16,
                      backgroundColor: "#000",
                    }}
                  />
                ) : null}
                <Text style={styles.videoModalTitle}>{playingVideo?.title}</Text>
                <Text style={styles.videoModalMeta}>{playingVideo?.event_city} • {playingVideo?.photo_count} photos</Text>
                
                <View style={styles.videoModalActions}>
                  <Pressable onPress={() => setPlayingVideo(null)} style={styles.videoModalClose}>
                    <Text style={styles.videoModalActionText}>Close</Text>
                  </Pressable>
                  <Pressable onPress={handleDeleteVideo} style={styles.videoModalDelete}>
                    <Text style={[styles.videoModalActionText, { color: "#ef4444" }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.list}>
            <Pressable style={styles.item}>
              <Text style={styles.itemTitle}>Notification cadence</Text>
              <Text style={styles.itemMeta}>5m before, open, 2m left</Text>
            </Pressable>
            <Pressable style={styles.item}>
              <Text style={styles.itemTitle}>Sensitive mode default</Text>
              <Text style={styles.itemMeta}>Off</Text>
            </Pressable>
            <Pressable style={styles.item}>
              <Text style={styles.itemTitle}>Blocked users</Text>
              <Text style={styles.itemMeta}>0</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    gap: 12
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.popYellow,
    borderWidth: 2,
    borderColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  profileHeader: {
    marginTop: 2,
    flexDirection: "row",
    gap: 12
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.popYellow,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text
  },
  headerMeta: {
    flex: 1,
    paddingTop: 2
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text
  },
  handle: {
    marginTop: 1,
    color: theme.colors.primary,
    fontWeight: "700"
  },
  bio: {
    marginTop: 6,
    color: theme.colors.mutedText
  },
  statsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8
  },
  statPill: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: "#fffdf7",
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center"
  },
  statNum: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    color: theme.colors.mutedText
  },
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  actionButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center"
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.text
  },
  secondaryAction: {
    backgroundColor: "#fff3b7",
    borderColor: "#8f7a1f"
  },
  primaryActionText: {
    color: theme.colors.text,
    fontWeight: "800"
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontWeight: "800"
  },
  sectionHead: {
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text
  },
  highlightRow: {
    flexDirection: "row",
    gap: 12
  },
  highlightItem: {
    alignItems: "center",
    width: 58
  },
  highlightCircle: {
    width: 50,
    height: 50,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  highlightLetter: {
    fontWeight: "700",
    color: theme.colors.text
  },
  highlightText: {
    marginTop: 4,
    fontSize: 11,
    color: theme.colors.mutedText
  },
  // Video grid styles
  videoGrid: {
    gap: 12,
  },
  videoCard: {
    gap: 8,
  },
  videoPreview: {
    width: "100%",
    height: 280,
    borderRadius: theme.radius.lg,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  videoPlayIcon: {
    fontSize: 40,
    color: "rgba(255,255,255,0.9)",
  },
  videoDuration: {
    position: "absolute",
    bottom: 8,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  videoMeta: {
    fontSize: 13,
    color: theme.colors.mutedText,
  },
  videoStats: {
    flexDirection: "row",
    gap: 8,
  },
  videoStatPill: {
    backgroundColor: "#f0edff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  videoStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
  },
  // Empty state
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyBody: {
    marginTop: 4,
    color: theme.colors.mutedText,
  },
  // Settings
  list: {
    marginTop: 12,
    gap: 10
  },
  item: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14
  },
  itemTitle: {
    fontWeight: "700",
    color: theme.colors.text
  },
  itemMeta: {
    marginTop: 4,
    color: theme.colors.mutedText
  },
  // Video Player Modal
  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  videoModalCard: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
    gap: 12,
  },
  videoModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  videoModalMeta: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  videoModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  videoModalClose: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  videoModalDelete: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  videoModalActionText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  // Edit Profile Modal
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  editCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.text,
    padding: 24,
    gap: 12,
  },
  editTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.mutedText,
    marginTop: 4,
  },
  editInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: "#fafafa",
  },
  editBioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  editCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  editCancelText: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  editSave: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  editSaveText: {
    fontWeight: "700",
    color: theme.colors.text,
  },
});
