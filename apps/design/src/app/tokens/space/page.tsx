import { Row, Stack } from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";

export const metadata = { title: "Space" };

const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];

export default function Space() {
  return (
    <TokenScreen slug="space">
      <Row gap={16} align="end">
        {SPACE.map((s) => (
          <Stack key={s} gap={8} align="center">
            <span style={{ width: s, height: s, background: "var(--accent-deep)", borderRadius: 2 }} />
            <span className="noo-label text-muted">{s}</span>
          </Stack>
        ))}
      </Row>
    </TokenScreen>
  );
}
