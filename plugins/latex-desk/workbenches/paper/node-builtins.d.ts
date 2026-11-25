// The few Node built-ins the workbench uses, declared here because the host compiles a workbench
// with its own fixed compiler options and no @types/node. Only what the code below imports is
// declared, so a new import shows up as a missing module rather than as a silent `any`.
// `Buffer` is deliberately not declared here: a global interface or var would merge into the real
// @types/node `Buffer` and make it stop matching `Uint8Array`. `bytes.ts` reads it off `globalThis`.

type Bytes = Uint8Array & { toString(encoding?: string): string };

declare module "node:child_process" {
  type Stream = { on(event: "data", listener: (chunk: Bytes) => void): void };
  export type Child = {
    stdout: Stream | null;
    stderr: Stream | null;
    on(event: "error", listener: (error: Error) => void): void;
    on(event: "close", listener: (code: number | null) => void): void;
    kill(signal?: string): boolean;
  };
  export function spawn(
    command: string,
    args: readonly string[],
    options?: {
      cwd?: string;
      env?: Record<string, string | undefined>;
      stdio?: readonly (string | number)[];
    },
  ): Child;
}

declare module "node:fs/promises" {
  export function mkdir(
    path: string,
    options: { recursive: true },
  ): Promise<string | undefined>;
  export function mkdtemp(prefix: string): Promise<string>;
  export function readFile(path: string): Promise<Bytes>;
  export function rm(
    path: string,
    options: { recursive: true; force: true },
  ): Promise<void>;
  export function writeFile(
    path: string,
    data: string | Uint8Array,
  ): Promise<void>;
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare module "node:path" {
  type Paths = {
    join(...parts: string[]): string;
    resolve(...parts: string[]): string;
    dirname(path: string): string;
    basename(path: string, extension?: string): string;
    relative(from: string, to: string): string;
    readonly sep: string;
  };
  const path: Paths & { readonly posix: Paths };
  export default path;
}

declare module "node:crypto" {
  export function randomUUID(): string;
}

declare module "node:zlib" {
  export function deflateRawSync(
    data: Uint8Array,
    options?: { level?: number },
  ): Bytes;
  export function inflateRawSync(data: Uint8Array): Bytes;
  export function gunzipSync(data: Uint8Array): Bytes;
}
