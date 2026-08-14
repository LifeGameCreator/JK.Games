/* Escape.kl World 1 – Keyboard Lab V438.
   Beginner-first route inspired by the keyboard-escape loop: wide keys, short gaps,
   15 linear stages and a yellow WIN pad after every stage. No respawn checkpoints. */
export function buildKeyboardLabWorld(api){
  const {addPlatform,addSign,boxDeco,addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,returnHub}=api;
  const compactReward=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  const rewards=[10,20,35,60,100,175,300,500,800,1200,2000,3500,6000,10000,15000];
  const labels=['W','A','S','D','Q','E','R','F','SHIFT','CTRL','TAB','ALT','1','2','3','4','5','6','7','8','9','ENTER','SPACE','ESC'];

  // Giant desk / keyboard base beneath the route. It remains decorative so a miss is still a failed run.
  boxDeco(0,-8.5,-255,88,1.2,405,0x211a18);
  boxDeco(-37,-2.6,-255,3,11,392,0x09121d);boxDeco(37,-2.6,-255,3,11,392,0x09121d);
  boxDeco(-13.5,.15,-255,.11,.45,390,0x42dff5,0x0c7185);boxDeco(13.5,.15,-255,.11,.45,390,0x42dff5,0x0c7185);
  for(let z=-100,i=0;z>-445;z-=72,i++){
    boxDeco(-31,-1.2,z,1.0,9,8,0x10283b,0x0a2438);boxDeco(31,-1.2,z,1.0,9,8,0x10283b,0x0a2438);
    addGlowLight(i%2?-30:30,2.6,z,i%2?0x4ddffc:0x8a6dff,.28,9);
  }

  addPlatform({x:0,y:.3,z:startZ,w:14,h:.6,d:11,color:0x224d67,label:'ESC',stage:1,kind:'start'});
  boxDeco(-6.4,2.5,startZ+4.2,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(6.4,2.5,startZ+4.2,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(0,5,startZ+4.2,13.4,.45,.65,0x1c8199,0x13546b);
  addRingDeco(0,2.8,startZ+4.0,2.3,.065,0x57e7ff,0);addGlowLight(0,3.2,startZ+2.4,0x55e7ff,1.0,12);
  addSign('WORLD 1 · KEYBOARD LAB',{x:0,y:5.7,z:startZ+4.55},0x58ddff,1.03);
  addSign('EINFACH · 15 STAGES · JEDE STAGE = WINS',{x:0,y:4.05,z:startZ+4.57},0xffd25f,.47);

  let z=startZ-10;
  const stageTitle=(n,title,rec='')=>{
    addSign(`STAGE ${n} · ${title}`,{x:0,y:3.25,z:z+2.1},0x67e5ff,.58);
    if(rec)addSign(`EMPFOHLEN: LEVEL ${rec}`,{x:0,y:2.45,z:z+2.12},0xb6c7d8,.35);
  };
  const key=(x,y,w=4.6,d=3.5,label='W',color=0x285a78,extra={})=>addPlatform({x,y,z,w,h:.48,d,color,label,kind:'key',...extra});
  const winPad=(stage,reward,y=.62,finish=false)=>{
    z-=4.0;
    addPlatform({x:0,y:y-.15,z,w:9.8,h:.40,d:5.8,color:0x18344c,label:'',kind:'safe-zone'});
    const p=addPlatform({x:0,y:y+.15,z,w:5.0,h:.20,d:2.45,color:0xd9a62b,label:`WIN +${compactReward(reward)}`,kind:'win-pad',winReward:reward,winStage:stage,stage:Math.min(15,stage+1),finish});
    addSign(`STAGE ${stage} GESCHAFFT · +${compactReward(reward)} WINS`,{x:0,y:y+2.1,z:z+.15},0xffd35b,.48);
    return p;
  };

  // Stages 1–5: intentionally very forgiving. Wide keys and tiny gaps teach the rhythm.
  stageTitle(1,'WASD START','1–10');
  for(let i=0;i<6;i++){z-=3.55;key((i%2?.35:-.35),.48,5.3,3.2,labels[i],i===5?0x2f718d:0x285a78);}winPad(1,rewards[0]);

  z-=2.5;stageTitle(2,'BREITE TASTEN','5–15');
  for(let i=0;i<6;i++){z-=3.75;key((i%3-1)*.7,.55,4.9,3.25,labels[4+i],0x315f87);}winPad(2,rewards[1],.68);

  z-=2.5;stageTitle(3,'SANFTER ZICKZACK','10–20');
  for(let i=0;i<7;i++){z-=3.85;key(i%2?1.55:-1.55,.62,4.4,3.2,labels[8+i],0x3a6493);}winPad(3,rewards[2],.72);

  z-=2.5;stageTitle(4,'NUMMERNREIHE','15–25');
  for(let i=0;i<7;i++){z-=3.9;key((i%3-1)*1.15,.68,4.1,3.15,String(i+1),0x446ba0);}winPad(4,rewards[3],.78);

  z-=2.5;stageTitle(5,'SPACEBAR','20–30');
  z-=4.0;key(0,.70,8.6,3.0,'SPACE',0x566da2);z-=4.45;key(-1.2,.76,7.4,3.0,'SHIFT',0x5d6fa8);z-=4.55;key(1.2,.82,7.8,3.0,'ENTER',0x6377b0);winPad(5,rewards[4],.85);

  // Stages 6–10: still beginner friendly, but introduce height and gentle movement.
  z-=2.5;stageTitle(6,'KEY TREPPE','25–40');
  for(let i=0;i<7;i++){z-=3.85;key((i-3)*.35,.75+i*.16,4.0,3.1,labels[12+i],0x595b9d);}winPad(6,rewards[5],1.92);

  z-=2.5;stageTitle(7,'LEICHTE SLIDER','35–50');
  for(let i=0;i<6;i++){z-=4.0;key(0,1.25,4.2,3.2,labels[i],0x665da6,{motion:{axis:'x',amp:1.25,speed:.42+i*.025,phase:i*.65}});}winPad(7,rewards[6],1.38);

  z-=2.5;stageTitle(8,'DOPPELREIHE','45–60');
  for(let i=0;i<8;i++){z-=3.75;key(i%2?1.7:-1.7,1.10+(i%4===3?.12:0),4.0,3.1,labels[6+i],0x6d5aa3);}winPad(8,rewards[7],1.25);

  z-=2.5;stageTitle(9,'ENTER PATH','55–70');
  for(let i=0;i<7;i++){z-=4.05;key(Math.sin(i*.8)*1.8,1.05+i*.08,3.8,3.0,i===3?'ENTER':labels[10+i],0x65518f);}winPad(9,rewards[8],1.75);

  z-=2.5;stageTitle(10,'NUMPAD','65–80');
  for(let i=0;i<8;i++){z-=3.9;key(((i%3)-1)*1.35,1.35+(Math.floor(i/3)%2)*.15,3.6,3.0,String((i+1)%10),0x4d679b);}winPad(10,rewards[9],1.65);

  // Stages 11–15: medium difficulty, never the brutal World-2/3 patterns.
  z-=2.5;stageTitle(11,'SHIFT RUN','75–90');
  for(let i=0;i<7;i++){z-=4.1;key(i%2?2.0:-2.0,1.45,3.6,3.0,i%2?'SHIFT':'CTRL',0x5b578f);}winPad(11,rewards[10],1.62);

  z-=2.5;stageTitle(12,'SANFTE HÖHE','85–100');
  for(let i=0;i<8;i++){z-=4.0;key(Math.sin(i*.72)*2.0,1.35+i*.18,3.5,3.0,labels[(i+8)%labels.length],0x60528c);}winPad(12,rewards[11],2.95);

  z-=2.5;stageTitle(13,'MOVING SPACE','95–110');
  for(let i=0;i<6;i++){z-=4.25;key(0,2.25,4.0,3.1,i%2?'SPACE':'ENTER',0x6a4f8e,{motion:{axis:'x',amp:1.8,speed:.48+i*.025,phase:i*.7}});}winPad(13,rewards[12],2.45);

  z-=2.5;stageTitle(14,'ESC APPROACH','105–120');
  for(let i=0;i<7;i++){z-=4.2;key(i%2?2.1:-2.1,2.20+i*.10,3.4,2.95,labels[i],0x4b658d);}winPad(14,rewards[13],3.10);

  z-=2.5;stageTitle(15,'FINAL ESCAPE','110+');
  for(let i=0;i<6;i++){z-=4.15;key(Math.sin(i*.9)*1.9,2.75+i*.12,3.6,3.0,i===5?'ESC':'W',0x2b7898);}
  z-=4.8;
  addPlatform({x:0,y:3.55,z,w:12,h:.6,d:7,color:0x1f526c,label:'FINAL',kind:'safe-zone'});
  addPlatform({x:0,y:3.93,z,w:6.2,h:.20,d:2.8,color:0xe0ad2d,label:`WIN +${compactReward(rewards[14])}`,kind:'win-pad',winReward:rewards[14],winStage:15,stage:15,finish:true});
  boxDeco(0,6.75,z-3.05,12,.38,.55,0xffca55,0x86580f);boxDeco(-5.6,5.2,z-3.05,.42,4.8,.55,0xffca55,0x86580f);boxDeco(5.6,5.2,z-3.05,.42,4.8,.55,0xffca55,0x86580f);
  addRingDeco(0,5.55,z-2.9,2.1,.07,0xffd45e,0);addRingDeco(0,5.55,z-2.82,1.5,.05,0x6ee9ff,0);addGlowLight(0,5.7,z-2.5,0xffd05c,1.35,13);
  addSign(`STAGE 15 GESCHAFFT · +${compactReward(rewards[14])} WINS`,{x:0,y:6.55,z:z+3.6},0xffd35b,.60);
  addSign('WORLD 1 COMPLETE',{x:0,y:5.45,z:z+3.62},0x72eaff,.78);
  addInteractable('hub-return','Zum Hub zurück',0,4.4,z-2.0,5,returnHub);
}
