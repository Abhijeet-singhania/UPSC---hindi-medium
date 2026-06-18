import React from 'react';

/** Split inline **bold**, *italic*, and [n] citation markers. */
function renderInline(text, onCitationClick) {
  if (!text) return null;

  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\])/g;
  let last = 0;
  let match;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) });
    } else if (token.startsWith('*')) {
      parts.push({ type: 'italic', value: token.slice(1, -1) });
    } else if (token.startsWith('[')) {
      const n = parseInt(token.slice(1, -1), 10);
      parts.push({ type: 'cite', value: n });
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }

  if (parts.length === 0) return text;

  return parts.map((p, i) => {
    if (p.type === 'bold') {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {p.value}
        </strong>
      );
    }
    if (p.type === 'italic') {
      return <em key={i} className="italic text-text-secondary">{p.value}</em>;
    }
    if (p.type === 'cite') {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCitationClick?.(p.value)}
          className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 text-[10px] font-bold text-primary bg-primary/15 border border-primary/25 rounded-md align-super cursor-pointer hover:bg-primary/25 transition"
          title={`Source ${p.value}`}
        >
          {p.value}
        </button>
      );
    }
    return <span key={i}>{p.value}</span>;
  });
}

function flushList(blocks, list, listType) {
  if (list?.length) {
    blocks.push({ type: listType, items: [...list] });
  }
  return { list: null, listType: null };
}

/** Parse Gemini-style markdown into render blocks. */
export function parseAiBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let list = null;
  let listType = null;

  const endList = () => {
    if (list?.length) {
      blocks.push({ type: listType, items: [...list] });
      list = null;
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      endList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      endList();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        endList();
        list = [];
        listType = 'ul';
      }
      list.push(trimmed.replace(/^[-*•]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') {
        endList();
        list = [];
        listType = 'ol';
      }
      list.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      endList();
      blocks.push({ type: 'hr' });
      continue;
    }

    endList();
    blocks.push({ type: 'p', text: trimmed });
  }

  endList();
  return blocks;
}

export function AiMessageContent({ text, onCitationClick }) {
  const blocks = parseAiBlocks(text || '');
  if (blocks.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          if (block.level <= 2) {
            return (
              <h3
                key={i}
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  marginTop: i > 0 ? '10px' : 0,
                }}
              >
                {renderInline(block.text, onCitationClick)}
              </h3>
            );
          }
          return (
            <h4
              key={i}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: i > 0 ? '6px' : 0,
              }}
            >
              {renderInline(block.text, onCitationClick)}
            </h4>
          );
        }

        if (block.type === 'p') {
          return (
            <p
              key={i}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {renderInline(block.text, onCitationClick)}
            </p>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={i} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      marginTop: '9px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#C4902A',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '15px',
                      lineHeight: 1.75,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {renderInline(item, onCitationClick)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={i} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      background: 'rgba(196,144,42,0.1)',
                      border: '1px solid rgba(196,144,42,0.15)',
                      color: '#C4902A',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {j + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '15px',
                      lineHeight: 1.75,
                      color: 'var(--text-secondary)',
                      flex: 1,
                    }}
                  >
                    {renderInline(item, onCitationClick)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'hr') {
          return (
            <hr
              key={i}
              style={{
                border: 'none',
                height: '1px',
                background: 'var(--border-default)',
                margin: '6px 0',
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
