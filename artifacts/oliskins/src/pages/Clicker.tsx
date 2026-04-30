import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { MousePointerClick } from "lucide-react";
import { BalancePill } from "../components/BalancePill";
import { GlassCard } from "../components/GlassCard";
import { FloatingGain } from "../components/FloatingGain";
import { formatMoney, formatGain } from "../lib/format";
import { AnimatePresence } from "framer-motion";

export function Clicker() {
  const { balanceCents, addBalanceCents } = useGameStore();
  
  const [sessionClicks, setSessionClicks] = useState(0);
  const [sessionCents, setSessionCents] = useState(0);
  const [cps, setCps] = useState(0);
  const [floats, setFloats] = useState<{ id: string; x: number; y: number }[]>([]);
  
  const lastClickTimeRef = useRef<number>(0);
  const clickTimesRef = useRef<number[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep clicks from the last second
      clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000);
      setCps(clickTimesRef.current.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
    const now = Date.now();
    // Throttle at ~83ms
    if (now - lastClickTimeRef.current < 83) {
      return;
    }
    
    lastClickTimeRef.current = now;
    clickTimesRef.current.push(now);
    
    addBalanceCents(2);
    setSessionClicks(prev => prev + 1);
    setSessionCents(prev => prev + 2);

    // Calculate float position
    let x = 0;
    let y = 0;

    // Handle mouse click vs keyboard trigger
    if ('clientX' in e && e.clientX !== 0 && e.clientY !== 0) {
      x = e.clientX;
      y = e.clientY;
    } else if (buttonRef.current) {
      // Center of button for keyboard
      const rect = buttonRef.current.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Add some random jitter
    x += (Math.random() - 0.5) * 40;
    y += (Math.random() - 0.5) * 20;

    const id = crypto.randomUUID();
    setFloats(prev => [...prev, { id, x, y }]);
  };

  const handleFloatComplete = (id: string) => {
    setFloats(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] overflow-hidden">
      
      <div className="mb-8 w-full flex justify-center">
        <BalancePill balanceCents={balanceCents} />
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-slate-100 mb-2">Clicker</h1>
        <p className="text-slate-400">Klikaj i zdobywaj środki na kolejne skrzynki</p>
      </div>

      <div className="relative mb-16">
        <button
          ref={buttonRef}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick(e);
            }
          }}
          className="relative group focus:outline-none focus-visible:ring-4 ring-cyan-500/50 ring-offset-4 ring-offset-slate-950 rounded-full select-none touch-manipulation"
        >
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-400/30 group-active:bg-cyan-300/40 transition-colors duration-200 animate-pulse"></div>
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-cyan-500/30 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.1),inset_0_0_30px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_80px_rgba(34,211,238,0.3),inset_0_0_50px_rgba(34,211,238,0.2)] group-active:scale-95 group-hover:border-cyan-400/80 transition-all duration-100 cursor-pointer">
            <MousePointerClick className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 mb-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            <span className="text-cyan-400 font-black text-xl md:text-2xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">Kliknij</span>
          </div>
        </button>

        <AnimatePresence>
          {floats.map(float => (
            <FloatingGain
              key={float.id}
              id={float.id}
              x={float.x}
              y={float.y}
              text={formatGain(2)}
              onComplete={handleFloatComplete}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        <GlassCard className="text-center flex flex-col items-center justify-center">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Kliknięcia (sesja)</span>
          <span className="text-3xl font-mono font-bold text-slate-200">{sessionClicks}</span>
        </GlassCard>
        
        <GlassCard strong className="text-center flex flex-col items-center justify-center border-cyan-500/50 bg-cyan-950/30">
          <span className="text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-sm">CPS</span>
          <span className="text-4xl font-mono text-cyan-400 font-black drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{cps}</span>
        </GlassCard>

        <GlassCard className="text-center flex flex-col items-center justify-center">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Zarobek (sesja)</span>
          <span className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{formatMoney(sessionCents)}</span>
        </GlassCard>
      </div>

    </div>
  );
}
