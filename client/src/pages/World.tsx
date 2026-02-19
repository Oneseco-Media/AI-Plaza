import PhaserGame from "@/components/PhaserGame";
import { worldEngine } from "@/lib/engine";
import { useEffect, useState } from "react";
import { Play, Pause, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function World() {
  const [autoRun, setAutoRun] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRun) {
      interval = setInterval(() => {
        worldEngine.advanceTurn();
      }, 1500); // run every 1.5s for faster demo
    }
    return () => clearInterval(interval);
  }, [autoRun]);

  return (
    <div className="relative w-screen h-screen bg-black">
      
      {/* Fullscreen Game */}
      <PhaserGame />
      
      {/* Controls HUD */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/60 backdrop-blur-md border border-primary/30 rounded-full shadow-[0_0_15px_rgba(0,255,255,0.2)]">
         <Button 
            size="icon"
            variant="outline"
            className="rounded-full border-secondary text-secondary hover:bg-secondary/20 hover:text-secondary"
            onClick={() => worldEngine.advanceTurn()}
            disabled={autoRun}
         >
           <FastForward className="w-4 h-4" />
         </Button>
         
         <Button 
            size="icon"
            className={`rounded-full border ${autoRun ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/40' : 'bg-primary/20 border-primary text-primary hover:bg-primary/40'}`}
            onClick={() => setAutoRun(!autoRun)}
         >
           {autoRun ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
         </Button>
      </div>
      
    </div>
  );
}