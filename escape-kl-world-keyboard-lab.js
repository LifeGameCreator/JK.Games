/* Escape.kl World 1 – Keyboard Lab V434.
   Geometry-only and expandable: game core handles movement, key presses and audio. */
export function buildKeyboardLabWorld(api){
  const {addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addInteractable,returnHub}=api;
  const startZ=-70;

  // Giant desk / laboratory below the whole obby. Decorative only, so falling still means falling.
  boxDeco(0,-8.4,-245,82,1.2,380,0x241b18);boxDeco(-35,-2.5,-245,3,11,365,0x09121d);boxDeco(35,-2.5,-245,3,11,365,0x09121d);
  for(let z=-86;z>-430;z-=34){boxDeco(-30,-1.2,z,1.1,10,8,0x10283b,0x0a2438);boxDeco(30,-1.2,z,1.1,10,8,0x10283b,0x0a2438);addGlowLight(-29,2.8,z,0x4ddffc,.42,10);addGlowLight(29,2.8,z,0x8a6dff,.38,10);}

  // Start gate / oversized ESC key.
  addPlatform({x:0,y:.3,z:startZ,w:13,h:.6,d:10,color:0x224d67,label:'ESC',checkpoint:1,kind:'start'});
  boxDeco(-6.2,2.5,startZ+3.8,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(6.2,2.5,startZ+3.8,.55,5.2,.65,0x1c8199,0x13546b);boxDeco(0,5,startZ+3.8,13,.45,.65,0x1c8199,0x13546b);addRingDeco(0,2.8,startZ+3.6,2.3,.065,0x57e7ff,0);addGlowLight(0,3.2,startZ+2.4,0x55e7ff,1.15,13);
  addSign('KEYBOARD LAB',{x:0,y:5.65,z:startZ+4.15},0x58ddff,1.08);addSign('10 STAGES · ESCAPE',{x:0,y:4.0,z:startZ+4.18},0xf3cb64,.60);
  let z=startZ-10;
  const labels=['W','A','S','D','Q','E','R','F','SHIFT','CTRL','TAB','ALT','1','2','3','4','5','ENTER','SPACE','ESC'];
  const checkpointGate=(stage,yPos,zPos,color=0x59e3ff)=>{boxDeco(-5.0,yPos+1.7,zPos,.16,3.4,.35,color,color);boxDeco(5.0,yPos+1.7,zPos,.16,3.4,.35,color,color);boxDeco(0,yPos+3.35,zPos,10.2,.16,.35,color,color);addGlowLight(0,yPos+2.2,zPos,color,.62,9);addSign(`CHECKPOINT ${stage}`,{x:0,y:yPos+3.8,z:zPos+.22},color,.52);};
  const stageSign=(n,title,zPos,yPos=3.15,color=0x64dfff)=>addSign(`STAGE ${n} · ${title}`,{x:0,y:yPos,z:zPos},color,.63);

  // Stage 1 – recognizable WASD rhythm.
  stageSign(1,'WASD',z+3.6);for(let i=0;i<7;i++){z-=4.1;addPlatform({x:(i%2?.45:-.45),y:.45,z,w:3.3,h:.5,d:3.3,color:i===6?0x2f718d:0x2b5a7d,label:labels[i],checkpoint:i===6?2:0,kind:'key'});}checkpointGate(2,.7,z-1.75);

  // Stage 2 – zig-zag with progressively raised keys.
  z-=3.5;stageSign(2,'ZIG ZAG',z+2.0);for(let i=0;i<8;i++){z-=4.2;addPlatform({x:(i%2?3.1:-3.1),y:.65+(i%3)*.22,z,w:3.1,h:.52,d:3.1,color:i===7?0x4672b1:0x355e98,label:labels[7+i],checkpoint:i===7?3:0,kind:'key'});}checkpointGate(3,1.0,z-1.7,0x6ea6ff);

  // Stage 3 – moving numeric keycaps.
  z-=3.7;stageSign(3,'MOVING KEYS',z+2.2,3.5,0x8c8cff);for(let i=0;i<7;i++){z-=4.5;addPlatform({x:0,y:.8,z,w:3.2,h:.5,d:3.1,color:i===6?0x6262bd:0x4b54a2,label:String(i+1),motion:{axis:'x',amp:2.6+(i%2)*.8,speed:.7+i*.06,phase:i*.7},checkpoint:i===6?4:0,kind:'key'});}checkpointGate(4,1.08,z-1.8,0x8f8bff);

  // Stage 4 – climbing keyboard / stair rhythm.
  z-=3.5;stageSign(4,'KEY CLIMB',z+2.1,4.0,0xbf83ff);for(let i=0;i<8;i++){z-=3.9;addPlatform({x:(i-3.5)*.65,y:.6+i*.34,z,w:2.8,h:.48,d:2.8,color:i===7?0x794c9c:0x5c438f,label:labels[(i+3)%labels.length],checkpoint:i===7?5:0,kind:'key'});}checkpointGate(5,3.25,z-1.5,0xc481ff);

  // Stage 5 – long spacebar jumps.
  z-=5;stageSign(5,'SPACEBARS',z+2.6,6.0,0xf0a2ff);addPlatform({x:0,y:3.35,z,w:9,h:.45,d:2.4,color:0x6b438c,label:'SPACE',kind:'key'});
  z-=6.2;addPlatform({x:-2.4,y:3.1,z,w:6,h:.45,d:2.5,color:0x75508f,label:'SHIFT',kind:'key'});
  z-=6.5;addPlatform({x:2.5,y:2.75,z,w:7,h:.45,d:2.5,color:0x8e5c98,label:'ENTER',checkpoint:6,kind:'key'});checkpointGate(6,3.05,z-1.55,0xe69cf5);

  // Stage 6 – glitch keys phase in and out. Extra glitch bars sell the effect visually.
  z-=3.6;stageSign(6,'GLITCH',z+2.0,5.0,0xff78dd);for(let i=0;i<8;i++){z-=4.1;addPlatform({x:(i%3-1)*2.15,y:2.25,z,w:2.7,h:.46,d:2.7,color:i===7?0xa54d92:0x824d83,label:'GL',blink:true,checkpoint:i===7?7:0,kind:'glitch-key'});if(i%2===0){boxDeco(-6.7,3.0,z,2.2,.07,.16,0xff61d6,0x8b185f);boxDeco(6.7,3.0,z,2.2,.07,.16,0x6f67ff,0x2b226f);}}checkpointGate(7,2.55,z-1.7,0xff78dc);

  // Stage 7 – lateral movers.
  z-=3.4;stageSign(7,'SLIDERS',z+1.8,4.55,0xaa82ff);for(let i=0;i<7;i++){z-=4.4;addPlatform({x:(i%2?-1.7:1.7),y:1.7,z,w:3.2,h:.46,d:3,color:i===6?0x865aa0:0x75518f,label:labels[(i+10)%labels.length],motion:{axis:'x',amp:3.7,speed:.55+i*.045,phase:i*.8},checkpoint:i===6?8:0,kind:'key'});}checkpointGate(8,2.0,z-1.6,0xb58aff);

  // Stage 8 – narrow numpad grid.
  z-=3.3;stageSign(8,'NUMPAD',z+1.7,4.0,0x70a8ff);for(let i=0;i<9;i++){z-=3.45;addPlatform({x:((i%3)-1)*1.55,y:1.25+(Math.floor(i/3)%2)*.35,z,w:1.95,h:.46,d:2.35,color:i===8?0x4c7bbb:0x3e609d,label:String((i+1)%10),checkpoint:i===8?9:0,kind:'key'});}checkpointGate(9,1.6,z-1.45,0x6fa8ff);

  // Stage 9 – final ESC climb with increasing height.
  z-=3.5;stageSign(9,'ESC CLIMB',z+2,5.0,0x59e3ff);for(let i=0;i<8;i++){z-=3.7;addPlatform({x:Math.sin(i*.9)*2.5,y:1.3+i*.42,z,w:2.6,h:.48,d:2.5,color:i===7?0x2b87a8:0x315f88,label:i===7?'ESC':labels[i],checkpoint:i===7?10:0,kind:'key'});}checkpointGate(10,4.48,z-1.4,0x55efff);

  // Stage 10 – finale. Large golden keyboard deck + animated-looking portal rings.
  z-=7;stageSign(10,'FINAL ESCAPE',z+5.8,8.0,0xffcf5c);
  addPlatform({x:0,y:4.45,z,w:13,h:.6,d:9,color:0xc08b2d,label:'ESCAPE',finish:true,checkpoint:10,kind:'finish'});
  boxDeco(0,7.1,z-3.55,13,.4,.6,0xf5c65a,0x8a5d12);boxDeco(-6.0,5.8,z-3.55,.45,5.8,.6,0xf5c65a,0x8a5d12);boxDeco(6.0,5.8,z-3.55,.45,5.8,.6,0xf5c65a,0x8a5d12);addRingDeco(0,6.3,z-3.35,2.4,.08,0xffd762,0);addRingDeco(0,6.3,z-3.25,1.75,.05,0x6ee9ff,0);addGlowLight(0,6.3,z-2.7,0xffd05c,1.6,14);
  addSign('FINISH',{x:0,y:7.65,z:z+4.35},0xffcf5c,1.12);addSign('YOU ESCAPED',{x:0,y:6.15,z:z+4.37},0x76eaff,.70);
  addInteractable('hub-return','Zum Hub zurück',0,5.2,z-2.2,5,returnHub);
}
