const STORAGE_KEY = 'antriin-active-queues';

interface ActiveQueue {
  queueId: string;
  number: string;
  status: string;
}

function read(): Record<string, ActiveQueue> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function write(data: Record<string, ActiveQueue>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveActiveQueue(slug: string, info: ActiveQueue) {
  const all = read();
  all[slug] = info;
  write(all);
}

export function getActiveQueue(slug: string): ActiveQueue | null {
  return read()[slug] || null;
}

export function clearActiveQueue(slug: string) {
  const all = read();
  delete all[slug];
  write(all);
}

export function getAllActiveQueues(): Record<string, ActiveQueue> {
  return read();
}
