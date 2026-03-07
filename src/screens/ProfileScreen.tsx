import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";

export function ProfileScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MY PATCHES</Text>
        </View>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Privacy defaults for long-distance sharing.</Text>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16
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
  title: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.mutedText
  },
  list: {
    marginTop: 18,
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
