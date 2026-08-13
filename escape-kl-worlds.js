/* Escape.kl world registry – new worlds are added here without rewriting the game core. */
export const ESCAPE_WORLD_DEFS = Object.freeze([
  Object.freeze({
    id:'keyboard-lab',
    name:'Keyboard Lab',
    number:1,
    requiredWins:0,
    rewardWins:1,
    accent:0x58ddff,
    time2:150,
    time3:105,
    description:'Die erste Escape.kl-Welt: riesige Keycaps, bewegliche Tasten, Spacebar-Sprünge und Glitch-Felder.'
  }),
  Object.freeze({
    id:'candy-keys',
    name:'Candy Keys',
    number:2,
    requiredWins:15,
    rewardWins:5,
    locked:true,
    description:'Vorbereitet für das nächste Update: klebrige Süßigkeiten-Keycaps und Schokoladen-Fallen.'
  }),
  Object.freeze({
    id:'toxic-keyboard',
    name:'Toxic Keyboard',
    number:3,
    requiredWins:60,
    rewardWins:20,
    locked:true,
    description:'Vorbereitet: Säure, Giftflächen und zerfallende Tasten.'
  }),
  Object.freeze({
    id:'cyber-city',
    name:'Cyber City',
    number:4,
    requiredWins:180,
    rewardWins:60,
    locked:true,
    description:'Vorbereitet: Neon-Keyboards, Laser und Server-Plattformen.'
  })
]);

export function escapeWorldById(id){
  return ESCAPE_WORLD_DEFS.find(world=>world.id===id)||null;
}
