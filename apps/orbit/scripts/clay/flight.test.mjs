import assert from "node:assert/strict";
import test from "node:test";
import { clayFlightAt, flightStanding, groundedFlight, readClayFlightMotion, stepClayFlight } from "../../src/world/human-flight.ts";

globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
const motion = readClayFlightMotion({});
const ground = groundedFlight({ head: [0, -12, 0], rightArm: [-150, 0, -25] });
const advance = (state, target, seconds) => {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += 16) state = stepClayFlight(state, target, 16, motion, ground);
  return state;
};

test("each ability takes off, stays airborne and lands back in the selected posture", () => {
  for (const mode of ["hover", "boost", "glide"]) {
    let state = flightStanding(ground);
    state = advance(state, mode, 2);
    assert.equal(state.stage, "airborne");
    assert.ok(state.frame.height > 0.25);
    state = advance(state, null, 2);
    assert.equal(state.stage, "grounded");
    assert.equal(state.active, false);
    assert.deepEqual(state.frame.pose.head, ground.pose.head);
    assert.deepEqual(state.frame.pose.rightArm, ground.pose.rightArm);
    assert.equal(state.frame.height, 0);
    assert.equal(state.frame.jets, 0);
    assert.equal(state.frame.trails, 0);
    assert.deepEqual(state.frame.offset, [0, 0]);
  }
});

test("changing ability or interrupting takeoff/landing starts at the current frame", () => {
  let state = advance(flightStanding(ground), "boost", 0.4);
  for (const target of [null, "glide", "hover", "boost", null]) {
    const interrupted = stepClayFlight(state, target, 0, motion, ground);
    assert.deepEqual(interrupted.frame, { ...state.frame, time: interrupted.frame.time });
    state = advance(interrupted, target, 0.3);
  }
});

test("hover, propulsion and glide effects are distinct and remain finite across cycles", () => {
  for (const mode of ["hover", "boost", "glide"]) for (let time = 0; time < 20000; time += 137) {
    const frame = clayFlightAt(mode, time, motion);
    assert.equal(frame.jets, mode === "boost" ? 1 : 0);
    assert.equal(frame.trails, mode === "glide" ? 1 : 0);
    assert.ok(frame.height > 0);
    for (const value of [...Object.values(frame.pose).flat(), frame.height, ...frame.offset]) assert.ok(Number.isFinite(value));
  }
});

test("reduced motion holds a stationary airborne pose and lands immediately", () => {
  for (const mode of ["hover", "boost", "glide"]) {
    assert.deepEqual(clayFlightAt(mode, 0, motion, true), clayFlightAt(mode, 2800, motion, true));
    const flying = stepClayFlight(flightStanding(ground), mode, 16, motion, ground, true);
    assert.equal(flying.stage, "airborne");
    const landed = stepClayFlight(flying, null, 16, motion, ground, true);
    assert.equal(landed.stage, "grounded");
    assert.equal(landed.frame.height, 0);
  }
});
