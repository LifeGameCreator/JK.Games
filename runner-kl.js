import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const STORAGE = 'jk-games-runner-kl-v4';
const ASSET_ROOT = './assets/cottbus/';
const MODEL_PATHS = { male: `${ASSET_ROOT}player-male.glb`, female: `${ASSET_ROOT}player-female.glb` };
const OUTFITS = {
  maleStreet:{name:'CB Street Mann',model:'male',price:0,tint:0xffffff},
  femaleStreet:{name:'CB Street Frau',model:'female',price:0,tint:0xffffff},
  maleSport:{name:'Sportläufer',model:'male',price:450,tint:0xc94435},
  femaleNight:{name:'Nachtläuferin',model:'female',price:650,tint:0x5e4ba8},
  maleWorker:{name:'Bauarbeiter',model:'male',price:800,tint:0xe29a2f},
  femaleCity:{name:'City Style',model:'female',price:950,tint:0x253c58}
};

const S = {
  overlay:null, scene:null, camera:null, renderer:null, composer:null, bloom:null, clock:new THREE.Clock(), raf:0,
  loader:new GLTFLoader(), running:false, paused:false, gameOver:false,
  lane:1, targetX:0, y:0, vy:0, slide:0, speed:12, distance:0, runCoins:0,
  wallet:0, best:0, owned:['maleStreet','femaleStreet'], outfit:'maleStreet',
  player:null, mixer:null, action:null, world:null, segments:[], objects:[],
  spawnTimer:0, elapsed:0, loadingToken:0, resizeHandler:null, keyHandler:null,
  pointerStart:null, lastTap:0, dpr:1, lowPower:false, characterRig:null, characterTime:0,
  score:0, boardTokens:3, activeBoosts:{magnet:0,jetpack:0,sneakers:0,multiplier:0},
  hoverboard:0, hoverCooldown:0, boardMesh:null, boostFx:null
};

function loadSave(){
  try{
    const d=JSON.parse(localStorage.getItem(STORAGE)||'{}');
    S.wallet=Math.max(0,Number(d.wallet||0)); S.best=Math.max(0,Number(d.best||0));
    S.owned=Array.isArray(d.owned)&&d.owned.length?d.owned.filter(k=>OUTFITS[k]):['maleStreet','femaleStreet'];
    for(const id of ['maleStreet','femaleStreet']) if(!S.owned.includes(id)) S.owned.push(id);
    S.outfit=OUTFITS[d.outfit]&&S.owned.includes(d.outfit)?d.outfit:'maleStreet';
    S.boardTokens=Math.max(0,Number(d.boardTokens??3));
  }catch{S.wallet=0;S.best=0;S.owned=['maleStreet','femaleStreet'];S.outfit='maleStreet'}
}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({wallet:S.wallet,best:S.best,owned:S.owned,outfit:S.outfit,boardTokens:S.boardTokens}))}catch{}}

function makeCanvasTexture(draw,size=512,repeatX=1,repeatY=1){
  const cv=document.createElement('canvas');cv.width=cv.height=size;const c=cv.getContext('2d');draw(c,size);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=4;return t;
}
function cobbleTexture(){return makeCanvasTexture((c,s)=>{
  c.fillStyle='#6c6a64';c.fillRect(0,0,s,s);const rnd=mulberry32(1947);const rows=16,hh=s/rows;
  for(let r=0;r<rows;r++){
    const count=r%2?9:10,ww=s/count,off=r%2?-ww*.5:0;
    for(let x=off;x<s+ww;x+=ww){
      const v=82+Math.floor(rnd()*48),warm=Math.floor(rnd()*9);c.fillStyle=`rgb(${v+warm},${v+warm-3},${v-7})`;
      c.beginPath();c.roundRect(x+2,r*hh+2,ww-4,hh-4,4+rnd()*3);c.fill();
      c.strokeStyle='rgba(31,35,34,.64)';c.lineWidth=2.4;c.stroke();
      c.strokeStyle='rgba(255,255,255,.10)';c.lineWidth=1;c.beginPath();c.moveTo(x+6,r*hh+6);c.lineTo(x+ww-7,r*hh+5);c.stroke();
      if(rnd()>.76){c.strokeStyle='rgba(34,30,27,.48)';c.beginPath();c.moveTo(x+ww*.22,r*hh+hh*.2);c.lineTo(x+ww*.56,r*hh+hh*.52);c.lineTo(x+ww*.41,r*hh+hh*.82);c.stroke()}
    }
  }
  for(let i=0;i<180;i++){c.fillStyle=`rgba(30,27,24,${rnd()*.12})`;c.beginPath();c.arc(rnd()*s,rnd()*s,.4+rnd()*2.4,0,Math.PI*2);c.fill()}
  const g=c.createLinearGradient(0,0,s,s);g.addColorStop(0,'rgba(255,238,208,.11)');g.addColorStop(.55,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(8,18,20,.20)');c.fillStyle=g;c.fillRect(0,0,s,s);
 },768,2.3,18)}
function sidewalkTexture(){return makeCanvasTexture((c,s)=>{
  c.fillStyle='#aaa49a';c.fillRect(0,0,s,s);const rnd=mulberry32(721);const tile=64;
  for(let y=0;y<s;y+=tile)for(let x=0;x<s;x+=tile){const v=155+Math.floor(rnd()*26);c.fillStyle=`rgb(${v+5},${v+2},${v-4})`;c.fillRect(x+2,y+2,tile-4,tile-4);c.strokeStyle='rgba(55,52,47,.38)';c.lineWidth=2;c.strokeRect(x+2,y+2,tile-4,tile-4);if(rnd()>.72){c.strokeStyle='rgba(65,58,52,.26)';c.beginPath();c.moveTo(x+10,y+12);c.lineTo(x+35,y+31);c.lineTo(x+27,y+54);c.stroke()}}
  for(let i=0;i<55;i++){c.fillStyle='rgba(45,40,35,.08)';c.beginPath();c.ellipse(rnd()*s,rnd()*s,8+rnd()*24,3+rnd()*10,rnd()*3,0,Math.PI*2);c.fill()}
 },512,2,18)}
function roofTexture(){return makeCanvasTexture((c,s)=>{c.fillStyle='#49433e';c.fillRect(0,0,s,s);for(let y=0;y<s;y+=34){for(let x=(y/34)%2? -28:0;x<s;x+=56){c.fillStyle=((x+y)/34)%3?'#5d554f':'#514943';c.fillRect(x+2,y+2,52,29);c.strokeStyle='rgba(20,18,16,.45)';c.strokeRect(x+2,y+2,52,29)}}},512,2,3)}
function wallTexture(base,damaged=false,seed=1){return makeCanvasTexture((c,s)=>{
  c.fillStyle=base;c.fillRect(0,0,s,s);const rnd=mulberry32(seed);
  for(let i=0;i<1300;i++){const a=rnd()*.06;c.fillStyle=`rgba(${rnd()>0.5?'255,255,255':'30,24,18'},${a})`;c.fillRect(rnd()*s,rnd()*s,1+rnd()*3,1+rnd()*3)}
  if(damaged){
    for(let i=0;i<5;i++){let x=rnd()*s,y=rnd()*s*.75;c.strokeStyle='rgba(52,44,38,.62)';c.lineWidth=2+rnd()*2;c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*32;y+=20+rnd()*35;c.lineTo(x,y)}c.stroke()}
    for(let i=0;i<8;i++){c.fillStyle='rgba(78,67,58,.18)';c.beginPath();c.ellipse(rnd()*s,rnd()*s,18+rnd()*45,12+rnd()*55,rnd()*2,0,Math.PI*2);c.fill()}
  }
 },512,1,1)}
