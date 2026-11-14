// Normaliza el nombre de una empresa para detectar duplicados:
// "Datadog", "datadog inc." y "DATADOG" dan la misma clave.
const SUFFIXES = new Set(['inc', 'llc', 'ltd', 'corp', 'co', 'company', 'corporation', 'gmbh', 'sa']);

export function companyKey(name: string): string {
  const words = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 1 && (SUFFIXES.has(words[words.length - 1]) || words[words.length - 1] === 'the')) words.pop();
  if (words[0] === 'the' && words.length > 1) words.shift();
  return words.join('');
}

/** Nombres de empresa ya usados que se parecen a lo que la persona escribe. */
export function similarCompanies(input: string, known: { company: string; companyKey: string }[]): string[] {
  const key = companyKey(input);
  if (key.length < 2) return [];
  const seen = new Map<string, string>();
  for (const k of known) {
    if (seen.has(k.companyKey)) continue;
    if (k.companyKey.startsWith(key) || (key.length >= 3 && k.companyKey.includes(key)) || key.startsWith(k.companyKey)) {
      seen.set(k.companyKey, k.company);
    }
  }
  return [...seen.values()].slice(0, 5);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}
