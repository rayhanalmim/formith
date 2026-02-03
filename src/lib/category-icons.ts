// Category icon mapping - maps category slugs to emojis
export const categoryIcons: Record<string, string> = {
  'announcements': '📢',
  'news': '📰',
  'money-transfer': '💸',
  'esim-topup': '📱',
  'flight-tickets': '✈️',
  'services': '🛠️',
  'agents': '🤝',
  'technical-support': '🔧',
  'general': '💬',
  'technology': '💻',
  'finance': '💰',
  'gaming': '🎮',
  'lifestyle': '🌟',
};

export function getCategoryIcon(slug: string): string {
  return categoryIcons[slug] || '📁';
}
