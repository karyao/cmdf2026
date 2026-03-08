import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { useEventStore } from "../store/useEventStore";
import { AvatarStack } from "../components/AvatarStack";
import { DEMO_USER_ID, apiUrl } from "../lib/api";

const LEGACY_DEFAULT_PROMPT = "Show your current moment.";

export function TimelineScreen() {
  const { activeEvent } = useEventStore();
  const [photos, setPhotos] = useState<any[]>([]);

  const pendingSlots = useMemo(
    () => activeEvent.slots.filter((slot) => slot.status !== "submitted"),
    [activeEvent.slots]
  );

  const fetchPhotos = async () => {
    try {
      const url = apiUrl(`/api/media?type=photo&userId=${DEMO_USER_ID}`);
      const res = await fetch(url);
      const data = await res.json();

      const filtered = (data.media || []).filter((item: any) => {
        const mediaUrl = item.media_url || "";
        return (mediaUrl.includes("/uploads/") || mediaUrl.startsWith("data:image")) && mediaUrl.length > 10;
      });

      setPhotos(filtered);
    } catch (err) {
      console.error("Failed to fetch photos:", err);
    }
  };

  useEffect(() => {
    void fetchPhotos();
    const interval = setInterval(() => {
      void fetchPhotos();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAll = async () => {
    try {
      const res = await fetch(apiUrl(`/api/media?userId=${DEMO_USER_ID}`), {
        method: "DELETE"
      });
      if (res.ok) {
        setPhotos([]);
      }
    } catch (err) {
      console.error("Failed to delete photos:", err);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>DAY STRIP</Text>
            </View>
            <Text style={styles.title}>{activeEvent.title}</Text>
            <Text style={styles.subtitle}>Day in the Life • {activeEvent.city}</Text>
            <AvatarStack members={activeEvent.members} />
          </View>

          {photos.map((photo, index) => (
            <View key={photo._id} style={styles.timelineRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.slotTime}>
                  {new Date(photo.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </Text>
                <View style={styles.node} />
                {index !== photos.length - 1 || pendingSlots.length > 0 ? <View style={styles.connector} /> : null}
              </View>
              <View style={styles.entryBody}>
                <StickerCard>
                  <Text style={styles.prompt}>
                    {photo.caption?.trim() ||
                      (photo.prompt === LEGACY_DEFAULT_PROMPT ? "" : photo.prompt) ||
                      "Photo Upload"}
                  </Text>
                  <Image source={{ uri: photo.media_url }} style={[styles.photo, styles.unmirror]} resizeMode="cover" />
                  <Text style={styles.meta}>Status: submitted</Text>
                </StickerCard>
              </View>
            </View>
          ))}

          {pendingSlots.map((slot, index) => (
            <View key={slot.id} style={styles.timelineRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.slotTime}>
                  {new Date(slot.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </Text>
                <View style={styles.node} />
                {index !== pendingSlots.length - 1 ? <View style={styles.connector} /> : null}
              </View>
              <View style={styles.entryBody}>
                <StickerCard>
                  {slot.promptText && slot.promptText !== LEGACY_DEFAULT_PROMPT ? (
                    <Text style={styles.prompt}>{slot.promptText}</Text>
                  ) : null}
                  <Text style={styles.meta}>
                    Status: {slot.status} {slot.promptType === "creative_hint" ? "• Creative Hint" : ""}
                  </Text>
                </StickerCard>
              </View>
            </View>
          ))}

          {photos.length > 0 ? (
            <Pressable onPress={handleDeleteAll} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete All Entries</Text>
            </Pressable>
          ) : null}
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
    gap: 14
  },
  header: {
    gap: 6,
    marginBottom: 8
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
    letterSpacing: 0.7
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.mutedText
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  timeColumn: {
    width: 78,
    alignItems: "flex-end",
    position: "relative",
    paddingTop: 2,
    paddingBottom: 8,
    paddingRight: 10
  },
  slotTime: {
    fontSize: 11,
    color: theme.colors.mutedText,
    fontWeight: "700",
    marginBottom: 8
  },
  node: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface
  },
  connector: {
    position: "absolute",
    right: 13,
    top: 30,
    bottom: -12,
    width: 2,
    backgroundColor: theme.colors.border
  },
  entryBody: {
    flex: 1
  },
  prompt: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text
  },
  photo: {
    marginTop: 12,
    width: "100%",
    minHeight: 300,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    borderWidth: 2,
    backgroundColor: theme.colors.surface
  },
  unmirror: {
    transform: [{ scaleX: -1 }]
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.mutedText,
    backgroundColor: "#f2e9d8",
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  deleteButton: {
    marginTop: 28,
    marginBottom: 50,
    backgroundColor: "#edd8cf",
    padding: 14,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#b9856b"
  },
  deleteButtonText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 15
  }
});
