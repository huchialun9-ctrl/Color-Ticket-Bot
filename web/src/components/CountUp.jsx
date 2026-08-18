import { useState, useEffect, useRef } from 'react';

/** 平滑滾動的動態數字（跳動計數器） */
export default function CountUp({ value, duration = 600 }) {
  const targetVal = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  const [display, setDisplay] = useState(targetVal);
  const prevRef = useRef(targetVal);

  useEffect(() => {
    const from = prevRef.current;
    const to = targetVal;
    prevRef.current = to;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetVal, duration]);

  return <>{display.toLocaleString('en-US')}</>;
}
