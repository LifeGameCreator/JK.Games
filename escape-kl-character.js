import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* Escape.kl V434 – human player + native JK.Games locomotion animations.
   Uses the existing man/woman idle/walk/run GLBs. A detailed procedural human
   stays available as a hard fallback so Escape.kl never fails to open. */

const ASSETS = Object.freeze({
  male:Object.freeze({walk:'./man-walk.glb?v=20260813-escape-v434',run:'./man-run.glb?v=20260813-escape-v434',idle:'./man-idle-v325.glb?v=20260813-escape-v434'}),
  female:Object.freeze({walk:'./woman-walk.glb?v=20260813-escape-v434',run:'./woman-run.glb?v=20260813-escape-v434',idle:'./woman-idle-v325.glb?v=20260813-escape-v434'})
});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const normName=(name='')=>String(name||'').replace(/_\d+$/,'').replace(/[\s._:-]+/g,'').toLowerCase();

function makeInPlace(clip){
  if(!clip?.clone)return clip||null;
  const cloned=clip.clone();
  for(const track of cloned.tracks||[]){
    if(!/hips|rootjoint|pelvis/i.test(track.name)||!/\.position$/i.test(track.name)||!track.values)continue;
    const stride=track.getValueSize?.()||3;if(stride<3)continue;
    const firstX=track.values[0],firstZ=track.values[2];
    for(let i=0;i<track.values.length;i+=stride){track.values[i]=firstX;track.values[i+2]=firstZ;}
  }
  cloned.name=`${clip.name||'locomotion'}-in-place`;
  return cloned;
}
function sanitizeClip(clip){
  if(!clip?.clone)return null;
  const cloned=clip.clone();
  cloned.tracks=(cloned.tracks||[]).filter(track=>{
    const name=String(track?.name||'');
    return !/(^|[./])(bip_01|bip Footsteps|RootNode|rig_CharRoot|_rootJoint)\.(position|quaternion|rotation|scale)$/i.test(name);
  });
  cloned.resetDuration?.();
  return makeInPlace(cloned);
}
function retargetClip(clip,root,label){
  if(!clip?.clone||!root)return null;
  const byName=new Map();
  root.traverse(object=>{if(object?.name){const key=normName(object.name);if(key&&!byName.has(key))byName.set(key,object.name);}});
  const cloned=makeInPlace(clip);
  const tracks=[];
  for(const track of cloned?.tracks||[]){
    const dot=String(track.name||'').lastIndexOf('.');if(dot<1)continue;
    const source=track.name.slice(0,dot),property=track.name.slice(dot),target=byName.get(normName(source));
    if(!target)continue;
    track.name=`${target}${property}`;tracks.push(track);
  }
  if(!tracks.length)return null;
  return new THREE.AnimationClip(`${label}-${cloned.name||'clip'}`,cloned.duration,tracks,cloned.blendMode);
}

function normalizeNativeModel(scene,targetHeight=1.76){
  const wrapper=new THREE.Group();wrapper.name='escape-native-human';wrapper.add(scene);
  scene.position.set(0,0,0);scene.rotation.set(0,0,0);scene.scale.set(1,1,1);wrapper.updateMatrixWorld(true);
  const bones=[];scene.traverse(o=>{if(o?.isBone||/^bip /i.test(String(o?.name||'')))bones.push(o);});
  const head=bones.find(o=>/^bip Head_/i.test(o.name||''))||bones.find(o=>/Head/i.test(o.name||''));
  const feet=bones.filter(o=>/^bip [LR] Foot_/i.test(o.name||''));
  const pelvis=bones.find(o=>/^bip Pelvis_/i.test(o.name||''));
  const wp=new THREE.Vector3(),headPos=new THREE.Vector3(),pelvisPos=new THREE.Vector3();
  if(head)head.getWorldPosition(headPos);if(pelvis)pelvis.getWorldPosition(pelvisPos);
  let floorY=Infinity;for(const foot of feet){foot.getWorldPosition(wp);floorY=Math.min(floorY,wp.y);}if(!Number.isFinite(floorY))floorY=0;
  const skeletonHeight=head?Math.max(.75,headPos.y-floorY+.20):targetHeight;
  const scale=clamp(targetHeight/skeletonHeight,.72,1.45);wrapper.scale.setScalar(scale);
  wrapper.position.set(-(pelvis?pelvisPos.x*scale:0),-floorY*scale,-(pelvis?pelvisPos.z*scale:0));
  wrapper.traverse(object=>{
    if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
    const mats=Array.isArray(object.material)?object.material:[object.material];
    for(const material of mats){if(material?.map)material.map.colorSpace=THREE.SRGBColorSpace;if(material){material.roughness=Math.max(.38,Number(material.roughness)||.5);material.envMapIntensity=.22;}}
  });
  wrapper.updateMatrixWorld(true);return wrapper;
}

