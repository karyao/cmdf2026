import React, { RefObject } from "react";
import { View, Image, Text, StyleSheet, Pressable } from "react-native";
import { CameraType, CameraView } from "expo-camera";
import { theme } from "../theme/theme";
import { EventMember } from "../types/domain";

interface EventPhoto {
  _id: string;
  media_url: string;
  user_id: string | null;
  prompt: string;
  timestamp: string;
}

interface LobbyGridProps {
  members: EventMember[];
  containerHeight?: number;
  // Camera integration (optional — only passed when event is joined)
  isJoined?: boolean;
  currentUserId?: string;
  eventPhotos?: EventPhoto[];
  cameraRef?: RefObject<CameraView | null>;
  capturedUri?: string | null;
  capturedWithFrontCamera?: boolean;
  isCapturing?: boolean;
  cameraPermission?: { granted: boolean } | null;
  facing?: CameraType;
  onRequestPermission?: () => void;
  onCapture?: () => void;
  onRetake?: () => void;
  onFlip?: () => void;
}

const REAL_PORTRAITS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&h=600&fit=crop",
];

export function LobbyGrid({
  members,
  containerHeight = 400,
  isJoined,
  currentUserId,
  eventPhotos = [],
  cameraRef,
  capturedUri,
  capturedWithFrontCamera,
  isCapturing,
  cameraPermission,
  facing = "front",
  onRequestPermission,
  onCapture,
  onRetake,
  onFlip,
}: LobbyGridProps) {
  const count = Math.min(members.length, 4);

  // Find a submitted photo for a given member
  const getPhotoForMember = (member: EventMember): string | null => {
    const photo = eventPhotos.find((p) => p.user_id === member.id);
    return photo?.media_url ?? null;
  };

  const isCurrentUser = (member: EventMember) => 
    isJoined && currentUserId && member.id === currentUserId;

  const currentUserHasSubmitted = eventPhotos.some(
    (p) => p.user_id === currentUserId
  );

  const renderMember = (member: EventMember, style: any, index: number) => {
    const submittedPhoto = getPhotoForMember(member);

    // Current user's slot — show camera or preview
    if (isCurrentUser(member) && !currentUserHasSubmitted) {
      return (
        <View key={member.id} style={[styles.memberContainer, style]}>
          {/* Camera: show preview if captured, live feed if not */}
          {capturedUri ? (
            // Preview state
            <>
              <Image source={{ uri: capturedUri }} style={[styles.image, capturedWithFrontCamera && styles.mirrored]} resizeMode="cover" />
              <View style={styles.cameraOverlay}>
                <Pressable style={styles.overlayBtnSecondary} onPress={onRetake}>
                  <Text style={styles.overlayBtnText}>↩ Retake</Text>
                </Pressable>
              </View>
            </>
          ) : cameraPermission?.granted ? (
            // Live camera feed
            <>
              <CameraView 
                ref={cameraRef} 
                style={styles.image} 
                facing={facing} 
                mirror={false} 
              />
              <View style={styles.cameraOverlay}>
                <Pressable style={styles.overlayBtnSecondary} onPress={onFlip}>
                  <Text style={styles.overlayBtnText}>🔄</Text>
                </Pressable>
                <Pressable 
                  style={styles.overlayBtnPrimary} 
                  onPress={onCapture}
                  disabled={isCapturing}
                >
                  <Text style={styles.overlayBtnPrimaryText}>
                    {isCapturing ? "..." : "📷 Capture"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            // No permission
            <View style={[styles.image, styles.cameraPlaceholder]}>
              <Text style={styles.placeholderEmoji}>📷</Text>
              <Pressable style={styles.enableBtn} onPress={onRequestPermission}>
                <Text style={styles.enableBtnText}>Enable Camera</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.nameBadge}>
            <Text style={styles.nameText}>You</Text>
          </View>
        </View>
      );
    }

    // Other members or user who already submitted — show their photo or placeholder
    const photoUrl = submittedPhoto
      ?? (index < REAL_PORTRAITS.length ? REAL_PORTRAITS[index] : undefined)
      ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`;

    return (
      <View key={member.id} style={[styles.memberContainer, style]}>
        <Image
          source={{ uri: photoUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>
            {isCurrentUser(member) ? "You" : member.displayName}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.gridContainer, { height: containerHeight }]}>
      {count === 1 && renderMember(members[0], styles.full, 0)}
      
      {count === 2 && (
        <View style={styles.stack}>
          {renderMember(members[0], styles.halfHeight, 0)}
          {renderMember(members[1], styles.halfHeight, 1)}
        </View>
      )}

      {count === 3 && (
        <View style={styles.stack}>
          {renderMember(members[0], styles.thirdHeight, 0)}
          {renderMember(members[1], styles.thirdHeight, 1)}
          {renderMember(members[2], styles.thirdHeight, 2)}
        </View>
      )}

      {count === 4 && (
        <View style={styles.quadGrid}>
          <View style={styles.row}>
            {renderMember(members[0], styles.quadItem, 0)}
            {renderMember(members[1], styles.quadItem, 1)}
          </View>
          <View style={styles.row}>
            {renderMember(members[2], styles.quadItem, 2)}
            {renderMember(members[3], styles.quadItem, 3)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: "100%",
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  memberContainer: {
    flex: 1,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  nameBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  full: {
    flex: 1,
  },
  stack: {
    flex: 1,
  },
  halfHeight: {
    height: "50%",
  },
  thirdHeight: {
    height: "33.33%",
  },
  quadGrid: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  quadItem: {
    flex: 1,
  },
  // Camera overlay styles
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  overlayBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overlayBtnPrimary: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overlayBtnText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#1a1a2e",
  },
  overlayBtnPrimaryText: {
    fontWeight: "800",
    fontSize: 13,
    color: "#ffffff",
  },
  cameraPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  placeholderEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  enableBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  enableBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});
