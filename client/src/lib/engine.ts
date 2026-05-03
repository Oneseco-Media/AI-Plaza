// AI Town World Engine Logic (Mockup)

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
  type: 'MOOD_CHANGE' | 'TERRITORY_SHIFT' | 'FACTION_POWER' | 'RELATIONSHIP_UPDATE' | 'SYSTEM_ALERT' | 'TASK_COMPLETED';
  description: string;
  payload: any;
  timestamp: string;
};

export type Character = {
  id: string;
  name: string;
  persona: Persona;
  color: number; // Hex color for Phaser
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  energy: number; // 0-100
  action: string;
  task: string | null;
  credits: number;
  inventory: InventoryItem[];
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
    'CorpSec': { power: 90, leader: 'Director Vance' }
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
    { id: 'poi3', name: 'Corp Tower', x: 35, y: 25, type: 'Corp', district: 'Aero Heights' },
    { id: 'poi4', name: 'Cartel Hideout', x: 15, y: 20, type: 'Hideout', district: 'Neon Grid' }
  ]
};

// Map size 40x30, Tile 32
export const characters: Character[] = [
  { id: 'c1', name: 'Neon', persona: { trait: 'Rebellious hacker', aggressiveness: 4, sociability: 7, greed: 3, curiosity: 9 }, color: 0x00ffff, x: 10, y: 15, targetX: 10, targetY: 15, energy: 100, action: 'Idle', task: null, credits: 1500, inventory: [] },
  { id: 'c2', name: 'Cipher', persona: { trait: 'Calculated info-broker', aggressiveness: 2, sociability: 8, greed: 8, curiosity: 6 }, color: 0xff00ff, x: 30, y: 15, targetX: 30, targetY: 15, energy: 100, action: 'Idle', task: null, credits: 8000, inventory: [] },
  { id: 'c3', name: 'Krieg', persona: { trait: 'Ruthless warlord', aggressiveness: 10, sociability: 2, greed: 7, curiosity: 3 }, color: 0xff4400, x: 5, y: 5, targetX: 5, targetY: 5, energy: 100, action: 'Idle', task: null, credits: 450, inventory: [] },
  { id: 'c4', name: 'Vance', persona: { trait: 'Cold corporate director', aggressiveness: 6, sociability: 5, greed: 9, curiosity: 4 }, color: 0x44ff44, x: 35, y: 25, targetX: 35, targetY: 25, energy: 100, action: 'Idle', task: null, credits: 50000, inventory: [] }
];

// Mock Conversational Data
const conversationPool = [
  { text: "Did you see CorpSec moving through the Grid last night?", intents: ['TENSION_UP', 'CORPSEC_ACTIVITY'] },
  { text: "Yeah, Vance is tightening the leash. We need to push back.", intents: ['REBELLION', 'RELATIONSHIP_UP'] },
  { text: "I've secured some new hardware from the Wastes. Interested?", intents: ['TRADE', 'SCRAP_BARONS_POWER_UP'] },
  { text: "Keep it quiet. The Cartel has eyes everywhere right now.", intents: ['CARTEL_ACTIVITY', 'TENSION_UP'] },
  { text: "I don't trust Vance. He's planning a sweep of the lower levels.", intents: ['TENSION_MAX', 'MOOD_CHAOTIC'] },
  { text: "Let him try. We have the perimeter rigged.", intents: ['REBELLION', 'RELATIONSHIP_UP'] },
  { text: "Rumor has it Krieg lost a skirmish. Scrap Barons are weak.", intents: ['SCRAP_BARONS_POWER_DOWN'] },
  { text: "Good. More territory for us to claim in the Wastes.", intents: ['TERRITORY_SHIFT_WASTES'] },
  { text: "Director Vance wants order. You bring chaos.", intents: ['MOOD_TENSE'] },
  { text: "Order is just another word for control.", intents: ['REBELLION'] }
];

class Engine {
  private state: WorldState;
  private eventHandlers: Map<string, Array<(event: Event) => void>>;
  private listeners: Array<(state: WorldState, events: Event[], dialogues: Dialogue[], chars: Character[]) => void>;
  
  public events: Event[] = [];
  public dialogues: Dialogue[] = [];
  public chars: Character[] = JSON.parse(JSON.stringify(characters));
  private turnCounter = 0;

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
      // Energy management
      if (c.energy <= 0) {
        c.action = 'Resting';
        c.energy += 10;
        return; // Skip movement if resting
      }

      if (c.action === 'Resting' && c.energy < 100) {
        c.energy += 10;
        if (c.energy >= 100) c.action = 'Idle';
        return;
      }

