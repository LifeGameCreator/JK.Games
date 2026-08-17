/* Escape.kl World 3 – Toxic Keyboard V471. Full endgame redesign with air-control, vertical jumps, moving keys and a lethal chase wall. */
export function buildToxicKeyboardWorld(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,addAutoTrigger=()=>{},addChaseWall=()=>{},finishAndReturnHub=()=>{}}=api;
  const rewards=[5000000,8000000,12000000,20000000,35000000,60000000,100000000,175000000,300000000,500000000];
  const recommended=[30,60,90,120,150,180,210,240,270,300];
  const compact=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  boxDeco(0,-9.0,-470,92,1.2,880,0x061109);boxDeco(-38,-2.0,-470,2.7,12,865,0x14321a);boxDeco(38,-2.0,-470,2.7,12,865,0x14321a);
  for(let zz=-100,i=0;zz>-855;zz-=48,i++){addCylinderDeco(-31,-1.5,zz,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addCylinderDeco(31,-1.5,zz,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addGlowLight(i%2?-30:30,2.3,zz,0x64ff6d,.42,9);}
  addPlatform({x:0,y:.3,z:startZ,w:13,h:.6,d:10,color:0x245d2c,label:'TOXIC',stage:1,kind:'start'});addSign('WORLD 3 · TOXIC KEYBOARD',{x:0,y:5.25,z:startZ+4.4},0x7bff79,1.0);addSign('AIR CONTROL · CHASE WALL · SPEED 300 FINALE',{x:0,y:4.05,z:startZ+4.42},0xffd16b,.40);
  let z=startZ-9;
  const title=(n,t)=>{addSign(`STAGE ${n} · ${t}`,{x:0,y:3.5,z:z+2.0},0x7cff7a,.58);addSign(`EMPFOHLEN: SPEED ${recommended[n-1]}+`,{x:0,y:2.65,z:z+2.02},0xffd36a,.35);};
  const key=(gap,x,y,w,d,label,color=0x286d35,extra={})=>{z-=gap;return addPlatform({x,y,z,w,h:.46,d,color,label,kind:extra.blink?'glitch-key':'key',...extra});};
  const win=(stage,reward,y=.8)=>{z-=4.7;addPlatform({x:0,y:y-.16,z,w:10.3,h:.38,d:5.2,color:0x16361d,label:'',kind:'safe-zone',stage:Math.min(10,stage+1)});addPlatform({x:3.0,y:y+.15,z,w:3.35,h:.2,d:2.15,color:0xdfaa2d,label:`WIN +${compact(reward)}`,kind:'win-pad',winReward:reward,winStage:stage});addSign(`CASH OUT · +${compact(reward)} WINS`,{x:3.0,y:y+2.0,z:z+.1},0xffd35b,.40);};

  title(1,'ACID WARMUP');for(let i=0;i<7;i++)key(4.4+i*.08,i%2?2.1:-2.1,.65,3.45,2.75,i%2?'A':'D');win(1,rewards[0]);

  z-=2.8;title(2,'AIR CONTROL SHAFT');
  // Jump into the open shaft and steer laterally while airborne to catch the offset keys.
  key(5.5,0,1.0,5.4,2.7,'JUMP',0x337a3d);for(let i=0;i<7;i++)key(6.0+i*.18,[-2.8,2.6,-1.5,3.0,-2.7,1.6,0][i],1.0+(i%2)*.16,2.75,2.35,'AIR',0x2d7439);win(2,rewards[1],1.1);

  z-=2.8;title(3,'VERTICAL TOXIC CLIMB');
  for(let i=0;i<9;i++)key(4.8+(i%2)*.3,Math.sin(i*.9)*2.3,1.0+i*.92,3.1,2.5,i%2?'UP':'W',0x317c3e);win(3,rewards[2],8.45);

  z-=3.0;title(4,'MOVING ACID RAILS');
  for(let i=0;i<8;i++)key(7.1+i*.15,i%2?1.4:-1.4,8.1+(i%3)*.12,3.0,2.35,'MOVE',0x2d843e,{motion:{axis:'x',amp:3.2,speed:.78+i*.045,phase:i*.83}});win(4,rewards[3],8.35);

  z-=3.0;title(5,'GLITCH DROP');
  for(let i=0;i<8;i++)key(7.8+i*.16,(i%3-1)*2.45,8.0-i*.38,2.85,2.3,'GL',0x4b7e35,{blink:i!==0});win(5,rewards[4],5.4);

  z-=3.0;title(6,'TOXIC LONG JUMPS');
  for(let i=0;i<7;i++)key(9.3+i*.23,Math.sin(i*1.0)*2.8,5.0+i*.13,2.8,2.25,i%2?'SHIFT':'SPACE',0x2a6e34);win(6,rewards[5],5.65);

  z-=3.1;title(7,'CHASE WALL · LAUF!');
  const chaseTrigger=z-1.5,chaseStart=z+6.5;
  for(let i=0;i<9;i++)key(8.0+i*.12,i%2?2.5:-2.5,5.2+(i%3)*.12,3.05,2.35,i===8?'ESC':'RUN',0x347c40,{motion:i===3||i===6?{axis:'x',amp:1.7,speed:.8,phase:i}:null});
  const chaseEnd=z-5.0;addChaseWall({x:0,y:4.0,startZ:chaseStart,triggerZ:chaseTrigger,endZ:chaseEnd,w:25,h:8,d:1.3,speed:12.8,color:0x78ff50});win(7,rewards[6],5.45);

  z-=3.1;title(8,'HIGH RISE KEYS');
  for(let i=0;i<10;i++)key(7.2+(i%3)*.25,Math.cos(i*.8)*2.7,5.1+i*.88,2.75,2.25,i%2?'W':'SPACE',0x3d8248);win(8,rewards[7],14.0);

  z-=3.2;title(9,'CHAOS AIR KEYS');
  for(let i=0;i<9;i++)key(11.3+i*.18,Math.sin(i*1.25)*3.0,13.6+(i%2)*.16,2.65,2.15,'X',0x3a7f42,{motion:i%3===1?{axis:'x',amp:2.1,speed:.96,phase:i}:null,blink:i===3||i===6});win(9,rewards[8],13.85);

  z-=3.4;title(10,'SPEED 300 TOXIC FINALE');
  for(let i=0;i<6;i++)key(14.1+i*.22,i%2?3.0:-3.0,13.7+i*.10,2.7,2.2,i===5?'ESC':'FULL',0x2d7738,{motion:i===2||i===4?{axis:'x',amp:2.0,speed:.92+i*.04,phase:i}:null});
  z-=5.8;addPlatform({x:0,y:14.45,z,w:11,h:.6,d:6.5,color:0x245e2c,label:'FINISH',kind:'safe-zone',stage:10});addPlatform({x:0,y:14.82,z:z-2.45,w:4.0,h:.18,d:1.2,color:0x55dc5e,label:'FINISH',kind:'finish-strip',finish:true,stage:10,winReward:rewards[9],winStage:10});addRingDeco(0,16.4,z-2.5,1.9,.08,0x75ff72,0);addRingDeco(0,16.4,z-2.42,1.35,.05,0xffd45e,0);addGlowLight(0,16.5,z-2.2,0x69ff70,1.4,12);addSign('TOXIC KEYBOARD COMPLETE',{x:0,y:17.1,z:z+3.2},0x7cff79,.76);addSign(`DURCH DEN KREIS · +${compact(rewards[9])} WINS`,{x:0,y:16.0,z:z+3.22},0xffd35b,.50);addAutoTrigger('toxic-keyboard-finish-circle',0,z-2.5,5.6,2.5,finishAndReturnHub);addInteractable('toxic-hub-return','Finish + Wins · Zum Hub',0,15.2,z-1.8,5,finishAndReturnHub);
}
