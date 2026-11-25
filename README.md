# PenguinHarness Apps

[中文](README.zh.md)

These optional apps appear in the PenguinHarness App Center after installation. An administrator installs a package from the plugin marketplace’s GitHub channel. Then a Project member adds its workbench to an Agent from the plugin library.

| Workbench | Contents | Original contribution |
| --- | --- | --- |
| [Kaoyan Flashcards](plugins/kaoyan-flashcards) | Question banks, spaced review and recitation notes for the postgraduate entrance exam | [PenguinHarness #1586](https://github.com/Prism-Shadow/penguin-harness/tree/34b5620de564b09eb8192de9fd3383499109037e/plugins/kaoyan-flashcards) |
| [English Learning Workbench](plugins/english-workbench) | Annotated reading, vocabulary review and speaking practice | [PenguinHarness #1587](https://github.com/Prism-Shadow/penguin-harness/tree/f28cea044d819dfac1041958f4b64581e4547635/plugins/english-workbench) |
| [AI Character Chat](plugins/character-chat) | Four illustrated original characters, character cards and individual memory books | [PenguinHarness #1590](https://github.com/Prism-Shadow/penguin-harness/tree/5aa4789c7f8992bb11ba0be1d4f0e8de1d2d3364/plugins/character-chat) |
| [Perler Studio](plugins/perler-studio) | Image-to-bead charts, palettes and printable patterns | [PenguinHarness #1586](https://github.com/Prism-Shadow/penguin-harness/tree/34b5620de564b09eb8192de9fd3383499109037e/plugins/perler-studio) |
| [Piggy Sticker World](plugins/piglet-stickers) | Sticker scenes, themed challenges and saved compositions | [PenguinHarness #1587](https://github.com/Prism-Shadow/penguin-harness/tree/f28cea044d819dfac1041958f4b64581e4547635/plugins/piglet-stickers) |
| [Frostline](plugins/penguin-snowboard) | A penguin snowboard game with scored aerial tricks | Original workbench |
| [Study Map](plugins/study-map) | Explore a repository or reading as a diagram with clickable source citations | [Archify](https://github.com/tt-a1i/archify) |
| [Worlds Anthems](plugins/worlds-anthems) | Play eight Worlds songs and official arrangements through SoundCloud | PenguinHarness example task |
| [LaTeX Paper Desk](plugins/latex-desk) | Overleaf-style paper projects with the PDF beside the source, compiler messages at their line, and Agent diffs and review comments | Original workbench |

The linked source revisions retain contributor history, including Yaowei Zheng (hiyouga) and the original community submissions. Each package keeps its license, acknowledgments, package and workbench IDs. Character Chat needs the host’s [persistent app directories](https://github.com/Prism-Shadow/penguin-harness/pull/1579) and [talk-only Sessions](https://github.com/Prism-Shadow/penguin-harness/pull/1588). Its README explains how existing cards and memories move.

[Arcade](arcade/README.md) collects three more optional workbenches: [Transport Ship](plugins/harbor-pulse), [Aurora Drift 3D](plugins/aurora-drift) and [Pelican Bike](plugins/pelican-post).

[Pocket Arcade](plugins/pocket-arcade) includes ten original keyboard and touch games that also open offline.

[Midnight Rhythm](plugins/midnight-rhythm) is an original two-lane rhythm game with keyboard and touch controls.

[Download the workbench packages from GitHub Releases](https://github.com/Prism-Shadow/penguin-harness-apps/releases).

## Agent content and workbenches

The [original PenguinHarness sources](https://github.com/Prism-Shadow/penguin-harness/tree/e56648fb99d9ab622981e3cab04272fed4c1cb5c/plugins) retain the contributor history. The packages keep their original names, Apache-2.0 licenses, and workbench and Skill identifiers.

- A2UI, External Plugin Porting, and Firecrawl supply Skills for the default Agent.
- Humanizer and Claude Code supply optional writing and coding Skills. Continual Learning supplies a stop hook.
- Action Minutes, Daily Draw, Fridge Keeper, Party Charades, Reading Desk, and Tabletop Desk supply optional workbenches. Reading Desk also includes its library Skill.

## Packaging

Use Node 24 and run `npm ci`, `npm run build:desks`, `npm test` and `npm run typecheck`. Each directory under `plugins/<slug>/` holds the content and interface table shipped by that package. To make a local installable tarball, run `npm run pack:plugins -- --out /tmp/penguin-apps <slug>`. Omit the slug to pack all workbenches. The command prints the file path and SHA-512 integrity for each package.

## Releasing

Plugins keep their own package versions. A GitHub prerelease groups the packages in one tested revision of `main` under a tag such as `v2026.11.23-rc.1`. Use the next RC number for another release that day. Add the matching section to [CHANGELOG.md](CHANGELOG.md), merge the source and notes, and tag the verified commit.

The [release workflow](.github/workflows/release.yml) runs the checks, rebuilds the arcade bundles and packs each plugin twice. The release contains `<slug>-<packageVersion>.tgz` for each workbench and a `packages.json` listing the package names, versions, filenames and SHA-512 digests. The workflow checks earlier releases for changed bytes under an existing package version. A retry verifies existing attachments and uploads missing files to a draft before publishing it.

Register the released asset URL and its integrity in the [official plugin directory](https://github.com/Prism-Shadow/penguin-harness-plugins). The GitHub channel provides optional installation from the marketplace. The release workflow leaves npm publication and the stable GitHub release separate.
