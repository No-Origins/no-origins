import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens";

/**
 * ProfileCard (§9) — a face, a name and what they do.
 *
 * A large-format media card: the picture is the whole card and the words sit on it, over a scrim rather than a
 * panel. The scrim is a gradient of the ground colour, not black — black over a peach photograph is a bruise.
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
}

export function ProfileCard({ name, role, media, hue, bloom = true, className, ...rest }: ProfileCardProps) {
  return (
    <article className={cx("noo-profile", className)} data-hue={hue} {...rest}>
      {bloom && media ? (
        <div className="noo-profile__bloom" aria-hidden="true">{media}</div>
      ) : null}
      <div className="noo-profile__card">
        <div className="noo-profile__media">{media}</div>
        <div className="noo-profile__words">
          <p className="noo-profile__name">{name}</p>
          {role ? <p className="noo-profile__role">{role}</p> : null}
        </div>
      </div>
    </article>
  );
}
