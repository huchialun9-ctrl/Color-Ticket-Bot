import { useState, useEffect, useMemo } from 'react';

/** 平滑滾動的動態數字（跳動計數器） */
export default function CountUp({ value, duration = 600 }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prev = useMemo(() => display, []);

  useEffect(() => {
    const from = prev;
    const to = value ?? 0;
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
  }, [value, duration, prev]);

  return <>{display.toLocaleString('en-US')}</>;
}
