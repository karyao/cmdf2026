import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { useEventStore } from "../store/useEventStore";

export function CameraScreen() {
  const { activeEvent, markSlot } = useEventStore();
  const openSlot = activeEvent.slots.find((slot) => slot.status === "window_open");

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CAPTURE WINDOW</Text>
        </View>
        <Text style={styles.title}>Camera Module</Text>
        <Text style={styles.subtitle}>Hook `expo-camera` here. Window defaults to 10 minutes.</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>Camera Preview Placeholder</Text>
        </View>
        {openSlot ? (
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.primary]} onPress={() => markSlot(openSlot.id, "submitted")}>
              <Text style={styles.primaryText}>Submit</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.warning]} onPress={() => markSlot(openSlot.id, "skipped_private")}>
              <Text style={styles.warningText}>Skip / Sensitive</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.meta}>No active capture window right now.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.text,
    borderWidth: 2,
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.mutedText
  },
  preview: {
    marginTop: 16,
    borderRadius: theme.radius.xl,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: theme.colors.text,
    backgroundColor: "#f9e7ff",
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center"
  },
  previewText: {
    color: theme.colors.mutedText
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center"
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.text
  },
  warning: {
    backgroundColor: theme.colors.popYellow,
    borderWidth: 2,
    borderColor: theme.colors.text
  },
  primaryText: {
    color: theme.colors.text,
    fontWeight: "700"
  },
  warningText: {
    color: theme.colors.warning,
    fontWeight: "700"
  },
  meta: {
    marginTop: 14,
    color: theme.colors.mutedText
  }
});
