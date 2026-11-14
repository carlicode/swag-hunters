// Imagen de reemplazo cuando un swag no tiene foto: una cuadrícula con una mira ámbar y las iniciales de la empresa.
// El color es siempre el del acento de la app; cada empresa cambia solo la posición y el tamaño de la mira.
export function placeholderArt(company: string): string {
  let h = 0;
  for (const ch of company) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cx = 30 + (h % 40);
  const cy = 30 + ((h >> 3) % 40);
  const r = 14 + ((h >> 6) % 14);
  const letters = company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
<rect width="100" height="100" fill="#14151a"/>
<g stroke="#2a2c33" stroke-width=".3">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 12.5} 0V100M0 ${i * 12.5}H100"/>`).join('')}</g>
<g stroke="#ffc83d" stroke-width=".7" fill="none"><circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M${cx} ${cy - r - 5}v10M${cx} ${cy + r - 5}v10M${cx - r - 5} ${cy}h10M${cx + r - 5} ${cy}h10"/></g>
<circle cx="${cx}" cy="${cy}" r="1.6" fill="#ffc83d"/>
<text x="6" y="94" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#8b8e96">${letters}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
