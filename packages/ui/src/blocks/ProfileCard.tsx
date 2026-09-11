import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens";

/**
 * ProfileCard (§9) — a face, a name and what they do.
 *
 * **A glass object holding a picture — with the words on the picture, not on a plate.**
 *
 * Two corrections in one day, and the settled answer is the middle of them. The first version was the reference's
 * language and wore none of §3's material. The second put the words on a `glass-2` plate, which read as ours but
 * stopped being the thing Bhargav asked for: "there is background behind the text". So the card keeps every
 * material cue — the hairline, the lit top edge, the 118° sweep, the grain — and the words sit **directly on the
 * photograph**, white, held legible by a shadow rather than by a panel.
 *
 * That is the honest split: the *card* is ours, the *type treatment* is the reference's, and nothing pretends
 * the two were ever the same decision.
 *
 * `crop="cutout"` is for a photograph with no background: the figure stands on the hue's own wash, bottom-aligned,
 * with the grain over it — which is closer to this system than a rectangular photo ever gets.
 *
 * **It renders its media twice.** The second copy is `aria-hidden`, heavily blurred and scaled beneath the card:
 * the bloom of light the picture casts on the surface under it. That is what makes a deck of these read as
 * objects on a surface rather than rectangles in a row, and it costs one duplicated node instead of a colour
 * extraction — the picture already knows what colour it is.
 */
// `role` is a job title here and collides with the ARIA attribute, as it does on `Quote`. Omitted rather
// than renamed: "Software Engineer" IS their role, and any other word for it would read worse.
export interface ProfileCardProps extends Omit<ComponentPropsWithoutRef<"article">, "role"> {
  name: ReactNode;
  /** What they do. One line — it sits under the name at 0.8 its size. */
  role?: ReactNode;
  /** An `Image`, a `Blob`, an `Illustration` — whatever the face is. */
  media?: ReactNode;
  /** Fills the card when there is no media, and tints the bloom. */
  hue?: Hue;
  /** Off for a card on a surface that already has its own light. */
  bloom?: boolean;
  /** `fill` crops a photograph to the square; `cutout` stands a background-free figure on the hue wash. */
  crop?: "fill" | "cutout";
}

export function ProfileCard({ name, role, media, hue, bloom = true, crop = "fill", className, ...rest }: ProfileCardProps) {
  return (
    <article className={cx("noo-profile", `noo-profile--${crop}`, className)} data-hue={hue} {...rest}>
      {bloom && media ? (
        <div className="noo-profile__bloom" aria-hidden="true">{media}</div>
      ) : null}
      <div className="noo-profile__card">
        <div className="noo-profile__media">{media}</div>
        {/* the sheen and the grain sit ABOVE the picture and below the words — the card's own material (§3) */}
        <span className="noo-profile__sheen" aria-hidden="true" />
        <div className="noo-profile__words">
          <p className="noo-profile__name">{name}</p>
          {role ? <p className="noo-profile__role">{role}</p> : null}
        </div>
      </div>
    </article>
  );
}
