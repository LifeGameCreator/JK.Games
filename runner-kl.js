import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const STORAGE = 'jk-games-runner-kl-v5';
const ASSET_ROOT = './assets/cottbus/';
const MODEL_PATHS = { male: `${ASSET_ROOT}player-male.glb`, female: `${ASSET_ROOT}player-female.glb` };
const OUTFITS = {
  maleStreet:{name:'CB Street Mann',model:'male',price:0,tint:0x6b3028,primary:0x6b3028,secondary:0xe7e4dc,pants:0x6380a0,shoes:0x263c58,accent:0xd7c076,style:'Lederjacke · Jeans'},
  femaleStreet:{name:'CB Street Frau',model:'female',price:0,tint:0xc05972,primary:0xc05972,secondary:0xf1d9dd,pants:0x33496a,shoes:0xe8e4dc,accent:0xffcf5a,style:'Street Pink · Denim'},
  maleSport:{name:'Sportläufer',model:'male',price:450,tint:0xd44735,primary:0xd44735,secondary:0x1c2128,pants:0x181d22,shoes:0xf0eee7,accent:0xffcc32,style:'Sportjacke · Schwarz'},
  femaleNight:{name:'Nachtläuferin',model:'female',price:650,tint:0x624fc0,primary:0x624fc0,secondary:0x182139,pants:0x11151c,shoes:0x45d9ff,accent:0x63e8ff,style:'Violett · Neon'},
  maleWorker:{name:'Bauarbeiter',model:'male',price:800,tint:0xe99725,primary:0xe99725,secondary:0xf4d34e,pants:0x303b45,shoes:0x4b3525,accent:0xe9ff68,style:'Warnjacke · Arbeitshose'},
  femaleCity:{name:'City Style',model:'female',price:950,tint:0x244f73,primary:0x244f73,secondary:0xd6e7ef,pants:0x172a3d,shoes:0xf3eee3,accent:0x77d9d0,style:'Navy · City Look'}
};
const BOARD_PACKS = [
  {id:'board1',name:'1 Neonboard',amount:1,price:120},
  {id:'board5',name:'5 Neonboards',amount:5,price:500},
  {id:'board12',name:'12 Neonboards',amount:12,price:980}
];
const WORLD_THEMES = [
  {name:'Cottbus Zentrum',short:'ZENTRUM',sky:0x77a9c2,fog:0x78939f,sun:0xffdfba,sunPower:1.22,hemiSky:0xc3d7df,hemiGround:0x3d382f,road:0xffffff,walk:0xffffff,facade:0xffffff,lamp:0xffe0a0,weather:'sunny',difficulty:.18},
  {name:'Lausitzer Regenviertel',short:'REGENVIERTEL',sky:0x526d7b,fog:0x617681,sun:0xb9c9d0,sunPower:.72,hemiSky:0x8da5b2,hemiGround:0x2e3434,road:0x7f8a90,walk:0x8e999e,facade:0xb9c5c9,lamp:0xffd78b,weather:'rain',difficulty:.35},
  {name:'Nachtlinie Sandow',short:'NACHTLINIE',sky:0x101e35,fog:0x17283a,sun:0x6f8fc3,sunPower:.28,hemiSky:0x31517d,hemiGround:0x10151c,road:0x536071,walk:0x69717c,facade:0x748397,lamp:0xffc75c,weather:'cloudy',difficulty:.47},
  {name:'Goldener Altmarkt',short:'GOLDENER MORGEN',sky:0xd39a68,fog:0xb78362,sun:0xffbd72,sunPower:1.36,hemiSky:0xf2c18e,hemiGround:0x51372b,road:0xc2a98f,walk:0xd1bba2,facade:0xffd5ad,lamp:0xffe0a0,weather:'sunny',difficulty:.30}
];

const S = {
  overlay:null, scene:null, camera:null, renderer:null, composer:null, bloom:null, ssao:null, clock:new THREE.Clock(), raf:0,
  loader:new GLTFLoader(), running:false, paused:false, gameOver:false,
  lane:1, targetX:0, y:0, vy:0, slide:0, speed:12, distance:0, runCoins:0,
  wallet:0, best:0, owned:['maleStreet','femaleStreet'], outfit:'maleStreet',
  player:null, mixer:null, action:null, world:null, segments:[], objects:[],
  spawnTimer:0, elapsed:0, loadingToken:0, resizeHandler:null, keyHandler:null,
  pointerStart:null, lastTap:0, dpr:1, lowPower:false, characterRig:null, characterTime:0,
  score:0, boardTokens:3, activeBoosts:{magnet:0,jetpack:0,sneakers:0,multiplier:0},
  hoverboard:0, hoverCooldown:0, boardMesh:null, boostFx:null,
  quality:'ultra', weatherMode:'sunny', weatherClock:0, weatherDuration:24, weatherBlend:0,
  rain:null, clouds:null, cloudMaterial:null, sun:null, hemi:null, fill:null, loadingProgress:0, onTrain:null, impactFx:[], pauseCountdown:false, jetRig:null,
  contactShadow:null, hudClock:0, saveClock:0, saveDirty:false, weatherTick:0, perfTime:0, perfFrames:0, renderScale:1, lastBoostSignature:'', lastHudSnapshot:'',
  worldIndex:0,worldTheme:WORLD_THEMES[0],worldAnnounceClock:0,effectiveSpeed:12,runStartedAt:0,remoteRunId:'',remoteBusy:false,worldData:null,worldDataLoaded:false,worldDataError:'',rewardClaiming:false,
  characterRoot:null,characterBones:null,baseTexture:null,
  resources:{textures:new Map(),materials:new Map(),geometries:new Map()}
};

function loadSave(){
  try{
    const d=JSON.parse(localStorage.getItem(STORAGE)||'{}');
    S.wallet=Math.max(0,Number(d.wallet||0)); S.best=Math.max(0,Number(d.best||0));
    S.owned=Array.isArray(d.owned)&&d.owned.length?d.owned.filter(k=>OUTFITS[k]):['maleStreet','femaleStreet'];
    for(const id of ['maleStreet','femaleStreet']) if(!S.owned.includes(id)) S.owned.push(id);
    S.outfit=OUTFITS[d.outfit]&&S.owned.includes(d.outfit)?d.outfit:'maleStreet';
    S.boardTokens=Math.max(0,Number(d.boardTokens??3));
    S.quality=['low','medium','high','ultra'].includes(d.quality)?d.quality:'ultra';
  }catch{S.wallet=0;S.best=0;S.owned=['maleStreet','femaleStreet'];S.outfit='maleStreet'}
}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({wallet:S.wallet,best:S.best,owned:S.owned,outfit:S.outfit,boardTokens:S.boardTokens,quality:S.quality}))}catch{}}

function queueSave(){S.saveDirty=true}
function cachedTexture(key,factory){if(S.resources.textures.has(key))return S.resources.textures.get(key);const value=factory();S.resources.textures.set(key,value);return value}
function cachedMaterial(key,factory){if(S.resources.materials.has(key))return S.resources.materials.get(key);const value=factory();S.resources.materials.set(key,value);return value}
function cachedGeometry(key,factory){if(S.resources.geometries.has(key))return S.resources.geometries.get(key);const value=factory();S.resources.geometries.set(key,value);return value}
function disposeResources(){for(const v of S.resources.geometries.values())v.dispose?.();for(const v of S.resources.materials.values()){v.map?.dispose?.();v.bumpMap?.dispose?.();v.normalMap?.dispose?.();v.roughnessMap?.dispose?.();v.dispose?.()}for(const v of S.resources.textures.values())v.dispose?.();S.resources={textures:new Map(),materials:new Map(),geometries:new Map()}}
function setText(el,value){if(el&&el.textContent!==String(value))el.textContent=String(value)}
function isCachedResource(map,value){for(const cached of map.values())if(cached===value)return true;return false}
function releaseObject(o){if(!o)return;S.scene?.remove(o);o.traverse(n=>{if(n.geometry&&!isCachedResource(S.resources.geometries,n.geometry))n.geometry.dispose?.();const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats.filter(Boolean)){if(isCachedResource(S.resources.materials,m))continue;if(m.map&&!isCachedResource(S.resources.textures,m.map))m.map.dispose?.();m.dispose?.()}})}

function makeCanvasTexture(draw,size=512,repeatX=1,repeatY=1){
  const cv=document.createElement('canvas');cv.width=cv.height=size;const c=cv.getContext('2d',{alpha:true});draw(c,size);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=S.renderer?Math.min(8,S.renderer.capabilities.getMaxAnisotropy()):4;return t;
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
 },1536,2.3,18)}
function sidewalkTexture(){return makeCanvasTexture((c,s)=>{
  c.fillStyle='#aaa49a';c.fillRect(0,0,s,s);const rnd=mulberry32(721);const tile=64;
  for(let y=0;y<s;y+=tile)for(let x=0;x<s;x+=tile){const v=155+Math.floor(rnd()*26);c.fillStyle=`rgb(${v+5},${v+2},${v-4})`;c.fillRect(x+2,y+2,tile-4,tile-4);c.strokeStyle='rgba(55,52,47,.38)';c.lineWidth=2;c.strokeRect(x+2,y+2,tile-4,tile-4);if(rnd()>.72){c.strokeStyle='rgba(65,58,52,.26)';c.beginPath();c.moveTo(x+10,y+12);c.lineTo(x+35,y+31);c.lineTo(x+27,y+54);c.stroke()}}
  for(let i=0;i<55;i++){c.fillStyle='rgba(45,40,35,.08)';c.beginPath();c.ellipse(rnd()*s,rnd()*s,8+rnd()*24,3+rnd()*10,rnd()*3,0,Math.PI*2);c.fill()}
 },1024,2,18)}
function roofTexture(){return makeCanvasTexture((c,s)=>{c.fillStyle='#49433e';c.fillRect(0,0,s,s);for(let y=0;y<s;y+=34){for(let x=(y/34)%2? -28:0;x<s;x+=56){c.fillStyle=((x+y)/34)%3?'#5d554f':'#514943';c.fillRect(x+2,y+2,52,29);c.strokeStyle='rgba(20,18,16,.45)';c.strokeRect(x+2,y+2,52,29)}}},1024,2,3)}
function wallTexture(base,damaged=false,seed=1){return makeCanvasTexture((c,s)=>{
  c.fillStyle=base;c.fillRect(0,0,s,s);const rnd=mulberry32(seed);
  for(let i=0;i<1300;i++){const a=rnd()*.06;c.fillStyle=`rgba(${rnd()>0.5?'255,255,255':'30,24,18'},${a})`;c.fillRect(rnd()*s,rnd()*s,1+rnd()*3,1+rnd()*3)}
  if(damaged){
    for(let i=0;i<5;i++){let x=rnd()*s,y=rnd()*s*.75;c.strokeStyle='rgba(52,44,38,.62)';c.lineWidth=2+rnd()*2;c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*32;y+=20+rnd()*35;c.lineTo(x,y)}c.stroke()}
    for(let i=0;i<8;i++){c.fillStyle='rgba(78,67,58,.18)';c.beginPath();c.ellipse(rnd()*s,rnd()*s,18+rnd()*45,12+rnd()*55,rnd()*2,0,Math.PI*2);c.fill()}
  }
 },1024,1,1)}
