import React from "react";
import { Composition } from "remotion";
import { EventRecap } from "./EventRecap";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EventRecap"
      component={EventRecap}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        eventTitle: "Sample Event",
        eventCity: "Vancouver",
        eventDate: new Date().toISOString(),
        photos: [],
        participants: [],
      }}
    />
  );
};
