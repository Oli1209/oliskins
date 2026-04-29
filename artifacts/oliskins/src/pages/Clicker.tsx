import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { MousePointerClick } from "lucide-react";

export function Clicker() {
  const { addBalanceCents } = useGameStore();
  
  const [sessionClicks, setSessionClicks] = useState(0);
  const [sessionCents, setSessionCents] = useState(0);
  const [cps, setCps] = useState(0);
  
  const lastClickTimeRef = useRef<number>(0);
  const clickTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep clicks from the last second
      clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000);
      setCps(clickTimesRef.current.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const now = Date.now();
    // Throttle at ~83ms
    if (now - lastClickTimeRef.current < 83) {
      return;
    }
    
    lastClickTimeRef.current = now;
    clickTimesRef.current.push(now);
    
    addBalanceCents(1);
    setSessionClicks(prev => prev + 1);
    setSessionCents(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Clicker</h1>
        <p className="text-zinc-400">Klikaj i zdobywaj środki na kolejne skrzynki</p>
      </div>

      <button
        onClick={handleClick}
        className="relative group focus:outline-none focus-visible:ring-0 select-none"
      >
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-400/30 group-active:bg-cyan-300/40 transition-colors duration-200"></div>
        <div className="relative w-64 h-64 rounded-full border-4 border-cyan-500/50 bg-zinc-950 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.2),inset_0_0_30px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_80px_rgba(34,211,238,0.4),inset_0_0_50px_rgba(34,211,238,0.2)] group-active:scale-95 group-hover:border-cyan-400 transition-all duration-100 cursor-pointer">
          <MousePointerClick className="w-16 h-16 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <span className="text-cyan-400 font-bold text-xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Kliknij</span>
        </div>
      </button>

      <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl w-full">
        <div className="glass-panel p-6 text-center flex flex-col items-center justify-center">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Kliknięcia (sesja)</span>
          <span className="text-2xl font-mono text-zinc-200">{sessionClicks}</span>
        </div>
        <div className="glass-panel p-6 text-center flex flex-col items-center justify-center border-cyan-500/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 text-cyan-400/70">Kliknięcia na sekundę</span>
          <span className="text-3xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{cps}</span>
        </div>
        <div className="glass-panel p-6 text-center flex flex-col items-center justify-center">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Zarobek (sesja)</span>
          <span className="text-2xl font-mono text-emerald-400">+{sessionCents}¢</span>
        </div>
      </div>

    </div>
  );
}