function shopTexture(label,color='#8b2f26'){return makeCanvasTexture((c,s)=>{
  c.fillStyle='#182523';c.fillRect(0,0,s,s);c.fillStyle='#95bdc1';c.fillRect(25,80,s-50,s-110);
  const g=c.createLinearGradient(0,80,s,s);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(.35,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(9,18,19,.2)');c.fillStyle=g;c.fillRect(25,80,s-50,s-110);
  c.fillStyle=color;c.fillRect(0,0,s,72);c.fillStyle='#fff7df';c.font='900 44px system-ui';c.textAlign='center';c.fillText(label, s/2,50);
 },512,1,1)}
function mulberry32(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

function setupScene(){
  const canvas=S.overlay.querySelector('canvas');
  S.scene=new THREE.Scene();S.scene.background=new THREE.Color(0x9fc5d8);S.scene.fog=new THREE.FogExp2(0xc4d0ce,.0092);
  S.camera=new THREE.PerspectiveCamera(56,1,.1,240);S.camera.position.set(0,3.72,7.35);S.camera.lookAt(0,1.25,-14);
  S.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  S.renderer.outputColorSpace=THREE.SRGBColorSpace;S.renderer.toneMapping=THREE.ACESFilmicToneMapping;S.renderer.toneMappingExposure=1.14;
  S.renderer.shadowMap.enabled=true;S.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  S.renderer.setClearColor(0xa9ccdd,1);
  const pmrem=new THREE.PMREMGenerator(S.renderer);S.scene.environment=pmrem.fromScene(new RoomEnvironment(),.045).texture;pmrem.dispose();
  S.composer=new EffectComposer(S.renderer);S.composer.addPass(new RenderPass(S.scene,S.camera));
  S.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),S.lowPower?.25:.52,.55,.86);S.composer.addPass(S.bloom);S.composer.addPass(new OutputPass());
  S.lowPower=(navigator.hardwareConcurrency||8)<=4;resize();
  S.scene.add(new THREE.HemisphereLight(0xe3f3ff,0x51463a,1.85));
  const sun=new THREE.DirectionalLight(0xffdfad,3.75);sun.position.set(-22,32,16);sun.castShadow=true;sun.shadow.mapSize.set(S.lowPower?1024:2048,S.lowPower?1024:2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-8;sun.shadow.camera.far=90;S.scene.add(sun);
  const fill=new THREE.DirectionalLight(0xaed7ff,.75);fill.position.set(20,10,-20);S.scene.add(fill);
  createWorld();
  addCinematicLighting();
}
function addCinematicLighting(){
  const rim=new THREE.SpotLight(0xffc880,28,55,.45,.75,1.2);rim.position.set(-11,17,12);rim.target.position.set(0,1,-18);rim.castShadow=!S.lowPower;S.scene.add(rim,rim.target);
  const cool=new THREE.PointLight(0x8ccfff,5,28,2);cool.position.set(8,5,-16);S.scene.add(cool);
  const groundGlow=new THREE.RectAreaLight(0xffd7a0,2.2,10,4);groundGlow.position.set(-2,.8,4);groundGlow.rotation.x=-Math.PI/2;S.scene.add(groundGlow);
}
function resize(){if(!S.renderer||!S.overlay)return;const r=S.overlay.querySelector('.runner-kl-stage').getBoundingClientRect();S.dpr=Math.min(S.lowPower?1.35:1.75,window.devicePixelRatio||1);S.renderer.setPixelRatio(S.dpr);S.renderer.setSize(r.width,r.height,false);S.composer?.setPixelRatio?.(S.dpr);S.composer?.setSize?.(r.width,r.height);S.camera.aspect=r.width/r.height;S.camera.updateProjectionMatrix()}

function createWorld(){
  S.world=new THREE.Group();S.scene.add(S.world);
  const roadMat=new THREE.MeshStandardMaterial({map:cobbleTexture(),roughness:.92,metalness:.02,color:0xb8b2a8,normalScale:new THREE.Vector2(.35,.35)});
  const walkMat=new THREE.MeshStandardMaterial({map:sidewalkTexture(),roughness:.95,color:0xc5beb3});
  for(let i=0;i<8;i++){const seg=createSegment(-i*25,roadMat,walkMat,i);S.segments.push(seg);S.world.add(seg)}
  S.scene.add(createSkyline());createOverheadWires();createAtmosphere();createPlayer();
}
function createSegment(z,roadMat,walkMat,index){
  const g=new THREE.Group();g.position.z=z;
  const road=new THREE.Mesh(new THREE.PlaneGeometry(12,25,8,18),roadMat);road.rotation.x=-Math.PI/2;road.receiveShadow=true;g.add(road);
  const gutterMat=new THREE.MeshStandardMaterial({color:0x6d6c68,roughness:.88});
  for(const side of[-1,1]){
    const sw=new THREE.Mesh(new THREE.PlaneGeometry(4.3,25,2,12),walkMat);sw.rotation.x=-Math.PI/2;sw.position.set(side*8.15,.13,0);sw.receiveShadow=true;g.add(sw);
    const curb=new THREE.Mesh(new THREE.BoxGeometry(.34,.26,25),new THREE.MeshStandardMaterial({color:0xb2aca1,roughness:.92}));curb.position.set(side*6.02,.13,0);curb.castShadow=curb.receiveShadow=true;g.add(curb);
    const gutter=new THREE.Mesh(new THREE.BoxGeometry(.42,.035,25),gutterMat);gutter.position.set(side*5.78,.035,0);gutter.receiveShadow=true;g.add(gutter);
    g.add(createBuildingRow(side,index));
    for(let k=0;k<3;k++)g.add(createStreetProp(side,-9+k*8+(index%2)*1.7,index*4+k));
  }
  const railMat=new THREE.MeshStandardMaterial({color:0x62676a,roughness:.22,metalness:.9});
  for(const x of[-1.45,1.45]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.11,.075,25),railMat);rail.position.set(x,.065,0);rail.castShadow=true;rail.receiveShadow=true;g.add(rail)}
  const sleeperMat=new THREE.MeshStandardMaterial({color:0x4e4944,roughness:.96});
  for(let z0=-11;z0<=11;z0+=2.3){const sleeper=new THREE.Mesh(new THREE.BoxGeometry(3.5,.06,.16),sleeperMat);sleeper.position.set(0,.035,z0);sleeper.receiveShadow=true;g.add(sleeper)}
  if(index%4===1){for(let x=-4.8;x<=4.8;x+=1.2){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.72,3.2),new THREE.MeshStandardMaterial({color:0xe4dfd2,roughness:.86}));stripe.rotation.x=-Math.PI/2;stripe.position.set(x,.075,-8.8);stripe.receiveShadow=true;g.add(stripe)}}
  if(index%3===0){const drain=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.045,28),new THREE.MeshStandardMaterial({color:0x454b4c,roughness:.48,metalness:.68}));drain.rotation.x=-Math.PI/2;drain.position.set(index%2?2.8:-2.7,.06,-5);g.add(drain)}
  return g;
}
function createBuildingRow(side,index){
  const row=new THREE.Group(),rnd=mulberry32(index*91+(side>0?17:3));
  const names=['CAFÉ CB','STADT-LADEN','SPREMBERG','KONDITOREI','MODEHAUS','BUCH & CO'];
  const colors=['#c8a47f','#d8c8ac','#b97b69','#d9d1c2','#aaa093','#cc9067'];let cursor=-11.6;
  for(let i=0;i<4;i++){
    const width=4.7+rnd()*2.05,height=8.7+rnd()*6.1,depth=5.4+rnd()*2.2,damaged=(index+i)%4===0;
    const b=new THREE.Group(),centerZ=cursor+width/2,baseX=side*(8.1+depth/2),frontX=side*(8.1+.015),frontRot=side>0?-Math.PI/2:Math.PI/2;
    const wallMat=new THREE.MeshStandardMaterial({map:wallTexture(colors[(index+i)%colors.length],damaged,index*17+i),roughness:.91,color:0xffffff});
    const body=new THREE.Mesh(new THREE.BoxGeometry(depth,height,width),wallMat);body.position.set(baseX,height/2,centerZ);body.castShadow=true;body.receiveShadow=true;b.add(body);
    const stone=new THREE.MeshStandardMaterial({color:0x756c63,roughness:.96});
    const plinth=new THREE.Mesh(new THREE.BoxGeometry(depth+.08,.65,width+.08),stone);plinth.position.set(baseX,.325,centerZ);plinth.castShadow=true;b.add(plinth);
    for(const y of[2.85,height-.35]){const band=new THREE.Mesh(new THREE.BoxGeometry(depth+.18,.16,width+.18),new THREE.MeshStandardMaterial({color:0xe0d4c1,roughness:.9}));band.position.set(baseX,y,centerZ);band.castShadow=true;b.add(band)}
    const shopFrame=new THREE.Mesh(new THREE.PlaneGeometry(width*.88,2.48),new THREE.MeshStandardMaterial({color:0x292d2b,roughness:.68,metalness:.12}));shopFrame.position.set(frontX,1.62,centerZ);shopFrame.rotation.y=frontRot;b.add(shopFrame);
    const shop=new THREE.Mesh(new THREE.PlaneGeometry(width*.81,2.22),new THREE.MeshStandardMaterial({map:shopTexture(names[(index+i)%names.length],(index+i)%2?'#2e665b':'#8c3c31'),roughness:.36,metalness:.12}));shop.position.set(frontX+(side>0?-.018:.018),1.63,centerZ);shop.rotation.y=frontRot;b.add(shop);
    const doorMat=new THREE.MeshPhysicalMaterial({color:0x243536,roughness:.28,metalness:.2,clearcoat:.45});
    const door=new THREE.Mesh(new THREE.PlaneGeometry(.78,1.92),doorMat);door.position.set(frontX+(side>0?-.032:.032),1.05,centerZ+width*.29);door.rotation.y=frontRot;b.add(door);
    const winMat=new THREE.MeshPhysicalMaterial({color:0x789da7,roughness:.18,metalness:.15,emissive:0x152325,emissiveIntensity:.22,clearcoat:.5});
    const frameMat=new THREE.MeshStandardMaterial({color:0xe7ddcf,roughness:.78});const rows=Math.max(2,Math.floor((height-3.2)/2.05));
    for(let ry=0;ry<rows;ry++)for(let wz=-1;wz<=1;wz++){
      const py=3.55+ry*1.85,pz=centerZ+wz*(width*.245);const frame=new THREE.Mesh(new THREE.PlaneGeometry(.91,1.25),frameMat);frame.position.set(frontX,py,pz);frame.rotation.y=frontRot;b.add(frame);
      const win=new THREE.Mesh(new THREE.PlaneGeometry(.72,1.04),winMat);win.position.set(frontX+(side>0?-.025:.025),py,pz);win.rotation.y=frontRot;b.add(win);
      const sill=new THREE.Mesh(new THREE.BoxGeometry(.18,.09,.96),frameMat);sill.position.set(side*(8.1-.045),py-.66,pz);sill.castShadow=true;b.add(sill);
    }
    if((index+i)%3===1){const balconyMat=new THREE.MeshStandardMaterial({color:0x3b4543,roughness:.55,metalness:.5});const slab=new THREE.Mesh(new THREE.BoxGeometry(.82,.13,width*.55),stone);slab.position.set(side*7.72,5.15,centerZ);slab.castShadow=true;b.add(slab);for(let z1=-2;z1<=2;z1++){const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,1.0,.055),balconyMat);rail.position.set(side*7.31,5.68,centerZ+z1*width*.115);b.add(rail)}const top=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,width*.62),balconyMat);top.position.set(side*7.31,6.18,centerZ);b.add(top)}
    const roofMat=new THREE.MeshStandardMaterial({map:roofTexture(),roughness:.88});const roofH=1.3+rnd()*1.1;const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(depth,width)*.7,roofH,4),roofMat);roof.scale.set(depth/width,1,1);roof.rotation.y=Math.PI/4;roof.position.set(baseX,height+roofH*.48,centerZ);roof.castShadow=true;b.add(roof);
    for(let d=0;d<(S.lowPower?1:2);d++){const dormer=new THREE.Mesh(new THREE.BoxGeometry(.85,.72,.72),wallMat);dormer.position.set(side*(8.1+depth*.18),height+.5,centerZ+(d?1:-1)*width*.2);dormer.castShadow=true;b.add(dormer)}
    if(damaged){for(let r=0;r<4;r++){const crack=new THREE.Mesh(new THREE.PlaneGeometry(.055,.72+r*.18),new THREE.MeshBasicMaterial({color:0x463d36}));crack.position.set(frontX+(side>0?-.03:.03),4.1+r*1.45,centerZ+width*(-.28+.18*r));crack.rotation.y=frontRot;crack.rotation.z=.45-r*.19;b.add(crack)}const patch=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.6),new THREE.MeshBasicMaterial({color:0x75695e,transparent:true,opacity:.28}));patch.position.set(frontX+(side>0?-.035:.035),height*.62,centerZ-width*.22);patch.rotation.y=frontRot;patch.rotation.z=.18;b.add(patch)}
    row.add(b);cursor+=width+.22;
  }return row;
}
function createStreetProp(side,z,seed){
  const g=new THREE.Group();g.position.set(side*6.9,0,z);const dark=new THREE.MeshStandardMaterial({color:0x24302d,roughness:.52,metalness:.42});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,.18,12),dark);base.position.y=.09;g.add(base);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.075,3.35,12),dark);pole.position.y=1.76;pole.castShadow=true;g.add(pole);
  const arm=new THREE.Mesh(new THREE.TorusGeometry(.42,.042,8,16,Math.PI),dark);arm.rotation.z=side>0?0:Math.PI;arm.position.set(-side*.38,3.2,0);g.add(arm);
  const bulbMat=new THREE.MeshStandardMaterial({color:0xffe7ad,emissive:0xffc85c,emissiveIntensity:1.8,roughness:.22});const lamp=new THREE.Mesh(new THREE.SphereGeometry(.17,16,10),bulbMat);lamp.position.set(-side*.78,3.14,0);g.add(lamp);
  if(seed%2===0){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,1.9,10),new THREE.MeshStandardMaterial({color:0x65482f,roughness:1}));trunk.position.set(side*.8,.95,.72);trunk.castShadow=true;g.add(trunk);for(let k=0;k<3;k++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.58+k*.08,2),new THREE.MeshStandardMaterial({color:k%2?0x426b43:0x557647,roughness:1}));crown.position.set(side*.8+(k-1)*.25,1.95+k*.25,.72+(k%2?.22:-.14));crown.castShadow=true;g.add(crown)}}
  else{const wood=new THREE.MeshStandardMaterial({color:0x554031,roughness:.9});for(let q=0;q<4;q++){const slat=new THREE.Mesh(new THREE.BoxGeometry(1.52,.09,.11),wood);slat.position.set(side*.72,.46+q*.18,.78+(q?0:.08));slat.castShadow=true;g.add(slat)}for(const x of[-.56,.56]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.48,.08),dark);leg.position.set(side*.72+x,.24,.8);g.add(leg)}}
  if(seed%3===0){const bin=new THREE.Mesh(new THREE.CylinderGeometry(.22,.25,.65,14),dark);bin.position.set(-side*.48,.34,-.62);bin.castShadow=true;g.add(bin)}return g;
}

