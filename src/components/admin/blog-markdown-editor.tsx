"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import rehypePrism from "rehype-prism-plus";
import {
  Bold,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table,
  Link,
  ImagePlus,
  Copy,
  Maximize2,
  Minimize2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownPreview } from "@/components/admin/markdown-preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getMarkdownStats,
  insertAtSelection,
  wrapLines,
} from "@/lib/markdown/utils";

import "highlight.js/styles/github-dark.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] animate-pulse items-center justify-center rounded-xl bg-white text-sm text-muted-foreground">
      Loading editor…
    </div>
  );
}

type ToolbarAction =
  | { type: "wrap"; before: string; after?: string; placeholder?: string }
  | { type: "lines"; prefix: string }
  | { type: "insert"; text: string }
  | { type: "link" }
  | { type: "image" }
  | { type: "table" };

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  draftKey?: string;
  enableDraftRestore?: boolean;
  className?: string;
}

interface ToolbarButton {
  label: string;
  icon: ReactNode;
  action: ToolbarAction;
  shortcut?: string;
}

const toolbarButtons: ToolbarButton[] = [
  { label: "Heading 1", icon: <Heading1 className="h-4 w-4" />, action: { type: "lines", prefix: "# " } },
  { label: "Heading 2", icon: <Heading2 className="h-4 w-4" />, action: { type: "lines", prefix: "## " } },
  { label: "Heading 3", icon: <Heading3 className="h-4 w-4" />, action: { type: "lines", prefix: "### " } },
  { label: "Heading 4", icon: <Heading4 className="h-4 w-4" />, action: { type: "lines", prefix: "#### " } },
  { label: "Bold", icon: <Bold className="h-4 w-4" />, action: { type: "wrap", before: "**", after: "**", placeholder: "bold" }, shortcut: "Ctrl+B" },
  { label: "Italic", icon: <Italic className="h-4 w-4" />, action: { type: "wrap", before: "*", after: "*", placeholder: "italic" }, shortcut: "Ctrl+I" },
  { label: "Underline", icon: <Underline className="h-4 w-4" />, action: { type: "wrap", before: "<u>", after: "</u>", placeholder: "underline" } },
  { label: "Inline code", icon: <Code className="h-4 w-4" />, action: { type: "wrap", before: "`", after: "`", placeholder: "code" } },
  { label: "Bullet list", icon: <List className="h-4 w-4" />, action: { type: "lines", prefix: "- " } },
  { label: "Numbered list", icon: <ListOrdered className="h-4 w-4" />, action: { type: "lines", prefix: "1. " } },
  { label: "Blockquote", icon: <Quote className="h-4 w-4" />, action: { type: "lines", prefix: "> " } },
  { label: "Code block", icon: <Code className="h-4 w-4" />, action: { type: "insert", text: "\n```javascript\n// code\n```\n" } },
  { label: "Divider", icon: <Minus className="h-4 w-4" />, action: { type: "insert", text: "\n---\n" } },
  { label: "Table", icon: <Table className="h-4 w-4" />, action: { type: "table" } },
  { label: "Link", icon: <Link className="h-4 w-4" />, action: { type: "link" }, shortcut: "Ctrl+K" },
  { label: "Image", icon: <ImagePlus className="h-4 w-4" />, action: { type: "image" } },
];

