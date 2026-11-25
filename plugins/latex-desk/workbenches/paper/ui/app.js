/* LaTeX Paper Desk: the page.
 *
 * No framework and no outside dependency. The project lives in the workbench's handler
 * (`../api/state` says what is open, `../api/file` reads and writes a source file), and the page
 * keeps the open file's text in memory so typing does not cross the network.
 *
 * The PDF comes from `../api/pdf`, which answers the last build; a build is identified by its
 * stamp, so the frame is re-pointed only when a compile actually produced a new one. The Agent is
 * asked for located edits (`POST ../api/ai`), never for a whole file, and the reply is polled
 * (`GET ../api/jobs/<id>`) until it is done; applying an edit is another request (`POST
 * ../api/edits`), followed by a compile.
 */
import { importBody } from "./zip.js";
import { lang, setLang, t } from "./strings.js";

const $ = (selector) => document.querySelector(selector);

const state = {
  project: null,
  current: null,
  text: "",
  saved: "",
  stamp: "",
  pdfStamp: "",
  job: null,
  polling: null,
};

const api = async (path, init) => {
  const res = await fetch(`../api${path}`, {
    cache: "no-store",
    ...(init ?? {}),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
};

const post = (path, value) =>
  api(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });

function say(message, tone) {
  const notice = $("#notice");
  notice.textContent = message;
  notice.dataset.tone = tone ?? "";
  notice.hidden = message === "";
}

function explain(reply) {
  const code = reply.body?.error;
  if (typeof code === "string") {
    const text = t(`err.${code}`);
    if (!text.startsWith("err.")) return text;
    if (typeof reply.body.message === "string") return reply.body.message;
  }
  return t("err.network");
}

/* ---------------------------------------------------------------- chrome */

function paint() {
  for (const node of document.querySelectorAll("[data-i]")) {
    node.textContent = t(node.dataset.i);
  }
  for (const node of document.querySelectorAll("[data-i-ph]")) {
    node.placeholder = t(node.dataset.iPh);
  }
  $("#lang").textContent = lang() === "zh" ? "English" : "中文";
  document.documentElement.lang = lang() === "zh" ? "zh" : "en";
}

function engineBadge(engines) {
  const badge = $("#engine");
  if (!engines || engines.length === 0) {
    badge.textContent = "no engine";
    badge.dataset.tone = "danger";
    badge.title = t("status.noEngine");
    return;
  }
  badge.textContent = engines[0];
  badge.dataset.tone = "success";
  badge.title = engines.join(", ");
}

/* ---------------------------------------------------------------- files */

function tree(files) {
  const root = $("#tree");
  root.replaceChildren();
  let folder = null;
  for (const file of files) {
    const cut = file.path.lastIndexOf("/");
    const dir = cut === -1 ? "" : file.path.slice(0, cut);
    if (dir !== folder) {
      folder = dir;
      const heading = document.createElement("p");
      heading.className = "dir";
      heading.textContent = dir === "" ? "project" : dir;
      root.append(heading);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = cut === -1 ? file.path : file.path.slice(cut + 1);
    if (file.binary) button.classList.add("binary");
    if (file.path === state.current)
      button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => void open(file.path));
    root.append(button);
  }
  $("#files-empty").hidden = files.length > 0;
}

function gutter(lines, mark) {
  const root = $("#gutter");
  root.replaceChildren();
  for (let i = 1; i <= lines; i++) {
    const row = document.createElement("b");
    row.textContent = String(i);
    if (mark !== null && i >= mark.from && i <= mark.to)
      row.classList.add("on");
    root.append(row);
  }
}

function scrollTo(line, lines) {
  const editor = $("#editor");
  if (line === null) return;
  const step = parseFloat(getComputedStyle(editor).lineHeight) || 20;
  const target = Math.max(0, (line - 3) * step);
  editor.scrollTop = Math.min(
    target,
    Math.max(0, lines * step - editor.clientHeight),
  );
  $("#gutter").scrollTop = editor.scrollTop;
}

/** The 1-based line the caret sits on, which is the line a reader wants to find in the PDF. */
function cursorLine() {
  const editor = $("#editor");
  return editor.value.slice(0, editor.selectionStart).split("\n").length;
}

function showText(mark) {
  const binary =
    state.current !== null &&
    /\.(?:png|jpe?g|gif|webp|pdf|eps|ps|ttf|otf|woff2?)$/i.test(state.current);
  const editor = $("#editor");
  editor.hidden = binary;
  $("#asset").hidden = !binary;
  $("#save").disabled = binary || state.text === state.saved;
  $("#dirty").hidden = binary || state.text === state.saved;
  if (binary) {
    $("#asset").alt = state.current ?? "";
    return;
  }
  editor.value = state.text;
  const lines = state.text === "" ? 0 : state.text.split("\n").length;
  gutter(lines, mark ?? null);
  scrollTo(mark?.from ?? null, lines);
}

async function open(path) {
  const reply = await api(`/file?path=${encodeURIComponent(path)}`);
  if (!reply.ok || reply.body === null) {
    say(explain(reply));
    return;
  }
  state.current = path;
  state.text = reply.body.binary ? "" : String(reply.body.data ?? "");
  state.saved = state.text;
  say("");
  tree(state.project?.files ?? []);
  showText(null);
}

async function refresh(focus) {
  const reply = await api("/state");
  if (!reply.ok || reply.body === null) {
    say(explain(reply));
    return;
  }
  state.project = reply.body.project;
  state.stamp = reply.body.project?.stamp ?? "";
  renderJobs(reply.body.jobs ?? []);
  if (state.project === null) {
    state.current = null;
    state.text = "";
    state.saved = "";
    tree([]);
    showText(null);
    $("#current").textContent = t("files.none");
    return;
  }
  tree(state.project.files);
  const keep =
    focus ??
    state.current ??
    state.project.files.find(
      (entry) => !entry.binary && /(?:^|\/)main\.tex$/i.test(entry.path),
    )?.path ??
    state.project.files.find((entry) => !entry.binary)?.path ??
    null;
  if (keep !== null && keep !== state.current) await open(keep);
  else if (state.current !== null) {
    $("#current").textContent = state.current;
    showText(null);
  }
}

/* ---------------------------------------------------------------- compile */

async function compile() {
  if (state.project === null) {
    say(t("err.noProject"));
    return;
  }
  const reply = await post("/compile", {});
  if (!reply.ok || reply.body === null) {
    say(explain(reply));
    return;
  }
  state.stamp = reply.body.stamp ?? state.stamp;
  renderDiagnostics(reply.body.diagnostics ?? []);
  if (reply.body.ok) {
    state.pdfStamp = state.stamp;
    const frame = $("#pdf");
    frame.src = `../api/pdf?v=${encodeURIComponent(state.stamp)}`;
    frame.hidden = false;
    $("#pdf-none").hidden = true;
    $("#open-pdf").hidden = false;
    $("#open-pdf").onclick = () => window.open(frame.src, "_blank", "noopener");
    $("#locate").hidden = false;
    $("#pages").textContent = t("pdf.pages", { n: reply.body.pages ?? 0 });
    say("");
  } else {
    say(t("status.failed"), "danger");
  }
}

function renderDiagnostics(list) {
  const rows = $("#diags-list");
  rows.replaceChildren();
  $("#diags-none").hidden = list.length > 0;
  for (const entry of list) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const where = document.createElement("span");
    where.className = "where";
    where.textContent = entry.file === "" ? "—" : `${entry.file}:${entry.line}`;
    const badge = document.createElement("span");
    badge.className = "wb-badge";
    badge.dataset.tone = entry.severity === "error" ? "danger" : "attention";
    badge.textContent = entry.severity;
    button.append(badge, where, document.createTextNode(entry.message));
    if (entry.file !== "") {
      button.addEventListener("click", () => {
        void open(entry.file).then(() => {
          const from = entry.line > 0 ? entry.line : 1;
          const lines = state.text.split("\n").length;
          showText({ from, to: from });
          scrollTo(from, lines);
        });
      });
    } else button.disabled = true;
    item.append(button);
    rows.append(item);
  }
}

