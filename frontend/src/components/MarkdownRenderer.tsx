"use client";

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let isOrderedList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const listKey = `list-${elements.length}`;
      if (isOrderedList) {
        elements.push(
          <ol key={listKey} className="list-decimal pl-6 mb-3 space-y-1 text-sm text-slate-700">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={listKey} className="list-disc pl-6 mb-3 space-y-1 text-sm text-slate-700">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const parseInline = (text: string): React.ReactNode[] => {
    let parts: { type: 'text' | 'bold' | 'italic' | 'code' | 'link'; text: string; href?: string }[] = [{ type: 'text', text }];

    // Parse Bold: **text**
    parts = parts.flatMap(part => {
      if (part.type !== 'text') return [part];
      const subParts = part.text.split(/(\*\*.*?\*\*)/g);
      return subParts.map(p => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return { type: 'bold', text: p.slice(2, -2) };
        }
        return { type: 'text', text: p };
      });
    });

    // Parse Italic: *text*
    parts = parts.flatMap(part => {
      if (part.type !== 'text') return [part];
      const subParts = part.text.split(/(\*.*?\*)/g);
      return subParts.map(p => {
        if (p.startsWith('*') && p.endsWith('*')) {
          return { type: 'italic', text: p.slice(1, -1) };
        }
        return { type: 'text', text: p };
      });
    });

    // Parse Inline Code: `code`
    parts = parts.flatMap(part => {
      if (part.type !== 'text') return [part];
      const subParts = part.text.split(/(`.*?`)/g);
      return subParts.map(p => {
        if (p.startsWith('`') && p.endsWith('`')) {
          return { type: 'code', text: p.slice(1, -1) };
        }
        return { type: 'text', text: p };
      });
    });

    // Parse Links: [label](url)
    parts = parts.flatMap(part => {
      if (part.type !== 'text') return [part];
      const subParts = part.text.split(/(\[.*?\]\(.*?\))/g);
      return subParts.map(p => {
        const linkMatch = p.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return { type: 'link', text: linkMatch[1], href: linkMatch[2] };
        }
        return { type: 'text', text: p };
      });
    });

    return parts.map((part, idx) => {
      const key = `inline-${idx}`;
      switch (part.type) {
        case 'bold':
          return <strong key={key} className="font-bold text-slate-800">{part.text}</strong>;
        case 'italic':
          return <em key={key} className="italic text-slate-700">{part.text}</em>;
        case 'code':
          return <code key={key} className="bg-slate-100 text-manipal-orange px-1.5 py-0.5 rounded text-xs font-mono font-medium">{part.text}</code>;
        case 'link':
          return <a key={key} href={part.href} target="_blank" rel="noopener noreferrer" className="text-manipal-orange hover:underline font-medium">{part.text}</a>;
        default:
          return <span key={key}>{part.text}</span>;
      }
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="bg-slate-900 rounded-xl p-4 my-3 overflow-x-auto text-xs font-mono text-slate-100 shadow-inner leading-relaxed">
            {codeBlockLang && <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2 select-none">{codeBlockLang}</div>}
            <pre><code>{codeBlockLines.join('\n')}</code></pre>
          </div>
        );
        codeBlockLines = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Handle Lists
    const isUli = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const oliMatch = line.trim().match(/^(\d+)\.\s(.*)/);

    if (isUli || oliMatch) {
      const listType = isUli ? false : true;
      if (!inList || isOrderedList !== listType) {
        flushList();
        inList = true;
        isOrderedList = listType;
      }

      const itemContent = isUli ? line.trim().slice(2) : (oliMatch ? oliMatch[2] : '');
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(itemContent)}
        </li>
      );
      continue;
    } else {
      if (inList) {
        flushList();
      }
    }

    // Handle Headings
    if (line.trim().startsWith('#')) {
      const headingMatch = line.trim().match(/^(#{1,6})\s(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const headingKey = `h-${i}`;
        const inlineContent = parseInline(text);

        if (level === 1) elements.push(<h1 key={headingKey} className="text-xl font-bold text-slate-800 mt-4 mb-2">{inlineContent}</h1>);
        else if (level === 2) elements.push(<h2 key={headingKey} className="text-lg font-bold text-slate-800 mt-3 mb-1.5">{inlineContent}</h2>);
        else if (level === 3) elements.push(<h3 key={headingKey} className="text-base font-bold text-slate-800 mt-2.5 mb-1">{inlineContent}</h3>);
        else elements.push(<h4 key={headingKey} className="text-sm font-bold text-slate-800 mt-2 mb-1">{inlineContent}</h4>);
        continue;
      }
    }

    // Handle Empty Lines
    if (line.trim() === '') {
      continue;
    }

    // Default Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-slate-700 mb-2">
        {parseInline(line)}
      </p>
    );
  }

  if (inList) {
    flushList();
  }

  return <div className="space-y-1">{elements}</div>;
}
