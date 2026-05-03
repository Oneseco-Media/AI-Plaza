// AI Town World Engine Logic

export type PointOfInterest = {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'Bar' | 'Shop' | 'Corp' | 'Hideout';
  district: string;
};

export type Persona = {
  trait: string;
  aggressiveness: number; // 1-10
  sociability: number; // 1-10
  greed: number; // 1-10
  curiosity: number; // 1-10
};

export type InventoryItem = {
  id: string;
  name: string;
  value: number;
  type: 'Scrap' | 'Data' | 'Weapon' | 'Tech';
};

export type WorldState = {
  globalMood: 'Tense' | 'Peaceful' | 'Chaotic' | 'Optimistic' | 'Suspicious';
  districts: Record<string, { control: string; tension: number; description: string }>;
  factions: Record<string, { power: number; leader: string }>;
  relationships: Record<string, number>; // e.g. "Neon:Cipher" -> 0-100
  turn: number;
  timeOfDay: number; // 0-23
  weather: 'Clear' | 'Rain' | 'Acid Rain' | 'Smog';
  pois: PointOfInterest[];
};

export type Event = {
  id: string;
  type: 'MOOD_CHANGE' | 'TERRITORY_SHIFT' | 'FACTION_POWER' | 'RELATIONSHIP_UPDATE' | 'SYSTEM_ALERT' | 'TASK_COMPLETED' | 'FLOATING_TEXT';
  description: string;
  payload: any;
  timestamp: string;
};

export type Character = {
  id: string;
  name: string;
  role: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric' | 'Paladin' | 'Merchant';
  persona: Persona;
  faction: string | null;
  color: number; // Hex color for Phaser
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  energy: number; // 0-100
  health: number; // 0-100
  action: string;
  task: string | null;
  credits: number;
  bounty: number;
  inventory: InventoryItem[];
  equipped: string | null;
  level: number;
  xp: number;
  squadId: string | null;
};

export type Dialogue = {
  id: string;
  speakerId: string;
  text: string;
  timestamp: string;
};

// Initial State
export const initialWorldState: WorldState = {
  globalMood: 'Tense',
  districts: {
    'Neon Grid': { control: 'Synapse Cartel', tension: 75, description: 'Bright, crowded commercial hub.' },
    'The Rust Wastes': { control: 'Scrap Barons', tension: 40, description: 'Abandoned industrial sector.' },
    'Aero Heights': { control: 'CorpSec', tension: 20, description: 'Luxury corporate residential zone.' }
  },
  factions: {
    'Synapse Cartel': { power: 60, leader: 'Cipher' },
    'Scrap Barons': { power: 30, leader: 'Krieg' },
    'CorpSec': { power: 90, leader: 'Director Vance' },
    'Neon Syndicate': { power: 45, leader: 'Echo' }
  },
  relationships: {
    'Neon:Cipher': 45,
    'Neon:Director Vance': 10
  },
  turn: 0,
  timeOfDay: 8, // Start at 8 AM
  weather: 'Clear',
  pois: [
    { id: 'poi1', name: 'The Neon Lotus', x: 20, y: 15, type: 'Bar', district: 'Neon Grid' },
    { id: 'poi2', name: 'Scrap Exchange', x: 8, y: 8, type: 'Shop', district: 'The Rust Wastes' },
    { id: 'poi3', name: 'Corp Tower', x: 45, y: 35, type: 'Corp', district: 'Aero Heights' },
    { id: 'poi4', name: 'Cartel Hideout', x: 15, y: 20, type: 'Hideout', district: 'Neon Grid' },
    { id: 'poi5', name: 'Underground Clinic', x: 22, y: 28, type: 'Shop', district: 'The Rust Wastes' },
    { id: 'poi6', name: 'Data Hub', x: 38, y: 12, type: 'Corp', district: 'Neon Grid' },
    { id: 'poi7', name: 'Alley Bar', x: 5, y: 20, type: 'Bar', district: 'The Rust Wastes' },
    { id: 'poi8', name: 'Smuggler Den', x: 40, y: 25, type: 'Hideout', district: 'Aero Heights' },
    { id: 'poi9', name: 'Gun Runner', x: 28, y: 5, type: 'Shop', district: 'Neon Grid' },
    { id: 'poi10', name: 'Cyber Clinic', x: 35, y: 8, type: 'Shop', district: 'Neon Grid' }
  ]
};

