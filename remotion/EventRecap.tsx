import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";

interface PhotoSlide {
  url: string;
  participantName: string;
  timestamp: string;
  width?: number;
  height?: number;
}

interface EventRecapProps {
  eventTitle: string;
  eventCity: string;
  eventDate: string;
  photos: PhotoSlide[];
  participants: string[];
}

const FRAMES_PER_SLIDE = 90; // 3 seconds
const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 90;

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
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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
            background: "rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 18,
            fontWeight: 700,
            color: "#e0d5c0",
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
            color: "#ffffff",
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
            color: "#c4b89a",
            fontWeight: 600,
          }}
        >
          {eventCity} • {dateStr}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            marginTop: 16,
          }}
        >
          {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Grid Slide — shows photos in lobby-style grid ────────── */
const GridSlide: React.FC<{
  photos: PhotoSlide[];
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

  const count = photos.length;

  // Render the grid layout matching the lobby grid
  const renderGrid = () => {
    if (count === 1) {
      return renderPhoto(photos[0], { width: "100%", height: "100%" });
    }
    if (count === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 4 }}>
          {renderPhoto(photos[0], { width: "100%", flex: 1 })}
          {renderPhoto(photos[1], { width: "100%", flex: 1 })}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 4 }}>
          {renderPhoto(photos[0], { width: "100%", flex: 1 })}
          {renderPhoto(photos[1], { width: "100%", flex: 1 })}
          {renderPhoto(photos[2], { width: "100%", flex: 1 })}
        </div>
      );
    }
    // 4+ photos: 2x2 grid
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 4 }}>
        <div style={{ display: "flex", flex: 1, gap: 4 }}>
          {renderPhoto(photos[0], { flex: 1, height: "100%" })}
          {renderPhoto(photos[1], { flex: 1, height: "100%" })}
        </div>
        <div style={{ display: "flex", flex: 1, gap: 4 }}>
          {renderPhoto(photos[2], { flex: 1, height: "100%" })}
          {photos[3] ? renderPhoto(photos[3], { flex: 1, height: "100%" }) : <div style={{ flex: 1 }} />}
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
          borderRadius: 12,
        }}
      >
        <Img
          src={photo.url}
          style={{
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
            padding: "8px 14px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
            {photo.participantName}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#0a0a1a", padding: 16 }}>
      {/* Time badge at top */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 999,
            padding: "6px 18px",
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {timeStr}
        </div>
      </div>
      {/* Grid */}
      <div style={{ flex: 1, marginTop: 80, marginBottom: 20 }}>
        {renderGrid()}
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
        background: "linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)",
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
        <div style={{ fontSize: 48, fontWeight: 800, color: "#ffffff" }}>
          That's a wrap! 🎬
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center" as const,
            maxWidth: 600,
          }}
        >
          with {participants.join(", ")}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 18,
            color: "#c4b89a",
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
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
}) => {
  // Group photos by timestamp (same time = same grid slide)
  const timeGroups: { timestamp: string; photos: PhotoSlide[] }[] = [];
  for (const photo of photos) {
    const existing = timeGroups.find((g) => g.timestamp === photo.timestamp);
    if (existing) {
      existing.photos.push(photo);
    } else {
      timeGroups.push({ timestamp: photo.timestamp, photos: [photo] });
    }
  }

  // If no grouping happened (all unique timestamps), show all photos as one grid
  if (timeGroups.length === photos.length && photos.length > 1) {
    // Combine all into one grid slide
    const allInOne = [{ timestamp: photos[0].timestamp, photos: photos.slice(0, 4) }];
    // If more than 4, make additional grids
    for (let i = 4; i < photos.length; i += 4) {
      allInOne.push({ timestamp: photos[i].timestamp, photos: photos.slice(i, i + 4) });
    }
    timeGroups.length = 0;
    timeGroups.push(...allInOne);
  }

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

      {/* Outro */}
      <Sequence
        from={INTRO_FRAMES + timeGroups.length * FRAMES_PER_SLIDE}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroSlide participants={participants} />
      </Sequence>
    </AbsoluteFill>
  );
};
