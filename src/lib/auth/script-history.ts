import { normalizeScriptOutput, type GeneratorOutput } from "@/lib/generator";

export interface ScriptHistoryItem {
  id: string;
  topic: string;
  niche?: string;
  videoType?: string;
  tone: string;
  hookStyle?: string;
  audience: string;
  videoLength: string;
  keywords?: string;
  callToAction?: string;
  output: GeneratorOutput;
  createdAt: string;
}

const STORAGE_KEY = "hs_script_history";

function normalizeItem(item: ScriptHistoryItem): ScriptHistoryItem {
  return {
    ...item,
    output: normalizeScriptOutput(item.output),
  };
}

export function getScriptHistory(userId: string): ScriptHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    const items = raw ? (JSON.parse(raw) as ScriptHistoryItem[]) : [];
    return items.map(normalizeItem);
  } catch {
    return [];
  }
}

export function getScriptById(
  userId: string,
  id: string
): ScriptHistoryItem | null {
  return getScriptHistory(userId).find((item) => item.id === id) ?? null;
}

export function saveScriptToHistory(
  userId: string,
  item: Omit<ScriptHistoryItem, "id" | "createdAt">
): ScriptHistoryItem {
  const entry: ScriptHistoryItem = normalizeItem({
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  const history = [entry, ...getScriptHistory(userId)].slice(0, 50);
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(history));
  return entry;
}

export function updateScriptInHistory(
  userId: string,
  id: string,
  updates: {
    topic?: string;
    output?: Partial<GeneratorOutput>;
  }
): ScriptHistoryItem | null {
  const history = getScriptHistory(userId);
  const index = history.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = history[index];
  const nextOutput = updates.output
    ? normalizeScriptOutput({ ...current.output, ...updates.output })
    : current.output;

  const updated: ScriptHistoryItem = normalizeItem({
    ...current,
    ...updates,
    output: nextOutput,
  });

  history[index] = updated;
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(history));
  return updated;
}

export function deleteScriptFromHistory(userId: string, id: string) {
  const history = getScriptHistory(userId).filter((item) => item.id !== id);
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(history));
}
