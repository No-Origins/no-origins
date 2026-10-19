import * as THREE from "three/webgpu";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { color, mix, reflectVector, smoothstep, float } from "three/tsl";
import type { BuiltHuman } from "./build-human";
import { clayHeightOf, lookOf, type HumanConfig } from "./human";

/** World.md W108: the approved VR v1/four-view turnaround, with independent stature added for his height correction.
 * Front crown/sole ≈ 30/690 px; head ≈ 265×210 px, crotch ≈ 505 px. Side depth excludes the backpack/visor.
 * Retain the original connected lofts, skinning, knees and rig; these are proportions, not replacement primitives.
 */
export const CLAY_VR_PROPORTIONS = {
  clayProfile: "vr-v1", clayHeight: 295,
  clayHeadWidth: 98, clayHeadHeight: 78, clayHeadDepth: 92,
  clayNeck: 47, clayNeckHeight: 0.5,
  clayBody: 87, clayBodyDepth: 61,
  clayArmLength: 72, clayArmWidth: 40, clayArmDepth: 49,
  clayGroove: 1,
  clayLegLength: 88, clayLegWidth: 51, clayLegDepth: 60, clayGap: 6,
} satisfies Partial<HumanConfig>;

/** The opaque shallow lens hugs the actual head loft and travels with its gaze; no temples, straps or earpieces. */
export function buildClayVR(human: BuiltHuman, config: HumanConfig) {
  const object = new THREE.Group();
  object.name = "Clay VR visor";
  const look = lookOf(config);
  const head = look?.pieces.find(piece=>piece.name==="head")?.parts.find(part=>part.kind==="loft");
  if (!head || head.kind!=="loft") return object;
  const rows = head.rows;
  const eyeY = clayHeightOf(config) - config.clayHeadHeight / 200;
  const width = config.clayHeadWidth / 100 * 0.87;
  const height = config.clayHeadHeight / 100 * 0.38;
  human.object.updateMatrixWorld(true);
  const pivot = human.object.worldToLocal(human.bones.head.getWorldPosition(new THREE.Vector3()));
  const frontAt = (x: number,y: number) => {
    let i=0;
    while(i<rows.length-2 && rows[i+1][0]<y)i++;
    const a=rows[i],b=rows[Math.min(i+1,rows.length-1)];
    const t=THREE.MathUtils.clamp((y-a[0])/Math.max(.00001,b[0]-a[0]),0,1);
    const row=a.map((v,j)=>THREE.MathUtils.lerp(v,b[j]??v,t));
    const half=(row[2]-row[1])/2, middle=(row[4]+row[3])/2, depth=(row[4]-row[3])/2;
    const n=a[5]??head.n??3.6;
    return middle+depth*Math.pow(Math.max(.001,1-Math.pow(Math.abs(x)/half,n)),1/n);
  };
  const make = (w: number,h: number,depth: number,offset: number,paint: THREE.Material,name: string) => {
    const shape = new THREE.Shape();
    const x=w/2,y=h/2,r=h*.43;
    shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);
    shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);shape.lineTo(-x+r,y);
    shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);
    const geometry = new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.004,bevelThickness:.004,curveSegments:24});
    // Subdivide the broad face before warping; a single flat fan would flatten the visor's head-hugging curvature.
    const original=geometry.index ? geometry.toNonIndexed() : geometry;
    if (original!==geometry) geometry.dispose();
    const positions=original.getAttribute("position");
    const values:number[]=[];
    const va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
    const emit=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,level:number) => {
      if(level===0){values.push(...a.toArray(),...b.toArray(),...c.toArray());return;}
      const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);
      emit(a,ab,ca,level-1);emit(ab,b,bc,level-1);emit(ca,bc,c,level-1);emit(ab,bc,ca,level-1);
    };
    for(let i=0;i<positions.count;i+=3){va.fromBufferAttribute(positions,i);vb.fromBufferAttribute(positions,i+1);vc.fromBufferAttribute(positions,i+2);emit(va,vb,vc,3);}
    original.dispose();
    const curved=new THREE.BufferGeometry();
    const coordinates=new Float32Array(values);
    for(let i=0;i<coordinates.length;i+=3){
      const x=coordinates[i],y=coordinates[i+1]+eyeY,z=coordinates[i+2];
      coordinates[i]=x-pivot.x;coordinates[i+1]=y-pivot.y;
      coordinates[i+2]=frontAt(x,y)+offset+z-pivot.z;
    }
    curved.setAttribute("position",new THREE.BufferAttribute(coordinates,3));
    const smooth=mergeVertices(curved,0.00001);curved.dispose();smooth.computeVertexNormals();
    const mesh=new THREE.Mesh(smooth,paint);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;object.add(mesh);
  };
  const graphite=new THREE.MeshStandardNodeMaterial({color:"#242728",roughness:.46,metalness:.2});
  const lens=new THREE.MeshPhysicalNodeMaterial({color:"#161c1e",roughness:.18,metalness:.25,clearcoat:1,clearcoatRoughness:.16});
  // A quiet sky/ground reflection on the opaque lens. Nothing emits light or reveals the face through glass.
  lens.envNode=mix(color("#25211f"),color("#c6c7c4"),smoothstep(float(-.1),float(.85),reflectVector.y));
  lens.envMapIntensity=.45;
  make(width,height,.022,.012,graphite,"thin graphite visor rim");
  make(width-.018,height-.018,.013,.037,lens,"curved smoked-black VR lens");
  human.bones.head.add(object);
  return object;
}
