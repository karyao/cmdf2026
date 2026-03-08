import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { useEventStore } from "../store/useEventStore";
import { AvatarStack } from "../components/AvatarStack";
import { DEMO_USER_ID, apiUrl } from "../lib/api";

export function TimelineScreen() {
  const { activeEvent } = useEventStore();
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchPhotos = async () => { // Moved fetchPhotos outside useEffect
    try {
      const url = apiUrl(`/api/media?type=photo&userId=${DEMO_USER_ID}`);
      const res = await fetch(url);
      const data = await res.json();
        
      // Permissive filter: keep anything with a media_url that looks like a photo
      const filtered = (data.media || [])
        .filter((item: any) => {
          const url = item.media_url || "";
          return (url.includes("/uploads/") || url.startsWith("data:image")) && url.length > 10;
        });
        
      setPhotos(filtered);
    } catch (err) {
      console.error("Failed to fetch photos:", err);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // Refresh every 5 seconds to get new photos
    const interval = setInterval(fetchPhotos, 5000);
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
        <Text style={styles.title}>{activeEvent.title}</Text>
        <Text style={styles.subtitle}>Day in the Life • {activeEvent.city}</Text>

        {/* Show real uploaded photos first */}
        {photos.length > 0 && photos.map((photo) => (
          <StickerCard key={photo._id} containerStyle={styles.cardOverride} hideTape={true}>
            <Text style={styles.slotTime}>{new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={styles.prompt}>
              {photo.event_title ? `[${photo.event_title}]: ` : ""}{photo.prompt || "Photo Upload"}
            </Text>
            <Image 
              source={{ uri: photo.media_url }} 
              style={[
                styles.photo, 
                photo.width && photo.height ? { aspectRatio: photo.width / photo.height } : {}
              ]} 
              resizeMode="cover" 
            />
            <Text style={styles.meta}>Status: submitted</Text>
          </StickerCard>
        ))}

        {activeEvent.slots.filter(s => s.status !== "submitted").map((slot) => (
          <StickerCard key={slot.id}>
            <Text style={styles.slotTime}>{new Date(slot.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.prompt}>{slot.promptText}</Text>
            <Text style={styles.meta}>
              Status: {slot.status} {slot.promptType === "creative_hint" ? "• Creative Hint" : ""}
            </Text>
          </StickerCard>
        ))}

        {photos.length > 0 && (
          <Pressable onPress={handleDeleteAll} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete All Entries</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 12,
    gap: 20
  },
  header: {
    gap: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  slotTime: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 4
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
    borderColor: theme.colors.text,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  cardOverride: {
    padding: 0,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteButton: {
    marginTop: 40,
    marginBottom: 60,
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ef4444"
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 16
  },
  debugButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ccc"
  },
  debugButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.text
  },
  debugButtonText: {
    fontSize: 10,
    fontWeight: "bold"
  },
  unmirror: {
    transform: [{ scaleX: -1 }]
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.mutedText,
    backgroundColor: "#f4f3ff",
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4
  }
});
