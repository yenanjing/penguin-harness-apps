/**
 * LaTeX Paper Desk through the request handler the installed page calls.
 *
 * - An archive reaches the shelf only when it carries a .tex file, and a name that would leave
 *   the project is refused rather than followed.
 * - A source edit is kept, and a compile is asked for again because the project changed.
 * - A proposal is previewed as a diff without writing, applied on request, and refused when the
 *   quote no longer sits at the lines it names.
 * - The project exported as a ZIP imports back to the same files, which is the round trip an
 *   Overleaf project depends on.
 * - The Agent is asked for located edits and review issues, never a whole file; an issue that
 *   cannot be located in the source is reported as dropped, not shown.
 * - A call with no project open, or for a file that is not there, answers with the code the page
 *   translates.
 */
import { describe, expect, it } from "vitest";
import workbench from "../workbenches/paper/index";
import {
  decodeText,
  isBinaryName,
  unzipSync,
} from "../workbenches/paper/latex";

interface Reply {
  status?: number;
  body?: any;
  headers?: Record<string, string>;
  bytes?: Uint8Array;
}

/** The handler with a fake host: one state document, and a Session whose reply the test sets. */
function open(initial: unknown = null) {
  let state: unknown = initial;
  let answer = { status: "running", text: "", error: null as string | null };
  const asked: string[] = [];
  const host = {
    listAgents: () => [{ agentId: "a" }],
    getState: () => state,
    setState: async (next: unknown) => {
      state = structuredClone(next);
    },
    createSession: async () => ({ sessionId: "session-1" }),
    run: async (_id: string, input: { text: string }[]) => {
      for (const part of input) asked.push(part.text);
      return { sessionId: "session-1", queued: true };
    },
    sessionStatus: () => "completed",
    sessionTitle: () => null,
    sessionResult: async () => answer,
    subscribe: () => () => {},
    dataPaths: () => ({ root: "/tmp", data: "/tmp", temp: "/tmp" }),
    socketPath: () => "/tmp/s",
    log: () => {},
  };
  const made = workbench.modules.Workbench.create({
    use: { host },
    effect: () => {},
  } as never) as {
    api: { main: { handle(req: unknown): Promise<Reply> } };
  };
  const call = (
    method: string,
    path: string,
    body: unknown = null,
    query: Record<string, string> = {},
  ) => made.api.main.handle({ method, path, query, headers: {}, body });
  const wait = async (id: string) => {
    for (let i = 0; i < 80; i++) {
      const reply = await call("GET", `/jobs/${id}`);
      if (reply.body?.status !== "running") return reply;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error("the job never settled");
  };
  return {
    call,
    wait,
    asked,
    state: () => state as any,
    reply: (next: typeof answer) => {
      answer = next;
    },
  };
}

const PAPER = [
  {
    path: "main.tex",
    binary: false,
    data: "\\documentclass{article}\n\\begin{document}\n",
  },
  {
    path: "sections/intro.tex",
    binary: false,
    data: "\\section{Introduction}\nWe ran eight tasks.\n",
  },
  {
    path: "refs.bib",
    binary: false,
    data: "@article{a, title={A}, year={2026}}\n",
  },
];

describe("the paper workbench handler", () => {
  it("opens an archive that carries a .tex file and refuses one that does not", async () => {
    const wb = open();

    const missing = await wb.call("POST", "/import", {
      name: "figures",
      files: [{ path: "figures/pipeline.png", binary: true, data: "AAAA" }],
    });
    const escaping = await wb.call("POST", "/import", {
      name: "bad",
      files: [{ path: "../outside.tex", binary: false, data: "x" }],
    });
    const taken = await wb.call("POST", "/import", {
      name: "Paper",
      files: PAPER,
    });

    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe("noTexFile");
    expect(escaping.status).toBe(400);
    expect(escaping.body.error).toBe("invalidPath");
    expect(taken.body.project).toMatchObject({
      name: "Paper",
      main: "main.tex",
    });
    const state = await wb.call("GET", "/state");
    expect(
      state.body.project.files.map((file: { path: string }) => file.path),
    ).toEqual(["main.tex", "refs.bib", "sections/intro.tex"]);
  });

  it("keeps an edited source file and stamps the project so the PDF is rebuilt", async () => {
    const wb = open();
    const first = await wb.call("POST", "/import", {
      name: "Paper",
      files: PAPER,
    });
    const edited =
      "\\section{Introduction}\nWe ran eight tasks in five repetitions.\n";

    const saved = await wb.call("POST", "/file", {
      path: "sections/intro.tex",
      data: edited,
    });
    const back = await wb.call("GET", "/file", null, {
      path: "sections/intro.tex",
    });

    expect(saved.status).toBe(200);
    expect(saved.body.stamp).not.toBe(first.body.project.stamp);
    expect(back.body).toEqual({
      path: "sections/intro.tex",
      binary: false,
      data: edited,
    });
  });

  it("previews a proposal as a diff, applies it on request, and refuses a stale quote", async () => {
    const wb = open();
    await wb.call("POST", "/import", { name: "Paper", files: PAPER });
    const edit = {
      startLine: 2,
      endLine: 2,
      quote: "We ran eight tasks.",
      text: "We ran eight tasks, five times each.",
    };

    const preview = await wb.call("POST", "/diff", {
      path: "sections/intro.tex",
      edits: [edit],
    });
    const untouched = await wb.call("GET", "/file", null, {
      path: "sections/intro.tex",
    });
    const applied = await wb.call("POST", "/edits", {
      path: "sections/intro.tex",
      edits: [edit],
    });
    const stale = await wb.call("POST", "/edits", {
      path: "sections/intro.tex",
      edits: [edit],
    });

    expect(preview.body.rows).toContainEqual({
      kind: "added",
      text: "We ran eight tasks, five times each.",
      before: 0,
      after: 2,
    });
    expect(untouched.body.data).toBe(PAPER[1]!.data);
    expect(applied.body.data).toBe(
      "\\section{Introduction}\nWe ran eight tasks, five times each.\n",
    );
    expect(stale.status).toBe(409);
    expect(stale.body.error).toBe("quoteMismatch");
  });

  it("applies the Agent's replacement field instead of deleting the quoted lines", async () => {
    const wb = open();
    await wb.call("POST", "/import", { name: "Paper", files: PAPER });
    const applied = await wb.call("POST", "/edits", {
      path: "sections/intro.tex",
      edits: [
        {
          startLine: 2,
          endLine: 2,
          quote: "We ran eight tasks.",
          replacement: "We ran nine tasks.",
        },
      ],
    });

    expect(applied.status).toBe(200);
    expect(applied.body.data).toBe(
      "\\section{Introduction}\nWe ran nine tasks.\n",
    );
  });

  it("locates an edit that carries only the quoted source", async () => {
    const wb = open();
    await wb.call("POST", "/import", { name: "Paper", files: PAPER });
    const applied = await wb.call("POST", "/edits", {
      path: "sections/intro.tex",
      edits: [{ quote: "We ran eight tasks.", text: "We ran ten tasks." }],
    });

    expect(applied.status).toBe(200);
    expect(applied.body.data).toBe(
      "\\section{Introduction}\nWe ran ten tasks.\n",
    );
  });

  it("exports the project as a ZIP that imports back to the same files", async () => {
    const wb = open();
    await wb.call("POST", "/import", { name: "Paper", files: PAPER });

    const exported = await wb.call("GET", "/export");
    const entries = unzipSync(exported.bytes!).map((entry) => ({
      path: entry.name,
      binary: isBinaryName(entry.name),
      data: isBinaryName(entry.name)
        ? Buffer.from(entry.data).toString("base64")
        : decodeText(entry.data),
    }));
    const reopened = open();
    const back = await reopened.call("POST", "/import", {
      name: "Again",
      files: entries,
    });
    const state = await reopened.call("GET", "/state");

    expect(exported.headers?.["content-type"]).toBe("application/zip");
    expect(back.status).toBe(200);
    expect(
      state.body.project.files.map((file: { path: string }) => file.path),
    ).toEqual(PAPER.map((file) => file.path).sort());
    expect(entries.map((entry) => [entry.path, entry.data])).toEqual(
      [...PAPER]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((file) => [file.path, file.data]),
    );
  });

  it("asks the Agent for located edits and shows a review issue at its line", async () => {
    const wb = open();
    await wb.call("POST", "/import", { name: "Paper", files: PAPER });

    const polish = await wb.call("POST", "/ai", {
      kind: "polish",
      path: "sections/intro.tex",
    });
    wb.reply({
      status: "completed",
      text: JSON.stringify({
        summary: "Tighter opening.",
        edits: [
          {
            quote: "We ran eight tasks.",
            replacement: "Eight tasks were run, five times each.",
          },
          { quote: "Not in the source.", replacement: "x" },
        ],
      }),
      error: null,
    });
    const polished = await wb.wait(polish.body.jobId);

    expect(polish.status).toBe(202);
    expect(wb.asked[0]).toContain("FILE: sections/intro.tex");
    expect(polished.body.result.edits).toEqual([
      {
        startLine: 2,
        endLine: 2,
        quote: "We ran eight tasks.",
        replacement: "Eight tasks were run, five times each.",
      },
    ]);

    const review = await wb.call("POST", "/ai", { kind: "review" });
    wb.reply({
      status: "completed",
      text: JSON.stringify({
        summary: "Two issues.",
        issues: [
          {
            category: "evidence",
            severity: "high",
            file: "sections/intro.tex",
            quote: "We ran eight tasks.",
            diagnosis: "The count has no source.",
            suggestion: "We ran eight tasks, as Table 1 reports.",
          },
          {
            category: "clarity",
            severity: "low",
            file: "sections/intro.tex",
            quote: "A sentence that is not there.",
            diagnosis: "Unlocatable.",
            suggestion: "x",
          },
        ],
      }),
      error: null,
    });
    const reviewed = await wb.wait(review.body.jobId);

    expect(reviewed.body.result.issues).toMatchObject([
      {
        category: "evidence",
        severity: "high",
        file: "sections/intro.tex",
        line: 2,
        endLine: 2,
      },
    ]);
    expect(reviewed.body.result.dropped).toHaveLength(1);
  });

  it("answers with the codes the page translates when there is no project or no such file", async () => {
    const wb = open();

    const state = await wb.call("GET", "/state");
    const compile = await wb.call("POST", "/compile");
    const file = await wb.call("GET", "/file", null, { path: "main.tex" });
    const unknown = await wb.call("POST", "/ai", { kind: "translate" });

    expect(state.body.project).toBeNull();
    expect(compile.status).toBe(404);
    expect(compile.body.error).toBe("noProject");
    expect(file.status).toBe(404);
    expect(file.body.error).toBe("noProject");
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toBe("invalidKind");

    await wb.call("POST", "/import", { name: "Paper", files: PAPER });
    const gone = await wb.call("GET", "/file", null, {
      path: "sections/method.tex",
    });
    expect(gone.status).toBe(404);
    expect(gone.body.error).toBe("missing");
  });

  it("opens the bundled paper as a project the page can compile", async () => {
    const wb = open();

    const sample = await wb.call("POST", "/sample");
    const probe = await wb.call("GET", "/probe");
    const state = await wb.call("GET", "/state");

    expect(sample.body.project).toMatchObject({
      name: "Harness Matters",
      main: "main.tex",
    });
    expect(Array.isArray(probe.body.engines)).toBe(true);
    expect(state.body.project.files.length).toBeGreaterThanOrEqual(9);
  });
});
