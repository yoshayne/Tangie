"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { useAdminForm } from "./ActionForm";
import { Field } from "./fields";
import { MediaPicker } from "./MediaPicker";

const BTN =
  "min-w-9 border border-line bg-white px-2.5 py-1.5 text-sm hover:bg-[#f3efe8]";

/**
 * Rich text editor (TipTap). The HTML is sent in a hidden field and cleaned again on the server.
 * `images` adds a button that inserts photos from the media library (used by the journal).
 */
export function RichTextField({
  name,
  label,
  hint,
  images = false,
  minHeight = 220,
}: {
  name: string;
  label: string;
  hint?: string;
  images?: boolean;
  minHeight?: number;
}) {
  const { state, defaults } = useAdminForm();
  const initial = state.values?.[name] ?? String(defaults[name] ?? "");
  const [html, setHtml] = useState(initial);
  const [picking, setPicking] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      ...(images ? [Image] : []),
    ],
    content: initial,
    onUpdate: ({ editor: e }) => setHtml(e.isEmpty ? "" : e.getHTML()),
    editorProps: {
      attributes: {
        id: `f-${name}`,
        class: "prose-site max-w-none px-4 py-3 outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };
  const active = (n: string, a?: object) =>
    editor?.isActive(n, a) ? "bg-[#efe6d8]" : "";

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "Link address (https://… or mailto:…). Leave empty to remove the link.",
      prev ?? "https://",
    );
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <Field label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={html} />
      <div className="border border-line bg-white">
        <div className="flex flex-wrap gap-1 border-b border-line bg-[#faf8f4] p-2">
          <button
            type="button"
            className={`${BTN} font-bold ${active("bold")}`}
            onMouseDown={run(() => editor?.chain().focus().toggleBold().run())}
          >
            B
          </button>
          <button
            type="button"
            className={`${BTN} italic ${active("italic")}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleItalic().run(),
            )}
          >
            I
          </button>
          <button
            type="button"
            className={`${BTN} ${active("heading", { level: 2 })}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            )}
          >
            Heading
          </button>
          <button
            type="button"
            className={`${BTN} ${active("heading", { level: 3 })}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run(),
            )}
          >
            Subheading
          </button>
          <button
            type="button"
            className={`${BTN} ${active("bulletList")}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleBulletList().run(),
            )}
          >
            • List
          </button>
          <button
            type="button"
            className={`${BTN} ${active("orderedList")}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleOrderedList().run(),
            )}
          >
            1. List
          </button>
          <button
            type="button"
            className={`${BTN} ${active("blockquote")}`}
            onMouseDown={run(() =>
              editor?.chain().focus().toggleBlockquote().run(),
            )}
          >
            Quote
          </button>
          <button
            type="button"
            className={`${BTN} ${active("link")}`}
            onMouseDown={run(setLink)}
          >
            Link
          </button>
          {images ? (
            <button
              type="button"
              className={BTN}
              onMouseDown={run(() => setPicking(true))}
            >
              Photo
            </button>
          ) : null}
          <button
            type="button"
            className={BTN}
            onMouseDown={run(() => editor?.chain().focus().undo().run())}
          >
            Undo
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            editor?.chain().focus().setImage({ src: m.url, alt: m.alt }).run();
            setPicking(false);
          }}
        />
      ) : null}
    </Field>
  );
}