function createOverheadWires(){
  const mat=new THREE.LineBasicMaterial({color:0x273332,transparent:true,opacity:.72});
  for(const x of[-3.1,0,3.1]){const pts=[];for(let i=0;i<10;i++)pts.push(new THREE.Vector3(x,6.2+Math.sin(i*.9)*.18,8-i*18));const geo=new THREE.BufferGeometry().setFromPoints(pts);S.scene.add(new THREE.Line(geo,mat))}
  for(let i=0;i<9;i++){const z=2-i*18;const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7.1,6.5,z),new THREE.Vector3(7.1,6.5,z)]);S.scene.add(new THREE.Line(geo,mat))}
}
function createAtmosphere(){
  const puddleMat=new THREE.MeshPhysicalMaterial({color:0x486873,roughness:.08,metalness:.2,transparent:true,opacity:.48,clearcoat:1,clearcoatRoughness:.08});
  for(let i=0;i<(S.lowPower?10:20);i++){const p=new THREE.Mesh(new THREE.CircleGeometry(.35+Math.random()*.7,28),puddleMat);p.rotation.x=-Math.PI/2;p.scale.x=1.7+Math.random()*2.6;p.position.set((Math.random()-.5)*9,.058,-Math.random()*170);S.scene.add(p)}
  const dustGeo=new THREE.BufferGeometry(),arr=[];for(let i=0;i<(S.lowPower?80:170);i++)arr.push((Math.random()-.5)*24,Math.random()*10,-Math.random()*180);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));S.scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffe4b5,size:.04,transparent:true,opacity:.27,depthWrite:false})));
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:makeCanvasTexture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,246,210,.95)');g.addColorStop(.12,'rgba(255,220,145,.65)');g.addColorStop(1,'rgba(255,200,100,0)');c.fillStyle=g;c.fillRect(0,0,s,s)},256),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sun.scale.set(20,20,1);sun.position.set(-42,33,-95);S.scene.add(sun);
}
function createSkyline(){
  const g=new THREE.Group();const tower=new THREE.Group();tower.position.set(-13,0,-128);const stone=new THREE.MeshStandardMaterial({color:0xbda681,roughness:.92});
  const body=new THREE.Mesh(new THREE.BoxGeometry(5.4,23,5.4),stone);body.position.y=11.5;body.castShadow=true;tower.add(body);
  for(let y=4;y<21;y+=3.1)for(const x of[-1.25,0,1.25]){const w=new THREE.Mesh(new THREE.PlaneGeometry(.52,1.05),new THREE.MeshStandardMaterial({color:0x40575a,roughness:.25,emissive:0x172425,emissiveIntensity:.2}));w.position.set(x,y,2.71);tower.add(w)}
  const clockFace=new THREE.Mesh(new THREE.CircleGeometry(1.12,32),new THREE.MeshStandardMaterial({color:0xe8dfc9,roughness:.7}));clockFace.position.set(0,19.5,2.73);tower.add(clockFace);const hand=new THREE.Mesh(new THREE.BoxGeometry(.08,.82,.04),new THREE.MeshStandardMaterial({color:0x2e302f}));hand.position.set(0,19.7,2.77);hand.rotation.z=.55;tower.add(hand);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.35,9.4,4),new THREE.MeshStandardMaterial({color:0x2e5147,roughness:.75,metalness:.12}));roof.position.y=27.7;roof.rotation.y=Math.PI/4;roof.castShadow=true;tower.add(roof);const spire=new THREE.Mesh(new THREE.CylinderGeometry(.11,.2,6.5,10),new THREE.MeshStandardMaterial({color:0x233b34,metalness:.42,roughness:.5}));spire.position.y=35.4;tower.add(spire);g.add(tower);return g;
}


