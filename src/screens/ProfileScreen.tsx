import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";

const highlights = ["Trips", "Study", "Food", "Friends"];
const posts = [
  { id: "p1", color: "#ffd9e8" },
  { id: "p2", color: "#d8f5ff" },
  { id: "p3", color: "#ffe7c2" },
  { id: "p4", color: "#e2ffd6" },
  { id: "p5", color: "#ece2ff" },
  { id: "p6", color: "#ffe0cf" },
  { id: "p7", color: "#fff1b8" },
  { id: "p8", color: "#d7f0ff" },
  { id: "p9", color: "#f7dcff" }
];

export function ProfileScreen() {
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
              <Text style={styles.statNum}>84</Text>
              <Text style={styles.statLabel}>Posts</Text>
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
            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
          <View style={styles.grid}>
            {posts.map((post) => (
              <View key={post.id} style={[styles.postTile, { backgroundColor: post.color }]} />
            ))}
          </View>

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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  postTile: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: "#f4ecff"
  },
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
