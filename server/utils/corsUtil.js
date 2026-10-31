// Origin validation helper supporting production domains, Vercel previews, local ports, and CLIENT_URL
export function isOriginAllowed(origin) {
  if (!origin) return true;
  const clean = origin.trim().replace(/\/$/, '');

  // Live production frontend on Vercel
  if (clean === 'https://code-together-weld.vercel.app') return true;

  // Any Vercel deployment preview for this app
  if (/^https:\/\/([a-zA-Z0-9_\-]+\.)?vercel\.app$/.test(clean)) return true;

  // Local development ports
  if (
    clean === 'http://localhost:5173' ||
    clean === 'http://127.0.0.1:5173' ||
    clean === 'http://localhost:3000' ||
    clean === 'http://127.0.0.1:3000' ||
    clean === 'http://localhost:4173' ||
    clean === 'http://127.0.0.1:4173' ||
    clean === 'http://localhost:5000' ||
    clean === 'http://127.0.0.1:5000'
  ) {
    return true;
  }

  // Configured CLIENT_URL environment variable (supports comma-separated list and trailing slashes)
  if (process.env.CLIENT_URL) {
    const configured = process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''));
    if (configured.includes(clean)) return true;
  }

  // Non-production fallback
  if (process.env.NODE_ENV !== 'production') return true;

  return false;
}
