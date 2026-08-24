/* Escape.KL World 5 – GALAXY WORLD V518.
   Course lifted deep into the visible Galaxy, signage cleaned up, and Wins are
   claimed only once after defeating Level 5. */
export function buildGalaxyWorld(api){
  const {
    addPlatform,
    addSign,
    boxDeco,
    addRingDeco,
    addGlowLight,
    addCollider,
    addAutoTrigger,
    addHazardBox,
    addWorldGlbModel=()=>null,
    worldToast=()=>{},
    teleportPlayer=()=>{},
    getCurrentWorldSpeed=()=>0,
    onWorldEnter=()=>{},
    returnHub=()=>{}
  }=api;

  // V517: the entire playable course lives in the middle volume of the sphere.
  // Level 1 starts high enough to be clearly visible; Level 5 ends at the exact
  // visual Galaxy center instead of near the shell edge.
  const WORLD_BASE_Y=180;
  const FLOOR_Y=WORLD_BASE_Y+.25;
  const GALAXY_CENTER_X=0;
  const GALAXY_CENTER_Y=90;
  const GALAXY_CENTER_Z=-260;

  const FINAL_WIN_REWARD=65_000_000_000;
  const LEVEL_SPEEDS=[50,70,85,100,120];

  addWorldGlbModel({
    url:'./assets/escape/world5/inside-galaxy.glb?v=20260824-escape-v518-inside-galaxy-course',
    name:'world5-inside-galaxy-shell',
    position:{x:GALAXY_CENTER_X,y:GALAXY_CENTER_Y,z:GALAXY_CENTER_Z},
    fitWidth:520,centerX:true,centerY:true,centerZ:true,textureZoom:1.82,doubleSide:true,
    frustumCulled:true,castShadow:false,receiveShadow:false,lazy:true
  });
  addWorldGlbModel({
    url:'./assets/escape/world5/space-laufweg.glb?v=20260824-escape-v518-inside-galaxy-course',
    name:'world5-space-galaxy',
    position:{x:GALAXY_CENTER_X,y:GALAXY_CENTER_Y,z:GALAXY_CENTER_Z},
    fitWidth:470,pointSize:2.85,pointBudget:26000,centerX:true,centerY:true,centerZ:true,
    doubleSide:true,frustumCulled:true,castShadow:false,receiveShadow:false,lazy:true
  });

  const levelHeader=(level,z,y,speed,required=false)=>{
    addSign(`LEVEL ${level} · SPEED ${required?'BENÖTIGT':'EMPFOHLEN'} ${speed}`,{x:0,y:y+4.25,z},0xc99cff,.42);
  };

  // ---------------------------------------------------------------------------
  // LEVEL 1 · centered straight sprint with increasingly awkward jump obstacles.
  // The spawn pad is already the beginning of Level 1. Walking backwards returns
  // directly to the Hub while walking forward starts the course immediately.
  // ---------------------------------------------------------------------------
  const startZ=-153;
  const l1=addPlatform({x:0,y:FLOOR_Y,z:startZ,w:14,h:.72,d:20,color:0x2b1850,label:'',stage:1,kind:'galaxy-space-platform'});
  const l1Mats=Array.isArray(l1?.mesh?.material)?l1.mesh.material:[l1?.mesh?.material];
  for(const material of l1Mats){
    if(!material)continue;
    material.transparent=false;material.opacity=1;material.depthWrite=true;
    if(material.emissive?.setHex){material.emissive.setHex(0x512a93);material.emissiveIntensity=.55;}
    material.needsUpdate=true;
  }
  addSign('← HUB',{x:0,y:FLOOR_Y+3.0,z:-147.6},0x9fdcff,.27);
  addAutoTrigger('galaxy-world5-return-hub',0,-146.4,12.5,2.2,()=>returnHub());

  // One long, unmistakable Level-1 runway. It is centered on X=0 and physically
  // overlaps the start pad so there is no invisible gap or height mismatch.
  addPlatform({x:0,y:FLOOR_Y,z:-187,w:13,h:.72,d:58,color:0x21133d,label:'',stage:1,kind:'galaxy-level1-runway'});
  levelHeader(1,-160,FLOOR_Y,LEVEL_SPEEDS[0]);
  addSign('GERADE · HINDERNISSE ÜBERSPRINGEN',{x:0,y:FLOOR_Y+2.65,z:-164},0xe9ddff,.25);

  const l1Obstacles=[
    {z:-171,w:10.7,h:.72},{z:-181,w:8.8,h:1.00},{z:-191,w:11.0,h:.78},
    {z:-201,w:7.8,h:1.12},{z:-211,w:10.2,h:.90}
  ];
  l1Obstacles.forEach((o,i)=>{
    addHazardBox({x:i%2===1?(i===1?-1.2:1.2):0,y:FLOOR_Y+.36+o.h/2,z:o.z,w:o.w,h:o.h,d:1.15,
      color:i%2?0xd451ff:0x8a55ff,emissive:i%2?0xa624e8:0x6238db,kind:'galaxy-l1-obstacle'});
    addRingDeco(i%2===1?(i===1?-1.2:1.2):0,FLOOR_Y+2.25,o.z,1.45,.09,0xd9b8ff,Math.PI/2);
  });

  // ---------------------------------------------------------------------------
  // LEVEL 2 · real ascending long jumps. Large landing pads + growing gaps make
  // the route readable while the vertical climb stays below the normal jump apex.
  // ---------------------------------------------------------------------------
  const l2StartZ=-221;
  let l2Y=FLOOR_Y+.35;
  let l2Z=l2StartZ;
  levelHeader(2,l2StartZ+1,l2Y,LEVEL_SPEEDS[1]);
  addSign('LANGE SPRÜNGE · IMMER HÖHER',{x:0,y:l2Y+2.70,z:l2StartZ-1.5},0xaee7ff,.25);

  const l2Pads=[];
  const l2Xs=[0,1.4,-1.5,1.7,-1.7,1.2,0];
  for(let i=0;i<7;i++){
    if(i>0){l2Z-=5.10+(i*.08);l2Y+=.92;}
    const p=addPlatform({x:l2Xs[i],y:l2Y,z:l2Z,w:i<3?6.6:6.0,h:.62,d:i<3?4.0:3.7,
      color:i%2?0x2e537d:0x493579,label:'',stage:2,kind:'galaxy-level2-longjump'});
    l2Pads.push(p);
    if(i===2||i===4||i===6)addRingDeco(l2Xs[i],l2Y+2.0,l2Z,1.55,.10,0x80e6ff,Math.PI/2);
  }
  const l2End=l2Pads.at(-1);
  // A safe connector platform leads naturally into the spiral entrance.
  addPlatform({x:0,y:l2Y+.35,z:-258.2,w:7.0,h:.62,d:5.2,color:0x304c73,label:'',stage:2,kind:'galaxy-level2-exit'});

  // ---------------------------------------------------------------------------
  // LEVEL 3 · compact double spiral, centered around X=0. It rises through the
  // middle of the sphere instead of circling near the shell. Moving lasers force
  // jumping and left/right dodging, but every landing remains clearly visible.
  // ---------------------------------------------------------------------------
  const spiralCenterX=0;
  const spiralCenterZ=-271;
  const spiralRadius=12.2;
  let spiralY=l2Y+.65;
  const spiralCount=26;
  const angleStart=Math.PI/2;
  const angleStep=(Math.PI*3)/(spiralCount-1); // 1.5 turns: entrance front, exit rear.
  levelHeader(3,-258,spiralY,LEVEL_SPEEDS[2]);
  addSign('SPIRALE · LASERN AUSWEICHEN',{x:0,y:spiralY+2.75,z:-261.5},0xff8cdd,.25);

  let lastSpiral=null;
  for(let i=0;i<spiralCount;i++){
    const a=angleStart+i*angleStep;
    const x=spiralCenterX+Math.cos(a)*spiralRadius;
    const z=spiralCenterZ+Math.sin(a)*spiralRadius;
    spiralY+=.72;
    const p=addPlatform({x,y:spiralY,z,w:5.6,h:.56,d:5.6,
      color:i%3===0?0x512f7d:i%3===1?0x2d4d82:0x3c2869,label:'',stage:3,kind:'galaxy-level3-spiral'});
    lastSpiral=p;
    if(i>=4&&i%4===0){
      const horizontal=(i/4)%2===1;
      addHazardBox({
        x,y:spiralY+(horizontal?.83:1.55),z,
        w:horizontal?7.4:1.05,h:horizontal?.42:3.0,d:horizontal?1.0:6.8,
        color:0xff315f,emissive:0xff1746,
        motion:{axis:horizontal?'x':'z',amp:2.7,speed:1.25+i*.018,phase:i*.57},
        kind:'galaxy-laser'
      });
    }
    if(i%5===0)addGlowLight(x,spiralY+2.1,z,0xa35cff,.52,7);
  }
  addPlatform({x:0,y:spiralY+.25,z:-286,w:8,h:.62,d:6,color:0x402b67,label:'',stage:3,kind:'galaxy-level3-exit'});

  // ---------------------------------------------------------------------------
  // LEVEL 4 · centered symbol corridor. Five rows, exactly three doors per row.
  // Wrong symbol returns to the safe Level-4 start pad.
  // ---------------------------------------------------------------------------
  const l4Y=spiralY+.75;
  const l4StartZ=-291;
  const l4EndZ=-321;
  addPlatform({x:0,y:l4Y,z:(l4StartZ+l4EndZ)/2,w:18,h:.64,d:36,color:0x1c2849,label:'',stage:4,kind:'galaxy-level4-doors'});
  levelHeader(4,l4StartZ+2,l4Y,LEVEL_SPEEDS[3]);
  addSign('5 TÜREN · FALSCH = LEVELSTART',{x:0,y:l4Y+2.75,z:l4StartZ-1.5},0xffffff,.23);
  addCollider(-9.35,(l4StartZ+l4EndZ)/2,.7,36);
  addCollider(9.35,(l4StartZ+l4EndZ)/2,.7,36);

  const symbols=[
    {id:'square',name:'VIERECK ROT',glyph:'■',color:0xff3d4f,x:-6},
    {id:'triangle',name:'DREIECK GRÜN',glyph:'▲',color:0x4cff78,x:0},
    {id:'circle',name:'KREIS BLAU',glyph:'●',color:0x3da0ff,x:6}
  ];
  const doorRows=[-295,-301,-307,-313,-319];
  const doorTargetSigns=[];
  let doorTargets=[];
  let doorStep=0;
  const l4StartPlayerY=l4Y+.64/2+.86;
  const refreshDoorTargetSigns=()=>{
    for(let row=0;row<doorTargetSigns.length;row++){
      const signs=doorTargetSigns[row]||[];
      for(let s=0;s<signs.length;s++)signs[s].visible=row===doorStep&&s===doorTargets[row];
    }
  };
  const resetDoorTargets=()=>{
    doorTargets=doorRows.map(()=>Math.floor(Math.random()*symbols.length));
    doorStep=0;
    refreshDoorTargetSigns();
  };
  const announceDoor=()=>{
    const target=symbols[doorTargets[Math.min(doorStep,doorTargets.length-1)]||0];
    worldToast(`🚪 TÜR ${Math.min(doorStep+1,5)}/5 · ${target.name}`,'good',2300);
  };
  doorRows.forEach((rowZ,row)=>{
    for(const seg of[{x:-8.25,w:1.5},{x:-3,w:3},{x:3,w:3},{x:8.25,w:1.5}]){
      boxDeco(seg.x,l4Y+1.55,rowZ,seg.w,3.1,.55,0x171425,0x3b275e);
      addCollider(seg.x,rowZ,seg.w,.62);
    }
    doorTargetSigns[row]=symbols.map(sym=>{
      const target=addSign(`ZIEL: ${sym.glyph} ${sym.name}`,{x:0,y:l4Y+5.0,z:rowZ+2.1},sym.color,.24);
      target.visible=false;
      return target;
    });
    for(const sym of symbols){
      boxDeco(sym.x-1.52,l4Y+1.55,rowZ,0.24,3.15,.45,sym.color,sym.color);
      boxDeco(sym.x+1.52,l4Y+1.55,rowZ,0.24,3.15,.45,sym.color,sym.color);
      boxDeco(sym.x,l4Y+3.05,rowZ,3.25,.22,.45,sym.color,sym.color);
      addSign(sym.glyph,{x:sym.x,y:l4Y+2.4,z:rowZ+.31},sym.color,.27);
      addAutoTrigger(`galaxy-door-${row}-${sym.id}`,sym.x,rowZ,2.75,1.15,()=>{
        if(row!==doorStep)return;
        const expected=doorTargets[row];
        if(symbols[expected]?.id!==sym.id){
          worldToast(`❌ FALSCHE TÜR · gesucht war ${symbols[expected].name}`,'bad',2200);
          doorStep=0;
          refreshDoorTargetSigns();
          teleportPlayer(0,l4StartPlayerY,l4StartZ+1.8);
          return;
        }
        doorStep++;
        refreshDoorTargetSigns();
        if(doorStep>=5){
          worldToast('✅ 5/5 RICHTIG · LEVEL 5 OFFEN','good',2500);
        }else announceDoor();
      });
    }
  });
  addAutoTrigger('galaxy-level4-start',0,l4StartZ+1.5,16,3.0,()=>{if(!doorTargets.length)resetDoorTargets();announceDoor();});

  // ---------------------------------------------------------------------------
  // LEVEL 5 · Speed 120 gate + rising charge bridge + boss arena. The boss arena
  // the boss arena stays at the end of the course, while the shell itself is centered around the full run.
  // ---------------------------------------------------------------------------
  const l5Y=l4Y+5.40;
  const l5GateZ=-324;
  const bossCenterZ=-338;
  levelHeader(5,l5GateZ+2,l4Y,LEVEL_SPEEDS[4],true);
  addSign('ZUM BOSS HOCHSPRINGEN',{x:0,y:l4Y+2.75,z:l5GateZ},0xff9ae7,.24);

  // Three broad ascending approach pads make the Level-5 entrance readable and
  // bring the player from the door corridor up to the central boss arena.
  const bridgeYs=[l4Y+.95,l4Y+1.90,l4Y+2.85,l4Y+3.80,l5Y];
  const bridgeZs=[-324,-327.5,-331,-334.5,-336.5];
  bridgeYs.forEach((y,i)=>addPlatform({x:i%2?1.7:-1.7,y,z:bridgeZs[i],w:i===3?8.2:6.2,h:.62,d:3.4,
    color:i===bridgeYs.length-1?0x7a2d9b:0x563070,label:i===0?'120':'',stage:5,kind:'galaxy-level5-bridge',requiredSpeed:120}));

  addPlatform({x:0,y:l5Y,z:bossCenterZ,w:24,h:.68,d:24,color:0x211632,label:'',stage:5,kind:'galaxy-level5-arena',requiredSpeed:120});
  for(const x of[-11.7,11.7])boxDeco(x,l5Y+1.6,bossCenterZ,.38,3.2,24,0x3b2459,0x5f32a2);

  const bossBody=boxDeco(0,l5Y+2.55,bossCenterZ,3.4,4.9,3.4,0xff3e8b,0xff176d);
  const bossRingA=addRingDeco(0,l5Y+2.5,bossCenterZ,2.55,.16,0xff56c9,Math.PI/2);
  const bossRingB=addRingDeco(0,l5Y+2.5,bossCenterZ,1.60,.10,0x8e6bff,0);
  const hpSigns=[];
  for(let hp=0;hp<=5;hp++){
    const s=addSign(hp?`GALAXY BOSS · HP ${hp}/5`:'GALAXY BOSS BESIEGT',{x:0,y:l5Y+6.0,z:bossCenterZ+10.2},hp?0xff77c8:0x76ffb0,.34);
    s.visible=false;hpSigns[hp]=s;
  }

  const barrier=boxDeco(0,l5Y+3.1,-352,22,6.2,1.2,0xb138ff,0x7414d8);
  const bossPositions=[
    {x:0,z:-332},{x:7,z:-338},{x:0,z:-344},{x:-7,z:-338},{x:0,z:-338}
  ];
  let bossHp=5,bossPhase=0,bossStarted=false,bossDefeated=false;
  const setBossVisible=visible=>{bossBody.visible=visible;bossRingA.visible=visible;bossRingB.visible=visible;};
  const setBossPos=pos=>{
    bossBody.position.set(pos.x,l5Y+2.55,pos.z);
    bossRingA.position.set(pos.x,l5Y+2.5,pos.z);
    bossRingB.position.set(pos.x,l5Y+2.5,pos.z);
  };
  const setHpSign=()=>{for(let hp=0;hp<=5;hp++)hpSigns[hp].visible=bossStarted&&hp===bossHp;};
  const resetBoss=()=>{
    bossHp=5;bossPhase=0;bossStarted=false;bossDefeated=false;
    setBossVisible(false);setBossPos(bossPositions[0]);barrier.visible=true;setHpSign();
  };
  const startBoss=()=>{
    if(getCurrentWorldSpeed()+1e-6<120){
      worldToast(`🔒 LEVEL 5 · SPEED ${Math.round(getCurrentWorldSpeed())}/120`,'bad',2200);return;
    }
    if(bossDefeated||bossStarted)return;
    bossStarted=true;setBossVisible(true);setBossPos(bossPositions[0]);setHpSign();
    worldToast('👾 GALAXY BOSS · 5× DURCH IHN HINDURCH!','bad',2600);
  };
  addAutoTrigger('galaxy-level5-boss-start',0,-334,14,4.0,()=>{
    if(getCurrentWorldSpeed()+1e-6<120){
      worldToast(`🔒 LEVEL 5 · SPEED ${Math.round(getCurrentWorldSpeed())}/120`,'bad',2200);
      teleportPlayer(0,l4Y+.64/2+.86,-321.5);return;
    }
    startBoss();
  });
  bossPositions.forEach((pos,index)=>addAutoTrigger(`galaxy-boss-hit-${index}`,pos.x,pos.z,3.5,3.5,()=>{
    if(!bossStarted||bossDefeated||bossPhase!==index||getCurrentWorldSpeed()+1e-6<120)return;
    bossHp=Math.max(0,bossHp-1);
    if(bossHp<=0){
      bossDefeated=true;setBossVisible(false);barrier.visible=false;setHpSign();
      worldToast('💥 GALAXY BOSS BESIEGT · BARRIERE OFFEN','good',3000);return;
    }
    bossPhase=(bossPhase+1)%bossPositions.length;
    setBossPos(bossPositions[bossPhase]);setHpSign();
    worldToast(`⚡ TREFFER · BOSS HP ${bossHp}/5`,'good',1200);
  }));
  addAutoTrigger('galaxy-boss-barrier',0,-352,21.5,2.0,()=>{
    if(bossDefeated)return;
    worldToast('🛑 GALAXY-BARRIERE · zuerst den Boss besiegen','bad',1800);
    teleportPlayer(0,l5Y+.68/2+.86,-346.5);
  });

  // Official current endpoint: no teaser text anywhere else in the world.
  addPlatform({x:0,y:l5Y,z:-360,w:20,h:.68,d:12,color:0x21163c,label:'',stage:5,kind:'galaxy-current-end'});
  addSign('COMING SOON',{x:-2.0,y:l5Y+5.1,z:-360},0xc99cff,.62);
  addPlatform({x:6.3,y:l5Y+.10,z:-360,w:5.0,h:.74,d:5.2,color:0xd5a93e,label:'WINS',stage:5,kind:'win-pad',winReward:FINAL_WIN_REWARD,winStage:5});
  addSign('WINS ABHOLEN · 65 MRD',{x:6.3,y:l5Y+4.65,z:-360},0xffd86b,.27);

  onWorldEnter(()=>{
    resetDoorTargets();
    resetBoss();
  });
}
