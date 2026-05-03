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
      backgroundColor: "#1a2421", // Dark forest green
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
          // Use grass/path tiles to look more like Pokemon
          // Using indices from the desert spritesheet but tinting them green for grass
          const tileIndex = (Math.random() > 0.9) ? 30 : 29; 
          const tile = this.add.sprite(x * TILE_SIZE, y * TILE_SIZE, 'desert', tileIndex).setOrigin(0);
          
          // Tint green for a lush, simple environment
          tile.tint = 0x88cc88;
        }
      }

      // Add a simple border around the world
      const graphics = this.add.graphics();
      graphics.lineStyle(4, 0x88cc88, 0.5);
      graphics.strokeRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

      // Add some random trees for scenery
      for (let i = 0; i < 40; i++) {
        const tx = Phaser.Math.Between(1, MAP_WIDTH - 2) * TILE_SIZE;
        const ty = Phaser.Math.Between(1, MAP_HEIGHT - 2) * TILE_SIZE;
        
        // Minimalist trees
        const tree = this.add.image(tx, ty, 'tree').setOrigin(0.5, 1);
        tree.setDepth(2);
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
        building.fillStyle(0xffffff, 0.9); // Clean white buildings
        building.lineStyle(2, 0xaaaaaa, 1); // Subtle grey border
        
        // Draw building centered on POI but occupying multiple tiles
        building.fillRect(poi.x * TILE_SIZE - (bWidth * TILE_SIZE)/2 + TILE_SIZE/2, poi.y * TILE_SIZE - (bHeight * TILE_SIZE)/2 + TILE_SIZE/2, bWidth * TILE_SIZE, bHeight * TILE_SIZE);
        building.strokeRect(poi.x * TILE_SIZE - (bWidth * TILE_SIZE)/2 + TILE_SIZE/2, poi.y * TILE_SIZE - (bHeight * TILE_SIZE)/2 + TILE_SIZE/2, bWidth * TILE_SIZE, bHeight * TILE_SIZE);
        building.setDepth(1);

        const poiBg = this.add.graphics();
        poiBg.fillStyle(0xffffff, 0.9); // White background for tags
        poiBg.lineStyle(1, 0xdddddd, 1); // Subtle border
        
        // Measure text width to size background
        const testText = this.add.text(0, 0, poi.name, { fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold' });
        const textWidth = testText.width + 10; // 5px padding on each side
        testText.destroy();

        poiBg.fillRoundedRect(-textWidth/2, -12, textWidth, 24, 4); // Rounded rects for a softer look
        poiBg.strokeRoundedRect(-textWidth/2, -12, textWidth, 24, 4);
        
        const poiText = this.add.text(0, 0, poi.name, {
          fontFamily: 'sans-serif', fontSize: '10px', color: '#333333', fontStyle: 'bold'
        }).setOrigin(0.5);

        const container = this.add.container(poi.x * TILE_SIZE + TILE_SIZE/2, poi.y * TILE_SIZE + TILE_SIZE/2, [poiBg, poiText]);
        container.setDepth(10);
        poiMarkers[poi.id] = container;
      });

      // Calculate scaling to stretch background across the screen
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const mapPixelW = MAP_WIDTH * TILE_SIZE;
      const mapPixelH = MAP_HEIGHT * TILE_SIZE;
      
      // Calculate a zoom level that covers the screen entirely
      const zoomX = screenW / mapPixelW;
      const zoomY = screenH / mapPixelH;
      const targetZoom = Math.max(zoomX, zoomY, 1.2); // Zoom in closer for Pokemon style
      
      this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
      this.cameras.main.setZoom(targetZoom);
    }

    function showSpeechBubble(scene: Phaser.Scene, charId: string, text: string) {
      if (bubbles[charId]) {
        bubbles[charId].destroy();
      }

      const sprite = sprites[charId];
      if (!sprite) return;

      const bubbleWidth = 180;
      const content = scene.add.text(0, -30, text, {
        fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff', align: 'center', wordWrap: { width: bubbleWidth - 10 }
      }).setOrigin(0.5);

      const bubbleHeight = content.height + 15;
      content.y = -bubbleHeight / 2;

      const bubble = scene.add.graphics({ x: 0, y: 0 });
      bubble.fillStyle(0x000000, 0.7);
      bubble.lineStyle(2, 0x444444, 1);
      
      // Bubble shape
      bubble.fillRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
      bubble.strokeRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
      
      // Little triangle pointer
      bubble.fillStyle(0x000000, 0.7);
      bubble.fillTriangle(-5, 0, 5, 0, 0, 10);
      bubble.lineStyle(2, 0x444444, 1);
      bubble.strokeTriangle(-5, 0, 5, 0, 0, 10);

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
        fontFamily: 'sans-serif', fontSize: '11px', color: color,
        stroke: '#ffffff', strokeThickness: 2, fontStyle: 'bold'
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
            <div className="bg-black/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg pointer-events-auto w-64">
               <h1 className="text-xl font-bold text-slate-100 tracking-wide">Realm Engine</h1>
               <div className="mt-2 space-y-1 font-sans text-xs">
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
            <div className="bg-black/40 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-lg pointer-events-auto w-64 h-24 flex flex-col mt-4">
               <h2 className="font-bold text-sm text-slate-200 mb-1 uppercase tracking-wide border-b border-slate-700 pb-1">Event Log</h2>
               <div className="overflow-y-auto font-sans text-[10px] space-y-1 flex-1 pr-1 flex flex-col-reverse">
                 {engineState.events.slice(0, 8).map((e, i) => (
                    <div key={e.id} className="opacity-80">
                      <span className="text-slate-400 mr-1">[{e.timestamp}]</span>
                      <span className={`
                        ${e.type === 'SYSTEM_ALERT' ? 'text-red-400 font-bold' : 
                          e.type === 'TERRITORY_SHIFT' ? 'text-blue-400' : 
                          e.type === 'TASK_COMPLETED' ? 'text-green-400' :
                          'text-slate-200'}
                      `}>{e.description}</span>
                    </div>
                 ))}
               </div>
            </div>
         </div>

         {/* Right Side HUD - Districts & Characters */}
         <div className="flex flex-col items-end gap-4 pointer-events-auto h-full overflow-y-auto max-h-[80vh] pb-8 pr-2">
            <div className="bg-black/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg w-72">
               <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wide border-b border-slate-700/50 pb-1 mb-2">Area Status</h2>
               <div className="space-y-3 font-sans text-xs">
                 {Object.entries(engineState.world.districts).map(([name, data]) => (
                   <div key={name} className="flex flex-col border-b border-slate-700/30 pb-2 last:border-0">
                     <div className="flex justify-between text-slate-100">
                       <span className="font-bold">{name}</span>
                       <span className={data.tension > 60 ? 'text-red-400' : 'text-green-400'}>{data.tension}% Tension</span>
                     </div>
                     <div className="flex justify-between text-slate-400 mt-1 text-[10px]">
                       <span>Dominant Guild: {data.control}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg w-72">
               <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wide border-b border-slate-700/50 pb-1 mb-2">Guilds & Locations</h2>
               <div className="space-y-3 font-sans text-xs mb-4">
                 {Object.entries(engineState.world.factions).map(([name, data]) => (
                   <div key={name} className="flex flex-col border-b border-slate-700/30 pb-2 last:border-0">
                     <div className="flex justify-between text-slate-100">
                       <span className="font-bold">{name}</span>
                       <span className="text-orange-400">Power: {data.power}</span>
                     </div>
                     <div className="flex justify-between text-slate-400 mt-1 text-[10px]">
                       <span>Leader: {data.leader}</span>
                     </div>
                   </div>
                 ))}
               </div>
               
               <h3 className="text-xs font-bold text-slate-300 uppercase border-b border-slate-700/50 pb-1 mb-2">Locations</h3>
               <div className="grid grid-cols-2 gap-2 font-sans text-[10px] text-slate-300">
                 {engineState.world.pois.map(poi => (
                   <div key={poi.id} className="flex justify-between items-center bg-black/50 p-1.5 border border-slate-700 rounded-md">
                     <span className="truncate font-semibold" title={poi.name}>{poi.name}</span>
                     <span className="text-slate-500 ml-1">[{poi.x},{poi.y}]</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg w-72">
               <h2 className="text-sm font-bold text-green-400 uppercase tracking-wide border-b border-slate-700/50 pb-1 mb-2">Heroes</h2>
               <div className="space-y-3 font-sans text-xs">
                 {engineState.chars.map(c => (
                   <div key={c.id} className="flex flex-col border-b border-slate-700/30 pb-3 last:border-0">
                     <div className="flex justify-between text-slate-100 items-center">
                       <span className="font-bold flex items-center gap-1" style={{color: `#${c.color.toString(16)}`}}>
                         {c.name}
                         <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">{c.role}</span>
                       </span>
                       <span className="text-[10px] text-slate-400">{c.persona.trait}</span>
                     </div>
                     <div className="flex justify-between text-slate-300 mt-1.5 text-[10px]">
                       <span>Status: {c.action}</span>
                       <div className="flex gap-2 text-right">
                         <span className="text-yellow-400 font-bold">G{c.credits}</span>
                       </div>
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 mt-2 flex rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{width: `${c.energy}%`}} />
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 mt-1 flex rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full" style={{width: `${c.health}%`}} />
                     </div>
                     {c.inventory.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.inventory.map(item => (
                             <span key={item.id} className="text-[9px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50">
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