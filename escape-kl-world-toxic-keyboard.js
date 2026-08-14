/* Escape.kl World 3 – Toxic Keyboard V438. Hard difficulty · Level 400+. */
export function buildToxicKeyboardWorld(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,returnHub}=api;
  const rewards=[5000000,8000000,12000000,20000000,35000000,60000000,100000000,175000000,300000000,500000000];
  const compactReward=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  boxDeco(0,-9.0,-235,82,1.2,355,0x08140a);boxDeco(-33,-2.0,-235,2.6,11,340,0x15341a);boxDeco(33,-2.0,-235,2.6,11,340,0x15341a);
  for(let z=-96,i=0;z>-390;z-=52,i++){addCylinderDeco(-28,-1.5,z,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addCylinderDeco(28,-1.5,z,2.0,2.4,2.0,0x57d45d,0x173c1b,12);addGlowLight(i%2?-27:27,2.3,z,0x64ff6d,.42,9);}
  addPlatform({x:0,y:.3,z:startZ,w:13,h:.6,d:10,color:0x245d2c,label:'TOXIC',stage:1,kind:'start'});addSign('WORLD 3 · TOXIC KEYBOARD',{x:0,y:5.2,z:startZ+4.4},0x7bff79,1.0);addSign('LEVEL 400+ · SCHWER',{x:0,y:4.0,z:startZ+4.42},0xffd16b,.48);
  let z=startZ-10;
  const title=(n,t)=>addSign(`STAGE ${n} · ${t}`,{x:0,y:3.45,z:z+2.0},0x7cff7a,.58);
  const key=(x,y,w,d,label,color=0x286d35,extra={})=>addPlatform({x,y,z,w,h:.46,d,color,label,kind:extra.blink?'glitch-key':'key',...extra});
  const win=(stage,reward,y=.8,finish=false)=>{z-=4.4;addPlatform({x:0,y:y-.16,z,w:8.3,h:.38,d:5.2,color:0x16361d,label:'',kind:'safe-zone'});addPlatform({x:0,y:y+.15,z,w:4.4,h:.2,d:2.25,color:0xdfaa2d,label:`WIN +${compactReward(reward)}`,kind:'win-pad',winReward:reward,winStage:stage,stage:Math.min(10,stage+1),finish});addSign(`+${compactReward(reward)} WINS`,{x:0,y:y+2.0,z:z+.1},0xffd35b,.5);};

  title(1,'ACID KEYS');for(let i=0;i<7;i++){z-=4.45;key(i%2?2.2:-2.2,.65,3.2,2.75,i%2?'A':'D');}win(1,rewards[0]);
  z-=2.6;title(2,'NARROW ROW');for(let i=0;i<8;i++){z-=4.6;key((i%3-1)*1.8,.78,2.85,2.65,String(i+1));}win(2,rewards[1],.92);
  z-=2.6;title(3,'TOXIC SLIDERS');for(let i=0;i<7;i++){z-=4.7;key(0,1.0,3.0,2.65,'SLIDE',0x2d7d3a,{motion:{axis:'x',amp:3.0,speed:.72+i*.045,phase:i*.8}});}win(3,rewards[2],1.14);
  z-=2.6;title(4,'BROKEN NUMPAD');for(let i=0;i<8;i++){z-=4.55;key(i%2?2.6:-2.6,1.05+(i%3)*.14,2.7,2.55,String((i+1)%10),0x32783c);}win(4,rewards[3],1.42);
  z-=2.6;title(5,'GLITCH ACID');for(let i=0;i<7;i++){z-=4.65;key((i%3-1)*2.0,1.35,2.75,2.55,'GL',0x4b7e35,{blink:true});}win(5,rewards[4],1.48);
  z-=2.6;title(6,'TOXIC CLIMB');for(let i=0;i<8;i++){z-=4.5;key(Math.sin(i*.8)*2.7,1.25+i*.25,2.7,2.5,i%2?'W':'SHIFT',0x2a6e34);}win(6,rewards[5],3.25);
  z-=2.6;title(7,'DOUBLE MOTION');for(let i=0;i<7;i++){z-=4.8;key(i%2?1.5:-1.5,2.35,2.65,2.45,'MOVE',0x347c40,{motion:{axis:'x',amp:3.4,speed:.82+i*.05,phase:i*.9}});}win(7,rewards[6],2.48);
  z-=2.6;title(8,'ACID SPACE');z-=5.1;key(0,2.3,5.2,2.5,'SPACE',0x3d8248);z-=5.4;key(-2.7,2.55,3.0,2.45,'SHIFT',0x31723b);z-=5.5;key(2.7,2.8,3.0,2.45,'ENTER',0x31723b);z-=5.6;key(0,3.0,3.1,2.45,'ESC',0x4a8a50);win(8,rewards[7],3.18);
  z-=2.6;title(9,'CHAOS KEYS');for(let i=0;i<8;i++){z-=4.85;key(Math.sin(i*1.25)*3.0,2.9+(i%2)*.18,2.55,2.4,'X',0x3a7f42,{motion:i%3===1?{axis:'x',amp:2.0,speed:.95,phase:i}:null,blink:i===3||i===6});}win(9,rewards[8],3.15);
  z-=2.6;title(10,'TOXIC ESCAPE');for(let i=0;i<6;i++){z-=5.0;key(i%2?2.9:-2.9,3.0+i*.16,2.5,2.35,i===5?'ESC':'RUN',0x2d7738,{motion:i===2||i===4?{axis:'x',amp:2.4,speed:.9+i*.04,phase:i}:null});}
  z-=5.5;addPlatform({x:0,y:4.05,z,w:10.5,h:.6,d:6.5,color:0x245e2c,label:'FINISH',kind:'safe-zone'});addPlatform({x:0,y:4.43,z,w:5.2,h:.2,d:2.55,color:0xe1ac2f,label:`WIN +${compactReward(rewards[9])}`,kind:'win-pad',winReward:rewards[9],winStage:10,stage:10,finish:true});addRingDeco(0,6.0,z-2.5,1.9,.08,0x75ff72,0);addRingDeco(0,6.0,z-2.42,1.35,.05,0xffd45e,0);addGlowLight(0,6.1,z-2.2,0x69ff70,1.4,12);addSign('TOXIC KEYBOARD COMPLETE',{x:0,y:6.65,z:z+3.2},0x7cff79,.76);addSign(`+${compactReward(rewards[9])} WINS`,{x:0,y:5.58,z:z+3.22},0xffd35b,.55);addInteractable('toxic-hub-return','Zum Hub zurück',0,4.8,z-1.8,5,returnHub);
}
