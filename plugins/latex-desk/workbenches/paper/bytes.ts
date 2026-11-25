// The host compiles a workbench without @types/node, so no global `Buffer` exists at compile time.
// Reading it off `globalThis` keeps the runtime behaviour identical and leaves the global type space
// alone: with @types/node installed this file still compiles, because the cast goes through unknown.

export type Bytes = Uint8Array & { toString(encoding?: string): string };

export type BufferLike = {
  from(value: string, encoding?: string): Bytes;
  from(value: Uint8Array): Bytes;
  alloc(size: number): Bytes;
  byteLength(value: string | Uint8Array): number;
  concat(parts: readonly Uint8Array[]): Bytes;
};

export const Buffer: BufferLike = (
  globalThis as unknown as { Buffer: BufferLike }
).Buffer;
