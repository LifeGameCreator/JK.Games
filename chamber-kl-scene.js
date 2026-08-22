import * as THREE from "three";

const state = {
  host:null, renderer:null, scene:null, camera:null, raf:0, resize:null,
  gun:null, gunBase:null, muzzle:null, shellGroup:null, room:null, ownUid:"", mode:"game",
  onSelectTarget:null, raycaster:new THREE.Raycaster(), pointer:new THREE.Vector2(), clickables:[],
  avatars:new Map(), start:performance.now(), eventAnim:null
};

const GUN_THEMES = {
  standard:{wood:0x6f4428,metal:0x30373b,accent:0xa88158,glow:0x000000},
  ash:{wood:0x77736e,metal:0x30373b,accent:0xa88158,glow:0x000000},
  forest:{wood:0x34503c,metal:0x30373b,accent:0xa88158,glow:0x000000},
  cobalt:{wood:0x263b58,metal:0x30373b,accent:0xa88158,glow:0x000000},
  ivory:{wood:0xd4c5aa,metal:0x30373b,accent:0xa88158,glow:0x000000},
  carbon:{wood:0x20252a,metal:0x11161a,accent:0x5c6770,glow:0x27333c},
  redline:{wood:0x261719,metal:0x141719,accent:0xe0473f,glow:0x8b1714},
  galaxy:{wood:0x24143c,metal:0x151329,accent:0x8e6fff,glow:0x673eff},
  gold:{wood:0x59431d,metal:0x8d691f,accent:0xffd66c,glow:0x8f6a16},
  crystal:{wood:0x224553,metal:0x6fa4b3,accent:0x8bf5ff,glow:0x50d7ff},
  obsidian:{wood:0x121116,metal:0x292431,accent:0xc276ff,glow:0x8b3fff},
  inferno:{wood:0x361812,metal:0x221514,accent:0xff6a2e,glow:0xff3516}
};
const LIVE_SHELL = {standard:[0xa92b25,0xc99c55],ember:[0xe25b24,0xb9783f],toxic:[0x68a33c,0x9b8d51],plasma:[0xff3b9d,0x7bf4ff],royal:[0x562b9d,0xe9c868],void:[0x17151d,0xa47cff]};
const BLANK_SHELL = {standard:[0x11181d,0xb08a51],slate:[0x4b5962,0x7d8588],frost:[0xd9eef0,0x7aa5b8],neon:[0x10333a,0x67fff2],eclipse:[0x251832,0xff7ac9],phantom:[0xdfe8ef,0x8edfff]};

function mat(color,rough=.55,metal=.15,emissive=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity:emissive?0.35:0});}
function addBox(parent,size,pos,color,rough=.6,metal=.08){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color,rough,metal));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function addCylinder(parent,radius,length,pos,color,rot=[0,0,0],rough=.45,metal=.55){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,18),mat(color,rough,metal));m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function colorHex(value,fallback=0xb88a65){try{return new THREE.Color(value||fallback).getHex();}catch{return fallback;}}

function buildRoom(){
  const scene=state.scene;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x090b0d,roughness:.94,metalness:.02}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const back=addBox(scene,[18,7,.3],[0,3.4,-6.5],0x0d1013,.9,.03);
  const side1=addBox(scene,[.3,7,14],[-8.8,3.4,0],0x0b0e10,.9,.03);const side2=side1.clone();side2.position.x=8.8;scene.add(side2);
  for(let i=-3;i<=3;i++){const bar=addBox(scene,[.04,5.2,.08],[i*2.1,3,-6.3],0x23282b,.7,.35);bar.castShadow=false;}
  const ceilingLight=new THREE.RectAreaLight(0xe8dbc0,7.5,6.5,2.2);ceilingLight.position.set(0,6.6,-.6);ceilingLight.rotation.x=-Math.PI/2;scene.add(ceilingLight);
  const warm=new THREE.PointLight(0xf0bc72,25,10,2);warm.position.set(0,4.6,-.3);scene.add(warm);
  const rim1=new THREE.PointLight(0x7c93a5,11,9,2);rim1.position.set(-5,2.4,-3.5);scene.add(rim1);const rim2=rim1.clone();rim2.position.x=5;scene.add(rim2);
  const table=new THREE.Group();scene.add(table);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(3.75,3.75,.28,64),new THREE.MeshStandardMaterial({color:0x171b1d,roughness:.36,metalness:.18}));top.scale.z=.66;top.position.y=1.55;top.receiveShadow=true;top.castShadow=true;table.add(top);
  const inset=new THREE.Mesh(new THREE.CylinderGeometry(3.42,3.42,.035,64),new THREE.MeshStandardMaterial({color:0x172c27,roughness:.85,metalness:.02}));inset.scale.z=.63;inset.position.y=1.705;inset.receiveShadow=true;table.add(inset);
  const edge=new THREE.Mesh(new THREE.TorusGeometry(3.58,.13,12,64),mat(0x5c412a,.43,.18));edge.scale.z=.65;edge.rotation.x=Math.PI/2;edge.position.y=1.64;table.add(edge);
  addCylinder(table,.44,1.45,[0,.73,0],0x22272a,[0,0,0],.5,.55);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.018,8,48),new THREE.MeshStandardMaterial({color:0xa77e45,emissive:0x533713,emissiveIntensity:.45,roughness:.35,metalness:.7}));ring.rotation.x=Math.PI/2;ring.position.y=1.73;ring.scale.z=.68;table.add(ring);
}

