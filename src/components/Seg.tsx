import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

/** Selector segmentado con una píldora que se desliza hacia la opción activa. */
export function Seg<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (active) setThumb({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    void document.fonts?.ready.then(measure); // las tipografías cambian el ancho de los botones
    return () => ro.disconnect();
  }, [value, options.length]);

  return (
    <div className={`seg ${className}`} ref={ref} role="group" aria-label={label}>
      {thumb && <span className="seg-thumb" aria-hidden style={{ width: thumb.width, transform: `translateX(${thumb.left}px)` }} />}
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
