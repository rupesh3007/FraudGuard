import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export default function AnimatedNumber({ value, decimals = 0, suffix = "", prefix = "", duration = 1.1 }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <span className="tabular">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
