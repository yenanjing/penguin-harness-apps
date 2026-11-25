// The page's two dictionaries. Read at render time, so switching the language redraws the current
// view; the choice itself lives in localStorage and nowhere else.
const strings = {
  en: {
    "app.name": "LaTeX Paper Desk",
    "app.subtitle": "Write, review and typeset a paper beside its PDF.",
    "action.sample": "Open sample paper",
    "action.import": "Import ZIP",
    "action.export": "Export ZIP",
    "action.compile": "Compile",
    "action.save": "Save",
    "files.title": "Sources",
    "files.none": "No file open",
    "files.empty":
      "No project yet. Open the sample paper or import an Overleaf ZIP.",
    "editor.empty": "Open a file from the left to edit it.",
    "pdf.none": "Compile to see the PDF here.",
    "pdf.open": "Open in a new tab",
    "pdf.pages": "{n} pages",
    "pdf.locate": "Show line in PDF",
    "pdf.stale": "Compile first: this PDF is older than the source.",
    "pdf.notFound": "This line has no place in the PDF.",
    "status.compiling": "Compiling…",
    "status.compiled": "Compiled with {engine}.",
    "status.noEngine": "No LaTeX engine on this host.",
    "status.importing": "Reading the archive…",
    "status.imported": "Imported {n} files.",
    "status.saved": "Saved.",
    "status.failed": "Compile failed. See the messages below.",
    "status.working": "Asking the Agent…",
    "status.done": "The Agent answered.",
    "diag.title": "Compiler messages",
    "diag.none": "No errors or warnings.",
    "ai.title": "Assistant",
    "ai.polish": "Polish this file",
    "ai.review": "Review the paper",
    "ai.bib": "Tidy BibTeX",
    "ai.figure": "Place a figure",
    "ai.instruction": "What should change? (optional)",
    "ai.needsFile": "Open the file you want the Agent to work on first.",
    "ai.summary": "Summary",
    "ai.issues": "{n} review comments",
    "ai.dropped":
      "{n} comments could not be located in the source and were left out.",
    "ai.apply": "Apply",
    "ai.empty":
      "Ask the Agent to polish a file, review the paper, tidy the bibliography or place a figure.",
    "ai.polishDone": "Read the proposed wording, then apply or discard it.",
    "ai.reviewDone": "Click a comment to jump to the line it refers to.",
    "ai.figureDone": "The figure is inserted after the quoted line.",
    "ai.bibDone": "The whole bibliography is replaced when you apply it.",
    "ai.running": "The Agent is reading the paper…",
    "diff.title": "Proposed change",
    "diff.before": "Before",
    "diff.after": "After",
    "diff.apply": "Apply and recompile",
    "diff.discard": "Discard",
    "sev.high": "high",
    "sev.medium": "medium",
    "sev.low": "low",
    "cat.logic": "logic",
    "cat.evidence": "evidence",
    "cat.clarity": "clarity",
    "cat.citation": "citation",
    "cat.notation": "notation",
    "cat.figures": "figures",
    "cat.grammar": "grammar",
    "err.network": "The workbench did not answer. Is the Agent running?",
    "err.invalidFiles": "The archive holds no usable files.",
    "err.invalidPath": "A file name in the archive is not allowed.",
    "err.fileTooLarge": "A file is larger than 8 MB.",
    "err.projectTooLarge": "The project is larger than 40 MB.",
    "err.noTexFile": "The archive holds no .tex file.",
    "err.noProject": "Open a project first.",
    "err.missing": "That file is not in the project.",
    "err.noPdf": "The last compile produced no PDF.",
    "err.invalid": "The request was not understood.",
    "err.binary": "That file is not text.",
    "err.method": "That method is not allowed here.",
    "err.invalidKind": "That assistant action does not exist.",
    "err.quoteMismatch":
      "The source changed since the proposal; the change was not applied.",
    "err.invalidRange":
      "The proposal names lines outside the file; the change was not applied.",
    "err.agent": "The Agent could not be reached.",
    "err.unreadable": "The Agent's answer could not be read as a proposal.",
    "notice.stale": "The source changed. Compile again to refresh the PDF.",
  },
  zh: {
    "app.name": "论文写作台",
    "app.subtitle": "在 PDF 旁边写、审、编译一篇 LaTeX 论文。",
    "action.sample": "打开样例论文",
    "action.import": "导入 ZIP",
    "action.export": "导出 ZIP",
    "action.compile": "编译",
    "action.save": "保存",
    "files.title": "源文件",
    "files.none": "未打开文件",
    "files.empty": "还没有项目。打开样例论文，或导入 Overleaf 导出的 ZIP。",
    "editor.empty": "从左侧选择一个文件开始编辑。",
    "pdf.none": "编译后 PDF 会显示在这里。",
    "pdf.open": "新标签页打开",
    "pdf.pages": "共 {n} 页",
    "pdf.locate": "在 PDF 中定位",
    "pdf.stale": "请先编译：当前 PDF 比源码旧。",
    "pdf.notFound": "这一行在 PDF 里没有对应位置。",
    "status.compiling": "正在编译…",
    "status.compiled": "已用 {engine} 编译完成。",
    "status.noEngine": "这台机器上没有 LaTeX 引擎。",
    "status.importing": "正在读取压缩包…",
    "status.imported": "已导入 {n} 个文件。",
    "status.saved": "已保存。",
    "status.failed": "编译失败，请看下面的报错。",
    "status.working": "正在请求 Agent…",
    "status.done": "Agent 已回复。",
    "diag.title": "编译消息",
    "diag.none": "没有错误或警告。",
    "ai.title": "助手",
    "ai.polish": "润色当前文件",
    "ai.review": "审阅全文",
    "ai.bib": "整理 BibTeX",
    "ai.figure": "插入图表",
    "ai.instruction": "希望怎么改？（可留空）",
    "ai.needsFile": "先在左侧打开要让 Agent 处理的文件。",
    "ai.summary": "总述",
    "ai.issues": "{n} 条审阅意见",
    "ai.dropped": "{n} 条意见无法在源码中定位，已略去。",
    "ai.apply": "采纳",
    "ai.empty":
      "让 Agent 润色某个文件、审阅全文、整理参考文献，或编排一张图的插入位置。",
    "ai.polishDone": "先读一遍建议的措辞，再决定采纳或放弃。",
    "ai.reviewDone": "点击某条意见可以跳到它指向的那一行。",
    "ai.figureDone": "图会插在被引用的那一行之后。",
    "ai.bibDone": "采纳后会整体替换参考文献文件。",
    "ai.running": "Agent 正在读这篇论文…",
    "diff.title": "建议的改动",
    "diff.before": "改前",
    "diff.after": "改后",
    "diff.apply": "采纳并重新编译",
    "diff.discard": "放弃",
    "sev.high": "高",
    "sev.medium": "中",
    "sev.low": "低",
    "cat.logic": "逻辑",
    "cat.evidence": "证据",
    "cat.clarity": "表述",
    "cat.citation": "引用",
    "cat.notation": "记号",
    "cat.figures": "图表",
    "cat.grammar": "语法",
    "err.network": "工作台没有响应，Agent 是否在运行？",
    "err.invalidFiles": "压缩包里没有可用的文件。",
    "err.invalidPath": "压缩包中有不允许的文件名。",
    "err.fileTooLarge": "有文件超过 8 MB。",
    "err.projectTooLarge": "整个项目超过 40 MB。",
    "err.noTexFile": "压缩包里没有 .tex 文件。",
    "err.noProject": "请先打开一个项目。",
    "err.missing": "项目里没有这个文件。",
    "err.noPdf": "上次编译没有产出 PDF。",
    "err.invalid": "请求无法识别。",
    "err.binary": "这个文件不是文本。",
    "err.method": "这里不允许这个方法。",
    "err.invalidKind": "没有这个助手操作。",
    "err.quoteMismatch": "源码在建议生成后已改动，本次没有应用。",
    "err.invalidRange": "建议引用的行超出文件范围，本次没有应用。",
    "err.agent": "联系不上 Agent。",
    "err.unreadable": "Agent 的回复无法解析为建议。",
    "notice.stale": "源码已改动，重新编译可刷新 PDF。",
  },
};

const KEY = "latex-desk.lang";

export function lang() {
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    saved = null;
  }
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language && navigator.language.toLowerCase().startsWith("zh")
    ? "zh"
    : "en";
}

export function setLang(next) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // A browser that refuses storage still gets the switch for this visit.
  }
}

export function t(key, values) {
  const table = strings[lang()] ?? strings.en;
  let text = table[key] ?? strings.en[key] ?? key;
  for (const [name, value] of Object.entries(values ?? {}))
    text = text.replace(`{${name}}`, String(value));
  return text;
}

export const languages = { en: "English", zh: "中文" };
