import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";

/**
 * ProfileCard (§9) — a face, a name and what they do. Large-format media: the picture is the whole card.
 *
 * Flat since v1 (2026-09-16). The card used to turn the bottom of its photograph to frosted glass and cast a
 * blurred bloom beneath itself; both went with the glass. What remains: the picture, a scrim in the ground's shade
 * fading upward under the words (the one legibility device — a plate behind the text was rejected twice), the grain
 * that is every card's material, and the words in white on top.
 *
 * The corner is a proportional 15%, so it is the same *shape* at 280px in a row and at 420px at the front of a deck.
 * Not a squircle: Chromium clips a composited descendant with a circular arc whatever `corner-shape` says, and an
 * overlay whose corner disagrees with the card's is worse than a slightly less continuous curve.
 *
 * `crop="cutout"` is for a photograph with no background: the figure stands on the hue's own wash, bottom-aligned,
 * with the grain over it — which is closer to this system than a rectangular photo ever gets.
 */
// `role` is a job title here and collides with the ARIA attribute, as it does on `Quote`. Omitted rather
// than renamed: "Software Engineer" IS their role, and any other word for it would read worse.
export interface ProfileCardProps extends Omit<ComponentPropsWithoutRef<"article">, "role"> {
  name: ReactNode;
  /** What they do. One line — it sits under the name at 0.8 its size. */
  role?: ReactNode;
  /** An `Image`, a `Blob`, a `Pattern` — whatever the face is. */
  media?: ReactNode;
  /** Fills the card when there is no media. */
  hue?: Hue;
  /** `fill` crops a photograph to the square; `cutout` stands a background-free figure on the hue wash. */
  crop?: "fill" | "cutout";
}

export function ProfileCard({ name, role, media, hue, crop = "fill", className, ...rest }: ProfileCardProps) {
  return (
    <article className={cx("noo-profile", `noo-profile--${crop}`, className)} data-hue={hue ?? "accent"} {...rest}>
      <div className="noo-profile__card">
        <div className="noo-profile__media">{media}</div>
        {/* the scrim under the words, then the grain — the card's own material — then the words */}
        <div className="noo-profile__scrim" aria-hidden="true" />
        <span className="noo-profile__sheen" aria-hidden="true" />
        <div className="noo-profile__words">
          <p className="noo-profile__name">{name}</p>
          {role ? <p className="noo-profile__role">{role}</p> : null}
        </div>
      </div>
    </article>
  );
}
