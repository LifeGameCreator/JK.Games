import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const VERSION = "2026-08-19-phone-models-v511";
const sessions = new WeakMap();
const loader = new GLTFLoader();

function disposeSession(shell){
  const session=sessions.get(shell); if(!session)return;
  session.disposed=true; session.resize?.disconnect?.();
  try{session.renderer?.setAnimationLoop?.(null)}catch{}
  try{session.renderer?.dispose?.()}catch{}
  session.canvas?.remove?.();
  sessions.delete(shell);
}
function tintMaterial(material,skin){
  if(!material||!skin||skin.finish==="original"||!material.color)return material;
  const next=material.clone();
  const c=next.color, brightness=(c.r+c.g+c.b)/3, metal=Number(next.metalness||0);
  const likelyBody=metal>.12 && brightness>.055 && !(next.transparent&&Number(next.opacity)<.72);
  if(!likelyBody)return next;
  next.color.set(skin.color||"#888888");
  if(skin.finish==="matte"){next.metalness=Math.max(.25,metal);next.roughness=.72;}
  else if(skin.finish==="gloss"){next.metalness=Math.max(.6,metal);next.roughness=.13;}
  else if(skin.finish==="gold"){next.metalness=.92;next.roughness=.2;}
  else {next.metalness=Math.max(.55,metal);next.roughness=Math.min(.34,Number(next.roughness??.35));}
  return next;
}
function prepareModel(root,skin){
  root.traverse((node)=>{
    if(!node.isMesh)return;
    node.castShadow=true; node.receiveShadow=true;
    if(Array.isArray(node.material))node.material=node.material.map((m)=>tintMaterial(m,skin));
    else if(node.material)node.material=tintMaterial(node.material,skin);
  });
}
function fitModel(root,camera){
  const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()); const center=box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  const max=Math.max(size.x,size.y,size.z,1e-6); const scale=2.05/max; root.scale.setScalar(scale);
  const fitted=new THREE.Box3().setFromObject(root); const radius=fitted.getBoundingSphere(new THREE.Sphere()).radius;
  camera.position.set(0,0,Math.max(3.4,radius/Math.tan(THREE.MathUtils.degToRad(camera.fov*.47)))); camera.lookAt(0,0,0);
}
function setBackClass(session){
  const normalized=((session.currentY%(Math.PI*2))+Math.PI*2)%(Math.PI*2); const back=Math.abs(normalized-Math.PI)<Math.PI*.45;
  session.shell.classList.toggle("phone-back-visible-v511",back);
  session.shell.dataset.phoneSideV511=back?"back":"front";
}
function setTarget(session,target){session.targetY=target; session.animating=true;}
function toggleSide(shell){const s=sessions.get(shell);if(!s)return;const back=s.shell.dataset.phoneSideV511==="back";setTarget(s,back?0:Math.PI);}
function front(shell){const s=sessions.get(shell);if(s)setTarget(s,0);}
function back(shell){const s=sessions.get(shell);if(s)setTarget(s,Math.PI);}
function wireDrag(session){
  const rails=[...session.shell.querySelectorAll("[data-phone-model-drag-v511]")];
  for(const rail of rails){
    let pointer=null,startX=0,startY=0;
    rail.addEventListener("pointerdown",(e)=>{if(e.pointerType==="touch")return;pointer=e.pointerId;startX=e.clientX;startY=session.targetY=session.currentY;session.animating=false;rail.setPointerCapture?.(e.pointerId);e.preventDefault();});
    rail.addEventListener("pointermove",(e)=>{if(pointer!==e.pointerId)return;session.currentY=startY+(e.clientX-startX)*.012;session.targetY=session.currentY;setBackClass(session);e.preventDefault();});
    const done=(e)=>{if(pointer!==e.pointerId)return;pointer=null;try{rail.releasePointerCapture?.(e.pointerId)}catch{}const n=((session.currentY%(Math.PI*2))+Math.PI*2)%(Math.PI*2);setTarget(session,Math.abs(n-Math.PI)<Math.PI/2?Math.PI:0);};
    rail.addEventListener("pointerup",done);rail.addEventListener("pointercancel",done);
  }
}
async function mount(shell,{model,skin}={}){
  if(!shell?.isConnected||!model?.asset)return;
  disposeSession(shell);
  const frame=shell.querySelector(".device-frame"); if(!frame)return;
  const canvas=document.createElement("canvas"); canvas.className="phone-model-canvas-v511"; canvas.setAttribute("aria-hidden","true"); frame.prepend(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"}); renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(24,1,.01,100);
  scene.add(new THREE.HemisphereLight(0xffffff,0x17201d,2.3));
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(3.5,5,6);key.castShadow=true;scene.add(key);
  const rim=new THREE.DirectionalLight(0x8edfff,2.2);rim.position.set(-5,1,-5);scene.add(rim);
  const session={shell,frame,canvas,renderer,scene,camera,root:null,currentY:0,targetY:0,animating:false,disposed:false,resize:null};sessions.set(shell,session);
  const resize=()=>{if(session.disposed)return;const r=frame.getBoundingClientRect();const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  session.resize=new ResizeObserver(resize);session.resize.observe(frame);resize(); wireDrag(session);
  try{
    const gltf=await loader.loadAsync(model.asset);if(session.disposed||sessions.get(shell)!==session)return;
    session.root=gltf.scene;prepareModel(session.root,skin);scene.add(session.root);fitModel(session.root,camera);
  }catch(error){console.warn("JK.Games V511 phone GLB",model.asset,error);canvas.classList.add("phone-model-load-error-v511");}
  renderer.setAnimationLoop(()=>{
    if(session.disposed||!document.body.contains(shell)){disposeSession(shell);return;}
    if(session.animating){let d=session.targetY-session.currentY;if(Math.abs(d)<.004){session.currentY=session.targetY;session.animating=false;}else session.currentY+=d*.16;setBackClass(session);}
    if(session.root)session.root.rotation.y=session.currentY;
    renderer.render(scene,camera);
  });
}

const shortcutSessions = new WeakMap();
async function mountShortcutPreview(){
  const host=document.querySelector("[data-phone-shortcut-model-v511]");
  if(!host||!host.isConnected)return;
  const asset=String(host.dataset.modelAssetV511||"");
  if(!asset)return;
  const existing=shortcutSessions.get(host);
  if(existing?.asset===asset)return;
  try{existing?.renderer?.dispose?.();existing?.canvas?.remove?.();}catch{}
  const canvas=document.createElement("canvas");canvas.className="phone-shortcut-canvas-v511";host.replaceChildren(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(22,1,.01,100);
  scene.add(new THREE.HemisphereLight(0xffffff,0x13211e,2.4));
  const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(3,5,6);scene.add(key);
  const record={asset,renderer,canvas};shortcutSessions.set(host,record);
  const resize=()=>{if(!host.isConnected)return;const r=host.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  resize();
  try{
    const gltf=await loader.loadAsync(asset);if(!host.isConnected||shortcutSessions.get(host)!==record){renderer.dispose();return;}
    const root=gltf.scene;prepareModel(root,null);scene.add(root);fitModel(root,camera);root.rotation.y=-.34;root.rotation.x=.06;renderer.render(scene,camera);
  }catch(error){console.warn("JK.Games V511 phone shortcut GLB",asset,error);}
}
function scheduleShortcutPreview(){requestAnimationFrame(()=>mountShortcutPreview());}
const shortcutButton=document.querySelector("[data-phone-shortcut]");
if(shortcutButton)new MutationObserver(()=>scheduleShortcutPreview()).observe(shortcutButton,{subtree:true,childList:true,attributes:true,attributeFilter:["data-phone-tier"]});
window.addEventListener("load",scheduleShortcutPreview,{once:true});
scheduleShortcutPreview();

window.JKGamesPhone3DV511=Object.freeze({version:VERSION,mount,toggleSide,front,back,dispose:disposeSession});
