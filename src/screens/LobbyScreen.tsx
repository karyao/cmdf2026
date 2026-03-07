import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { StickerCard } from "../components/StickerCard";
import { theme } from "../theme/theme";

type LobbyNavigation = NativeStackNavigationProp<RootStackParamList>;

const sampleLobbies = [
  { id: "vancouver-sunset", title: "Vancouver Sunset Walk", interval: "Every 3 hours", city: "Vancouver" },
  { id: "study-friends", title: "Study Friends Downtown", interval: "Every hour", city: "Vancouver" }
];

export function LobbyScreen() {
  const navigation = useNavigation<LobbyNavigation>();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VANCOUVER LOBBY</Text>
        </View>
        <Text style={styles.title}>Public Lobby</Text>
        <Text style={styles.subtitle}>Join themed events and meet people through prompts.</Text>

        {sampleLobbies.map((event) => (
          <StickerCard key={event.id}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.meta}>
              {event.city} • {event.interval}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("EventDetails", { eventId: event.id })}
              style={styles.button}
            >
              <Text style={styles.buttonText}>View Event</Text>
            </Pressable>
          </StickerCard>
        ))}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Moderation Scaffold Ready</Text>
          <Text style={styles.noticeBody}>Add report, mute, block, and admin queue actions here.</Text>
        </View>
      </ScrollView>
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
  eventTitle: {
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
  }
});