/* ---------------------------------------------------------------- agent */

async function ask(kind) {
  const needsFile = kind === "polish" || kind === "figure";
  if (needsFile && state.current === null) {
    say(t("ai.needsFile"));
    return;
  }
  setBusy(true);
  say(t("ai.running"));
  const body = {
    kind,
    lang: lang(),
    instruction: $("#instruction").value.trim(),
  };
  if (needsFile) body.path = state.current;
  const reply = await post("/ai", body);
  if (!reply.ok || reply.body === null) {
    setBusy(false);
    say(explain(reply), "danger");
    return;
  }
  state.job = { id: reply.body.jobId, kind };
  $("#ai-status").textContent = t("ai.running");
  poll();
}

function poll() {
  if (state.polling !== null) clearTimeout(state.polling);
  state.polling = setTimeout(async () => {
    if (state.job === null) return;
    const reply = await api(`/jobs/${state.job.id}`);
    if (!reply.ok || reply.body === null) {
      setBusy(false);
      say(explain(reply), "danger");
      return;
    }
    if (reply.body.status === "running") {
      poll();
      return;
    }
    setBusy(false);
    $("#ai-status").textContent = "";
    if (reply.body.status === "failed") {
      say(
        reply.body.error ? t(`err.${reply.body.error}`) : t("err.agent"),
        "danger",
      );
      return;
    }
    showAnswer(state.job.kind, reply.body.result);
  }, 1200);
}

