import { useEffect, useState, useRef } from "react";
import { worldEngine, WorldState, Event, Dialogue, characters } from "@/lib/engine";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, RotateCcw, FastForward, Activity, Database, SquareTerminal, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [world, setWorld] = useState<WorldState>(worldEngine['state']); // Accessing for initial, properly subscribed below
  const [events, setEvents] = useState<Event[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [autoRun, setAutoRun] = useState(false);
  
  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    worldEngine.subscribe((state, newEvents, newDialogues) => {
      setWorld({ ...state });
      setEvents([...newEvents]);
      setDialogues([...newDialogues]);
    });
    // Initial trigger
    worldEngine.reset();
  }, []);

  useEffect(() => {
    if (autoRun) {
      const interval = setInterval(() => {
        worldEngine.advanceTurn();
      }, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRun]);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogues]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <div className="scanline" />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary glitch-text flex items-center gap-3">
            <Cpu className="w-8 h-8" />
            NEXUS WORLD ENGINE v1.0
          </h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest mt-1 uppercase">
            Simulation Status: {autoRun ? <span className="text-secondary animate-pulse">RUNNING</span> : <span className="text-primary">PAUSED</span>} | TURN: {world?.turn || 0}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/20 font-display uppercase tracking-wider"
            onClick={() => worldEngine.reset()}
            data-testid="button-reset-world"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reboot
          </Button>
          <Button 
            variant="outline"
            className="border-secondary text-secondary hover:bg-secondary/20 font-display uppercase tracking-wider"
            onClick={() => worldEngine.advanceTurn()}
            disabled={autoRun}
            data-testid="button-advance-turn"
          >
            <FastForward className="w-4 h-4 mr-2" />
            Step
          </Button>
          <Button 
            className={`${autoRun ? 'bg-destructive hover:bg-destructive/80 text-white' : 'bg-primary hover:bg-primary/80 text-background'} font-display uppercase tracking-wider font-bold`}
            onClick={() => setAutoRun(!autoRun)}
            data-testid="button-toggle-autorun"
          >
            {autoRun ? 'Halt Simulation' : (
              <><Play className="w-4 h-4 mr-2" /> Auto-Run</>
            )}
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-[calc(100vh-140px)]">
        
        {/* Left Column: Dialogue Engine */}
        <div className="lg:col-span-4 flex flex-col bg-card border border-border rounded-none shadow-[0_0_15px_rgba(0,255,255,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
          
          <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/40">
            <h2 className="font-display text-lg text-primary flex items-center gap-2">
              <SquareTerminal className="w-5 h-5" />
              CONVERSATION ENGINE
            </h2>
            <div className="flex gap-2">
              {characters.map(c => (
                <div key={c.id} className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded-full ${c.id === 'c1' ? 'bg-cyan-400' : 'bg-fuchsia-400'}`} />
                  <span className="font-mono">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4 terminal-scroll bg-black/20">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {dialogues.map((d) => {
                  const speaker = characters.find(c => c.id === d.speakerId);
                  const isC1 = d.speakerId === 'c1';
                  
                  return (
                    <motion.div 
                      key={d.id}
                      initial={{ opacity: 0, x: isC1 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${isC1 ? 'items-start' : 'items-end'}`}
                      data-testid={`dialogue-${d.id}`}
                    >
                      <span className="text-[10px] font-mono text-muted-foreground mb-1">
                        [{d.timestamp}] {speaker?.name}
                      </span>
                      <div className={`max-w-[85%] p-3 border ${
                        isC1 
                        ? 'bg-cyan-950/20 border-cyan-900/50 text-cyan-100' 
                        : 'bg-fuchsia-950/20 border-fuchsia-900/50 text-fuchsia-100'
                        } font-mono text-sm leading-relaxed backdrop-blur-sm`}
                      >
                        {d.text}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={dialogueEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: World State & Events */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Right: World State */}
          <div className="h-1/2 flex flex-col bg-card border border-border rounded-none shadow-[0_0_15px_rgba(0,255,255,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent" />
            
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/40">
              <h2 className="font-display text-lg text-secondary flex items-center gap-2">
                <Database className="w-5 h-5" />
                GLOBAL STATE MATRIX
              </h2>
              <span className="text-xs font-mono px-2 py-1 bg-secondary/10 text-secondary border border-secondary/30">
                MOOD: {world?.globalMood}
              </span>
            </div>
            
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto terminal-scroll font-mono text-sm">
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-primary mb-2 border-b border-primary/20 pb-1">DISTRICTS</h3>
                  {world?.districts && Object.entries(world.districts).map(([name, data]) => (
                    <div key={name} className="mb-3 bg-black/30 p-2 border border-border/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-cyan-300 font-bold">{name}</span>
                        <span className="text-xs text-muted-foreground">{data.control}</span>
                      </div>
                      <div className="w-full bg-background h-1.5 mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${data.tension > 60 ? 'bg-destructive' : 'bg-primary'}`} 
                          style={{ width: `${data.tension}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                        <span>Tension</span>
                        <span>{data.tension}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-secondary mb-2 border-b border-secondary/20 pb-1">FACTION POWER</h3>
                  {world?.factions && Object.entries(world.factions).map(([name, data]) => (
                    <div key={name} className="mb-2 flex items-center gap-2">
                      <span className="w-24 text-xs truncate text-fuchsia-200">{name}</span>
                      <div className="flex-1 bg-background h-2 border border-border/30">
                        <div className="h-full bg-secondary/70 transition-all duration-500" style={{ width: `${data.power}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs">{data.power}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-accent mb-2 border-b border-accent/20 pb-1">RELATIONSHIPS</h3>
                  {world?.relationships && Object.entries(world.relationships).map(([pair, val]) => (
                    <div key={pair} className="mb-2 flex items-center gap-2">
                      <span className="w-32 text-xs truncate">{pair.split(':')[0]} <span className="text-muted-foreground">x</span> {pair.split(':')[1]}</span>
                      <div className="flex-1 bg-background h-1 border border-border/30">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Right: Event Stream */}
          <div className="h-1/2 flex flex-col bg-card border border-border rounded-none shadow-[0_0_15px_rgba(0,255,255,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent" />
            
            <div className="p-4 border-b border-border/50 bg-black/40">
              <h2 className="font-display text-lg text-accent flex items-center gap-2">
                <Activity className="w-5 h-5" />
                SYSTEM EVENT LOG
              </h2>
            </div>
            
            <ScrollArea className="flex-1 p-4 terminal-scroll bg-black/20">
              <div className="space-y-2 font-mono text-sm">
                <AnimatePresence>
                  {events.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2 flex gap-3 border-l-2 ${
                        e.type === 'SYSTEM_ALERT' ? 'border-destructive bg-destructive/10 text-destructive-foreground' :
                        e.type === 'MOOD_CHANGE' ? 'border-secondary bg-secondary/10 text-secondary' :
                        e.type === 'TERRITORY_SHIFT' ? 'border-primary bg-primary/10 text-primary' :
                        'border-accent bg-accent/10 text-accent'
                      }`}
                      data-testid={`event-${e.type.toLowerCase()}-${i}`}
                    >
                      <span className="opacity-50 shrink-0">[{e.timestamp}]</span>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-wider">{e.type}</span>
                        <span className="opacity-80 mt-1">{e.description}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

        </div>
      </div>
    </div>
  );
}