function shopTexture(label,color='#8b2f26'){return makeCanvasTexture((c,s)=>{
  c.fillStyle='#182523';c.fillRect(0,0,s,s);c.fillStyle='#95bdc1';c.fillRect(25,80,s-50,s-110);
  const g=c.createLinearGradient(0,80,s,s);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(.35,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(9,18,19,.2)');c.fillStyle=g;c.fillRect(25,80,s-50,s-110);
  c.fillStyle=color;c.fillRect(0,0,s,72);c.fillStyle='#fff7df';c.font='900 44px system-ui';c.textAlign='center';c.fillText(label, s/2,50);
 },1024,1,1)}

function roadBumpTexture(){return makeCanvasTexture((c,s)=>{c.fillStyle='#777';c.fillRect(0,0,s,s);const rnd=mulberry32(13046),rows=16,hh=s/rows;for(let r=0;r<rows;r++){const count=r%2?9:10,ww=s/count,off=r%2?-ww*.5:0;for(let x=off;x<s+ww;x+=ww){const v=112+Math.floor(rnd()*42);c.fillStyle=`rgb(${v},${v},${v})`;c.beginPath();c.roundRect(x+3,r*hh+3,ww-6,hh-6,4);c.fill();c.strokeStyle='#4a4a4a';c.lineWidth=3;c.stroke()}}},512,2.3,18)}
function sidewalkBumpTexture(){return makeCanvasTexture((c,s)=>{c.fillStyle='#888';c.fillRect(0,0,s,s);for(let y=0;y<s;y+=64)for(let x=0;x<s;x+=64){c.fillStyle='#a0a0a0';c.fillRect(x+3,y+3,58,58);c.strokeStyle='#666';c.lineWidth=2;c.strokeRect(x+3,y+3,58,58)}},512,2,18)}
function puddleTexture(){return makeCanvasTexture((c,s)=>{c.clearRect(0,0,s,s);const g=c.createRadialGradient(s*.48,s*.48,s*.06,s*.5,s*.5,s*.48);g.addColorStop(0,'rgba(128,172,190,.52)');g.addColorStop(.58,'rgba(86,126,143,.28)');g.addColorStop(.82,'rgba(58,90,102,.13)');g.addColorStop(1,'rgba(58,90,102,0)');c.save();c.translate(s/2,s/2);c.scale(1,.43);c.translate(-s/2,-s/2);c.fillStyle=g;c.beginPath();for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=s*(.38+Math.sin(i*2.7)*.025+Math.sin(i*5.2)*.014);const x=s/2+Math.cos(a)*r,y=s/2+Math.sin(a)*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y)}c.closePath();c.fill();c.restore()},256,1,1)}
function facadeTexture(base,label,variant=0,damaged=false){const key=`facade:${base}:${label}:${variant%6}:${damaged?1:0}`;return cachedTexture(key,()=>makeCanvasTexture((c,s)=>{const rnd=mulberry32(600+variant*97+(damaged?31:0));c.fillStyle=base;c.fillRect(0,0,s,s);const shade=c.createLinearGradient(0,0,s,0);shade.addColorStop(0,'rgba(0,0,0,.16)');shade.addColorStop(.12,'rgba(255,255,255,.07)');shade.addColorStop(.78,'rgba(255,255,255,.02)');shade.addColorStop(1,'rgba(0,0,0,.19)');c.fillStyle=shade;c.fillRect(0,0,s,s);for(let i=0;i<1500;i++){const a=.018+rnd()*.045;c.fillStyle=rnd()>.5?`rgba(255,255,255,${a})`:`rgba(35,28,22,${a})`;c.fillRect(rnd()*s,rnd()*s,1+rnd()*2,1+rnd()*3)}
  c.fillStyle='#6f675e';c.fillRect(0,s*.91,s,s*.09);c.fillStyle='rgba(240,226,205,.72)';c.fillRect(0,s*.30,s,10);c.fillRect(0,s*.055,s,11);
  const floors=3,cols=3;for(let fy=0;fy<floors;fy++)for(let fx=0;fx<cols;fx++){const x=s*(.11+fx*.30),y=s*(.12+fy*.225),w=s*.18,h=s*.135;c.fillStyle='rgba(244,232,213,.9)';c.fillRect(x-7,y-7,w+14,h+14);const wg=c.createLinearGradient(x,y,x+w,y+h);wg.addColorStop(0,'#668b9a');wg.addColorStop(.45,'#294853');wg.addColorStop(1,'#152d36');c.fillStyle=wg;c.fillRect(x,y,w,h);c.fillStyle='rgba(255,255,255,.24)';c.fillRect(x+w*.12,y+h*.08,3,h*.84);c.fillRect(x+w*.5,y,3,h);c.fillStyle='rgba(35,28,22,.28)';c.fillRect(x-9,y+h+5,w+18,8)}
  const sy=s*.73;c.fillStyle='#172429';c.fillRect(s*.05,sy,s*.90,s*.17);const glass=c.createLinearGradient(0,sy,s,sy+s*.17);glass.addColorStop(0,'#6b919d');glass.addColorStop(.45,'#233f49');glass.addColorStop(1,'#142b31');c.fillStyle=glass;c.fillRect(s*.075,sy+s*.03,s*.61,s*.12);c.fillStyle='#202b2d';c.fillRect(s*.72,sy+s*.01,s*.18,s*.16);c.fillStyle=variant%2?'#356456':'#8c4036';c.fillRect(s*.05,sy-s*.055,s*.90,s*.055);c.fillStyle='#fff2cf';c.font='900 30px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(label,s*.5,sy-s*.028);
  if(variant%3===1){c.fillStyle='rgba(45,52,53,.88)';c.fillRect(s*.12,s*.48,s*.76,9);for(let x=s*.16;x<s*.88;x+=s*.12)c.fillRect(x,s*.48,5,s*.10)}
  if(damaged){c.strokeStyle='rgba(61,50,42,.72)';c.lineWidth=4;for(let q=0;q<4;q++){let x=s*(.18+rnd()*.64),y=s*(.12+rnd()*.45);c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*35;y+=22+rnd()*31;c.lineTo(x,y)}c.stroke()}c.fillStyle='rgba(84,70,59,.18)';for(let q=0;q<5;q++){c.beginPath();c.ellipse(rnd()*s,rnd()*s*.7,20+rnd()*50,12+rnd()*38,rnd()*3,0,Math.PI*2);c.fill()}}
},768,1,1))}
function tramFrontTexture(){return cachedTexture('tram-front-v100',()=>makeCanvasTexture((c,s)=>{c.fillStyle='#e8e9e6';c.fillRect(0,0,s,s);const sky=c.createLinearGradient(0,s*.18,s,s*.62);sky.addColorStop(0,'#264753');sky.addColorStop(.48,'#101d23');sky.addColorStop(1,'#466976');c.fillStyle=sky;c.fillRect(s*.08,s*.16,s*.84,s*.42);c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.moveTo(s*.12,s*.19);c.lineTo(s*.55,s*.19);c.lineTo(s*.36,s*.55);c.lineTo(s*.12,s*.55);c.fill();c.fillStyle='#13191b';c.fillRect(s*.22,s*.055,s*.56,s*.075);c.fillStyle='#f1c83f';c.font='900 30px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('2  Sandow',s*.5,s*.092);c.fillStyle='#b82924';c.fillRect(0,s*.73,s,s*.20);c.fillStyle='#242c2d';c.fillRect(s*.18,s*.67,s*.64,s*.045);for(const x of[s*.18,s*.82]){const g=c.createRadialGradient(x,s*.83,2,x,s*.83,s*.065);g.addColorStop(0,'#fff7ca');g.addColorStop(.38,'#ffd45f');g.addColorStop(1,'rgba(255,194,61,0)');c.fillStyle=g;c.beginPath();c.arc(x,s*.83,s*.07,0,Math.PI*2);c.fill()}c.fillStyle='#323738';c.fillRect(s*.42,s*.89,s*.16,s*.04)},512,1,1))}
function tramSideTexture(){return cachedTexture('tram-side-v100',()=>makeCanvasTexture((c,s)=>{c.fillStyle='#e8e9e6';c.fillRect(0,0,s,s);c.fillStyle='#b82924';c.fillRect(0,s*.71,s,s*.21);for(let i=0;i<5;i++){const x=s*(.035+i*.195);const g=c.createLinearGradient(x,0,x+s*.16,s*.58);g.addColorStop(0,'#547987');g.addColorStop(.5,'#1b333c');g.addColorStop(1,'#0e2027');c.fillStyle=g;c.fillRect(x,s*.14,s*.15,s*.42);c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x+s*.015,s*.17,s*.018,s*.34)}for(const x of[s*.38,s*.58]){c.fillStyle='#30383a';c.fillRect(x,s*.08,s*.035,s*.62)}c.fillStyle='#313839';c.fillRect(0,s*.61,s,s*.035)},1024,2,1))}
function coinFaceTexture(){return cachedTexture('coin-face-v100',()=>makeCanvasTexture((c,s)=>{const g=c.createRadialGradient(s*.38,s*.3,s*.05,s*.5,s*.5,s*.5);g.addColorStop(0,'#fff5a2');g.addColorStop(.32,'#ffd642');g.addColorStop(.75,'#d59412');g.addColorStop(1,'#8d5708');c.fillStyle=g;c.fillRect(0,0,s,s);c.strokeStyle='#fff071';c.lineWidth=18;c.beginPath();c.arc(s/2,s/2,s*.39,0,Math.PI*2);c.stroke();c.strokeStyle='#9b650b';c.lineWidth=8;c.beginPath();c.arc(s/2,s/2,s*.29,0,Math.PI*2);c.stroke();c.fillStyle='#6d4307';c.font='1000 94px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('CB',s/2,s*.53);c.fillStyle='rgba(255,255,255,.36)';c.beginPath();c.ellipse(s*.34,s*.27,s*.17,s*.07,-.6,0,Math.PI*2);c.fill()},256,1,1))}
function mulberry32(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function colorChannels(value){const c=new THREE.Color(value);return [Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255)]}
function paintPixel(data,i,target,strength=.82){const lum=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255,shade=.30+lum*.78;data[i]=Math.round(data[i]*(1-strength)+target[0]*shade*strength);data[i+1]=Math.round(data[i+1]*(1-strength)+target[1]*shade*strength);data[i+2]=Math.round(data[i+2]*(1-strength)+target[2]*shade*strength)}
function outfitTexture(baseMap,outfit){
  if(!baseMap?.image)return baseMap;const key=`runner-outfit:${outfit.model}:${outfit.name}`;
  return cachedTexture(key,()=>{
    const img=baseMap.image,w=img.width||img.videoWidth||512,h=img.height||img.videoHeight||512,cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,w,h);const im=c.getImageData(0,0,w,h),d=im.data;
    const primary=colorChannels(outfit.primary),secondary=colorChannels(outfit.secondary),pants=colorChannels(outfit.pants),shoes=colorChannels(outfit.shoes),accent=colorChannels(outfit.accent);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]<12)continue;
      if(outfit.model==='male'){
        if(x>w*.575&&y<h*.67)paintPixel(d,i,primary,.90);
        else if(x<w*.355&&y<h*.64)paintPixel(d,i,pants,.78);
        else if(x>w*.34&&x<w*.59&&y<h*.49)paintPixel(d,i,secondary,.68);
        else if(x>w*.36&&x<w*.72&&y>h*.69)paintPixel(d,i,shoes,.68);
        if(x>w*.68&&y>h*.42&&y<h*.49)paintPixel(d,i,accent,.82);
      }else{
        const max=Math.max(d[i],d[i+1],d[i+2]),min=Math.min(d[i],d[i+1],d[i+2]),sat=max-min;
        const skinLike=d[i]>130&&d[i]>d[i+1]*1.12&&d[i+1]>d[i+2]*.75&&y>h*.62&&x<w*.34;
        if(sat>22&&!skinLike){
          if(y<h*.18)paintPixel(d,i,primary,.92);else if(y<h*.34)paintPixel(d,i,secondary,.88);else if(y<h*.52)paintPixel(d,i,pants,.88);else if(x>w*.48)paintPixel(d,i,shoes,.88);else paintPixel(d,i,accent,.72);
        }
      }
    }
    c.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.flipY=baseMap.flipY;t.wrapS=baseMap.wrapS;t.wrapT=baseMap.wrapT;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=S.renderer?Math.min(8,S.renderer.capabilities.getMaxAnisotropy()):4;return t
  })
}
function currentWorldTheme(){return WORLD_THEMES[S.worldIndex%WORLD_THEMES.length]||WORLD_THEMES[0]}
function rememberBaseColor(mat){if(mat?.color&&!mat.userData.rklBaseColor)mat.userData.rklBaseColor=mat.color.getHex()}
function tintMaterial(mat,tint){if(!mat?.color)return;rememberBaseColor(mat);mat.color.setHex(mat.userData.rklBaseColor).multiply(new THREE.Color(tint))}
function applyWorldTheme(index,announce=false){
  S.worldIndex=Math.max(0,index|0);S.worldTheme=currentWorldTheme();const t=S.worldTheme;
  for(const [key,mat] of S.resources.materials){if(!mat?.color)continue;if(key.startsWith('road-'))tintMaterial(mat,t.road);else if(key.startsWith('walk-')||key.startsWith('curb-'))tintMaterial(mat,t.walk);else if(key.startsWith('facade-')||key.startsWith('wall-')||key.startsWith('building-band'))tintMaterial(mat,t.facade);else if(key.startsWith('lamp-bulb'))tintMaterial(mat,t.lamp);else tintMaterial(mat,0xffffff)}
  if(S.scene){S.scene.background=new THREE.Color(t.sky);if(S.scene.fog)S.scene.fog.color.setHex(t.fog)}if(S.sun){S.sun.color.setHex(t.sun);S.sun.intensity=t.sunPower}if(S.hemi){S.hemi.color.setHex(t.hemiSky);S.hemi.groundColor.setHex(t.hemiGround)}
  if(S.overlay){S.overlay.dataset.world=String(S.worldIndex%WORLD_THEMES.length);setText(S.overlay.querySelector('[data-rkl-world-name]'),t.short);if(announce){const box=S.overlay.querySelector('[data-rkl-world-announce]');if(box){box.innerHTML=`<small>NEUER BEREICH</small><b>${t.name}</b>`;box.classList.remove('show');void box.offsetWidth;box.classList.add('show')}}}
  if(announce){S.weatherMode=t.weather;S.weatherClock=0;S.weatherDuration=18+Math.random()*16}
}
function updateWorldZone(){const next=Math.floor(S.distance/5000);if(next!==S.worldIndex)applyWorldTheme(next,true)}
function difficultyProfile(){
  const zone=Math.floor(S.distance/5000),progress=(S.distance%5000)/5000,theme=WORLD_THEMES[zone%WORLD_THEMES.length];
  if(zone===0)return {obstacle:.10+progress*.20,boost:.14,coin:.64,interval:1.28-progress*.16};
  const wave=[.34,.50,.42,.27][zone%4];return {obstacle:THREE.MathUtils.clamp(wave+progress*.10+theme.difficulty*.15,.24,.66),boost:.11,coin:.48,interval:Math.max(.58,1.05-zone*.025-progress*.09)}
}
async function firebaseRuntime(requireAuth=true){
  const core=window.LifeBuilderFirebaseCore;let fb=null,user=null;
  if(core?.load){fb=await core.load();user=fb.auth?.currentUser||null;if(requireAuth&&!user&&core.waitForAuth)user=await core.waitForAuth(6000)}
  else if(typeof window.loadFirebasePhoneRuntime==='function'){fb=await window.loadFirebasePhoneRuntime();user=fb.auth?.currentUser||null}
  if(!fb)throw new Error('Firebase ist noch nicht verbunden.');
  if(requireAuth&&!user)throw new Error('Bitte zuerst mit deinem JK.Games-Account anmelden.');return {fb,user}
}
async function callRunnerFunction(name,data={},requireAuth=true){const {fb,user}=await firebaseRuntime(requireAuth);if(typeof fb.httpsCallable!=='function'||!fb.functions)throw new Error('Firebase Functions sind nicht verfügbar.');const fn=fb.httpsCallable(fb.functions,name);const result=await fn(data);return {data:result?.data||{},user}}
async function beginRemoteRun(){S.remoteRunId='';S.runStartedAt=Date.now();try{const r=await callRunnerFunction('runnerStartRun',{});S.remoteRunId=String(r.data.runId||'')}catch(e){console.info('Runner.KL Weltrekord lokal gestartet:',e?.message||e)}}
async function submitRemoteRun(){if(S.remoteBusy||!S.remoteRunId)return;S.remoteBusy=true;try{await callRunnerFunction('runnerSubmitRun',{runId:S.remoteRunId,distance:Math.floor(S.distance),score:Math.floor(S.score),coins:S.runCoins,durationMs:Math.max(0,Date.now()-S.runStartedAt)});await loadWorldData(true)}catch(e){console.warn('Runner.KL Rekord konnte nicht übertragen werden:',e?.message||e)}finally{S.remoteBusy=false;S.remoteRunId=''}}
async function loadWorldData(force=false){if(S.worldDataLoaded&&!force)return S.worldData;try{const r=await callRunnerFunction('runnerGetWorldData',{limit:10},false);S.worldData=r.data;S.worldDataLoaded=true;S.worldDataError='';const top=Number(S.worldData?.global?.[0]?.distance||0);if(top>S.best)S.best=top;updateHud();return S.worldData}catch(e){S.worldDataError=e?.message||String(e);return null}}
function leaderboardRows(rows,emptyText='Noch keine Online-Rekorde vorhanden.'){return rows?.length?rows.map((r,i)=>`<li><b>${i+1}.</b><span>${escapeHtml(r.displayName||'Spieler')}</span><strong>${Number(r.distance||0).toLocaleString('de-DE')} m</strong></li>`).join(''):`<li class="empty">${escapeHtml(emptyText)}</li>`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function latestWinnerHtml(){const w=S.worldData?.latestWinner;if(!w)return '<p class="rkl-world-empty">Der erste Monatsbonus wird nach Monatsende ausgewertet.</p>';const deadline=Number(w.claimDeadlineMs||0),expired=deadline>0&&deadline<Date.now();return `<div class="rkl-winner"><span>🏆</span><div><small>MONATSSIEGER ${escapeHtml(w.month||'')}</small><b>${escapeHtml(w.displayName||'Spieler')}</b><em>${Number(w.distance||0).toLocaleString('de-DE')} m · 100.000 € ${w.claimed?'abgeholt':expired?'verfallen':'abholbar'}</em></div></div>`}
async function claimMonthlyReward(){if(S.rewardClaiming)return;S.rewardClaiming=true;const btn=S.overlay?.querySelector('[data-rkl-claim]');if(btn){btn.disabled=true;btn.textContent='Wird geprüft …'}try{const r=await callRunnerFunction('runnerClaimMonthlyReward',{});const amount=Math.max(0,Number(r.data.amount||0));if(amount>0){window.dispatchEvent(new CustomEvent('runner-kl-world-reward',{detail:{amount,month:r.data.month||'',claimId:r.data.claimId||''}}));showBoostToast('World Bonus',`${amount.toLocaleString('de-DE')} € wurden deinem Konto gutgeschrieben.`)}await loadWorldData(true);openLeaderboard()}catch(e){showBoostToast('World Bonus',e?.message||'Bonus konnte nicht abgeholt werden.')}finally{S.rewardClaiming=false}}
function openLeaderboard(){S.paused=S.running&&!S.gameOver;const w=S.worldData?.latestWinner,claimable=!!w?.canClaim,currentMonth=escapeHtml(S.worldData?.currentMonth||'Aktueller Monat');showCard(`<div class="rkl-kicker">ONLINE · FIREBASE</div><h1>World Rekorde</h1><p class="rkl-shop-note">Jeder angemeldete Lauf wird weltweit gewertet. Platz 1 des Monats erhält 100.000 € und hat sieben Tage Zeit zum Abholen.</p><div class="rkl-leaderboard-grid"><section><h3>Monat ${currentMonth}</h3><ol class="rkl-leaderboard">${leaderboardRows(S.worldData?.monthly||[],'In diesem Monat gibt es noch keinen Rekord.')}</ol></section><section><h3>Allzeit Top 10</h3><ol class="rkl-leaderboard">${leaderboardRows(S.worldData?.global||[])}</ol></section></div>${latestWinnerHtml()}${claimable?'<button data-rkl-claim>100.000 € abholen</button>':''}<button class="rkl-secondary" data-rkl-back>Zurück</button>`);S.overlay.querySelector('[data-rkl-claim]')?.addEventListener('click',claimMonthlyReward);S.overlay.querySelector('[data-rkl-back]').onclick=()=>{S.paused=false;showStart()}}

function setupScene(){
  const canvas=S.overlay.querySelector('canvas');
  S.lowPower=(navigator.hardwareConcurrency||8)<=4;
  S.scene=new THREE.Scene();S.scene.background=new THREE.Color(0x79a9bf);S.scene.fog=new THREE.FogExp2(0x78939f,.00048);
  S.camera=new THREE.PerspectiveCamera(55,1,.1,S.quality==='ultra'?250:210);S.camera.position.set(0,3.55,7.05);S.camera.lookAt(0,1.22,-15);
  S.renderer=new THREE.WebGLRenderer({canvas,antialias:S.quality==='high'||S.quality==='ultra',alpha:false,powerPreference:'high-performance',stencil:false,preserveDrawingBuffer:false});
  S.renderer.outputColorSpace=THREE.SRGBColorSpace;S.renderer.toneMapping=THREE.ACESFilmicToneMapping;S.renderer.toneMappingExposure={low:.92,medium:.88,high:.84,ultra:.82}[S.quality];S.renderer.setClearColor(0x79a9bf,1);
  S.renderer.shadowMap.enabled=S.quality!=='low';S.renderer.shadowMap.type=THREE.PCFSoftShadowMap;S.renderer.shadowMap.autoUpdate=true;
  const pmrem=new THREE.PMREMGenerator(S.renderer),env=new RoomEnvironment();S.scene.environment=pmrem.fromScene(env,.025).texture;env.dispose?.();pmrem.dispose();
  S.composer=null;S.bloom=null;S.ssao=null;resize();
  S.hemi=new THREE.HemisphereLight(0xc3d7df,0x3d382f,S.quality==='ultra'?.88:.82);S.scene.add(S.hemi);
  S.sun=new THREE.DirectionalLight(0xffdfba,S.quality==='ultra'?1.42:1.25);S.sun.position.set(-18,28,13);S.sun.castShadow=S.quality!=='low';const sm=S.quality==='ultra'?2048:S.quality==='high'?1024:512;S.sun.shadow.mapSize.set(sm,sm);S.sun.shadow.camera.left=-10;S.sun.shadow.camera.right=10;S.sun.shadow.camera.top=18;S.sun.shadow.camera.bottom=-4;S.sun.shadow.camera.near=1;S.sun.shadow.camera.far=62;S.sun.shadow.bias=-.00008;S.sun.shadow.normalBias=.035;S.sun.shadow.radius=S.quality==='ultra'?3:2;S.scene.add(S.sun);
  S.fill=new THREE.DirectionalLight(0x80a7c0,.24);S.fill.position.set(14,8,-18);S.scene.add(S.fill);
  createWorld();addCinematicLighting();createWeatherSystem();applyWorldTheme(0,false);applyQuality();
}
function addCinematicLighting(){
  const rim=new THREE.DirectionalLight(0xffb46f,.18);rim.position.set(-8,12,8);S.scene.add(rim);
  const cool=new THREE.DirectionalLight(0x6e9fbd,.11);cool.position.set(12,6,-16);S.scene.add(cool);
}
function resize(){if(!S.renderer||!S.overlay)return;const r=S.overlay.querySelector('.runner-kl-stage').getBoundingClientRect();const base={low:1,medium:1.08,high:1.24,ultra:S.lowPower?1.22:1.45}[S.quality]||1.24;const cap=base*S.renderScale;S.dpr=Math.min(cap,window.devicePixelRatio||1);S.renderer.setPixelRatio(S.dpr);S.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);S.camera.aspect=r.width/Math.max(1,r.height);S.camera.updateProjectionMatrix()}

function createWorld(){
  S.world=new THREE.Group();S.scene.add(S.world);
  const roadMat=cachedMaterial('road-v100',()=>new THREE.MeshStandardMaterial({map:cachedTexture('road-map-v100',cobbleTexture),bumpMap:cachedTexture('road-bump-v100',roadBumpTexture),bumpScale:.065,roughness:.86,metalness:.035,color:0x9a958d,envMapIntensity:.45}));
  const walkMat=cachedMaterial('walk-v100',()=>new THREE.MeshStandardMaterial({map:cachedTexture('walk-map-v100',sidewalkTexture),bumpMap:cachedTexture('walk-bump-v100',sidewalkBumpTexture),bumpScale:.035,roughness:.94,color:0xb1aba0,envMapIntensity:.24}));
  const count=S.quality==='low'?5:6;for(let i=0;i<count;i++){const seg=createSegment(-i*25,roadMat,walkMat,i);S.segments.push(seg);S.world.add(seg)}
  S.scene.add(createSkyline());createOverheadWires();createAtmosphere();createPlayer();
}
function createSegment(z,roadMat,walkMat,index){
  const g=new THREE.Group();g.position.z=z;
  const road=new THREE.Mesh(cachedGeometry('road-plane-v100',()=>new THREE.PlaneGeometry(12,25,1,1)),roadMat);road.rotation.x=-Math.PI/2;road.receiveShadow=true;g.add(road);
  const curbMat=cachedMaterial('curb-v100',()=>new THREE.MeshStandardMaterial({color:0xa9a398,roughness:.92,bumpScale:.02}));
  const gutterMat=cachedMaterial('gutter-v100',()=>new THREE.MeshStandardMaterial({color:0x666762,roughness:.9}));
  for(const side of[-1,1]){
    const sw=new THREE.Mesh(cachedGeometry('walk-plane-v100',()=>new THREE.PlaneGeometry(4.3,25,1,1)),walkMat);sw.rotation.x=-Math.PI/2;sw.position.set(side*8.15,.13,0);sw.receiveShadow=true;g.add(sw);
    const curb=new THREE.Mesh(cachedGeometry('curb-geo-v100',()=>new THREE.BoxGeometry(.34,.26,25)),curbMat);curb.position.set(side*6.02,.13,0);curb.receiveShadow=true;g.add(curb);
    const gutter=new THREE.Mesh(cachedGeometry('gutter-geo-v100',()=>new THREE.BoxGeometry(.42,.035,25)),gutterMat);gutter.position.set(side*5.78,.035,0);gutter.receiveShadow=true;g.add(gutter);
    g.add(createBuildingRow(side,index));for(let k=0;k<2;k++)g.add(createStreetProp(side,-7+k*13+(index%2)*1.7,index*3+k));
  }
  const railMat=cachedMaterial('rail-v100',()=>new THREE.MeshStandardMaterial({color:0x8c9293,roughness:.17,metalness:.92,envMapIntensity:1.1}));
  for(const x of[-1.45,1.45]){const rail=new THREE.Mesh(cachedGeometry('rail-geo-v100',()=>new THREE.BoxGeometry(.105,.07,25)),railMat);rail.position.set(x,.064,0);rail.receiveShadow=true;g.add(rail)}
  const sleeperMat=cachedMaterial('sleeper-v100',()=>new THREE.MeshStandardMaterial({color:0x514c46,roughness:.98}));
  const sleeperGeo=cachedGeometry('sleeper-geo-v100',()=>new THREE.BoxGeometry(3.45,.055,.15));for(let z0=-11;z0<=11;z0+=2.5){const sleeper=new THREE.Mesh(sleeperGeo,sleeperMat);sleeper.position.set(0,.032,z0);sleeper.receiveShadow=true;g.add(sleeper)}
  if(index%4===1){const stripeMat=cachedMaterial('crossing-v100',()=>new THREE.MeshStandardMaterial({color:0xe3ded2,roughness:.9}));const stripeGeo=cachedGeometry('crossing-geo-v100',()=>new THREE.PlaneGeometry(.72,3.2));for(let x=-4.8;x<=4.8;x+=1.2){const stripe=new THREE.Mesh(stripeGeo,stripeMat);stripe.rotation.x=-Math.PI/2;stripe.position.set(x,.071,-8.8);stripe.receiveShadow=true;g.add(stripe)}}
  if(index%3===0){const drain=new THREE.Mesh(cachedGeometry('drain-geo-v100',()=>new THREE.CylinderGeometry(.34,.34,.022,24)),cachedMaterial('drain-mat-v100',()=>new THREE.MeshStandardMaterial({color:0x596063,roughness:.48,metalness:.7})));drain.position.set(index%2?2.8:-2.7,.025,-5);drain.receiveShadow=true;g.add(drain)}
  if(index%2===0){const puddle=new THREE.Mesh(cachedGeometry('puddle-plane-v100',()=>new THREE.PlaneGeometry(2.5,1.15)),cachedMaterial('puddle-mat-v100',()=>new THREE.MeshPhysicalMaterial({map:cachedTexture('puddle-map-v100',puddleTexture),transparent:true,opacity:.52,depthWrite:false,roughness:.12,metalness:.05,clearcoat:.75,clearcoatRoughness:.18,polygonOffset:true,polygonOffsetFactor:-1})));puddle.rotation.x=-Math.PI/2;puddle.rotation.z=(index%3-.9)*.22;puddle.position.set(index%4<2?-3.1:2.7,.076,3.3);g.add(puddle)}
  return g;
}
function createBuildingRow(side,index){
  const row=new THREE.Group(),rnd=mulberry32(index*91+(side>0?17:3));const names=['CAFÉ CB','STADT-LADEN','SPREMBERG','KONDITOREI','MODEHAUS','BUCH & CO'];const colors=['#b98d66','#d0b894','#a96354','#c8c1b2','#918c83','#bc7556'];let cursor=-11.6;
  for(let i=0;i<4;i++){
    const width=4.7+rnd()*2.05,height=8.7+rnd()*5.3,depth=5.1+rnd()*1.8,damaged=(index+i)%5===0,variant=(index*4+i)%12,label=names[(index+i)%names.length],base=colors[(index+i)%colors.length];
    const b=new THREE.Group(),centerZ=cursor+width/2,baseX=side*(8.1+depth/2),frontX=side*(8.1-.008);
    const facade=cachedMaterial(`facade-mat:${base}:${label}:${variant}:${damaged}`,()=>new THREE.MeshStandardMaterial({map:facadeTexture(base,label,variant,damaged),roughness:.84,metalness:.01,bumpScale:.015,envMapIntensity:.34}));
    const sideMat=cachedMaterial(`wall-mat:${base}`,()=>new THREE.MeshStandardMaterial({map:cachedTexture(`wall-map:${base}`,()=>wallTexture(base,false,3)),roughness:.91,color:0xffffff,envMapIntensity:.24}));
    const mats=side>0?[sideMat,facade,sideMat,sideMat,sideMat,sideMat]:[facade,sideMat,sideMat,sideMat,sideMat,sideMat];
    const body=new THREE.Mesh(new THREE.BoxGeometry(depth,height,width),mats);body.position.set(baseX,height/2,centerZ);body.castShadow=S.quality==='ultra'&&!S.lowPower;body.receiveShadow=true;b.add(body);
    const stone=cachedMaterial('building-stone-v100',()=>new THREE.MeshStandardMaterial({color:0x746b61,roughness:.96}));const plinth=new THREE.Mesh(new THREE.BoxGeometry(depth+.06,.55,width+.06),stone);plinth.position.set(baseX,.275,centerZ);plinth.receiveShadow=true;b.add(plinth);
    const bandMat=cachedMaterial('building-band-v100',()=>new THREE.MeshStandardMaterial({color:0xd8cbb8,roughness:.88}));for(const y of[2.8,height-.28]){const band=new THREE.Mesh(new THREE.BoxGeometry(depth+.12,.12,width+.12),bandMat);band.position.set(baseX,y,centerZ);b.add(band)}
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(.58,.12,width*.72),cachedMaterial(`canopy:${variant%2}`,()=>new THREE.MeshStandardMaterial({color:variant%2?0x315f53:0x7e382f,roughness:.72})));canopy.position.set(side*7.82,2.72,centerZ);canopy.castShadow=true;b.add(canopy);
    if(variant%3===1){const slab=new THREE.Mesh(new THREE.BoxGeometry(.72,.12,width*.5),stone);slab.position.set(side*7.76,5.05,centerZ);slab.castShadow=true;b.add(slab);const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,.72,width*.54),cachedMaterial('balcony-rail-v100',()=>new THREE.MeshStandardMaterial({color:0x35403e,roughness:.52,metalness:.55})));rail.position.set(side*7.42,5.47,centerZ);b.add(rail)}
    const roofMat=cachedMaterial('roof-mat-v100',()=>new THREE.MeshStandardMaterial({map:cachedTexture('roof-map-v100',roofTexture),roughness:.88,envMapIntensity:.22}));const roofH=1.25+rnd()*.8;const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(depth,width)*.68,roofH,4),roofMat);roof.scale.set(depth/width,1,1);roof.rotation.y=Math.PI/4;roof.position.set(baseX,height+roofH*.46,centerZ);roof.castShadow=S.quality==='ultra'&&!S.lowPower;b.add(roof);
    row.add(b);cursor+=width+.22;
  }return row;
}
function createStreetProp(side,z,seed){
  const g=new THREE.Group();g.position.set(side*6.9,0,z);const dark=cachedMaterial('street-dark-v100',()=>new THREE.MeshStandardMaterial({color:0x283331,roughness:.5,metalness:.48}));
  const pole=new THREE.Mesh(cachedGeometry('lamp-pole-v100',()=>new THREE.CylinderGeometry(.045,.08,3.25,8)),dark);pole.position.y=1.66;pole.castShadow=S.quality==='ultra';g.add(pole);const arm=new THREE.Mesh(cachedGeometry('lamp-arm-v100',()=>new THREE.TorusGeometry(.39,.038,6,12,Math.PI)),dark);arm.rotation.z=side>0?0:Math.PI;arm.position.set(-side*.36,3.08,0);g.add(arm);const bulb=new THREE.Mesh(cachedGeometry('lamp-bulb-v100',()=>new THREE.SphereGeometry(.14,10,8)),cachedMaterial('lamp-bulb-mat-v100',()=>new THREE.MeshStandardMaterial({color:0xffe0a0,emissive:0xd69b44,emissiveIntensity:.18,roughness:.3})));bulb.position.set(-side*.73,3.02,0);g.add(bulb);
  if(seed%2===0){const trunk=new THREE.Mesh(cachedGeometry('tree-trunk-v100',()=>new THREE.CylinderGeometry(.11,.17,1.8,8)),cachedMaterial('tree-trunk-mat-v100',()=>new THREE.MeshStandardMaterial({color:0x65482f,roughness:1})));trunk.position.set(side*.76,.9,.72);g.add(trunk);const crown=new THREE.Mesh(cachedGeometry('tree-crown-v100',()=>new THREE.IcosahedronGeometry(.82,1)),cachedMaterial(`tree-crown-mat:${seed%3}`,()=>new THREE.MeshStandardMaterial({color:[0x486d43,0x58794a,0x3f6740][seed%3],roughness:1})));crown.position.set(side*.76,2.02,.72);crown.castShadow=S.quality==='ultra';g.add(crown)}
  else{const wood=cachedMaterial('bench-wood-v100',()=>new THREE.MeshStandardMaterial({color:0x604735,roughness:.92}));const seat=new THREE.Mesh(cachedGeometry('bench-seat-v100',()=>new THREE.BoxGeometry(1.45,.13,.52)),wood);seat.position.set(side*.7,.48,.76);g.add(seat);const back=new THREE.Mesh(cachedGeometry('bench-back-v100',()=>new THREE.BoxGeometry(1.45,.48,.11)),wood);back.position.set(side*.7,.78,1.01);back.rotation.x=-.12;g.add(back)}
  if(seed%3===0){const bin=new THREE.Mesh(cachedGeometry('bin-v100',()=>new THREE.CylinderGeometry(.21,.24,.62,10)),dark);bin.position.set(-side*.46,.32,-.6);g.add(bin)}return g;
}

