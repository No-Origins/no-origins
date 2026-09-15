import { Row, Stack } from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Radius" };

const RADIUS = ["xs", "sm", "md", "lg", "xl", "pill"] as const;

export default function Radius() {
  return (
    <TokenScreen slug="radius">
      <Row gap={16}>
        {RADIUS.map((r) => (
          <Stack key={r} gap={8} align="center">
            <span className="h-16 w-16 bg-surface shadow-e1" style={{ borderRadius: `var(--r-${r})` }} />
            <span className="noo-label text-muted">{r}</span>
          </Stack>
        ))}
      </Row>
    </TokenScreen>
  );
}