function setBusy(busy) {
  for (const button of document.querySelectorAll(".actions button"))
    button.disabled = busy;
  $("#compile").disabled = busy;
}

function showAnswer(kind, result) {
  const out = $("#assistant-out");
  out.replaceChildren();
  const card = document.createElement("div");
  card.className = "card";
  const summary = document.createElement("p");
  summary.className = "summary";
  summary.textContent = String(result?.summary ?? "");
  card.append(summary);
  if (kind === "review") {
    const issues = Array.isArray(result?.issues) ? result.issues : [];
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = t("ai.reviewDone");
    card.append(hint);
    const list = document.createElement("ul");
    list.className = "rows";
    for (const issue of issues) list.append(issueRow(issue));
    card.append(list);
    if (Array.isArray(result?.dropped) && result.dropped.length > 0) {
      const note = document.createElement("p");
      note.className = "hint";
      note.textContent = t("ai.dropped", { n: result.dropped.length });
      card.append(note);
    }
    out.append(card);
    return;
  }
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  if (
    kind === "bib" &&
    Array.isArray(result?.missingKeys) &&
    result.missingKeys.length > 0
  ) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = `${result.missingKeys.length}: ${result.missingKeys.join(", ")}`;
    card.append(note);
  }
  card.append(diffView(rows));
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "wb-primary";
  apply.textContent = t("diff.apply");
  apply.addEventListener("click", () => void applyEdits(result, apply));
  const drop = document.createElement("button");
  drop.type = "button";
  drop.textContent = t("diff.discard");
  drop.addEventListener("click", () => out.replaceChildren());
  const bar = document.createElement("div");
  bar.className = "row";
  bar.append(apply, drop);
  card.append(bar);
  out.append(card);
}

function issueRow(issue) {
  const item = document.createElement("li");
  const line = document.createElement("div");
  line.className = "issue";
  const badges = document.createElement("span");
  badges.className = "badges";
  const category = document.createElement("span");
  category.className = "wb-badge";
  category.dataset.tone = "info";
  category.textContent = tag("cat", issue.category);
  const severity = document.createElement("span");
  severity.className = "wb-badge";
  severity.dataset.tone =
    issue.severity === "high"
      ? "danger"
      : issue.severity === "low"
        ? "neutral"
        : "attention";
  severity.textContent = tag("sev", issue.severity);
  badges.append(category, severity);
  const body = document.createElement("div");
  body.className = "body";
  const jump = document.createElement("button");
  jump.type = "button";
  jump.style.all = "unset";
  jump.style.cursor = "pointer";
  jump.textContent = `${issue.file}:${issue.line}`;
  jump.addEventListener("click", () => {
    void open(String(issue.file)).then(() => {
      const lines = state.text.split("\n").length;
      showText({
        from: Number(issue.line),
        to: Number(issue.endLine ?? issue.line),
      });
      scrollTo(Number(issue.line), lines);
    });
  });
  const diagnosis = document.createElement("span");
  diagnosis.className = "diagnosis";
  diagnosis.textContent = String(issue.diagnosis ?? "");
  body.append(jump, diagnosis);
  line.append(badges, body);
  item.append(line);
  if (typeof issue.suggestion === "string" && issue.suggestion.trim() !== "") {
    const adopt = document.createElement("button");
    adopt.type = "button";
    adopt.textContent = t("ai.apply");
    adopt.style.marginLeft = "0.2rem";
    adopt.addEventListener("click", async () => {
      adopt.disabled = true;
      const patch = [
        {
          startLine: issue.line,
          endLine: issue.endLine ?? issue.line,
          quote: issue.quote,
          text: issue.suggestion,
        },
      ];
      const ok = await patchFile(issue.file, patch);
      adopt.disabled = false;
      if (ok) await compile();
    });
    item.append(adopt);
  }
  return item;
}

function tag(prefix, value) {
  const key = `${prefix}.${value}`;
  const text = t(key);
  return text.startsWith(`${prefix}.`) ? String(value ?? "") : text;
}

