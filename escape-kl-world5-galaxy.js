/* Escape.KL World 5 – GALAXY WORLD V515.
   Official World-5 course. Five playable levels live fully inside the Galaxy shell.
   The world registry keeps the long-term 15-level target as metadata, while the
   current playable course intentionally ends after Level 5 at the single COMING SOON area. */
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
    awardStage=()=>0,
    teleportPlayer=()=>{},
    getCurrentWorldSpeed=()=>0,
    onWorldEnter=()=>{}
  }=api;

  // V515: Raise the complete course by 18 world units. The Galaxy shell itself
  // is centered around Level 5, so the start sits safely in the lower/front half
  // and the final boss/end area finishes near the visual middle of the sphere.
  const WORLD_Y_OFFSET=18;
  const FLOOR_Y=WORLD_Y_OFFSET+.18;
  const GALAXY_CENTER_Y=FLOOR_Y+(14*.86)-.20+(38*.93)+.85; // 66.21
  const GALAXY_CENTER_Z=-289;

  const LEVEL_REWARDS=[8_000_000_000,14_000_000_000,24_000_000_000,40_000_000_000,65_000_000_000];
  const LEVEL_SPEEDS=[50,70,85,100,120];

  // Decorative Galaxy volumes. Both share exactly the same center and have no
  // gameplay collision. The physical course below is the only walkable geometry.
  addWorldGlbModel({
    url:'./assets/escape/world5/inside-galaxy.glb?v=20260824-escape-v515-galaxy-height-center',
    name:'world5-inside-galaxy-shell',position:{x:0,y:GALAXY_CENTER_Y,z:GALAXY_CENTER_Z},fitWidth:520,
    centerX:true,centerY:true,centerZ:true,textureZoom:1.82,doubleSide:true,
    frustumCulled:true,castShadow:false,receiveShadow:false,lazy:true
  });
  addWorldGlbModel({
    url:'./assets/escape/world5/space-laufweg.glb?v=20260824-escape-v515-galaxy-height-center',
    name:'world5-space-galaxy',position:{x:0,y:GALAXY_CENTER_Y,z:GALAXY_CENTER_Z},fitWidth:470,
    pointSize:2.75,pointBudget:26000,centerX:true,centerY:true,centerZ:true,
    doubleSide:true,frustumCulled:true,castShadow:false,receiveShadow:false,lazy:true
  });

  const levelHeader=(level,z,y,speed,required=false)=>{
    addSign(`LEVEL ${level} · ${required?'SPEED BENÖTIGT':'SPEED EMPFOHLEN'} ${speed}`,{x:0,y:y+5.0,z},0xc99cff,.52);
    addSign(`${LEVEL_REWARDS[level-1].toLocaleString('de-DE')} WINS`,{x:0,y:y+4.05,z:.01+z},0xffd86b,.30);
  };

  // ---------------------------------------------------------------------------
  // LEVEL 1 · straight obstacle sprint · recommended Speed 50
  // ---------------------------------------------------------------------------
  const l1=addPlatform({x:0,y:FLOOR_Y,z:-96,w:13,h:.72,d:58,color:0x21133d,label:'',stage:1,kind:'galaxy-space-platform'});
  // Keep the start surface unmistakably visible even while the GLBs are loading.
  const l1Mats=Array.isArray(l1?.mesh?.material)?l1.mesh.material:[l1?.mesh?.material];
  for(const material of l1Mats){if(!material)continue;material.transparent=false;material.opacity=1;material.depthWrite=true;if(material.emissive?.setHex){material.emissive.setHex(0x44247f);material.emissiveIntensity=.48;}material.needsUpdate=true;}
  levelHeader(1,-69,FLOOR_Y,LEVEL_SPEEDS[0]);
  addSign('GERADE STRECKE · ÜBER DIE HINDERNISSE SPRINGEN',{x:0,y:3.05,z:-74},0xe9ddff,.28);
  for(const [i,z] of[-82,-91,-100,-109,-118].entries()){
    const low=i%2===0;
    addHazardBox({x:0,y:low?1.05:1.25,z,w:low?10.4:8.8,h:low?.80:1.15,d:1.0,color:0xb44dff,emissive:0x7c24e8,kind:'galaxy-l1-obstacle'});
  }
  addAutoTrigger('galaxy-level1-complete',0,-123,13,3,()=>awardStage(1,LEVEL_REWARDS[0],'LEVEL 1'));

  // ---------------------------------------------------------------------------
  // LEVEL 2 · ascending jump staircase · recommended Speed 70
  // ---------------------------------------------------------------------------
  const l2StartZ=-125.5;
  levelHeader(2,l2StartZ+2,2.1,LEVEL_SPEEDS[1]);
  addSign('SCHRITT FÜR SCHRITT HÖHER',{x:0,y:6.0,z:l2StartZ-1},0xaee7ff,.28);
  let l2Y=.18,l2Z=l2StartZ;
  const l2Platforms=[];
  for(let i=0;i<14;i++){
    const x=(i%4===1?2.5:i%4===3?-2.5:0);
    const gap=3.5+Math.min(2.3,i*.18);
    l2Z-=gap;
    l2Y+=.86;
    const p=addPlatform({x,y:l2Y,z:l2Z,w:i>9?4.7:5.4,h:.58,d:i>9?3.1:3.6,color:i%2?0x284d73:0x44306f,label:'',stage:2,kind:'galaxy-level2-step'});
    l2Platforms.push(p);
    if(i===4||i===9||i===13)addRingDeco(x,l2Y+2.0,l2Z,1.6,.10,i===13?0xffd86b:0x7edfff,Math.PI/2);
  }
  const l2End=l2Platforms.at(-1);
  addAutoTrigger('galaxy-level2-complete',l2End.mesh.position.x,l2End.mesh.position.z,5.5,4.0,()=>awardStage(2,LEVEL_REWARDS[1],'LEVEL 2'));

  // ---------------------------------------------------------------------------
  // LEVEL 3 · rising spiral + incoming/moving lasers · recommended Speed 85
  // ---------------------------------------------------------------------------
  const spiralCenterX=0,spiralCenterZ=-210,spiralRadius=19;
  let spiralY=l2Y-.20;
  const spiralCount=38,angleStart=Math.PI/2,angleStep=(Math.PI*3)/(spiralCount-1);
  levelHeader(3,spiralCenterZ+23,spiralY,LEVEL_SPEEDS[2]);
  addSign('SPIRAL NACH OBEN · LASERN AUSWEICHEN',{x:0,y:spiralY+4.1,z:spiralCenterZ+19},0xff8cdd,.28);
  let lastSpiral=null;
  for(let i=0;i<spiralCount;i++){
    const a=angleStart+i*angleStep;
    const x=spiralCenterX+Math.cos(a)*spiralRadius;
    const z=spiralCenterZ+Math.sin(a)*spiralRadius;
    spiralY+=.93;
    const p=addPlatform({x,y:spiralY,z,w:5.3,h:.52,d:5.3,color:i%3===0?0x482b72:i%3===1?0x263f72:0x3b245f,label:'',stage:3,kind:'galaxy-level3-spiral'});
    lastSpiral=p;
    if(i>=5&&i%5===0){
      const jumpLaser=(i/5)%2<1;
      addHazardBox({
        x,y:spiralY+(jumpLaser?.86:1.55),z,
        w:jumpLaser?6.9:1.05,h:jumpLaser?.46:3.1,d:jumpLaser?1.0:6.4,
        color:0xff315f,emissive:0xff1746,
        motion:{axis:jumpLaser?'x':'z',amp:3.1,speed:1.45+i*.015,phase:i*.63},
        kind:'galaxy-laser'
      });
    }
    if(i%8===0)addGlowLight(x,spiralY+2.2,z,0xa35cff,.55,7);
  }
  addAutoTrigger('galaxy-level3-complete',lastSpiral.mesh.position.x,lastSpiral.mesh.position.z,5.8,5.8,()=>awardStage(3,LEVEL_REWARDS[2],'LEVEL 3'));

  // ---------------------------------------------------------------------------
  // LEVEL 4 · five random symbol doors · wrong door => beginning of Level 4
  // ---------------------------------------------------------------------------
  const l4Y=spiralY+.85,l4StartZ=-234,l4EndZ=-265;
  const l4Floor=addPlatform({x:0,y:l4Y,z:(l4StartZ+l4EndZ)/2,w:18,h:.60,d:39,color:0x1c2849,label:'',stage:4,kind:'galaxy-level4-doors'});
  levelHeader(4,l4StartZ+4,l4Y,LEVEL_SPEEDS[3]);
  addSign('5 TÜR-PRÜFUNGEN · FALSCH = LEVELSTART',{x:0,y:l4Y+4.0,z:l4StartZ+1},0xffffff,.25);
  addCollider(-9.35,(l4StartZ+l4EndZ)/2,.7,39);
  addCollider(9.35,(l4StartZ+l4EndZ)/2,.7,39);

  const symbols=[
    {id:'square',name:'VIERECK ROT',glyph:'■',color:0xff3d4f,x:-6},
    {id:'triangle',name:'DREIECK GRÜN',glyph:'▲',color:0x4cff78,x:0},
    {id:'circle',name:'KREIS BLAU',glyph:'●',color:0x3da0ff,x:6}
  ];
  const doorRows=[-240,-246,-252,-258,-264];
  const doorTargetSigns=[];
  let doorTargets=[];
  let doorStep=0;
  const l4StartY=l4Y+.60/2+.86;
  const resetDoorTargets=()=>{
    doorTargets=doorRows.map(()=>Math.floor(Math.random()*symbols.length));
    doorStep=0;
    for(let row=0;row<doorRows.length;row++)for(let s=0;s<symbols.length;s++)doorTargetSigns[row][s].visible=s===doorTargets[row];
  };
  const announceDoor=()=>{
    const target=symbols[doorTargets[Math.min(doorStep,doorTargets.length-1)]||0];
    worldToast(`🚪 TÜR ${Math.min(doorStep+1,5)}/5 · LAUFE DURCH ${target.name}`,'good',2300);
  };
  doorRows.forEach((rowZ,row)=>{
    // Solid divider segments; only the three symbol openings remain passable.
    for(const seg of[
      {x:-8.25,w:1.5},{x:-3,w:3},{x:3,w:3},{x:8.25,w:1.5}
    ]){boxDeco(seg.x,l4Y+1.55,rowZ,seg.w,3.1,.55,0x171425,0x3b275e);addCollider(seg.x,rowZ,seg.w,.62);}
    doorTargetSigns[row]=symbols.map(sym=>{
      const target=addSign(`ZIEL: ${sym.glyph} ${sym.name}`,{x:0,y:l4Y+5.0,z:rowZ+2.15},sym.color,.24);target.visible=false;return target;
    });
    for(const sym of symbols){
      // Door frame + symbol marker.
      boxDeco(sym.x-1.52,l4Y+1.55,rowZ,0.24,3.15,.45,sym.color,sym.color);
      boxDeco(sym.x+1.52,l4Y+1.55,rowZ,0.24,3.15,.45,sym.color,sym.color);
      boxDeco(sym.x,l4Y+3.05,rowZ,3.25,.22,.45,sym.color,sym.color);
      addSign(`${sym.glyph}`,{x:sym.x,y:l4Y+2.4,z:rowZ+.31},sym.color,.27);
      addAutoTrigger(`galaxy-door-${row}-${sym.id}`,sym.x,rowZ,2.75,1.15,()=>{
        if(row!==doorStep)return;
        const expected=doorTargets[row];
        if(symbols[expected]?.id!==sym.id){
          worldToast(`❌ FALSCHE TÜR · gesucht war ${symbols[expected].name}`,'bad',2200);
          doorStep=0;
          teleportPlayer(0,l4StartY,l4StartZ+2.5);
          return;
        }
        doorStep++;
        if(doorStep>=5){awardStage(4,LEVEL_REWARDS[3],'LEVEL 4');worldToast('✅ ALLE 5 SYMBOLE RICHTIG · LEVEL 5 OFFEN','good',2600);}
        else announceDoor();
      });
    }
  });
  addAutoTrigger('galaxy-level4-start',0,l4StartZ+1.8,16,3.2,()=>{if(!doorTargets.length)resetDoorTargets();announceDoor();});

  // ---------------------------------------------------------------------------
  // LEVEL 5 · Speed-120 boss charge arena. Five passes through the active boss
  // position break the barrier. The final Win pad sits to the right of COMING SOON.
  // ---------------------------------------------------------------------------
  const l5Y=l4Y,l5GateZ=-271,bossCenterZ=-285;
  levelHeader(5,l5GateZ+3,l5Y,LEVEL_SPEEDS[4],true);
  addSign('SPEED 120 · BOSS 5× DURCHLAUFEN',{x:0,y:l5Y+4.0,z:l5GateZ+1},0xff9ae7,.28);
  addPlatform({x:0,y:l5Y,z:l5GateZ,w:5.2,h:.58,d:5.0,color:0x6e2b8c,label:'120',stage:5,kind:'galaxy-level5-speed-gate',requiredSpeed:120});
  addPlatform({x:0,y:l5Y,z:bossCenterZ,w:22,h:.62,d:25,color:0x201631,label:'',stage:5,kind:'galaxy-level5-arena'});
  for(const x of[-10.7,10.7])boxDeco(x,l5Y+1.6,bossCenterZ,.40,3.2,25,0x3b2459,0x5f32a2);

  const bossBody=boxDeco(0,l5Y+2.55,bossCenterZ,3.2,4.8,3.2,0xff3e8b,0xff176d);
  const bossRingA=addRingDeco(0,l5Y+2.5,bossCenterZ,2.45,.16,0xff56c9,Math.PI/2);
  const bossRingB=addRingDeco(0,l5Y+2.5,bossCenterZ,1.55,.10,0x8e6bff,0);
  const hpSigns=[];
  for(let hp=0;hp<=5;hp++){
    const s=addSign(hp?`GALAXY BOSS · HP ${hp}/5`:'GALAXY BOSS BESIEGT',{x:0,y:l5Y+6.0,z:bossCenterZ+10.4},hp?0xff77c8:0x76ffb0,.34);s.visible=false;hpSigns[hp]=s;
  }
  const barrier=boxDeco(0,l5Y+3.1,-299,22,6.2,1.2,0xb138ff,0x7414d8);
  const bossPositions=[
    {x:0,z:-279},{x:7,z:-285},{x:0,z:-292},{x:-7,z:-285},{x:0,z:-285}
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
    setBossVisible(false);setBossPos(bossPositions[0]);
    barrier.visible=true;setHpSign();
  };
  const startBoss=()=>{
    if(getCurrentWorldSpeed()+1e-6<120){worldToast(`🔒 LEVEL 5 · SPEED ${Math.round(getCurrentWorldSpeed())}/120`,'bad',2200);return;}
    if(bossDefeated||bossStarted)return;
    bossStarted=true;setBossVisible(true);setBossPos(bossPositions[0]);setHpSign();
    worldToast('👾 GALAXY BOSS · LAUFE 5× DURCH IHN HINDURCH!','bad',2600);
  };
  addAutoTrigger('galaxy-level5-boss-start',0,-274,18,3.6,()=>{if(getCurrentWorldSpeed()+1e-6<120){worldToast(`🔒 LEVEL 5 · SPEED ${Math.round(getCurrentWorldSpeed())}/120`,'bad',2200);teleportPlayer(0,l5Y+.60/2+.86,-267.5);return;}startBoss();});
  bossPositions.forEach((pos,index)=>addAutoTrigger(`galaxy-boss-hit-${index}`,pos.x,pos.z,3.4,3.4,()=>{
    if(!bossStarted||bossDefeated||bossPhase!==index||getCurrentWorldSpeed()+1e-6<120)return;
    bossHp=Math.max(0,bossHp-1);
    if(bossHp<=0){
      bossDefeated=true;bossStarted=true;setBossVisible(false);barrier.visible=false;setHpSign();
      worldToast('💥 GALAXY BOSS BESIEGT · BARRIERE OFFEN','good',3000);
      return;
    }
    bossPhase=(bossPhase+1)%bossPositions.length;setBossPos(bossPositions[bossPhase]);setHpSign();
    worldToast(`⚡ TREFFER · BOSS HP ${bossHp}/5`,'good',1200);
  }));
  addAutoTrigger('galaxy-boss-barrier',0,-299,21.5,2.0,()=>{
    if(bossDefeated)return;
    worldToast('🛑 GALAXY-BARRIERE · zuerst den Boss besiegen','bad',1800);
    teleportPlayer(0,l5Y+.62/2+.86,-291.5);
  });

  // Final official current endpoint. This is the only visible COMING SOON marker.
  addPlatform({x:0,y:l5Y,z:-307,w:20,h:.64,d:11,color:0x21163c,label:'',stage:5,kind:'galaxy-current-end'});
  addSign('COMING SOON',{x:-2.0,y:l5Y+5.1,z:-307},0xc99cff,.62);
  addSign('GALAXY WORLD',{x:-2.0,y:l5Y+4.05,z:-307},0xffffff,.27);
  addPlatform({x:6.3,y:l5Y+.10,z:-307,w:5.0,h:.74,d:5.2,color:0xd5a93e,label:'+65B WINS',stage:5,kind:'win-pad',winReward:LEVEL_REWARDS[4],winStage:5});
  addSign('65.000.000.000 WINS',{x:6.3,y:l5Y+4.65,z:-307},0xffd86b,.27);

  // Reset every run so random doors and the boss are fresh when Galaxy World is entered.
  onWorldEnter(()=>{
    resetDoorTargets();
    resetBoss();
  });
}
