import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { countdown } from '@/lib/eventUtils';

export default function Countdown({ target, label = 'Register' }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const c = countdown(target);
  if (!c) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        c.over
          ? 'bg-muted text-muted-foreground'
          : c.urgent
          ? 'bg-orange-500 text-white'
          : 'bg-accent text-accent-foreground'
      }`}
    >
      <Clock className="h-3 w-3" />
      {c.over ? `${label} closed` : `${label}: ${c.text}`}
    </span>
  );
}
