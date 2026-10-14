"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkDraft,
  discardDraft,
  getPreviewToken,
  listRevisions,
  publishPage,
  restoreRevision,
  saveBlock,
  saveDraft,
  unpublishPage,
  type RevisionItem,
} from "@/app/admin/actions-pages";
import { slugify } from "@/lib/admin/slug";
import type { DraftDoc, DraftSection, Issue } from "@/lib/page-builder/types";
import {
  SECTION_META,
  sectionLabelFor,
  type FieldSpec,
} from "@/lib/sections/meta";
import { AddSectionDialog } from "./AddSectionDialog";
import { FieldList, type BuilderCtx } from "./FieldForm";
import { SectionList } from "./SectionList";
import { SettingsPanel } from "./SettingsPanel";

type Status = "saved" | "unsaved" | "saving" | "error";
type Device = "desktop" | "tablet" | "phone";
const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "820px",
  phone: "390px",
};

export type PageEditorProps = {
  pageId: string;
  initialDoc: DraftDoc;
  hasDraft: boolean;
  published: boolean;
  isSystem: boolean;
  isTemplate: boolean;
  previewToken: string;
  ctx: BuilderCtx;
};

const newId = () => crypto.randomUUID();
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function PageEditor(props: PageEditorProps) {
  const { pageId, ctx, isSystem, isTemplate } = props;

  // --- the working copy, with undo/redo -----------------------------------------------------
  const [doc, setDoc] = useState<DraftDoc>(props.initialDoc);
  const docRef = useRef(doc);
  const [past, setPast] = useState<DraftDoc[]>([]);
  const [future, setFuture] = useState<DraftDoc[]>([]);
  const lastPush = useRef(0);
  /** Bumped when the whole document is swapped (undo, redo) so open forms reload their text. */
  const [rev, setRev] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"sections" | "settings">("sections");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<Device>("desktop");
  const [adding, setAdding] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(props.hasDraft);
  const [published, setPublished] = useState(props.published);
  const [liveSlug, setLiveSlug] = useState(props.initialDoc.settings.slug);
  const slugTouched = useRef(props.published || props.isSystem);

  // --- saving -------------------------------------------------------------------------------
  const [status, setStatus] = useState<Status>("saved");
  const [saveError, setSaveError] = useState("");
  const dirty = useRef(false);
  const savedDoc = useRef<DraftDoc>(props.initialDoc);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const iframe = useRef<HTMLIFrameElement>(null);

  const tellPreview = useCallback(
    (msg: Record<string, unknown>) =>
      iframe.current?.contentWindow?.postMessage(msg, window.location.origin),
    [],
  );

  const doSave = useCallback(async () => {
    const snapshot = docRef.current;
    if (snapshot === savedDoc.current) {
      setStatus("saved");
      return;
    }
    setStatus("saving");
    const res = await saveDraft(pageId, snapshot);
    if (res.ok) {
      savedDoc.current = snapshot;
      setHasDraft(true);
      if (docRef.current === snapshot) {
        dirty.current = false;
        setStatus("saved");
      } else setStatus("unsaved");
      setSaveError("");
      tellPreview({ type: "tb-refresh" });
    } else {
      setStatus("error");
      setSaveError(res.error ?? "Could not save.");
    }
  }, [pageId, tellPreview]);

  /** Saves now, after any save already in progress. */
  const flush = useCallback(() => {
    chain.current = chain.current.then(doSave);
    return chain.current;
  }, [doSave]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => void flush(), 800);
    return () => clearTimeout(t);
  }, [doc, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status === "unsaved" || status === "saving" || status === "error")
        e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  function change(next: DraftDoc, structural = false) {
    const prev = docRef.current;
    const now = Date.now();
    if (structural || now - lastPush.current > 1500) {
      setPast((p) => [...p.slice(-39), prev]);
      lastPush.current = now;
    }
    setFuture([]);
    docRef.current = next;
    dirty.current = true;
    setStatus("unsaved");
    setDoc(next);
  }
  const edit = (
    fn: (sections: DraftSection[]) => DraftSection[],
    structural = true,
  ) =>
    change(
      { ...docRef.current, sections: fn(docRef.current.sections) },
      structural,
    );
  const patchSection = (
    id: string,
    patch: Partial<DraftSection>,
    structural = false,
  ) =>
    edit(
      (ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      structural,
    );

  function jump(to: DraftDoc) {
    docRef.current = to;
    dirty.current = true;
    setStatus("unsaved");
    setDoc(to);
    setRev((r) => r + 1);
    if (selectedId && !to.sections.some((s) => s.id === selectedId))
      setSelectedId(null);
  }
  function undo() {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast(past.slice(0, -1));
    setFuture([docRef.current, ...future]);
    jump(prev);
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture(future.slice(1));
    setPast([...past, docRef.current]);
    jump(next);
  }

  // --- selection, shared with the preview --------------------------------------------------
  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      setPanel("sections");
      tellPreview({ type: "tb-select", id });
    },
    [tellPreview],
  );
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; id?: string } | null;
      if (d?.type === "tb-select" && d.id) {
        setSelectedId(d.id);
        setPanel("sections");
        setMobileTab("edit");
      }
      if (d?.type === "tb-ready" && selectedId)
        tellPreview({ type: "tb-select", id: selectedId });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [selectedId, tellPreview]);

  // The preview link expires after a few hours; renew it quietly while the editor stays open.
  const [token, setToken] = useState(props.previewToken);
  useEffect(() => {
    const t = setInterval(
      () => void getPreviewToken(pageId).then(setToken),
      3 * 60 * 60 * 1000,
    );
    return () => clearInterval(t);
  }, [pageId]);
  const previewSrc = useMemo(
    () => `/preview/${pageId}?token=${encodeURIComponent(token)}`,
    [pageId, token],
  );

  // --- section actions ---------------------------------------------------------------------
  function addSection(
    index: number,
    type: string,
    props?: Record<string, unknown>,
  ) {
    const section: DraftSection = {
      id: newId(),
      type,
      props: clone(props ?? SECTION_META[type].defaults),
      anchorId: null,
      hidden: false,
    };
    edit((ss) => [...ss.slice(0, index), section, ...ss.slice(index)]);
    setSelectedId(section.id);
    setPanel("sections");
  }
  function duplicate(id: string) {
    edit((ss) => {
      const i = ss.findIndex((s) => s.id === id);
      if (i < 0) return ss;
      const copy = { ...clone(ss[i]), id: newId(), anchorId: null };
      return [...ss.slice(0, i + 1), copy, ...ss.slice(i + 1)];
    });
  }
  function remove(id: string) {
    const s = docRef.current.sections.find((x) => x.id === id);
    if (!s) return;
    if (
      !window.confirm(
        `Delete “${sectionLabelFor(s.type, s.props)}”? You can undo this until you publish.`,
      )
    )
      return;
    edit((ss) => ss.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function move(id: string, delta: number) {
    edit((ss) => {
      const i = ss.findIndex((s) => s.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const copy = [...ss];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  // --- publishing ---------------------------------------------------------------------------
  const [dialog, setDialog] = useState<"publish" | "history" | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<RevisionItem[] | null>(null);
  const [message, setMessage] = useState("");

  async function openPublish() {
    setDialog("publish");
    setDone(null);
    setNote("");
    setChecking(true);
    await flush();
    setIssues(await checkDraft(pageId));
    setChecking(false);
  }
  async function doPublish() {
    setPublishing(true);
    await flush();
    const res = await publishPage(pageId, note);
    setPublishing(false);
    setIssues(res.issues);
    if (res.ok) {
      setHasDraft(false);
      setPublished(true);
      setLiveSlug(res.slug ?? liveSlug);
      savedDoc.current = docRef.current;
      setDone(res.slug ?? "");
    }
  }
  async function openHistory() {
    setDialog("history");
    setRevisions(null);
    setRevisions(await listRevisions(pageId));
  }

  const errorIds = useMemo(
    () =>
      new Set(
        issues
          .filter((i) => i.level === "error" && i.sectionId)
          .map((i) => i.sectionId!),
      ),
    [issues],
  );
  const selected = doc.sections.find((s) => s.id === selectedId) ?? null;
  const statusText =
    status === "saving"
      ? "Saving…"
      : status === "unsaved"
        ? "Unsaved changes…"
        : status === "error"
          ? "Could not save"
          : hasDraft
            ? "Draft saved"
            : published
              ? "Up to date"
              : "Saved";

  const btn =
    "border border-line bg-white px-3 py-1.5 text-sm hover:bg-[#f3efe8] disabled:opacity-40";

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f6f4f0]">
      {/* top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2">
        <Link href="/admin/pages" className="text-sm text-bronze underline">
          ← Pages
        </Link>
        <h1 className="mr-2 max-w-[14rem] truncate font-display text-lg">
          {doc.settings.title || "Untitled"}
        </h1>
        <span
          role="status"
          className={`text-xs ${status === "error" ? "text-[#9b2c2c]" : "text-stone"}`}
          title={saveError}
        >
          {statusText}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            className="hidden gap-1 lg:flex"
            role="group"
            aria-label="Preview size"
          >
            {(["desktop", "tablet", "phone"] as Device[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className={`border px-2.5 py-1.5 text-xs capitalize ${device === d ? "border-bronze bg-[#f6efe3]" : "border-line bg-white"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <button className={btn} onClick={undo} disabled={!past.length}>
            Undo
          </button>
          <button className={btn} onClick={redo} disabled={!future.length}>
            Redo
          </button>
          <button className={btn} onClick={openHistory}>
            History
          </button>
          {hasDraft ? (
            <button
              className={btn}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Throw away all unpublished changes to this page?",
                  )
                )
                  return;
                await discardDraft(pageId);
                window.location.reload();
              }}
            >
              Discard changes
            </button>
          ) : null}
          <button
            onClick={openPublish}
            className="bg-bronze px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#815f36]"
          >
            Publish
          </button>
        </div>
      </header>

      {/* phone: switch between editing and previewing */}
      <div
        className="flex border-b border-line bg-white lg:hidden"
        role="tablist"
      >
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={mobileTab === t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2 text-sm font-semibold capitalize ${mobileTab === t ? "border-b-2 border-bronze text-bronze" : "text-stone"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* left panel */}
        <aside
          className={`${mobileTab === "edit" ? "block" : "hidden"} w-full shrink-0 overflow-y-auto border-r border-line bg-[#faf8f4] lg:block lg:w-[380px]`}
        >
          <div className="flex border-b border-line bg-white">
            {(["sections", "settings"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPanel(t)}
                className={`flex-1 py-2.5 text-sm font-semibold ${panel === t ? "border-b-2 border-bronze text-bronze" : "text-stone"}`}
              >
                {t === "sections" ? "Sections" : "Page settings"}
              </button>
            ))}
          </div>
          <div className="p-3">
            {panel === "settings" ? (
              <>
                <SettingsPanel
                  key={rev}
                  settings={doc.settings}
                  isSystem={isSystem}
                  isTemplate={isTemplate}
                  published={published}
                  onSlugTouched={() => (slugTouched.current = true)}
                  onChange={(s) => {
                    const titleChanged =
                      s.title !== docRef.current.settings.title;
                    const slug =
                      !slugTouched.current && titleChanged && !isSystem
                        ? slugify(s.title)
                        : s.slug;
                    change(
                      { ...docRef.current, settings: { ...s, slug } },
                      false,
                    );
                  }}
                />
                {published && !isSystem ? (
                  <button
                    className="mt-6 border border-[#9b2c2c] px-3 py-2 text-sm text-[#9b2c2c]"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Take this page off the website? Visitors will see a “not found” page. You can publish it again later.",
                        )
                      )
                        return;
                      await unpublishPage(pageId);
                      setPublished(false);
                      setMessage(
                        "The page is no longer visible on the website.",
                      );
                    }}
                  >
                    Take this page off the website
                  </button>
                ) : null}
                {message ? (
                  <p className="mt-3 text-sm text-stone">{message}</p>
                ) : null}
              </>
            ) : selected ? (
              <SectionForm
                key={`${selected.id}-${rev}`}
                section={selected}
                ctx={ctx}
                issues={issues.filter((i) => i.sectionId === selected.id)}
                onBack={() => select(null)}
                onProps={(p) => patchSection(selected.id, { props: p })}
                onMeta={(patch) => patchSection(selected.id, patch, true)}
                onDuplicate={() => duplicate(selected.id)}
                onDelete={() => remove(selected.id)}
              />
            ) : (
              <>
                {issues.some((i) => !i.sectionId) ? (
                  <ul className="mb-3 space-y-1 text-sm">
                    {issues
                      .filter((i) => !i.sectionId)
                      .map((i, n) => (
                        <li
                          key={n}
                          className={
                            i.level === "error"
                              ? "text-[#9b2c2c]"
                              : "text-[#8a5a00]"
                          }
                        >
                          {i.message}
                        </li>
                      ))}
                  </ul>
                ) : null}
                <SectionList
                  sections={doc.sections}
                  selectedId={selectedId}
                  problems={errorIds}
                  onSelect={select}
                  onReorder={(ss) => edit(() => ss)}
                  onToggleHidden={(id) => {
                    const s = doc.sections.find((x) => x.id === id);
                    if (s) patchSection(id, { hidden: !s.hidden }, true);
                  }}
                  onDuplicate={duplicate}
                  onDelete={remove}
                  onMove={move}
                  onInsert={(i) => setAdding(i)}
                />
                {doc.sections.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-stone">
                    This page is empty. Add your first section.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </aside>

        {/* preview */}
        <section
          className={`${mobileTab === "preview" ? "flex" : "hidden"} min-w-0 flex-1 justify-center bg-[#e4e0d8] lg:flex`}
        >
          <iframe
            ref={iframe}
            key={previewSrc}
            src={previewSrc}
            title="Page preview"
            className="h-full border-0 bg-ivory"
            style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
          />
        </section>
      </div>

      {adding !== null ? (
        <AddSectionDialog
          onClose={() => setAdding(null)}
          onAdd={(type, p) => addSection(adding, type, p)}
        />
      ) : null}

      {dialog ? (
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal();
          }}
          onClose={() => setDialog(null)}
          className="m-auto max-h-[88vh] w-[min(640px,96vw)] max-w-none overflow-y-auto border border-line bg-white p-0 backdrop:bg-black/60"
        >
          <div className="p-5">
            {dialog === "publish" ? (
              <PublishBody
                checking={checking}
                issues={issues}
                note={note}
                setNote={setNote}
                publishing={publishing}
                done={done}
                onPublish={doPublish}
                onJump={(id) => {
                  setDialog(null);
                  select(id);
                  setMobileTab("edit");
                }}
                sections={doc.sections}
              />
            ) : (
              <HistoryBody
                revisions={revisions}
                onRestore={async (id) => {
                  if (
                    !window.confirm(
                      "Load this version into your draft? Your current draft will be replaced. Nothing goes live until you publish.",
                    )
                  )
                    return;
                  const res = await restoreRevision(pageId, id);
                  if (res.ok) window.location.reload();
                  else window.alert(res.error);
                }}
              />
            )}
            <div className="mt-5 flex justify-end">
              <button className={btn} onClick={() => setDialog(null)}>
                Close
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
function PublishBody({
  checking,
  issues,
  note,
  setNote,
  publishing,
  done,
  onPublish,
  onJump,
  sections,
}: {
  checking: boolean;
  issues: Issue[];
  note: string;
  setNote: (s: string) => void;
  publishing: boolean;
  done: string | null;
  onPublish: () => void;
  onJump: (id: string) => void;
  sections: DraftSection[];
}) {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  if (done !== null)
    return (
      <div>
        <h2 className="font-display text-2xl">Published</h2>
        <p className="mt-2 text-stone">Your changes are live.</p>
        <p className="mt-4">
          <a
            href={done ? `/${done}` : "/"}
            target="_blank"
            rel="noreferrer"
            className="bg-bronze px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white"
          >
            View the page ↗
          </a>
        </p>
      </div>
    );
  return (
    <div>
      <h2 className="font-display text-2xl">Publish this page</h2>
      {checking ? (
        <p className="mt-3 text-stone">Checking the page…</p>
      ) : (
        <>
          {errors.length ? (
            <div className="mt-3">
              <p className="font-semibold text-[#9b2c2c]">
                Fix these before publishing:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {errors.map((i, n) => (
                  <li key={n}>
                    {i.message}{" "}
                    {i.sectionId &&
                    sections.some((s) => s.id === i.sectionId) ? (
                      <button
                        className="text-bronze underline"
                        onClick={() => onJump(i.sectionId!)}
                      >
                        Go to section
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-stone">
              Everything looks good. This puts your changes live right away.
            </p>
          )}
          {warnings.length ? (
            <ul className="mt-3 space-y-1 text-sm text-[#8a5a00]">
              {warnings.map((i, n) => (
                <li key={n}>⚠ {i.message}</li>
              ))}
            </ul>
          ) : null}
          {!errors.length ? (
            <>
              <label className="mt-4 block text-sm font-semibold">
                What changed? (optional, shown in History)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={120}
                  className="mt-1 w-full border border-line px-3 py-2 font-normal"
                />
              </label>
              <button
                onClick={onPublish}
                disabled={publishing}
                className="mt-4 bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
              >
                {publishing ? "Publishing…" : "Publish now"}
              </button>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function HistoryBody({
  revisions,
  onRestore,
}: {
  revisions: RevisionItem[] | null;
  onRestore: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl">History</h2>
      <p className="mt-1 text-sm text-stone">
        Each time you publish, the page is remembered here (the last 25
        versions).
      </p>
      {revisions === null ? (
        <p className="mt-4 text-stone">Loading…</p>
      ) : revisions.length === 0 ? (
        <p className="mt-4 text-stone">No published versions yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border border-line">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1">
                <span className="block font-semibold">
                  {new Date(r.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/New_York",
                  })}
                </span>
                <span className="text-stone">{r.note ?? "No note"}</span>
              </span>
              <button
                className="border border-bronze-light px-3 py-1.5 text-bronze"
                onClick={() => onRestore(r.id)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function SectionForm({
  section,
  ctx,
  issues,
  onBack,
  onProps,
  onMeta,
  onDuplicate,
  onDelete,
}: {
  section: DraftSection;
  ctx: BuilderCtx;
  issues: Issue[];
  onBack: () => void;
  onProps: (p: Record<string, unknown>) => void;
  onMeta: (patch: Partial<DraftSection>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const meta = SECTION_META[section.type];
  if (!meta) return <p>Unknown section type.</p>;
  const isAppearance = (f: FieldSpec) =>
    f.name === "background" || f.name === "spacing";
  const main = meta.fields.filter((f) => !isAppearance(f));
  const look = meta.fields.filter(isAppearance);

  return (
    <div className="space-y-5">
      <button className="text-sm text-bronze underline" onClick={onBack}>
        ← All sections
      </button>
      <div>
        <h2 className="font-display text-xl">{meta.label}</h2>
        <p className="text-xs text-stone">{meta.description}</p>
      </div>
      {issues.length ? (
        <ul className="space-y-1 border border-[#9b2c2c] bg-[#fdf1f1] p-3 text-sm text-[#9b2c2c]">
          {issues.map((i, n) => (
            <li key={n}>{i.message}</li>
          ))}
        </ul>
      ) : null}
      <FieldList
        fields={main}
        value={section.props}
        onChange={onProps}
        ctx={ctx}
        defaults={meta.defaults}
        idPrefix={`s-${section.id.slice(0, 6)}`}
      />
      <details className="border border-line bg-white">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
          Appearance and options
        </summary>
        <div className="space-y-4 border-t border-line p-3">
          {look.length ? (
            <FieldList
              fields={look}
              value={section.props}
              onChange={onProps}
              ctx={ctx}
              defaults={meta.defaults}
              idPrefix={`a-${section.id.slice(0, 6)}`}
            />
          ) : null}
          <div>
            <label
              htmlFor="anchor"
              className="mb-1 block text-sm font-semibold"
            >
              Anchor name
            </label>
            <input
              id="anchor"
              value={section.anchorId ?? ""}
              onChange={(e) =>
                onMeta({
                  anchorId:
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/^-+/, "")
                      .slice(0, 40) || null,
                })
              }
              placeholder="e.g. inquiry"
              className="w-full border border-line px-3 py-2"
            />
            <p className="mt-1 text-xs text-stone">
              Lets a link jump straight here, like /speaking#inquiry.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#8c6b3f]"
              checked={section.hidden}
              onChange={(e) => onMeta({ hidden: e.target.checked })}
            />
            Hide this section (keep it, but don&apos;t show it)
          </label>
        </div>
      </details>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          className="border border-line bg-white px-3 py-1.5 text-sm"
          onClick={onDuplicate}
        >
          Duplicate
        </button>
        <button
          className="border border-line bg-white px-3 py-1.5 text-sm"
          onClick={async () => {
            const name = window.prompt(
              "Name for this saved block:",
              meta.label,
            );
            if (!name) return;
            const res = await saveBlock(name, section.type, section.props);
            window.alert(
              res.ok
                ? "Saved. Find it under “My saved blocks” when you add a section."
                : res.error,
            );
          }}
        >
          Save as reusable block
        </button>
        <button
          className="border border-[#9b2c2c] px-3 py-1.5 text-sm text-[#9b2c2c]"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