export function BlogMarkdownEditor({
  value,
  onChange,
  draftKey = "hs-blog-draft-default",
  enableDraftRestore = true,
  className,
}: BlogMarkdownEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const restoredDraftKeyRef = useRef<string | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const stats = getMarkdownStats(value);

  const rehypePlugins = useMemo(
    () => [[rehypePrism, { ignoreMissing: true, showLineNumbers: true }]],
    []
  );

  onChangeRef.current = onChange;

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const applyEdit = useCallback(
    (nextValue: string, start: number, end: number) => {
      onChange(nextValue);
      setSelection({ start, end });
      requestAnimationFrame(() => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(start, end);
      });
    },
    [onChange]
  );

  const runAction = useCallback(
    (action: ToolbarAction) => {
      const start = editorRef.current?.selectionStart ?? selection.start;
      const end = editorRef.current?.selectionEnd ?? selection.end;

      if (action.type === "wrap") {
        const result = insertAtSelection(
          value,
          start,
          end,
          action.before,
          action.after,
          action.placeholder
        );
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        return;
      }

      if (action.type === "lines") {
        const result = wrapLines(value, start, end, action.prefix);
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        return;
      }

      if (action.type === "insert") {
        const result = insertAtSelection(value, start, end, action.text, "", "");
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        return;
      }

      if (action.type === "link") {
        const url = window.prompt("Link URL", "https://");
        if (!url) return;
        const result = insertAtSelection(value, start, end, "[", `](${url})`, "link text");
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        return;
      }

      if (action.type === "table") {
        const table =
          "\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n";
        const result = insertAtSelection(value, start, end, table, "", "");
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        return;
      }

      if (action.type === "image") {
        fileInputRef.current?.click();
      }
    },
    [applyEdit, selection.end, selection.start, value]
  );

  const handleImageUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        const start = editorRef.current?.selectionStart ?? selection.start;
        const end = editorRef.current?.selectionEnd ?? selection.end;
        const result = insertAtSelection(value, start, end, `![${alt}](`, `${src})`, alt);
        applyEdit(result.value, result.selectionStart, result.selectionEnd);
        toast.success("Image inserted into markdown");
      };
      reader.onerror = () => toast.error("Failed to read image file");
      reader.readAsDataURL(file);
    },
    [applyEdit, selection.end, selection.start, value]
  );

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Markdown copied to clipboard");
    } catch {
      toast.error("Failed to copy markdown");
    }
  }, [value]);

  useEffect(() => {
    if (!draftKey) return;
    const timer = window.setTimeout(() => {
      if (localStorage.getItem(draftKey) === value) return;
      localStorage.setItem(draftKey, value);
      setDraftSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftKey, value]);

  useEffect(() => {
    if (!draftKey || !enableDraftRestore) return;
    if (restoredDraftKeyRef.current === draftKey) return;

    restoredDraftKeyRef.current = draftKey;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      onChangeRef.current(saved);
      setDraftSavedAt("restored");
    }
  }, [draftKey, enableDraftRestore]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!editorRef.current || document.activeElement !== editorRef.current) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        runAction({ type: "wrap", before: "**", after: "**", placeholder: "bold" });
      }
      if (event.key.toLowerCase() === "i") {
        event.preventDefault();
        runAction({ type: "wrap", before: "*", after: "*", placeholder: "italic" });
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        runAction({ type: "link" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runAction]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const editorPanel = (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-gray-50">
      <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Editor
      </div>
      <div className="relative flex-1 overflow-auto">
        <CodeEditor
          value={value}
          language="markdown"
          placeholder="# Write your post in Markdown…"
          onChange={(e) => onChange(e.target.value)}
          onSelect={(e) =>
            setSelection({
              start: e.currentTarget.selectionStart,
              end: e.currentTarget.selectionEnd,
            })
          }
          onClick={(e) =>
            setSelection({
              start: e.currentTarget.selectionStart,
              end: e.currentTarget.selectionEnd,
            })
          }
          onKeyUp={(e) =>
            setSelection({
              start: e.currentTarget.selectionStart,
              end: e.currentTarget.selectionEnd,
            })
          }
          padding={16}
          data-color-mode="dark"
          ref={editorRef}
          rehypePlugins={rehypePlugins as never}
          style={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            backgroundColor: "transparent",
            minHeight: "380px",
          }}
          className="blog-md-editor !min-h-[380px] w-full !bg-transparent"
        />
      </div>
    </div>
  );

  const previewPanel = (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Live preview
      </div>
      <div className="flex-1 overflow-auto p-5">
        <MarkdownPreview content={value} />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-white/[0.02] shadow-2xl shadow-black/20",
        fullscreen && "fixed inset-0 z-50 m-0 flex flex-col rounded-none border-border bg-white/95 p-4 sm:p-6",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-white p-2 sm:p-3">
        {toolbarButtons.map((button) => (
          <Button
            key={button.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            title={button.shortcut ? `${button.label} (${button.shortcut})` : button.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              focusEditor();
              runAction(button.action);
            }}
          >
            {button.icon}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={copyMarkdown}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setFullscreen((prev) => !prev)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>{stats.words} words</span>
        <span>{stats.characters} characters</span>
        <span>{stats.readingTimeMinutes} min read</span>
        {draftSavedAt && (
          <span className="ml-auto inline-flex items-center gap-1 text-emerald-400/80">
            <Save className="h-3 w-3" />
            Draft saved {draftSavedAt === "restored" ? "(restored)" : `at ${draftSavedAt}`}
          </span>
        )}
      </div>

      {/* Desktop split view */}
      <div className={cn("hidden gap-4 p-4 lg:grid lg:grid-cols-2", fullscreen && "flex-1 lg:min-h-0")}>
        {editorPanel}
        {previewPanel}
      </div>

      {/* Mobile tabs */}
      <div className="p-4 lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "editor" | "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-4">
            {editorPanel}
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            {previewPanel}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
