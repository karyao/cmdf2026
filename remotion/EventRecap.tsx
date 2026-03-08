import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  staticFile,
} from "remotion";

export type PhotoSlide = {
  url: string;
  participantName: string;
  participantId?: string;
  timestamp: string;
  width?: number;
  height?: number;
};

type WrappedStats = {
  photoStreak: number;
  totalPhotos: number;
  mostOnTime: string; // e.g. "2 seconds" or "within 1 minute"
  mostActiveCity: string;
  citiesVisited: number;
};

export type EventRecapProps = {
  eventId: string;
  eventTitle: string;
  eventCity: string;
  eventDate: string;
  photos: PhotoSlide[];
  participants: string[];
  allMembers?: { _id: string, name: string }[];
  wrappedStats?: WrappedStats;
};

const FRAMES_PER_SLIDE = 90; // 3 seconds
const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 90;
const WRAPPED_FRAMES = 120; // 4 seconds per wrapped slide
const PLAYER_CONTROLS_SAFE_BOTTOM = 160;

/* ─── Intro Slide ──────────────────────────────────────────── */
const IntroSlide: React.FC<{
  eventTitle: string;
  eventCity: string;
  eventDate: string;
  participantCount: number;
}> = ({ eventTitle, eventCity, eventDate, participantCount }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: "clamp" });

  const dateStr = new Date(eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fdf4f8 0%, #ffe7a8 50%, #f7a8c8 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            background: "rgba(76, 74, 104, 0.15)",
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 18,
            fontWeight: 700,
            color: "#4c4a68",
            letterSpacing: 2,
            textTransform: "uppercase" as const,
          }}
        >
          DAY IN THE LIFE
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#4c4a68",
            textAlign: "center" as const,
            lineHeight: 1.1,
            maxWidth: 800,
          }}
        >
          {eventTitle}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#7a7894",
            fontWeight: 600,
          }}
        >
          {eventCity} • {dateStr}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(76, 74, 104, 0.6)",
            marginTop: 16,
          }}
        >
          {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Stacked Grid Slide — full-width rows like feed ───────── */
const GridSlide: React.FC<{
  photos: (PhotoSlide | null)[];
  timestamp: string;
}> = ({ photos, timestamp }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, FRAMES_PER_SLIDE - 15, FRAMES_PER_SLIDE], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const timeStr = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const count = photos.length; // photos array has exactly the number of slots we need to render

  const renderGrid = () => {
    if (count === 1) {
      return photos[0] ? renderPhoto(photos[0], { width: "100%", height: "100%" }) : renderEmptySlot({ width: "100%", height: "100%" });
    }
    if (count === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 0 }}>
          {photos[0] ? renderPhoto(photos[0], { width: "100%", flex: 1 }) : renderEmptySlot({ width: "100%", flex: 1 })}
          {photos[1] ? renderPhoto(photos[1], { width: "100%", flex: 1 }) : renderEmptySlot({ width: "100%", flex: 1 })}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 0 }}>
          {/* Top row: 1 large photo */}
          {photos[0] ? renderPhoto(photos[0], { width: "100%", flex: 1 }) : renderEmptySlot({ width: "100%", flex: 1 })}
          
          {/* Bottom row: 2 split photos */}
          <div style={{ display: "flex", flex: 1, gap: 0 }}>
            {photos[1] ? renderPhoto(photos[1], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
            {photos[2] ? renderPhoto(photos[2], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
          </div>
        </div>
      );
    }
    // 4 or more
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 0 }}>
        <div style={{ display: "flex", flex: 1, gap: 0 }}>
          {photos[0] ? renderPhoto(photos[0], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
          {photos[1] ? renderPhoto(photos[1], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
        </div>
        <div style={{ display: "flex", flex: 1, gap: 0 }}>
          {photos[2] ? renderPhoto(photos[2], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
          {photos[3] ? renderPhoto(photos[3], { flex: 1, height: "100%" }) : renderEmptySlot({ flex: 1, height: "100%" })}
        </div>
      </div>
    );
  };
  const renderPhoto = (photo: PhotoSlide, containerStyle: React.CSSProperties) => {
    return (
      <div
        style={{
          ...containerStyle,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#e6dcf7",
        }}
      >
        <Img
          src={photo.url}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 14px 10px 14px",
            background: "linear-gradient(transparent, rgba(76,74,104,0.85))",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", textShadow: "0px 2px 4px rgba(0,0,0,0.5)" }}>
            {photo.participantName}
          </div>
        </div>
      </div>
    );
  };
  const slidePhotos = photos.slice(0, 4);
  const isTwoByTwo = slidePhotos.length === 4;
  const gridStyle: React.CSSProperties = isTwoByTwo
    ? {
        display: "grid",
        width: "100%",
        height: "100%",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "minmax(0,1fr) minmax(0,1fr)",
        gap: 2
      }
    : {
        display: "grid",
        width: "100%",
        height: "100%",
        gridTemplateColumns: "1fr",
        gridTemplateRows: `repeat(${slidePhotos.length || 1}, minmax(0,1fr))`,
        gap: 2
      };

  const renderEmptySlot = (containerStyle: React.CSSProperties) => {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#e6dcf7", // App border color
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>👻</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#7a7894", textAlign: "center" }}>
          no image :(
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#fdf4f8", padding: 0 }}>
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            background: "#4c4a68",
            borderRadius: 999,
            padding: "8px 24px",
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 4px 12px rgba(76, 74, 104, 0.5)",
          }}
        >
          {timeStr}
        </div>
      </div>
      <div style={{ flex: 1, margin: 0 }}>
        {renderGrid()}
      </div>

      {/* Custom Overlay Image */}
      <Img
        src={staticFile("images/overlay.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
          zIndex: 20
        }}
      />
    </AbsoluteFill>
  );
};

/* ─── Wrapped Slide — generic Spotify Wrapped-style stat ──── */
const WrappedSlide: React.FC<{
  emoji: string;
  label: string;
  bigValue: string;
  subtitle: string;
  gradient: string;
}> = ({ emoji, label, bigValue, subtitle, gradient }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const emojiScale = interpolate(frame, [10, 35], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const valueY = interpolate(frame, [20, 45], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const valueOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: gradient,
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: 40,
        }}
      >
        {/* Label at top */}
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 999,
            padding: "8px 22px",
            fontSize: 16,
            fontWeight: 700,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 2,
            textTransform: "uppercase" as const,
          }}
        >
          {label}
        </div>

        {/* Big emoji */}
        <div
          style={{
            fontSize: 100,
            transform: `scale(${emojiScale})`,
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          {emoji}
        </div>

        {/* Big value */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center" as const,
            lineHeight: 1.1,
            transform: `translateY(${valueY}px)`,
            opacity: valueOpacity,
            maxWidth: 800,
          }}
        >
          {bigValue}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center" as const,
            opacity: subOpacity,
            maxWidth: 700,
            marginTop: 10,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Outro Slide ──────────────────────────────────────────── */
const OutroSlide: React.FC<{ participants: string[] }> = ({ participants }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #a9d8ff 0%, #fdf4f8 50%, #f7a8c8 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, color: "#4c4a68" }}>
          That's a wrap! 🎬
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#7a7894",
            textAlign: "center" as const,
            maxWidth: 600,
          }}
        >
          with {participants.join(", ")}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: "#4c4a68",
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            padding: "10px 24px",
            backgroundColor: "rgba(255,255,255,0.5)",
            borderRadius: 999,
          }}
        >
          DAY IN THE LIFE
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Main Composition ─────────────────────────────────────── */
export const EventRecap: React.FC<EventRecapProps> = ({
  eventTitle,
  eventCity,
  eventDate,
  photos,
  participants,
  allMembers,
  wrappedStats,
}) => {
  // Group photos by hour into a map
  const hourMap: Record<string, { timestamp: string; photos: PhotoSlide[] }> = {};
  for (const photo of photos) {
    if (!photo) continue;
    const d = new Date(photo.timestamp);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    if (!hourMap[k]) {
      const groupTime = new Date(d);
      groupTime.setMinutes(0, 0, 0);
      hourMap[k] = { timestamp: groupTime.toISOString(), photos: [] };
    }
    hourMap[k].photos.push(photo);
  }
  // Define actual members to slot ratio. If allMembers isn't passed, fallback to 1 member to prevent crashing.
  const membersList = allMembers && allMembers.length > 0 ? allMembers : [{ _id: "unknown", name: "Member" }];

  // For every active hour, create a slot for EVERY member (null if they skipped)
  const timeGroups: { timestamp: string; photos: (PhotoSlide | null)[] }[] = [];
  
  for (const group of Object.values(hourMap)) {
    // Array size exactly equals number of event members
    const groupSlots: (PhotoSlide | null)[] = new Array(membersList.length).fill(null);
    for (const photo of group.photos) {
      // Find where this participant belongs in the grid
      const memberIndex = membersList.findIndex(m => m._id === photo.participantId);
      if (memberIndex !== -1) {
        groupSlots[memberIndex] = photo;
      }
    }
    timeGroups.push({ timestamp: group.timestamp, photos: groupSlots });
  }

  // If there are more than 4 members, split the arrays into chunks of 4.
  const splitGroups: { timestamp: string, photos: (PhotoSlide | null)[] }[] = [];
  for (const group of timeGroups) {
    for (let i = 0; i < group.photos.length; i += 4) {
      splitGroups.push({
        timestamp: group.timestamp,
        photos: group.photos.slice(i, i + 4)
      });
    }
  }
  timeGroups.length = 0;
  timeGroups.push(...splitGroups);
  // Build wrapped slides
  const wrappedSlides: { emoji: string; label: string; bigValue: string; subtitle: string; gradient: string }[] = [];

  if (wrappedStats) {
    // Photo Streak
    wrappedSlides.push({
      emoji: "🔥",
      label: "Photo Streak",
      bigValue: `${wrappedStats.photoStreak} in a row`,
      subtitle: `You captured ${wrappedStats.totalPhotos} total moments without missing a beat`,
      gradient: "linear-gradient(135deg, #e65100 0%, #ff6d00 50%, #ffa726 100%)",
    });

    // Most On Time
    wrappedSlides.push({
      emoji: "⚡",
      label: "Speed Snapper",
      bigValue: wrappedStats.mostOnTime,
      subtitle: "Your fastest photo after the window opened. No moment wasted!",
      gradient: "linear-gradient(135deg, #4a148c 0%, #7c43bd 50%, #b388ff 100%)",
    });

    // Most Active City
    wrappedSlides.push({
      emoji: "🏙️",
      label: "Most Active City",
      bigValue: wrappedStats.mostActiveCity,
      subtitle: wrappedStats.citiesVisited > 1
        ? `Out of ${wrappedStats.citiesVisited} cities you've explored`
        : "Your home base for capturing life",
      gradient: "linear-gradient(135deg, #004d40 0%, #00897b 50%, #4db6ac 100%)",
    });
  }

  let currentFrame = INTRO_FRAMES + timeGroups.length * FRAMES_PER_SLIDE;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1a" }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <IntroSlide
          eventTitle={eventTitle}
          eventCity={eventCity}
          eventDate={eventDate}
          participantCount={participants.length}
        />
      </Sequence>

      {/* Grid slides */}
      {timeGroups.map((group, i) => (
        <Sequence
          key={`grid-${i}`}
          from={INTRO_FRAMES + i * FRAMES_PER_SLIDE}
          durationInFrames={FRAMES_PER_SLIDE}
        >
          <GridSlide photos={group.photos} timestamp={group.timestamp} />
        </Sequence>
      ))}

      {/* Wrapped stats slides */}
      {wrappedSlides.map((slide, i) => {
        const from = currentFrame + i * WRAPPED_FRAMES;
        return (
          <Sequence key={`wrapped-${i}`} from={from} durationInFrames={WRAPPED_FRAMES}>
            <WrappedSlide {...slide} />
          </Sequence>
        );
      })}

      {/* Outro */}
      <Sequence
        from={currentFrame + wrappedSlides.length * WRAPPED_FRAMES}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroSlide participants={participants} />
      </Sequence>
    </AbsoluteFill>
  );
};
