import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { worldEngine, Character, Dialogue, Event, WorldState } from "@/lib/engine";

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [engineState, setEngineState] = useState<{
    chars: Character[],
    dialogues: Dialogue[],
    events: Event[],
    world: WorldState
  }>({
    chars: [], dialogues: [], events: [], world: worldEngine['state']
  });

  const phaserGame = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: "#0d1117", // darker gray
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: {
        preload: preloadScene,
        create: createScene,
        update: updateScene
      },
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }
        }
      }
    };

    let sprites: Record<string, Phaser.GameObjects.Sprite> = {};
    let names: Record<string, Phaser.GameObjects.Text> = {};
    let bubbles: Record<string, Phaser.GameObjects.Container> = {};
    let poiMarkers: Record<string, Phaser.GameObjects.Container> = {};
    let floatingTexts: Record<string, Phaser.GameObjects.Text[]> = {};
    let currentDialogues: Set<string> = new Set();
    
    let currentScene: Phaser.Scene;
    let rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    let acidRainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    let dayNightOverlay: Phaser.GameObjects.Rectangle | null = null;

    function preloadScene(this: Phaser.Scene) {
      this.load.spritesheet('dude', '/dude.png', { frameWidth: 32, frameHeight: 48 });
      this.load.spritesheet('desert', '/desert.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
      this.load.image('tree', '/tree.png');
      this.load.image('rain', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/rain.png');
    }

    function createScene(this: Phaser.Scene) {
      currentScene = this;

      // Floor pattern using desert tiles
      for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
          // Use sand tile (index 29 in tmw_desert)
          const tileIndex = (Math.random() > 0.9) ? 30 : 29; // occasionally add a variation
          const tile = this.add.sprite(x * TILE_SIZE, y * TILE_SIZE, 'desert', tileIndex).setOrigin(0);
          
          // Tint to fit our cyberpunk/neon palette slightly, or keep it original 16-bit
          // We will tint the environment slightly blue/dark to keep the Cyberpunk vibe
          tile.tint = 0x88aacc;
        }
      }

      // Add a border around the world
      const graphics = this.add.graphics();
      graphics.lineStyle(4, 0x06b6d4, 0.5);
      graphics.strokeRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

      // Add some random trees for scenery
      for (let i = 0; i < 40; i++) {
        const tx = Phaser.Math.Between(1, MAP_WIDTH - 2) * TILE_SIZE;
        const ty = Phaser.Math.Between(1, MAP_HEIGHT - 2) * TILE_SIZE;
        const tree = this.add.image(tx, ty, 'tree').setOrigin(0.5, 1);
        tree.tint = 0x66ccff; // neon tint
      }

      // Create animations
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
      });

      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });

      // Setup initial characters
      worldEngine.chars.forEach(c => {
        sprites[c.id] = this.add.sprite(c.x * TILE_SIZE + TILE_SIZE/2, c.y * TILE_SIZE + TILE_SIZE/2, 'dude');
        sprites[c.id].tint = c.color;
        
        names[c.id] = this.add.text(c.x * TILE_SIZE + TILE_SIZE/2, c.y * TILE_SIZE - 20, c.name, {
          fontFamily: 'monospace', fontSize: '12px', color: '#fff', align: 'center', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
      });

      // Setup POIs and Buildings
      engineState.world.pois.forEach(poi => {
        // Draw actual building
        const bWidth = poi.type === 'Corp' ? 4 : poi.type === 'Hideout' ? 2 : poi.type === 'Shop' ? 2 : 3;
        const bHeight = poi.type === 'Corp' ? 4 : poi.type === 'Hideout' ? 2 : poi.type === 'Shop' ? 2 : 2;
        
        const building = this.add.graphics();
        building.fillStyle(poi.type === 'Corp' ? 0x112233 : poi.type === 'Bar' ? 0x331122 : poi.type === 'Shop' ? 0x113311 : 0x222222, 1);
        building.lineStyle(2, poi.type === 'Corp' ? 0x00ffff : poi.type === 'Bar' ? 0xff00ff : poi.type === 'Shop' ? 0x00ffaa : 0xaaaaaa, 1);
        
        // Draw building centered on POI but occupying multiple tiles
        building.fillRect(poi.x * TILE_SIZE - (bWidth * TILE_SIZE)/2 + TILE_SIZE/2, poi.y * TILE_SIZE - (bHeight * TILE_SIZE)/2 + TILE_SIZE/2, bWidth * TILE_SIZE, bHeight * TILE_SIZE);
        building.strokeRect(poi.x * TILE_SIZE - (bWidth * TILE_SIZE)/2 + TILE_SIZE/2, poi.y * TILE_SIZE - (bHeight * TILE_SIZE)/2 + TILE_SIZE/2, bWidth * TILE_SIZE, bHeight * TILE_SIZE);
        building.setDepth(1);

        const poiBg = this.add.graphics();
        poiBg.fillStyle(0x000000, 0.8);
        poiBg.lineStyle(1, 0xffaa00, 0.8);
        
        // Measure text width to size background
        const testText = this.add.text(0, 0, poi.name, { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold' });
        const textWidth = testText.width + 10; // 5px padding on each side
        testText.destroy();

        poiBg.strokeRect(-textWidth/2, -12, textWidth, 24);
        poiBg.fillRect(-textWidth/2, -12, textWidth, 24);
        
        const poiText = this.add.text(0, 0, poi.name, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffaa00', fontStyle: 'bold'
        }).setOrigin(0.5);

        const container = this.add.container(poi.x * TILE_SIZE + TILE_SIZE/2, poi.y * TILE_SIZE + TILE_SIZE/2, [poiBg, poiText]);
        container.setDepth(10);
        poiMarkers[poi.id] = container;
      });

      // Camera settings
      this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
      this.cameras.main.setZoom(0.6);

      // Create particle emitter for weather
      const rainConfig = {
        x: { min: 0, max: MAP_WIDTH * TILE_SIZE },
        y: 0,
        lifespan: 2000,
        speedY: { min: 200, max: 400 },
        speedX: { min: -50, max: -20 },
        scale: { start: 0.4, end: 0.1 },
        quantity: 2,
        blendMode: 'ADD' as const
      };

      const rainParticles = this.add.particles(0, 0, 'rain', rainConfig);
      rainParticles.setDepth(50);
      rainParticles.stop(); // default stopped
      rainEmitter = rainParticles;

      const acidRainParticles = this.add.particles(0, 0, 'rain', {
        ...rainConfig,
        tint: 0x00ff00
      });
      acidRainParticles.setDepth(50);
      acidRainParticles.stop();
      acidRainEmitter = acidRainParticles;
      
      // Setup day/night overlay
      dayNightOverlay = this.add.rectangle(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE, 0x000033);
      dayNightOverlay.setOrigin(0);
      dayNightOverlay.setDepth(40);
      dayNightOverlay.setAlpha(0); // Day time default
      dayNightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

      // Add a smog emitter
      const smogParticles = this.add.particles(0, 0, 'rain', {
        x: { min: 0, max: MAP_WIDTH * TILE_SIZE },
        y: { min: 0, max: MAP_HEIGHT * TILE_SIZE },
        lifespan: 5000,
        speedY: { min: -10, max: 10 },
        speedX: { min: 20, max: 50 },
        scale: { start: 2, end: 4 },
        quantity: 1,
        alpha: { start: 0.1, end: 0 },
        tint: 0x555555,
        blendMode: 'SCREEN'
      });
      smogParticles.setDepth(45);
      smogParticles.stop();
      (this as any).smogEmitter = smogParticles;
    }

    function showSpeechBubble(scene: Phaser.Scene, charId: string, text: string) {
      if (bubbles[charId]) {
        bubbles[charId].destroy();
      }

      const sprite = sprites[charId];
      if (!sprite) return;

      const bubbleWidth = 180;
      const content = scene.add.text(0, -30, text, {
        fontFamily: 'monospace', fontSize: '11px', color: '#fff', align: 'center', wordWrap: { width: bubbleWidth - 10 },
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);

      const bubbleHeight = content.height + 15;
      content.y = -bubbleHeight / 2;

      const bubble = scene.add.graphics({ x: 0, y: 0 });
      bubble.fillStyle(0x000000, 0.7);
      bubble.lineStyle(2, 0x06b6d4, 1);
      
      // Bubble shape
      bubble.fillRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
      bubble.strokeRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
      
      // Little triangle pointer
      bubble.fillStyle(0x000000, 0.7);
      bubble.fillTriangle(-5, 0, 5, 0, 0, 10);
      bubble.lineStyle(2, 0x06b6d4, 1);
      bubble.strokeTriangle(-5, 0, 5, 0, 0, 10); // this overlaps but works well enough for mockup

      const container = scene.add.container(sprite.x, sprite.y - TILE_SIZE, [bubble, content]);
      container.setDepth(100);
      bubbles[charId] = container;

      // Tween bubble fading out
      scene.tweens.add({
        targets: container,
        alpha: 0,
        delay: 3500,
        duration: 500,
        onComplete: () => {
          if (bubbles[charId] === container) {
             container.destroy();
             delete bubbles[charId];
          }
        }
      });
    }

    function showFloatingText(scene: Phaser.Scene, charId: string, text: string, color: string) {
      const sprite = sprites[charId];
      if (!sprite) return;

      if (!floatingTexts[charId]) {
         floatingTexts[charId] = [];
      }

      const floatText = scene.add.text(sprite.x, sprite.y - 20, text, {
        fontFamily: 'monospace', fontSize: '10px', color: color,
        stroke: '#000', strokeThickness: 2, fontStyle: 'bold'
      }).setOrigin(0.5);

      floatText.setDepth(110);
      floatingTexts[charId].push(floatText);

      // Simple physics/tween to make it float up and fade
      scene.tweens.add({
        targets: floatText,
        y: floatText.y - 30,
        alpha: 0,
        duration: 1500,
        ease: 'Cubic.easeOut',
        onComplete: () => {
           floatText.destroy();
           floatingTexts[charId] = floatingTexts[charId].filter(t => t !== floatText);
        }
      });
    }

    function updateScene(this: Phaser.Scene) {
      // Sync engine characters to sprites
      let midX = 0;
      let midY = 0;
      let charCount = 0;

      // Update ambient light based on time of day (0-23)
      const hour = engineState.world.timeOfDay;
      let darkness = 0;
      if (hour >= 20 || hour <= 5) darkness = 0.6; // Night
      else if (hour === 6 || hour === 19) darkness = 0.3; // Dusk/Dawn
      else darkness = 0.0; // Day
      
      if (dayNightOverlay) {
         dayNightOverlay.setAlpha(dayNightOverlay.alpha + (darkness - dayNightOverlay.alpha) * 0.05);
      }

      // Handle weather effects
      if (rainEmitter && acidRainEmitter) {
        if (engineState.world.weather === 'Rain') {
          if (!rainEmitter.active) rainEmitter.start();
          acidRainEmitter.stop();
          if ((this as any).smogEmitter) (this as any).smogEmitter.stop();
        } else if (engineState.world.weather === 'Acid Rain') {
          if (!acidRainEmitter.active) acidRainEmitter.start();
          rainEmitter.stop();
          if ((this as any).smogEmitter) (this as any).smogEmitter.stop();
        } else if (engineState.world.weather === 'Smog') {
          rainEmitter.stop();
          acidRainEmitter.stop();
          if ((this as any).smogEmitter && !(this as any).smogEmitter.active) (this as any).smogEmitter.start();
        } else {
          rainEmitter.stop();
          acidRainEmitter.stop();
          if ((this as any).smogEmitter) (this as any).smogEmitter.stop();
        }
      }

      worldEngine.chars.forEach(c => {
        if (sprites[c.id]) {
          const targetPxX = c.x * TILE_SIZE + TILE_SIZE/2;
          const targetPxY = c.y * TILE_SIZE + TILE_SIZE/2;

          // Smooth interpolation for tile walking
          const dx = targetPxX - sprites[c.id].x;
          const dy = targetPxY - sprites[c.id].y;
          
          sprites[c.id].x += dx * 0.05;
          sprites[c.id].y += dy * 0.05;

          // Animation logic
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            if (Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) sprites[c.id].anims.play('left', true);
              else sprites[c.id].anims.play('right', true);
            } else {
              // Since dude only has left/right/turn, we'll use left/right for up/down slightly or just turn
              // Actually, left/right looks better when moving than standing still
              if (dx < 0) sprites[c.id].anims.play('left', true);
              else if (dx > 0) sprites[c.id].anims.play('right', true);
              else sprites[c.id].anims.play('left', true); // generic walk
            }
          } else {
            sprites[c.id].anims.play('turn');
          }
          
          names[c.id].x = sprites[c.id].x;
          names[c.id].y = sprites[c.id].y - 30;

          if (bubbles[c.id]) {
            bubbles[c.id].x = sprites[c.id].x;
            bubbles[c.id].y = sprites[c.id].y - TILE_SIZE - 10;
          }

          if (floatingTexts[c.id]) {
             // Keep floating text tracking X but let Y animation run
             floatingTexts[c.id].forEach(ft => {
                ft.x = sprites[c.id].x;
             });
          }

          midX += sprites[c.id].x;
          midY += sprites[c.id].y;
          charCount++;
        }
      });

      // Smooth camera follow on mid point
      if (charCount > 0) {
        midX /= charCount;
        midY /= charCount;
        this.cameras.main.scrollX += (midX - this.cameras.main.width / 2 - this.cameras.main.scrollX) * 0.05;
        this.cameras.main.scrollY += (midY - this.cameras.main.height / 2 - this.cameras.main.scrollY) * 0.05;
      }
    }

    phaserGame.current = new Phaser.Game(config);

    // Subscribe to engine
    const unsubscribe = worldEngine.subscribe((state, events, dialogues, chars) => {
      setEngineState({ world: state, events, dialogues, chars });
      
      // Process new dialogues for speech bubbles
      dialogues.forEach(d => {
        if (!currentDialogues.has(d.id)) {
          currentDialogues.add(d.id);
          if (currentScene) {
            showSpeechBubble(currentScene, d.speakerId, d.text);
          }
        }
      });

      // Look for fresh floating text events that we haven't rendered
      // Normally we'd use a better ID tracking system, but for mockup we just take the first un-processed ones
      // Since events are unshifted, we just check the most recent events
      const recentFloatEvents = events.filter(e => e.type === 'FLOATING_TEXT' && e.timestamp === '');
      recentFloatEvents.forEach(e => {
         if (currentScene) {
            showFloatingText(currentScene, e.payload.charId, e.payload.text, e.payload.color);
            e.timestamp = Date.now().toString(); // Hack to mark it as read without mutating state poorly
         }
      });

    });

    const handleResize = () => {
       if (phaserGame.current) {
          phaserGame.current.scale.resize(window.innerWidth, window.innerHeight);
       }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      if (phaserGame.current) {
        phaserGame.current.destroy(true);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      {/* The Phaser Canvas */}
      <div ref={gameRef} className="absolute inset-0 z-0" />
      
      {/* Overlay HUD */}
      <div className="absolute inset-0 pointer-events-none z-10 p-4 flex flex-col justify-between">
         
         {/* Top HUD */}
         <div className="flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-md border border-cyan-900/50 p-4 rounded-md shadow-2xl pointer-events-auto w-64">
               <h1 className="text-xl font-display text-primary glitch-text tracking-widest uppercase">Nexus World</h1>
               <div className="mt-2 space-y-1 font-mono text-xs">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">TURN</span>
                   <span className="text-white">{engineState.world.turn}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">MOOD</span>
                   <span className="text-white">{engineState.world.globalMood}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">RELATIONSHIP</span>
                   <span className="text-white">{engineState.world.relationships['Neon:Cipher']}%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">TIME</span>
                   <span className="text-white">{engineState.world.timeOfDay.toString().padStart(2, '0')}:00</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">WEATHER</span>
                   <span className={engineState.world.weather === 'Acid Rain' ? 'text-green-400' : 'text-white'}>
                     {engineState.world.weather}
                   </span>
                 </div>
               </div>
            </div>

            {/* Event Log */}
            <div className="bg-black/60 backdrop-blur-md border border-accent/30 p-3 rounded-md shadow-2xl pointer-events-auto w-80 h-48 flex flex-col mt-4">
               <h2 className="font-display text-sm text-accent mb-2 uppercase tracking-wide border-b border-accent/20 pb-1">Event Log</h2>
               <div className="overflow-y-auto font-mono text-[10px] space-y-1 flex-1 terminal-scroll pr-1 flex flex-col-reverse">
                 {engineState.events.map((e, i) => (
                    <div key={e.id} className="opacity-80">
                      <span className="text-muted-foreground mr-1">[{e.timestamp}]</span>
                      <span className={`
                        ${e.type === 'SYSTEM_ALERT' ? 'text-destructive-foreground' : 
                          e.type === 'TERRITORY_SHIFT' ? 'text-primary' : 
                          e.type === 'TASK_COMPLETED' ? 'text-yellow-400' :
                          'text-accent'}
                      `}>{e.description}</span>
                    </div>
                 ))}
               </div>
            </div>
         </div>

         {/* Right Side HUD - Districts & Characters */}
         <div className="flex flex-col items-end gap-4 pointer-events-auto h-full overflow-y-auto max-h-[80vh] terminal-scroll">
            <div className="bg-black/60 backdrop-blur-md border border-fuchsia-900/50 p-4 rounded-md shadow-2xl w-72">
               <h2 className="text-sm font-display text-fuchsia-400 uppercase tracking-widest border-b border-fuchsia-900/50 pb-1 mb-2">District Status</h2>
               <div className="space-y-3 font-mono text-xs">
                 {Object.entries(engineState.world.districts).map(([name, data]) => (
                   <div key={name} className="flex flex-col border-b border-fuchsia-900/20 pb-2 last:border-0">
                     <div className="flex justify-between text-white">
                       <span className="font-bold">{name}</span>
                       <span className={data.tension > 60 ? 'text-red-400' : 'text-green-400'}>{data.tension}% Tension</span>
                     </div>
                     <div className="flex justify-between text-muted-foreground mt-1 text-[10px]">
                       <span>Control: {data.control}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md border border-orange-900/50 p-4 rounded-md shadow-2xl w-72">
               <h2 className="text-sm font-display text-orange-400 uppercase tracking-widest border-b border-orange-900/50 pb-1 mb-2">Factions & POIs</h2>
               <div className="space-y-3 font-mono text-xs mb-4">
                 {Object.entries(engineState.world.factions).map(([name, data]) => (
                   <div key={name} className="flex flex-col border-b border-orange-900/20 pb-2 last:border-0">
                     <div className="flex justify-between text-white">
                       <span className="font-bold">{name}</span>
                       <span className="text-orange-400">Power: {data.power}</span>
                     </div>
                     <div className="flex justify-between text-muted-foreground mt-1 text-[10px]">
                       <span>Leader: {data.leader}</span>
                     </div>
                   </div>
                 ))}
               </div>
               
               <h3 className="text-xs font-display text-yellow-400/80 uppercase border-b border-yellow-900/50 pb-1 mb-2">Locations</h3>
               <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground">
                 {engineState.world.pois.map(poi => (
                   <div key={poi.id} className="flex justify-between items-center bg-black/40 p-1 border border-yellow-900/20 rounded">
                     <span className="truncate" title={poi.name}>{poi.name}</span>
                     <span className="text-yellow-500/70 ml-1">[{poi.x},{poi.y}]</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md border border-green-900/50 p-4 rounded-md shadow-2xl w-72">
               <h2 className="text-sm font-display text-green-400 uppercase tracking-widest border-b border-green-900/50 pb-1 mb-2">Agents</h2>
               <div className="space-y-3 font-mono text-xs">
                 {engineState.chars.map(c => (
                   <div key={c.id} className="flex flex-col border-b border-green-900/20 pb-2 last:border-0">
                     <div className="flex justify-between text-white items-center">
                       <span className="font-bold flex items-center gap-1" style={{color: `#${c.color.toString(16)}`}}>
                         {c.name}
                         <span className="text-[8px] bg-black/50 px-1 rounded uppercase tracking-wider">{c.role}</span>
                       </span>
                       <span className="text-[10px] text-muted-foreground">{c.persona.trait}</span>
                     </div>
                     <div className="flex justify-between text-muted-foreground mt-1 text-[10px]">
                       <span>Status: {c.action}</span>
                       <div className="flex gap-2 text-right">
                         <span className="text-yellow-400/80">${c.credits}</span>
                         {c.bounty > 0 && <span className="text-red-500 font-bold">Bounty: ${c.bounty}</span>}
                       </div>
                     </div>
                     {c.equipped && (
                       <div className="text-[9px] text-cyan-400 mt-1">
                         Equipped: {c.equipped}
                       </div>
                     )}
                     <div className="w-full bg-black/40 h-1 mt-1 flex rounded overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{width: `${c.energy}%`}} />
                     </div>
                     <div className="w-full bg-black/40 h-1 mt-0.5 flex rounded overflow-hidden">
                        <div className="bg-red-500 h-full" style={{width: `${c.health}%`}} />
                     </div>
                     {c.inventory.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.inventory.map(item => (
                             <span key={item.id} className="text-[8px] bg-primary/20 text-primary px-1 py-0.5 rounded border border-primary/30">
                               {item.name}
                             </span>
                          ))}
                        </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}