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

interface WrappedStats {
  photoStreak: number;
  totalPhotos: number;
  mostOnTime: string; // e.g. "2 seconds" or "within 1 minute"
  mostActiveCity: string;
  citiesVisited: number;
}

interface EventRecapProps {
  eventTitle: string;
  eventCity: string;
  eventDate: string;
  photos: PhotoSlide[];
  participants: string[];
  wrappedStats?: WrappedStats;
}

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

/* ─── Stacked Grid Slide — full-width rows like feed ───────── */
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

  const renderPhoto = (photo: PhotoSlide, containerStyle: React.CSSProperties) => {
    return (
      <div
        style={{
          ...containerStyle,
          position: "relative",
          overflow: "hidden"
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

  return (
    <AbsoluteFill
      style={{
        opacity,
        background: "#0a0a1a",
        padding: 16
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 999,
            padding: "10px 24px",
            fontSize: 34,
            fontWeight: 800,
            color: "#fff",
            transform: "translateY(-50%)",
            border: "2px solid rgba(255,255,255,0.22)"
          }}
        >
          {timeStr}
        </div>
      </div>
      <div style={{ flex: 1, paddingBottom: PLAYER_CONTROLS_SAFE_BOTTOM }}>
        <div style={gridStyle}>
          {slidePhotos.map((photo) =>
            renderPhoto(photo, { width: "100%", height: "100%" })
          )}
        </div>
      </div>
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
  wrappedStats,
}) => {
  // Group photos by fixed-size chunks so each slide consistently shows up to 4 images.
  const timeGroups: { timestamp: string; photos: PhotoSlide[] }[] = [];
  for (let i = 0; i < photos.length; i += 4) {
    const chunk = photos.slice(i, i + 4);
    if (chunk.length) {
      timeGroups.push({
        timestamp: chunk[0].timestamp,
        photos: chunk
      });
    }
  }

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
