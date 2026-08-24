/* Escape.kl World 5 – GALAXY WORLD preview.
   The supplied Inside Galaxy GLB is a non-colliding shell around the player.
   The supplied Space Laufweg GLB is the only visible walkable platform in this first preview. */
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
  const platformCenterZ=-82;
  const platformTop=.30;

  // One and only gameplay platform for this preview. It stays invisible so the
  // supplied Space Laufweg model is what the player actually sees.
  const collision=addPlatform({
    x:0,y:.15,z:platformCenterZ,
    w:16,h:.30,d:19,
    color:0x070711,
    label:'',
    stage:1,
    kind:'galaxy-space-platform'
  });
  const mats=Array.isArray(collision?.mesh?.material)?collision.mesh.material:[collision?.mesh?.material];
  for(const material of mats){
    if(!material)continue;
    material.transparent=true;
    material.opacity=0;
    material.depthWrite=false;
    material.colorWrite=false;
    material.needsUpdate=true;
  }

  // Galaxy shell: purely visual. It surrounds the complete preview area and has
  // deliberately no collision entry in Escape.kl.
  addWorldGlbModel({
    url:'./assets/escape/world5/inside-galaxy.glb?v=20260824-escape-v510-galaxy-world5',
    name:'world5-inside-galaxy-shell',
    position:{x:0,y:0,z:platformCenterZ},
    fitWidth:220,
    centerX:true,
    centerY:true,
    centerZ:true,
    doubleSide:true,
    frustumCulled:false,
    castShadow:false,
    receiveShadow:false
  });

  // Visible Space Laufweg. The actual walking collision is the single invisible
  // platform above, so decorative parts of the GLB can never trap the player.
  addWorldGlbModel({
    url:'./assets/escape/world5/space-laufweg.glb?v=20260824-escape-v510-galaxy-world5',
    name:'world5-space-laufweg',
    position:{x:0,y:0,z:platformCenterZ},
    fitWidth:16,
    centerX:true,
    centerZ:true,
    floorY:platformTop,
    doubleSide:true,
    frustumCulled:true,
    castShadow:false,
    receiveShadow:true
  });

  addSign('WORLD 5 · GALAXY WORLD',{x:0,y:6.6,z:startZ-1.2},0xb98cff,.72);
  addSign('PREVIEW · 1 SPACE-PLATTFORM',{x:0,y:5.55,z:startZ-1.22},0xe9ddff,.34);
  addSign('↩ HINTER DIR · ZURÜCK ZUM HUB',{x:0,y:4.62,z:startZ-1.24},0xa9d8ff,.28);

  // Walk a little behind the spawn to return. No second platform is created.
  addAutoTrigger('galaxy-world-return-hub',0,startZ+3.0,10,2.4,returnHub);
  addAutoTrigger('galaxy-world-preview-toast',0,startZ-5.0,13,3.0,()=>worldToast('🌌 GALAXY WORLD · erste Vorschau · eine Space-Plattform','good',2400));
}