function limbCapsule(radius,length,material){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,9),material);m.castShadow=true;m.receiveShadow=true;return m;}
function createFallbackHuman(gender='male'){
  const root=new THREE.Group();root.name='escape-procedural-human';
  const skin=new THREE.MeshStandardMaterial({color:gender==='female'?0xe1b38f:0xd7a57f,roughness:.78});
  const skinWarm=new THREE.MeshStandardMaterial({color:gender==='female'?0xdba985:0xcd9873,roughness:.8});
  const shirt=new THREE.MeshStandardMaterial({color:gender==='female'?0x8b65d4:0x287eae,roughness:.62});
  const shirtDark=new THREE.MeshStandardMaterial({color:gender==='female'?0x5d3e9a:0x175071,roughness:.67});
  const pants=new THREE.MeshStandardMaterial({color:0x182333,roughness:.78});
  const shoe=new THREE.MeshStandardMaterial({color:0x0c1119,roughness:.7});
  const hair=new THREE.MeshStandardMaterial({color:gender==='female'?0x442a1d:0x2e2018,roughness:.82});
  const white=new THREE.MeshStandardMaterial({color:0xf8fbff,roughness:.48});
  const iris=new THREE.MeshStandardMaterial({color:0x427d91,roughness:.42});
  const black=new THREE.MeshStandardMaterial({color:0x111319,roughness:.55});
  const mouthMat=new THREE.MeshStandardMaterial({color:0x8e4a4e,roughness:.72});
  const allMaterials=[skin,skinWarm,shirt,shirtDark,pants,shoe,hair,white,iris,black,mouthMat];
  const allGeometries=[];const remember=g=>(allGeometries.push(g),g);
  const add=(mesh,parent=root)=>{mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};

  const pelvis=new THREE.Group();pelvis.position.y=.72;root.add(pelvis);
  const pelvisMesh=add(new THREE.Mesh(remember(new THREE.CapsuleGeometry(.23,.16,4,10)),pants),pelvis);pelvisMesh.scale.set(1.12,1,.78);
  const torso=new THREE.Group();torso.position.y=.18;pelvis.add(torso);
  const chest=add(new THREE.Mesh(remember(new THREE.CapsuleGeometry(.27,.32,5,11)),shirt),torso);chest.position.y=.20;chest.scale.set(gender==='female'?1.06:1.18,1,.73);
  const collar=add(new THREE.Mesh(remember(new THREE.TorusGeometry(.115,.025,5,16)),shirtDark),torso);collar.position.set(0,.43,.01);collar.rotation.x=Math.PI/2;
  const neck=add(new THREE.Mesh(remember(new THREE.CylinderGeometry(.105,.115,.17,10)),skinWarm),torso);neck.position.y=.51;
  const headPivot=new THREE.Group();headPivot.position.y=.68;torso.add(headPivot);
  const head=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.235,18,13)),skin),headPivot);head.scale.set(.90,1.07,.91);
  // Ears
  for(const s of[-1,1]){const ear=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.052,10,7)),skinWarm),headPivot);ear.position.set(s*.225,.005,.005);ear.scale.set(.52,1,.7);}
  // Eyes + iris + pupils. Character front is +Z.
  const eyes=[];
  for(const s of[-1,1]){
    const eye=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.044,10,7)),white),headPivot);eye.position.set(s*.082,.045,.211);eye.scale.set(1,.72,.38);eyes.push(eye);
    const ir=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.022,9,6)),iris),headPivot);ir.position.set(s*.082,.045,.247);ir.scale.set(1,.9,.28);
    const pupil=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.010,8,5)),black),headPivot);pupil.position.set(s*.082,.045,.261);pupil.scale.z=.3;
    const brow=add(new THREE.Mesh(remember(new THREE.BoxGeometry(.075,.016,.018)),hair),headPivot);brow.position.set(s*.082,.112,.224);brow.rotation.z=s*.07;
  }
  const nose=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.036,9,6)),skinWarm),headPivot);nose.position.set(0,-.005,.236);nose.scale.set(.72,1.12,.85);
  const mouth=add(new THREE.Mesh(remember(new THREE.CapsuleGeometry(.011,.075,3,7)),mouthMat),headPivot);mouth.position.set(0,-.086,.222);mouth.rotation.z=Math.PI/2;mouth.scale.z=.45;
  const hairCap=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.242,14,9,0,Math.PI*2,0,Math.PI*.58)),hair),headPivot);hairCap.position.y=.03;hairCap.scale.set(.94,1.02,.94);
  for(let i=-2;i<=2;i++){const fringe=add(new THREE.Mesh(remember(new THREE.CapsuleGeometry(.022,.07,3,7)),hair),headPivot);fringe.position.set(i*.055,.155,.205);fringe.rotation.z=.12*i;fringe.rotation.x=.15;}

  const arms={};
  for(const s of[-1,1]){
    const side=s<0?'L':'R',shoulder=new THREE.Group();shoulder.position.set(s*.36,.34,0);torso.add(shoulder);
    const upper=limbCapsule(.075,.27,shirt);upper.position.y=-.17;shoulder.add(upper);allGeometries.push(upper.geometry);
    const elbow=new THREE.Group();elbow.position.y=-.35;shoulder.add(elbow);
    const lower=limbCapsule(.065,.25,skinWarm);lower.position.y=-.15;elbow.add(lower);allGeometries.push(lower.geometry);
    const hand=add(new THREE.Mesh(remember(new THREE.SphereGeometry(.073,10,7)),skin),elbow);hand.position.y=-.34;hand.scale.set(.85,1.05,.78);
    arms[side]={shoulder,elbow};
  }
  const legs={};
  for(const s of[-1,1]){
    const side=s<0?'L':'R',hip=new THREE.Group();hip.position.set(s*.155,-.08,0);pelvis.add(hip);
    const upper=limbCapsule(.09,.29,pants);upper.position.y=-.19;hip.add(upper);allGeometries.push(upper.geometry);
    const knee=new THREE.Group();knee.position.y=-.39;hip.add(knee);
    const lower=limbCapsule(.078,.28,pants);lower.position.y=-.18;knee.add(lower);allGeometries.push(lower.geometry);
    const foot=add(new THREE.Mesh(remember(new THREE.BoxGeometry(.17,.12,.31)),shoe),knee);foot.position.set(0,-.39,.07);
    legs[side]={hip,knee,foot};
  }
  root.position.y=0;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),height=Math.max(.1,bounds.max.y-bounds.min.y),scale=1.76/height;root.scale.setScalar(scale);root.updateMatrixWorld(true);const scaledBounds=new THREE.Box3().setFromObject(root);root.position.y-=scaledBounds.min.y;
  return {root,pelvis,torso,headPivot,arms,legs,eyes,materials:allMaterials,geometries:allGeometries,phase:0,lastGrounded:true,landing:0};
}

