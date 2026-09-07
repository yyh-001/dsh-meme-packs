# dsh-meme 图库仓库

这里集中发布可供 [dsh-meme](https://github.com/yyh-001/dsh-meme) 导入的表情包图库。

图库以 GitHub Release 附件形式保存，不把大量图片写入 Git 历史。下载 ZIP 后无需解压，直接在 dsh-meme 设置页选择“导入图库”即可。

## 直接下载

| 图库 | 版本 | 数量 | 许可 | 下载 |
| --- | --- | ---: | --- | --- |
| 官方表情包1号 | 1.0.0 | 92 张 | CC-BY-NC-SA-4.0 | [下载 ZIP](https://github.com/yyh-001/dsh-meme-packs/releases/download/official-001-v1.0.0/official-001-v1.0.0.zip) |
| 大肥鱼 | 1.2.0 | 49 张 | personal | [下载 ZIP](https://github.com/yyh-001/dsh-meme-packs/releases/download/dafeiyu-001-v1.2.0/dafeiyu-001-v1.2.0.zip) |

## 导入方法

1. 下载所需图库的 ZIP 文件，不要解压。
2. 打开 DSH 的 dsh-meme 设置页。
3. 点击“导入图库”，选择刚下载的 ZIP。
4. 导入完成后会自动切换到新图库。

## 机器可读目录

[`catalog.json`](./catalog.json) 提供版本、下载地址、文件大小和 SHA-256，可供 dsh-meme 图库市场或其他客户端读取。

## 投稿图库

点击仓库的 Issues，选择“投稿图库”。请上传由 dsh-meme 导出的 ZIP，并说明图库来源与许可。审核通过后会作为 Release 发布。

每套图库的许可独立记录，详情见 [`LICENSES.md`](./LICENSES.md) 和 ZIP 内的 `manifest.json`。

