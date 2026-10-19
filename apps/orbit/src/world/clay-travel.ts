import * as THREE from "three/webgpu";
import type { HumanPose } from "@no-origins/ui/lib/human-motion";
import { HUMAN_JOINTS, readHumanMotion } from "@no-origins/ui/lib/human-motion";
import { motionMs, motionNumber } from "@no-origins/ui/lib/motion";
import type { BuiltHuman } from "./build-human";
import { figureStanding, figureStep, gazeAt, poseOf, turnBetween, withGaze, type HumanConfig } from "./human";
import {
  flightBodyMoving, flightBodyStill, flightStanding, groundedFlight, kickFlightBody, readClayFlightMotion, squashOf,
  stepClayFlight, stepFlightBody, withFlightBody, type ClayFlightMode,
} from "./human-flight";
import { CLAY_INPUT, followsCursor, type ClayInput } from "./clay-input";

const RAD = Math.PI / 180;

/**
 * Reuses Clay's existing rig, gait sampler and interruptible flight poses (W106–W108). In the air it carries momentum:
 * it eases up to speed, coasts into a glide when the keys let go, turns along its path and banks into the turn,
 * launches with a push and lands with a flare and a squash.
 */
export function clayTravel(canvas: HTMLCanvasElement, human: BuiltHuman, config: HumanConfig,
  camera: THREE.Camera, requestDraw: () => void, canStand: (x: number, z: number, feet: number) => boolean,
  follow: (dx: number, dz: number) => void, floorAt: (x: number, z: number, from: number) => number,
  dock?: { x: number; z: number; radius: number; pose: HumanPose }, surfaceTarget?: () => THREE.Vector3 | null) {
  let docked = false, dockReady = true;
  let settling: { x: number; z: number; heading: number; pose: HumanPose; elapsed: number } | null = null;
  const settleTime = motionMs(canvas, "--motion-human-podium-settle", 850);
  const held = new Set<string>();
  let walkTarget: THREE.Vector3 | null = null;
  let autoAir = false, autoHeight = 0;
  const autoClearance = motionNumber(canvas, "--motion-human-auto-clearance", 0.8);
  const autoLookAhead = motionNumber(canvas, "--motion-human-auto-lookahead", 1.2);
  let lastWalkTap = -Infinity;
  const walkTapTime = motionMs(canvas, "--motion-human-walk-tap", 300);
  const cursor = new THREE.Vector2();
  const gazeRay = new THREE.Raycaster();
  let hasCursor = false, followCursor = followsCursor();
  let headDown = 0, headLeft = 0;
  const gazeTime = motionMs(canvas, "--motion-human-gaze-response", 180);
  const cursorMove = (event: PointerEvent) => {
    if(event.pointerType === "touch")return;
    const rect=canvas.getBoundingClientRect();
    cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    hasCursor=true; requestDraw();
  };
  const cursorLeave = () => { hasCursor=false; requestDraw(); };
  const motion = readHumanMotion(canvas), flightMotion = readClayFlightMotion(canvas);
  const jumpHeight = motionNumber(canvas, "--motion-human-jump-height", 1.2);
  const gravity = motionNumber(canvas, "--motion-human-gravity", 9.81);
  const tap = motionMs(canvas, "--motion-human-fly-tap", 300);
  const rise = motionNumber(canvas, "--motion-human-fly-rise", 6);
  const pace = motionNumber(canvas, "--motion-human-clearing-walk", 1.4);
  const run = motionNumber(canvas, "--motion-human-clearing-run", 4);
  const fly = motionNumber(canvas, "--motion-human-clearing-fly", 5);
  // The air's feel, starting values for his tuning (`--motion-human-clay-*`, read with fallbacks, M3):
  const air = (name: string, fallback: number) => motionNumber(canvas, `--motion-human-clay-${name}`, fallback);
  const speedUp = air("fly-accel", 0.45);     // s: how long it takes to come up to speed, as a time constant
  const coast = air("fly-coast", 1.5);        // s: how long its speed carries once the keys let go
  const launch = air("launch", 3.2);          // m/s: the push off the ground as it takes off
  const liftTo = air("takeoff-lift", 1.1);    // m: the height it settles at after taking off from the ground
  const floatHz = air("float-hz", 0.9);       // the spring that holds its height when no key climbs or sinks it
  const floatDamping = air("float-damping", 0.7);
  const floatLead = air("float-lead", 0.12);  // s: let go of a climb, it settles about this far on along its way
  const flare = air("flare", 1.6);            // m: under this it slows its descent, legs under it, to land
  const turnHz = air("turn-hz", 0.9);         // the spring that turns it to face the way it flies
  const turnDamping = air("turn-damping", 0.85);
  const glideOver = air("glide-over", 1.4);   // m/s: let go faster than this and it glides, until it slows under half
  const start = human.object.position.clone();
  const startYaw = human.object.rotation.y;
  let figure = figureStanding(THREE.MathUtils.radToDeg(Math.PI - human.object.rotation.y));
  let flightState = flightStanding(), body = flightBodyStill(), flying = false, gliding = false;
  // Altitude of the feet over the start, its vertical speed, the height a released climb settles at, and the flight's
  // horizontal velocity (m/s) and turning rate (deg/s); the launch's flare of the jets fades over a moment.
  let y = 0, vy = 0, hold = 0, vx = 0, vz = 0, yawRate = 0, ignite = 0, lastSpace = -Infinity;
  // The Space that took it off does not climb until it has been let go; `steering` is the last climb's direction.
  let armed = true, steering = 0;
  let was: readonly [number, number] = [0, 0];
  const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space"]);
  const shift = () => held.has("ShiftLeft") || held.has("ShiftRight");
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cancelAuto = () => {
    walkTarget = null;
    if (autoAir) { flying = gliding = false; vx = vz = 0; }
    autoAir = false;
  };
  const reset = () => {
    follow(start.x - human.object.position.x, start.z - human.object.position.z);
    human.object.position.copy(start); human.object.rotation.y = startYaw; human.object.scale.setScalar(1);
    figure = figureStanding(THREE.MathUtils.radToDeg(Math.PI - startYaw));
    flightState = flightStanding(); body = flightBodyStill(); flying = gliding = false;
    y = vy = hold = vx = vz = yawRate = ignite = steering = 0; lastSpace = -Infinity; was = [0, 0]; armed = true;
    docked = false; dockReady = true; settling = null;
    cancelAuto(); lastWalkTap = -Infinity;
    held.clear(); human.pose({}, 0); human.flight(null); requestDraw();
  };
  const toggleFlight = () => {
    cancelAuto();
    docked = false; dockReady = false; settling = null;
    const at = human.object.position;
    flying = !flying;
    if (flying) {
      // Take off: a push up (on top of a jump already under way), a flare of the jets and a stretch of the clay; the
      // height spring then catches it a little over where it settles, and it floats down onto that height.
      const support = floorAt(at.x, at.z, y);
      hold = Math.max(support + liftTo, y + 0.35);
      armed = !held.has("Space"); steering = 0;
      if (reduced()) { y = hold; vy = 0; }
      else { vy = Math.max(vy, launch); ignite = 1; body = kickFlightBody(body, { stretch: 1 }); }
    } else gliding = false; // Let go in the air, it keeps its vertical speed and falls.
    requestDraw();
  };
  let bagOpen = false, visorOpen = false;
  function input(value: ClayInput) {
    if ("action" in value && value.action === "bag") { bagOpen = value.open; held.clear(); cancelAuto(); lastSpace = -Infinity; requestDraw(); return; }
    if ("action" in value && value.action === "visor") { visorOpen = value.open; held.clear(); cancelAuto(); lastSpace = -Infinity; requestDraw(); return; }
    if (bagOpen || visorOpen) return;
    if ("action" in value) {
      if (value.action === "follow-cursor") { followCursor=value.enabled; if (!followCursor) cancelAuto(); requestDraw(); }
      else if (value.action === "auto-walk") {
        const target = surfaceTarget?.();
        if (followCursor && target && !flying) {
          walkTarget = target.clone();
          // Sample the whole direct route against the same finite-height colliders as manual travel.
          // Retain the destination while climbing, crossing the obstruction and landing.
          const from = human.object.position;
          const distance = Math.hypot(target.x - from.x, target.z - from.z);
          const samples = Math.max(1, Math.ceil(distance / 0.25));
          autoHeight = y;
          for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const x = THREE.MathUtils.lerp(from.x, target.x, t), z = THREE.MathUtils.lerp(from.z, target.z, t);
            autoHeight = Math.max(autoHeight, floorAt(x, z, Infinity) + autoClearance);
          }
          docked = false; dockReady = false; settling = null;
          held.clear(); requestDraw();
        }
      }
      else if (value.action === "reset") reset(); else toggleFlight();
      return;
    }
    if (!codes.has(value.code)) return;
    if (value.pressed) {
      if (held.has(value.code)) return;
      if (value.code === "KeyW") {
        const now = performance.now();
        if (now - lastWalkTap <= walkTapTime && followCursor && surfaceTarget?.() && !flying) {
          lastWalkTap = -Infinity;
          input({ action: "auto-walk" });
          return;
        }
        lastWalkTap = now;
      } else lastWalkTap = -Infinity;
      if (docked && value.code !== "ShiftLeft" && value.code !== "ShiftRight") { docked = false; dockReady = false; settling = null; }
      cancelAuto();
      held.add(value.code);
      if (value.code === "Space") {
        const now = performance.now();
        if (now - lastSpace <= tap) { toggleFlight(); lastSpace = -Infinity; }
        else { if (!flying && y <= floorAt(human.object.position.x,human.object.position.z,y)+0.001 && !reduced()) vy = Math.sqrt(2 * gravity * jumpHeight); lastSpace = now; }
      }
    } else {
      held.delete(value.code);
      if (value.code === "Space") armed = true;
    }
    requestDraw();
  }
  const busy = (event: KeyboardEvent) => event.target instanceof HTMLElement && (!!event.target.closest("input, textarea, select, [contenteditable=true]") || (event.code === "Space" && !!event.target.closest("button")));
  const down = (event: KeyboardEvent) => {
    if (bagOpen || visorOpen || event.metaKey || event.ctrlKey || event.altKey || busy(event) || !codes.has(event.code)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.repeat) return;
    input({ code: event.code, pressed: true });
  };
  const up = (event: KeyboardEvent) => {
    if (!codes.has(event.code)) return;
    // Match keydown's guard so Space can activate focused controls and dialog buttons.
    if (!bagOpen && !visorOpen && !busy(event) && !event.metaKey && !event.ctrlKey && !event.altKey) event.preventDefault();
    input({ code: event.code, pressed: false });
  };
  const clear = () => { held.clear(); cancelAuto(); lastWalkTap = -Infinity; requestDraw(); };
  const doubleClick = (event: MouseEvent) => { if (event.button === 0) input({ action: "auto-walk" }); };
  canvas.addEventListener("dblclick", doubleClick);
  const visibility = () => { if (document.hidden) clear(); };
  const control = (event: Event) => input((event as CustomEvent<ClayInput>).detail);
  canvas.addEventListener("pointermove",cursorMove);
  canvas.addEventListener("pointerleave",cursorLeave);
  window.addEventListener("blur",cursorLeave);
  window.addEventListener("keydown", down, true); window.addEventListener("keyup", up);
  window.addEventListener("blur", clear); window.addEventListener(CLAY_INPUT, control);
  document.addEventListener("visibilitychange", visibility);
  return {
    get atPodium() { return docked; },
    step(dt: number, reduced: boolean) {
      const seconds = dt / 1000;
      let x = Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft"));
      let z = Number(held.has("KeyS") || held.has("ArrowDown")) - Number(held.has("KeyW") || held.has("ArrowUp"));
      const length = Math.hypot(x, z);
      if (length) { x /= length; z /= length; }
      const forward = camera.getWorldDirection(new THREE.Vector3()); forward.y = 0; forward.normalize();
      const cursorGoal = followCursor ? surfaceTarget?.() : null;
      if (!flying && cursorGoal && z < 0) {
        const towards = cursorGoal.clone().sub(human.object.position); towards.y = 0;
        if (towards.length() > 0.2) forward.copy(towards.normalize());
        else z = 0;
      }
      const right = forward.clone().cross(new THREE.Vector3(0, 1, 0));
      const wish = right.multiplyScalar(x).addScaledVector(forward, -z);
      const at = human.object.position;
      const goal = walkTarget ?? (!flying && z < 0 ? cursorGoal : null);
      const walkSpeed = walkTarget || shift() ? run : pace;
      if (walkTarget) {
        wish.copy(walkTarget).sub(at); wish.y = 0;
        if (wish.length() <= 0.2) {
          wish.set(0, 0, 0);
          if (!autoAir) cancelAuto();
        }
        else wish.normalize();
      }
      if (walkTarget && !autoAir) {
        const ahead = Math.min(autoLookAhead, Math.hypot(walkTarget.x - at.x, walkTarget.z - at.z));
        if (!canStand(at.x + wish.x * ahead, at.z + wish.z * ahead, y)) {
          autoAir = flying = true; gliding = false;
          hold = autoHeight; ignite = 1; vy = Math.max(vy, launch);
          body = kickFlightBody(body, { stretch: 1 });
        }
      }
      const autoLanding = !!walkTarget && autoAir && Math.hypot(walkTarget.x - at.x, walkTarget.z - at.z) <= 0.2;
      const autoRising = autoAir && y < autoHeight - 0.15 && !autoLanding;
      let delta: THREE.Vector3;
      if (flying) {
        // Momentum: the velocity eases toward where the keys point, quicker to speed up than to slow down.
        const ease = reduced ? 1 : 1 - Math.exp(-seconds / (length || walkTarget ? speedUp : coast));
        vx += (wish.x * fly - vx) * ease; vz += (wish.z * fly - vz) * ease;
        if (!length && !walkTarget && Math.hypot(vx, vz) < 0.02) vx = vz = 0;
        if (autoRising || autoLanding) vx = vz = 0;
        delta = new THREE.Vector3(vx * seconds, 0, vz * seconds);
        if (walkTarget) {
          const remaining = Math.max(0, Math.hypot(walkTarget.x - at.x, walkTarget.z - at.z) - 0.15);
          if (delta.length() > remaining) delta.setLength(remaining);
        }
      } else {
        vx = vz = 0;
        delta = wish.multiplyScalar(walkSpeed * seconds);
        if (goal) {
          const remaining = Math.max(0, Math.hypot(goal.x - at.x, goal.z - at.z) - 0.15);
          if (delta.length() > remaining) delta.setLength(remaining);
        }
      }
      let dx = canStand(at.x + delta.x, at.z, y) ? delta.x : 0;
      let dz = canStand(at.x + dx, at.z + delta.z, y) ? delta.z : 0;
      if (walkTarget && (dx !== delta.x || dz !== delta.z)) dx = dz = 0;
      // Against a screen, an agent or a stone it stops that way, and slides along it the other.
      if (dx !== delta.x) vx = 0;
      if (dz !== delta.z) vz = 0;
      at.x += dx; at.z += dz; follow(dx, dz);
      // Auto travel waits for altitude rather than sliding sideways into another blocker.
      const climb = autoAir ? autoLanding ? -1 : 0 : Number(armed && held.has("Space")) - Number(shift());
      let support = floorAt(at.x, at.z, y);
      let landed = 0;
      if (flying) {
        // In the air it turns to face the way it is flying, on a spring, so it curves through a turn; hovering it
        // keeps the way it faced. The spring's rate is what banks it.
        const speed = Math.hypot(vx, vz);
        const wanted = speed > 0.35 ? Math.atan2(vx, -vz) / RAD : figure.heading;
        const away = turnBetween(figure.heading, wanted);
        if (reduced) { yawRate = 0; figure = { ...figure, heading: wanted }; }
        else {
          const w = 2 * Math.PI * turnHz;
          for (let left = seconds; left > 0; left -= 1 / 240) {
            const h = Math.min(left, 1 / 240);
            yawRate += (w * w * turnBetween(figure.heading, wanted) - 2 * turnDamping * w * yawRate) * h;
            figure = { ...figure, heading: figure.heading + yawRate * h };
          }
          if (Math.abs(away) < 0.05 && Math.abs(yawRate) < 0.5) { figure = { ...figure, heading: wanted }; yawRate = 0; }
        }
        figure = figureStep(figure, config, motion, [0, 0], dt, reduced, figure.heading).figure;
        // Up and down: a held key climbs or sinks it (sinking slower near the ground, to land), and let go, a spring
        // holds the height it was at, so a climb overshoots a little and floats back.
        const gap = y - support;
        const ease = (tau: number) => reduced ? 1 : 1 - Math.exp(-seconds / tau);
        if (!climb && steering) hold = y + (reduced ? 0 : vy * floatLead);
        steering = climb;
        if (climb > 0) { vy += (rise - vy) * ease(0.25); hold = y; }
        else if (climb < 0) { vy += (-rise * Math.min(1, Math.max(0.18, gap / flare)) - vy) * ease(0.2); hold = y; }
        else {
          hold = autoAir ? autoHeight : Math.max(hold, support + flightMotion.hoverHeight);
          if (reduced) { vy = 0; y = Math.max(y, hold); }
          else {
            const w = 2 * Math.PI * floatHz;
            vy += (w * w * (hold - y) - 2 * floatDamping * w * vy) * seconds;
          }
        }
        y += vy * seconds;
        const ceiling = autoAir ? Math.max(10, autoHeight + autoClearance) : 10;
        if (y > ceiling) { y = ceiling; vy = Math.min(vy, 0); hold = Math.min(hold, ceiling); }
        support = floorAt(at.x, at.z, Math.max(y, support));
        if (y <= support) {
          y = support;
          if (climb < 0) { landed = -vy; flying = gliding = false; vy = 0; vx = vz = 0; if (autoAir) cancelAuto(); }
          else vy = Math.max(vy, 0);
        }
      } else {
        yawRate = 0;
        const next = figureStep(figure, config, motion, [dt ? dx / dt : 0, dt ? dz / dt : 0], dt, reduced, undefined, walkTarget || shift() ? "run" : "walk");
        figure = next.figure;
        if (y < support) y = support;
        if (y > support + 0.001 || vy > 0) {
          vy -= gravity * seconds;
          y = Math.max(support, y + vy * seconds);
          if (y === support) { landed = -vy; vy = 0; }
        }
      }
      if (landed > 0.5 && !reduced) body = kickFlightBody(body, { impact: landed });

      const speed = Math.hypot(vx, vz);
      gliding = flying && !length && speed > (gliding ? glideOver / 2 : glideOver);
      const nearGround = climb < 0 && y - support < flare;
      const mode: ClayFlightMode | null = !flying ? null
        : nearGround ? "hover"
        : length || walkTarget ? climb < 0 ? "glide" : "boost"
        : gliding ? "glide" : "hover";
      const ground = poseOf(figure, motion);
      flightState = stepClayFlight(flightState, mode, dt, flightMotion, groundedFlight(ground.pose), reduced);

      // The body's secondary motion, from how its travel changed over this step, in its own frame.
      const moved: readonly [number, number] = flying ? [vx, vz] : [seconds ? dx / seconds : 0, seconds ? dz / seconds : 0];
      const ax = seconds ? (moved[0] - was[0]) / seconds : 0, az = seconds ? (moved[1] - was[1]) / seconds : 0;
      was = moved;
      const h = figure.heading * RAD;
      body = stepFlightBody(body, {
        air: flying ? 1 : 0,
        ahead: ax * Math.sin(h) - az * Math.cos(h), side: ax * Math.cos(h) + az * Math.sin(h),
        speed: speed / fly, yaw: yawRate, climb: flying ? vy : 0,
      }, dt, reduced);

      ignite = Math.max(0, ignite - seconds / 0.7);
      const airborne = flying || flightState.active;
      const frame = flightState.frame;
      // Climbing fires the jets by how fast it climbs, and the launch flares them, whatever the ability.
      const thrust = flying ? Math.max(0, Math.min(1, vy / rise)) * 0.85 : 0;
      const jets = Math.max(frame.jets, thrust, ignite * ignite * 1.2);
      let basePose = withFlightBody(airborne ? frame.pose : ground.pose, body);
      if (dock) {
        const inside = Math.hypot(at.x - dock.x, at.z - dock.z) <= dock.radius;
        if (!inside) dockReady = true;
        if (!docked && dockReady && inside && (!walkTarget || Math.hypot(walkTarget.x - dock.x, walkTarget.z - dock.z) <= dock.radius) && !flying && y <= 0.08 && vy <= 0) {
          settling = { x: at.x, z: at.z, heading: figure.heading,
            pose: { ...basePose, head: [headDown, headLeft, 0] }, elapsed: 0 };
          y = vy = vx = vz = yawRate = 0;
          body = flightBodyStill(); flightState = flightStanding();
          held.clear(); cancelAuto(); docked = true;
        }
        if (docked && settling) {
          settling.elapsed += dt;
          const progress = reduced ? 1 : Math.min(1, settling.elapsed / Math.max(1, settleTime));
          const ease = progress * progress * (3 - 2 * progress);
          const nextX = THREE.MathUtils.lerp(settling.x, dock.x, ease);
          const nextZ = THREE.MathUtils.lerp(settling.z, dock.z, ease);
          follow(nextX - at.x, nextZ - at.z);
          at.x = nextX; at.z = nextZ;
          figure = figureStanding(settling.heading + turnBetween(settling.heading, 0) * ease);
          basePose = {};
          for (const { id } of HUMAN_JOINTS) {
            const from = settling.pose[id] ?? [0, 0, 0], to = dock.pose[id] ?? [0, 0, 0];
            basePose[id] = [0, 1, 2].map(axis => THREE.MathUtils.lerp(from[axis], to[axis], ease)) as [number, number, number];
          }
          if (progress === 1) settling = null;
        } else if (docked) basePose = dock.pose;
      }
      human.pose(basePose, docked || airborne ? 0 : ground.lift);
      human.flight(airborne ? { ...frame, jets } : null);
      const [across, upward] = squashOf(body);
      human.object.scale.set(across, upward, across);
      human.object.position.y = start.y + y + (airborne ? frame.bob : 0);
      human.object.rotation.y = Math.PI - THREE.MathUtils.degToRad(figure.heading);
      human.object.updateMatrixWorld(true);
      let wantedDown=basePose.head?.[0] ?? 0, wantedLeft=basePose.head?.[1] ?? 0;
      const bone=human.bones.head, neck=bone.parent;
      if(!docked && followCursor && (hasCursor || surfaceTarget?.()) && neck) {
        const ball=bone.children.find(child=>child.name === "head" || child.name === "skull") ?? bone;
        const center=ball.getWorldPosition(new THREE.Vector3());
        const neckRotation=neck.getWorldQuaternion(new THREE.Quaternion());
        gazeRay.setFromCamera(cursor,camera);
        const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),center.clone().lerp(camera.position,0.5));
        const hit=surfaceTarget ? (walkTarget ?? surfaceTarget())?.clone() : gazeRay.ray.intersectPlane(plane,new THREE.Vector3());
        if(hit) {
          const gaze=gazeAt(hit.sub(center).applyQuaternion(neckRotation.invert()).toArray() as [number,number,number]);
          const bounded=withGaze({},gaze).head!;
          wantedDown=bounded[0]; wantedLeft=bounded[1];
        }
      }
      const gazeEase=reduced ? 1 : 1-Math.exp(-dt/Math.max(1,gazeTime));
      headDown+=(wantedDown-headDown)*gazeEase; headLeft+=(wantedLeft-headLeft)*gazeEase;
      const gazing=Math.abs(wantedDown-headDown)>0.03 || Math.abs(wantedLeft-headLeft)>0.03;
      if(!gazing) { headDown=wantedDown; headLeft=wantedLeft; }
      bone.rotation.x=THREE.MathUtils.degToRad(headDown);
      bone.rotation.y=THREE.MathUtils.degToRad(headLeft);
      bone.updateMatrixWorld(true);
      canvas.dataset.clayAutoFlight = String(autoAir);
      canvas.dataset.clayAutoWalk = String(walkTarget !== null);
      canvas.dataset.clayDocked = String(docked);
      canvas.dataset.claySettling = String(settling !== null);
      canvas.dataset.followCursor=String(followCursor);
      canvas.dataset.headGaze=[headDown,headLeft].map(n=>n.toFixed(2)).join(",");
      canvas.dataset.gait = docked ? "podium" : flying ? mode === "boost" ? "fly" : mode! : y > support + 0.001 ? "jump" : figure.gait;
      canvas.dataset.clayPosition = [at.x, y, at.z].map(n => n.toFixed(3)).join(",");
      canvas.dataset.clayAttitude = [figure.heading, body.pitch.x, body.roll.x, upward].map(n => n.toFixed(2)).join(",");
      return walkTarget !== null || settling !== null || gazing || held.size > 0 || y > support + 0.001 || flying || flightState.active || figure.blend > 0
        || speed > 0 || ignite > 0 || flightBodyMoving(body);
    },
    dispose() {
      canvas.removeEventListener("dblclick", doubleClick);
      canvas.removeEventListener("pointermove",cursorMove);
      canvas.removeEventListener("pointerleave",cursorLeave);
      window.removeEventListener("blur",cursorLeave);
      window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear); window.removeEventListener(CLAY_INPUT, control);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