function animateFallback(f,kin,dt,t){
  const speed=Math.max(0,kin.planarSpeed||0),moving=speed>.12,grounded=!!kin.grounded,sprint=!!kin.sprint;
  if(!f.lastGrounded&&grounded)f.landing=1;f.lastGrounded=grounded;f.landing=Math.max(0,f.landing-dt*6.5);
  if(grounded&&moving)f.phase+=dt*(sprint?10.5:7.2)*clamp(.65+speed/8,.75,1.75);else f.phase+=dt*1.4;
  const wave=Math.sin(f.phase),opposite=Math.sin(f.phase+Math.PI),amp=sprint?.86:.62;
  const ease=1-Math.exp(-dt*12);
  const setRot=(o,x=0,y=0,z=0)=>{o.rotation.x+=((x)-o.rotation.x)*ease;o.rotation.y+=((y)-o.rotation.y)*ease;o.rotation.z+=((z)-o.rotation.z)*ease;};
  if(!grounded){
    const rising=(kin.verticalVelocity||0)>0;
    setRot(f.arms.L.shoulder,rising?-1.0:-.35,0,-.12);setRot(f.arms.R.shoulder,rising?-1.0:-.35,0,.12);
    setRot(f.legs.L.hip,rising?.32:.16);setRot(f.legs.R.hip,rising?-.22:.12);setRot(f.legs.L.knee,.34);setRot(f.legs.R.knee,.22);
    setRot(f.torso,rising?.08:.18);f.pelvis.position.y=.72;
  }else if(moving){
    setRot(f.arms.L.shoulder,opposite*amp*.78,0,-.05);setRot(f.arms.R.shoulder,wave*amp*.78,0,.05);
    setRot(f.arms.L.elbow,Math.max(0,-opposite)*.42);setRot(f.arms.R.elbow,Math.max(0,-wave)*.42);
    setRot(f.legs.L.hip,wave*amp);setRot(f.legs.R.hip,opposite*amp);
    setRot(f.legs.L.knee,Math.max(0,-wave)*.65);setRot(f.legs.R.knee,Math.max(0,-opposite)*.65);
    setRot(f.torso,sprint?.12:.045,wave*.025,wave*.018);f.pelvis.position.y=.72+Math.abs(Math.sin(f.phase*2))*.018-f.landing*.055;
  }else{
    setRot(f.arms.L.shoulder,.035+Math.sin(t*1.15)*.015,0,-.04);setRot(f.arms.R.shoulder,.035-Math.sin(t*1.15)*.015,0,.04);
    setRot(f.legs.L.hip,.01);setRot(f.legs.R.hip,-.01);setRot(f.legs.L.knee,0);setRot(f.legs.R.knee,0);
    setRot(f.torso,0,Math.sin(t*.55)*.018,0);f.pelvis.position.y=.72+Math.sin(t*1.8)*.006-f.landing*.055;
  }
  f.headPivot.rotation.y+=(Math.sin(t*.72)*.035-f.headPivot.rotation.y)*ease;
  f.headPivot.rotation.x+=(Math.sin(t*.93)*.01-f.headPivot.rotation.x)*ease;
  const blinkCycle=t%4.7,blink=blinkCycle>4.48?clamp(Math.abs(blinkCycle-4.59)/.11,.12,1):1;for(const eye of f.eyes)eye.scale.y=.72*blink;
}

