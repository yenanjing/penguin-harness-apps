/**
 * The workbench end to end, against a real TeX engine: open the bundled paper, compile it, ask
 * SyncTeX both ways, apply a replacement and rebuild, then break a line and read the message back
 * at the file and line it came from.
 *
 * Skipped by default: it needs `tectonic`, `latexmk` or `pdflatex` on PATH, and Tectonic downloads
 * its bundle on the first run. Run it with
 *
 *   LATEX_DESK_E2E=1 npx vitest run plugins/latex-desk/test/e2e.test.ts
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import workbench from "../workbenches/paper/index";

const ENGINE = ["tectonic", "latexmk", "pdflatex"].find((name) => {
  const probe = spawnSync(name, ["--version"], { encoding: "utf8" });
  return probe.status === 0 || /version/i.test(`${probe.stdout ?? ""}`);
});
const ENABLED = process.env.LATEX_DESK_E2E === "1" && ENGINE !== undefined;

type Reply = {
  status: number;
  body: any;
  bytes?: Uint8Array;
};

function open() {
  let state: unknown = null;
  const host = {
    listAgents: () => [],
    getState: () => state,
    setState: async (next: unknown) => {
      state = structuredClone(next);
    },
    createSession: async () => ({ sessionId: "s" }),
    run: async () => ({ sessionId: "s", queued: true }),
    sessionStatus: () => "completed",
    sessionTitle: () => null,
    sessionResult: async () => ({ status: "running", text: "", error: null }),
    subscribe: () => () => {},
    dataPaths: () => ({ root: "/tmp", data: "/tmp", temp: "/tmp" }),
    socketPath: () => "/tmp/s",
    log: () => {},
  };
  const made = workbench.modules.Workbench.create({
    use: { host },
    effect: () => {},
  } as never) as { api: { main: { handle(req: unknown): Promise<Reply> } } };
  return (
    method: string,
    at: string,
    body: unknown = null,
    query: Record<string, string> = {},
  ) => made.api.main.handle({ method, path: at, query, headers: {}, body });
}

describe.skipIf(!ENABLED)("the bundled paper on a real engine", () => {
  it("compiles, maps both ways, applies a change and locates a broken line", async () => {
    const call = open();
    expect((await call("POST", "/sample")).status).toBe(200);

    const build = await call("POST", "/compile");
    expect(build.body.ok).toBe(true);
    expect(build.body.engine).toBe(ENGINE);
    expect(build.body.pages).toBeGreaterThanOrEqual(3);
    expect(build.body.diagnostics).toEqual([]);

    const pdf = await call("GET", "/pdf");
    expect(pdf.bytes?.length ?? 0).toBeGreaterThan(10_000);

    const forward = await call("POST", "/forward", {
      path: "sections/experiments.tex",
      line: 12,
    });
    expect(forward.body.found).toBe(true);
    expect(forward.body.page).toBeGreaterThan(0);

    const inverse = await call("POST", "/inverse", { page: 1, y: 400 });
    expect(inverse.body).toMatchObject({ found: true });
    expect(typeof inverse.body.file).toBe("string");

    const source = await call("GET", "/file", null, {
      path: "sections/experiments.tex",
    });
    const quote = String(source.body.data).split("\n")[4]!;
    const applied = await call("POST", "/edits", {
      path: "sections/experiments.tex",
      edits: [
        {
          startLine: 5,
          endLine: 5,
          quote,
          text: quote.replace("eight", "nine"),
        },
      ],
    });
    expect(applied.status).toBe(200);
    expect(applied.body.data).toContain("nine tasks");

    const rebuilt = await call("POST", "/compile");
    expect(rebuilt.body.ok).toBe(true);
    expect(rebuilt.body.pages).toBe(build.body.pages);

    const broken = await call("POST", "/edits", {
      path: "sections/method.tex",
      edits: [{ startLine: 3, endLine: 2, text: "\\undefinedmacro" }],
    });
    expect(broken.status).toBe(200);

    const failed = await call("POST", "/compile");
    expect(failed.body.ok).toBe(false);
    expect(
      failed.body.diagnostics.find(
        (item: { severity: string }) => item.severity === "error",
      ),
    ).toMatchObject({
      file: "sections/method.tex",
      line: 3,
      message: "Undefined control sequence",
    });
  }, 300_000);
});
