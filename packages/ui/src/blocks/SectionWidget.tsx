import type { ReactNode } from "react";
import { Bento, BentoCell, BentoFigure } from "../primitives/Bento";
import { IllustrationCanvas } from "../illustrations/Illustration";
import { illo, type Family } from "../illustrations/generator";
import type { Hue } from "../tokens";
import { cx } from "../cx";

/**
 * SectionWidget — one section of the portfolio as a bento widget (Design-System.md §8.3–8.4).
 *
 * The ring is six of these. Each one previews a section from about twice the reading distance, which is why its
 * type is roughly double and why the figure has to survive all the way down to the 0.27 overview.
 *
 * It exists because the six widgets were six hand-written grids, and three rules that every one of them has to
 * obey were being re-typed rather than enforced:
 *
 * 1. **One loud cell per widget**, 2 × 2, carrying the hue. Everything else recedes. A second loud cell is how a
 *    widget stops reading as one thing at map size.
 * 2. **The diagonal**: the mono label top-left, the figure or word bottom-left, the illustration across the cell.
 *    That diagonal is the one thing taken wholesale from the reference (Illustrations.md §2).
 * 3. **The illustration is a FIELD** — it crosses the whole cell and leaves through its edges (principle 7), and
 *    it is drawn by the one generator, so every section is the same kind of picture with different parameters.
 *
 * What stays the caller's: everything after the loud cell, because that is where a section says what it is.
 *
 * `Me` has no illustration and no figure — its picture is the blob (Brand.md §9), so both props are optional.
 */
export interface SectionWidgetProps {
  hue: Hue;
  /** Names the group for assistive tech — "Work experience", not "work". */
  label: string;
  /** The mono label in the loud cell, top-left. Lower case, the section's own word. */
  eyebrow: string;
  /**
   * A number or short word as image, bottom-left. Honest counts only (principle 8): `4` roles, `0` shipped yet.
   * Where nothing is countable, pass `word` instead — inventing a number to fill the slot is the failure mode.
   */
  figure?: { value: string; label: string; size?: "lg" | "md" };
  /** Used instead of `figure` when a section has nothing to count. Two short lines read best. */
  word?: ReactNode;
  /**
   * The field illustration (Illustrations.md §6.0a). `words` must be MEASURED off the rendered cell, never
   * estimated — `node e2e/.mcp/words.mjs` prints them — because a line that crosses a glyph fails principle 7.
   */
  illustration?: Family;
  /** Names the drawing for `probe11` and `probe10`. Omit outside a fixture. */
  illustrationId?: string;
  /** The rest of the widget: whatever this section has to say. */
  children: ReactNode;
  className?: string;
}

export function SectionWidget({
  hue, label, eyebrow, figure, word, illustration, illustrationId, children, className,
}: SectionWidgetProps) {
  return (
    <Bento hue={hue} label={label} className={cx(className)}>
      <BentoCell span={[2, 2]} tone="fill">
        <p className="noo-label">{eyebrow}</p>
        {figure ? <BentoFigure value={figure.value} label={figure.label} size={figure.size} /> : null}
        {!figure && word ? <p className="noo-bento__word">{word}</p> : null}
        {illustration ? (
          <IllustrationCanvas
            hue={hue}
            data-ill={illustrationId}
            preserveAspectRatio="xMidYMid slice"
            className="noo-bento__ill noo-bento__ill--field"
          >
            {(line) =>
              illo(illustration).flatMap((runs, i) =>
                runs.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />),
              )
            }
          </IllustrationCanvas>
        ) : null}
      </BentoCell>
      {children}
    </Bento>
  );
}
