const OFFLINE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">` +
      `<rect width="320" height="200" fill="#ffedd5"/>` +
      `<text x="160" y="95" text-anchor="middle" font-size="44">🍽️</text>` +
      `<text x="160" y="132" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#9a3412">Imagen guardada sin conexión</text>` +
      `</svg>`
  );

export function applyOfflineImageFallback(event: Event): void {
  const img = event.target as HTMLImageElement | null;
  if (!img || img.dataset['fallbackApplied'] === 'true') {
    return;
  }
  img.dataset['fallbackApplied'] = 'true';
  img.src = OFFLINE_SVG;
}
