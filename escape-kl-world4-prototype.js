/* Escape.kl World 4 – WATER WORLD.
   Stage 6: Speed-280-Flugboosts.
   Stage 7: 2,0-s-Crumble-Plattformen, Timer startet erst nach echter Landung.
   Stage 8: Speed-290-Labyrinth mit verfolgendem Boss.
   Stage 9: Finale Gefahrenfläche mit grün/gelb/rot pulsierenden Punkten.
   Kleine rechtsliegende WIN-Pads bleiben an jeder Stage erhalten. */
export function buildWaterWorld(api){
  const {
    addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},addCollider=()=>{},
    addInteractable,addAutoTrigger=()=>{},addHazardBox,addWaterWave=()=>{},addRisingWater=()=>{},addMazeBoss=()=>{},addPulseHazard=()=>{},
    worldToast=()=>{},returnHub=()=>{}
  }=api;
  const startZ=-70;
  const water=0x2bbcf0,deep=0x087fae,foam=0xbdf4ff,rock=0x174657,platform=0x2f8fb0,safe=0x47b9d2,boost=0x52d7ff;
  const compact=n=>n>=1e9?`${(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')}B`:n>=1e6?`${(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')}K`:String(n);
  // Rund +33–38 % pro Stage; World 4 setzt oberhalb des Toxic-Finales (500M) an.
  const rewards=[600000000,800000000,1100000000,1500000000,2000000000,2700000000,3600000000,4800000000,6400000000];
  const addStageWin=(stage,reward,x,y,z)=>{
    addPlatform({x,y,z,w:2.55,h:.18,d:1.75,color:0xe0ad32,label:`WIN +${compact(reward)}`,kind:'win-pad',winReward:reward,winStage:stage});
    addSign(`+${compact(reward)} WINS`,{x,y:y+1.55,z:z+.08},0xffd45f,.31);
  };

  // Sichtbares Wasser unter der kompletten Water World – bis weit hinter das Finale.
  const floorWater=addHazardBox({x:0,y:-1.18,z:-760,w:76,h:.34,d:1470,color:water,emissive:deep,motion:{axis:'y',amp:.07,speed:1.15,phase:0},kind:'water-floor'});
  floorWater.waterFloor=true;
  boxDeco(-24,1.8,-760,1.2,7.0,1470,rock);boxDeco(24,1.8,-760,1.2,7.0,1470,rock);
  for(let z=-92,i=0;z>-1490;z-=34,i++){
    addCylinderDeco(-21.6,-.15,z,.65,1.15,2.1,i%2?0x2a7c8d:0x256878,0,10);
    addCylinderDeco(21.6,-.15,z,.65,1.15,2.1,i%2?0x2a7c8d:0x256878,0,10);
  }

  // START / RÜCKWEG
  addPlatform({x:0,y:.32,z:startZ,w:16,h:.62,d:12,color:safe,label:'START',stage:1,kind:'start'});
  addSign('WORLD 4 · WATER WORLD',{x:0,y:5.65,z:startZ+4.6},0x4fd8ff,.90);
  addSign('↩ HINTER DIR · ZURÜCK ZUM HUB',{x:0,y:4.35,z:startZ+4.62},0xdaf8ff,.40);
  addAutoTrigger('water-world-return-hub',0,startZ+5.35,9.5,1.8,returnHub);

  // STAGE 1
  addSign('STAGE 1 · WATER KEYS',{x:0,y:4.7,z:-84},0x8eeaff,.62);
  addSign('NORMALER EINSTIEG · EMPFOHLEN SPEED 60+',{x:0,y:3.68,z:-84.02},0xe9fbff,.31);
  const s1=[
    [-84,-3.0,.52,4.8,4.0,'WATER'],[-94,2.8,.70,4.6,3.8,'FLOW'],[-104,-1.8,.88,4.3,3.7,'BLUE'],[-114,3.4,1.05,4.2,3.5,'TIDE'],
    [-124,-3.3,1.20,4.1,3.5,'WAVE'],[-134,1.7,1.35,4.2,3.6,'SEA'],[-144,0,1.48,6.6,4.6,'STAGE 1']
  ];
  for(const [z,x,y,w,d,label] of s1)addPlatform({x,y,z,w,h:.48,d,color:platform,label,stage:1,kind:'water-key'});
  addStageWin(1,rewards[0],4.55,1.87,-156.0);

  // STAGE 2
  addPlatform({x:0,y:1.52,z:-156,w:12,h:.58,d:7,color:safe,label:'STAGE 2',stage:2,kind:'safe-zone'});
  addSign('STAGE 2 · WAVE ESCAPE',{x:0,y:5.9,z:-157},0x4fd8ff,.70);
  addSign('WASSERWELLE HINTER DIR · EMPFOHLEN SPEED 100+',{x:0,y:4.72,z:-157.02},0xffffff,.34);
  addWaterWave({x:0,y:2.1,startZ:-151,triggerZ:-159.6,endZ:-252,w:32,h:6.6,d:2.2,speed:10.4,spawnBehind:9,clearZ:-251.5,color:0x21b9ec,triggerText:'🌊 WASSERWELLE · LAUF!'});
  const s2=[
    [-170,-2.8,1.52,7.0,4.6,'RUN'],[-182,3.1,1.64,6.4,4.4,'WAVE'],[-194,-3.2,1.76,6.2,4.3,'ESCAPE'],[-206,2.6,1.90,6.0,4.2,'100+'],
    [-218,-2.2,2.02,5.8,4.1,'RUN'],[-230,3.0,2.12,5.8,4.1,'FASTER'],[-242,-3.0,2.24,6.0,4.2,'WATER'],[-254,0,2.34,8.8,5.0,'SAFE'],[-262,0,2.34,7.2,5.0,'STAGE 2 END']
  ];
  for(const [z,x,y,w,d,label] of s2)addPlatform({x,y,z,w,h:.5,d,color:iColor(label),label,stage:2,kind:'water-key'});
  addStageWin(2,rewards[1],4.55,2.70,-270.0);

  // STAGE 3
  addPlatform({x:0,y:2.35,z:-270,w:12,h:.58,d:8,color:safe,label:'STAGE 3',stage:3,kind:'safe-zone'});
  addSign('STAGE 3 · FLOOD TOWER',{x:0,y:6.65,z:-274},0x52dcff,.72);
  addSign('RUNDHERUM NACH OBEN · FLUT STEIGT · EMPFOHLEN SPEED 160+',{x:0,y:5.47,z:-274.02},0xffffff,.32);
  addRisingWater({x:0,z:-305,w:28,d:46,startY:-1.15,endY:12.75,h:.46,triggerZ:-278,riseSpeed:.78,holdSeconds:1.15,fallSpeed:2.25,color:0x20bce9,triggerText:'🌊 FLUT STEIGT · NACH OBEN!'});
  boxDeco(0,6.2,-305,10.5,12.5,10.5,0x123e4c);
  addPlatform({x:0,y:2.50,z:-278,w:5.0,h:.34,d:5.0,color:0x3baec5,label:'UP',stage:3,kind:'water-stair'});
  addPlatform({x:4,y:2.58,z:-284,w:5.0,h:.34,d:5.0,color:0x329bb4,label:'UP',stage:3,kind:'water-stair'});
  addPlatform({x:8,y:2.66,z:-288,w:4.2,h:.34,d:5.0,color:0x3baec5,label:'UP',stage:3,kind:'water-stair'});
  const perimeter=[];
  const corners=[[8,-292],[8,-318],[-8,-318],[-8,-292]];
  const samplesPerSide=6,totalSides=10;
  for(let segment=0;segment<totalSides;segment++){
    const side=segment%4,a=corners[side],b=corners[(side+1)%4];
    for(let j=0;j<samplesPerSide;j++){
      const t=j/samplesPerSide;perimeter.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,side]);
    }
  }
  for(let i=0;i<perimeter.length;i++){
    const [x,z,side]=perimeter[i],y=2.78+i*.18,alongX=side===1||side===3;
    addPlatform({x,y,z,w:alongX?4.2:4.0,h:.34,d:alongX?4.0:4.9,color:i%4===0?0x3fb4cb:0x2d8fa9,label:'UP',stage:3,kind:'water-stair'});
    if(i%12===0)addGlowLight(x,y+1.2,z,0x65e7ff,.38,7);
  }
  addPlatform({x:-8,y:13.48,z:-324,w:10,h:.58,d:8,color:safe,label:'TOP SAFE',stage:3,kind:'safe-zone'});
  addRingDeco(-8,15.18,-324,2.0,.07,foam,0);
  addStageWin(3,rewards[2],-4.35,13.83,-324.0);

  // STAGE 4
  addPlatform({x:0,y:13.48,z:-338,w:10,h:.60,d:7,color:boost,label:'BOOST START',stage:4,kind:'water-boost-pad',jumpBoost:11.8});
  addSign('STAGE 4 · BOOST LEAPS',{x:0,y:18.4,z:-339},0x5fe7ff,.72);
  addSign('6 BOOST-FLÄCHEN · RECHTS / LINKS · EMPFOHLEN SPEED 200+',{x:0,y:17.25,z:-339.02},0xffffff,.32);
  const boostPads=[[-349,-5.5],[-360,5.5],[-371,-5.5],[-382,5.5],[-393,-5.5],[-404,5.5]];
  boostPads.forEach(([z,x],i)=>{
    addPlatform({x,y:13.48,z,w:5.2,h:.56,d:5.2,color:i%2?0x3bcbe9:0x55e6ff,label:`BOOST ${i+1}`,stage:4,kind:'water-boost-pad',jumpBoost:11.8});
    addRingDeco(x,15.03,z,1.25,.055,foam,Math.PI/2);
  });
  addStageWin(4,rewards[3],4.20,13.83,-416.0);
  addPlatform({x:0,y:13.48,z:-416,w:11,h:.60,d:7,color:safe,label:'STAGE 5',stage:5,kind:'safe-zone'});

  // STAGE 5
  addSign('STAGE 5 · FULL SPEED RUN',{x:0,y:18.25,z:-421},0x4fd8ff,.74);
  addSign('GERADEAUS RENNEN · WELLE HINTER DIR · EMPFOHLEN SPEED 230+',{x:0,y:17.08,z:-421.02},0xffffff,.32);
  addPlatform({x:0,y:13.43,z:-490,w:12,h:.52,d:135,color:0x216f87,label:'RUN 230+',stage:5,kind:'water-runway'});
  for(let z=-432,n=0;z>=-548;z-=14,n++){
    boxDeco(0,13.715,z,7.8,.035,.16,n%2?0xcff7ff:0x66dfff);
    if(n%2===0)boxDeco(-5.55,13.73,z,.12,.05,9.0,0xdaf8ff);
    if(n%2===0)boxDeco(5.55,13.73,z,.12,.05,9.0,0xdaf8ff);
  }
  addWaterWave({x:0,y:16.35,startZ:-409,triggerZ:-419.6,endZ:-551,w:31,h:7.2,d:2.3,speed:16.5,spawnBehind:10,clearZ:-548,color:0x22bce9,triggerText:'🌊 FINAL WAVE · VOLLGAS!'});
  addStageWin(5,rewards[4],6.05,13.83,-565.0);
  addPlatform({x:0,y:13.48,z:-565,w:15,h:.62,d:10,color:safe,label:'STAGE 6',stage:6,kind:'safe-zone'});

  // STAGE 6 – Speed-280-Flugboosts.
  addSign('STAGE 6 · WUMM FLIGHT',{x:0,y:18.55,z:-579},0x75ecff,.76);
  addSign('MINDESTENS SPEED 280 · ANLAUF · BOOST · NACH RECHTS FLIEGEN',{x:0,y:17.35,z:-579.02},0xffffff,.31);
  addSign('UNTER 280? DANN MACHT DER BOOST NUR: NÖ.',{x:0,y:16.45,z:-579.04},0xffd56a,.27);
  const flightPads=[
    {x:0,z:-583,w:7.2,d:16.0,label:'WUMM START'},
    {x:8,z:-610,w:6.2,d:10.0,label:'RIGHT'},
    {x:1,z:-637,w:6.2,d:10.0,label:'WUMM 2'},
    {x:10,z:-664,w:6.2,d:10.0,label:'RIGHT'},
    {x:2,z:-691,w:6.2,d:10.0,label:'WUMM 3'},
    {x:11,z:-718,w:6.2,d:10.0,label:'FINAL WUMM'}
  ];
  flightPads.forEach((pad,i)=>{
    addPlatform({x:pad.x,y:13.48,z:pad.z,w:pad.w,h:.58,d:pad.d,color:i%2?0x2fc4ec:0x5ee8ff,label:pad.label,stage:6,kind:'water-flight-boost',jumpBoost:14.8,speedGate:280});
    addRingDeco(pad.x,15.00,pad.z,1.45,.065,i%2?0x98f2ff:foam,Math.PI/2);
    addGlowLight(pad.x,15.15,pad.z,0x6be8ff,.48,8);
    for(let dz=-pad.d*.30;dz<=pad.d*.30;dz+=2.2)boxDeco(pad.x,13.80,pad.z+dz,Math.max(2.8,pad.w*.68),.035,.16,i%2?0xbaf8ff:0xffffff);
  });
  addPlatform({x:0,y:13.48,z:-745,w:15,h:.62,d:12,color:safe,label:'STAGE 7',stage:7,kind:'safe-zone'});
  addStageWin(6,rewards[5],6.15,13.83,-745.0);

  // STAGE 7 – Timer startet erst beim tatsächlichen Landen. Vorher sind die Blöcke dauerhaft fest.
  addSign('STAGE 7 · BLUBB BLOCKS',{x:0,y:18.60,z:-755},0x66e5ff,.75);
  addSign('SPEED 280 · 2 SEKUNDEN AB LANDUNG · NICHT TRÖDELN!',{x:0,y:17.40,z:-755.02},0xffffff,.31);
  addAutoTrigger('water-stage7-warning',0,-756,14,10,()=>worldToast('💦 BEEIL DICH! ERST WENN DU LANDEST, STARTEN 2 SEKUNDEN – DANN MACHT DER BLOCK BLUBB!','bad',3000));
  const crumble=[
    [-766,-4],[-778,3],[-790,-5],[-802,5],[-814,-2],[-826,6],[-838,-6],[-850,2],[-862,-4],[-874,5],[-886,-1]
  ];
  crumble.forEach(([z,x],i)=>{
    // Kein requiredSpeed auf dem Kollisionskörper: Die Plattform darf niemals vor der Landung "durchlässig" sein.
    addPlatform({x,y:13.48,z,w:5.6,h:.54,d:5.8,color:i%2?0x2d9fc5:0x46cbe7,label:i===0?'BEEIL!':`${i+1}`,stage:7,kind:'collapse-key',collapseDelayMs:2000,collapseRespawnMs:2800});
    if(i%2===0)addRingDeco(x,14.82,z,1.0,.045,0xc9f8ff,Math.PI/2);
  });
  addPlatform({x:0,y:13.48,z:-902,w:16,h:.62,d:12,color:safe,label:'STAGE 8',stage:8,kind:'safe-zone'});
  addStageWin(7,rewards[6],6.35,13.83,-902.0);

  // STAGE 8 – großer Labyrinth-Block. Der Boss verfolgt exakt den gelaufenen Weg durch die Gänge.
  addSign('STAGE 8 · KRAKEN MAZE',{x:0,y:19.05,z:-916},0x73e9ff,.78);
  addSign('SPEED 290 · FOLGE DEN PFEILEN · DER BOSS IST HINTER DIR',{x:0,y:17.82,z:-916.02},0xffffff,.31);
  addAutoTrigger('water-stage8-warning',0,-919,26,10,()=>worldToast('🐙 KRAKEN-ALARM! Folge den Pfeilen. Unter Speed 290 ist er schneller als du!','bad',3300));
  addPlatform({x:0,y:13.40,z:-1012,w:35,h:.48,d:208,color:0x185b70,label:'',stage:8,kind:'water-maze-floor'});

  const wallY=16.05,wallH=4.8,wallColor=0x123a49;
  // Seitenwände – mit der Weltgrenze gibt es keinen Weg außen herum.
  for(const x of[-17.15,17.15]){boxDeco(x,wallY,-1012,1.45,wallH,208,wallColor);addCollider(x,-1012,1.45,208);}
  // Serpentinen-Wände: Öffnung rechts, dann links, dann wieder rechts usw.
  const mazeRows=[-942,-967,-992,-1017,-1042,-1067,-1092];
  mazeRows.forEach((z,i)=>{
    const gapRight=i%2===0;
    const x=gapRight?-4.15:4.15;
    boxDeco(x,wallY,z,24.7,wallH,1.15,wallColor);addCollider(x,z,24.7,1.15);
    const arrowX=gapRight?12.2:-12.2,arrow=gapRight?'→':'←';
    addSign(arrow,{x:arrowX,y:16.65,z:z+7.6},i%2?0xffdf70:0x89f1ff,.52);
    addGlowLight(arrowX,15.30,z+3.4,i%2?0xffd15c:0x65e7ff,.45,7);
  });
  // Zusätzliche Pfeile in den langen Längsgängen.
  for(const [x,z,arrow] of [[12,-951,'↓'],[-12,-976,'↓'],[12,-1001,'↓'],[-12,-1026,'↓'],[12,-1051,'↓'],[-12,-1076,'↓'],[12,-1101,'↓']]){
    addSign(arrow,{x,y:16.45,z},0xffffff,.42);
  }
  addMazeBoss({x:0,y:14.95,z:-915,triggerZ:-923,clearZ:-1117,requiredSpeed:290,slowSpeed:23.0,fastSpeed:18.4,color:0x17333e,accent:0xff5c66,triggerText:'🐙 KRAKEN LOS! SPEED 290 ODER ER KRIEGT DICH!'});
  addPlatform({x:0,y:13.48,z:-1124,w:30,h:.62,d:13,color:safe,label:'STAGE 9',stage:9,kind:'safe-zone'});
  addStageWin(8,rewards[7],14.0,13.83,-1124.0);

  // STAGE 9 – lange finale Fläche. Punkte erscheinen an wechselnden Stellen und wechseln grün → gelb → rot.
  addSign('STAGE 9 · COLOR STORM FINALE',{x:0,y:19.15,z:-1140},0x8df5ff,.80);
  addSign('SPEED 300 EMPFOHLEN · 290 IST MÖGLICH, ABER EXTREM SCHWER',{x:0,y:17.92,z:-1140.02},0xffffff,.31);
  addSign('GRÜN → GELB → ROT · KEINEN PUNKT BERÜHREN!',{x:0,y:16.96,z:-1140.04},0xffdf70,.29);
  addAutoTrigger('water-stage9-warning',0,-1142,28,12,()=>worldToast('🟢🟡🔴 COLOR STORM! Die Punkte springen herum – nicht berühren und VOLLGAS!','bad',3300));
  addPlatform({x:0,y:13.38,z:-1287.5,w:31,h:.50,d:330,color:0x204e61,label:'',stage:9,kind:'water-final-runway'});
  // Leuchtende Seitenlinien machen die lange Fläche trotz Nebel gut lesbar.
  for(let z=-1155,n=0;z>=-1428;z-=14,n++){
    boxDeco(-14.6,13.69,z,.14,.04,7.0,n%2?0x7ceeff:0xd7fbff);
    boxDeco(14.6,13.69,z,.14,.04,7.0,n%2?0x7ceeff:0xd7fbff);
  }
  for(let i=0;i<24;i++)addPulseHazard({centerX:0,centerZ:-1292,areaW:26.5,areaD:270,y:13.70,radius:1.05+(i%4)*.12,seed:9001+i*137,triggerZ:-1145});
  addPlatform({x:0,y:13.48,z:-1452,w:31,h:.62,d:14,color:safe,label:'WATER WORLD ZIEL',stage:9,kind:'safe-zone'});
  addSign('WATER WORLD GESCHAFFT! · WIN-PAD RECHTS',{x:0,y:18.55,z:-1452},0x9af7ff,.62);
  addStageWin(9,rewards[8],14.0,13.83,-1452.0);
  addInteractable('water-world-return-after-finish','Water World verlassen · Zum Hub',0,14.45,-1458,5.5,returnHub);

  function iColor(label){return label==='100+'?0x47cde7:label==='SAFE'?safe:platform;}
}
