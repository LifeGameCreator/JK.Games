/* Escape.kl World 3 – Toxic Keyboard V443. Endgame grind route · Level 800 ≈ Speed 120, Level 1000 ≈ Speed 300. */
export function buildToxicKeyboardWorld(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,returnHub}=api;
  const rewards=[5000000,8000000,12000000,20000000,35000000,60000000,100000000,175000000,300000000,500000000];
  const recommended=[25,40,60,85,115,145,180,220,260,300];
  const compact=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  boxDeco(0,-9.0,-255,88,1.2,405,0x08140a);boxDeco(-36,-2.0,-255,2.6,11,392,0x15341a);boxDeco(36,-2.0,-255,2.6,11,392,0x15341a);
  for(let zz=-98,i=0;zz>-445;zz-=52,i++){addCylinderDeco(-30,-1.5,zz,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addCylinderDeco(30,-1.5,zz,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addGlowLight(i%2?-29:29,2.3,zz,0x64ff6d,.42,9);}
  addPlatform({x:0,y:.3,z:startZ,w:13,h:.6,d:10,color:0x245d2c,label:'TOXIC',stage:1,kind:'start'});addSign('WORLD 3 · TOXIC KEYBOARD',{x:0,y:5.25,z:startZ+4.4},0x7bff79,1.0);addSign('LEVEL 800 ≈ SPEED 120 · LEVEL 1000 ≈ SPEED 300',{x:0,y:4.05,z:startZ+4.42},0xffd16b,.43);
  let z=startZ-9;
  const title=(n,t)=>{addSign(`STAGE ${n} · ${t}`,{x:0,y:3.5,z:z+2.0},0x7cff7a,.58);addSign(`EMPFOHLEN: SPEED ${recommended[n-1]}+`,{x:0,y:2.65,z:z+2.02},0xffd36a,.35);};
  const key=(gap,x,y,w,d,label,color=0x286d35,extra={})=>{z-=gap;return addPlatform({x,y,z,w,h:.46,d,color,label,kind:extra.blink?'glitch-key':'key',...extra});};
  const win=(stage,reward,y=.8)=>{z-=4.5;addPlatform({x:0,y:y-.16,z,w:10.3,h:.38,d:5.2,color:0x16361d,label:'',kind:'safe-zone',stage:Math.min(10,stage+1)});addPlatform({x:3.0,y:y+.15,z,w:3.35,h:.2,d:2.15,color:0xdfaa2d,label:`WIN +${compact(reward)}`,kind:'win-pad',winReward:reward,winStage:stage});addSign(`CASH OUT · +${compact(reward)} WINS`,{x:3.0,y:y+2.0,z:z+.1},0xffd35b,.40);};

  title(1,'ACID KEYS');for(let i=0;i<7;i++)key(4.0,i%2?2.0:-2.0,.65,3.5,2.8,i%2?'A':'D');win(1,rewards[0]);
  z-=2.6;title(2,'NARROW ROW');for(let i=0;i<8;i++)key(4.45,(i%3-1)*1.8,.78,3.15,2.65,String(i+1));win(2,rewards[1],.92);
  z-=2.6;title(3,'TOXIC SLIDERS');for(let i=0;i<7;i++)key(4.9,0,1.0,3.2,2.6,'SLIDE',0x2d7d3a,{motion:{axis:'x',amp:2.8,speed:.68+i*.045,phase:i*.8}});win(3,rewards[2],1.14);
  z-=2.6;title(4,'BROKEN NUMPAD');for(let i=0;i<8;i++)key(5.35,i%2?2.55:-2.55,1.05+(i%3)*.14,3.0,2.55,String((i+1)%10),0x32783c);win(4,rewards[3],1.42);
  z-=2.6;title(5,'GLITCH ACID');for(let i=0;i<7;i++)key(5.8,(i%3-1)*2.0,1.35,2.95,2.5,'GL',0x4b7e35,{blink:true});win(5,rewards[4],1.48);
  z-=2.6;title(6,'TOXIC CLIMB');for(let i=0;i<8;i++)key(6.15,Math.sin(i*.8)*2.6,1.25+i*.25,2.9,2.45,i%2?'W':'SHIFT',0x2a6e34);win(6,rewards[5],3.25);
  z-=2.6;title(7,'DOUBLE MOTION');for(let i=0;i<7;i++)key(6.45,i%2?1.5:-1.5,2.35,2.85,2.4,'MOVE',0x347c40,{motion:{axis:'x',amp:3.2,speed:.8+i*.05,phase:i*.9}});win(7,rewards[6],2.48);
  z-=2.6;title(8,'ACID SPACE');key(6.8,0,2.3,5.3,2.4,'SPACE',0x3d8248);key(7.0,-2.7,2.55,3.0,2.35,'SHIFT',0x31723b);key(7.2,2.7,2.8,3.0,2.35,'ENTER',0x31723b);key(7.3,0,3.0,3.1,2.35,'ESC',0x4a8a50);win(8,rewards[7],3.18);
  z-=2.6;title(9,'CHAOS KEYS');for(let i=0;i<8;i++)key(7.45,Math.sin(i*1.25)*2.9,2.9+(i%2)*.18,2.8,2.3,'X',0x3a7f42,{motion:i%3===1?{axis:'x',amp:1.9,speed:.92,phase:i}:null,blink:i===3||i===6});win(9,rewards[8],3.15);
  z-=2.6;title(10,'SPEED 300 TOXIC ESCAPE');for(let i=0;i<6;i++)key(7.72,i%2?2.9:-2.9,3.0+i*.16,2.75,2.25,i===5?'ESC':'RUN',0x2d7738,{motion:i===2||i===4?{axis:'x',amp:2.3,speed:.88+i*.04,phase:i}:null});
  z-=5.6;addPlatform({x:0,y:4.05,z,w:11,h:.6,d:6.5,color:0x245e2c,label:'FINISH',kind:'safe-zone',stage:10});addPlatform({x:3.15,y:4.43,z,w:3.5,h:.2,d:2.4,color:0xe1ac2f,label:`WIN +${compact(rewards[9])}`,kind:'win-pad',winReward:rewards[9],winStage:10});addPlatform({x:0,y:4.42,z:z-2.45,w:4.0,h:.18,d:1.2,color:0x55dc5e,label:'FINISH',kind:'finish-strip',finish:true,stage:10});addRingDeco(0,6.0,z-2.5,1.9,.08,0x75ff72,0);addRingDeco(0,6.0,z-2.42,1.35,.05,0xffd45e,0);addGlowLight(0,6.1,z-2.2,0x69ff70,1.4,12);addSign('TOXIC KEYBOARD COMPLETE',{x:0,y:6.65,z:z+3.2},0x7cff79,.76);addSign('ENDGAME · SPEED 300',{x:0,y:5.58,z:z+3.22},0xffd35b,.55);addInteractable('toxic-hub-return','Zum Hub zurück',0,4.8,z-1.8,5,returnHub);
}
