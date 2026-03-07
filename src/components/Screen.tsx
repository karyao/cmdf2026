import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { theme } from "../theme/theme";

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  blob: {
    position: "absolute",
    borderRadius: 999
  },
  blobTop: {
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: "#ffdff2"
  },
  blobBottom: {
    bottom: -100,
    left: -70,
    width: 260,
    height: 260,
    backgroundColor: "#daf9ff"
  }
});
