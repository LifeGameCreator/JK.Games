/* Escape.kl World 1 – Keyboard Lab V449.
   Speed-gated beginner route: wide keys, progressively longer jumps, 15 cash-out stages.
   No respawn checkpoints: fall = world start. */
export function buildKeyboardLabWorld(api){
  const {addPlatform,addSign,boxDeco,addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,addAutoTrigger=()=>{},returnHub}=api;
  const compact=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  const rewards=[10,20,35,60,100,175,300,500,800,1200,2000,3500,6000,10000,15000];
  const recommended=[15,20,30,40,55,70,85,105,130,155,185,215,245,275,300];
  const labels=['W','A','S','D','Q','E','R','F','SHIFT','CTRL','TAB','ALT','1','2','3','4','5','6','7','8','9','ENTER','SPACE','ESC'];

  // Giant desk / keyboard frame. The dark center stays open so missing a key is a real fail.
  boxDeco(0,-8.5,-300,94,1.2,520,0x171b22);
  boxDeco(-41,-2.8,-300,3,12,505,0x07111d);boxDeco(41,-2.8,-300,3,12,505,0x07111d);
  boxDeco(-14.8,.15,-300,.12,.5,500,0x42dff5,0x0c7185);boxDeco(14.8,.15,-300,.12,.5,500,0x42dff5,0x0c7185);
  for(let zz=-105,i=0;zz>-540;zz-=70,i++){
    boxDeco(-34,-1.0,zz,1.1,10,7,0x10283b,0x0a2438);boxDeco(34,-1.0,zz,1.1,10,7,0x10283b,0x0a2438);
    addGlowLight(i%2?-33:33,2.8,zz,i%2?0x4ddffc:0x7a8cff,.26,10);
  }

  addPlatform({x:0,y:.3,z:startZ,w:15,h:.6,d:11,color:0x224d67,label:'ESC',stage:1,kind:'start'});
  boxDeco(-6.8,2.5,startZ+4.4,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(6.8,2.5,startZ+4.4,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(0,5,startZ+4.4,14.2,.45,.65,0x1c8199,0x13546b);
  addRingDeco(0,2.8,startZ+4.2,2.4,.07,0x57e7ff,0);addGlowLight(0,3.2,startZ+2.4,0x55e7ff,1.0,12);
  addSign('WORLD 1 · KEYBOARD LAB',{x:0,y:5.75,z:startZ+4.72},0x58ddff,1.04);
  addSign('SPEED 5 → 300 · BREITE KEYS · LANGE SPEED-GAPS',{x:0,y:4.08,z:startZ+4.73},0xffd25f,.45);
  // V449: Derselbe Portal-Kreis am Weltanfang ist jetzt auch der Rückweg.
  // Der Trigger liegt auf der Hub-Seite hinter dem Ring, damit der Spawn bei z=-70
  // nicht sofort wieder zurück in den Hub geschickt wird.
  addSign('↩ ZURÜCK ZUM HUB',{x:0,y:2.05,z:startZ+6.65},0x9beaff,.38);
  addAutoTrigger('keyboard-lab-return-hub',0,startZ+6.4,8.4,2.8,returnHub);

  let z=startZ-8;
  const stageTitle=(n,title)=>{
    addSign(`STAGE ${n} · ${title}`,{x:0,y:3.35,z:z+2.0},0x67e5ff,.58);
    addSign(`EMPFOHLEN: SPEED ${recommended[n-1]}+`,{x:0,y:2.52,z:z+2.02},0xffd36a,.36);
  };
  const key=(gap,x,y,w=4.8,d=3.1,label='W',color=0x285a78,extra={})=>{z-=gap;return addPlatform({x,y,z,w,h:.48,d,color,label,kind:extra.blink?'glitch-key':'key',...extra});};
  const winPad=(stage,reward,y=.7)=>{
    z-=4.2;
    addPlatform({x:0,y:y-.16,z,w:12,h:.40,d:5.8,color:0x18344c,label:'',kind:'safe-zone',stage:Math.min(15,stage+1)});
    addPlatform({x:3.55,y:y+.15,z,w:3.6,h:.20,d:2.25,color:0xd9a62b,label:`WIN +${compact(reward)}`,kind:'win-pad',winReward:reward,winStage:stage});
    addSign(`CASH OUT · +${compact(reward)} WINS`,{x:3.55,y:y+2.05,z:z+.12},0xffd35b,.40);
  };

  stageTitle(1,'WASD START');for(let i=0;i<6;i++)key(3.25,(i%2?.25:-.25),.48,5.4,3.05,labels[i],0x285a78);winPad(1,rewards[0]);
  z-=2.2;stageTitle(2,'BREITE TASTEN');for(let i=0;i<6;i++)key(3.55,(i%3-1)*.65,.55,5.1,3.0,labels[4+i],0x315f87);winPad(2,rewards[1],.68);
  z-=2.2;stageTitle(3,'SANFTER ZICKZACK');for(let i=0;i<7;i++)key(3.85,i%2?1.5:-1.5,.62,4.7,3.0,labels[8+i],0x3a6493);winPad(3,rewards[2],.72);
  z-=2.2;stageTitle(4,'NUMMERNREIHE');for(let i=0;i<7;i++)key(4.1,(i%3-1)*1.15,.68,4.55,2.95,String(i+1),0x446ba0);winPad(4,rewards[3],.78);
  z-=2.2;stageTitle(5,'ERSTER SPEED-GAP');key(4.5,0,.72,8.8,2.9,'SPACE',0x566da2);key(5.0,-1.1,.76,7.0,2.9,'SHIFT',0x5d6fa8);key(5.2,1.1,.82,7.2,2.9,'ENTER',0x6377b0);winPad(5,rewards[4],.86);

  z-=2.4;stageTitle(6,'KEY TREPPE');for(let i=0;i<7;i++)key(4.7,(i-3)*.28,.75+i*.14,4.5,2.95,labels[12+i],0x595b9d);winPad(6,rewards[5],1.88);
  z-=2.4;stageTitle(7,'LEICHTE SLIDER');for(let i=0;i<6;i++)key(4.9,0,1.25,4.5,2.9,labels[i],0x665da6,{motion:{axis:'x',amp:1.2,speed:.38+i*.02,phase:i*.65}});winPad(7,rewards[6],1.38);
  z-=2.4;stageTitle(8,'DOPPELREIHE');for(let i=0;i<8;i++)key(5.1,i%2?1.85:-1.85,1.10+(i%4===3?.12:0),4.35,2.85,labels[6+i],0x6d5aa3);winPad(8,rewards[7],1.25);
  z-=2.4;stageTitle(9,'ENTER PATH');for(let i=0;i<7;i++)key(5.35,Math.sin(i*.8)*1.9,1.05+i*.08,4.25,2.8,i===3?'ENTER':labels[10+i],0x65518f);winPad(9,rewards[8],1.75);
  z-=2.4;stageTitle(10,'NUMPAD SPEED');for(let i=0;i<8;i++)key(5.7,((i%3)-1)*1.45,1.35+(Math.floor(i/3)%2)*.15,4.0,2.75,String((i+1)%10),0x4d679b);winPad(10,rewards[9],1.65);

  z-=2.5;stageTitle(11,'SHIFT RUN');for(let i=0;i<7;i++)key(6.0,i%2?2.1:-2.1,1.45,3.95,2.7,i%2?'SHIFT':'CTRL',0x5b578f);winPad(11,rewards[10],1.62);
  z-=2.5;stageTitle(12,'WEITSPRUNG');for(let i=0;i<7;i++)key(6.35,Math.sin(i*.72)*2.15,1.45+i*.14,3.9,2.65,labels[(i+8)%labels.length],0x60528c);winPad(12,rewards[11],2.65);
  z-=2.5;stageTitle(13,'MOVING SPACE');for(let i=0;i<6;i++)key(6.7,0,2.20,4.1,2.6,i%2?'SPACE':'ENTER',0x6a4f8e,{motion:{axis:'x',amp:1.7,speed:.45+i*.022,phase:i*.7}});winPad(13,rewards[12],2.42);
  z-=2.5;stageTitle(14,'ESC APPROACH');for(let i=0;i<6;i++)key(7.15,i%2?2.15:-2.15,2.20+i*.10,3.8,2.55,labels[i],0x4b658d);winPad(14,rewards[13],3.0);
  z-=2.5;stageTitle(15,'SPEED 300 FINALE');for(let i=0;i<6;i++)key(7.7,Math.sin(i*.9)*2.0,2.70+i*.12,3.8,2.5,i===5?'ESC':'W',0x2b7898);

  z-=5.1;
  addPlatform({x:0,y:3.55,z,w:13,h:.6,d:7,color:0x1f526c,label:'FINAL',kind:'safe-zone',stage:15});
  addPlatform({x:3.65,y:3.93,z,w:3.8,h:.20,d:2.6,color:0xe0ad2d,label:`WIN +${compact(rewards[14])}`,kind:'win-pad',winReward:rewards[14],winStage:15});
  addPlatform({x:0,y:3.92,z:z-2.55,w:4.4,h:.18,d:1.25,color:0x31a7bf,label:'FINISH',kind:'finish-strip',finish:true,stage:15});
  boxDeco(0,6.75,z-3.05,12,.38,.55,0xffca55,0x86580f);boxDeco(-5.6,5.2,z-3.05,.42,4.8,.55,0xffca55,0x86580f);boxDeco(5.6,5.2,z-3.05,.42,4.8,.55,0xffca55,0x86580f);
  addRingDeco(0,5.55,z-2.9,2.1,.07,0xffd45e,0);addRingDeco(0,5.55,z-2.82,1.5,.05,0x6ee9ff,0);addGlowLight(0,5.7,z-2.5,0xffd05c,1.35,13);
  addSign(`STAGE 15 · SPEED 300 ZIEL`,{x:0,y:6.55,z:z+3.6},0xffd35b,.60);addSign('WORLD 1 COMPLETE',{x:0,y:5.45,z:z+3.62},0x72eaff,.78);
  addInteractable('hub-return','Zum Hub zurück',0,4.4,z-2.0,5,returnHub);
}
