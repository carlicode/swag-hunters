// Se ejecuta antes de que cargue cualquier página (escenario e iframe de la app).
export function init(fakeNowIso) {
  const Real = Date;
  const offset = new Real(fakeNowIso).getTime() - Real.now();
  class FakeDate extends Real {
    constructor(...a) { if (a.length === 0) super(Real.now() + offset); else super(...a); }
    static now() { return Real.now() + offset; }
  }
  window.Date = FakeDate;
  if (window === window.top) return; // los datos de ejemplo solo van en la app (iframe)

  const now = Date.now();
  const min = (m) => new Date(now + m * 60000).toISOString();
  const sw = (id, company, key, title, howTo, reference, photo, author, ago) =>
    ({ id, company, companyKey: key, title, howTo, reference, photoKey: photo, authorName: author, mine: false, createdAt: min(-ago) });
  const rp = (id, swagId, kind, author, ago, text) => ({ id, swagId, kind, text, authorName: author, mine: false, createdAt: min(-ago) });
  const ct = (id, company, key, title, howTo, kind, start, reference, author) =>
    ({ id, company, companyKey: key, title, howTo, kind, startsAt: min(start), reference, authorName: author, mine: false, createdAt: min(-90) });

  const state = {
    swags: [
      sw('s1', 'Nimbus Labs', 'nimbuslabs', 'Tote bag crema', 'Escanea tu gafete en el stand y llévate una. No piden datos de tu empresa.', 'Pasillo C, frente al escenario pequeño', '/video/assets/tote.jpg', 'Luis M.', 14),
      sw('s2', 'Quark Cloud', 'quarkcloud', 'Termo negro', 'Haz la demo de 5 minutos con alguien del equipo y te lo dan al terminar.', 'Esquina del Expo, entrada norte', '/video/assets/termo.jpg', 'Sofía T.', 40),
      sw('s4', 'Helix Data', 'helixdata', 'Mochila blanca', 'Anótate al sorteo en el stand y vuelve a las 3 pm a la hora exacta.', 'Stand 980, segundo piso', '/video/assets/mochila.jpg', 'Marta G.', 35),
      sw('s6', 'Nimbus Labs', 'nimbuslabs', 'Stickers holográficos', 'Están en la mesa de la derecha, sin hacer nada.', 'Pasillo C, mesa de la derecha', undefined, 'Marta G.', 50),
      sw('s5', 'Pixel Forge', 'pixelforge', 'Gorra #swag', 'Responde 3 preguntas en el stand y te la llevas.', 'Mesa junto a la entrada', '/video/assets/gorra.jpg', 'Luis M.', 75),
      sw('s3', 'Vector Systems', 'vectorsystems', 'Polo verde edición limitada', 'Fila corta antes de las 10 am. Después se acaban las tallas M y L.', 'Stand 1420, al lado del café', '/video/assets/polo.jpg', 'Diego P.', 190),
    ],
    reports: [
      rp('r1', 's1', 'STILL_THERE', 'Marta G.', 3),
      rp('r2', 's2', 'STILL_THERE', 'Luis M.', 12),
      rp('r3', 's4', 'STILL_THERE', 'Marta G.', 30),
      rp('r4', 's4', 'TIP', 'Sofía T.', 26, 'Solo participan quienes se anotan antes de las 3 pm. Llega temprano.'),
      rp('r5', 's4', 'STILL_THERE', 'Diego P.', 20),
      rp('r6', 's6', 'STILL_THERE', 'Luis M.', 40),
      rp('r7', 's5', 'STILL_THERE', 'Sofía T.', 60),
    ],
    contests: [
      ct('c1', 'Helix Data', 'helixdata', 'Sorteo de mochila', 'Estar en el stand a la hora exacta. Si no estás, sortean otra vez.', 'TIMED', 25, 'Stand 980, segundo piso', 'Sofía T.'),
      ct('c4', 'Nimbus Labs', 'nimbuslabs', 'Demo + tote bag', 'Pasa por el stand, mira la demo y escanea tu gafete.', 'VISIT', 4 * 60, 'Pasillo C', 'Luis M.'),
      ct('c2', 'Quark Cloud', 'quarkcloud', 'Rifa de termos', 'Pide un número en el mostrador antes de las 8 pm y vuelve al sorteo.', 'TICKET', 6 * 60, 'Esquina del Expo, entrada norte', 'Marta G.'),
      ct('c3', 'Pixel Forge', 'pixelforge', 'Reto de gorra #swag', 'Resuelve el reto en 10 minutos. Ganan los 3 más rápidos.', 'VISIT', 26 * 60, 'Mesa junto a la entrada', 'Diego P.'),
    ],
    alerts: [],
    saved: [],
  };
  localStorage.setItem('swag-hunters-demo-v1', JSON.stringify(state));
  localStorage.setItem('swag-hunters-demo-auth', '1');
  localStorage.removeItem('swag-hunters-passed');
}
