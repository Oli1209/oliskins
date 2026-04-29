import { motion } from "framer-motion";

interface FloatingGainProps {
  id: string;
  x: number;
  y: number;
  text: string;
  onComplete: (id: string) => void;
}

export function FloatingGain({ id, x, y, text, onComplete }: FloatingGainProps) {
  return (
    <motion.span
      initial={{ opacity: 1, y: y, x: x }}
      animate={{ opacity: 0, y: y - 60, x: x }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="pointer-events-none fixed top-0 left-0 z-50 font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] text-xl"
    >
      {text}
    </motion.span>
  );
}
