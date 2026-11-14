import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};
const I = (d: string) => (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d={d} />
  </svg>
);

export const IconDeck = I('M4 5h16v11H4zM8 19h8M7 9h10');
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
export const IconPlus = I('M12 5v14M5 12h14');
export const IconCheck = I('M5 12.5l4.5 4.5L19 7.5');
export const IconX = I('M6 6l12 12M18 6L6 18');
export const IconHeart = I('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z');
export const IconInfo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IconBell = I('M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0');
export const IconCamera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M12 21s6-5.2 6-10.5a6 6 0 0 0-12 0C6 15.8 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></svg>
);
export const IconFlag = I('M6 20V5M6 5h11l-2 4 2 4H6');
export const IconBack = I('M15 5l-7 7 7 7');
export const IconGrid = I('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z');
export const IconList = I('M4 7h16M4 12h16M4 17h16');
export const IconGoogle = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1-3.8 1-2.9 0-5.4-2-6.2-4.6H2.2v2.8A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.2a11 11 0 0 0 0 9.6z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.2L5.8 10c.8-2.600 3.300-4.600 6.200-4.600z" />
  </svg>
);

export const IconEye = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.1 3.9M6.5 6.7C3.8 8.5 2 12 2 12s3.6 6.5 10 6.5c1.7 0 3.2-.4 4.5-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
