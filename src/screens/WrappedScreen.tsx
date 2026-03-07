import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";

export function WrappedScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EVENT WRAPPED</Text>
        </View>
        <Text style={styles.title}>Event Wrapped</Text>
        <Text style={styles.subtitle}>Spotify-style summary view placeholder</Text>

        <StickerCard>
          <Text style={styles.statLabel}>On-time capture rate</Text>
          <Text style={styles.statValue}>78%</Text>
        </StickerCard>
        <StickerCard>
          <Text style={styles.statLabel}>Top hour</Text>
          <Text style={styles.statValue}>3:00 PM</Text>
        </StickerCard>
        <StickerCard>
          <Text style={styles.statLabel}>Longest streak</Text>
          <Text style={styles.statValue}>9 slots</Text>
        </StickerCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.popOrange,
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text
  },
  subtitle: {
    color: theme.colors.mutedText
  },
  statLabel: {
    color: theme.colors.mutedText,
    marginBottom: 4
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary
  }
});
