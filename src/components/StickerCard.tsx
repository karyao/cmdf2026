import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

interface StickerCardProps extends PropsWithChildren {
  containerStyle?: ViewStyle;
  hideTape?: boolean;
}

export function StickerCard({ children, containerStyle, hideTape }: StickerCardProps) {
  return (
    <View style={styles.wrap}>
      {!hideTape && (
        <>
          <View style={[styles.tape, styles.tapeLeft]} />
          <View style={[styles.tape, styles.tapeRight]} />
        </>
      )}
      <View style={[styles.card, containerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative"
  },
  tape: {
    position: "absolute",
    top: -6,
    width: 30,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#fff3a2",
    zIndex: 1,
    transform: [{ rotate: "-10deg" }]
  },
  tapeLeft: {
    left: 18
  },
  tapeRight: {
    right: 22,
    transform: [{ rotate: "11deg" }]
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: theme.radius.xl,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  }
});
