# AI Town World Engine

A real-time, modular simulation engine and interactive dashboard for AI-driven characters in a persistent world state. This project visualizes character movements, dialogue generation, and world state mutations in a top-down, Pokémon-style environment built with Phaser.

## 🌟 Features

- **World Engine Simulation:** A custom in-memory simulation engine managing a persistent world state, including global mood, district tension, faction power, and inter-character relationships.
- **Top-Down Game World:** Built using the [Phaser](https://phaser.io/) framework, rendering characters on a dynamic grid with smooth camera tracking.
- **Dynamic Conversations:** Characters automatically move and trigger localized dialogues when in proximity. Speech is rendered natively in-engine as floating chat bubbles.
- **Event Extraction & Processing:** Dialogues are parsed for specific "intents" (mocking an LLM natural language processing layer) which emit system events that mutate the global world state.
- **Cyberpunk Aesthetic:** A stylized, "Dark Future" HUD overlay built with Tailwind CSS, Framer Motion, and custom CSS effects (glitches, scanlines) floating on top of the canvas.
- **Simulation Controls:** Real-time controls to pause, auto-run, or step through the simulation turns one by one.

## 🛠️ Technology Stack

- **Frontend Framework:** React 19, Vite
- **Game Engine:** Phaser 3
- **Routing:** Wouter
- **Styling:** Tailwind CSS v4, Lucide React (Icons), Radix UI (Primitives)
- **State Management:** React hooks layered over a custom, event-driven TypeScript engine.

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev:client
   ```
   This will start the Vite development server, typically available at `http://localhost:5000`.

## 🧠 Architecture Overview

### `client/src/lib/engine.ts`
The core logic of the simulation. It maintains the `WorldState`, tracks `Characters` (their coordinates and targets), and manages the `Dialogue` and `Event` queues. It exposes a subscription model so React components can re-render when the engine turn advances.

### `client/src/components/PhaserGame.tsx`
The bridge between React and Phaser. It initializes the Phaser canvas, draws the environment, syncs the engine's character coordinates to Phaser sprites, and renders the HUD overlay reading directly from the React state.

### `client/src/pages/World.tsx`
The main page component. It wraps the Phaser game and provides the UI controls (Play/Pause/Step) to advance the `worldEngine`.

## 🔮 Future Roadmap (Mockup to Fullstack)

This project is currently structured as a rapid frontend prototype with in-memory state. To evolve this into a true AI Town:
- **LLM Integration:** Replace the mocked `conversationPool` with real calls to an LLM (e.g., OpenAI, Anthropic) to generate dialogue based on character personalities and the current world state.
- **Database Persistence:** Move the `WorldState` and historical logs to a database (e.g., PostgreSQL via Drizzle ORM) so the world persists across sessions.
- **Advanced Pathfinding:** Implement A* or NavMesh routing for characters instead of basic random walks.