function createOverheadWires(){
  const mat=new THREE.LineBasicMaterial({color:0x273332,transparent:true,opacity:.72});
  for(const x of[-3.1,0,3.1]){const pts=[];for(let i=0;i<10;i++)pts.push(new THREE.Vector3(x,6.2+Math.sin(i*.9)*.18,8-i*18));const geo=new THREE.BufferGeometry().setFromPoints(pts);S.scene.add(new THREE.Line(geo,mat))}
  for(let i=0;i<9;i++){const z=2-i*18;const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7.1,6.5,z),new THREE.Vector3(7.1,6.5,z)]);S.scene.add(new THREE.Line(geo,mat))}
}
function createAtmosphere(){
  const count=S.quality==='ultra'&&!S.lowPower?70:S.quality==='high'?40:0;if(count){const dustGeo=new THREE.BufferGeometry(),arr=[];for(let i=0;i<count;i++)arr.push((Math.random()-.5)*18,.35+Math.random()*7,-Math.random()*150);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffdfaa,size:.025,transparent:true,opacity:.16,depthWrite:false}));dust.name='rklDust';S.scene.add(dust)}
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
    root.traverse(o=>{if(!o.isMesh)return;o.castShadow=S.quality!=='low';o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=mats.map(m=>{const n=m.clone();if(n.map){n.map.colorSpace=THREE.SRGBColorSpace;n.map=outfitTexture(n.map,outfit);n.color.setHex(0xffffff)}else n.color.setHex(outfit.primary);n.roughness=Math.max(.42,n.roughness??.7);n.metalness=Math.min(.12,n.metalness??0);n.envMapIntensity=1.0;n.side=THREE.FrontSide;n.needsUpdate=true;return n});if(o.material.length===1)o.material=o.material[0]});
    const pivot=new THREE.Group();pivot.add(root);pivot.position.set(0,0,1.1);S.characterRoot=root;S.characterBones={hips:root.getObjectByName('mixamorig:Hips_00')||root.getObjectByName('bip Pelvis_02')||null,spine:root.getObjectByName('mixamorig:Spine2_03')||root.getObjectByName('bip Spine1_04')||null};decorateRunner(pivot,outfit);addContactShadow(pivot);S.player=pivot;S.scene.add(pivot);
    if(gltf.animations?.length){S.mixer=new THREE.AnimationMixer(root);const run=gltf.animations.find(a=>/run|sprint|jog|walk/i.test(a.name))||gltf.animations[0];S.action=S.mixer.clipAction(run);S.action.setLoop(THREE.LoopRepeat,Infinity);S.action.clampWhenFinished=false;S.action.enabled=true;S.action.setEffectiveWeight(1);S.action.play();S.action.timeScale=1.12}
  }catch(e){console.warn('Runner.KL GLB konnte nicht geladen werden',e);S.player=createFallbackPlayer(outfit);S.scene.add(S.player)}finally{hideLoading()}
}