function collectBones(root){
  const result={};
  root.traverse(o=>{const n=normName(o.name);if(!n)return;
    if(/biphead/.test(n))result.head=o;else if(/bipspine1/.test(n))result.spine=o;
    else if(/biplupperarm/.test(n))result.armL=o;else if(/biprupperarm/.test(n))result.armR=o;
    else if(/biplforearm/.test(n))result.foreL=o;else if(/biprforearm/.test(n))result.foreR=o;
    else if(/biplthigh/.test(n))result.thighL=o;else if(/biprthigh/.test(n))result.thighR=o;
    else if(/biplcalf|biplleg/.test(n))result.calfL=o;else if(/biprcalf|biprleg/.test(n))result.calfR=o;
  });
  return result;
}
function airPose(native,kin,dt){
  const rising=(kin.verticalVelocity||0)>0,alpha=1-Math.exp(-dt*11),targets=[
    [native.bones.armL,rising?-1.05:-.45,0,-.12],[native.bones.armR,rising?-1.05:-.45,0,.12],
    [native.bones.foreL,rising?-.18:.1,0,0],[native.bones.foreR,rising?-.18:.1,0,0],
    [native.bones.thighL,rising?.35:.15,0,0],[native.bones.thighR,rising?-.18:.10,0,0],
    [native.bones.calfL,.38,0,0],[native.bones.calfR,.22,0,0],[native.bones.spine,rising?.08:.16,0,0]
  ];
  for(const [bone,x,y,z] of targets){if(!bone)continue;const base=bone.userData.escapeBindQuaternion;if(!base)continue;const q=base.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));bone.quaternion.slerp(q,alpha);}
}

