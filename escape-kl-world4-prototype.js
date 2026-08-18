/* Escape.kl World 4 – V489 WATER WORLD.
   Owner-Testbuild. Stages 1–5 sind spielbar; der weitere Ausbau folgt danach. */
export function buildWaterWorld(api){
  const {
    addPlatform,addSign,boxDeco,addCylinderDeco=()=>{},addRingDeco=()=>{},addGlowLight=()=>{},
    addInteractable,addAutoTrigger=()=>{},addHazardBox,addWaterWave=()=>{},addRisingWater=()=>{},returnHub=()=>{}
  }=api;
  const startZ=-70;
  const water=0x2bbcf0,deep=0x087fae,foam=0xbdf4ff,rock=0x174657,platform=0x2f8fb0,safe=0x47b9d2,boost=0x52d7ff;

  // Sichtbares Wasser unter der gesamten Map statt schwarzem Void. Die leichte Y-Bewegung
  // sorgt dafür, dass die Wasserfläche auch ohne Textur sichtbar "lebt".
  const floorWater=addHazardBox({x:0,y:-1.18,z:-355,w:64,h:.34,d:650,color:water,emissive:deep,motion:{axis:'y',amp:.07,speed:1.15,phase:0},kind:'water-floor'});
  floorWater.waterFloor=true;
  boxDeco(-24,1.8,-355,1.2,7.0,650,rock);boxDeco(24,1.8,-355,1.2,7.0,650,rock);
  for(let z=-92,i=0;z>-640;z-=34,i++){
    addCylinderDeco(-21.6,-.15,z,.65,1.15,2.1,i%2?0x2a7c8d:0x256878,0,10);
    addCylinderDeco(21.6,-.15,z,.65,1.15,2.1,i%2?0x2a7c8d:0x256878,0,10);
  }

  // START / RÜCKWEG
  addPlatform({x:0,y:.32,z:startZ,w:16,h:.62,d:12,color:safe,label:'START',stage:1,kind:'start'});
  addSign('WORLD 4 · WATER WORLD',{x:0,y:5.65,z:startZ+4.6},0x4fd8ff,.90);
  addSign('↩ HINTER DIR · ZURÜCK ZUM HUB',{x:0,y:4.35,z:startZ+4.62},0xdaf8ff,.40);
  addAutoTrigger('water-world-return-hub',0,startZ+5.35,9.5,1.8,returnHub);

  // STAGE 1 – normaler Einstieg, bewusst noch ohne Welle.
  addSign('STAGE 1 · WATER KEYS',{x:0,y:4.7,z:-84},0x8eeaff,.62);
  addSign('NORMALER EINSTIEG · EMPFOHLEN SPEED 60+',{x:0,y:3.68,z:-84.02},0xe9fbff,.31);
  const s1=[
    [-84,-3.0,.52,4.8,4.0,'WATER'],[-94,2.8,.70,4.6,3.8,'FLOW'],[-104,-1.8,.88,4.3,3.7,'BLUE'],[-114,3.4,1.05,4.2,3.5,'TIDE'],
    [-124,-3.3,1.20,4.1,3.5,'WAVE'],[-134,1.7,1.35,4.2,3.6,'SEA'],[-144,0,1.48,6.6,4.6,'STAGE 1']
  ];
  for(const [z,x,y,w,d,label] of s1)addPlatform({x,y,z,w,h:.48,d,color:platform,label,stage:1,kind:'water-key'});

  // STAGE 2 – horizontale Wasserwelle. Ab der ersten Stage-2-Plattform startet sie hinter dem Spieler.
  addPlatform({x:0,y:1.52,z:-156,w:12,h:.58,d:7,color:safe,label:'STAGE 2',stage:2,kind:'safe-zone'});
  addSign('STAGE 2 · WAVE ESCAPE',{x:0,y:5.9,z:-157},0x4fd8ff,.70);
  addSign('WASSERWELLE HINTER DIR · EMPFOHLEN SPEED 100+',{x:0,y:4.72,z:-157.02},0xffffff,.34);
  addWaterWave({x:0,y:2.1,startZ:-160.5,triggerZ:-164,endZ:-270,w:32,h:6.6,d:2.2,speed:10.4,color:0x21b9ec,triggerText:'🌊 WASSERWELLE · LAUF!'});
  const s2=[
    [-170,-2.8,1.52,7.0,4.6,'RUN'],[-182,3.1,1.64,6.4,4.4,'WAVE'],[-194,-3.2,1.76,6.2,4.3,'ESCAPE'],[-206,2.6,1.90,6.0,4.2,'100+'],
    [-218,-2.2,2.02,5.8,4.1,'RUN'],[-230,3.0,2.12,5.8,4.1,'FASTER'],[-242,-3.0,2.24,6.0,4.2,'WATER'],[-254,0,2.34,8.8,5.0,'SAFE'],[-262,0,2.34,7.2,5.0,'STAGE 2 END']
  ];
  for(const [z,x,y,w,d,label] of s2)addPlatform({x,y,z,w,h:.5,d,color:iColor(label),label,stage:2,kind:'water-key'});

  // STAGE 3 – umlaufender Aufstieg. Viele kleine, überlappende Stufen erlauben echtes Hochlaufen
  // statt erzwungener Sprünge. Von unten steigt gleichzeitig Wasser nach oben.
  addPlatform({x:0,y:2.35,z:-270,w:12,h:.58,d:8,color:safe,label:'STAGE 3',stage:3,kind:'safe-zone'});
  addSign('STAGE 3 · FLOOD TOWER',{x:0,y:6.65,z:-274},0x52dcff,.72);
  addSign('RUNTHERUM NACH OBEN · FLUT STEIGT · EMPFOHLEN SPEED 160+',{x:0,y:5.47,z:-274.02},0xffffff,.32);
  addRisingWater({x:0,z:-305,w:28,d:46,startY:-1.15,endY:12.75,h:.46,triggerZ:-278,riseSpeed:.78,holdSeconds:1.15,fallSpeed:2.25,color:0x20bce9,triggerText:'🌊 FLUT STEIGT · NACH OBEN!'});
  boxDeco(0,6.2,-305,10.5,12.5,10.5,0x123e4c);
  // Anlauf in den Turm. Die Höhenunterschiede bleiben unter der automatischen Step-Höhe,
  // damit man wirklich laufend statt springend in den Spiralweg kommt.
  addPlatform({x:0,y:2.50,z:-278,w:5.0,h:.34,d:5.0,color:0x3baec5,label:'UP',stage:3,kind:'water-stair'});
  addPlatform({x:4,y:2.58,z:-284,w:5.0,h:.34,d:5.0,color:0x329bb4,label:'UP',stage:3,kind:'water-stair'});
  addPlatform({x:8,y:2.66,z:-288,w:4.2,h:.34,d:5.0,color:0x3baec5,label:'UP',stage:3,kind:'water-stair'});
  const perimeter=[];
  const corners=[[8,-292],[8,-318],[-8,-318],[-8,-292]];
  const samplesPerSide=6,totalSides=10; // 2,5 Runden: endet oben an der Rückseite.
  for(let segment=0;segment<totalSides;segment++){
    const side=segment%4,a=corners[side],b=corners[(side+1)%4];
    for(let j=0;j<samplesPerSide;j++){
      const t=j/samplesPerSide;
      perimeter.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,side]);
    }
  }
  for(let i=0;i<perimeter.length;i++){
    const [x,z,side]=perimeter[i],y=2.78+i*.18;
    const alongX=side===1||side===3;
    addPlatform({x,y,z,w:alongX?4.2:4.0,h:.34,d:alongX?4.0:4.9,color:i%4===0?0x3fb4cb:0x2d8fa9,label:'UP',stage:3,kind:'water-stair'});
    if(i%12===0)addGlowLight(x,y+1.2,z,0x65e7ff,.38,7);
  }
  addPlatform({x:-8,y:13.48,z:-324,w:10,h:.58,d:8,color:safe,label:'TOP SAFE',stage:3,kind:'safe-zone'});
  addRingDeco(-8,15.18,-324,2.0,.07,foam,0);

  // STAGE 4 – sechs große Boost-Sprünge, abwechselnd links / rechts.
  addPlatform({x:0,y:13.48,z:-338,w:10,h:.60,d:7,color:boost,label:'BOOST START',stage:4,kind:'water-boost-pad',jumpBoost:11.8});
  addSign('STAGE 4 · BOOST LEAPS',{x:0,y:18.4,z:-339},0x5fe7ff,.72);
  addSign('6 BOOST-FLÄCHEN · RECHTS / LINKS · EMPFOHLEN SPEED 200+',{x:0,y:17.25,z:-339.02},0xffffff,.32);
  const boostPads=[[-349,-5.5],[-360,5.5],[-371,-5.5],[-382,5.5],[-393,-5.5],[-404,5.5]];
  boostPads.forEach(([z,x],i)=>{
    addPlatform({x,y:13.48,z,w:5.2,h:.56,d:5.2,color:i%2?0x3bcbe9:0x55e6ff,label:`BOOST ${i+1}`,stage:4,kind:'water-boost-pad',jumpBoost:11.8});
    addRingDeco(x,15.03,z,1.25,.055,foam,Math.PI/2);
  });
  addPlatform({x:0,y:13.48,z:-416,w:11,h:.60,d:7,color:safe,label:'STAGE 5',stage:5,kind:'safe-zone'});

  // STAGE 5 – reine Gerade. Beim Verlassen des Startfelds startet erneut eine Welle.
  addSign('STAGE 5 · FULL SPEED RUN',{x:0,y:18.25,z:-421},0x4fd8ff,.74);
  addSign('GERADEAUS RENNEN · WELLE HINTER DIR · EMPFOHLEN SPEED 230+',{x:0,y:17.08,z:-421.02},0xffffff,.32);
  addPlatform({x:0,y:13.43,z:-490,w:12,h:.52,d:135,color:0x216f87,label:'RUN 230+',stage:5,kind:'water-runway'});
  for(let z=-432,n=0;z>=-548;z-=14,n++){
    boxDeco(0,13.715,z,7.8,.035,.16,n%2?0xcff7ff:0x66dfff);
    if(n%2===0)boxDeco(-5.55,13.73,z,.12,.05,9.0,0xdaf8ff);
    if(n%2===0)boxDeco(5.55,13.73,z,.12,.05,9.0,0xdaf8ff);
  }
  addWaterWave({x:0,y:16.35,startZ:-412,triggerZ:-424,endZ:-560,w:31,h:7.2,d:2.3,speed:16.5,color:0x22bce9,triggerText:'🌊 FINAL WAVE · VOLLGAS!'});
  addPlatform({x:0,y:13.48,z:-565,w:15,h:.62,d:10,color:safe,label:'V489 TEST END',stage:5,kind:'safe-zone'});
  addSign('WATER WORLD · V489 TESTSTRECKE ENDE',{x:0,y:18.35,z:-565},0x8cecff,.62);
  addSign('WEITERE STAGES BAUEN WIR ALS NÄCHSTES',{x:0,y:17.32,z:-565.02},0xffffff,.30);
  addInteractable('water-world-test-return','Water World Test verlassen · Zum Hub',0,14.45,-565,6.5,returnHub);

  function iColor(label){return label==='100+'?0x47cde7:label==='SAFE'?safe:platform;}
}
