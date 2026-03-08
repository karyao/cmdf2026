import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";
import { useEventStore } from "../store/useEventStore";
import { AvatarStack } from "../components/AvatarStack";

export function TimelineScreen() {
  const { activeEvent } = useEventStore();
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    // Fetch photos from the Next.js backend
    const fetchPhotos = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/media?type=photo");
        const data = await res.json();
        
        // Only keep local base64 images (ignore Cloudinary URLs and broken tiny tests)
        const localOnly = (data.media || []).filter((item: any) => 
          item.media_url?.startsWith("data:image") && item.media_url.length > 100
        );
        
        setPhotos(localOnly);
      } catch (err) {
        console.error("Failed to fetch photos:", err);
      }
    };
    
    fetchPhotos();
    // Refresh every 5 seconds to get new photos
    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DAY STRIP</Text>
          </View>
          <Text style={styles.title}>{activeEvent.title}</Text>
          <Text style={styles.subtitle}>Day in the Life • {activeEvent.city}</Text>
          <AvatarStack members={activeEvent.members} />
        </View>

        {/* Show real uploaded photos first */}
        {photos.length > 0 && photos.map((photo) => (
          <StickerCard key={photo._id}>
            <Text style={styles.slotTime}>{new Date(photo.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.prompt}>{photo.prompt || "Photo Upload"}</Text>
            <Image source={{ uri: photo.media_url }} style={[styles.photo, styles.unmirror]} />
            <Text style={styles.meta}>Status: submitted</Text>
          </StickerCard>
        ))}

        {/* Show pending/dummy slots below */}
        {activeEvent.slots.filter(s => s.status !== "submitted").map((slot) => (
          <StickerCard key={slot.id}>
            <Text style={styles.slotTime}>{new Date(slot.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.prompt}>{slot.promptText}</Text>
            <Text style={styles.meta}>
              Status: {slot.status} {slot.promptType === "creative_hint" ? "• Creative Hint" : ""}
            </Text>
          </StickerCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
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
    fontSize: 30,
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
    marginTop: 10,
    width: "100%",
    height: 220,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border,
    borderWidth: 2
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
