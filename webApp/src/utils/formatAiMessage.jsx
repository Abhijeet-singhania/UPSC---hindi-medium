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
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const Tag = block.level <= 2 ? 'h3' : 'h4';
          const cls =
            block.level <= 2
              ? 'font-serif text-[17px] md:text-[18px] font-semibold text-text-primary tracking-tight'
              : 'text-[14px] font-semibold text-text-primary mt-1';
          return (
            <Tag key={i} className={cls}>
              {renderInline(block.text, onCitationClick)}
            </Tag>
          );
        }

        if (block.type === 'p') {
          return (
            <p key={i} className="text-[14px] md:text-[15px] leading-[1.75] text-text-secondary">
              {renderInline(block.text, onCitationClick)}
            </p>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={i} className="space-y-2.5 pl-0 list-none m-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-[1.7] text-text-secondary">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>{renderInline(item, onCitationClick)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={i} className="space-y-2.5 pl-0 list-none m-0 counter-reset-none">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-[1.7] text-text-secondary">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{renderInline(item, onCitationClick)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'hr') {
          return <hr key={i} className="border-0 h-px bg-border-default my-2" />;
        }

        return null;
      })}
    </div>
  );
}
