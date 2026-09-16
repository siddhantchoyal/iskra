import React from 'react';
import { ExternalLink } from 'lucide-react';

export function renderWithClickableLinks(text: string): React.ReactNode {
  if (!text) return null;

  // Regex to match URLs starting with http://, https://, or www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 underline font-medium break-all"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
