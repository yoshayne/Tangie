"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { MediaPicker } from "./MediaPicker";

const BTN =
  "min-w-9 border border-line bg-white px-2.5 py-1.5 text-sm hover:bg-[#f3efe8]";

/**
 * The text editor (TipTap) without any form wiring: give it HTML, get HTML back.
 * Only reads `value` when it first appears; give it a new `key` to load different text.
 */
export function RichEditor({
  value,
  onChange,
  id,
  images = false,
  minHeight = 220,
}: {
  value: string;
  onChange: (html: string) => void;
  id?: string;
  images?: boolean;
  minHeight?: number;
}) {
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
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
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

  const chain = () => editor?.chain().focus();
  const tools: Array<[label: string, on: () => void, cls: string]> = [
    ["B", () => chain()?.toggleBold().run(), `font-bold ${active("bold")}`],
    ["I", () => chain()?.toggleItalic().run(), `italic ${active("italic")}`],
    [
      "Heading",
      () => chain()?.toggleHeading({ level: 2 }).run(),
      active("heading", { level: 2 }),
    ],
    [
      "Subheading",
      () => chain()?.toggleHeading({ level: 3 }).run(),
      active("heading", { level: 3 }),
    ],
    ["• List", () => chain()?.toggleBulletList().run(), active("bulletList")],
    [
      "1. List",
      () => chain()?.toggleOrderedList().run(),
      active("orderedList"),
    ],
    ["Quote", () => chain()?.toggleBlockquote().run(), active("blockquote")],
    ["Link", setLink, active("link")],
    ...(images
      ? ([["Photo", () => setPicking(true), ""]] as Array<
          [string, () => void, string]
        >)
      : []),
    ["Undo", () => chain()?.undo().run(), ""],
  ];

  return (
    <div className="border border-line bg-white">
      <div className="flex flex-wrap gap-1 border-b border-line bg-[#faf8f4] p-2">
        {tools.map(([label, on, cls]) => (
          <button
            key={label}
            type="button"
            className={`${BTN} ${cls}`}
            onMouseDown={run(on)}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            editor?.chain().focus().setImage({ src: m.url, alt: m.alt }).run();
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}
