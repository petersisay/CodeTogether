import React from 'react';

// Lightweight regex-based JSX/JS syntax highlighter matching the reference image screenshot
export default function highlightCode(code) {
  if (!code) return [];

  const lines = code.split('\n');

  return lines.map((line, lineIdx) => {
    // Tokenize line
    const tokens = [];
    let remaining = line;

    // Pattern for keywords, strings, tags, comments, punctuation
    const regex = /(\/\/[^\n]*)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*")|(\b(?:import|from|function|const|let|var|return|export|default|if|else)\b)|(<\/?(?:div|h1|p|span|button|App)[^>]*>)|(\b(?:useState|useEffect|useSocket|setMessages)\b)|([{}()[\];,.:])/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'plain',
          text: line.substring(lastIndex, match.index),
        });
      }

      if (match[1]) {
        tokens.push({ type: 'comment', text: match[1] });
      } else if (match[2]) {
        tokens.push({ type: 'string', text: match[2] });
      } else if (match[3]) {
        tokens.push({ type: 'keyword', text: match[3] });
      } else if (match[4]) {
        tokens.push({ type: 'tag', text: match[4] });
      } else if (match[5]) {
        tokens.push({ type: 'function', text: match[5] });
      } else if (match[6]) {
        tokens.push({ type: 'punct', text: match[6] });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push({
        type: 'plain',
        text: line.substring(lastIndex),
      });
    }

    return (
      <div key={lineIdx} className="h-5 leading-5 whitespace-pre">
        {tokens.length === 0 ? (
          <span>&nbsp;</span>
        ) : (
          tokens.map((tok, tokIdx) => {
            let color = 'text-slate-200';
            if (tok.type === 'keyword') color = 'text-purple-400 font-medium';
            else if (tok.type === 'string') color = 'text-emerald-400';
            else if (tok.type === 'comment') color = 'text-slate-500 italic';
            else if (tok.type === 'tag') color = 'text-sky-400';
            else if (tok.type === 'function') color = 'text-cyan-300';
            else if (tok.type === 'punct') color = 'text-slate-400';

            return (
              <span key={tokIdx} className={color}>
                {tok.text}
              </span>
            );
          })
        )}
      </div>
    );
  });
}