function fabricDetailTexture(base='#262a2f',accent='#111418'){
  return makeCanvasTexture((c,s)=>{
    c.fillStyle=base;c.fillRect(0,0,s,s);
    for(let y=0;y<s;y+=4){c.strokeStyle='rgba(255,255,255,.045)';c.beginPath();c.moveTo(0,y);c.lineTo(s,y+1);c.stroke()}
    for(let x=0;x<s;x+=5){c.strokeStyle='rgba(0,0,0,.055)';c.beginPath();c.moveTo(x,0);c.lineTo(x+1,s);c.stroke()}
    const g=c.createLinearGradient(0,0,s,s);g.addColorStop(0,'rgba(255,255,255,.12)');g.addColorStop(.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.18)');c.fillStyle=g;c.fillRect(0,0,s,s);
    c.strokeStyle=accent;c.lineWidth=4;c.strokeRect(8,8,s-16,s-16);
  },512,2,3)
}
function addMesh(parent,geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],name=''){
  const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m
}
function createCharacterMaterials(outfit){
  const base=outfit.tint===0xffffff?0x20252b:outfit.tint;
  const jacketMap=fabricDetailTexture(`#${new THREE.Color(base).getHexString()}`,'#0b0d10');
  const pantsMap=fabricDetailTexture('#171a1e','#08090b');
  const jacket=new THREE.MeshPhysicalMaterial({map:jacketMap,color:0xffffff,roughness:.68,metalness:.02,clearcoat:.12,clearcoatRoughness:.72,envMapIntensity:1.05});
  const pants=new THREE.MeshStandardMaterial({map:pantsMap,color:0xffffff,roughness:.88,metalness:.01,envMapIntensity:.72});
  const rubber=new THREE.MeshPhysicalMaterial({color:0x14171a,roughness:.55,clearcoat:.18,clearcoatRoughness:.6});
  const sole=new THREE.MeshStandardMaterial({color:0xe9e4d8,roughness:.72});
  const metal=new THREE.MeshStandardMaterial({color:0xc5c9c7,metalness:.72,roughness:.28});
  const hair=new THREE.MeshStandardMaterial({color:outfit.model==='female'?0x31231e:0x171515,roughness:.84});
  return {jacket,pants,rubber,sole,metal,hair}
}
function addStitch(parent,a,b,material){
  const curve=new THREE.CatmullRomCurve3(a.map(v=>new THREE.Vector3(...v)));const tube=new THREE.TubeGeometry(curve,16,.009,5,false);return addMesh(parent,tube,material)
}
function createPremiumRunnerShell(pivot,outfit){
  const M=createCharacterMaterials(outfit), female=outfit.model==='female';
  const shell=new THREE.Group();shell.name='rklPremiumShell';pivot.add(shell);
  // Tailored jacket, layered so the original rig remains visible and animated beneath it.
  const torso=addMesh(shell,new THREE.CapsuleGeometry(female?.29:.34,.68,10,24),M.jacket,[0,1.06,.035],[female?1.0:1.08,1,.64],[0,0,0],'jacketTorso');
  const shoulderGeo=new THREE.SphereGeometry(.19,20,14);
  addMesh(shell,shoulderGeo,M.jacket,[-(female?.27:.32),1.33,.015],[1.05,.82,.86]);addMesh(shell,shoulderGeo,M.jacket,[(female?.27:.32),1.33,.015],[1.05,.82,.86]);
  const waist=addMesh(shell,new THREE.CylinderGeometry(female?.25:.29,female?.30:.34,.16,28),M.jacket,[0,.68,.035],[1,1,.62]);
  // Center zipper, pockets and seams.
  addMesh(shell,new THREE.BoxGeometry(.018,.76,.018),M.metal,[0,1.03,.39]);
  addMesh(shell,new THREE.BoxGeometry(.18,.015,.018),M.metal,[-.18,.86,.39],[1,1,1],[0,0,-.25]);
  addMesh(shell,new THREE.BoxGeometry(.18,.015,.018),M.metal,[.18,.86,.39],[1,1,1],[0,0,.25]);
  addStitch(shell,[[0,1.41,.384],[-.16,1.22,.395],[-.22,.97,.39]],M.sole);addStitch(shell,[[0,1.41,.384],[.16,1.22,.395],[.22,.97,.39]],M.sole);
  // Hood with thickness and draw cords.
  const hood=addMesh(shell,new THREE.TorusGeometry(.255,.092,14,36,Math.PI*1.5),M.jacket,[0,1.51,.04],[1.05,1,.92],[Math.PI/2,0,.40]);
  for(const x of[-.10,.10]){addMesh(shell,new THREE.CylinderGeometry(.008,.008,.29,8),M.sole,[x,1.35,.39],[1,1,1],[0,0,x>0?-.08:.08]);addMesh(shell,new THREE.SphereGeometry(.018,8,6),M.metal,[x,1.205,.39])}
  // Pants silhouette and reinforced knees.
  for(const x of[-.15,.15]){addMesh(shell,new THREE.CapsuleGeometry(.105,.48,8,14),M.pants,[x,.40,.01],[1,1,.72]);addMesh(shell,new THREE.SphereGeometry(.12,16,10),M.pants,[x,.39,.065],[.92,.72,.67]);}
  // Detailed trainers: upper, sole, heel, lace bars.
  for(const x of[-.17,.17]){
    const shoe=addMesh(shell,new THREE.BoxGeometry(.255,.16,.46),M.rubber,[x,.105,-.055],[1,1,1],[-.09,0,0]);
    addMesh(shell,new THREE.BoxGeometry(.275,.055,.49),M.sole,[x,.045,-.045]);addMesh(shell,new THREE.BoxGeometry(.21,.075,.09),M.sole,[x,.095,.18]);
    for(let z=-.12;z<=.06;z+=.06)addMesh(shell,new THREE.BoxGeometry(.16,.012,.012),M.sole,[x,.195,z],[1,1,1],[0,0,x>0?.06:-.06]);
  }
  // Hair silhouette is crucial in the rear camera.
  if(female){
    const crown=addMesh(shell,new THREE.SphereGeometry(.245,28,20,0,Math.PI*2,0,Math.PI*.75),M.hair,[0,1.73,-.015],[1,.93,1.02]);
    const pony=new THREE.Group();pony.position.set(0,1.57,-.21);shell.add(pony);
    addMesh(pony,new THREE.CapsuleGeometry(.075,.38,8,14),M.hair,[0,-.18,0],[1,1,.9],[.18,0,0]);pony.userData.swingable=true;
  }else{
    addMesh(shell,new THREE.SphereGeometry(.247,28,18,0,Math.PI*2,0,Math.PI*.58),M.hair,[0,1.76,-.01],[1.02,.8,1.03]);
    for(let i=-3;i<=3;i++)addMesh(shell,new THREE.ConeGeometry(.035,.12,7),M.hair,[i*.055,1.91,-.02+Math.abs(i)*.006],[1,1,1],[0,0,(i*.06)]);
  }
  // Reflective CB back badge and micro shoulder panels.
  const badgeMat=new THREE.MeshPhysicalMaterial({color:0xf4dfaa,emissive:0x5c4318,emissiveIntensity:.2,roughness:.28,metalness:.18,clearcoat:.65});
  addMesh(shell,new THREE.RingGeometry(.115,.15,32),badgeMat,[0,1.16,.401],[1,1,1],[0,0,0]);
  const logo=makeTextSprite('CB','#f7e6bb','#12161a');logo.scale.set(.24,.125,1);logo.position.set(0,1.16,.407);shell.add(logo);
  for(const x of[-.31,.31])addMesh(shell,new THREE.BoxGeometry(.13,.045,.025),badgeMat,[x,1.37,.27],[1,1,1],[0,0,x>0?-.16:.16]);
  S.characterRig={shell,torso,waist,hood,pony:shell.children.find(x=>x.userData?.swingable)?.parent||null};
}
function updatePremiumCharacter(dt){
  if(!S.characterRig||!S.player)return;S.characterTime+=dt*Math.max(.75,S.speed/12);const t=S.characterTime;
  const running=S.running&&!S.paused&&!S.gameOver;const bob=running?Math.sin(t*11)*.018:Math.sin(t*2.2)*.006;
  S.characterRig.shell.position.y=THREE.MathUtils.damp(S.characterRig.shell.position.y,bob,12,dt);
  S.characterRig.shell.rotation.y=THREE.MathUtils.damp(S.characterRig.shell.rotation.y,(S.targetX-S.player.position.x)*-.035,10,dt);
  S.characterRig.torso.rotation.z=Math.sin(t*5.5)*.012;
  S.characterRig.hood.rotation.z=.40+Math.sin(t*7)*.025;
  if(S.characterRig.pony)S.characterRig.pony.rotation.x=.12+Math.sin(t*8)*.16;
}

