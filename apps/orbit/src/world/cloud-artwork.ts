import * as THREE from "three/webgpu";

/** W28: isolated powder-painted banks made against the selected Integrated powder reference.
 * Load once per engine before the first frame. Each scene owns its textures; tuning reuses them.
 */
export async function loadCloudArtwork() {
  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(["/clouds/powder-bank-v15.png", "/clouds/powder-veil-v15.png"].map((url) => loader.loadAsync(url)));
  for (const map of textures) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
  }
  return textures;
}
