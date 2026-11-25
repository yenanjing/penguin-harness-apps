# PenguinHarness 工作台

[English](README.md)

这里的工作台都按需安装。管理员在插件市场通过 GitHub 渠道安装软件包，项目成员再从插件库把工作台添加到 Agent，即可从应用中心打开。

| 工作台 | 用途 | 原始贡献 |
| --- | --- | --- |
| [考研记忆卡](plugins/kaoyan-flashcards/README.zh.md) | 考研题库、间隔复习与背诵资料 | [PenguinHarness #1586](https://github.com/Prism-Shadow/penguin-harness/pull/1586) |
| [英语学习工作台](plugins/english-workbench/README.zh.md) | 点读、收藏词句、间隔复习和跟读练习 | [PenguinHarness #1587](https://github.com/Prism-Shadow/penguin-harness/pull/1587) |
| [AI 角色对话](plugins/character-chat/README.zh.md) | 与四位原创立绘角色聊天，编辑角色卡和各自的记忆本 | [PenguinHarness #1590](https://github.com/Prism-Shadow/penguin-harness/pull/1590) |
| [拼豆创作工作台](plugins/perler-studio/README.zh.md) | 把图片转为拼豆图纸，编辑色卡，导出或打印 | [PenguinHarness #1586](https://github.com/Prism-Shadow/penguin-harness/pull/1586) |
| [猪猪的摸鱼小世界](plugins/piglet-stickers/README.zh.md) | 布置贴纸场景，挑战主题关卡，保存自己的作品 | [PenguinHarness #1587](https://github.com/Prism-Shadow/penguin-harness/pull/1587) |
| [雪线滑手](plugins/penguin-snowboard/README.zh.md) | 企鹅踩板滑过南极雪脊，腾空翻转并平稳着陆得分 | 原创工作台 |
| [学习框图](plugins/study-map/README.zh.md) | 把代码或文档变成可逐行核对的交互框图 | [Archify](https://github.com/tt-a1i/archify) |
| [全球总决赛主题曲](plugins/worlds-anthems/README.zh.md) | 通过 SoundCloud 播放八首全球总决赛主题曲及官方改编版本 | PenguinHarness 示例任务 |
| [LaTeX 论文写作台](plugins/latex-desk/README.zh.md) | 像 Overleaf 一样管理论文工程，源码旁看 PDF，编译消息归位到行，Agent 改写与审稿意见先看 Diff | 原创工作台 |

原始代码中的提交记录保留了 Yaowei Zheng（hiyouga）及社区贡献者的署名。各包保留原有许可证、致谢、包名和工作台标识。角色对话依赖宿主的[应用数据目录](https://github.com/Prism-Shadow/penguin-harness/pull/1579)与[禁用工具的会话](https://github.com/Prism-Shadow/penguin-harness/pull/1588)，旧角色卡和记忆本的迁移方式见其说明。

[街机游戏](arcade/README.md)收录了三款可选工作台：[运输船](plugins/harbor-pulse/README.zh.md)、[极光漂移 3D](plugins/aurora-drift/README.zh.md)和[鹈鹕骑行](plugins/pelican-post/README.zh.md)。

[口袋街机厅](plugins/pocket-arcade/README.zh.md)收录十款原创键盘与触屏小游戏，每款均可离线打开。

[企鹅午夜节拍](plugins/midnight-rhythm/README.zh.md)是一款原创双轨音乐游戏，支持键盘和触屏。

[从 GitHub Releases 下载工作台安装包](https://github.com/Prism-Shadow/penguin-harness-apps/releases)。

## Agent 内容与工作台

[PenguinHarness 原始源码](https://github.com/Prism-Shadow/penguin-harness/tree/e56648fb99d9ab622981e3cab04272fed4c1cb5c/plugins)保留贡献记录，各包沿用原名、Apache-2.0 许可、工作台与技能标识。

- A2UI 交互式回答、外部插件移植与 Firecrawl 搜索为默认 Agent 提供技能。
- Humanizer 与 Claude Code 提供随选写作与编码技能，持续学习提供停止钩子。
- 会议行动项、每日抽签、冰箱管家、聚会猜词、阅读书桌与桌游台提供随选工作台，阅读书桌另附书库技能。

## 打包

使用 Node 24，运行 `npm ci`、`npm run build:desks`、`npm test` 和 `npm run typecheck`。每个插件的接口表与该插件分发的内容位于 `plugins/<插件标识>/`。运行 `npm run pack:plugins -- --out /tmp/penguin-apps <插件标识>` 可生成可供本机安装的压缩包；省略插件标识则打包全部工作台。命令会输出文件位置和每个包的 SHA-512 摘要。

## 发布

各插件保留自己的版本号。同一次 GitHub 预发布收录 `main` 上同一份已验证代码的全部插件，以 `v2026.11.23-rc.1` 这样的标签标识。当天再次发布时递增 RC 序号。先在 [CHANGELOG.md](CHANGELOG.md) 写下同名版本节，待源码与说明合并、验证通过后，再为该提交打标签。

[发布工作流](.github/workflows/release.yml)运行检查、重建街机游戏，并为每个插件打包两次。每份发布都附上 `<插件标识>-<插件版本>.tgz` 和 `packages.json`；清单记录包名、版本、文件名与 SHA-512 摘要。工作流核对既有发布，确保同一包版本的内容一致。重试发布时会校验已上传的附件，再向草稿补发缺失文件。

将附件的下载地址与摘要登记到[官方插件目录](https://github.com/Prism-Shadow/penguin-harness-plugins)，即可从插件市场的 GitHub 渠道按需安装。npm 发布和 GitHub 稳定版另行管理。