async function createPlayer(){
  const token=++S.loadingToken;disposePlayer();const outfit=OUTFITS[S.outfit];showLoading('Charakter wird geladen …');
  try{
    const gltf=await S.loader.loadAsync(MODEL_PATHS[outfit.model]);if(token!==S.loadingToken)return;
    const root=gltf.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);const h=Math.max(.01,box.max.y-box.min.y);root.scale.setScalar(1.78/h);root.updateMatrixWorld(true);const sb=new THREE.Box3().setFromObject(root);const center=sb.getCenter(new THREE.Vector3());root.position.set(-center.x,-sb.min.y,-center.z);root.rotation.y=Math.PI;
    root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=mats.map(m=>{const n=m.clone();if(n.map)n.map.colorSpace=THREE.SRGBColorSpace;if(outfit.tint!==0xffffff)n.color.lerp(new THREE.Color(outfit.tint),.28);n.roughness=Math.max(.38,n.roughness??.7);n.metalness=Math.min(.15,n.metalness??0);n.envMapIntensity=1.15;n.side=THREE.FrontSide;return n});if(o.material.length===1)o.material=o.material[0]});
    const pivot=new THREE.Group();pivot.add(root);pivot.position.set(0,0,1.1);decorateRunner(pivot,outfit);addContactShadow(pivot);S.player=pivot;S.scene.add(pivot);
    if(gltf.animations?.length){S.mixer=new THREE.AnimationMixer(root);const run=gltf.animations.find(a=>/run|sprint|walk/i.test(a.name))||gltf.animations[0];S.action=S.mixer.clipAction(run);S.action.play();S.action.timeScale=1.25}
  }catch(e){console.warn('Runner.KL GLB konnte nicht geladen werden',e);S.player=createFallbackPlayer(outfit);S.scene.add(S.player)}finally{hideLoading()}
}

function decorateRunner(pivot,outfit){
  createPremiumRunnerShell(pivot,outfit);
  // Fine rim lights only illuminate the runner and preserve mobile performance.
  const warm=new THREE.PointLight(0xffc779,S.lowPower?1.0:1.8,5.5,2);warm.position.set(-1.2,2.7,1.4);warm.name='rklRunnerWarm';pivot.add(warm);
  const cool=new THREE.PointLight(0x91c8ff,S.lowPower?.65:1.15,4.5,2);cool.position.set(1.15,2.1,.2);cool.name='rklRunnerCool';pivot.add(cool);
}
function addContactShadow(pivot){
  const tex=makeCanvasTexture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,4,s/2,s/2,s/2);g.addColorStop(0,'rgba(0,0,0,.72)');g.addColorStop(.45,'rgba(0,0,0,.30)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,s,s)},256,1,1);
  const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.8});const q=new THREE.Mesh(new THREE.PlaneGeometry(1.25,2.1),m);q.rotation.x=-Math.PI/2;q.position.y=.025;q.position.z=.18;pivot.add(q);pivot.userData.contactShadow=q;
}

function createFallbackPlayer(outfit){const g=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:outfit.tint===0xffffff?0x2f4858:outfit.tint,roughness:.75}),skin=new THREE.MeshStandardMaterial({color:0xc89170,roughness:.8});const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.72,6,12),cloth);torso.position.y=1.08;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),skin);head.position.y=1.75;g.add(head);for(const x of[-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.58,5,8),cloth);leg.position.set(x,.38,0);g.add(leg)}g.position.z=1.1;return g}
function disposePlayer(){S.characterRig=null;S.characterTime=0;if(S.player){S.scene?.remove(S.player);S.player.traverse(o=>{if(o.geometry)o.geometry.dispose?.();const ms=Array.isArray(o.material)?o.material:[o.material];ms.filter(Boolean).forEach(m=>m.dispose?.())})}S.player=null;S.mixer=null;S.action=null}

