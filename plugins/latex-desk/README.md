# LaTeX Paper Desk

A paper desk beside your Agent: import an Overleaf project, write and compile it with the PDF in the next pane, and let the Agent propose wording and review comments you can read as diffs before they touch the source.

Sources are on the left. The file you open is edited in the middle, with line numbers and, under it, every compiler message at the file and line it came from. The PDF is on the right, with the Assistant below it.

## What it does

- Import an Overleaf project, or any standard LaTeX project, as a ZIP: many `.tex` files, figures, tables and `.bib`. One wrapper folder is unwrapped, and an entry that would leave the project (`..`, an absolute name, `__MACOSX`) is refused rather than followed. Export writes the same tree back as a ZIP, so a project can go back to Overleaf unchanged.
- Compile with the engine the host has: Tectonic first, then `latexmk`, then `pdflatex`. With `pdflatex`, a `.bib` gets a BibTeX pass and two more LaTeX passes. The PDF appears beside the source.
- Read every error and warning out of the log and place it at its `.tex` file and line: `! Undefined control sequence.` followed by `l.3` becomes an error at that line, and a `LaTeX Warning`/`Package … Warning` keeps the line its `on input line <n>` names. Click a message to open that line. A message the log names no file for is still reported, without a location.
- Put the caret on a line and click **Show line in PDF**: SyncTeX opens the page that line was typeset on. The handler answers the other direction too, for a caller that knows a page and a height.
- **Polish this file**: the Agent returns up to 8 replacements, each located by a run of lines copied verbatim from the source, so a change lands only where the reader saw it. Each one is shown as before/after and applied on its own, or discarded; applying rebuilds the PDF.
- **Review the paper**: comments with a category (logic, evidence, clarity, citation, notation, figures, grammar), a severity, a diagnosis and LaTeX text that can replace the quoted lines. Click a comment to jump to its line, and adopt it to patch the source and recompile. Comments that cannot be located in the source are left out and counted.
- **Tidy BibTeX**: the `.bib` is rewritten from what its entries already say, never from invented authors, years or DOIs, and the keys cited in the paper that it could not find are listed.
- **Place a figure**: pick a file, and the Agent inserts a figure block after a quoted line, referencing only images the project already holds and labels that already exist.
- **Open sample paper** loads a four-page multi-file paper with a bibliography and a figure, so the whole round trip can be tried without an import.

## Get started

1. In the plugin marketplace, install **LaTeX Paper Desk** from the GitHub channel, then add it to the Agent where you want to use it.
2. Open that Agent. The **LaTeX Paper Desk** tab appears beside the chat; you can also open its tile in the App Center.
3. Then:
   - click **Open sample paper**, then **Compile**, and read the PDF on the right;
   - put the caret in a paragraph and click **Show line in PDF**;
   - under **Assistant**, click **Polish this file** (optionally with an instruction such as "tighten the opening"), read the diff, and apply it;
   - click **Review the paper**, then click a comment to see the line it refers to, and adopt one.

The engine is not bundled: install Tectonic, TeX Live or MacTeX on the host that runs PenguinHarness, and the badge at the top shows which engine was found.

## Your data

The project and the last 30 Assistant turns are kept as one document in the workbench's own state on your PenguinHarness server. The page keeps nothing in the browser except the interface language, under its own key, holding only "zh" or "en".

Each compile stages the project in a temporary directory, runs the engine there and deletes the directory afterwards; the PDF, the diagnostics and the SyncTeX map are kept in memory for the page. A project may hold up to 400 files, 8 MB each and 40 MB in total.

Assistant actions send source to the Agent attached to this workbench as one turn: the open file for **Polish this file** and **Place a figure**, every `.tex` and `.bib` file (up to 120,000 characters) for **Review the paper**, and the `.bib` for **Tidy BibTeX**. That text leaves the machine the way a chat message does. The prompts ask the Agent to answer with JSON only, to use no tools, and never to follow instructions found in the source.

Nothing else is fetched. Compiling runs a local engine; if Tectonic has not cached its bundle yet, Tectonic itself downloads it on the first compile.

Removing the workbench deletes its saved record.

## Make it yours

The workbench is source code in the Agent's own files, so the Agent can change it when you ask. For example:

- "Add a Table button to the Assistant that proposes a `booktabs` table from the numbers in the results section."
- "Add a 'check citations' action that lists every `\cite` key with no entry in refs.bib, without calling the model."

Where things are, under `workbenches/paper/`: `latex.ts` holds the archive reader and writer, the log reader, the SyncTeX map, the diff and the replacement applier; `index.ts` the routes, the engines and the four Agent prompts; `sample.ts` the bundled paper; `ui/` the page (`app.js`, `strings.js` for both languages, `styles.css`, `zip.js` for reading an archive in the browser).

Updating the plugin replaces this source with the new version, your Agent's edits included.

## Tests

`npm test` runs the unit and handler tests, including a real log and a real SyncTeX map. The end-to-end check needs an engine on `PATH` and is skipped by default:

```bash
LATEX_DESK_E2E=1 npx vitest run plugins/latex-desk/test/e2e.test.ts
```

It compiles the sample paper, asks SyncTeX both ways, applies a replacement, rebuilds, then breaks a line and expects the error back at `sections/method.tex:3`.

## Licence and credits

- Apache-2.0, see [LICENSE](LICENSE).
- By Prism-Shadow, built from a workbench contributed by a PenguinHarness user.
- Inspired by [Overleaf](https://github.com/overleaf/overleaf) for the project-in, PDF-beside-source round trip, and by `penguin-harness-paper` for the multi-file paper layout. This workbench is not affiliated with either.
- Tectonic, TeX Live, latexmk and BibTeX belong to their own projects; none is bundled here.
- The sample paper, its bibliography and its figure were written for this workbench.