function decorateRunner(pivot,outfit){
  S.characterRig=null;const acc=new THREE.Group();acc.name='rklOutfitAccessories';pivot.add(acc);
  const primary=new THREE.MeshStandardMaterial({color:outfit.primary,roughness:.62,metalness:.04});const accent=new THREE.MeshStandardMaterial({color:outfit.accent,emissive:outfit.accent,emissiveIntensity:.12,roughness:.42,metalness:.16});
  if(S.outfit==='maleSport'){const band=new THREE.Mesh(new THREE.TorusGeometry(.205,.025,8,24),accent);band.rotation.x=Math.PI/2;band.position.set(0,1.72,.005);acc.add(band)}
  if(S.outfit==='femaleNight'){for(const x of[-.29,.29]){const band=new THREE.Mesh(new THREE.TorusGeometry(.085,.018,7,18),accent);band.rotation.x=Math.PI/2;band.position.set(x,1.02,.02);acc.add(band)}}
  if(S.outfit==='maleWorker'){const helmet=new THREE.Mesh(new THREE.SphereGeometry(.255,18,10,0,Math.PI*2,0,Math.PI*.55),primary);helmet.position.set(0,1.77,0);helmet.scale.y=.58;helmet.castShadow=true;acc.add(helmet);const brim=new THREE.Mesh(new THREE.CylinderGeometry(.28,.31,.045,20),primary);brim.position.set(0,1.73,.02);acc.add(brim);for(const x of[-.19,.19]){const strip=new THREE.Mesh(new THREE.BoxGeometry(.055,.55,.012),accent);strip.position.set(x,1.12,.27);acc.add(strip)}}
  if(S.outfit==='femaleCity'){const bag=new THREE.Mesh(new RoundedBoxGeometry(.28,.34,.12,2,.04),primary);bag.position.set(.27,.98,.25);bag.rotation.z=-.12;acc.add(bag);const strap=new THREE.Mesh(new THREE.TorusGeometry(.34,.018,6,22,Math.PI*1.35),accent);strap.position.set(.02,1.28,.18);strap.rotation.z=-.48;acc.add(strap)}
  acc.traverse(o=>{if(o.isMesh){o.castShadow=S.quality!=='low';o.receiveShadow=true}})
}
function addContactShadow(pivot){
  const tex=cachedTexture('contact-shadow-v100',()=>makeCanvasTexture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,3,s/2,s/2,s/2);g.addColorStop(0,'rgba(0,0,0,.46)');g.addColorStop(.48,'rgba(0,0,0,.19)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,s,s)},192,1,1));
  const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:true,opacity:.55,polygonOffset:true,polygonOffsetFactor:-2});const q=new THREE.Mesh(cachedGeometry('contact-shadow-plane-v100',()=>new THREE.PlaneGeometry(1.05,1.55)),m);q.rotation.x=-Math.PI/2;q.position.set(0,.045,1.22);q.renderOrder=1;S.scene.add(q);S.contactShadow=q;
}