function boostMaterial(color,emissive=color){return new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:.75,roughness:.3,metalness:.55})}
function makeBoost(type){
  const g=new THREE.Group();g.userData.type='boost';g.userData.boost=type;
  const colors={magnet:0xe64646,jetpack:0xf0a52a,sneakers:0x45d5ff,multiplier:0xb164ff,pogo:0x65e082};
  const mat=boostMaterial(colors[type]||0xffffff),dark=new THREE.MeshStandardMaterial({color:0x172126,roughness:.42,metalness:.62});
  if(type==='magnet'){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(.28,.105,12,28,Math.PI),mat);tor.rotation.z=Math.PI;g.add(tor);
    for(const x of[-.28,.28]){const cap=new THREE.Mesh(new THREE.BoxGeometry(.18,.2,.18),mat);cap.position.set(x,-.02,0);g.add(cap)}
  }else if(type==='jetpack'){
    for(const x of[-.18,.18]){const tank=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.55,16),mat);tank.position.x=x;g.add(tank);const nozzle=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,12),dark);nozzle.position.set(x,-.36,0);nozzle.rotation.x=Math.PI;g.add(nozzle)}
  }else if(type==='sneakers'){
    for(const x of[-.17,.17]){const shoe=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.48),mat);shoe.position.set(x,0,x*.3);shoe.rotation.y=x>0?-.18:.18;g.add(shoe)}
  }else if(type==='multiplier'){
    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,2),mat);g.add(orb);const tx=makeTextSprite('2×','#ffffff','#7d35c8');tx.scale.set(.46,.23,1);tx.position.z=.36;g.add(tx)
  }else{
    const spring=new THREE.Mesh(new THREE.TorusKnotGeometry(.17,.055,70,10,2,5),mat);spring.rotation.x=Math.PI/2;g.add(spring);const top=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.08,20),dark);top.position.y=.32;g.add(top)
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g
}
function makeHoverboard(){
  const g=new THREE.Group();const deck=new THREE.Mesh(new THREE.BoxGeometry(.72,.09,1.65),new THREE.MeshStandardMaterial({color:0x13252d,emissive:0x00cfff,emissiveIntensity:.55,roughness:.24,metalness:.72}));deck.geometry.translate(0,0,0);g.add(deck);
  const trim=new THREE.Mesh(new THREE.TorusGeometry(.47,.035,8,42),new THREE.MeshBasicMaterial({color:0x50eaff}));trim.scale.set(.72,1.45,1);trim.rotation.x=Math.PI/2;trim.position.y=.02;g.add(trim);
  for(const z of[-.58,.58])for(const x of[-.29,.29]){const w=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0xffd75a}));w.position.set(x,-.08,z);g.add(w)}
  return g
}
function activateBoost(type,duration){
  if(type==='pogo'){S.vy=Math.max(S.vy,12.6);S.y=Math.max(S.y,.08);showBoostToast('Sprungfeder','Hoch hinaus!');return}
  S.activeBoosts[type]=Math.max(S.activeBoosts[type]||0,duration);
  const labels={magnet:'CB-Magnet',jetpack:'Raketenrucksack',sneakers:'Power-Schuhe',multiplier:'Punkte-Turbo'};
  showBoostToast(labels[type]||'Boost',`${Math.ceil(duration)} Sekunden aktiv`);
  if(type==='jetpack'){S.y=Math.max(S.y,3.1);S.vy=0}
}
function activateHoverboard(){
  if(!S.running||S.paused||S.gameOver||S.hoverboard>0||S.hoverCooldown>0||S.boardTokens<=0)return;
  S.boardTokens--;S.hoverboard=18;S.boardMesh=makeHoverboard();S.boardMesh.position.set(0,.08,.03);S.player?.add(S.boardMesh);save();showBoostToast('Neonboard','Ein Zusammenstoß wird abgefangen');updateHud();
}
function consumeHoverboard(){
  if(S.hoverboard<=0)return false;S.hoverboard=0;S.hoverCooldown=4.5;if(S.boardMesh){S.player?.remove(S.boardMesh);S.boardMesh.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});S.boardMesh=null}cameraShake();showBoostToast('Neonboard gerettet','Kollision abgefangen');return true
}
function showBoostToast(title,text){const host=S.overlay?.querySelector('[data-rkl-toast]');if(!host)return;host.innerHTML=`<b>${title}</b><small>${text}</small>`;host.classList.remove('show');void host.offsetWidth;host.classList.add('show')}
function cameraShake(){if(!S.camera)return;const x=S.camera.position.x;S.camera.position.x=x+.18;setTimeout(()=>{if(S.camera)S.camera.position.x=x-.1},45)}
function updateBoostHud(){
  if(!S.overlay)return;const map={magnet:'🧲',jetpack:'🚀',sneakers:'👟',multiplier:'2×'};const box=S.overlay.querySelector('[data-rkl-boosts]');if(box)box.innerHTML=Object.entries(map).filter(([k])=>S.activeBoosts[k]>0).map(([k,ic])=>`<span>${ic}<b>${Math.ceil(S.activeBoosts[k])}</b></span>`).join('');
  const board=S.overlay.querySelector('[data-rkl-board]');if(board){board.classList.toggle('active',S.hoverboard>0);board.disabled=S.boardTokens<=0||S.hoverCooldown>0||S.hoverboard>0;board.innerHTML=`<span>🛹</span><b>${S.hoverboard>0?Math.ceil(S.hoverboard):S.hoverCooldown>0?Math.ceil(S.hoverCooldown):S.boardTokens}</b>`}
}
function makeCoin(){
  const g=new THREE.Group();const side=new THREE.MeshStandardMaterial({color:0xd79c1d,roughness:.28,metalness:.86});const face=new THREE.MeshStandardMaterial({color:0xf5cf45,roughness:.22,metalness:.82});
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.085,32),[side,face,face]);disc.rotation.z=Math.PI/2;disc.castShadow=true;g.add(disc);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.025,8,32),new THREE.MeshStandardMaterial({color:0xffe980,metalness:.9,roughness:.18}));ring.rotation.y=Math.PI/2;ring.position.x=.047;g.add(ring);
  const text=makeTextSprite('CB','#40280a','#ffe26b');text.scale.set(.38,.19,1);text.position.x=.095;text.rotation.y=Math.PI/2;g.add(text);g.userData.type='coin';return g
}
function makeTextSprite(text,color,bg){const cv=document.createElement('canvas');cv.width=256;cv.height=128;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,256,128);c.fillStyle=color;c.font='900 72px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,128,67);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:false}));return s}
function makeBarrier(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xe1ddd3,roughness:.75}),red=new THREE.MeshStandardMaterial({color:0xc84332,roughness:.7});for(let i=-2;i<=2;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.45,.72,.14),i%2?white:red);m.position.set(i*.45,1.0,0);m.rotation.z=-.28;m.castShadow=true;g.add(m)}const beam=new THREE.Mesh(new THREE.BoxGeometry(2.6,.16,.18),white);beam.position.y=.72;g.add(beam);for(const x of[-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.7,.13),new THREE.MeshStandardMaterial({color:0x3d4442,roughness:.75,metalness:.25}));leg.position.set(x,.35,0);g.add(leg)}g.userData.type='barrier';return g}
function makeTram(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(2.7,3.15,7.2),new THREE.MeshStandardMaterial({color:0xd7bb48,roughness:.55,metalness:.18}));body.position.y=1.72;body.castShadow=true;g.add(body);const red=new THREE.Mesh(new THREE.BoxGeometry(2.73,.52,7.25),new THREE.MeshStandardMaterial({color:0xa82e27,roughness:.5}));red.position.y=.58;g.add(red);const glass=new THREE.MeshStandardMaterial({color:0x254147,roughness:.18,metalness:.28});for(const z of[-3.61,3.61]){const win=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.05),glass);win.position.set(0,2.35,z);win.rotation.y=z>0?0:Math.PI;g.add(win)}for(const x of[-.82,.82])for(const z of[-2.4,0,2.4]){const w=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.85),glass);w.position.set(x>0?1.356:-1.356,2.18,z);w.rotation.y=x>0?Math.PI/2:-Math.PI/2;g.add(w)}g.userData.type='tram';return g}
function makeBollards(){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x4b504f,roughness:.55,metalness:.45});for(const x of[-.72,0,.72]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.95,12),mat);b.position.set(x,.48,0);b.castShadow=true;g.add(b);const band=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.12,12),new THREE.MeshStandardMaterial({color:0xe0c62f,roughness:.5}));band.position.set(x,.67,0);g.add(band)}g.userData.type='bollards';return g}
function spawnRow(){
  const lane=Math.floor(Math.random()*3),z=-86,r=Math.random();
  if(r<.49){const count=Math.random()<.35?5:3;for(let i=0;i<count;i++){const o=makeCoin();o.position.set((lane-1)*2.6,.75,z-i*2.1);o.userData.lane=lane;S.scene.add(o);S.objects.push(o)}}
  else if(r<.61){const types=['magnet','jetpack','sneakers','multiplier','pogo'];const type=types[Math.floor(Math.random()*types.length)];const o=makeBoost(type);o.position.set((lane-1)*2.6,1.05,z);o.userData.lane=lane;S.scene.add(o);S.objects.push(o)}
  else{const o=r<.79?makeBarrier():r<.91?makeBollards():makeTram();o.position.set((lane-1)*2.6,0,z);o.userData.lane=lane;S.scene.add(o);S.objects.push(o)}
}
function clearObjects(){for(const o of S.objects){S.scene?.remove(o);o.traverse(n=>{n.geometry?.dispose?.();const ms=Array.isArray(n.material)?n.material:[n.material];ms.filter(Boolean).forEach(m=>{m.map?.dispose?.();m.dispose?.()})})}S.objects=[]}

