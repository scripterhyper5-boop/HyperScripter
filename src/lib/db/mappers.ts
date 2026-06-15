import "server-only";

import type { ScriptHistoryItem } from "@/lib/auth/script-history";
import type { User } from "@/lib/auth/types";
import type { GeneratorOutput } from "@/lib/generator";
import { normalizeScriptOutput } from "@/lib/generator";
import type { DbBlogPost, DbLegalPage, DbScript, DbUser } from "@/lib/supabase/types";

export interface ScriptContentPayload {
  input?: {
    topic?: string;
    niche?: string;
    videoType?: string;
    tone?: string;
    hookStyle?: string;
    audience?: string;
    videoLength?: string;
    keywords?: string;
    callToAction?: string;
  };
  output?: GeneratorOutput;
}

export function dbUserToAppUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    plan: row.plan,
    createdAt: row.created_at,
  };
}

export function appUserToDbUser(user: User, passwordHash?: string | null): DbUser {
  return {
    id: user.id,
    email: user.email.toLowerCase(),
    full_name: user.name,
    role: user.role ?? "user",
    plan: user.plan,
    avatar_url: user.avatarUrl ?? null,
    password_hash: passwordHash ?? null,
    created_at: user.createdAt,
  };
}

export function dbScriptToHistoryItem(row: DbScript): ScriptHistoryItem {
  const payload = (row.content ?? {}) as ScriptContentPayload;
  const input = payload.input ?? {};
  const output = normalizeScriptOutput(
    payload.output ?? {
      hook: "",
      intro: "",
      mainScript: "",
      script: "",
      fullScript: "",
      cta: "",
      caption: "",
      hashtags: [],
    }
  );

  return {
    id: row.id,
    topic: row.title,
    niche: row.niche ?? input.niche,
    videoType: row.video_type ?? input.videoType,
    tone: row.tone ?? input.tone ?? "casual",
    hookStyle: row.hook_style ?? input.hookStyle,
    audience: input.audience ?? "",
    videoLength: input.videoLength ?? "30s",
    keywords: input.keywords,
    callToAction: input.callToAction,
    output,
    createdAt: row.created_at,
  };
}

export function historyItemToDbScript(
  userId: string,
  item: Omit<ScriptHistoryItem, "id" | "createdAt"> & { id?: string }
) {
  return {
    id: item.id,
    user_id: userId,
    title: item.topic,
    niche: item.niche ?? null,
    video_type: item.videoType ?? null,
    tone: item.tone ?? null,
    hook_style: item.hookStyle ?? null,
    content: {
      input: {
        topic: item.topic,
        niche: item.niche,
        videoType: item.videoType,
        tone: item.tone,
        hookStyle: item.hookStyle,
        audience: item.audience,
        videoLength: item.videoLength,
        keywords: item.keywords,
        callToAction: item.callToAction,
      },
      output: item.output,
    },
  };
}

export function dbBlogPostToPublic(row: DbBlogPost) {
  const wordCount = row.content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.excerpt ?? "",
    publishedAt: row.updated_at.slice(0, 10),
    readingTime: `${readingMinutes} min read`,
    category: "Insights",
    author: "HyperScripter Team",
    content: row.content,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function dbLegalPageToApp(row: DbLegalPage) {
  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    content: row.content,
    status: row.status,
    updatedAt: row.updated_at.slice(0, 10),
  };
}
