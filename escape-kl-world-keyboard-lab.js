/* Escape.kl World 1 – Keyboard Lab. Geometry-only module. */
export function buildKeyboardLabWorld(api){
  const {addPlatform,addSign,boxDeco,addInteractable,returnHub}=api;
  const startZ=-70;
  addPlatform({x:0,y:.3,z:startZ,w:12,h:.6,d:10,color:0x224d67,label:'ESC',checkpoint:1,kind:'start'});
  addSign('KEYBOARD LAB',{x:0,y:4,z:startZ+4.4},0x58ddff,1.05);
  let z=startZ-10;
  const labels=['W','A','S','D','Q','E','R','F','SHIFT','CTRL','TAB','ALT','1','2','3','4','5','ENTER','SPACE','ESC'];

  // Stage 1 – simple keyboard rhythm.
  for(let i=0;i<7;i++){z-=4.1;addPlatform({x:(i%2?.45:-.45),y:.45,z,w:3.3,h:.5,d:3.3,color:0x2b5a7d,label:labels[i],checkpoint:i===6?2:0});}
  // Stage 2 – wider zig-zag.
  for(let i=0;i<8;i++){z-=4.2;addPlatform({x:(i%2?3.1:-3.1),y:.65+(i%3)*.22,z,w:3.1,h:.52,d:3.1,color:0x355e98,label:labels[7+i],checkpoint:i===7?3:0});}
  // Stage 3 – moving keycaps.
  for(let i=0;i<7;i++){z-=4.5;addPlatform({x:0,y:.8,z,w:3.2,h:.5,d:3.1,color:0x4b54a2,label:String(i+1),motion:{axis:'x',amp:2.6+(i%2)*.8,speed:.7+i*.06,phase:i*.7},checkpoint:i===6?4:0});}
  // Stage 4 – climbing keyboard.
  for(let i=0;i<8;i++){z-=3.9;addPlatform({x:(i-3.5)*.65,y:.6+i*.34,z,w:2.8,h:.48,d:2.8,color:0x5c438f,label:labels[(i+3)%labels.length],checkpoint:i===7?5:0});}
  // Stage 5 – long spacebar jumps.
  z-=5;addPlatform({x:0,y:3.35,z,w:9,h:.45,d:2.4,color:0x6b438c,label:'SPACE'});
  z-=6.2;addPlatform({x:-2.4,y:3.1,z,w:6,h:.45,d:2.5,color:0x75508f,label:'SHIFT'});
  z-=6.5;addPlatform({x:2.5,y:2.75,z,w:7,h:.45,d:2.5,color:0x7e5789,label:'ENTER',checkpoint:6});
  // Stage 6 – glitch keys that phase in and out.
  for(let i=0;i<8;i++){z-=4.1;addPlatform({x:(i%3-1)*2.15,y:2.25,z,w:2.7,h:.46,d:2.7,color:0x824d83,label:'GL',blink:true,checkpoint:i===7?7:0});}
  // Stage 7 – lateral movers.
  for(let i=0;i<7;i++){z-=4.4;addPlatform({x:(i%2?-1.7:1.7),y:1.7,z,w:3.2,h:.46,d:3,color:0x75518f,label:labels[(i+10)%labels.length],motion:{axis:'x',amp:3.7,speed:.55+i*.045,phase:i*.8},checkpoint:i===6?8:0});}
  // Stage 8 – narrow numpad.
  for(let i=0;i<9;i++){z-=3.45;addPlatform({x:((i%3)-1)*1.55,y:1.25+(Math.floor(i/3)%2)*.35,z,w:1.95,h:.46,d:2.35,color:0x3e609d,label:String((i+1)%10),checkpoint:i===8?9:0});}
  // Stage 9 – final ESC climb.
  for(let i=0;i<8;i++){z-=3.7;addPlatform({x:Math.sin(i*.9)*2.5,y:1.3+i*.42,z,w:2.6,h:.48,d:2.5,color:0x315f88,label:i===7?'ESC':labels[i],checkpoint:i===7?10:0});}
  // Stage 10 – finish deck.
  z-=7;
  addPlatform({x:0,y:4.45,z,w:12,h:.6,d:8,color:0xc08b2d,label:'ESCAPE',finish:true,checkpoint:10,kind:'finish'});
  boxDeco(0,7.1,z-3,12,.4,.6,0xf5c65a,0x8a5d12);
  addSign('FINISH',{x:0,y:7.2,z:z+3.9},0xffcf5c,1.05);
  addInteractable('hub-return','Zum Hub zurück',0,5.2,z-2.2,5,returnHub);
}
