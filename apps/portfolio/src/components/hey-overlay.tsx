"use client";

import { type SyntheticEvent, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Text } from "@no-origins/ui/components/text";

/** Where on the screen the avatar sat when it was clicked — its centre and its side, in viewport pixels. */
export type HeyOrigin = { x: number; y: number; size: number };

type HeyAvatar = { src: string; alt: string; initials: string };

// The word's size, which the face is measured in (em). His, 2026-09-24, against the first cut: the word 30% bigger
// (38vw → 49.4vw, cap 42rem → 54.6rem) and the face 30% smaller (30vw → 21vw, so 0.425 of the word). 100dvh only keeps
// the caps (0.89em) on a very wide, short box.
const HEY_SIZE = "clamp(7.8rem, min(49.4vw, 100dvh), 54.6rem)";
const FACE = 0.425;
// Points on the level, full-size word, in em from its centre — Anton at this leading and tracking, the same at every
// size (e2e/.mcp/hey-glyphs.mjs measures them). The face lands on one of them.
const H_E_SEAM = { x: -0.294, y: 0 };
const H_TOP = { x: -0.5435, y: -0.445 };
// The hair between a perched face and the letter under it, in em — the gap the stacked pass had.
const PERCH_GAP = 0.03;
// How long it holds once it has landed, in seconds, before it goes by itself (his, 2026-09-24: "close the overlay
// automatically after 1 second" — after a pass with no timer at all, and a first cut of 1.5 — then half a second less,
// taken here once the fall itself had no half second left to give).
const HOLD = 0.5;
// The tilts, in degrees (negative is counter-clockwise), his, 2026-09-24: the word's and the face's. All lean the same
// way. In the snap they are the wind-up and both come level on the slap; in the slap they are kept, and the word's is
// shallower there (his, the same day: "change the angle of text also to minus 15").
const HEY_TILT = -30;
const SLAP_TILT = -15;
const FACE_TILT = -10;

/**
 * Two motions on trial (his, 2026-09-24: "this is not replacing the existing animation … once we see this in action we
 * can take further decision"). The card plays them turn about; `REST` is where each leaves the word and the face.
 * - `snap` — the word pops up behind the face at −30° while the face leaps and tilts; both come level on the slap.
 * - `slap` — nothing turns: the word, 30% smaller, slaps onto the screen from behind it at −15°, then the face at −10°.
 */
export type HeyMotion = "snap" | "slap";
export const HEY_MOTIONS: readonly HeyMotion[] = ["slap", "snap"];
// The word's `x` moves it off the centre, as a share of the viewport's width. The face lands on its `seat`, a point on
// the word, so it turns and scales with the word and sits in the same place on it at every size; a `perch`ed face sits
// on top of that point — lifted along the word's up by its own radius and a hair — rather than over it.
type Rest = {
  word: { scale: number; rotation: number; x: number };
  face: { rotation: number; seat: { x: number; y: number }; perch: boolean };
};
const REST: Record<HeyMotion, Rest> = {
  snap: { word: { scale: 1, rotation: 0, x: 0 }, face: { rotation: 0, seat: H_E_SEAM, perch: false } },
  // 70% — his, 2026-09-24: at full size a tilted word runs off the top and bottom of the screen. They sat too much on
  // each other: the word went 10% right, and the face — after a pass 30% up and left, "too far" — sits "just above H".
  slap: { word: { scale: 0.7, rotation: SLAP_TILT, x: 0.1 }, face: { rotation: FACE_TILT, seat: H_TOP, perch: true } },
};

/**
 * The avatar's "HEY!" — the portfolio's one bit of mischief (his ask, 2026-09-24: the avatar "pops out and slaps on
 * the screen", then the word fills it). An app-specific island: the flung face is the design system's `Avatar` in one
 * of the HEY faces the card picks at random (`profile.heyFaces`), the word is a `Text` wearing the app's own display
 * font (`--font-display`, Anton); nothing here is hand-rolled but the motion, which is GSAP — the same choice the grid
 * made for what lives inside a box (packages/ui rule 7).
 *
 * It renders through a portal to `document.body`, because a slot on the grid clips (Slots.md) and this has to cover the
 * whole field. The face leaps out of the card onto the seam between the word's H and E, and lands in front of the word
 * with a squash and a screen-shake; `motion` picks how the rest of it goes (`HeyMotion`). Reduced motion skips straight
 * to the held frame.
 *
 * It holds for `HOLD` once it has landed, then goes by itself; a click anywhere takes it down sooner, or Escape, the
 * keyboard's way out, since the overlay itself takes no focus. It goes by falling off, like a sticker coming off the
 * glass — nothing fades. While it is up the page behind does not turn: the portal still bubbles React's
 * wheel and touch events to `GridPages`, and a turn would unmount the card and this with it.
 */
