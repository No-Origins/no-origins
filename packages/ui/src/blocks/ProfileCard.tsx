import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens";

/**
 * ProfileCard (§9) — a face, a name and what they do.
 *
 * **A glass object holding a picture — where the picture itself turns to glass at the bottom.**
 *
 * Three corrections in one day, and the third is the one that explains the other two. The first version wore none
 * of §3's material. The second put the words on a `glass-2` plate and was rejected — "there is background behind
 * the text". The third took the plate away and was still wrong — "still don't have the glossy design".
 *
 * Both complaints are true at once, and the reference shows why: its shine is not a panel and not a highlight. The
 * lower half of the photograph is **blurred, brightened and slightly more saturated, with no edge anywhere** — the
 * picture becomes frosted glass as it goes down, and the words are already standing on it by the time they appear.
 * A plate has a boundary, so it reads as a thing placed on the photograph; a masked blur has none, so it reads as
 * the photograph's own surface. That is `__frost`, and it is the whole difference between the two rejections.
 *
 * On top of it the card keeps every §3 cue — the hairline, the lit top edge, the 118° sweep, the grain — and the
 * corner is a squircle wherever the browser has one, because the reference's corner runs too far along the edge to
 * be a circular arc.
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
        {/* The gloss: the picture a THIRD time, blurred and masked so its bottom turns to frosted glass with no
            edge anywhere. A cutout or a bare card leaves this empty, and `:empty` gives those a scrim instead. */}
        <div className="noo-profile__frost" aria-hidden="true">{crop === "fill" ? media : null}</div>
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