      // If reached target, pick new target or execute task
      if (c.x === c.targetX && c.y === c.targetY) {
        
        // Task Execution & Random Rolls
        if (c.task) {
           // Roll a D10 + trait modifier
           const roll = Math.floor(Math.random() * 10) + 1;
           let success = false;
           let outcomeMsg = "";

           if (c.task === 'Scavenging') {
              success = (roll + c.persona.curiosity) > 12;
              if (success) {
                 const found = Math.floor(Math.random() * 500) + 100;
                 c.credits += found;
                 
                 // Chance to find a physical item when scavenging
                 if (Math.random() > 0.7) {
                    const itemTypes: InventoryItem['type'][] = ['Scrap', 'Tech', 'Weapon'];
                    const newItem: InventoryItem = {
                       id: `itm_${Date.now()}_${Math.random()}`,
                       name: `Salvaged ${itemTypes[Math.floor(Math.random() * itemTypes.length)]}`,
                       value: Math.floor(Math.random() * 300) + 50,
                       type: itemTypes[Math.floor(Math.random() * itemTypes.length)]
                    };
                    c.inventory.push(newItem);
                    outcomeMsg = `Found ${found} creds and a ${newItem.name}.`;
                 } else {
                    outcomeMsg = `Found ${found} creds.`;
                 }
              } else {
                 outcomeMsg = `Found nothing.`;
              }
           } else if (c.task === 'Extorting') {
              success = (roll + c.persona.aggressiveness) > 10;
              if (success) {
                 c.credits += 1000;
                 outcomeMsg = `Intimidated locals for 1000 creds.`;
              } else {
                 outcomeMsg = `Locals resisted.`;
                 c.energy -= 20; // lost a scuffle
              }
           } else if (c.task === 'Trading') {
              success = (roll + c.persona.sociability) > 11;
              if (success) {
                 c.credits += 800;
                 outcomeMsg = `Good deal made.`;
              } else {
                 outcomeMsg = `Market was dry.`;
              }
           }

           const currentPoi = this.state.pois.find(p => p.x === c.x && p.y === c.y);
           const districtName = currentPoi ? currentPoi.district : 'Neon Grid';

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

        if (distToClosest < 8 && distToClosest > 2 && Math.random() > (10 - c.persona.sociability) / 10) {
          // Sociable characters more likely to approach
          c.targetX = Math.max(0, Math.min(39, c.x + (closestChar.x > c.x ? 1 : closestChar.x < c.x ? -1 : 0)));
          c.targetY = Math.max(0, Math.min(29, c.y + (closestChar.y > c.y ? 1 : closestChar.y < c.y ? -1 : 0)));
          c.action = 'Approaching';
        } else if (Math.random() > 0.6) {
          // Pick a random task based on persona
          const randomPoi = this.state.pois[Math.floor(Math.random() * this.state.pois.length)];
          c.targetX = randomPoi.x;
          c.targetY = randomPoi.y;
          
          // Assign task based on highest trait or randomness
          if (c.persona.aggressiveness > 7 && Math.random() > 0.5) {
            c.task = 'Extorting';
            c.action = `Heading to ${randomPoi.name} to Extort`;
          } else if (c.persona.curiosity > 7 && Math.random() > 0.5) {
            c.task = 'Scavenging';
            c.action = `Heading to ${randomPoi.name} to Scavenge`;
          } else {
            c.task = 'Trading';
            c.action = `Heading to ${randomPoi.name} to Trade`;
          }
        } else {
          // random walk 1-3 tiles
          const dir = Math.floor(Math.random() * 4);
          const dist = Math.floor(Math.random() * 3) + 1;
          if (dir === 0) c.targetY = Math.max(0, c.y - dist);
          if (dir === 1) c.targetY = Math.min(29, c.y + dist); // MAP_HEIGHT 30
          if (dir === 2) c.targetX = Math.max(0, c.x - dist);
          if (dir === 3) c.targetX = Math.min(39, c.x + dist); // MAP_WIDTH 40
          c.action = 'Wandering';
        }
      } else {
        // move 1 step towards target
        if (c.x < c.targetX) c.x++;
        else if (c.x > c.targetX) c.x--;
        
        if (c.y < c.targetY) c.y++;
        else if (c.y > c.targetY) c.y--;
        
        c.energy -= 1; // Costs energy to move
        c.action = 'Moving';
      }
    });
  }

  public advanceTurn() {
    this.turnCounter++;
    this.state.turn = this.turnCounter;
    this.state.timeOfDay = (this.state.timeOfDay + 1) % 24; // Advance time by 1 hour per turn for mockup
    
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

    // 1. Move characters
    this.updateCharacterPositions();
    this.notify();

    // 2. Generate Dialogue every few turns, or if they are close
    // Pick two random characters that are close to each other
    let speakers = [];
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
      const poolIndex = Math.floor(Math.random() * conversationPool.length);
      const utterance1 = conversationPool[poolIndex];
      const utterance2 = conversationPool[(poolIndex + 1) % conversationPool.length];

      const d1: Dialogue = {
        id: `d_${Date.now()}_1`,
        speakerId: speaker1.id,
        text: utterance1.text,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTimeout(() => {
        this.dialogues.push(d1);
        this.notify();
        this.extractEventsFromDialogue(d1, utterance1.intents);
        
        setTimeout(() => {
          const d2: Dialogue = {
            id: `d_${Date.now()}_2`,
            speakerId: speaker2.id,
            text: utterance2.text,
            timestamp: new Date().toLocaleTimeString()
          };
          this.dialogues.push(d2);
          this.notify();
          this.extractEventsFromDialogue(d2, utterance2.intents);
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
         if (task === 'Extorting' && success) {
            // Extorting successfully increases tension in the district
            this.state.districts[district].tension = Math.min(100, this.state.districts[district].tension + 10);
         } else if (task === 'Trading' && success) {
            // Good trade cools things down
            this.state.districts[district].tension = Math.max(0, this.state.districts[district].tension - 5);
         } else if (task === 'Extorting' && !success) {
            // Failed extortion leads to higher tension and lower faction power for the aggressor's implicitly linked faction
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