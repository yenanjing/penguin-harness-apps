// Reading a ZIP in the browser: the Overleaf export arrives as an archive, and its entries stay in
// memory. Only the central directory is consulted, so a project of a few hundred files reads in
// one pass. Entries outside the project (`..`, absolute names, `__MACOSX`) are dropped, and a
// single folder wrapping everything is unwrapped, which is what both `zip -r paper.zip paper` and
// Overleaf's own export do.
const LIMIT = 32 * 1024 * 1024;
const decoder = new TextDecoder("utf-8");

/** A random id; `crypto.randomUUID` is missing outside a secure context. */
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Extensions a paper holds as bytes rather than as text. */
const BINARY =
  /\.(?:png|jpe?g|gif|webp|pdf|eps|ps|ttf|otf|woff2?|zip|gz|svgz)$/i;

export function isBinary(name) {
  return BINARY.test(name);
}

/** A stored path as a project path: forward slashes, no root, no way out of the folder. */
export function normalizeName(name) {
  const kept = [];
  for (const part of String(name).replace(/\\/g, "/").split("/")) {
    if (part === "" || part === ".") continue;
    if (part === ".." || part === "__MACOSX") return null;
    kept.push(part);
  }
  return kept.length === 0 ? null : kept.join("/");
}

function entries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floor = Math.max(0, bytes.length - 65557);
  let end = bytes.length - 22;
  while (end >= floor && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < floor) throw new Error("invalidArchive");
  const out = [];
  let at = view.getUint32(end + 16, true);
  const count = view.getUint16(end + 10, true);
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50)
      throw new Error("invalidArchive");
    const nameLength = view.getUint16(at + 28, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    out.push({
      name,
      method: view.getUint16(at + 10, true),
      compressed: view.getUint32(at + 20, true),
      size: view.getUint32(at + 24, true),
      local: view.getUint32(at + 42, true),
    });
    at +=
      46 +
      nameLength +
      view.getUint16(at + 30, true) +
      view.getUint16(at + 32, true);
  }
  return out;
}

async function inflate(bytes, entry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.local, true) !== 0x04034b50)
    throw new Error("invalidArchive");
  const start =
    entry.local +
    30 +
    view.getUint16(entry.local + 26, true) +
    view.getUint16(entry.local + 28, true);
  if (start + entry.compressed > bytes.length)
    throw new Error("invalidArchive");
  const body = bytes.subarray(start, start + entry.compressed);
  if (entry.method === 0) return body.slice();
  if (entry.method !== 8) throw new Error("unsupportedCompression");
  const reader = new Blob([body])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const out = new Uint8Array(entry.size);
  let at = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (at + value.length > entry.size) {
      await reader.cancel();
      throw new Error("invalidArchive");
    }
    out.set(value, at);
    at += value.length;
  }
  if (at !== entry.size) throw new Error("invalidArchive");
  return out;
}

/**
 * The files of an exported paper: `{ name, binary, data }`, where text is a string and bytes are
 * base64. The caller decides what to keep.
 */
export async function readArchive(file) {
  if (file.size > LIMIT) throw new Error("tooLarge");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const found = entries(bytes);
  const files = [];
  for (const entry of found) {
    if (entry.name.endsWith("/")) continue;
    const name = normalizeName(entry.name);
    if (name === null) continue;
    // A macOS resource fork travels beside the file it belongs to.
    if (name.split("/").pop().startsWith("._")) continue;
    const raw = await inflate(bytes, entry);
    files.push(
      isBinary(name)
        ? { path: name, binary: true, data: toBase64(raw) }
        : { path: name, binary: false, data: decodeText(raw) },
    );
  }
  unwrap(files);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function unwrap(files) {
  if (files.length === 0) return;
  const first = files[0].path.split("/")[0];
  if (!files.every((entry) => entry.path.startsWith(`${first}/`))) return;
  for (const entry of files) entry.path = entry.path.slice(first.length + 1);
}

/** UTF-8, with a GB18030 fallback for archives written on a Chinese Windows machine. */
function decodeText(bytes) {
  const text = decoder.decode(bytes);
  if ((text.match(/\uFFFD/g) ?? []).length <= text.length * 0.01)
    return text.replace(/^\uFEFF/, "");
  try {
    return new TextDecoder("gb18030").decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return text.replace(/^\uFEFF/, "");
  }
}

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** What a file picker or a drop gives us, as the handler's `/import` body. */
export async function importBody(file) {
  const files = await readArchive(file);
  const main =
    files.find((entry) => /(?:^|\/)main\.tex$/i.test(entry.path))?.path ??
    files.find((entry) => /\.tex$/i.test(entry.path))?.path ??
    null;
  return {
    name: file.name.replace(/\.zip$/i, ""),
    main,
    files: files.map((entry) => ({
      path: entry.path,
      binary: entry.binary,
      data: entry.data,
    })),
  };
}