function createFallbackPlayer(outfit){const g=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:outfit.tint===0xffffff?0x2f4858:outfit.tint,roughness:.75}),skin=new THREE.MeshStandardMaterial({color:0xc89170,roughness:.8});const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.72,6,12),cloth);torso.position.y=1.08;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),skin);head.position.y=1.75;g.add(head);for(const x of[-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.58,5,8),cloth);leg.position.set(x,.38,0);g.add(leg)}g.position.z=1.1;return g}
function disposePlayer(){clearJetpackRig();S.characterRig=null;S.characterRoot=null;S.characterBones=null;S.characterTime=0;if(S.contactShadow){S.scene?.remove(S.contactShadow);S.contactShadow.material?.dispose?.();S.contactShadow=null}if(S.player){S.scene?.remove(S.player);S.player.traverse(o=>{if(o.geometry&&!S.resources.geometries.has(o.geometry))o.geometry.dispose?.();const ms=Array.isArray(o.material)?o.material:[o.material];ms.filter(Boolean).forEach(m=>m.dispose?.())})}S.player=null;S.mixer=null;S.action=null}

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
function createJetpackRig(){
  if(!S.player||S.jetRig)return;const rig=new THREE.Group();rig.name='rklJetpackRig';
  const metal=new THREE.MeshPhysicalMaterial({color:0x2b343c,roughness:.34,metalness:.72,clearcoat:.18});const red=new THREE.MeshPhysicalMaterial({color:0xa92c25,roughness:.42,metalness:.28,clearcoat:.2});const dark=new THREE.MeshStandardMaterial({color:0x11171b,roughness:.48,metalness:.48});
  const flameGeo=new THREE.ConeGeometry(.075,.58,12),tankGeo=new THREE.CylinderGeometry(.105,.125,.58,16),nozzleGeo=new THREE.ConeGeometry(.085,.17,12);
  for(const x of[-.17,.17]){
    const tank=new THREE.Mesh(tankGeo,x<0?metal:red);tank.position.set(x,1.05,.34);tank.castShadow=true;rig.add(tank);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.09,14),dark);cap.position.set(x,1.38,.34);rig.add(cap);
    const nozzle=new THREE.Mesh(nozzleGeo,dark);nozzle.rotation.z=Math.PI;nozzle.position.set(x,.69,.34);rig.add(nozzle);
    const flameMat=new THREE.MeshBasicMaterial({color:x<0?0x63c9ff:0xffa53a,transparent:true,opacity:.86,blending:THREE.AdditiveBlending,depthWrite:false});const flame=new THREE.Mesh(flameGeo,flameMat);flame.rotation.z=Math.PI;flame.position.set(x,.35,.34);flame.name='jetFlame';rig.add(flame)
  }
  const back=new THREE.Mesh(new RoundedBoxGeometry(.46,.62,.12,2,.04),dark);back.position.set(0,1.08,.27);rig.add(back);const brace=new THREE.Mesh(new THREE.BoxGeometry(.52,.07,.07),metal);brace.position.set(0,1.06,.43);rig.add(brace);
  const glow=new THREE.PointLight(0xff9b45,.42,2.8,2);glow.position.set(0,.34,.38);rig.add(glow);S.player.add(rig);S.jetRig=rig
}
function clearJetpackRig(){if(!S.jetRig)return;S.player?.remove(S.jetRig);S.jetRig.traverse(o=>{o.geometry?.dispose?.();if(o.material)o.material.dispose?.()});S.jetRig=null}
function updateJetpackRig(dt){
  const active=S.activeBoosts.jetpack>0;if(active&&!S.jetRig)createJetpackRig();if(!active&&S.jetRig){clearJetpackRig();return}if(!S.jetRig)return;
  const t=S.elapsed*22;for(const [i,f] of S.jetRig.children.filter(o=>o.name==='jetFlame').entries()){f.scale.set(1,.86+Math.sin(t+i)*.18,1);f.material.opacity=.72+Math.sin(t*1.4+i)*.14}S.player.rotation.x=THREE.MathUtils.damp(S.player.rotation.x,-.34,8,dt);S.player.rotation.z=THREE.MathUtils.damp(S.player.rotation.z,(S.targetX-S.player.position.x)*-.035,8,dt)
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
  if(type==='jetpack'){S.y=Math.max(S.y,2.5);S.vy=0;createJetpackRig()}
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
  if(!S.overlay)return;const active=Object.entries({magnet:'🧲',jetpack:'🚀',sneakers:'👟',multiplier:'2×'}).filter(([k])=>S.activeBoosts[k]>0).map(([k,ic])=>`${k}:${Math.ceil(S.activeBoosts[k])}:${ic}`);const signature=active.join('|')+`|${Math.ceil(S.hoverboard)}:${Math.ceil(S.hoverCooldown)}:${S.boardTokens}`;if(signature===S.lastBoostSignature)return;S.lastBoostSignature=signature;const box=S.overlay.querySelector('[data-rkl-boosts]');if(box)box.innerHTML=active.map(v=>{const [k,n,ic]=v.split(':');return `<span>${ic}<b>${n}</b></span>`}).join('');const board=S.overlay.querySelector('[data-rkl-board]');if(board){board.classList.toggle('active',S.hoverboard>0);board.disabled=S.boardTokens<=0||S.hoverCooldown>0||S.hoverboard>0;board.innerHTML=`<span>🛹</span><b>${S.hoverboard>0?Math.ceil(S.hoverboard):S.hoverCooldown>0?Math.ceil(S.hoverCooldown):S.boardTokens}</b>`}
}
function makeCoin(){
  const side=cachedMaterial('coin-side-v100',()=>new THREE.MeshStandardMaterial({color:0xc9870d,roughness:.24,metalness:.88,envMapIntensity:1.25}));const face=cachedMaterial('coin-face-mat-v100',()=>new THREE.MeshStandardMaterial({map:coinFaceTexture(),color:0xffffff,roughness:.2,metalness:.74,envMapIntensity:1.35}));
  const disc=new THREE.Mesh(cachedGeometry('coin-geo-v100',()=>new THREE.CylinderGeometry(.34,.34,.085,24)),[side,face,face]);disc.rotation.x=Math.PI/2;disc.userData.type='coin';disc.castShadow=false;return disc;
}
function makeTextSprite(text,color,bg){const cv=document.createElement('canvas');cv.width=256;cv.height=128;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,256,128);c.fillStyle=color;c.font='900 72px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,128,67);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:false}));return s}
function makeBarrier(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xe1ddd3,roughness:.75}),red=new THREE.MeshStandardMaterial({color:0xc84332,roughness:.7});for(let i=-2;i<=2;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.45,.72,.14),i%2?white:red);m.position.set(i*.45,1.0,0);m.rotation.z=-.28;m.castShadow=true;g.add(m)}const beam=new THREE.Mesh(new THREE.BoxGeometry(2.6,.16,.18),white);beam.position.y=.72;g.add(beam);for(const x of[-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.7,.13),new THREE.MeshStandardMaterial({color:0x3d4442,roughness:.75,metalness:.25}));leg.position.set(x,.35,0);g.add(leg)}g.userData.type='barrier';return g}
function makeTram(){
  const g=new THREE.Group();const bodyMat=cachedMaterial('tram-body-v100',()=>new THREE.MeshPhysicalMaterial({color:0xe6e7e3,roughness:.42,metalness:.12,clearcoat:.22,clearcoatRoughness:.5,envMapIntensity:.65}));const redMat=cachedMaterial('tram-red-v100',()=>new THREE.MeshPhysicalMaterial({color:0xb72b25,roughness:.38,metalness:.12,clearcoat:.2}));const dark=cachedMaterial('tram-dark-v100',()=>new THREE.MeshStandardMaterial({color:0x262d2f,roughness:.34,metalness:.55}));
  const body=new THREE.Mesh(cachedGeometry('tram-body-geo-v100',()=>new RoundedBoxGeometry(2.72,2.68,7.25,3,.13)),bodyMat);body.position.y=1.72;body.castShadow=S.quality!=='low';body.receiveShadow=true;g.add(body);const lower=new THREE.Mesh(cachedGeometry('tram-lower-geo-v100',()=>new RoundedBoxGeometry(2.76,.62,7.3,2,.09)),redMat);lower.position.y=.55;lower.castShadow=S.quality==='ultra';g.add(lower);
  const frontMat=cachedMaterial('tram-front-mat-v100',()=>new THREE.MeshPhysicalMaterial({map:tramFrontTexture(),roughness:.31,metalness:.04,clearcoat:.38,clearcoatRoughness:.25}));for(const z of[-3.64,3.64]){const front=new THREE.Mesh(cachedGeometry('tram-front-plane-v100',()=>new THREE.PlaneGeometry(2.52,2.72)),frontMat);front.position.set(0,1.86,z);front.rotation.y=z>0?0:Math.PI;g.add(front)}
  const sideMat=cachedMaterial('tram-side-mat-v100',()=>new THREE.MeshPhysicalMaterial({map:tramSideTexture(),roughness:.35,metalness:.05,clearcoat:.28}));for(const x of[-1.371,1.371]){const sidePanel=new THREE.Mesh(cachedGeometry('tram-side-plane-v100',()=>new THREE.PlaneGeometry(7.0,2.5)),sideMat);sidePanel.position.set(x,1.8,0);sidePanel.rotation.y=x>0?Math.PI/2:-Math.PI/2;g.add(sidePanel)}
  const roof=new THREE.Mesh(cachedGeometry('tram-roof-v100',()=>new RoundedBoxGeometry(2.58,.18,7.05,2,.07)),dark);roof.position.y=3.11;roof.castShadow=S.quality==='ultra';g.add(roof);
  const pantoMat=cachedMaterial('panto-v100',()=>new THREE.MeshStandardMaterial({color:0x343b3c,roughness:.28,metalness:.76}));for(const x of[-.44,.44]){const bar=new THREE.Mesh(cachedGeometry('panto-bar-v100',()=>new THREE.BoxGeometry(.055,1.02,.055)),pantoMat);bar.position.set(x,3.62,0);bar.rotation.z=x>0?.48:-.48;g.add(bar)}const top=new THREE.Mesh(cachedGeometry('panto-top-v100',()=>new THREE.BoxGeometry(1.35,.045,.07)),pantoMat);top.position.set(0,4.05,0);g.add(top);
  g.userData.type='tram';g.userData.roofY=3.24;g.userData.halfLength=3.62;return g;
}
function makeBollards(){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x4b504f,roughness:.55,metalness:.45});for(const x of[-.72,0,.72]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.95,12),mat);b.position.set(x,.48,0);b.castShadow=true;g.add(b);const band=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.12,12),new THREE.MeshStandardMaterial({color:0xe0c62f,roughness:.5}));band.position.set(x,.67,0);g.add(band)}g.userData.type='bollards';return g}
function createImpactFX(x,y,z){
  const group=new THREE.Group();group.position.set(x,y,z);const mat=new THREE.MeshBasicMaterial({color:0xffb43a,transparent:true,opacity:1,depthWrite:false});
  for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.035+Math.random()*.045,6,5),mat.clone());const a=Math.random()*Math.PI*2,sp=.8+Math.random()*2.4;m.userData.v=new THREE.Vector3(Math.cos(a)*sp,.7+Math.random()*2.2,Math.sin(a)*sp);group.add(m)}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.28,.055,8,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.userData.ring=true;group.add(ring);S.scene.add(group);S.impactFx.push({group,life:.65});cameraShake();
}
function updateImpactFX(dt){for(let i=S.impactFx.length-1;i>=0;i--){const fx=S.impactFx[i];fx.life-=dt;for(const m of fx.group.children){if(m.userData.ring){m.scale.addScalar(dt*4);m.material.opacity=Math.max(0,fx.life)}else{m.position.addScaledVector(m.userData.v,dt);m.userData.v.y-=5*dt;m.material.opacity=Math.max(0,fx.life*1.5)}}if(fx.life<=0){S.scene.remove(fx.group);fx.group.traverse(n=>{n.geometry?.dispose?.();n.material?.dispose?.()});S.impactFx.splice(i,1)}}}
function spawnRow(){
  const profile=difficultyProfile(),z=-86,r=Math.random(),lane=Math.floor(Math.random()*3);
  if(r<profile.obstacle){
    const zone=Math.floor(S.distance/5000),tramChance=zone===0?.09:.19,kind=Math.random();const make=()=>kind<tramChance?makeTram():kind<.66?makeBarrier():makeBollards();const first=make();first.position.set((lane-1)*2.6,0,z);first.userData.lane=lane;S.scene.add(first);S.objects.push(first);
    if(zone>0&&profile.obstacle>.43&&Math.random()<.22){const free=[0,1,2].filter(v=>v!==lane),lane2=free[Math.floor(Math.random()*free.length)],second=Math.random()<.25?makeTram():makeBarrier();second.position.set((lane2-1)*2.6,0,z-(Math.random()<.5?0:2.2));second.userData.lane=lane2;S.scene.add(second);S.objects.push(second)}
  }else if(r<profile.obstacle+profile.boost){
    const types=['magnet','jetpack','sneakers','multiplier','pogo'],type=types[Math.floor(Math.random()*types.length)],o=makeBoost(type);o.position.set((lane-1)*2.6,1.05,z);o.userData.lane=lane;S.scene.add(o);S.objects.push(o)
  }else{
    const count=Math.random()<.28?7:Math.random()<.62?5:3,arc=Math.random()<.24;for(let i=0;i<count;i++){const o=makeCoin();o.position.set((lane-1)*2.6,.75+(arc?Math.sin(i/(count-1)*Math.PI)*1.55:0),z-i*2.0);o.userData.lane=lane;o.userData.baseY=o.position.y;S.scene.add(o);S.objects.push(o)}
  }
}
function clearObjects(){for(const o of S.objects)releaseObject(o);S.objects=[]}

