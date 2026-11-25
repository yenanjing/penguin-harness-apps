// The paper the workbench opens with. It is a complete, compilable LaTeX project: several
// `.tex` files pulled together with \input, a figure, booktabs tables and a BibTeX file, so the
// import/export round trip and the Agent's reviews have something real to work on.
import type { StoredFile } from "./latex.js";

export const SAMPLE_NAME = "Harness Matters";
export const SAMPLE_MAIN = "main.tex";

/** A 120x120 PNG: the pipeline diagram the experiments section includes. */
const PIPELINE_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAAA70lEQVR42u3dQQ3AIBAAQZSgBDmIQE7lIIfP/augH0JICZOsgjGwKWJoQwkBaNACDRo0BdCgBRo0aAqgQQs0aNACDVqgQR9Qb2U60KBBgwYNGjRo0KBBg74ROte+KtCgQYMGDRo0aNCgQYMGDRo0aNCgQYMGDRo0aNCgQYP+rjxtVaBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYN2h5kb6BBgxZo0KARgAYt0KBBUwANWqBBg6YAGrRA/7QXt/HEICMPGEcAAAAASUVORK5CYII=";

const MAIN_TEX = String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{booktabs}
\usepackage{natbib}

\title{Harness Matters: Measuring Agent Stability\\Under File-Centric Context}
\author{Prism Shadow Lab}
\date{November 2026}

\begin{document}
\maketitle

\begin{abstract}
\input{sections/abstract}
\end{abstract}

\input{sections/introduction}
\input{sections/related}
\input{sections/method}
\input{sections/experiments}
\input{sections/conclusion}

\bibliographystyle{plainnat}
\bibliography{refs}

\end{document}
`;

const ABSTRACT_TEX = String.raw`We study whether a file-centric context layer keeps coding agents stable across long
tasks. Over eight tasks and five repetitions each, agents whose working set is rebuilt
every turn score 0.61 with a standard deviation of 0.14, while agents that read and
write a durable file tree score 0.78 with a standard deviation of 0.05. The gain comes
from the layout of the context, not from more context: both arms read the same files.
`;

const INTRODUCTION_TEX = String.raw`\section{Introduction}

A coding agent that rewrites its own context every turn loses track of what it has
already established. The symptom is familiar: a task that passed on Monday fails on
Tuesday with the same prompt, the same repository and the same model, because the
rewritten summary dropped the one constraint that mattered \citep{zhang2025context}.

We argue that the variance is a property of the context layout rather than of the
model. An agent that reads and writes a durable file tree can re-read the artefact it
produced three turns ago; an agent whose context is summarised into prose cannot. The
difference is not how much the agent reads, but whether what it read survives.

This paper makes three contributions.
\begin{itemize}
  \item A stability metric that separates a change in the mean from a change in the
        variance of task scores across repetitions.
  \item An ablation over two context layouts that holds the file set, the prompt and the
        model fixed, so only the layout varies.
  \item An open harness in which both layouts are a configuration flag, so the ablation
        can be repeated on other task sets.
\end{itemize}

Our results are small in scope and should be read as such: eight tasks, one model, five
repetitions. We report them because the variance gap is large relative to the noise we
can measure, and because the harness is cheap to reproduce.
`;

const RELATED_TEX = String.raw`\section{Related Work}

Context compression for long-horizon agents is usually evaluated on the mean score
\citep{zhang2025context}. Our measurement differs in two ways: we hold the readable file
set fixed across arms, and we treat the standard deviation across repetitions as a
first-class result rather than as an error bar.

Recursive self-improvement harnesses \citep{penguin2026harness} share our interest in
making the working environment, rather than the prompt, carry the state of a task. We
borrow their file-centric workspace and add the measurement that tells whether it helps.
`;

const METHOD_TEX = String.raw`\section{Method}

\subsection{Workspace}

Every artefact the agent produces lives in a file: a plan, a patch, a test log, a note to
itself. Each turn the agent reads the files it needs and writes the files it changed. No
turn rewrites the workspace as a whole, so a file written at turn three is still there,
unchanged, at turn thirty.

