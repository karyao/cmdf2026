import { RouteProp } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";

type EventDetailsRoute = RouteProp<RootStackParamList, "EventDetails">;

interface Props {
  route: EventDetailsRoute;
}

export function EventDetailsScreen({ route }: Props) {
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EVENT PATCH</Text>
        </View>
        <Text style={styles.title}>Event Details</Text>
        <Text style={styles.subtitle}>Event ID: {route.params.eventId}</Text>

        <StickerCard>
          <Text style={styles.sectionTitle}>Invite + Access</Text>
          <Text style={styles.sectionBody}>Private via code or public with moderated posting rules.</Text>
        </StickerCard>
        <StickerCard>
          <Text style={styles.sectionTitle}>Interval Controls</Text>
          <Text style={styles.sectionBody}>Supports 60-minute default or custom intervals (e.g. every 3 hours).</Text>
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
    backgroundColor: theme.colors.accent2,
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
  sectionTitle: {
    fontWeight: "700",
    color: theme.colors.text
  },
  sectionBody: {
    marginTop: 6,
    color: theme.colors.mutedText
  }
});