function resetGame(){clearObjects();S.running=true;S.paused=false;const pb=S.overlay?.querySelector('[data-rkl-pause]');if(pb)pb.textContent='Ⅱ';S.gameOver=false;S.lane=1;S.targetX=0;S.y=0;S.vy=0;S.slide=0;S.speed=12;S.effectiveSpeed=12;S.distance=0;S.score=0;S.runCoins=0;S.spawnTimer=.9;S.elapsed=0;S.activeBoosts={magnet:0,jetpack:0,sneakers:0,multiplier:0};S.hoverboard=0;S.hoverCooldown=0;S.onTrain=null;S.pauseCountdown=false;S.hudClock=0;S.saveClock=0;S.perfTime=0;S.perfFrames=0;S.worldIndex=0;S.worldTheme=WORLD_THEMES[0];S.runStartedAt=Date.now();clearJetpackRig();if(S.boardMesh){S.player?.remove(S.boardMesh);S.boardMesh=null}applyWorldTheme(0,false);hideCard();updateHud();if(S.action){S.action.paused=false;S.action.reset().play()}beginRemoteRun()}
function input(kind){if(!S.running||S.paused||S.gameOver)return;if(kind==='left')S.lane=Math.max(0,S.lane-1);if(kind==='right')S.lane=Math.min(2,S.lane+1);S.targetX=(S.lane-1)*2.6;if(kind==='up'&&(S.y<=.01||S.onTrain)){S.vy=S.activeBoosts.sneakers>0?10.8:8.7;S.onTrain=null}if(kind==='down'&&S.y<.2){S.slide=.72}}
function update(dt){
  if(!S.running||S.paused||S.gameOver)return;S.elapsed+=dt;S.hudClock+=dt;S.saveClock+=dt;
  const mult=S.activeBoosts.multiplier>0?2:1;baseSpeedUpdate: {const targetBase=Math.min(24,12+S.distance/1100);S.speed=THREE.MathUtils.damp(S.speed,targetBase,.55,dt)}
  const boostFactor=S.activeBoosts.jetpack>0?2.08:(S.activeBoosts.sneakers>0?1.27:1)*(S.hoverboard>0?1.14:1);S.effectiveSpeed=S.speed*boostFactor;S.distance+=S.effectiveSpeed*dt*.52;S.score+=S.effectiveSpeed*dt*mult;updateWorldZone();
  for(const k of Object.keys(S.activeBoosts))S.activeBoosts[k]=Math.max(0,S.activeBoosts[k]-dt);S.hoverboard=Math.max(0,S.hoverboard-dt);S.hoverCooldown=Math.max(0,S.hoverCooldown-dt);if(S.hoverboard<=0&&S.boardMesh){S.player?.remove(S.boardMesh);S.boardMesh=null}
  S.spawnTimer-=dt;if(S.spawnTimer<=0){spawnRow();const profile=difficultyProfile();S.spawnTimer=Math.max(.34,profile.interval*(12/Math.max(12,S.effectiveSpeed)))}
  const move=S.effectiveSpeed*dt;for(const seg of S.segments){seg.position.z+=move;if(seg.position.z>25)seg.position.z-=S.segments.length*25}
  for(let i=S.objects.length-1;i>=0;i--){const o=S.objects[i];o.position.z+=move;
    if(o.userData.type==='coin'){o.rotation.y+=dt*(5.0+boostFactor);if(!o.userData.baseY)o.userData.baseY=.76;o.position.y=o.userData.baseY+Math.sin(S.elapsed*6+o.position.z)*.08}
    if(o.userData.type==='boost'){o.rotation.y+=dt*2.3;o.position.y=1.03+Math.sin(S.elapsed*4+o.position.z)*.12}
    if(o.position.z>10){releaseObject(o);S.objects.splice(i,1);continue}
    const laneMatch=o.userData.lane===S.lane,magnetPickup=o.userData.type==='coin'&&S.activeBoosts.magnet>0&&Math.abs(o.position.z-1.1)<5.8;
    if((Math.abs(o.position.z-1.1)<.78&&laneMatch)||magnetPickup){
      if(o.userData.type==='coin'){S.runCoins++;S.wallet++;S.score+=10*mult;queueSave();releaseObject(o);S.objects.splice(i,1);flashCoin();continue}
      if(o.userData.type==='boost'){const duration={magnet:10,jetpack:8,sneakers:11,multiplier:10}[o.userData.boost]||0;activateBoost(o.userData.boost,duration);releaseObject(o);S.objects.splice(i,1);continue}
      const jetSafe=S.activeBoosts.jetpack>0,tramTop=o.userData.type==='tram'&&S.vy<=0&&S.y>2.35,jumpSafe=o.userData.type!=='tram'&&S.y>(S.activeBoosts.sneakers>0?.62:1.0),slideSafe=o.userData.type==='barrier'&&S.slide>0;
      if(tramTop){S.onTrain=o;S.y=o.userData.roofY||3.24;S.vy=0;continue}
      if(!jetSafe&&!jumpSafe&&!slideSafe){createImpactFX(S.player?.position.x||0,1.15,1.0);if(S.player){S.player.rotation.x=-.3;S.player.rotation.z+=(Math.random()-.5)*.32}if(consumeHoverboard()){releaseObject(o);S.objects.splice(i,1);continue}setTimeout(endGame,220);return}
    }
  }
  if(S.activeBoosts.jetpack>0){S.onTrain=null;S.y=THREE.MathUtils.damp(S.y,3.75,7,dt);S.vy=0}else if(S.onTrain){const t=S.onTrain;if(!S.objects.includes(t)||Math.abs(t.position.z-1.1)>(t.userData.halfLength||3.6)+.65){S.onTrain=null;S.vy=-.8}else{S.y=t.userData.roofY||3.24;S.vy=0}}else if(S.y>0||S.vy!==0){S.y+=S.vy*dt;S.vy-=(S.activeBoosts.sneakers>0?13.4:19.5)*dt;if(S.y<=0){S.y=0;S.vy=0}}
  S.slide=Math.max(0,S.slide-dt);
  if(S.player){const grounded=S.y<=.01&&!S.onTrain&&S.activeBoosts.jetpack<=0,runFreq=8.6+S.effectiveSpeed*.22,runBob=grounded?Math.abs(Math.sin(S.elapsed*runFreq))*.022:0;S.player.position.x=THREE.MathUtils.damp(S.player.position.x,S.targetX,13,dt);S.player.position.y=S.y+runBob;if(S.contactShadow){S.contactShadow.position.x=S.player.position.x;S.contactShadow.material.opacity=THREE.MathUtils.clamp(.55-S.y*.15,.045,.55);const scale=1+S.y*.075;S.contactShadow.scale.set(scale,scale,scale)}if(S.activeBoosts.jetpack<=0)S.player.rotation.x=THREE.MathUtils.damp(S.player.rotation.x,grounded?-.035:0,8,dt);S.player.rotation.z=THREE.MathUtils.damp(S.player.rotation.z,(S.targetX-S.player.position.x)*-.055,9,dt);S.player.scale.y=THREE.MathUtils.damp(S.player.scale.y,S.slide>0?.58:1,13,dt);S.player.scale.x=THREE.MathUtils.damp(S.player.scale.x,S.slide>0?1.1:1,13,dt)}
  if(S.mixer){S.action.timeScale=S.activeBoosts.jetpack>0?.18:THREE.MathUtils.clamp(.88+S.effectiveSpeed/34,.95,1.62);S.mixer.update(dt);if(S.characterBones?.spine)S.characterBones.spine.rotation.x+=S.activeBoosts.jetpack>0?-.12:-.025}updateJetpackRig(dt);updatePremiumCharacter(dt);updateImpactFX(dt);
  const px=S.player?.position.x||0;S.camera.position.x=THREE.MathUtils.damp(S.camera.position.x,px,9.5,dt);S.camera.position.y=THREE.MathUtils.damp(S.camera.position.y,3.52+S.y*.22,6.2,dt);S.camera.position.z=THREE.MathUtils.damp(S.camera.position.z,S.activeBoosts.jetpack>0?7.8:7.05,4.5,dt);const targetFov=S.activeBoosts.jetpack>0?64:S.activeBoosts.sneakers>0?59:S.hoverboard>0?57:55;if(Math.abs(S.camera.fov-targetFov)>.015){S.camera.fov=THREE.MathUtils.damp(S.camera.fov,targetFov,4.5,dt);S.camera.updateProjectionMatrix()}S.camera.lookAt(px,1.25+S.y*.18,-15.5);const dust=S.scene.getObjectByName('rklDust');if(dust)dust.position.z=(dust.position.z+move*.1)%18;
  updateWeather(dt);if(S.hudClock>=.1){S.hudClock=0;updateHud()}if(S.saveDirty&&S.saveClock>=1.2){S.saveClock=0;S.saveDirty=false;save()}
}
function endGame(){S.running=false;S.gameOver=true;S.best=Math.max(S.best,Math.floor(S.distance));save();submitRemoteRun();if(S.action)S.action.paused=true;showCard(`<div class="rkl-kicker">RUNDE BEENDET</div><h1>${Math.floor(S.distance)} m</h1><div class="rkl-result"><span>Gesammelt<b>🪙 ${S.runCoins}</b></span><span>Punkte<b>${Math.floor(S.score)}</b></span><span>Bestwert<b>${S.best} m</b></span><span>Boards<b>🛹 ${S.boardTokens}</b></span></div><button data-rkl-retry>Noch einmal</button><button class="rkl-secondary" data-rkl-shop>Coin-Shop</button><button class="rkl-secondary" data-rkl-world>World Rekorde</button><button class="rkl-secondary" data-rkl-exit>Top Games</button>`);bindCard()}
function render(){S.renderer.render(S.scene,S.camera)}
function loop(){const dt=Math.min(.04,S.clock.getDelta());update(dt);render();S.perfTime+=dt;S.perfFrames++;if(S.perfTime>=2.2){const fps=S.perfFrames/S.perfTime;if((S.quality==='ultra'||S.quality==='high')&&fps<42&&S.renderScale>.78){S.renderScale=Math.max(.78,S.renderScale-.1);resize()}else if(fps>57&&S.renderScale<1){S.renderScale=Math.min(1,S.renderScale+.05);resize()}S.perfTime=0;S.perfFrames=0}S.raf=requestAnimationFrame(loop)}

