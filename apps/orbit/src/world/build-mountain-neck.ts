import * as THREE from "three/webgpu";
import { mix, output, vec4 } from "three/tsl";
import { connectorProfile } from "./mountain-profile";
import type { MountainConfig } from "./mountain-jig";
import { reachOf } from "./strength";

/** World.md W62: an attached thin stem, with an illuminated bulb inside the glass head. Both take the base gas (`air`,
 * W37) as the body and the head do, never the scene fog. */
export function mountainNeck(config: MountainConfig, air?: THREE.Node<"vec4">) {
  const profile = connectorProfile(config), object = new THREE.Group();
  object.name = "mountain-neck-connector";
  const inAir = <M extends THREE.NodeMaterial>(material: M) => {
    if (air) material.outputNode = vec4(mix(output.rgb, air.rgb, air.a), output.a);
    return material;
  };
  const stemMaterial = inAir(new THREE.MeshStandardNodeMaterial({ color: config.stone, roughness: 0.7, fog: !air }));
  const stemGeometry = new THREE.CylinderGeometry(profile.radius, profile.radius, profile.tipY - profile.baseY, 24);
  stemGeometry.addEventListener("dispose", () => stemMaterial.dispose());
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.name = "mountain-neck-stem";
  stem.position.set(0, (profile.tipY + profile.baseY) / 2, profile.centre);
  stem.castShadow = true; stem.receiveShadow = true;

  const power = config.lightState === "on" ? config.lightPower : 0;
  const bulbMaterial = inAir(new THREE.MeshStandardNodeMaterial({
    color: power > 0 ? "#000000" : "#ddd8ce", roughness: 0.35, fog: !air,
    // Keep the bulb's chosen hue instead of clipping each channel to white at high power.
    emissive: config.lightColour, emissiveIntensity: power > 0 ? 0.1 + 0.9 * power / (power + 150) : 0,
  }));
  const bulbGeometry = new THREE.SphereGeometry(profile.bulbRadius, 24, 16);
  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.name = "mountain-neck-bulb";
  bulb.position.set(0, profile.tipY, profile.centre);
  // Its reach follows from its strength (W90).
  const light = new THREE.PointLight(config.lightColour, power, reachOf(power), 2);
  light.name = "mountain-neck-light";
  light.position.copy(bulb.position);
  // Eight local lights share the main pass; no per-mountain shadow maps or extra glow passes.
  light.castShadow = false;
  bulbGeometry.addEventListener("dispose", () => { bulbMaterial.dispose(); light.dispose(); });
  object.add(stem, bulb, light);
  return object;
}
