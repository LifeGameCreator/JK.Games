/* Escape.kl World 5 – GALAXY WORLD preview V513 performance build.
   Inside Galaxy is the huge non-colliding outer shell.
   Space Laufweg is the centered star/galaxy volume you run through.
   One real solid platform is always under the spawn. */
export function buildGalaxyWorld(api){
  const {
    addPlatform,
    addSign,
    addAutoTrigger=()=>{},
    addWorldGlbModel=()=>null,
    worldToast=()=>{},
    returnHub=()=>{}
  }=api;

  const startZ=-70;
  const galaxyCenterZ=startZ;
  // Exactly ONE gameplay platform. It deliberately spans far behind and far
  // in front of the spawn so the player cannot start over empty space.
  const platform=addPlatform({
    x:0,y:.18,z:galaxyCenterZ,
    w:42,h:.72,d:96,
    color:0x171027,
    label:'',
    stage:1,
    kind:'galaxy-space-platform'
  });

  // The platform is intentionally visible and solid even before either GLB has
  // finished loading. This is gameplay collision, not decorative GLB collision.
  const mats=Array.isArray(platform?.mesh?.material)?platform.mesh.material:[platform?.mesh?.material];
  for(const material of mats){
    if(!material)continue;
    material.transparent=false;
    material.opacity=1;
    material.depthWrite=true;
    material.roughness=.42;
    material.metalness=.18;
    if(material.emissive?.setHex){
      material.emissive.setHex(0x321b67);
      material.emissiveIntensity=.48;
    }
    material.needsUpdate=true;
  }

  // Huge outside sphere. No Escape collider is created for this model.
  // It is centered on exactly the same point as the inner star galaxy.
  addWorldGlbModel({
    url:'./assets/escape/world5/inside-galaxy.glb?v=20260824-escape-v513-performance-galaxy',
    name:'world5-inside-galaxy-shell',
    position:{x:0,y:0,z:galaxyCenterZ},
    fitWidth:520,
    centerX:true,
    centerY:true,
    centerZ:true,
    textureZoom:1.82,
    doubleSide:true,
    frustumCulled:true,
    castShadow:false,
    receiveShadow:false,
    lazy:true
  });

  // IMPORTANT: Space Laufweg is a point/star volume, not the physical floor.
  // V511 wrongly kept it close to floor-size. V512 makes it a large centered
  // Galaxy inside the outer sphere so the player visibly runs through it.
  addWorldGlbModel({
    url:'./assets/escape/world5/space-laufweg.glb?v=20260824-escape-v513-performance-galaxy',
    name:'world5-space-galaxy',
    position:{x:0,y:0,z:galaxyCenterZ},
    fitWidth:470,
    pointSize:2.75,
    pointBudget:26000,
    centerX:true,
    centerY:true,
    centerZ:true,
    doubleSide:true,
    frustumCulled:true,
    castShadow:false,
    receiveShadow:false,
    lazy:true
  });

  addSign('WORLD 5 · GALAXY WORLD',{x:0,y:6.8,z:startZ-1.0},0xb98cff,.72);
  addSign('PREVIEW · 1 SICHERE GALAXY-PLATTFORM',{x:0,y:5.70,z:startZ-1.02},0xe9ddff,.34);
  addSign('↩ HINTER DIR · ZURÜCK ZUM HUB',{x:0,y:4.78,z:startZ-1.04},0xa9d8ff,.28);

  // Walk behind the spawn to return. No second platform is created.
  addAutoTrigger('galaxy-world-return-hub',0,startZ+7.5,16,2.4,returnHub);
  addAutoTrigger('galaxy-world-preview-toast',0,startZ-5.0,24,3.0,()=>worldToast('🌌 GALAXY WORLD · große Außenkugel · mittige Sternen-Galaxy · Performance-Modus · sichere Plattform','good',2600));
}
