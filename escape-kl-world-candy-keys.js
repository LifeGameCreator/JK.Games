/* Escape.kl World 2 – Candy Keys V440. Medium difficulty · Level 250+. */
export function buildCandyKeysWorld(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,returnHub}=api;
  const rewards=[25000,40000,65000,100000,175000,300000,500000,800000,1200000,2000000];
  const compactReward=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  const startZ=-70;
  boxDeco(0,-8.5,-235,84,1.1,355,0x351a27);boxDeco(-34,-2.0,-235,2.5,10,340,0x5c203b);boxDeco(34,-2.0,-235,2.5,10,340,0x5c203b);
  for(let z=-98,i=0;z>-390;z-=58,i++){
    addCylinderDeco(-27,1.2,z,1.3,1.3,4.8,i%2?0xf76bb4:0x70d9ff,0x6a2248,14);addCylinderDeco(27,1.2,z,1.3,1.3,4.8,i%2?0x70d9ff:0xf76bb4,0x264c6b,14);
    addGlowLight(i%2?-26:26,3.2,z,i%2?0xff73be:0x74dfff,.34,9);
  }
  addPlatform({x:0,y:.3,z:startZ,w:14,h:.6,d:11,color:0x9d4778,label:'CANDY',stage:1,kind:'start'});
  addSign('WORLD 2 · CANDY KEYS',{x:0,y:5.2,z:startZ+4.5},0xff80c7,1.03);addSign('LEVEL 250+ · MITTEL',{x:0,y:4.0,z:startZ+4.52},0xffd26b,.48);
  let z=startZ-10;
  const title=(n,t)=>addSign(`STAGE ${n} · ${t}`,{x:0,y:3.35,z:z+2.0},0xff8ccb,.58);
  const key=(x,y,w,d,label,color,extra={})=>addPlatform({x,y,z,w,h:.48,d,color,label,kind:'key',...extra});
  const win=(stage,reward,y=.7)=>{z-=4.2;addPlatform({x:0,y:y-.16,z,w:10.4,h:.4,d:5.5,color:0x522740,label:'',kind:'safe-zone',stage:Math.min(10,stage+1)});addPlatform({x:2.8,y:y+.15,z,w:3.6,h:.2,d:2.25,color:0xe4ad31,label:`WIN +${compactReward(reward)}`,kind:'win-pad',winReward:reward,winStage:stage});addSign(`WIN +${compactReward(reward)} · CASH OUT`,{x:2.8,y:y+2.0,z:z+.1},0xffd45f,.43);};

  title(1,'CHOCOLATE ROW');for(let i=0;i<6;i++){z-=4.05;key(i%2?1.4:-1.4,.55,4.0,3.1,i%2?'CHOCO':'CANDY',i%2?0x7a3d45:0xd05f9c);}win(1,rewards[0]);
  z-=2.5;title(2,'LOLLIPOP KEYS');for(let i=0;i<7;i++){z-=4.15;key((i%3-1)*1.6,.72,3.65,3.0,String(i+1),0xc95694);if(i%2===0)addCylinderDeco((i%3-1)*1.6,1.75,z,.22,.22,1.5,0xf7c8e2,0x9d3f73,10);}win(2,rewards[1],.85);
  z-=2.5;title(3,'CANDY ZIGZAG');for(let i=0;i<7;i++){z-=4.3;key(i%2?2.25:-2.25,.85,3.45,2.95,i%2?'A':'D',0xb54e88);}win(3,rewards[2],.98);
  z-=2.5;title(4,'COOKIE STEPS');for(let i=0;i<7;i++){z-=4.2;key(Math.sin(i*.8)*2.3,.8+i*.16,3.35,2.9,'●',0x9a654b);}win(4,rewards[3],1.95);
  z-=2.5;title(5,'MOVING GUM');for(let i=0;i<6;i++){z-=4.45;key(0,1.25,3.5,2.9,'GUM',0xef6dac,{motion:{axis:'x',amp:2.25,speed:.56+i*.04,phase:i*.75}});}win(5,rewards[4],1.38);
  z-=2.5;title(6,'SPACE BAR CANDY');z-=4.5;key(0,1.2,7.2,2.8,'SPACE',0xe179b2);z-=5.2;key(-2.0,1.35,5.4,2.8,'SHIFT',0xcf62a0);z-=5.4;key(2.0,1.5,5.5,2.8,'ENTER',0xba5693);win(6,rewards[5],1.65);
  z-=2.5;title(7,'DOUBLE SLIDERS');for(let i=0;i<7;i++){z-=4.5;key(i%2?1.0:-1.0,1.55,3.25,2.85,'KEY',0xb35d9a,{motion:{axis:'x',amp:2.8,speed:.62+i*.035,phase:i*.8}});}win(7,rewards[6],1.72);
  z-=2.5;title(8,'CANDY STAIRS');for(let i=0;i<8;i++){z-=4.2;key((i-3.5)*.45,1.45+i*.22,3.1,2.8,String((i+1)%10),0xc867a2);}win(8,rewards[7],3.2);
  z-=2.5;title(9,'SWEET RUN');for(let i=0;i<8;i++){z-=4.55;key(i%2?2.45:-2.45,2.25,3.05,2.7,i%2?'SHIFT':'W',0xa94783);}win(9,rewards[8],2.42);
  z-=2.5;title(10,'CANDY ESCAPE');for(let i=0;i<6;i++){z-=4.6;key(Math.sin(i*.9)*2.4,2.45+i*.13,3.0,2.7,i===5?'ESC':'C',0xce679f,{motion:i===2?{axis:'x',amp:1.8,speed:.7,phase:.4}:null});}
  z-=5.2;addPlatform({x:0,y:3.05,z,w:11,h:.6,d:7,color:0x8d3e6d,label:'FINISH',kind:'safe-zone',stage:10});addPlatform({x:3.0,y:3.43,z,w:3.8,h:.2,d:2.55,color:0xe6b133,label:`WIN +${compactReward(rewards[9])}`,kind:'win-pad',winReward:rewards[9],winStage:10});addPlatform({x:0,y:3.42,z:z-2.55,w:4.0,h:.18,d:1.25,color:0xff75bd,label:'FINISH',kind:'finish-strip',finish:true,stage:10});
  addRingDeco(0,5.1,z-2.7,2.0,.08,0xff87cc,0);addRingDeco(0,5.1,z-2.6,1.45,.05,0xffdc72,0);addGlowLight(0,5.2,z-2.4,0xff7fc6,1.25,12);addSign('CANDY KEYS COMPLETE',{x:0,y:5.8,z:z+3.5},0xff8dcc,.78);addSign(`+${compactReward(rewards[9])} WINS`,{x:0,y:4.75,z:z+3.52},0xffd45f,.55);addInteractable('candy-hub-return','Zum Hub zurück',0,3.9,z-2.0,5,returnHub);
}
