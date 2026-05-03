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
    let currentDialogues: Set<string> = new Set();
    
    let currentScene: Phaser.Scene;

    function preloadScene(this: Phaser.Scene) {
      this.load.spritesheet('dude', '/dude.png', { frameWidth: 32, frameHeight: 48 });
      this.load.spritesheet('desert', '/desert.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
      this.load.image('tree', '/tree.png');
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

      // Camera settings
      this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
      this.cameras.main.setZoom(1.5);
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

    function updateScene(this: Phaser.Scene) {
      // Sync engine characters to sprites
      let midX = 0;
      let midY = 0;
      let charCount = 0;

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
               </div>
            </div>

            {/* Event Log */}
            <div className="bg-black/60 backdrop-blur-md border border-accent/30 p-3 rounded-md shadow-2xl pointer-events-auto w-80 h-48 flex flex-col">
               <h2 className="font-display text-sm text-accent mb-2 uppercase tracking-wide border-b border-accent/20 pb-1">Event Log</h2>
               <div className="overflow-y-auto font-mono text-[10px] space-y-1 flex-1 terminal-scroll pr-1 flex flex-col-reverse">
                 {engineState.events.map((e, i) => (
                    <div key={e.id} className="opacity-80">
                      <span className="text-muted-foreground mr-1">[{e.timestamp}]</span>
                      <span className={`
                        ${e.type === 'SYSTEM_ALERT' ? 'text-destructive-foreground' : 
                          e.type === 'TERRITORY_SHIFT' ? 'text-primary' : 
                          'text-accent'}
                      `}>{e.description}</span>
                    </div>
                 ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}