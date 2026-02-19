// AI Town World Engine Logic (Mockup)

export type WorldState = {
  globalMood: 'Tense' | 'Peaceful' | 'Chaotic' | 'Optimistic' | 'Suspicious';
  districts: Record<string, { control: string; tension: number; description: string }>;
  factions: Record<string, { power: number; leader: string }>;
  relationships: Record<string, number>; // e.g. "Neon:Cipher" -> 0-100
  turn: number;
};

export type Event = {
  id: string;
  type: 'MOOD_CHANGE' | 'TERRITORY_SHIFT' | 'FACTION_POWER' | 'RELATIONSHIP_UPDATE' | 'SYSTEM_ALERT';
  description: string;
  payload: any;
  timestamp: string;
};

export type Character = {
  id: string;
  name: string;
  personality: string;
  color: string;
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
  turn: 0
};

export const characters: Character[] = [
  { id: 'c1', name: 'Neon', personality: 'Rebellious hacker, fast-talking, distrusts authority.', color: 'text-cyan-400' },
  { id: 'c2', name: 'Cipher', personality: 'Calculated info-broker, speaks in riddles, values leverage.', color: 'text-fuchsia-400' }
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
];

class Engine {
  private state: WorldState;
  private eventHandlers: Map<string, Array<(event: Event) => void>>;
  private listeners: Array<(state: WorldState, events: Event[], dialogues: Dialogue[]) => void>;
  
  public events: Event[] = [];
  public dialogues: Dialogue[] = [];
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

  public subscribe(listener: (state: WorldState, events: Event[], dialogues: Dialogue[]) => void) {
    this.listeners.push(listener);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.state, this.events, this.dialogues));
  }

  // Emit an event to the system
  private emit(event: Event) {
    this.events.unshift(event); // Add to front
    if (this.events.length > 50) this.events.pop(); // Cap history
    
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(h => h(event));
    
    // Also trigger wildcard handlers if any
    const wildcardHandlers = this.eventHandlers.get('*') || [];
    wildcardHandlers.forEach(h => h(event));
    
    this.notify();
  }

  // Core Engine Loop (Mocked)
  public advanceTurn() {
    this.turnCounter++;
    this.state.turn = this.turnCounter;
    
    // 1. Generate Dialogue
    const speaker1 = characters[0];
    const speaker2 = characters[1];
    
    const poolIndex = (this.turnCounter - 1) * 2 % conversationPool.length;
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
      }, 1000); // Delay for visual effect
      
    }, 500);
  }

  // 2. Event Extraction (Mocked NLP)
  private extractEventsFromDialogue(dialogue: Dialogue, intents: string[]) {
    // In a real app, an LLM would parse `dialogue.text` to JSON events.
    // Here we use pre-mapped intents to mock the extraction.
    
    intents.forEach(intent => {
      if (intent === 'TENSION_UP') {
        this.emit({
          id: `ev_${Date.now()}_${Math.random()}`,
          type: 'SYSTEM_ALERT',
          description: `Grid tension increased due to ${characters.find(c=>c.id===dialogue.speakerId)?.name}'s chatter.`,
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

  // 3. Event Processing (Plugins mutate state)
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
  }

  public reset() {
    this.state = JSON.parse(JSON.stringify(initialWorldState));
    this.events = [];
    this.dialogues = [];
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
