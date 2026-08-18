/* Escape.kl World 4 – V488 OWNER PROTOTYPE.
   Nur eine neutrale Test-Stage. Kein finales Thema/Design: World 4 wird danach gemeinsam aufgebaut. */
export function buildWorld4Prototype(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,addAutoTrigger=()=>{},returnHub=()=>{}}=api;
  const startZ=-70;
  // Neutraler Testkorridor – absichtlich keine endgültige World-4-Themensprache.
  boxDeco(0,-8.5,-185,82,1.0,250,0x0b1020);boxDeco(-31,-2.5,-185,2.2,12,235,0x151d34);boxDeco(31,-2.5,-185,2.2,12,235,0x151d34);
  for(let z=-92,i=0;z>-286;z-=32,i++){addCylinderDeco(-26,-1.7,z,.75,1.15,3.3,i%2?0x5f69d8:0x6776ff,0x151d34,10);addCylinderDeco(26,-1.7,z,.75,1.15,3.3,i%2?0x5f69d8:0x6776ff,0x151d34,10);}
  addPlatform({x:0,y:.3,z:startZ,w:15,h:.6,d:11,color:0x343d78,label:'W4',stage:1,kind:'start'});
  addSign('WORLD 4 · OWNER PROTOTYPE',{x:0,y:5.45,z:startZ+4.5},0x95a0ff,.92);
  addSign('STAGE 1 · TEST ROUTE · DESIGN NOCH OFFEN',{x:0,y:4.15,z:startZ+4.52},0xffd36a,.38);
  addSign('↩ ZURÜCK ZUM HUB',{x:0,y:2.12,z:startZ+5.72},0xc9ceff,.32);
  addAutoTrigger('world4-start-return-hub',0,startZ+5.35,8.5,1.7,returnHub);
  let z=startZ-10;
  const pads=[
    [5.0,-2.4,.65,4.3,2.8,'01'],[5.7,2.5,.82,4.0,2.7,'02'],[6.2,-1.1,1.05,3.8,2.65,'03'],[6.7,3.0,1.35,3.6,2.55,'04'],
    [7.2,-3.0,1.72,3.5,2.5,'05'],[7.6,0,2.10,4.1,2.55,'06'],[8.0,2.6,2.45,3.5,2.45,'07'],[8.4,-2.4,2.80,3.5,2.45,'08']
  ];
  for(let i=0;i<pads.length;i++){
    const [gap,x,y,w,d,label]=pads[i];z-=gap;addPlatform({x,y,z,w,h:.46,d,color:i%2?0x46529a:0x384680,label,kind:'key',stage:1,motion:i===5?{axis:'x',amp:1.35,speed:.45,phase:.6}:null});
    if(i===3||i===7)addGlowLight(x,y+1.0,z,0x7f8cff,.45,8);
  }
  z-=7.0;addPlatform({x:0,y:2.85,z,w:14,h:.6,d:8,color:0x303966,label:'PROTOTYPE END',kind:'safe-zone',stage:1});
  addRingDeco(0,4.6,z-1.8,1.8,.07,0x9aa4ff,0);addSign('STAGE 1 · PROTOTYP ENDE',{x:0,y:5.45,z:z+3.2},0xaeb6ff,.62);addSign('WORLD 4 WIRD ALS NÄCHSTES GEMEINSAM AUSGEBAUT',{x:0,y:4.42,z:z+3.22},0xffd36a,.30);
  addInteractable('world4-prototype-hub','Prototype verlassen · Zum Hub',0,3.5,z-1.5,5.5,returnHub);
}
