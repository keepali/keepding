<div align="center">

# Keepding

**极速、纯本地离线的 Chrome 便签卡片流与书签管理助手。**  
*设计灵感源自 Linkding 的极致纯粹，以及 Google Keep 的便签视觉流。*

[English](README.md) | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="public/icons/icon.svg" width="80" height="80" alt="Keepding Logo" />
</p>

[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-18181b.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181b.svg?style=flat-square)](LICENSE)

</div>

---

## 核心特性

- **100% 纯本地与隐私优先**：所有便签、书签、图片与网页文本摘录均存储在浏览器本地的 IndexedDB 中。零网络外发、零数据收集、绝对私密。
- **Keep + Linkding 双重质感卡片流**：
  - Markdown 笔记与文本摘录直接在卡片上优雅排版展现，告别繁琐折叠。
  - 管理面板顶部常驻极简快捷记事栏，随时记录灵感或粘贴网址。
  - 重要卡片支持一键置顶（`📌`）。
- **全方位多模态采集**：
  - **网页链接**：一键收藏网页，或在网页链接上右键选择“收藏此链接”。
  - **文本摘录**：高亮网页选中文字，右键选择“收藏选中文本到笔记”，或打开弹窗（`Cmd+Shift+L`）自动捕获引用。
  - **图片收藏**：在网页任意图片上右键选择“收藏图片到笔记”，自动捕获原图并在卡片顶部画框展示，关联来源出处。
- **完善的国际化支持 (i18n)**：
  - 默认全英文界面，支持一键切换为简体中文（`EN / 中文`）。
  - 右键上下文菜单根据您选择的语言自动同步变更。
- **毫秒级本地搜索与语法过滤**：
  - 实时即时检索笔记全文、网页标题、网址与标签。
  - 语法过滤支持：`#标签`、`!unread`（稍后读）、`!note`（笔记）、`!image`（图片）以及 `site:域名`。
- **无损数据导入与导出**：
  - 全量 JSON 备份（包含所有笔记、图片引用、标签及时间戳）。
  - 标准 Netscape HTML 书签（与 Chrome、Firefox、Safari、Pocket、Raindrop 互通）。

---

## 安装使用

### 加载已解压扩展（开发者模式）

1. 克隆仓库：
   ```bash
   git clone git@github.com:keepali/keepding.git
   cd keepding
   ```

2. 安装依赖并编译：
   ```bash
   pnpm install
   npm run build
   ```

3. 在 Chrome 中加载扩展：
   - 在地址栏输入 `chrome://extensions` 并回车；
   - 开启右上角的 **开发者模式 (Developer mode)**；
   - 点击左上角 **加载已解压的扩展程序 (Load unpacked)**，选择本项目中的 `dist/` 目录。

---

## 常用快捷键

| 快捷键 | 功能 |
| :--- | :--- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | 打开快速收藏与便签弹窗 |
| `Cmd+Shift+O` / `Ctrl+Shift+O` | 打开全屏便签中心 |
| `Cmd+S` / `Ctrl+S` | 快速保存（在弹窗内） |
| `/` 或 `Cmd+K` | 快速聚焦搜索栏（在便签中心内） |
| `Esc` | 关闭弹窗或退出搜索 |

---

## 开发与打包

```bash
# 启动 Vite 热更新监听
npm run dev

# 运行自动化测试
npm test

# 生产环境编译并打包 Chrome Web Store 压缩包
npm run package
```

---

## 开源许可

[MIT](LICENSE) © [keepali](https://github.com/keepali)