function diffView(rows) {
  const box = document.createElement("div");
  box.className = "diff";
  const kept = rows.slice(0, 600);
  for (const row of kept) {
    const line = document.createElement("div");
    line.className = row.kind;
    line.textContent = `${row.kind === "added" ? "+" : row.kind === "removed" ? "-" : " "} ${row.text}`;
    box.append(line);
  }
  if (rows.length > kept.length) {
    const more = document.createElement("div");
    more.className = "hint";
    more.textContent = `… +${rows.length - kept.length}`;
    box.append(more);
  }
  return box;
}

async function patchFile(filePath, edits) {
  const reply = await post("/edits", { path: filePath, edits });
  if (!reply.ok || reply.body === null) {
    say(explain(reply), "danger");
    return false;
  }
  if (state.current === filePath) {
    state.text = String(reply.body.data ?? state.text);
    state.saved = state.text;
    showText(null);
  }
  say(t("status.saved"));
  return true;
}

async function applyEdits(result, button) {
  button.disabled = true;
  const filePath =
    state.job?.kind === "bib"
      ? String(result.file ?? state.current)
      : state.current;
  const edits = Array.isArray(result.edits) ? result.edits : [];
  const ok = await patchFile(filePath, edits);
  button.disabled = false;
  if (ok) await compile();
}

function renderJobs(jobs) {
  if (state.job !== null || jobs.length === 0) return;
  const last = jobs[jobs.length - 1];
  $("#ai-status").textContent = `${last.kind} · ${last.status}`;
}

/* ---------------------------------------------------------------- wiring */

function bind() {
  $("#editor").addEventListener("input", () => {
    state.text = $("#editor").value;
    const lines = state.text.split("\n").length;
    gutter(lines, null);
    $("#save").disabled = state.text === state.saved;
    $("#dirty").hidden = state.text === state.saved;
  });
  $("#editor").addEventListener("scroll", () => {
    $("#gutter").scrollTop = $("#editor").scrollTop;
  });
  $("#save").addEventListener("click", async () => {
    if (state.current === null) return;
    const reply = await post("/file", {
      path: state.current,
      data: state.text,
    });
    if (!reply.ok) {
      say(explain(reply), "danger");
      return;
    }
    state.saved = state.text;
    state.stamp = reply.body?.stamp ?? new Date().toISOString();
    $("#save").disabled = true;
    $("#dirty").hidden = true;
    say(t("notice.stale"));
  });
  $("#compile").addEventListener("click", () => void compile());
  $("#locate").addEventListener("click", async () => {
    if (state.current === null || state.pdfStamp !== state.stamp) {
      say(t("pdf.stale"));
      return;
    }
    const reply = await post("/forward", {
      path: state.current,
      line: cursorLine(),
    });
    if (!reply.ok || reply.body === null || reply.body.found !== true) {
      say(t("pdf.notFound"));
      return;
    }
    const frame = $("#pdf");
    frame.src = `../api/pdf?v=${encodeURIComponent(state.pdfStamp)}#page=${reply.body.page}`;
    say("");
  });
  $("#sample").addEventListener("click", async () => {
    const reply = await post("/sample", {});
    if (!reply.ok) {
      say(explain(reply), "danger");
      return;
    }
    await refresh();
    await compile();
  });
  $("#export").addEventListener("click", () => {
    if (state.project === null) {
      say(t("err.noProject"));
      return;
    }
    const link = document.createElement("a");
    link.href = "../api/export";
    link.download = `${state.project.name}.zip`;
    link.click();
  });
  $("#import").addEventListener("click", () => $("#archive").click());
  $("#archive").addEventListener("change", async () => {
    const file = $("#archive").files?.[0];
    $("#archive").value = "";
    if (!file) return;
    say(t("status.importing"));
    let body;
    try {
      body = await importBody(file);
    } catch {
      say(t("err.invalidFiles"), "danger");
      return;
    }
    const reply = await post("/import", body);
    if (!reply.ok) {
      say(explain(reply), "danger");
      return;
    }
    await refresh();
    await compile();
  });
  $("#lang").addEventListener("click", () => {
    setLang(lang() === "zh" ? "en" : "zh");
    paint();
    showText(null);
  });
  document.addEventListener("keydown", (event) => {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      $("#save").click();
    } else if (event.key === "Enter") {
      event.preventDefault();
      void compile();
    }
  });
}

async function start() {
  paint();
  bind();
  const probe = await api("/probe");
  engineBadge(probe.ok ? probe.body?.engines : []);
  await refresh();
  if (state.project !== null) await compile();
}

void start();
