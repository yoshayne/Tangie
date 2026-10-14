const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type Row = [label: string, value: string | undefined];

/** The email Tangie's team receives for every inquiry. All visitor text is escaped. */
export function inquiryNotification(opts: {
  type: string;
  name: string;
  rows: Row[];
  message: string;
}) {
  const rows = opts.rows.filter((r): r is [string, string] => Boolean(r[1]));
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#252522;line-height:1.5">
<h2 style="font-weight:normal;margin:0 0 4px">New ${esc(opts.type)} inquiry</h2>
<p style="margin:0 0 20px;color:#6b665e">from ${esc(opts.name)} via TangieBeaty.com</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="color:#6b665e;vertical-align:top;white-space:nowrap">${esc(k)}</td><td>${esc(v)}</td></tr>`,
  )
  .join("\n")}
</table>
<p style="margin:24px 0 6px;color:#6b665e">Message</p>
<div style="white-space:pre-wrap;border-left:3px solid #b89a72;padding-left:12px">${esc(opts.message)}</div>
<p style="margin-top:28px;color:#6b665e;font-size:13px">Reply to this email to answer ${esc(opts.name)} directly.</p>
</body></html>`;
  const text = [
    `New ${opts.type} inquiry from ${opts.name}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    opts.message,
    "",
    `Reply to this email to answer ${opts.name} directly.`,
  ].join("\n");
  return { html, text };
}

/** The auto-reply the sender receives. */
export function inquiryAutoReply(opts: { name: string }) {
  const first = opts.name.split(" ")[0] || "there";
  const line =
    "Thank you — Tangie's team will respond within 2–3 business days.";
  return {
    subject: "We received your message",
    html: `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#252522;line-height:1.6">
<p>Hi ${esc(first)},</p>
<p>${esc(line)}</p>
<p style="margin-top:24px">With gratitude,<br>Tangie Brickhouse-Beaty</p>
</body></html>`,
    text: `Hi ${first},\n\n${line}\n\nWith gratitude,\nTangie Brickhouse-Beaty`,
  };
}
