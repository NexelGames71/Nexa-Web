const STORAGE_KEY = "nexa-pinned-chats";

export function getPinnedChatIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function setPinnedChatIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isChatPinned(id: string) {
  return getPinnedChatIds().includes(id);
}

export function togglePinnedChat(id: string) {
  const current = getPinnedChatIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  setPinnedChatIds(next);
  return next.includes(id);
}

export function sortWithPinnedFirst<T extends { id: string }>(items: T[]) {
  const pinned = new Set(getPinnedChatIds());
  return [...items].sort((a, b) => {
    const aPinned = pinned.has(a.id) ? 1 : 0;
    const bPinned = pinned.has(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });
}
