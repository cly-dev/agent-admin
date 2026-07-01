import { useEffect, useRef } from 'react';
import styles from './OmnixCanvasLogo.module.scss';

const FULL = 'OMNIX';
const INK = '#12161f';
const BLUE = '#1877F2';
const BG = 'transparent';

type Layout = {
  fontSize: number;
  cursorW: number;
  cursorGap: number;
  padX: number;
  fullTextW: number;
  slotW: number;
  canvasW: number;
  canvasH: number;
  y: number;
};

type OmnixCanvasLogoProps = {
  className?: string;
};

const OmnixCanvasLogo: React.FC<OmnixCanvasLogoProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const layoutRef = useRef<Layout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    let step = 0;
    let dir = 1;
    let blinkOn = true;

    const clearTimers = () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
      if (blinkRef.current) {
        clearInterval(blinkRef.current);
        blinkRef.current = null;
      }
    };

    const schedule = (fn: () => void, ms: number) => {
      const timer = setTimeout(fn, ms);
      timersRef.current.push(timer);
    };

    const measure = (str: string, letterSpacing: number) => {
      if (!str) {
        return 0;
      }
      ctx.letterSpacing = `${letterSpacing}px`;
      return ctx.measureText(str).width;
    };

    const computeLayout = (parentWidth: number): Layout => {
      const maxW = Math.min(parentWidth, 520);
      let fontSize = Math.min(maxW * 0.25, 160);
      let letterSpacing = fontSize * 0.04;
      let cursorW = fontSize * 0.05;
      let cursorGap = fontSize * 0.2;
      let padX = fontSize * 0.1;

      ctx.font = `italic ${fontSize}px 'Bebas Neue', Impact, sans-serif`;
      ctx.textBaseline = 'alphabetic';

      let fullTextW = measure(FULL, letterSpacing);
      let slotW = fullTextW + cursorGap + cursorW;
      let canvasW = Math.ceil(slotW + padX * 2);

      if (canvasW > maxW) {
        const scale = (maxW - padX * 2) / slotW;
        fontSize = Math.max(48, fontSize * scale);
        letterSpacing = fontSize * 0.04;
        cursorW = fontSize * 0.05;
        cursorGap = fontSize * 0.2;
        padX = fontSize * 0.1;
        ctx.font = `italic ${fontSize}px 'Bebas Neue', Impact, sans-serif`;
        fullTextW = measure(FULL, letterSpacing);
        slotW = fullTextW + cursorGap + cursorW;
        canvasW = Math.ceil(slotW + padX * 2);
      }

      const canvasH = Math.max(100, Math.min(180, fontSize * 1.15));

      return {
        fontSize,
        cursorW,
        cursorGap,
        padX,
        fullTextW,
        slotW,
        canvasW,
        canvasH,
        y: canvasH * 0.78,
      };
    };

    const applyCanvasSize = (layout: Layout) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(layout.canvasW * dpr);
      canvas.height = Math.ceil(layout.canvasH * dpr);
      canvas.style.width = `${layout.canvasW}px`;
      canvas.style.height = `${layout.canvasH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutRef.current = layout;
    };

    const setSize = () => {
      const parentWidth = canvas.parentElement?.offsetWidth ?? 520;
      const layout = computeLayout(parentWidth);
      applyCanvasSize(layout);
      return layout;
    };

    const draw = (text: string, showCursor: boolean) => {
      const layout = layoutRef.current ?? setSize();
      const letterSpacing = layout.fontSize * 0.04;

      ctx.clearRect(0, 0, layout.canvasW, layout.canvasH);
      if (BG !== 'transparent') {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, layout.canvasW, layout.canvasH);
      }

      ctx.font = `italic ${layout.fontSize}px 'Bebas Neue', Impact, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.letterSpacing = `${letterSpacing}px`;

      const head = text.slice(0, 3);
      const tail = text.slice(3);
      const textW = measure(text, letterSpacing);
      const reserveCursorSlot = showCursor || text === FULL;
      const contentW = textW + (reserveCursorSlot ? layout.cursorGap + layout.cursorW : 0);
      const startX = layout.padX + (layout.slotW - contentW) / 2;

      let x = startX;
      if (head) {
        ctx.fillStyle = INK;
        ctx.fillText(head, x, layout.y);
        x += measure(head, letterSpacing);
      }
      if (tail) {
        ctx.fillStyle = BLUE;
        ctx.fillText(tail, x, layout.y);
        x += measure(tail, letterSpacing);
      }

      if (showCursor) {
        x += layout.cursorGap;
        const curH = layout.fontSize * 0.82;
        const curY = layout.y - curH + layout.fontSize * 0.06;
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.roundRect(x, curY, layout.cursorW, curH, 2);
        ctx.fill();
      }
    };

    const startBlink = () => {
      if (blinkRef.current) {
        clearInterval(blinkRef.current);
      }
      blinkRef.current = setInterval(() => {
        blinkOn = !blinkOn;
        draw(FULL.slice(0, step), blinkOn);
      }, 530);
    };

    const stopBlink = () => {
      if (blinkRef.current) {
        clearInterval(blinkRef.current);
        blinkRef.current = null;
      }
      blinkOn = true;
    };

    const tick = () => {
      draw(FULL.slice(0, step), true);
      if (dir === 1) {
        if (step < FULL.length) {
          step += 1;
          stopBlink();
          schedule(tick, 110 + Math.random() * 50);
        } else {
          startBlink();
          schedule(() => {
            dir = -1;
            stopBlink();
            tick();
          }, 1800);
        }
      } else if (step > 0) {
        step -= 1;
        stopBlink();
        schedule(tick, 75);
      } else {
        schedule(() => {
          dir = 1;
          tick();
        }, 400);
      }
    };

    const start = () => {
      setSize();
      if (reducedMotion) {
        draw(FULL, false);
        return;
      }
      tick();
    };

    document.fonts
      .load("italic 160px 'Bebas Neue'")
      .then(start)
      .catch(start);

    const onResize = () => {
      setSize();
      draw(FULL.slice(0, step), blinkOn);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimers();
    };
  }, []);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
    </div>
  );
};

export default OmnixCanvasLogo;