export function HeyOverlay({
  origin,
  avatar,
  motion,
  onDone,
}: {
  origin: HeyOrigin;
  avatar: HeyAvatar;
  motion: HeyMotion;
  onDone: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  // The arrival, so a click that comes before it has finished can stop it and fall from wherever it got to.
  const arrivalRef = useRef<gsap.core.Timeline | null>(null);

  // onDone through a ref so a click or Escape always calls the latest without re-running the effect.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const dismissingRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    const done = () => onDoneRef.current();
    const backdrop = backdropRef.current;
    const text = textRef.current;
    const clone = cloneRef.current;
    if (!backdrop || !text || !clone) return done();
    arrivalRef.current?.kill();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    // It falls off like a sticker coming off (his, 2026-09-24: "it should not fade"). The veil goes at once, so the two
    // come off over the page itself; each tips at an edge as it peels, then drops off the bottom under gravity, swinging
    // as it goes — the face first, being on top, the word a beat behind it.
    gsap.set(backdrop, { autoAlpha: 0 });
    const drop = `+=${window.innerHeight * 1.3}`;
    const fall = gsap.timeline({ onComplete: done });
    // 0.23s in all — his, the same day: the first cut's 0.73s less half a second, every beat scaled alike.
    fall.to(clone, { rotation: "-=6", y: "-=10", duration: 0.03, ease: "power1.out" }, 0);
    fall.to(clone, { rotation: "+=40", x: "+=40", y: drop, duration: 0.17, ease: "power2.in" }, 0.03);
    fall.to(text, { rotation: "-=4", y: "-=10", duration: 0.03, ease: "power1.out" }, 0.025);
    fall.to(text, { rotation: "+=18", x: "-=30", y: drop, duration: 0.175, ease: "power2.in" }, 0.055);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const shake = shakeRef.current;
    const backdrop = backdropRef.current;
    const text = textRef.current;
    const clone = cloneRef.current;
    const frame = frameRef.current;
    if (!root || !shake || !backdrop || !text || !clone || !frame) return;

    const rest = REST[motion];
    const vh = window.innerHeight;
    const word = { scale: rest.word.scale, rotation: rest.word.rotation, x: rest.word.x * window.innerWidth, y: 0 };
    // The face lands on its seat on the word: the point, in the word's frame (em, scaled with the word; a perched face
    // lifted by its radius and a hair), turned about the word's centre — the frame's, moved by the word's x — and grows
    // to its side there. The frame is measured, not the word, whose pose a previous run may have left on it.
    const box = frame.getBoundingClientRect();
    const em = parseFloat(getComputedStyle(frame).fontSize);
    const side = FACE * em;
    const cx = box.left + box.width / 2 + word.x;
    const cy = box.top + box.height / 2;
    const ox = rest.face.seat.x * em * word.scale;
    const oy = rest.face.seat.y * em * word.scale - (rest.face.perch ? side / 2 + PERCH_GAP * em : 0);
    const turn = (word.rotation * Math.PI) / 180;
    const faceX = cx + ox * Math.cos(turn) - oy * Math.sin(turn);
    const faceY = cy + ox * Math.sin(turn) + oy * Math.cos(turn);
    // Then the pair — the turned word's box and the face — is centred down the frame as one, so a face perched on a
    // high letter does not leave the top of the screen (the H at −15° put it there, 2026-09-24). A face inside the
    // word's box, as in the snap, moves nothing. The word's box is its layout box, which no transform touches.
    const halfW = (text.offsetWidth * word.scale) / 2;
    const halfH = (text.offsetHeight * word.scale) / 2;
    const reach = halfW * Math.abs(Math.sin(turn)) + halfH * Math.cos(turn);
    const top = Math.min(cy - reach, faceY - side / 2);
    const bottom = Math.max(cy + reach, faceY + side / 2);
    word.y = cy - (top + bottom) / 2;
    const dx = faceX - origin.x;
    const dy = faceY + word.y - origin.y;
    const scale = side / origin.size;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(root, { autoAlpha: 1 });
    gsap.set(clone, { x: 0, y: 0, scale: 1, rotation: 0, transformOrigin: "50% 50%" });

    if (reduce) {
      gsap.set(backdrop, { autoAlpha: 1 });
      gsap.set(clone, { x: dx, y: dy, scale, rotation: rest.face.rotation });
      gsap.set(text, { autoAlpha: 1, ...word, transformOrigin: "50% 50%" });
      const auto = gsap.delayedCall(HOLD, dismiss);
      return () => auto.kill();
    }

    gsap.set(backdrop, { autoAlpha: 0 });

    // Snappier since his third pass (2026-09-24): every beat about 30% shorter than the first cut.
    const shakeTl = gsap
      .timeline({ paused: true })
      .to(shake, { x: -14, y: 8, duration: 0.035 })
      .to(shake, { x: 11, y: -6, duration: 0.035 })
      .to(shake, { x: -8, y: 4, duration: 0.035 })
      .to(shake, { x: 5, y: -2, duration: 0.035 })
      .to(shake, { x: 0, y: 0, duration: 0.04 });

    const tl = gsap.timeline();
    arrivalRef.current = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: 0.15, ease: "power1.out" }, 0);

    if (motion === "snap") {
      gsap.set(text, { autoAlpha: 0, y: word.y, scale: 0.55, rotation: HEY_TILT, transformOrigin: "50% 50%" });
      // Pop out: leap toward its seat and a touch above it, tilt, and overshoot the size — the wind-up.
      tl.to(clone, { x: dx, y: dy - vh * 0.06, scale: scale * 1.18, rotation: FACE_TILT, duration: 0.24, ease: "power3.out" }, 0);
      // Meanwhile the word pops up behind the face, still tilted, and is full size by the slap.
      tl.to(text, { autoAlpha: 1, scale: 1, duration: 0.19, ease: "back.out(2)" }, 0.05);
      tl.addLabel("slap", 0.24);
      // Slap: slam down onto the glass, fast and heavy — and the word snaps level on the same tween.
      tl.to(clone, { y: dy, scale, rotation: 0, duration: 0.1, ease: "power4.in" }, "slap");
      tl.to(text, { rotation: 0, duration: 0.1, ease: "power4.in" }, "slap");
      // Splat on contact, then settle — the impact reads in the squash, not a scale of the word.
      tl.to(clone, { scaleX: scale * 1.16, scaleY: scale * 0.84, duration: 0.05, ease: "power2.out" }, "slap+=0.1");
      tl.to(clone, { scaleX: scale, scaleY: scale, duration: 0.35, ease: "elastic.out(1, 0.45)" }, ">");
      // On the slam, shake the whole screen.
      tl.add(() => shakeTl.restart(), "slap+=0.1");
    } else {
      // Nothing turns: each is at its angle from the first frame to the last. And each slaps onto the screen from behind
      // it — his, 2026-09-24: "instead of scaling down, it should scale up", after a pass where they fell onto it from
      // above: it grows toward the glass, faster and faster, and sticks there at its size — no overshoot, no spring
      // back ("it should just stick to the screen … no bounce or anything"). Each hit shakes the screen.
      gsap.set(clone, { rotation: rest.face.rotation });
      gsap.set(text, { autoAlpha: 0, x: word.x, y: word.y, scale: word.scale * 0.35, rotation: word.rotation, transformOrigin: "50% 50%" });
      // The word first.
      tl.to(text, { autoAlpha: 1, duration: 0.06, ease: "none" }, 0.02);
      tl.to(text, { scale: word.scale, duration: 0.16, ease: "power4.in" }, 0.02);
      tl.add(() => shakeTl.restart(), 0.18);
      // Then the face, on top: out of the card to its seat, still short of its size, then up onto the glass.
      tl.to(clone, { x: dx, y: dy, scale: scale * 0.55, duration: 0.2, ease: "power3.out" }, 0.04);
      tl.to(clone, { scale, duration: 0.1, ease: "power4.in" }, 0.24);
      tl.add(() => shakeTl.restart(), 0.34);
    }

    // The hold starts when the last tween ends: the snap's settle runs well past its slap, and a second counted from the
    // click would leave it almost none.
    const auto = gsap.delayedCall(tl.duration() + HOLD, dismiss);

    return () => {
      tl.kill();
      shakeTl.kill();
      auto.kill();
    };
  }, [origin, motion, dismiss]);

  // Keys stop here while it is up — caught on the way down, before the grid's ← → on `window` can turn the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dismiss]);

  const hold = (e: SyntheticEvent) => e.stopPropagation();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      aria-hidden="true"
      onClick={dismiss}
      onWheel={hold}
      onTouchStart={hold}
      onTouchMove={hold}
      onTouchEnd={hold}
      onTouchCancel={hold}
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden opacity-0"
    >
      <div ref={shakeRef} className="absolute inset-0">
        <div ref={backdropRef} className="absolute inset-0 bg-background" />
        {/* The word, centred in its frame, whose font size is the em the seats are measured in. The leading is Anton's
            cap height, so the line box is the letters and its centre is theirs. Normal tracking: the display role's tight
            tracking ran the E into the Y. */}
        <div ref={frameRef} className="absolute inset-0 flex items-center justify-center" style={{ fontSize: HEY_SIZE }}>
          <div ref={textRef}>
            <Text
              role="display"
              align="center"
              className="text-[1em] leading-[0.89] tracking-normal uppercase whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {/* His colours, 2026-09-24 — tokens in the package's globals.css (packages/ui rule 2). */}
              <span className="text-lime">Hey</span>
              <span className="text-violet">!</span>
            </Text>
          </div>
        </div>
        <div
          ref={cloneRef}
          className="fixed"
          style={{ left: origin.x - origin.size / 2, top: origin.y - origin.size / 2, width: origin.size, height: origin.size }}
        >
          <Avatar className="size-full">
            <AvatarImage src={avatar.src} alt="" className="bg-muted" />
            <AvatarFallback>{avatar.initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>,
    document.body
  );
}
