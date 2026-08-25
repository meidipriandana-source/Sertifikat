import React, { useMemo } from 'react';

interface HighlightedTextProps {
  text?: string | null;
  query?: string | null;
  className?: string;
  highlightClassName?: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * HighlightedText component highlights matching substrings within `text`
 * based on `query` keywords (case-insensitive, handles multiple tokens).
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-200/90 dark:bg-amber-400/35 text-amber-950 dark:text-amber-100 font-semibold px-0.5 rounded-xs'
}) => {
  const content = text ?? '';

  const parsed = useMemo(() => {
    if (!content) return { isHighlighted: false, parts: [] };
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return { isHighlighted: false, parts: [] };

    // Split words in search query to support multi-term highlighting
    const tokens = trimmedQuery
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (tokens.length === 0) return { isHighlighted: false, parts: [] };

    // Sort tokens by length descending so longer phrases match first
    const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${sortedTokens.map(escapeRegExp).join('|')})`, 'gi');
    const splitParts = content.split(regex);

    return {
      isHighlighted: true,
      parts: splitParts,
      tokenSet: new Set(tokens.map(t => t.toLowerCase()))
    };
  }, [content, query]);

  if (!content) return null;

  if (!parsed.isHighlighted || !parsed.parts.length) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parsed.parts.map((part, idx) => {
        const isMatch = parsed.tokenSet?.has(part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={idx}
              className={highlightClassName}
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};
