import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MY PROFILE</Text>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>C</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.displayName}>Camille Yao</Text>
              <Text style={styles.handle}>@camille</Text>
              <Text style={styles.bio}>Design student documenting hourly moments in Vancouver.</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{videos.length}</Text>
              <Text style={styles.statLabel}>Recaps</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>1.2k</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>318</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, styles.primaryAction]}>
              <Text style={styles.primaryActionText}>Edit Profile</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.secondaryAction]}>
              <Text style={styles.secondaryActionText}>Share</Text>
            </Pressable>
          </View>

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
                  <StickerCard key={video._id}>
                    <View style={styles.videoCard}>
                      {/* Video thumbnail / player area */}
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
                );
              })}
            </View>
          )}

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
    height: 180,
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
  }
});
