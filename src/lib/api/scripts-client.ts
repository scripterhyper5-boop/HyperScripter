import type { ScriptHistoryItem } from "@/lib/auth/script-history";
import type { GeneratorOutput } from "@/lib/generator";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export async function fetchScripts(): Promise<ScriptHistoryItem[]> {
  const res = await fetch("/api/scripts", { credentials: "include" });
  const data = await parseJson<{ scripts: ScriptHistoryItem[] }>(res);
  return data.scripts;
}

export async function fetchScriptById(id: string): Promise<ScriptHistoryItem | null> {
  const res = await fetch(`/api/scripts/${id}`, { credentials: "include" });
  if (res.status === 404) return null;
  const data = await parseJson<{ script: ScriptHistoryItem }>(res);
  return data.script;
}

export async function updateScriptApi(
  id: string,
  updates: { topic?: string; output?: Partial<GeneratorOutput> }
): Promise<ScriptHistoryItem> {
  const res = await fetch(`/api/scripts/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await parseJson<{ script: ScriptHistoryItem }>(res);
  return data.script;
}

export async function deleteScriptApi(id: string): Promise<void> {
  const res = await fetch(`/api/scripts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to delete script");
  }
}