\subsection{Metric}

Let $s_i$ be the score of run $i$ on a task, with $n$ runs per task. We report the mean
and the standard deviation of the per-task scores,
\begin{equation}
  \bar{s} = \frac{1}{n}\sum_{i=1}^{n} s_i, \qquad
  \sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(s_i-\bar{s}\right)^2}.
\end{equation}
A layout that raises $\bar{s}$ without touching $\sigma$ makes the agent better; a layout
that lowers $\sigma$ without touching $\bar{s}$ makes it more predictable. We care about
the second effect, because a predictable agent can be trusted with a longer task.

\subsection{Arms}

The rewritten arm summarises the conversation at the end of every turn and rebuilds the
context from that summary. The file-centric arm keeps the workspace on disk and gives the
agent read and write access to it. Both arms see the same task statement, the same
repository and the same model.
`;

const EXPERIMENTS_TEX = String.raw`\section{Experiments}

\subsection{Setup}

We run eight tasks drawn from repository maintenance: three bug fixes, three feature
additions and two refactors. Each task is run five times per arm. A run counts as solved
when the project's own test suite passes and the diff touches no file outside the task's
declared scope.

\subsection{Results}

Table~\ref{tab:main} reports the mean and the standard deviation per arm. The file-centric
arm is better on both, and the variance gap is the larger of the two effects.

\begin{table}[t]
  \centering
  \begin{tabular}{lrr}
    \toprule
    Layout & Mean & Std. \\
    \midrule
    Rewritten context & 0.61 & 0.14 \\
    File-centric      & 0.78 & 0.05 \\
    \bottomrule
  \end{tabular}
  \caption{Stability across eight tasks, five runs per task.}
  \label{tab:main}
\end{table}

Figure~\ref{fig:arch} sketches the pipeline both arms share; the only difference is
whether the turn's working set is read from disk or rebuilt from a summary.

\begin{figure}[t]
  \centering
  \includegraphics[width=0.6\linewidth]{figures/pipeline.png}
  \caption{The harness both arms share. The working set is the only place they differ.}
  \label{fig:arch}
\end{figure}

\subsection{Where the variance came from}

Reading the failing runs, the rewritten arm lost a constraint in four of the eight tasks:
a file that must not be touched, a test that must keep passing, a naming rule. The
file-centric arm lost a constraint in one task, and that run recovered after re-reading
its own plan file on the next turn.
`;

const CONCLUSION_TEX = String.raw`\section{Conclusion}

File-centric context lowers variance without lowering the mean. The effect we measured is
a survival effect: a constraint that lives in a file can be re-read, and one that lives in
a summary can be dropped. We release the harness so the ablation can be repeated on task
sets we did not run.
`;

const REFS_BIB = String.raw`@inproceedings{zhang2025context,
  author    = {Zhang, Wei and Li, Na},
  title     = {Context Rewriting Degrades Long-Horizon Coding Agents},
  booktitle = {Proceedings of the Conference on Agent Systems},
  year      = {2025},
  pages     = {112--124}
}

@article{penguin2026harness,
  author  = {Shadow, Prism},
  title   = {PenguinHarness: Unified Efficient Recursive Self-Improvement of Agents},
  journal = {arXiv preprint},
  year    = {2026}
}
`;

export const SAMPLE_FILES: StoredFile[] = [
  { path: "main.tex", binary: false, data: MAIN_TEX },
  { path: "refs.bib", binary: false, data: REFS_BIB },
  { path: "sections/abstract.tex", binary: false, data: ABSTRACT_TEX },
  { path: "sections/introduction.tex", binary: false, data: INTRODUCTION_TEX },
  { path: "sections/related.tex", binary: false, data: RELATED_TEX },
  { path: "sections/method.tex", binary: false, data: METHOD_TEX },
  { path: "sections/experiments.tex", binary: false, data: EXPERIMENTS_TEX },
  { path: "sections/conclusion.tex", binary: false, data: CONCLUSION_TEX },
  { path: "figures/pipeline.png", binary: true, data: PIPELINE_PNG },
];
