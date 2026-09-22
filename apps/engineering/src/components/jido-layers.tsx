"use client";

import { MapLayer, Layer1, Layer2, Layer3 } from "@/components/jido-layers-early";
import { Layer4, Layer5, Layer6, Layer7 } from "@/components/jido-layers-late";

export function renderLayer(
  index: number,
  visited: Set<number>,
  goTo: (i: number) => void,
) {
  switch (index) {
    case 0:
      return <MapLayer index={index} visited={visited} onJump={goTo} onStart={() => goTo(1)} />;
    case 1:
      return <Layer1 />;
    case 2:
      return <Layer2 />;
    case 3:
      return <Layer3 />;
    case 4:
      return <Layer4 />;
    case 5:
      return <Layer5 />;
    case 6:
      return <Layer6 />;
    case 7:
      return <Layer7 />;
    default:
      return null;
  }
}
