/* Escape.kl world registry V437 – worlds stay data-driven so new routes can be added cleanly. */
export const ESCAPE_WORLD_DEFS = Object.freeze([
  Object.freeze({
    id:'keyboard-lab',
    name:'Keyboard Lab',
    number:1,
    stageCount:15,
    requiredLifetimeWins:0,
    finishBonusWins:20,
    accent:0x58ddff,
    background:0x07111d,
    fog:0x07111d,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:13.2,
    backtrackAllowance:5.2,
    time2:240,
    time3:175,
    stageRewards:Object.freeze([1,2,3,4,5,6,8,10,12,15,20,25,30,40,50]),
    difficulty:'LEICHT → MITTEL',
    description:'Einsteigerwelt mit 15 klaren Keyboard-Stages, breiten Keycaps und fairen Sprüngen. Jede Stage endet an einem gelben WIN-Pad.'
  }),
  Object.freeze({
    id:'candy-keys',
    name:'Candy Keys',
    number:2,
    stageCount:10,
    requiredLifetimeWins:200,
    finishBonusWins:60,
    accent:0xff77bb,
    background:0x241023,
    fog:0x241023,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:12.8,
    backtrackAllowance:4.6,
    time2:215,
    time3:155,
    stageRewards:Object.freeze([30,40,55,70,90,120,160,220,300,400]),
    difficulty:'MITTEL',
    description:'Süßigkeiten-Keyboards mit Schokolade, Candy-Bar-Sprüngen und ersten beweglichen Tasten. Spürbar schwerer als Welt 1.'
  }),
  Object.freeze({
    id:'toxic-keyboard',
    name:'Toxic Keyboard',
    number:3,
    stageCount:10,
    requiredLifetimeWins:1200,
    finishBonusWins:180,
    accent:0x75ff72,
    background:0x071a0d,
    fog:0x071a0d,
    start:{x:0,y:1.50,z:-70},
    laneHalfWidth:12.0,
    backtrackAllowance:4.0,
    time2:245,
    time3:185,
    stageRewards:Object.freeze([120,170,230,310,420,560,750,1000,1350,1800]),
    difficulty:'SCHWER',
    description:'Giftige Keycaps, schmalere Sprünge, Slider und instabile Glitch-Tasten. Welt 3 verlangt deutlich mehr Speed und Kontrolle.'
  }),
  Object.freeze({
    id:'cyber-city',
    name:'Cyber City',
    number:4,
    stageCount:10,
    requiredLifetimeWins:7000,
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
