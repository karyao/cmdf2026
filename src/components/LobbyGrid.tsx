import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { theme } from "../theme/theme";
import { EventMember } from "../types/domain";

interface LobbyGridProps {
  members: EventMember[];
  containerHeight?: number;
}

const REAL_PORTRAITS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&h=600&fit=crop",
];

/**
 * LobbyGrid renders a dynamic photo layout for 1-4 people.
 * - 1 person: Full image
 * - 2 people: Stacked vertically (50% height each)
 * - 3 people: Stacked vertically (33% height each)
 * - 4 people: 2x2 grid
 */
export function LobbyGrid({ members, containerHeight = 400 }: LobbyGridProps) {
  const count = Math.min(members.length, 4);

  const renderMember = (member: EventMember, style: any, index: number) => {
    // Use a real portrait if it's one of the mock members
    const photoUrl = index < REAL_PORTRAITS.length 
      ? REAL_PORTRAITS[index] 
      : (member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`);

    return (
      <View key={member.id} style={[styles.memberContainer, style]}>
        <Image
          source={{ uri: photoUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>{member.displayName}</Text>
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
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 12,
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
});
