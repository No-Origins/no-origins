import { Row, Stack } from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Elevation" };

const ELEVATION = ["e1", "e2", "e3", "e4"] as const;

export default function Elevation() {
  return (
    <TokenScreen slug="elevation">
      <Row gap={24}>
        {ELEVATION.map((e) => (
          <Stack key={e} gap={8} align="center">
            <span className="h-16 w-24 rounded-lg bg-surface" style={{ boxShadow: `var(--${e})` }} />
            <span className="noo-label text-muted">{e}</span>
          </Stack>
        ))}
      </Row>
    </TokenScreen>
  );
}
