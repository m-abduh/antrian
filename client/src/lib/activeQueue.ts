const STORAGE_KEY = 'tunggu-active-queues';

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

export function updateActiveQueueStatus(slug: string, status: string) {
  const all = read();
  if (all[slug]) {
    all[slug].status = status;
    write(all);
  }
}

export function clearActiveQueue(slug: string) {
  const all = read();
  delete all[slug];
  write(all);
}

export function getAllActiveQueues(): Record<string, ActiveQueue> {
  return read();
}
