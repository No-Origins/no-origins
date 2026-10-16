import * as THREE from "three/webgpu";
import { connectorProfile } from "./mountain-profile-v11";
import type { MountainConfig } from "./mountain-jig-v11";

/** World.md W62: an attached thin stem, with an illuminated bulb inside the glass head. */
export function mountainNeck(config: MountainConfig) {
  const profile = connectorProfile(config), object = new THREE.Group();
  object.name = "mountain-neck-connector";
  const stemMaterial = new THREE.MeshStandardNodeMaterial({ color: config.stone, roughness: 0.7 });
  const stemGeometry = new THREE.CylinderGeometry(profile.radius, profile.radius, profile.tipY - profile.baseY, 24);
  stemGeometry.addEventListener("dispose", () => stemMaterial.dispose());
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.name = "mountain-neck-stem";
  stem.position.set(0, (profile.tipY + profile.baseY) / 2, profile.centre);
  stem.castShadow = true; stem.receiveShadow = true;

  const power = config.lightState === "on" ? config.lightPower : 0;
  const bulbMaterial = new THREE.MeshStandardNodeMaterial({
    color: power > 0 ? config.lightColour : "#ddd8ce", roughness: 0.35,
    emissive: config.lightColour, emissiveIntensity: power / 50, toneMapped: false,
  });
  const bulbGeometry = new THREE.SphereGeometry(profile.bulbRadius, 24, 16);
  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.name = "mountain-neck-bulb";
  bulb.position.set(0, profile.tipY, profile.centre);
  const light = new THREE.PointLight(config.lightColour, power, config.lightReach, 2);
  light.name = "mountain-neck-light";
  light.position.copy(bulb.position);
  // Eight local lights share the main pass; no per-mountain shadow maps or extra glow passes.
  light.castShadow = false;
  bulbGeometry.addEventListener("dispose", () => { bulbMaterial.dispose(); light.dispose(); });
  object.add(stem, bulb, light);
  return object;
}
