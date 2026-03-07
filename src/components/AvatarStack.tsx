import { StyleSheet, Text, View } from "react-native";
import { EventMember } from "../types/domain";
import { theme } from "../theme/theme";

interface AvatarStackProps {
  members: EventMember[];
}

export function AvatarStack({ members }: AvatarStackProps) {
  const shown = members.slice(0, 4);
  const palette = [theme.colors.primary, theme.colors.accent, theme.colors.popOrange, theme.colors.accent2];
  return (
    <View style={styles.row}>
      {shown.map((member, idx) => (
        <View
          key={member.id}
          style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -10, backgroundColor: palette[idx % palette.length] }]}
        >
          <Text style={styles.avatarText}>{member.displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  avatarText: {
    color: "#101010",
    fontWeight: "700"
  }
});