function buildChair(parent,position,angle){
  const g=new THREE.Group();g.position.copy(position);g.rotation.y=angle;parent.add(g);
  addBox(g,[1.15,.18,1.05],[0,.65,.18],0x1b1e20,.68,.1);addBox(g,[1.18,1.45,.16],[0,1.35,.65],0x181b1d,.7,.08);
  for(const x of [-.46,.46])for(const z of [-.28,.55])addCylinder(g,.045,.68,[x,.3,z],0x34383a,[0,0,0],.35,.65);
  return g;
}

function buildAvatar(uid,profile,position,angle,alive=true,hideBody=false){
  const root=new THREE.Group();root.position.copy(position);root.rotation.y=angle;state.scene.add(root);
  buildChair(root,new THREE.Vector3(0,0,0),0);
  if(!hideBody){
    const body=new THREE.Group();body.position.set(0,.75,-.02);root.add(body);
    const shirt=profile?.isBot?0x2a2f34:profile?.gender==="female"?0x4b384b:0x34414a;const skin=colorHex(profile?.skinColor,0xc7906c);const hair=colorHex(profile?.hairColor,0x2b221e);
    const torso=addBox(body,[.82,1.05,.48],[0,.72,0],shirt,.75,.02);torso.rotation.x=-.08;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.32,24,18),mat(skin,.78,.01));head.position.set(0,1.52,-.07);head.scale.y=1.08;head.castShadow=true;body.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.335,20,12,0,Math.PI*2,0,Math.PI*.48),mat(hair,.82,.01));cap.position.set(0,1.60,-.06);cap.rotation.x=.12;body.add(cap);
    for(const side of [-1,1]){const arm=addCylinder(body,.11,.74,[side*.52,.78,-.15],skin,[Math.PI/2.8,0,side*.18],.7,.02);arm.rotation.z=side*.15;const leg=addCylinder(body,.15,.88,[side*.23,.08,-.34],0x22282d,[Math.PI/2.6,0,side*.08],.82,.02);leg.position.z=-.43;}
    if(profile?.isBot){const visor=addBox(body,[.46,.08,.05],[0,1.57,-.31],profile.botDifficulty==="hard"?0xe14c44:profile.botDifficulty==="medium"?0xe0ae54:0x6aa1a8,.35,.5);visor.material.emissive=new THREE.Color(profile.botDifficulty==="hard"?0x67120d:0x122429);visor.material.emissiveIntensity=.7;}
    root.userData.body=body;
  }
  const hit=new THREE.Mesh(new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(0,1.45,0);hit.userData.uid=uid;hit.userData.target=true;root.add(hit);state.clickables.push(hit);
  root.userData.uid=uid;root.userData.alive=alive;state.avatars.set(uid,root);if(!alive)root.traverse(o=>{if(o.material&&o.material.color)o.material.color.multiplyScalar(.32);});return root;
}