// Map size 50x40, Tile 32
export const characters: Character[] = [
  { id: 'c1', name: 'Arthur', role: 'Warrior', persona: { trait: 'Brave', aggressiveness: 4, sociability: 7, greed: 3, curiosity: 9 }, faction: null, color: 0xff0000, x: 10, y: 15, targetX: 10, targetY: 15, energy: 100, health: 100, action: 'Idle', task: null, credits: 1500, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c2', name: 'Gareth', role: 'Paladin', persona: { trait: 'Righteous', aggressiveness: 8, sociability: 4, greed: 8, curiosity: 6 }, faction: 'Fighters Guild', color: 0x0000ff, x: 30, y: 15, targetX: 30, targetY: 15, energy: 100, health: 100, action: 'Idle', task: null, credits: 8000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c3', name: 'Borin', role: 'Warrior', persona: { trait: 'Stout', aggressiveness: 6, sociability: 8, greed: 2, curiosity: 3 }, faction: 'Fighters Guild', color: 0xaa5500, x: 5, y: 5, targetX: 5, targetY: 5, energy: 100, health: 100, action: 'Idle', task: null, credits: 450, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c4', name: 'Elara', role: 'Mage', persona: { trait: 'Mystical', aggressiveness: 7, sociability: 6, greed: 4, curiosity: 4 }, faction: 'Mages Circle', color: 0x00aaff, x: 45, y: 35, targetX: 45, targetY: 35, energy: 100, health: 100, action: 'Idle', task: null, credits: 5000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c5', name: 'Finn', role: 'Rogue', persona: { trait: 'Nimble', aggressiveness: 3, sociability: 6, greed: 5, curiosity: 10 }, faction: 'Thieves Guild', color: 0x00ff00, x: 8, y: 30, targetX: 8, targetY: 30, energy: 100, health: 100, action: 'Idle', task: null, credits: 200, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c6', name: 'Serena', role: 'Cleric', persona: { trait: 'Healing', aggressiveness: 1, sociability: 9, greed: 1, curiosity: 4 }, faction: null, color: 0xffbbbb, x: 20, y: 25, targetX: 20, targetY: 25, energy: 100, health: 100, action: 'Idle', task: null, credits: 3000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c7', name: 'Kael', role: 'Warrior', persona: { trait: 'Fierce', aggressiveness: 5, sociability: 7, greed: 4, curiosity: 2 }, faction: 'Fighters Guild', color: 0x884400, x: 25, y: 10, targetX: 25, targetY: 10, energy: 100, health: 100, action: 'Idle', task: null, credits: 1200, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c8', name: 'Lyra', role: 'Mage', persona: { trait: 'Friendly', aggressiveness: 2, sociability: 8, greed: 2, curiosity: 6 }, faction: 'Mages Circle', color: 0xffaa00, x: 40, y: 5, targetX: 40, targetY: 5, energy: 100, health: 100, action: 'Idle', task: null, credits: 500, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c9', name: 'Puck', role: 'Rogue', persona: { trait: 'Eager', aggressiveness: 6, sociability: 6, greed: 3, curiosity: 5 }, faction: 'Thieves Guild', color: 0x4444ff, x: 2, y: 2, targetX: 2, targetY: 2, energy: 100, health: 100, action: 'Idle', task: null, credits: 150, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c10', name: 'Marina', role: 'Merchant', persona: { trait: 'Charismatic', aggressiveness: 4, sociability: 5, greed: 8, curiosity: 7 }, faction: null, color: 0x00ccff, x: 35, y: 8, targetX: 35, targetY: 8, energy: 100, health: 100, action: 'Idle', task: null, credits: 2000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c11', name: 'Merlin', role: 'Mage', persona: { trait: 'Wise', aggressiveness: 1, sociability: 9, greed: 2, curiosity: 10 }, faction: 'Mages Circle', color: 0xffffff, x: 42, y: 38, targetX: 42, targetY: 38, energy: 100, health: 100, action: 'Idle', task: null, credits: 10000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c12', name: 'Shadow', role: 'Rogue', persona: { trait: 'Malicious', aggressiveness: 8, sociability: 2, greed: 9, curiosity: 2 }, faction: 'Thieves Guild', color: 0x222222, x: 45, y: 36, targetX: 45, targetY: 36, energy: 100, health: 100, action: 'Idle', task: null, credits: 1000, bounty: 500, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c13', name: 'Leon', role: 'Paladin', persona: { trait: 'Skilled', aggressiveness: 8, sociability: 4, greed: 5, curiosity: 6 }, faction: 'Fighters Guild', color: 0xffff00, x: 15, y: 35, targetX: 15, targetY: 35, energy: 100, health: 100, action: 'Idle', task: null, credits: 3600, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c14', name: 'Alden', role: 'Merchant', persona: { trait: 'Analytical', aggressiveness: 2, sociability: 5, greed: 4, curiosity: 9 }, faction: null, color: 0xdddddd, x: 20, y: 15, targetX: 20, targetY: 15, energy: 100, health: 100, action: 'Idle', task: null, credits: 5000, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null },
  { id: 'c15', name: 'Thorne', role: 'Warrior', persona: { trait: 'Outdoorsy', aggressiveness: 5, sociability: 7, greed: 2, curiosity: 6 }, faction: 'Rangers Guild', color: 0x22aa22, x: 5, y: 38, targetX: 5, targetY: 38, energy: 100, health: 100, action: 'Idle', task: null, credits: 280, bounty: 0, inventory: [], equipped: null, level: 1, xp: 0, squadId: null }
];

// Mock Conversational Data
const conversationPool = [
  { text: "Did you clear that dungeon today?", intents: ['TENSION_UP', 'QUEST_ACTIVITY'] },
  { text: "Aye, found a rare amulet on level 1.", intents: ['BATTLE_READY', 'RELATIONSHIP_UP'] },
  { text: "I've secured some new health potions. Interested?", intents: ['TRADE', 'FACTION_POWER_UP'] },
  { text: "Keep it quiet. The Thieves Guild has eyes everywhere right now.", intents: ['THIEF_ACTIVITY', 'TENSION_UP'] },
  { text: "I don't trust that new Guild Master.", intents: ['TENSION_MAX', 'MOOD_CHAOTIC'] },
  { text: "Let them try. Our party is fully equipped.", intents: ['REBELLION', 'RELATIONSHIP_UP'] },
  { text: "Rumor has it Gareth lost a duel.", intents: ['FACTION_POWER_DOWN'] },
  { text: "Good. More glory for us.", intents: ['TERRITORY_SHIFT'] },
  { text: "Merlin wants artifacts. You bring chaos.", intents: ['MOOD_TENSE'] },
  { text: "Combat is just another word for glory.", intents: ['REBELLION'] },
  { text: "The weather is perfect for an adventure.", intents: ['MOOD_TENSE'] },
  { text: "I heard someone got ambushed by the tavern today.", intents: ['TENSION_UP'] },
  { text: "The Mages Circle is making moves. They are planning something big.", intents: ['MAGE_ACTIVITY'] },
  { text: "Stay low, keep your gold hidden.", intents: [] }
];

// Base URL for the AI Town API
const AI_API_BASE = "/api/ai-town";

async function fetchAIDialogue(params: {
  character: string;
  otherCharacter?: string;
  worldMood: string;
  faction?: string | null;
  role: string;
  trait: string;
  location?: string;
}): Promise<string> {
  try {
    const res = await fetch(`${AI_API_BASE}/dialogue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { text: string };
    return data.text;
  } catch {
    // Fallback static lines
    const fallbacks: Record<string, string[]> = {
      Warrior: ["For glory and gold!", "The dungeon awaits.", "Steel never lies."],
      Mage: ["The arcane stirs today.", "Ancient magic is restless.", "Power flows through runes."],
      Rogue: ["Eyes open, blade ready.", "Gold speaks louder than honor.", "Shadows are my allies."],
      Cleric: ["May the light guide us.", "Faith sustains all.", "Healing is my calling."],
      Paladin: ["Justice shall prevail.", "Honor above all.", "I uphold the sacred code."],
      Merchant: ["A fair deal for all.", "Gold is the universal tongue.", "Supply meets demand."],
    };
    const lines = fallbacks[params.role] ?? ["..."];
    return lines[Math.floor(Math.random() * lines.length)];
  }
}

class Engine {
  private state: WorldState;
  private eventHandlers: Map<string, Array<(event: Event) => void>>;
  private listeners: Array<(state: WorldState, events: Event[], dialogues: Dialogue[], chars: Character[]) => void>;
  
  public events: Event[] = [];
  public dialogues: Dialogue[] = [];
  public chars: Character[] = JSON.parse(JSON.stringify(characters));
  private turnCounter = 0;
  private aiEnabled = true; // Toggle AI dialogue on/off

  constructor(initialState: WorldState) {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.eventHandlers = new Map();
    this.listeners = [];
    this.registerDefaultPlugins();
  }

  // Plugin System
  public on(eventType: string, handler: (event: Event) => void) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public subscribe(listener: (state: WorldState, events: Event[], dialogues: Dialogue[], chars: Character[]) => void) {
    this.listeners.push(listener);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.state, this.events, this.dialogues, this.chars));
  }

  private emit(event: Event) {
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(h => h(event));
    
    const wildcardHandlers = this.eventHandlers.get('*') || [];
    wildcardHandlers.forEach(h => h(event));
    
    this.notify();
  }

  // Pathfinding / wandering mockup
  private updateCharacterPositions() {
    // Basic random walk
    this.chars.forEach(c => {
      // Energy/Health management
      if (c.energy <= 0 || c.health <= 0) {
        if (c.health <= 0 && c.action !== 'Incapsulated / Healing') {
           this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `INCAPACITATED`, color: '#ff0000' }, timestamp: '' });
        }
        c.action = c.health <= 0 ? 'Incapsulated / Healing' : 'Resting';
        c.energy = Math.min(100, c.energy + 10);
        c.health = Math.min(100, c.health + 10);
        return; // Skip movement if resting
      }

      // Weather effects
      if (this.state.weather === 'Smog' && Math.random() > 0.8) {
         c.health = Math.max(0, c.health - 2);
      }

      if ((c.action === 'Resting' || c.action === 'Incapsulated / Healing') && (c.energy < 100 || c.health < 100)) {
        c.energy = Math.min(100, c.energy + 10);
        c.health = Math.min(100, c.health + 10);
        if (c.energy >= 100 && c.health >= 100) {
           c.action = 'Idle';
           this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `Recovered`, color: '#00ff00' }, timestamp: '' });
        }
        return;
      }

      // Needs-based targeting
      if (c.energy < 40 && c.health > 0) {
         // Need energy, find a Bar or Hideout
         const restPoi = this.state.pois.find(p => p.type === 'Bar' || p.type === 'Hideout');
         if (restPoi && c.targetX !== restPoi.x && c.targetY !== restPoi.y) {
            c.targetX = restPoi.x;
            c.targetY = restPoi.y;
            c.task = 'Resting';
            c.action = `Heading to ${restPoi.name} to Rest`;
         }
      } else if (c.health < 40 && c.health > 0 && c.credits > 100) {
         // Need healing, find Clinic
         const clinicPoi = this.state.pois.find(p => p.type === 'Shop' && p.name.includes('Clinic'));
         if (clinicPoi && c.targetX !== clinicPoi.x && c.targetY !== clinicPoi.y) {
            c.targetX = clinicPoi.x;
            c.targetY = clinicPoi.y;
            c.task = 'Seeking Meds';
            c.action = `Heading to ${clinicPoi.name} for Healing`;
         }
      }

      // Check for XP Level Up
      if (c.xp >= c.level * 100) {
         c.xp -= c.level * 100;
         c.level += 1;
         c.health = 100;
         c.energy = 100;
         // Random stat increase
         const stats: (keyof Persona)[] = ['aggressiveness', 'sociability', 'greed', 'curiosity'];
         const statToIncrease = stats[Math.floor(Math.random() * stats.length)];
         if (typeof c.persona[statToIncrease] === 'number') {
            (c.persona[statToIncrease] as number) = Math.min(10, (c.persona[statToIncrease] as number) + 1);
         }
         this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `LEVEL UP!`, color: '#ffff00' }, timestamp: '' });
         this.emit({
            id: `ev_${Date.now()}_${Math.random()}`,
            type: 'SYSTEM_ALERT',
            description: `${c.name} leveled up to Level ${c.level}!`,
            payload: { char: c.name, level: c.level },
            timestamp: new Date().toLocaleTimeString()
         });
      }

      // If reached target, pick new target or execute task
      if (c.x === c.targetX && c.y === c.targetY) {
        
        // Task Execution & Random Rolls
        if (c.task) {
           const currentPoi = this.state.pois.find(p => p.x === c.x && p.y === c.y);
           // Roll a D10 + trait modifier
           const roll = Math.floor(Math.random() * 10) + 1;
           let success = false;
           let outcomeMsg = "";

           // Item bonuses
           const hasWeapon = c.inventory.some(i => i.type === 'Weapon');
           const hasTech = c.inventory.some(i => i.type === 'Tech');

           if (c.task === 'Training') {
              let bonus = hasTech ? 3 : 0;
              success = (roll + c.persona.curiosity + bonus) > 12;
              if (success) {
                 const found = Math.floor(Math.random() * 500) + 100;
                 c.credits += found;
                 c.xp += 20;
                 
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+${found} ¥`, color: '#00ff00' }, timestamp: '' });

                 // Chance to find a physical item
                 if (Math.random() > 0.7) {
                    const itemTypes: InventoryItem['type'][] = ['Scrap', 'Tech', 'Weapon'];
                    const newItem: InventoryItem = {
                       id: `itm_${Date.now()}_${Math.random()}`,
                       name: `Found ${itemTypes[Math.floor(Math.random() * itemTypes.length)]}`,
                       value: Math.floor(Math.random() * 300) + 50,
                       type: itemTypes[Math.floor(Math.random() * itemTypes.length)]
                    };
                    c.inventory.push(newItem);
                    
                    // Auto-equip logic
                    if (newItem.type === 'Weapon' || newItem.type === 'Tech') {
                       if (!c.equipped || Math.random() > 0.5) {
                          c.equipped = newItem.name;
                       }
                    }

                    outcomeMsg = `Found ${found} yen and a ${newItem.name}.`;
                    
                    setTimeout(() => {
                       this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+${newItem.name}`, color: '#00ffff' }, timestamp: '' });
                    }, 500);

                 } else {
                    outcomeMsg = `Won a battle for ${found} yen.`;
                 }
              } else {
                 outcomeMsg = `Lost the battle.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `Battle Lost`, color: '#aaaaaa' }, timestamp: '' });
              }
           } else if (c.task === 'Clearing Dungeon') {
              let bonus = hasWeapon ? 3 : 0;
              success = (roll + c.persona.aggressiveness + bonus) > 10;
              if (success) {
                 c.credits += 1000;
                 c.bounty += 500;
                 c.xp += 30;
                 outcomeMsg = `Defeated monsters for 1000 gold${bonus ? ' (weapon advantage)' : ''}.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+1000 G`, color: '#00ff00' }, timestamp: '' });
              } else {
                 outcomeMsg = `Boss was too strong.`;
                 c.health -= 15;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `-15 HP`, color: '#ff0000' }, timestamp: '' });
              }
           } else if (c.task === 'Trading') {
              success = (roll + c.persona.sociability) > 11;
              if (success) {
                 c.credits += 800;
                 c.xp += 25;
                 outcomeMsg = `Traded goods successfully.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+800 G`, color: '#00ff00' }, timestamp: '' });
              } else {
                 outcomeMsg = `No one wanted to trade.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `Trade Failed`, color: '#aaaaaa' }, timestamp: '' });
              }
           } else if (c.task === 'Stealing') {
              let bonus = hasWeapon ? 3 : 0;
              success = (roll + c.persona.aggressiveness + bonus) > 12;
              if (success) {
                 c.credits += 500;
                 c.bounty += 1000; 
                 c.xp += 40;
                 outcomeMsg = `Stole a rare artifact for 500 gold${bonus ? ' (sneak bonus)' : ''}.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+500 G`, color: '#00ff00' }, timestamp: '' });
              } else {
                 c.health -= 25;
                 outcomeMsg = `Guards fought back. Lost health.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `-25 HP`, color: '#ff0000' }, timestamp: '' });
              }
           } else if (c.task === 'Researching') {
              let bonus = hasTech ? 4 : 0;
              success = (roll + c.persona.curiosity + bonus) > 13;
              if (success) {
                 c.credits += 1500;
                 c.bounty += 200;
                 c.xp += 50;
                 const newItem: InventoryItem = { id: `itm_${Date.now()}_${Math.random()}`, name: `Ancient Scroll`, value: 1000, type: 'Data' };
                 c.inventory.push(newItem);
                 outcomeMsg = `Deciphered runes. Secured scroll and 1500 gold.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+1500 G (Scroll)`, color: '#00ffff' }, timestamp: '' });
              } else {
                 c.energy -= 40;
                 outcomeMsg = `Runes faded. Exhausted.`;
                 this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `Scribing Failed`, color: '#ff0000' }, timestamp: '' });
              }
           } else if (c.task === 'Patrolling') {
              c.credits += 200;
              c.xp += 10;
              outcomeMsg = `Completed route patrol.`;
              this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+200 G (Salary)`, color: '#00ff00' }, timestamp: '' });
           } else if (c.task === 'Resting' && (currentPoi?.type === 'Bar' || currentPoi?.type === 'Hideout')) {
              c.energy = 100;
              if (currentPoi.type === 'Bar') c.credits = Math.max(0, c.credits - 50);
              outcomeMsg = `Rested at ${currentPoi.name}.`;
              this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+EN (Rested)`, color: '#00ff00' }, timestamp: '' });
           } else if (c.task === 'Seeking Meds' && currentPoi?.type === 'Shop') {
              c.health = 100;
              c.credits -= 100;
              outcomeMsg = `Healed at ${currentPoi.name}.`;
              this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+HP (Healed)`, color: '#00ff00' }, timestamp: '' });
           }

           const districtName = currentPoi ? currentPoi.district : 'Verdant Town';

           this.emit({
             id: `ev_${Date.now()}_${Math.random()}`,
             type: 'TASK_COMPLETED',
             description: `${c.name} finished ${c.task}. Roll: ${roll}. ${outcomeMsg}`,
             payload: { char: c.name, task: c.task, roll, success, district: districtName },
             timestamp: new Date().toLocaleTimeString()
           });

           c.task = null; // Task complete
        }

        c.action = 'Idle';
        
        // If close to each other, maybe stay to chat?
        const otherChars = this.chars.filter(o => o.id !== c.id);
        const closestChar = otherChars.reduce((prev, curr) => 
          (Math.abs(curr.x - c.x) + Math.abs(curr.y - c.y) < Math.abs(prev.x - c.x) + Math.abs(prev.y - c.y)) ? curr : prev
        );

        const distToClosest = Math.abs(closestChar.x - c.x) + Math.abs(closestChar.y - c.y);
        const relWithClosest = this.state.relationships[`${c.name}:${closestChar.name}`] || this.state.relationships[`${closestChar.name}:${c.name}`] || 50;

        // Medics heal the incapacitated
        if (c.role === 'Cleric' && closestChar.health <= 0 && distToClosest <= 2) {
           c.action = `Healing ${closestChar.name}`;
           closestChar.health = 50;
           c.energy -= 20;
           this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: closestChar.id, text: `+50 HP (Healed)`, color: '#00ff00' }, timestamp: '' });
           this.emit({ id: `float_${Date.now()}_2`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `-20 EN`, color: '#aaaaaa' }, timestamp: '' });
        }
        // Paladins/Warriors act as authorities against thieves
        else if ((c.role === 'Paladin' || c.role === 'Warrior' || c.role === 'Cleric') && closestChar.bounty > 0 && distToClosest <= 2 && Math.random() > 0.3) {
           c.action = `Battling ${closestChar.name}`;
           const reward = closestChar.bounty;
           c.credits += reward;
           closestChar.bounty = 0;
           closestChar.credits = Math.max(0, closestChar.credits - reward);
           closestChar.health -= 50; 
           this.emit({ id: `float_${Date.now()}`, type: 'FLOATING_TEXT', description: '', payload: { charId: c.id, text: `+${reward} ¥ (Bounty)`, color: '#00ff00' }, timestamp: '' });
           this.emit({ id: `float_${Date.now()}_2`, type: 'FLOATING_TEXT', description: '', payload: { charId: closestChar.id, text: `DEFEATED`, color: '#ff0000' }, timestamp: '' });
        }
        // Check for robbery
        else if (distToClosest === 1 && c.persona.greed > 7 && c.persona.aggressiveness > 6 && closestChar.credits > 500 && Math.random() > 0.8 && relWithClosest < 60 && c.role === 'Rogue') {
           c.action = `Stealing from ${closestChar.name}`;
           c.task = 'Stealing';
           closestChar.action = 'Being Robbed';
        } else if (distToClosest < 8 && distToClosest > 2 && Math.random() > (10 - c.persona.sociability) / 10) {
          // Sociable characters more likely to approach
          c.targetX = Math.max(0, Math.min(39, c.x + (closestChar.x > c.x ? 1 : closestChar.x < c.x ? -1 : 0)));
          c.targetY = Math.max(0, Math.min(29, c.y + (closestChar.y > c.y ? 1 : closestChar.y < c.y ? -1 : 0)));
          c.action = 'Approaching';
        } else if (Math.random() > 0.6) {
          // Pick a random task based on persona and role
          const randomPoi = this.state.pois[Math.floor(Math.random() * this.state.pois.length)];
          c.targetX = randomPoi.x;
          c.targetY = randomPoi.y;
          
          if (c.role === 'Mage' && Math.random() > 0.4) {
             c.task = 'Researching';
             c.action = `Heading to ${randomPoi.name} to Research`;
          } else if (c.role === 'Paladin') {
             const tenseDistricts = Object.entries(this.state.districts).filter(([_, d]) => d.tension > 60).map(([n, _]) => n);
             let targetPoi = randomPoi;
             if (tenseDistricts.length > 0 && Math.random() > 0.3) {
                 const tensePois = this.state.pois.filter(p => tenseDistricts.includes(p.district));
                 if (tensePois.length > 0) targetPoi = tensePois[Math.floor(Math.random() * tensePois.length)];
             }
             c.targetX = targetPoi.x;
             c.targetY = targetPoi.y;
             c.task = 'Patrolling';
             c.action = `Patrolling ${targetPoi.name}`;
          } else if (c.persona.aggressiveness > 7 && Math.random() > 0.5) {
            c.task = 'Clearing Dungeon';
            c.action = `Heading to ${randomPoi.name} to Battle`;
          } else if (c.persona.curiosity > 7 && Math.random() > 0.5) {
            c.task = 'Training';
            c.action = `Heading to ${randomPoi.name} to Train`;
          } else {
            c.task = 'Trading';
            c.action = `Heading to ${randomPoi.name} to Trade`;
          }
        } else {
          // random walk 1-3 tiles
          const dir = Math.floor(Math.random() * 4);
          const dist = Math.floor(Math.random() * 3) + 1;
          if (dir === 0) c.targetY = Math.max(0, c.y - dist);
          if (dir === 1) c.targetY = Math.min(39, c.y + dist); // MAP_HEIGHT 40
          if (dir === 2) c.targetX = Math.max(0, c.x - dist);
          if (dir === 3) c.targetX = Math.min(49, c.x + dist); // MAP_WIDTH 50
          c.action = 'Wandering';
        }
      } else {
        let newX = c.x;
        let newY = c.y;

        // move 1 step towards target
        if (c.x < c.targetX) newX++;
        else if (c.x > c.targetX) newX--;
        
        if (c.y < c.targetY) newY++;
        else if (c.y > c.targetY) newY--;
        
        // Check collision
        const collision = this.chars.some(other => other.id !== c.id && other.x === newX && other.y === newY);
        
        if (!collision) {
           c.x = newX;
           c.y = newY;
           c.action = 'Moving';
        } else {
           c.action = 'Blocked';
           // Basic pathfinding around obstacle
           if (c.x !== c.targetX && !this.chars.some(other => other.id !== c.id && other.x === newX && other.y === c.y)) {
              c.x = newX;
              c.action = 'Moving (Alt)';
           } else if (c.y !== c.targetY && !this.chars.some(other => other.id !== c.id && other.x === c.x && other.y === newY)) {
              c.y = newY;
              c.action = 'Moving (Alt)';
           }
        }

        c.energy -= this.state.weather === 'Acid Rain' ? 3 : 1; // Acid rain drains more energy
      }
    });
  }

  public advanceTurn() {
    this.turnCounter++;
    this.state.turn = this.turnCounter;
    this.state.timeOfDay = (this.state.timeOfDay + 1) % 24; // Advance time by 1 hour per turn for mockup
    
    // District Takeovers based on Tension
    if (this.turnCounter % 8 === 0) {
      Object.entries(this.state.districts).forEach(([districtName, data]) => {
        if (data.tension > 80) {
           // Find highest power faction
           let highestFaction = data.control;
           let maxPower = -1;
           Object.entries(this.state.factions).forEach(([facName, facData]) => {
             if (facData.power > maxPower) {
               maxPower = facData.power;
               highestFaction = facName;
             }
           });

           if (highestFaction !== data.control && Math.random() > 0.4) { // Increased takeover chance
             this.emit({
                id: `ev_${Date.now()}_${Math.random()}`,
                type: 'TERRITORY_SHIFT',
                description: `${highestFaction} seized control of ${districtName} amid high tension!`,
                payload: { district: districtName, newControl: highestFaction },
                timestamp: new Date().toLocaleTimeString()
             });
             // Reset tension after takeover
             this.state.districts[districtName].tension = 20;
             this.state.factions[highestFaction].power += 10;
           }
        } else if (Math.random() > 0.8) {
           // Randomly fluctuate tension
           this.state.districts[districtName].tension = Math.max(0, Math.min(100, this.state.districts[districtName].tension + (Math.floor(Math.random() * 21) - 10)));
        }
      });
    }

    // Process random faction power shifts
    if (this.turnCounter % 5 === 0) {
      const factionNames = Object.keys(this.state.factions);
      const randomFaction = factionNames[Math.floor(Math.random() * factionNames.length)];
      const shift = Math.floor(Math.random() * 11) - 5; // -5 to +5
      
      this.state.factions[randomFaction].power = Math.max(0, Math.min(100, this.state.factions[randomFaction].power + shift));
      
      if (Math.abs(shift) > 3) {
        this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'FACTION_POWER',
          description: `${randomFaction} power shifted by ${shift}.`,
          payload: { faction: randomFaction, shift },
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    // Dynamic weather changes
    if (this.turnCounter % 12 === 0 && Math.random() > 0.6) {
      const weathers: WorldState['weather'][] = ['Clear', 'Rain', 'Acid Rain', 'Smog'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      if (newWeather !== this.state.weather) {
         this.state.weather = newWeather;
         this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'SYSTEM_ALERT',
          description: `Weather shifted to ${newWeather}.`,
          payload: { weather: newWeather },
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

      // Global Events
      if (this.turnCounter > 0 && this.turnCounter % 30 === 0 && Math.random() > 0.5) {
         const events = [
            { name: "Merchant Guild Sale", desc: "All characters spent 20% of their gold.", action: () => this.chars.forEach(c => c.credits = Math.floor(c.credits * 0.8)) },
            { name: "Goblin Invasion", desc: "Warriors and Mages received bonus XP.", action: () => this.chars.forEach(c => { if (c.role === 'Mage' || c.role === 'Warrior') c.xp += 50; }) },
            { name: "Royal Guard Sweep", desc: "Tension reduced in all districts.", action: () => Object.entries(this.state.districts).forEach(([_, d]) => d.tension = Math.max(0, d.tension - 30)) },
            { name: "Bandit Raid", desc: "Thieves Guild gained power, tension spiked in Elden Forest.", action: () => { if (this.state.factions['Thieves Guild']) { this.state.factions['Thieves Guild'].power = Math.min(100, this.state.factions['Thieves Guild'].power - 20); this.state.districts['Elden Forest'].tension = Math.min(100, this.state.districts['Elden Forest'].tension + 40); } } }
         ];
         const event = events[Math.floor(Math.random() * events.length)];
         event.action();
         this.emit({
            id: `ev_${Date.now()}_global`,
            type: 'SYSTEM_ALERT',
            description: `GLOBAL EVENT: ${event.name}. ${event.desc}`,
            payload: { event: event.name },
            timestamp: new Date().toLocaleTimeString()
         });
      }

    // 1. Move characters
    this.updateCharacterPositions();
    this.notify();

    // 2. Generate Dialogue every few turns, or if they are close
    // Pick two random characters that are close to each other
    let speakers: Character[] = [];
    for (let i = 0; i < this.chars.length; i++) {
      for (let j = i + 1; j < this.chars.length; j++) {
        const dist = Math.abs(this.chars[i].x - this.chars[j].x) + Math.abs(this.chars[i].y - this.chars[j].y);
        if (dist < 5) {
          speakers = [this.chars[i], this.chars[j]];
          break;
        }
      }
      if (speakers.length > 0) break;
    }

    // Fallback to random speakers if no one is close but it's time to speak
    if (speakers.length === 0 && this.turnCounter % 10 === 0) {
      speakers = [this.chars[0], this.chars[1]]; // Just pick the first two
    }

    if (speakers.length > 0 && Math.random() > 0.3) {
      const speaker1 = speakers[0];
      const speaker2 = speakers[1];

      // Find location of speaker1
      const nearbyPoi = this.state.pois.find(p => Math.abs(p.x - speaker1.x) + Math.abs(p.y - speaker1.y) < 4);
      const location = nearbyPoi?.name;

      // Async AI dialogue — fire and forget, does not block the engine tick
      this.generateAIDialogue(speaker1, speaker2, location);
    }
  }

  private async generateAIDialogue(speaker1: Character, speaker2: Character, location?: string) {
    // Check if speaker1 has a new item to share
    if (speaker1.inventory.length > 0 && Math.random() > 0.5) {
      const item = speaker1.inventory[speaker1.inventory.length - 1];
      const u1Text = `Check it out, just found a ${item.name} worth ${item.value} gold.`;
      const u2Text = speaker2.persona.greed > 5
        ? "Watch your back. Thieves will want that."
        : "Not bad. Keep at it.";

      const d1: Dialogue = { id: `d_${Date.now()}_1`, speakerId: speaker1.id, text: u1Text, timestamp: new Date().toLocaleTimeString() };
      setTimeout(() => {
        this.dialogues.push(d1);
        this.notify();
        setTimeout(() => {
          const d2: Dialogue = { id: `d_${Date.now()}_2`, speakerId: speaker2.id, text: u2Text, timestamp: new Date().toLocaleTimeString() };
          this.dialogues.push(d2);
          this.notify();
        }, 2500);
      }, 500);
      return;
    }

    // AI-generated dialogue
    try {
      const [u1Text, u2Text] = await Promise.all([
        fetchAIDialogue({
          character: speaker1.name,
          otherCharacter: speaker2.name,
          worldMood: this.state.globalMood,
          faction: speaker1.faction,
          role: speaker1.role,
          trait: speaker1.persona.trait,
          location,
        }),
        fetchAIDialogue({
          character: speaker2.name,
          otherCharacter: speaker1.name,
          worldMood: this.state.globalMood,
          faction: speaker2.faction,
          role: speaker2.role,
          trait: speaker2.persona.trait,
          location,
        }),
      ]);

      const d1: Dialogue = { id: `d_${Date.now()}_1`, speakerId: speaker1.id, text: u1Text, timestamp: new Date().toLocaleTimeString() };
      this.dialogues.push(d1);
      this.notify();

      setTimeout(() => {
        const d2: Dialogue = { id: `d_${Date.now()}_2`, speakerId: speaker2.id, text: u2Text, timestamp: new Date().toLocaleTimeString() };
        this.dialogues.push(d2);
        this.notify();
      }, 2500);
    } catch {
      // Fallback to pool
      const poolIndex = Math.floor(Math.random() * conversationPool.length);
      const u1Text = conversationPool[poolIndex].text;
      const u2Text = conversationPool[(poolIndex + 1) % conversationPool.length].text;

      const d1: Dialogue = { id: `d_${Date.now()}_1`, speakerId: speaker1.id, text: u1Text, timestamp: new Date().toLocaleTimeString() };
      setTimeout(() => {
        this.dialogues.push(d1);
        this.notify();
        setTimeout(() => {
          const d2: Dialogue = { id: `d_${Date.now()}_2`, speakerId: speaker2.id, text: u2Text, timestamp: new Date().toLocaleTimeString() };
          this.dialogues.push(d2);
          this.notify();
        }, 2500);
      }, 500);
    }
  }

  private extractEventsFromDialogue(dialogue: Dialogue, intents: string[]) {
    intents.forEach(intent => {
      if (intent === 'TENSION_UP') {
        this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'SYSTEM_ALERT',
          description: `Grid tension increased.`,
          payload: { district: 'Neon Grid', amount: 5 },
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (intent === 'MOOD_CHAOTIC') {
        this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'MOOD_CHANGE',
          description: 'Global mood shifted to Chaotic.',
          payload: { mood: 'Chaotic' },
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (intent === 'RELATIONSHIP_UP') {
         this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'RELATIONSHIP_UPDATE',
          description: 'Neon and Cipher grew closer.',
          payload: { pair: 'Neon:Cipher', amount: 5 },
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (intent === 'TERRITORY_SHIFT_WASTES') {
         this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'TERRITORY_SHIFT',
          description: 'Synapse Cartel making moves on The Rust Wastes.',
          payload: { district: 'The Rust Wastes', newControl: 'Contested' },
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
  }

  private registerDefaultPlugins() {
    this.on('SYSTEM_ALERT', (e) => {
      if (e.payload.district && this.state.districts[e.payload.district]) {
        this.state.districts[e.payload.district].tension = Math.min(100, this.state.districts[e.payload.district].tension + e.payload.amount);
      }
    });

    this.on('MOOD_CHANGE', (e) => {
      this.state.globalMood = e.payload.mood;
    });
    
    this.on('RELATIONSHIP_UPDATE', (e) => {
      if (this.state.relationships[e.payload.pair] !== undefined) {
        this.state.relationships[e.payload.pair] = Math.min(100, this.state.relationships[e.payload.pair] + e.payload.amount);
      }
    });

    this.on('TERRITORY_SHIFT', (e) => {
      if (this.state.districts[e.payload.district]) {
        this.state.districts[e.payload.district].control = e.payload.newControl;
      }
    });

    // Framework Logic for Task Consequences
    this.on('TASK_COMPLETED', (e) => {
      const { task, success, district } = e.payload;
      
      if (this.state.districts[district]) {
         if (task === 'Clearing Dungeon' && success) {
            // Battling successfully increases tension in the district
            this.state.districts[district].tension = Math.min(100, this.state.districts[district].tension + 10);
         } else if (task === 'Trading' && success) {
            // Good trade cools things down
            this.state.districts[district].tension = Math.max(0, this.state.districts[district].tension - 5);
         } else if (task === 'Stealing' && !success) {
            // Failed stealing leads to higher tension
            this.state.districts[district].tension = Math.min(100, this.state.districts[district].tension + 5);
         }
      }
    });
  }

  public reset() {
    this.state = JSON.parse(JSON.stringify(initialWorldState));
    this.events = [];
    this.dialogues = [];
    this.chars = JSON.parse(JSON.stringify(characters));
    this.turnCounter = 0;
    this.emit({
      id: `ev_reset`,
      type: 'SYSTEM_ALERT',
      description: 'System Reset. World generated.',
      payload: {},
      timestamp: new Date().toLocaleTimeString()
    });
  }
}

export const worldEngine = new Engine(initialWorldState);