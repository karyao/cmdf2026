import { useMemo, useRef, useState } from "react";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { theme } from "../theme/theme";
import { useEventStore } from "../store/useEventStore";

export function CameraScreen() {
  const { activeEvent, markSlot } = useEventStore();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedWithFrontCamera, setCapturedWithFrontCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const openSlot = activeEvent.slots.find((slot) => slot.status === "window_open");
  const latestSubmitted = useMemo(
    () =>
      [...activeEvent.slots]
        .reverse()
        .find((slot) => slot.status === "submitted" && typeof slot.imageUrl === "string" && slot.imageUrl.length > 0),
    [activeEvent.slots]
  );

  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        mirror: false
      });
      setCapturedUri(result.uri);
      setCapturedWithFrontCamera(facing === "front");
    } finally {
      setIsCapturing(false);
    }
  };

  const submitPhoto = () => {
    if (!openSlot || !capturedUri) return;
    markSlot(openSlot.id, "submitted", capturedUri, capturedWithFrontCamera);
    setCapturedUri(null);
    setCapturedWithFrontCamera(false);
  };

  const skipSlot = () => {
    if (!openSlot) return;
    setCapturedUri(null);
    setCapturedWithFrontCamera(false);
    markSlot(openSlot.id, "skipped_private");
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CAPTURE WINDOW</Text>
        </View>
        <Text style={styles.title}>Camera Module</Text>
        <Text style={styles.subtitle}>Take a photo, preview it, and choose to retake or submit.</Text>

        {openSlot ? (
          <View style={styles.actions}>
            {permission?.granted ? (
              <>
                <Pressable style={[styles.button, styles.secondary]} onPress={toggleCameraFacing}>
                  <Text style={styles.secondaryText}>Flip Camera</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.secondary, !capturedUri && styles.disabledButton]}
                  onPress={() => {
                    setCapturedUri(null);
                    setCapturedWithFrontCamera(false);
                  }}
                  disabled={!capturedUri}
                >
                  <Text style={[styles.secondaryText, !capturedUri && styles.disabledText]}>Take Another Photo</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.primary]} onPress={takePhoto} disabled={isCapturing || !!capturedUri}>
                  <Text style={styles.primaryText}>{isCapturing ? "Capturing..." : "Take Photo"}</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.primary]} onPress={submitPhoto} disabled={!capturedUri}>
                  <Text style={styles.primaryText}>Use Photo</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={[styles.button, styles.primary]} onPress={requestPermission}>
                  <Text style={styles.primaryText}>Enable Camera</Text>
                </Pressable>
              </>
            )}
            <Pressable style={[styles.button, styles.warning]} onPress={skipSlot}>
              <Text style={styles.warningText}>Skip / Sensitive</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.meta}>No active capture window right now.</Text>
        )}

        {!permission ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>Checking camera permissions…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>Camera access is required to capture photos.</Text>
            <Pressable style={[styles.button, styles.primary, styles.permissionButton]} onPress={requestPermission}>
              <Text style={styles.primaryText}>Enable Camera</Text>
            </Pressable>
          </View>
        ) : capturedUri ? (
          <View style={styles.preview}>
            <Image source={{ uri: capturedUri }} style={[styles.previewImage, styles.unmirror]} />
          </View>
        ) : (
          <View style={styles.preview}>
            <CameraView ref={cameraRef} style={styles.cameraView} facing={facing} mirror={false} />
          </View>
        )}
        {latestSubmitted?.imageUrl ? (
          <View style={styles.latestWrap}>
            <Text style={styles.latestTitle}>Latest submitted photo</Text>
            <Image
              source={{ uri: latestSubmitted.imageUrl }}
              style={[styles.latestImage, styles.unmirror]}
            />
          </View>
        ) : null}
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
    alignSelf: "center",
    width: "82%",
    maxWidth: 360,
    aspectRatio: 9 / 16,
    borderRadius: theme.radius.xl,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: theme.colors.text,
    backgroundColor: "#f9e7ff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  cameraView: {
    width: "100%",
    height: "100%"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  previewText: {
    color: theme.colors.mutedText
  },
  actions: {
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    flexDirection: "row"
  },
  button: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    alignItems: "center"
  },
  permissionButton: {
    marginTop: 12
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.text
  },
  secondary: {
    backgroundColor: "#eef7ff",
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
  secondaryText: {
    color: theme.colors.text,
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.5
  },
  disabledText: {
    color: theme.colors.mutedText
  },
  meta: {
    marginTop: 14,
    color: theme.colors.mutedText
  },
  latestWrap: {
    marginTop: 16
  },
  latestTitle: {
    marginBottom: 8,
    fontWeight: "700",
    color: theme.colors.text
  },
  latestImage: {
    width: "100%",
    height: 220,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border,
    borderWidth: 2
  },
  unmirror: {
    transform: [{ scaleX: -1 }]
  }
});
