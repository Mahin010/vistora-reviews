import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { MediaPickerDialog } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeHtml } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";

const TEXT_COLORS = ["", "#e11d48", "#2563eb", "#059669", "#d97706", "#7c3aed"];

function ToolButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b bg-card/95 p-1.5 backdrop-blur">
      <ToolButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />

      <ToolButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" />
      </ToolButton>
      {[1, 2, 3, 4].map((level) => {
        const Icon = level === 1 ? Heading1 : level === 2 ? Heading2 : level === 3 ? Heading3 : Heading4;
        return (
          <ToolButton
            key={level}
            title={`Heading ${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 | 4 })
                .run()
            }
          >
            <Icon className="h-4 w-4" />
          </ToolButton>
        );
      })}
      <span className="mx-1 h-5 w-px bg-border" />

      <ToolButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />

      <ToolButton
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />

      <ToolButton
        title="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton title="Separator" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />

      <ToolButton
        title="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = (editor.getAttributes("link")["href"] as string) ?? "";
          const href = window.prompt("Link URL (leave empty to remove)", previous);
          if (href === null) return;
          if (!href.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
        }}
      >
        <Link2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton title="Insert image" onClick={() => setPickerOpen(true)}>
        <ImageIcon className="h-4 w-4" />
      </ToolButton>
      <ToolButton
        title="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableIcon className="h-4 w-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />

      <div className="flex items-center gap-1 px-1">
        {TEXT_COLORS.map((color) => (
          <button
            key={color || "default"}
            type="button"
            title={color ? `Text colour ${color}` : "Default colour"}
            aria-label={color ? `Text colour ${color}` : "Default text colour"}
            onClick={() =>
              color
                ? editor.chain().focus().setColor(color).run()
                : editor.chain().focus().unsetColor().run()
            }
            className="h-4 w-4 rounded-full border"
            style={{ background: color || "transparent" }}
          />
        ))}
      </div>

      <ToolButton
        title="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser className="h-4 w-4" />
      </ToolButton>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="content"
        onSelect={(item) => {
          editor
            .chain()
            .focus()
            .setImage({ src: item.url, alt: item.alt_text ?? item.file_name })
            .run();
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlDraft, setHtmlDraft] = useState(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[420px] px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(sanitizeHtml(instance.getHTML())),
  });

  // Keep the editor in sync when the post loads asynchronously.
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value === "" ? "" : undefined]);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Content</p>
        <div className="flex gap-1 rounded-md border bg-card p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "visual" ? "default" : "ghost"}
            className="h-6 px-2 text-xs"
            onClick={() => {
              if (mode === "html" && editor) {
                const clean = sanitizeHtml(htmlDraft);
                editor.commands.setContent(clean, { emitUpdate: false });
                onChange(clean);
              }
              setMode("visual");
            }}
          >
            Visual
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "html" ? "default" : "ghost"}
            className="h-6 px-2 text-xs"
            onClick={() => {
              setHtmlDraft(editor?.getHTML() ?? value);
              setMode("html");
            }}
          >
            Code
          </Button>
        </div>
      </div>

      {mode === "visual" ? (
        editor ? (
          <>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
          </>
        ) : (
          <div className="min-h-[420px] p-4 text-sm text-muted-foreground">Loading editor…</div>
        )
      ) : (
        <Textarea
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          onBlur={() => onChange(sanitizeHtml(htmlDraft))}
          className="min-h-[420px] rounded-none border-0 font-mono text-xs focus-visible:ring-0"
          spellCheck={false}
        />
      )}
    </div>
  );
}