function buildGun(themeId="standard"){
  const theme=GUN_THEMES[themeId]||GUN_THEMES.standard;const g=new THREE.Group();g.position.set(0,2.14,0);g.rotation.set(.02,0,-.06);state.scene.add(g);state.gun=g;state.gunBase=g.position.clone();
  const stock=addBox(g,[1.5,.36,.42],[-1.15,0,0],theme.wood,.42,.08);stock.rotation.z=.12;stock.geometry.translate(-.15,0,0);
  const grip=addBox(g,[.35,.7,.34],[-.35,-.34,0],theme.wood,.45,.08);grip.rotation.z=-.34;
  addBox(g,[.78,.5,.5],[.05,0,0],theme.metal,.28,.72);
  const barrel1=addCylinder(g,.11,2.85,[1.65,.11,-.14],theme.metal,[0,0,Math.PI/2],.22,.88);const barrel2=addCylinder(g,.11,2.85,[1.65,.11,.14],theme.metal,[0,0,Math.PI/2],.22,.88);
  addCylinder(g,.14,.52,[.36,-.34,0],theme.accent,[Math.PI/2,0,0],.25,.8);
  const rib=addBox(g,[2.7,.045,.16],[1.56,.25,0],theme.accent,.28,.72);rib.material.emissive=new THREE.Color(theme.glow);rib.material.emissiveIntensity=theme.glow?1.2:0;
  if(theme.glow){const light=new THREE.PointLight(theme.glow,5.5,4.5,2);light.position.set(.8,.15,0);g.add(light);}
  const muzzle=new THREE.PointLight(0xff9d4d,0,4,2);muzzle.position.set(3.05,.12,0);g.add(muzzle);state.muzzle=muzzle;
  return g;
}

function shellMesh(type,skinId){const map=type==="live"?LIVE_SHELL:BLANK_SHELL;const [body,metal]=map[skinId]||map.standard;const g=new THREE.Group();const caseMesh=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.42,16),mat(body,.38,.25));caseMesh.castShadow=true;g.add(caseMesh);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.08,16),mat(metal,.25,.75));cap.position.y=-.23;g.add(cap);return g;}
function buildShellDisplay(cosmetics){const group=new THREE.Group();group.position.set(-.6,1.92,.82);state.scene.add(group);state.shellGroup=group;for(let i=0;i<3;i++){const m=shellMesh(i===1?"blank":"live",i===1?cosmetics.blankShellSkin:cosmetics.liveShellSkin);m.position.set(i*.24,0,0);m.rotation.z=Math.PI/2;group.add(m);}group.visible=false;}

function seatPosition(relative,n){if(n===2)return relative===0?new THREE.Vector3(0,0,4.15):new THREE.Vector3(0,0,-4.15);const angle=relative*(Math.PI*2/n);return new THREE.Vector3(Math.sin(angle)*4.15,0,Math.cos(angle)*4.15);}
function seatAngle(pos){return Math.atan2(-pos.x,-pos.z);}
function populatePlayers(room,mode){const uids=room?.turnOrder?.length?room.turnOrder:room?.playerUids||[];const n=Math.max(2,uids.length||2);const ownIndex=Math.max(0,uids.indexOf(state.ownUid));uids.forEach((uid,index)=>{const relative=(index-ownIndex+n)%n;const pos=seatPosition(relative,n);const p=room?.profiles?.[uid]||{};const alive=room?.status==="waiting"||Number(room?.hp?.[uid]||0)>0;const hide=mode==="game"&&uid===state.ownUid;buildAvatar(uid,p,pos,seatAngle(pos),alive,hide);});}

function setCamera(room,mode){const count=Math.max(2,(room?.playerUids||[]).length);if(mode==="lobby"){state.camera.position.set(0,6.1,7.9);state.camera.lookAt(0,1.2,0);return;}if(mode==="finish"){state.camera.position.set(0,4.2,6.8);state.camera.lookAt(0,1.55,0);return;}if(count===2){state.camera.position.set(0,2.55,5.8);state.camera.lookAt(0,1.58,-1.1);}else{state.camera.position.set(0,3.0,6.2);state.camera.lookAt(0,1.55,-.5);}}

