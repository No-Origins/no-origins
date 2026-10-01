import type { CharacterVersion, PublishStep } from "@/app/actions";

/**
 * A version's number as he reads it (Character-Studio.md C19): `15.1`. Pure, so the bar, the versions and the probes
 * spell it one way.
 */
export const versionName = (v: Pick<CharacterVersion, "major" | "minor">) => `${v.major}.${v.minor}`;

/**
 * What a publish would make, counted from the latest version (`versions` newest first), not the one pages show: its
 * next minor, or the next major at .0. A character with none yet starts at 1.0 either way, as the database does.
 */
export function nextVersion(versions: readonly CharacterVersion[], step: PublishStep) {
  const latest = versions[0];
  if (!latest) return { major: 1, minor: 0 };
  return step === "minor" ? { major: latest.major, minor: latest.minor + 1 } : { major: latest.major + 1, minor: 0 };
}