function showCard(html){const c=S.overlay?.querySelector('[data-rkl-card]');if(!c)return;c.innerHTML=html;c.hidden=false}
function hideCard(){const c=S.overlay?.querySelector('[data-rkl-card]');if(c)c.hidden=true}
function showLoading(text){const l=S.overlay?.querySelector('[data-rkl-loading]');if(l){const sp=l.querySelector('span');if(sp)sp.textContent=text;l.classList.add('is-compact');l.hidden=false}}
function hideLoading(){const l=S.overlay?.querySelector('[data-rkl-loading]');if(l){l.hidden=true;l.classList.remove('is-compact')}}
function updateHud(){if(!S.overlay)return;const snapshot=`${Math.floor(S.distance)}|${S.runCoins}|${S.wallet}|${Math.floor(S.score)}|${S.best}|${S.activeBoosts.multiplier>0?2:1}|${S.worldIndex}`;if(snapshot!==S.lastHudSnapshot){S.lastHudSnapshot=snapshot;setText(S.overlay.querySelector('[data-rkl-distance]'),`${Math.floor(S.distance)} m`);setText(S.overlay.querySelector('[data-rkl-coins]'),S.runCoins);setText(S.overlay.querySelector('[data-rkl-wallet]'),S.wallet);setText(S.overlay.querySelector('[data-rkl-score]'),Math.floor(S.score).toLocaleString('de-DE'));setText(S.overlay.querySelector('[data-rkl-best]'),S.best.toLocaleString('de-DE'));setText(S.overlay.querySelector('[data-rkl-mult]'),S.activeBoosts.multiplier>0?2:1);setText(S.overlay.querySelector('[data-rkl-world-name]'),currentWorldTheme().short);const pr=S.overlay.querySelector('[data-rkl-progress]');if(pr)pr.style.width=Math.min(100,S.runCoins/5)+'%'}updateBoostHud()}
function flashCoin(){const p=S.overlay?.querySelector('[data-rkl-wallet-pill]');if(!p)return;p.classList.remove('is-pulse');void p.offsetWidth;p.classList.add('is-pulse')}
function outfitPreview(id){const o=OUTFITS[id];return `<div class="rkl-model-preview ${o.model}" style="--tint:#${o.tint.toString(16).padStart(6,'0')}"><i></i><b></b><em></em></div>`}
function showStart(){
  const onlineTop=Number(S.worldData?.global?.[0]?.distance||0),onlineName=S.worldData?.global?.[0]?.displayName||'Noch offen';
  showCard(`<div class="rkl-kicker">SPREMBERGER STRASSE · COTTBUS</div><h1>Runner.KL</h1><p class="rkl-lead">Sammle Power-ups, wechsle alle 5.000 Meter den Stadtbereich und jage den weltweiten Rekord.</p><div class="rkl-world-summary"><span><small>WORLD REKORD</small><b>${onlineTop?onlineTop.toLocaleString('de-DE')+' m':'Noch kein Rekord'}</b><em>${escapeHtml(onlineName)}</em></span><span><small>MONATSBONUS</small><b>100.000 €</b><em>Platz 1 · 7 Tage abholbar</em></span></div><div class="rkl-boost-overview"><article><i>🧲</i><b>CB-Magnet</b><small>Zieht Münzen aus allen Spuren an.</small></article><article><i>🚀</i><b>Raketenrucksack</b><small>Schnellster Boost und sicher über Hindernisse.</small></article><article><i>👟</i><b>Power-Schuhe</b><small>Höhere Sprünge und mehr Lauftempo.</small></article><article><i>2×</i><b>Punkte-Turbo</b><small>Verdoppelt deine Punkte.</small></article><article><i>🌀</i><b>Sprungfeder</b><small>Katapultiert dich auf hohe Hindernisse.</small></article><article><i>🛹</i><b>Neonboard</b><small>Schneller und gegen einen Zusammenstoß geschützt.</small></article></div><div class="rkl-selected">${outfitPreview(S.outfit)}<span>Aktiver Läufer<b>${OUTFITS[S.outfit].name}</b><small>${OUTFITS[S.outfit].style} · Neonboards: ${S.boardTokens}</small></span></div><div class="rkl-quality"><span><b>Grafikmodus</b><small>Ultra aktiviert Schatten, Wetter, höhere Auflösung und maximale Sichtweite.</small></span><div>${['low','medium','high','ultra'].map(q=>`<button data-rkl-quality="${q}" class="${S.quality===q?'active':''}">${({low:'Niedrig',medium:'Mittel',high:'Hoch',ultra:'Ultra'})[q]}</button>`).join('')}</div></div><button data-rkl-start>Spiel starten</button><button class="rkl-shop-btn" data-rkl-shop>Coin-Shop</button><button class="rkl-secondary" data-rkl-world>World Rekorde & Bonus</button><button class="rkl-secondary" data-rkl-exit>Zurück zu Top Games</button>`);bindCard();if(!S.worldDataLoaded)loadWorldData().then(data=>{if(data&&S.overlay?.querySelector('[data-rkl-start]'))showStart()})
}
function openShop(){
  S.paused=true;const cards=Object.entries(OUTFITS).map(([id,o])=>{const owned=S.owned.includes(id),active=S.outfit===id;return `<button class="rkl-shop-item ${active?'active':''}" data-rkl-outfit="${id}">${outfitPreview(id)}<span><strong>${o.name}</strong><small>${active?'Ausgewählt':owned?`${o.style} · Im Besitz`:`${o.style} · 🪙 ${o.price}`}</small></span></button>`}).join('');
  const boards=BOARD_PACKS.map(pack=>`<button class="rkl-board-pack" data-rkl-board-pack="${pack.id}"><span>🛹</span><b>${pack.name}</b><small>🪙 ${pack.price}</small></button>`).join('');
  showCard(`<div class="rkl-shop-head"><div><div class="rkl-kicker">RUNNER.KL</div><h1>Coin-Shop</h1></div><div class="rkl-wallet">🪙 ${S.wallet}</div></div><p class="rkl-shop-note">Die gekauften Läufer verwenden dasselbe Mann-/Frau-Grundmodell, besitzen jetzt aber klar unterschiedliche Kleidung, Farben und Accessoires.</p><div class="rkl-shop-grid">${cards}</div><h2 class="rkl-shop-subtitle">Neonboards</h2><div class="rkl-board-shop">${boards}</div><p class="rkl-board-stock">Dein Bestand: <b>${S.boardTokens}</b> Neonboards</p><button class="rkl-secondary" data-rkl-back>Zurück</button>`);
  S.overlay.querySelectorAll('[data-rkl-outfit]').forEach(b=>b.onclick=()=>buyOutfit(b.dataset.rklOutfit));S.overlay.querySelectorAll('[data-rkl-board-pack]').forEach(b=>b.onclick=()=>buyBoardPack(b.dataset.rklBoardPack));S.overlay.querySelector('[data-rkl-back]').onclick=()=>{S.paused=false;showStart()}
}
async function buyOutfit(id){const o=OUTFITS[id];if(!o)return;if(S.owned.includes(id)){S.outfit=id;save();await createPlayer();openShop();return}if(S.wallet<o.price){const n=S.overlay.querySelector('.rkl-shop-note');if(n)n.textContent=`Dir fehlen noch ${o.price-S.wallet} CB-Coins.`;return}S.wallet-=o.price;S.owned.push(id);S.outfit=id;save();updateHud();await createPlayer();openShop()}
function buyBoardPack(id){const pack=BOARD_PACKS.find(v=>v.id===id);if(!pack)return;if(S.wallet<pack.price){const n=S.overlay.querySelector('.rkl-shop-note');if(n)n.textContent=`Dir fehlen noch ${pack.price-S.wallet} CB-Coins für ${pack.name}.`;return}S.wallet-=pack.price;S.boardTokens+=pack.amount;save();updateHud();showBoostToast('Neonboards gekauft',`${pack.amount} Board${pack.amount===1?'':'s'} wurden deinem Bestand hinzugefügt.`);openShop()}
function bindCard(){S.overlay.querySelectorAll('[data-rkl-quality]').forEach(b=>b.addEventListener('click',()=>setQuality(b.dataset.rklQuality)));S.overlay.querySelector('[data-rkl-start]')?.addEventListener('click',resetGame);S.overlay.querySelector('[data-rkl-retry]')?.addEventListener('click',resetGame);S.overlay.querySelector('[data-rkl-shop]')?.addEventListener('click',openShop);S.overlay.querySelector('[data-rkl-world]')?.addEventListener('click',()=>{loadWorldData(true).then(openLeaderboard)});S.overlay.querySelector('[data-rkl-exit]')?.addEventListener('click',returnToTopGames)}