function resetGame(){clearObjects();S.running=true;S.paused=false;S.gameOver=false;S.lane=1;S.targetX=0;S.y=0;S.vy=0;S.slide=0;S.speed=12;S.distance=0;S.score=0;S.runCoins=0;S.spawnTimer=.55;S.elapsed=0;S.activeBoosts={magnet:0,jetpack:0,sneakers:0,multiplier:0};S.hoverboard=0;S.hoverCooldown=0;if(S.boardMesh){S.player?.remove(S.boardMesh);S.boardMesh=null}hideCard();updateHud();if(S.action)S.action.paused=false}
function input(kind){if(!S.running||S.paused||S.gameOver)return;if(kind==='left')S.lane=Math.max(0,S.lane-1);if(kind==='right')S.lane=Math.min(2,S.lane+1);S.targetX=(S.lane-1)*2.6;if(kind==='up'&&S.y<=.01){S.vy=8.3}if(kind==='down'&&S.y<.2){S.slide=.72}}
function update(dt){
  if(!S.running||S.paused||S.gameOver)return;
  S.elapsed+=dt;const mult=S.activeBoosts.multiplier>0?2:1;S.distance+=S.speed*dt*.52;S.score+=S.speed*dt*mult;S.speed=Math.min(25,12+S.distance/430);
  for(const k of Object.keys(S.activeBoosts))S.activeBoosts[k]=Math.max(0,S.activeBoosts[k]-dt);S.hoverboard=Math.max(0,S.hoverboard-dt);S.hoverCooldown=Math.max(0,S.hoverCooldown-dt);
  if(S.hoverboard<=0&&S.boardMesh){S.player?.remove(S.boardMesh);S.boardMesh.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});S.boardMesh=null}
  S.spawnTimer-=dt;if(S.spawnTimer<=0){spawnRow();S.spawnTimer=Math.max(.48,1.15-S.speed*.018)+Math.random()*.32}
  const move=S.speed*dt;for(const seg of S.segments){seg.position.z+=move;if(seg.position.z>25)seg.position.z-=S.segments.length*25}
  for(let i=S.objects.length-1;i>=0;i--){const o=S.objects[i];o.position.z+=move;
    if(o.userData.type==='coin'){o.rotation.y+=dt*5.2;o.position.y=.76+Math.sin(S.elapsed*6+o.position.z)*.12}
    if(o.userData.type==='boost'){o.rotation.y+=dt*2.5;o.position.y=1.03+Math.sin(S.elapsed*4+o.position.z)*.14}
    if(o.position.z>9){S.scene.remove(o);S.objects.splice(i,1);continue}
    const laneMatch=o.userData.lane===S.lane;const magnetPickup=o.userData.type==='coin'&&S.activeBoosts.magnet>0&&Math.abs(o.position.z-1.1)<5.3;
    if((Math.abs(o.position.z-1.1)<.74&&laneMatch)||magnetPickup){
      if(o.userData.type==='coin'){S.runCoins++;S.wallet++;S.score+=10*mult;save();S.scene.remove(o);S.objects.splice(i,1);flashCoin();continue}
      if(o.userData.type==='boost'){const duration={magnet:10,jetpack:8,sneakers:11,multiplier:10}[o.userData.boost]||0;activateBoost(o.userData.boost,duration);S.scene.remove(o);S.objects.splice(i,1);continue}
      const jetSafe=S.activeBoosts.jetpack>0;const jumpSafe=S.y>(S.activeBoosts.sneakers>0?.72:1.0),slideSafe=o.userData.type==='barrier'&&S.slide>0;if(!jetSafe&&!jumpSafe&&!slideSafe){if(consumeHoverboard()){S.scene.remove(o);S.objects.splice(i,1);continue}endGame();return}
    }
  }
  if(S.activeBoosts.jetpack>0){S.y=THREE.MathUtils.damp(S.y,3.35,8,dt);S.vy=0}else if(S.y>0||S.vy!==0){S.y+=S.vy*dt;S.vy-=(S.activeBoosts.sneakers>0?15.2:19.5)*dt;if(S.y<=0){S.y=0;S.vy=0}}
  S.slide=Math.max(0,S.slide-dt);
  if(S.player){S.player.position.x=THREE.MathUtils.damp(S.player.position.x,S.targetX,13,dt);S.player.position.y=S.y;const cs=S.player.userData.contactShadow;if(cs){cs.material.opacity=THREE.MathUtils.clamp(.82-S.y*.35,.08,.82);cs.scale.setScalar(1+S.y*.12)}S.player.rotation.z=THREE.MathUtils.damp(S.player.rotation.z,(S.targetX-S.player.position.x)*-.06,9,dt);S.player.scale.y=THREE.MathUtils.damp(S.player.scale.y,S.slide>0?.58:1,13,dt);S.player.scale.x=THREE.MathUtils.damp(S.player.scale.x,S.slide>0?1.1:1,13,dt)}
  if(S.mixer)S.mixer.update(dt*(S.speed/12));updatePremiumCharacter(dt);S.camera.position.x=THREE.MathUtils.damp(S.camera.position.x,(S.player?.position.x||0)*.22,4,dt);S.camera.position.y=THREE.MathUtils.damp(S.camera.position.y,3.72+S.y*.18,4,dt);S.camera.fov=THREE.MathUtils.damp(S.camera.fov,S.activeBoosts.jetpack>0?67:S.hoverboard>0?61:56,4,dt);S.camera.updateProjectionMatrix();S.camera.lookAt(S.camera.position.x*.22,1.26+S.y*.1,-15);const dust=S.scene.getObjectByName('rklDust');if(dust)dust.position.z=(dust.position.z+move*.12)%18;
  updateHud();updateBoostHud();
}
function endGame(){S.running=false;S.gameOver=true;S.best=Math.max(S.best,Math.floor(S.distance));save();if(S.action)S.action.paused=true;showCard(`<div class="rkl-kicker">RUNDE BEENDET</div><h1>${Math.floor(S.distance)} m</h1><div class="rkl-result"><span>Gesammelt<b>🪙 ${S.runCoins}</b></span><span>Punkte<b>${Math.floor(S.score)}</b></span><span>Bestwert<b>${S.best} m</b></span><span>Boards<b>🛹 ${S.boardTokens}</b></span></div><button data-rkl-retry>Noch einmal</button><button class="rkl-secondary" data-rkl-shop>Coin-Shop</button><button class="rkl-secondary" data-rkl-exit>Top Games</button>`);bindCard()}
function render(){if(S.composer)S.composer.render();else S.renderer.render(S.scene,S.camera)}
function loop(){const dt=Math.min(.045,S.clock.getDelta());update(dt);render();S.raf=requestAnimationFrame(loop)}

