import { Image, StyleSheet, View } from "react-native";
import { EventMember } from "../types/domain";
import { theme } from "../theme/theme";
import { apiUrl } from "../lib/api";

interface AvatarStackProps {
  members: EventMember[];
}

export function AvatarStack({ members }: AvatarStackProps) {
  const shown = members.slice(0, 4);
  const timelineProfileImages = ["/profile/grey.png", "/profile/brown.png", "/profile/spotted.png"];
  return (
    <View style={styles.row}>
      {shown.map((member, idx) => (
        <View
          key={member.id}
          style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -10 }]}
        >
          <Image
            source={{ uri: apiUrl(timelineProfileImages[idx % timelineProfileImages.length]) }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
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
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  avatarImage: {
    width: "100%",
    height: "100%"
  }
});