function qualityLabel(q){return ({low:'Niedrig',medium:'Mittel',high:'Hoch',ultra:'Ultra'})[q]||'Hoch'}
function setQuality(q){
  if(!['low','medium','high','ultra'].includes(q)||S.quality===q)return;
  S.quality=q;save();
  showLoading(`Grafik ${qualityLabel(q)} wird vorbereitet …`);
  setTimeout(()=>{close();open()},120);
}
function applyQuality(){
  if(!S.renderer)return;S.renderer.shadowMap.enabled=S.quality!=='low';S.scene.fog.density={low:.0015,medium:.00095,high:.00062,ultra:.00048}[S.quality];S.renderer.toneMappingExposure={low:.92,medium:.88,high:.84,ultra:.82}[S.quality];S.camera.far=S.quality==='ultra'?250:S.quality==='high'?225:190;S.camera.updateProjectionMatrix();S.renderScale=1;resize();S.overlay?.setAttribute('data-quality',S.quality);
}
function makeCloudTexture(){return makeCanvasTexture((c,s)=>{c.clearRect(0,0,s,s);const g=c.createRadialGradient(s*.5,s*.5,8,s*.5,s*.5,s*.48);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.55,'rgba(240,246,249,.72)');g.addColorStop(1,'rgba(225,235,240,0)');c.fillStyle=g;c.fillRect(0,0,s,s)},256,1,1)}
function createWeatherSystem(){
  S.clouds=new THREE.Group();S.clouds.name='rklClouds';S.scene.add(S.clouds);const tex=cachedTexture('cloud-v100',makeCloudTexture),count=S.quality==='ultra'?10:S.quality==='high'?7:S.quality==='medium'?4:2;S.cloudMaterial=new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0,depthWrite:false,color:0xffffff});for(let i=0;i<count;i++){const sp=new THREE.Sprite(S.cloudMaterial);sp.position.set((Math.random()-.5)*64,16+Math.random()*10,-28-Math.random()*130);const size=12+Math.random()*19;sp.scale.set(size,size*.36,1);sp.userData.speed=.10+Math.random()*.16;S.clouds.add(sp)}
  if(S.quality==='ultra'||S.quality==='high'){const n=S.quality==='ultra'?460:240,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*20;pos[i*3+1]=Math.random()*16;pos[i*3+2]=-Math.random()*70+8}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const mat=new THREE.PointsMaterial({color:0xcfe6f3,size:S.quality==='ultra'?.045:.038,transparent:true,opacity:0,depthWrite:false});S.rain=new THREE.Points(geo,mat);S.rain.name='rklRain';S.scene.add(S.rain)}S.weatherMode='sunny';S.weatherClock=0;S.weatherDuration=18+Math.random()*14;S.weatherBlend=0;S.weatherTick=0;
}
function nextWeather(){
  const order={sunny:['cloudy','sunny'],cloudy:['rain','sunny','mist'],rain:['cloudy','sunny'],mist:['sunny','cloudy']};const a=order[S.weatherMode]||['sunny'];S.weatherMode=a[Math.floor(Math.random()*a.length)];S.weatherClock=0;S.weatherDuration=16+Math.random()*18;const el=S.overlay?.querySelector('[data-rkl-weather]');if(el)el.dataset.mode=S.weatherMode;
}
function updateWeather(dt){
  if(!S.scene)return;S.weatherClock+=dt;if(S.weatherClock>S.weatherDuration)nextWeather();const mode=S.weatherMode,t=S.worldTheme||WORLD_THEMES[0],targetRain=mode==='rain'?1:0,targetCloud=mode==='cloudy'?.7:mode==='rain'?.9:mode==='mist'?.5:.12,targetFog=mode==='mist'?1:mode==='rain'?.40:mode==='cloudy'?.18:0;S.weatherBlend=THREE.MathUtils.damp(S.weatherBlend,targetFog,.55,dt);const base={low:.0013,medium:.00082,high:.00052,ultra:.00038}[S.quality];S.scene.fog.density=base+S.weatherBlend*(S.quality==='ultra'?.00072:.00105);
  const bg=new THREE.Color(t.sky);if(mode==='rain')bg.lerp(new THREE.Color(0x526875),.48);else if(mode==='cloudy')bg.lerp(new THREE.Color(0x71858f),.32);else if(mode==='mist')bg.lerp(new THREE.Color(0xa6b2b3),.38);S.scene.background.lerp(bg,Math.min(1,dt*.42));S.renderer.setClearColor(S.scene.background,1);
  if(S.sun)S.sun.intensity=THREE.MathUtils.damp(S.sun.intensity,t.sunPower*(mode==='sunny'?1:mode==='rain'?.48:.72),.62,dt);if(S.hemi)S.hemi.intensity=THREE.MathUtils.damp(S.hemi.intensity,mode==='rain'?.52:S.quality==='ultra'?.82:.76,.6,dt);if(S.cloudMaterial)S.cloudMaterial.opacity=THREE.MathUtils.damp(S.cloudMaterial.opacity,targetCloud,.45,dt);if(S.clouds)for(const c of S.clouds.children){c.position.x+=c.userData.speed*dt;if(c.position.x>38)c.position.x=-38}S.weatherTick+=dt;
  if(S.rain){S.rain.material.opacity=THREE.MathUtils.damp(S.rain.material.opacity,targetRain*.58,1.2,dt);if(S.weatherTick>=.033){const step=S.weatherTick;S.weatherTick=0;const a=S.rain.geometry.attributes.position.array;for(let i=0;i<a.length;i+=3){a[i+1]-=25*step;if(a[i+1]<0){a[i+1]=16;a[i]=(Math.random()-.5)*20;a[i+2]=-Math.random()*70+8}}S.rain.geometry.attributes.position.needsUpdate=true}S.rain.position.x=S.camera.position.x}const w=S.overlay?.querySelector('[data-rkl-weather]');if(w)w.dataset.mode=mode
}
function resumeWithCountdown(){
  if(S.pauseCountdown)return;S.pauseCountdown=true;hideCard();const host=S.overlay?.querySelector('[data-rkl-countdown]');if(!host)return togglePauseImmediate();host.hidden=false;let n=3;host.textContent=n;
  const tick=()=>{n--;if(n>0){host.textContent=n;setTimeout(tick,650)}else{host.textContent='LOS!';setTimeout(()=>{host.hidden=true;host.textContent='';S.paused=false;S.pauseCountdown=false;if(S.action)S.action.paused=false;const b=S.overlay?.querySelector('[data-rkl-pause]');if(b)b.textContent='Ⅱ'},420)}};setTimeout(tick,650)
}
function togglePauseImmediate(){S.paused=false;S.pauseCountdown=false;if(S.action)S.action.paused=false;hideCard()}
function togglePause(){
  if(!S.running||S.gameOver||S.pauseCountdown)return;
  if(S.paused){resumeWithCountdown();return}
  S.paused=true;const b=S.overlay?.querySelector('[data-rkl-pause]');if(b)b.textContent='▶';if(S.action)S.action.paused=true;
  showCard(`<div class="rkl-kicker">RUNNER.KL</div><h1>Pause</h1><p class="rkl-lead">Der Lauf ist angehalten.</p><button data-rkl-resume>Weiter</button><button class="rkl-secondary" data-rkl-restart>Neu starten</button><button class="rkl-secondary" data-rkl-exit>Top Games</button>`);
  S.overlay.querySelector('[data-rkl-resume]').onclick=resumeWithCountdown;S.overlay.querySelector('[data-rkl-restart]').onclick=resetGame;S.overlay.querySelector('[data-rkl-exit]').onclick=returnToTopGames
}
async function runInitialLoading(){
  const l=S.overlay?.querySelector('[data-rkl-loading]'),bar=l?.querySelector('[data-rkl-loadbar]'),pc=l?.querySelector('[data-rkl-loadpercent]');if(!l){showStart();return}l.hidden=false;let v=0;const start=performance.now();
  await new Promise(resolve=>{const tick=()=>{const elapsed=performance.now()-start;v=Math.min(94,v+1.2+Math.random()*4);if(bar)bar.style.width=v+'%';if(pc)pc.textContent=Math.floor(v)+'%';if(elapsed<1250)requestAnimationFrame(tick);else resolve()};tick()});
  if(bar)bar.style.width='100%';if(pc)pc.textContent='100%';await new Promise(r=>setTimeout(r,220));l.classList.add('is-done');setTimeout(()=>{l.hidden=true;l.classList.remove('is-done');showStart()},320)
}

function open(sourceDevice=''){
  if(sourceDevice)S.sourceDevice=String(sourceDevice);
  else if(typeof window.JKGamesOwnedPhoneItem==='function')S.sourceDevice=window.JKGamesOwnedPhoneItem()||S.sourceDevice||'';
  if(S.overlay)return;loadSave();S.lastBoostSignature='';S.lastHudSnapshot='';S.renderScale=1;const el=document.createElement('div');el.className='runner-kl-overlay';el.innerHTML=`<div class="runner-kl-stage"><canvas aria-label="Runner.KL 3D-Spiel"></canvas><div class="runner-kl-weather" data-rkl-weather><div class="rkl-clouds"></div><div class="rkl-rain"></div></div><div class="runner-kl-vignette"></div><div class="runner-kl-sunflare"></div><div class="runner-kl-hud"><div class="rkl-top-left"><button data-rkl-pause>Ⅱ</button><div class="rkl-score-box"><b>×<span data-rkl-mult>1</span></b><strong data-rkl-score>0</strong></div></div><div class="rkl-world-chip"><small>BEREICH</small><b data-rkl-world-name>ZENTRUM</b></div><div class="rkl-top-right"><div class="rkl-currency">🪙 <b data-rkl-wallet>0</b></div><div class="rkl-cards">🎫 <b data-rkl-distance>0 m</b></div><div class="rkl-toprun"><small>TOP RUN</small><span class="rkl-avatar"></span><b data-rkl-best>0</b></div></div><div class="runner-kl-mission"><b>SAMMLE 500 MÜNZEN</b><div><i data-rkl-progress></i></div><small><span data-rkl-coins>0</span> / 500</small></div><div class="runner-kl-boostbar" data-rkl-boosts></div><div class="runner-kl-toast" data-rkl-toast></div><div class="runner-kl-actions"><button data-rkl-close>✕</button><button class="runner-kl-board" data-rkl-board><span>🛹</span><b>3</b></button><div class="runner-kl-controls"><button data-dir="up">↑</button><button data-dir="left">←</button><button data-dir="down">↓</button><button data-dir="right">→</button></div></div><div class="rkl-countdown" data-rkl-countdown hidden></div><div class="rkl-world-announce" data-rkl-world-announce></div></div><div class="runner-kl-loading" data-rkl-loading><div class="rkl-loading-logo"><small>JK.GAMES</small><b>Runner.KL</b></div><div class="rkl-loading-city"></div><span>Spremberger Straße wird geladen …</span><div class="rkl-loading-track"><i data-rkl-loadbar></i></div><em data-rkl-loadpercent>0%</em></div><div class="runner-kl-card" data-rkl-card></div></div>`;document.body.append(el);S.overlay=el;setupScene();
  el.querySelector('[data-rkl-close]').onclick=returnToTopGames;el.querySelector('[data-rkl-pause]').onclick=togglePause;el.querySelector('[data-rkl-board]').onclick=activateHoverboard;el.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>input(b.dataset.dir));
  const canvas=el.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{const now=performance.now();if(now-S.lastTap<330)activateHoverboard();S.lastTap=now;S.pointerStart={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerup',e=>{if(!S.pointerStart)return;const dx=e.clientX-S.pointerStart.x,dy=e.clientY-S.pointerStart.y;S.pointerStart=null;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>24)input(dx>0?'right':'left');else if(Math.abs(dy)>24)input(dy>0?'down':'up')});
  S.keyHandler=e=>{const m={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',' ':'up',ArrowDown:'down',s:'down'};if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();togglePause();return}if(e.key==='b'||e.key==='B'){e.preventDefault();activateHoverboard();return}if(m[e.key]){e.preventDefault();input(m[e.key])}};document.addEventListener('keydown',S.keyHandler);S.resizeHandler=resize;window.addEventListener('resize',resize,{passive:true});
  runInitialLoading();updateHud();S.clock.start();loop();
}
function close(){if(!S.overlay)return;if(S.saveDirty){S.saveDirty=false;save()}cancelAnimationFrame(S.raf);document.removeEventListener('keydown',S.keyHandler);window.removeEventListener('resize',S.resizeHandler);clearObjects();disposePlayer();S.cloudMaterial?.dispose?.();S.cloudMaterial=null;S.rain?.geometry?.dispose?.();S.rain?.material?.dispose?.();S.rain=null;S.segments=[];S.renderer?.dispose();disposeResources();S.overlay.remove();S.overlay=null;S.scene=null;S.renderer=null;S.running=false;S.paused=false}
function openHub(){
  if(typeof window.JKGamesOpenTopGames==='function')return window.JKGamesOpenTopGames(S.sourceDevice||'');
  const item=typeof window.JKGamesOwnedPhoneItem==='function'?window.JKGamesOwnedPhoneItem():'';
  if(item&&typeof window.openDeviceInterface==='function')return window.openDeviceInterface(item,'topgames',false);
  return false;
}
function returnToTopGames(){
  const source=S.sourceDevice||'';
  close();
  requestAnimationFrame(()=>{
    if(typeof window.JKGamesOpenTopGames==='function')window.JKGamesOpenTopGames(source);
    else openHub();
  });
}
window.RunnerKL={open,close,openHub,returnToTopGames};
