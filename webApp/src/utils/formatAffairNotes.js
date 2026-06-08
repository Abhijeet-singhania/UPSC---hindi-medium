/**
 * Parse detailed_notes from API — handles Gemini JSON arrays and legacy raw blobs.
 * Returns { bullets: string[] } or { paragraphs: string[] } for rendering.
 */
export function parseAffairNotes(raw) {
  if (!raw?.trim()) return { bullets: [], paragraphs: [] };

  const text = raw.trim();

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return { bullets: parsed.map(String).map(cleanPoint).filter(Boolean), paragraphs: [] };
      }
    } catch {
      /* fall through */
    }
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    const quoted = [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    if (quoted.length >= 2) {
      return { bullets: quoted.map(cleanPoint).filter(Boolean), paragraphs: [] };
    }
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^[•\-*]|\d+[.)]\s/.test(l));

  if (bulletLines.length >= 2 || (bulletLines.length === 1 && lines.length === 1)) {
    return {
      bullets: bulletLines.map((l) => cleanPoint(l.replace(/^[•\-*]\s*|\d+[.)]\s*/, ''))),
      paragraphs: [],
    };
  }

  if (lines.length > 1) {
    return { bullets: lines.map(cleanPoint).filter(Boolean), paragraphs: [] };
  }

  return { bullets: [], paragraphs: [text] };
}

function cleanPoint(s) {
  return s.trim().replace(/\s+/g, ' ');
}
