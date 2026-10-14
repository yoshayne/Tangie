export type UploadState = {
  id: string;
  name: string;
  progress: number; // 0-100
  status: "uploading" | "done" | "error";
  error?: string;
  duplicate?: boolean;
  media?: { id: string; url: string; alt?: string };
  cancel?: () => void;
};

const isImage = (f: File) =>
  f.type.startsWith("image/") ||
  /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(f.name);

function xhr(
  url: string,
  init: {
    body: XMLHttpRequestBodyInit;
    headers?: Record<string, string>;
    onProgress: (p: number) => void;
  },
) {
  const req = new XMLHttpRequest();
  const promise = new Promise<{ status: number; json: unknown }>(
    (resolve, reject) => {
      req.open("POST", url);
      for (const [k, v] of Object.entries(init.headers ?? {}))
        req.setRequestHeader(k, v);
      req.upload.onprogress = (e) =>
        e.lengthComputable &&
        init.onProgress(Math.round((e.loaded / e.total) * 100));
      req.onload = () => {
        let json: unknown = null;
        try {
          json = JSON.parse(req.responseText);
        } catch {
          /* not json */
        }
        resolve({ status: req.status, json });
      };
      req.onerror = () => reject(new Error("Network error"));
      req.onabort = () => reject(new Error("Cancelled"));
      req.send(init.body);
    },
  );
  return { promise, abort: () => req.abort() };
}

/**
 * Uploads files one by one with progress and a cancel button. Photos go through the photo
 * endpoint; videos and documents are streamed. The server re-checks every file's real type.
 */
export async function uploadFiles(
  files: File[],
  onChange: (states: UploadState[]) => void,
): Promise<UploadState[]> {
  const states: UploadState[] = files.map((f, i) => ({
    id: `${i}-${f.name}`,
    name: f.name,
    progress: 0,
    status: "uploading",
  }));
  const push = () => onChange(states.map((s) => ({ ...s })));
  push();

  for (const [i, file] of files.entries()) {
    const s = states[i];
    try {
      let call;
      if (isImage(file)) {
        const fd = new FormData();
        fd.append("files", file);
        call = xhr("/api/admin/media/upload", {
          body: fd,
          onProgress: (p) => {
            s.progress = p;
            push();
          },
        });
      } else {
        call = xhr("/api/admin/media/file", {
          body: file,
          headers: {
            "x-filename": encodeURIComponent(file.name),
            "content-type": "application/octet-stream",
          },
          onProgress: (p) => {
            s.progress = p;
            push();
          },
        });
      }
      s.cancel = call.abort;
      const { status, json } = await call.promise;
      const body = json as {
        results?: Array<{
          ok: boolean;
          error?: string;
          duplicate?: boolean;
          media?: UploadState["media"];
        }>;
        media?: UploadState["media"];
        error?: string;
      } | null;
      if (status >= 200 && status < 300) {
        const r = body?.results?.[0];
        if (r && !r.ok) {
          s.status = "error";
          s.error = r.error;
        } else {
          s.status = "done";
          s.progress = 100;
          s.duplicate = r?.duplicate;
          s.media = r?.media ?? body?.media;
        }
      } else {
        s.status = "error";
        s.error = body?.error ?? `Upload failed (${status}).`;
      }
    } catch (e) {
      s.status = "error";
      s.error =
        (e as Error).message === "Cancelled"
          ? "Cancelled."
          : "The upload failed. Check your connection and try again.";
    }
    s.cancel = undefined;
    push();
  }
  return states;
}
