import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import { UserHoverCard } from './UserHoverCard';

interface MentionTextProps {
  content: string;
  className?: string;
}

// Regex patterns
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_\u0600-\u06FF]+)/g;

// Combined pattern to match both mentions and hashtags
const COMBINED_REGEX = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_\u0600-\u06FF]+)/g;

export function MentionText({ content, className }: MentionTextProps) {
  // Split content by mentions and hashtags
  const parts = content.split(COMBINED_REGEX);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;
        
        // Check if it's a mention
        if (part.startsWith('@')) {
          const username = part.slice(1);
          return (
            <UserHoverCard key={index} username={username}>
              <Link
                to={`/profile/${username}`}
                className="text-primary font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </Link>
            </UserHoverCard>
          );
        }
        
        // Check if it's a hashtag
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              to={`/hashtag/${encodeURIComponent(tag)}`}
              className="text-primary font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        
        // Regular text
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </span>
  );
}