function resize(){if(!state.host||!state.renderer||!state.camera)return;const r=state.host.getBoundingClientRect();const w=Math.max(2,Math.floor(r.width)),h=Math.max(2,Math.floor(r.height));state.renderer.setSize(w,h,false);state.camera.aspect=w/h;state.camera.updateProjectionMatrix();}
function onPointer(event){if(!state.renderer||!state.onSelectTarget)return;const rect=state.renderer.domElement.getBoundingClientRect();state.pointer.x=((event.clientX-rect.left)/rect.width)*2-1;state.pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;state.raycaster.setFromCamera(state.pointer,state.camera);const hit=state.raycaster.intersectObjects(state.clickables,false)[0];if(hit?.object?.userData?.uid)state.onSelectTarget(hit.object.userData.uid);}

function animate(){state.raf=requestAnimationFrame(animate);if(!state.renderer)return;const t=(performance.now()-state.start)/1000;if(state.gun){state.gun.position.y=state.gunBase.y+Math.sin(t*1.45)*.035;state.gun.rotation.y=Math.sin(t*.7)*.025;}
  for(const root of state.avatars.values()){const body=root.userData.body;if(body)body.position.y=.75+Math.sin(t*1.1+(root.position.x||0))*.012;}
  if(state.eventAnim){const a=state.eventAnim,p=Math.min(1,(performance.now()-a.start)/a.duration);if(a.type==="fire"&&state.gun){state.gun.position.x=state.gunBase.x-Math.sin(p*Math.PI)*.38;state.gun.rotation.z=-.06-Math.sin(p*Math.PI)*.12;if(state.muzzle)state.muzzle.intensity=p<.18?28*(1-p/.18):0;}else if(a.type==="blank"&&state.gun){state.gun.rotation.z=-.06+Math.sin(p*Math.PI*4)*.018;}else if(a.type==="reload"&&state.gun){state.gun.rotation.z=-.06+Math.sin(p*Math.PI)*.34;state.gun.rotation.x=.02+Math.sin(p*Math.PI)*.18;if(state.shellGroup){state.shellGroup.visible=p>.12&&p<.86;state.shellGroup.position.y=1.55+Math.sin(p*Math.PI)*.85;state.shellGroup.position.x=-.7+p*.7;}}if(p>=1){if(state.muzzle)state.muzzle.intensity=0;if(state.shellGroup)state.shellGroup.visible=false;state.eventAnim=null;}}
  state.renderer.render(state.scene,state.camera);
}

function destroy(){cancelAnimationFrame(state.raf);state.raf=0;if(state.resize)window.removeEventListener("resize",state.resize);if(state.renderer){state.renderer.domElement.removeEventListener("pointerdown",onPointer);state.renderer.dispose();try{state.renderer.domElement.remove();}catch{}}state.host=null;state.renderer=null;state.scene=null;state.camera=null;state.gun=null;state.shellGroup=null;state.clickables=[];state.avatars.clear();state.eventAnim=null;}

function mount(host,options={}){destroy();state.host=host;state.room=options.room||{};state.ownUid=String(options.ownUid||"");state.mode=options.mode||"game";state.onSelectTarget=typeof options.onSelectTarget==="function"?options.onSelectTarget:null;state.scene=new THREE.Scene();state.scene.background=new THREE.Color(0x07090a);state.scene.fog=new THREE.FogExp2(0x07090a,.055);state.camera=new THREE.PerspectiveCamera(42,1,.1,100);state.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});state.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));state.renderer.shadowMap.enabled=true;state.renderer.shadowMap.type=THREE.PCFSoftShadowMap;state.renderer.toneMapping=THREE.ACESFilmicToneMapping;state.renderer.toneMappingExposure=.92;state.renderer.outputColorSpace=THREE.SRGBColorSpace;host.innerHTML="";host.append(state.renderer.domElement);buildRoom();populatePlayers(state.room,state.mode);const cosmetics=options.cosmetics||{};buildGun(cosmetics.shotgunSkin||"standard");buildShellDisplay(cosmetics);setCamera(state.room,state.mode);resize();state.resize=resize;window.addEventListener("resize",resize,{passive:true});state.renderer.domElement.addEventListener("pointerdown",onPointer);state.start=performance.now();animate();}
function playEvent(event){if(!event)return;const type=event.type==="shot-live"?"fire":event.type==="shot-blank"?"blank":event.type==="reload"?"reload":"pulse";state.eventAnim={type,start:performance.now(),duration:type==="reload"?1250:type==="fire"?430:type==="blank"?360:320};}

window.ChamberKLScene=Object.freeze({mount,playEvent,destroy,version:"20260822-chamber-kl-scene-v2"});