export function createEscapeCharacter({gender='male',floorOffset=.82,onReady=()=>{},onError=()=>{}}={}){
  gender=gender==='female'?'female':'male';
  const controlRoot=new THREE.Group();controlRoot.name='escape-character-control';
  const visualRoot=new THREE.Group();visualRoot.name='escape-character-visual';visualRoot.position.y=-floorOffset;controlRoot.add(visualRoot);
  const fallback=createFallbackHuman(gender);visualRoot.add(fallback.root);
  const controller={root:controlRoot,visualRoot,fallback,native:null,disposed:false,mode:'fallback',activeMode:'idle',landing:0,lastGrounded:true};
  const loader=new GLTFLoader(),paths=ASSETS[gender];
  controller.loadPromise=Promise.all([loader.loadAsync(paths.walk),loader.loadAsync(paths.run),loader.loadAsync(paths.idle)]).then(([walkGltf,runGltf,idleGltf])=>{
    if(controller.disposed)return controller;
    const model=normalizeNativeModel(walkGltf.scene,1.76);visualRoot.add(model);fallback.root.visible=false;
    const walkSource=(walkGltf.animations||[])[0]||null,runSource=(runGltf.animations||[])[0]||null,idleSource=(idleGltf.animations||[])[0]||null;
    const walkClip=sanitizeClip(walkSource),runClip=retargetClip(sanitizeClip(runSource),model,'run'),idleClip=retargetClip(sanitizeClip(idleSource),model,'idle');
    const mixer=new THREE.AnimationMixer(model),actions={};
    const make=(clip,name)=>{if(!clip)return null;clip.name=name;const a=mixer.clipAction(clip);a.setLoop(THREE.LoopRepeat,Infinity);a.enabled=true;a.play();a.paused=true;actions[name]=a;return a;};
    const idle=make(idleClip,'idle'),walk=make(walkClip,'walk'),run=make(runClip,'run');
    const active=idle||walk||run;if(active){active.paused=false;active.reset().play();}
    const bones=collectBones(model);model.traverse(o=>{if(o.isBone)o.userData.escapeBindQuaternion=o.quaternion.clone();});
    controller.native={model,mixer,actions,active,bones};controller.mode='native';controller.activeMode=active===run?'run':active===walk?'walk':'idle';onReady(controller);return controller;
  }).catch(error=>{console.warn('Escape.kl: native Charakteranimation konnte nicht geladen werden – detaillierter Fallback bleibt aktiv.',error);onError(error);return controller;});
  controller.update=(kin,dt,t)=>{
    if(controller.disposed)return;const grounded=!!kin.grounded,speed=Math.max(0,kin.planarSpeed||0),moving=speed>.14;
    if(!controller.lastGrounded&&grounded)controller.landing=1;controller.lastGrounded=grounded;controller.landing=Math.max(0,controller.landing-dt*7);
    const lean=!grounded?.02:(kin.sprint&&moving?.105:moving?.035:0);visualRoot.rotation.x+=(lean-visualRoot.rotation.x)*(1-Math.exp(-dt*9));
    const targetScaleY=1-controller.landing*.025;visualRoot.scale.y+=(targetScaleY-visualRoot.scale.y)*(1-Math.exp(-dt*16));visualRoot.scale.x+=(1+(controller.landing*.012)-visualRoot.scale.x)*(1-Math.exp(-dt*16));visualRoot.scale.z=visualRoot.scale.x;
    if(controller.mode!=='native'||!controller.native){animateFallback(fallback,kin,dt,t);return;}
    const n=controller.native;let wanted=!grounded?'air':!moving?'idle':kin.sprint||speed>7.5?'run':'walk';
    const action=wanted==='air'?(n.actions.idle||n.actions.walk||n.actions.run):n.actions[wanted]||n.actions.walk||n.actions.idle||n.actions.run;
    if(action&&n.active!==action){const old=n.active;if(old&&old!==action){old.paused=false;old.fadeOut(.16);}action.enabled=true;action.paused=false;action.reset().fadeIn(.18).play();n.active=action;controller.activeMode=wanted;}
    if(n.active){if(wanted==='walk')n.active.timeScale=clamp(speed/4.8,.72,1.65);else if(wanted==='run')n.active.timeScale=clamp(speed/8.3,.82,1.8);else n.active.timeScale=1;}
    n.mixer.update(dt);if(!grounded)airPose(n,kin,dt);
  };
  controller.dispose=()=>{
    controller.disposed=true;try{controller.native?.mixer?.stopAllAction?.();controller.native?.mixer?.uncacheRoot?.(controller.native.model);}catch{}
    controlRoot.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){try{m?.map?.dispose?.();m?.normalMap?.dispose?.();m?.roughnessMap?.dispose?.();m?.metalnessMap?.dispose?.();m?.dispose?.();}catch{}}try{o.geometry?.dispose?.();}catch{}});
    controlRoot.removeFromParent?.();
  };
  return controller;
}
