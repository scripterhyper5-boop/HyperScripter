"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Save,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getHtmlStats } from "@/lib/legal/html-stats";
import { cn } from "@/lib/utils";

interface LegalTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  draftKey?: string;
  enableDraftRestore?: boolean;
  className?: string;
}

function ToolbarBtn({
  active,
  title,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={cn(
        "h-8 w-8 shrink-0 text-muted-foreground hover:bg-white/10 hover:text-foreground",
        active && "bg-white/10 text-foreground"
      )}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function LegalTiptapEditor({
  value,
  onChange,
  draftKey = "hs-legal-draft-default",
  enableDraftRestore = true,
  className,
}: LegalTiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const restoredDraftKeyRef = useRef<string | null>(null);
  const isInternalUpdateRef = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [content, setContent] = useState(value);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setContent(value);
    }
    isInternalUpdateRef.current = false;
  }, [value]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Write your legal page content…",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "legal-tiptap-editor prose prose-invert max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      isInternalUpdateRef.current = true;
      setContent(html);
      onChangeRef.current(html);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  useEffect(() => {
    if (!draftKey) return;
    const timer = window.setTimeout(() => {
      if (localStorage.getItem(draftKey) === content) return;
      localStorage.setItem(draftKey, content);
      setDraftSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftKey, content]);

  useEffect(() => {
    if (!draftKey || !enableDraftRestore) return;
    if (restoredDraftKeyRef.current === draftKey) return;
    restoredDraftKeyRef.current = draftKey;
    const saved = localStorage.getItem(draftKey);
    if (saved && saved.trim() && saved !== "<p></p>") {
      isInternalUpdateRef.current = true;
      setContent(saved);
      onChangeRef.current(saved);
      setDraftSavedAt("restored");
    }
  }, [draftKey, enableDraftRestore]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    (file: File) => {
      if (!editor) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.chain().focus().setImage({ src }).run();
        toast.success("Image inserted");
      };
      reader.onerror = () => toast.error("Failed to read image");
      reader.readAsDataURL(file);
    },
    [editor]
  );

  const stats = getHtmlStats(content);

  if (!editor) {
    return (
      <div className="flex h-[480px] animate-pulse items-center justify-center rounded-xl border border-border bg-white text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-white/[0.03] shadow-2xl shadow-black/30",
        fullscreen &&
          "fixed inset-0 z-50 m-0 rounded-none border-border bg-white/95 p-4 sm:p-6",
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

      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-gray-50 p-2 sm:p-3">
        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 4"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

        <ToolbarBtn
          title="Bold (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Insert table"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

        <ToolbarBtn title="Link (Ctrl+K)" onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Image" onClick={addImage}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarBtn>

        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

        <ToolbarBtn
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>

        <div className="ml-auto flex items-center gap-1">
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

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border bg-gray-50 px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground/80">{stats.words}</span> words
        </span>
        <span>
          <span className="font-medium text-foreground/80">{stats.characters}</span> characters
        </span>
        <span>
          <span className="font-medium text-foreground/80">{stats.readingTimeMinutes}</span> min read
        </span>
        {draftSavedAt && (
          <span className="ml-auto inline-flex items-center gap-1 text-emerald-400/80">
            <Save className="h-3 w-3" />
            Draft saved {draftSavedAt === "restored" ? "(restored)" : `at ${draftSavedAt}`}
          </span>
        )}
      </div>

      <div
        className={cn(
          "legal-tiptap-shell w-full flex-1 overflow-auto p-5 sm:p-8",
          fullscreen && "min-h-0"
        )}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} className="w-full" />
      </div>
    </div>
  );
}
