/* Escape.kl world registry V440 – rebalanced long-term level gates and staged world difficulty. */
export const ESCAPE_WORLD_DEFS = Object.freeze([
  Object.freeze({
    id:'keyboard-lab',
    name:'Keyboard Lab',
    number:1,
    stageCount:15,
    requiredLevel:0,
    finishBonusWins:5000,
    accent:0x58ddff,
    background:0x07111d,
    fog:0x07111d,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:13.2,
    backtrackAllowance:5.2,
    time2:240,
    time3:175,
    stageRewards:Object.freeze([10,20,35,60,100,175,300,500,800,1200,2000,3500,6000,10000,15000]),
    difficulty:'LEICHT → MITTEL',
    description:'Einsteigerwelt mit 15 klaren Keyboard-Stages, breiten Keycaps und fairen Sprüngen. Jeder Laufpunkt baut Speed/Level auf, jede Stage endet an einem gelben WIN-Pad.'
  }),
  Object.freeze({
    id:'candy-keys',
    name:'Candy Keys',
    number:2,
    stageCount:10,
    requiredLevel:250,
    finishBonusWins:500000,
    accent:0xff77bb,
    background:0x241023,
    fog:0x241023,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:12.8,
    backtrackAllowance:4.6,
    time2:215,
    time3:155,
    stageRewards:Object.freeze([25000,40000,65000,100000,175000,300000,500000,800000,1200000,2000000]),
    difficulty:'MITTEL',
    description:'Ab Level 250: Süßigkeiten-Keyboards mit Schokolade, Candy-Bar-Sprüngen und ersten beweglichen Tasten. Spürbar schwerer als Welt 1.'
  }),
  Object.freeze({
    id:'toxic-keyboard',
    name:'Toxic Keyboard',
    number:3,
    stageCount:10,
    requiredLevel:800,
    finishBonusWins:100000000,
    accent:0x75ff72,
    background:0x071a0d,
    fog:0x071a0d,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:12.0,
    backtrackAllowance:4.0,
    time2:245,
    time3:185,
    stageRewards:Object.freeze([5000000,8000000,12000000,20000000,35000000,60000000,100000000,175000000,300000000,500000000]),
    difficulty:'SCHWER',
    description:'Ab Level 800: Giftige Keycaps, schmalere Sprünge, Slider und instabile Glitch-Tasten. Welt 3 verlangt deutlich mehr Speed und Kontrolle.'
  }),
  Object.freeze({
    id:'cyber-city',
    name:'Cyber City',
    number:4,
    stageCount:10,
    requiredLevel:1400,
    finishBonusWins:500,
    accent:0x6d74ff,
    locked:true,
    difficulty:'COMING SOON',
    description:'Vorbereitet für ein späteres Update: Neon-Keyboards, Laser und Server-Plattformen.'
  })
]);

export function escapeWorldById(id){
  return ESCAPE_WORLD_DEFS.find(world=>world.id===id)||null;
}
