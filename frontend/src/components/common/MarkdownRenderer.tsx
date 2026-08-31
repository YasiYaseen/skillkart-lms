import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/20/solid';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by code blocks first
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`markdown-body space-y-4 text-gray-800 dark:text-gray-200 leading-relaxed text-sm md:text-base ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              language={block.language || 'text'}
              code={block.content}
            />
          );
        }

        if (block.type === 'h1') {
          return (
            <h1 key={idx} className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white pt-3 pb-1.5 border-b border-gray-200 dark:border-gray-700/80">
              {renderInlineMarkdown(block.content)}
            </h1>
          );
        }

        if (block.type === 'h2') {
          return (
            <h2 key={idx} className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white pt-2.5 pb-1">
              {renderInlineMarkdown(block.content)}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="text-base md:text-lg font-bold text-gray-900 dark:text-white pt-1">
              {renderInlineMarkdown(block.content)}
            </h3>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1.5 my-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-xl italic text-gray-700 dark:text-gray-300">
              {renderInlineMarkdown(block.content)}
            </blockquote>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-sm md:text-base">
                  <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={idx} className="space-y-1.5 my-2 pl-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-sm md:text-base">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono text-xs mt-1 shrink-0">
                    {itemIdx + 1}.
                  </span>
                  <span>{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap leading-relaxed">
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
};

interface Block {
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'code' | 'blockquote' | 'list' | 'ordered-list';
  content: string;
  language?: string;
  items: string[];
}

function parseMarkdownBlocks(rawText: string): Block[] {
  const lines = rawText.split('\n');
  const blocks: Block[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];
  let currentList: string[] = [];
  let listType: 'list' | 'ordered-list' | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join('\n').trim();
      if (text) {
        blocks.push({ type: 'paragraph', content: text, items: [] });
      }
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      blocks.push({ type: listType, content: '', items: [...currentList] });
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code fences
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        blocks.push({
          type: 'code',
          content: codeBuffer.join('\n'),
          language: codeLanguage,
          items: [],
        });
        codeBuffer = [];
        codeLanguage = '';
        inCodeBlock = false;
      } else {
        // Open code block
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim().toLowerCase();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h1', content: line.slice(2).trim(), items: [] });
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', content: line.slice(3).trim(), items: [] });
      continue;
    }
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', content: line.slice(4).trim(), items: [] });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'blockquote', content: line.slice(2).trim(), items: [] });
      continue;
    }

    // Bullet lists (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listType !== 'list') {
        flushList();
        listType = 'list';
      }
      currentList.push(bulletMatch[1]);
      continue;
    }

    // Numbered lists (1. 2.)
    const numberMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      flushParagraph();
      if (listType !== 'ordered-list') {
        flushList();
        listType = 'ordered-list';
      }
      currentList.push(numberMatch[1]);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      flushList();
      flushParagraph();
      continue;
    }

    // Regular text line
    flushList();
    paragraphBuffer.push(line);
  }

  flushList();
  flushParagraph();

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      type: 'code',
      content: codeBuffer.join('\n'),
      language: codeLanguage,
      items: [],
    });
  }

  return blocks;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Replace inline bold, italics, inline code, and links
  const parts: React.ReactNode[] = [];
  // Tokenize regex for inline elements
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-gray-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs border border-gray-200 dark:border-gray-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkTextMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkTextMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkTextMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5"
          >
            {linkTextMatch[1]} ↗
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-950 text-gray-100 border border-gray-800 shadow-md my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800 text-xs text-gray-400">
        <span className="font-mono uppercase font-semibold text-[11px] text-gray-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-[11px] font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed selection:bg-indigo-700 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}
