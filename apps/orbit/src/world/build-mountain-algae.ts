import * as THREE from "three/webgpu";
import { mountainStart } from "./mountain-jig";
import { mountainNoise } from "./mountain-noise";
import { algaeContour, bodyRing } from "./mountain-profile";
import type { Mountain } from "./mountains";

export function mountainAlgae(mountain: Mountain, config = mountainStart(mountain)) {
  const rows = 80, sides = 128, line = algaeContour(config);
  const points: number[] = [], colours: number[] = [], coverage: number[] = [], indices: number[] = [];
  const algae = new THREE.Color(config.mossColour);
  const pigmentHue = algae.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
  // Lift the chosen pigment into a pastel of the same hue, so sage stays green rather than washing to grey.
  const chalk = new THREE.Color().setHSL(pigmentHue.h, Math.max(0.25, pigmentHue.s * 0.8), 0.74, THREE.SRGBColorSpace);
  const edgeBand = 0.008 + config.algaeEdge * 0.085;
  for (let row = 0; row <= rows + 1; row++) for (let side = 0; side <= sides; side++) {
    const t = Math.min(row, rows) / rows * line[side % sides];
    const angle = side / sides * Math.PI * 2, cx = Math.cos(angle), cz = Math.sin(angle);
    const ring = bodyRing(config, t), y = ring.y - cz * ring.rise;
    const grain = mountainNoise(cx * ring.radius * 0.6 * config.algaeScale, y * 0.6 * config.algaeScale, cz * ring.radius * 0.6 * config.algaeScale, config.algaeSeed + 81);
    const edge = Math.min(1, Math.max(0, (line[side % sides] - t) / edgeBand));
    // A thinner broken fringe meets the stone. Coverage is sampled as dry-brush flecks in the material.
    const coat = row > rows ? 0 : config.algaeThickness * (0.3 + edge * 0.7) * (1 + grain * 0.2);
    points.push(cx * (ring.radius + coat), y, cz * (ring.radius + coat) + ring.centre);
    const pigment = config.algaePastel * (0.8 + (1 - edge) * 0.15 + grain * 0.1);
    const colour = algae.clone().lerp(chalk, pigment).multiplyScalar(0.97 + grain * 0.08);
    colours.push(colour.r, colour.g, colour.b); coverage.push(row > rows ? 0 : edge);
  }
  // Continue below the floor, open-ended, exactly as the stone wall does.
  const continuation = points.length / 3;
  for (let side = 0; side <= sides; side++) {
    const i = side * 3;
    points.push(points[i], -config.height * 0.4, points[i + 2]);
    colours.push(colours[i], colours[i + 1], colours[i + 2]); coverage.push(1);
    if (side < sides) indices.push(continuation + side, side, continuation + side + 1, continuation + side + 1, side, side + 1);
  }
  for (let row = 0; row <= rows; row++) for (let side = 0; side < sides; side++) {
    const a = row * (sides + 1) + side, b = a + 1, c = a + sides + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  geometry.setAttribute("algaeCoverage", new THREE.Float32BufferAttribute(coverage, 1));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  for (let row = 0; row <= rows + 1; row++) {
    const a = row * (sides + 1), b = a + sides;
    const normal = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z); normals.setXYZ(b, normal.x, normal.y, normal.z);
  }
  return geometry;
}