function showCard(html){const c=S.overlay?.querySelector('[data-rkl-card]');if(!c)return;c.innerHTML=html;c.hidden=false}
function hideCard(){const c=S.overlay?.querySelector('[data-rkl-card]');if(c)c.hidden=true}
function showLoading(text){const l=S.overlay?.querySelector('[data-rkl-loading]');if(l){l.querySelector('span').textContent=text;l.hidden=false}}
function hideLoading(){const l=S.overlay?.querySelector('[data-rkl-loading]');if(l)l.hidden=true}
function updateHud(){if(!S.overlay)return;S.overlay.querySelector('[data-rkl-distance]').textContent=`${Math.floor(S.distance)} m`;S.overlay.querySelector('[data-rkl-coins]').textContent=S.runCoins;S.overlay.querySelector('[data-rkl-wallet]').textContent=S.wallet;const score=S.overlay.querySelector('[data-rkl-score]');if(score)score.textContent=Math.floor(S.score);const pr=S.overlay.querySelector('[data-rkl-progress]');if(pr)pr.style.width=Math.min(100,(S.wallet%500)/5)+'%';updateBoostHud()}
function flashCoin(){const p=S.overlay?.querySelector('[data-rkl-wallet-pill]');if(!p)return;p.classList.remove('is-pulse');void p.offsetWidth;p.classList.add('is-pulse')}
function outfitPreview(id){const o=OUTFITS[id];return `<div class="rkl-model-preview ${o.model}" style="--tint:#${o.tint.toString(16).padStart(6,'0')}"><i></i><b></b><em></em></div>`}
function showStart(){showCard(`<div class="rkl-kicker">SPREMBERGER STRASSE · COTTBUS</div><h1>Runner.KL</h1><p class="rkl-lead">Sammle Power-ups, kombiniere Effekte und rette deinen Lauf mit dem Neonboard.</p><div class="rkl-boost-overview"><article><i>🧲</i><b>CB-Magnet</b><small>Zieht Münzen aus allen Spuren an.</small></article><article><i>🚀</i><b>Raketenrucksack</b><small>Fliegt über Hindernisse und sammelt sicher.</small></article><article><i>👟</i><b>Power-Schuhe</b><small>Höhere und längere Sprünge.</small></article><article><i>2×</i><b>Punkte-Turbo</b><small>Verdoppelt deine Punkte.</small></article><article><i>🌀</i><b>Sprungfeder</b><small>Katapultiert dich sofort nach oben.</small></article><article><i>🛹</i><b>Neonboard</b><small>Fängt eine Kollision ab. Doppeltippen zum Aktivieren.</small></article></div><div class="rkl-selected">${outfitPreview(S.outfit)}<span>Aktiver Läufer<b>${OUTFITS[S.outfit].name}</b><small>Neonboards: ${S.boardTokens}</small></span></div><button data-rkl-start>Spiel starten</button><button class="rkl-shop-btn" data-rkl-shop>Coin-Shop</button><button class="rkl-secondary" data-rkl-exit>Zurück zu Top Games</button>`);bindCard()}
function openShop(){S.paused=true;const cards=Object.entries(OUTFITS).map(([id,o])=>{const owned=S.owned.includes(id),active=S.outfit===id;return `<button class="rkl-shop-item ${active?'active':''}" data-rkl-outfit="${id}">${outfitPreview(id)}<span><strong>${o.name}</strong><small>${active?'Ausgewählt':owned?'Im Besitz':`🪙 ${o.price}`}</small></span></button>`}).join('');showCard(`<div class="rkl-shop-head"><div><div class="rkl-kicker">RUNNER.KL</div><h1>Coin-Shop</h1></div><div class="rkl-wallet">🪙 ${S.wallet}</div></div><p class="rkl-shop-note">Zwei Grundcharaktere sind kostenlos. Weitere Outfits werden dauerhaft mit CB-Coins freigeschaltet.</p><div class="rkl-shop-grid">${cards}</div><button class="rkl-secondary" data-rkl-back>Zurück</button>`);S.overlay.querySelectorAll('[data-rkl-outfit]').forEach(b=>b.onclick=()=>buyOutfit(b.dataset.rklOutfit));S.overlay.querySelector('[data-rkl-back]').onclick=()=>{S.paused=false;showStart()}}
async function buyOutfit(id){const o=OUTFITS[id];if(!o)return;if(S.owned.includes(id)){S.outfit=id;save();await createPlayer();openShop();return}if(S.wallet<o.price){const n=S.overlay.querySelector('.rkl-shop-note');if(n)n.textContent=`Dir fehlen noch ${o.price-S.wallet} CB-Coins.`;return}S.wallet-=o.price;S.owned.push(id);S.outfit=id;save();updateHud();await createPlayer();openShop()}
function bindCard(){S.overlay.querySelector('[data-rkl-start]')?.addEventListener('click',resetGame);S.overlay.querySelector('[data-rkl-retry]')?.addEventListener('click',resetGame);S.overlay.querySelector('[data-rkl-shop]')?.addEventListener('click',openShop);S.overlay.querySelector('[data-rkl-exit]')?.addEventListener('click',()=>{close();window.RunnerKL?.openHub?.()})}

function open(){
  if(S.overlay)return;loadSave();const el=document.createElement('div');el.className='runner-kl-overlay';el.innerHTML=`<div class="runner-kl-stage"><canvas aria-label="Runner.KL 3D-Spiel"></canvas><div class="runner-kl-vignette"></div><div class="runner-kl-sunflare"></div><div class="runner-kl-hud"><div class="runner-kl-top"><div class="runner-kl-pill"><small>STRECKE</small><b data-rkl-distance>0 m</b></div><div class="runner-kl-pill"><small>RUNDE</small><b>🪙 <span data-rkl-coins>0</span></b></div><div class="runner-kl-pill runner-kl-score"><small>PUNKTE</small><b data-rkl-score>0</b></div><div class="runner-kl-pill" data-rkl-wallet-pill><small>BESTAND</small><b>🪙 <span data-rkl-wallet>0</span></b></div><div class="runner-kl-brand"><small>JK.GAMES</small><b>Runner.KL</b></div></div><div class="runner-kl-mission"><small>TAGESMISSION</small><b>500 CB-Coins sammeln</b><div><i data-rkl-progress></i></div></div><div class="runner-kl-boostbar" data-rkl-boosts></div><div class="runner-kl-toast" data-rkl-toast></div><div class="runner-kl-actions"><button data-rkl-close>✕</button><button class="runner-kl-board" data-rkl-board><span>🛹</span><b>3</b></button><div class="runner-kl-controls"><button data-dir="up">↑</button><button data-dir="left">←</button><button data-dir="down">↓</button><button data-dir="right">→</button></div><button data-rkl-pause>Ⅱ</button></div></div><div class="runner-kl-loading" data-rkl-loading><i></i><span>3D-Welt wird geladen …</span></div><div class="runner-kl-card" data-rkl-card></div></div>`;document.body.append(el);S.overlay=el;setupScene();
  el.querySelector('[data-rkl-close]').onclick=close;el.querySelector('[data-rkl-pause]').onclick=()=>{if(S.running)S.paused=!S.paused};el.querySelector('[data-rkl-board]').onclick=activateHoverboard;el.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>input(b.dataset.dir));
  const canvas=el.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{const now=performance.now();if(now-S.lastTap<330)activateHoverboard();S.lastTap=now;S.pointerStart={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerup',e=>{if(!S.pointerStart)return;const dx=e.clientX-S.pointerStart.x,dy=e.clientY-S.pointerStart.y;S.pointerStart=null;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>24)input(dx>0?'right':'left');else if(Math.abs(dy)>24)input(dy>0?'down':'up')});
  S.keyHandler=e=>{const m={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',' ':'up',ArrowDown:'down',s:'down'};if(e.key==='b'||e.key==='B'){e.preventDefault();activateHoverboard();return}if(m[e.key]){e.preventDefault();input(m[e.key])}};document.addEventListener('keydown',S.keyHandler);S.resizeHandler=resize;window.addEventListener('resize',resize,{passive:true});
  showStart();updateHud();S.clock.start();loop();
}
function close(){if(!S.overlay)return;cancelAnimationFrame(S.raf);document.removeEventListener('keydown',S.keyHandler);window.removeEventListener('resize',S.resizeHandler);clearObjects();disposePlayer();for(const seg of S.segments){seg.traverse(o=>{o.geometry?.dispose?.();const ms=Array.isArray(o.material)?o.material:[o.material];ms.filter(Boolean).forEach(m=>{m.map?.dispose?.();m.dispose?.()})})}S.segments=[];S.composer?.dispose?.();S.composer=null;S.renderer?.dispose();S.overlay.remove();S.overlay=null;S.scene=null;S.renderer=null;S.running=false;S.paused=false}
function openHub(){if(typeof window.openDeviceInterface==='function'&&typeof window.phoneItems==='function'){const item=window.phoneItems()?.[0];if(item)window.openDeviceInterface(item,'topgames',false)}else open()}
window.RunnerKL={open,close,openHub};
