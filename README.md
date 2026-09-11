# Pinscribe (纯离线书签与笔记助手)

**Pinscribe** 是一个现代化、纯离线的 Chrome 浏览器个人书签与笔记管理扩展（Manifest V3），注重隐私、极致速度与离线可用性。

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Manifest](https://img.shields.io/badge/Chrome-Manifest%20V3-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Offline](https://img.shields.io/badge/Storage-100%25%20Offline-emerald.svg)

---

## ✨ 核心特性

- **🔒 100% 纯离线与本地优先**：零网络请求，所有书签、笔记与元数据均保存在本地 `IndexedDB` 中，数据绝对私密，不上传任何第三方服务器。
- **⚡ 快捷收藏弹窗 (Popup)**：
  - 点击插件图标或快捷键 `Ctrl+Shift+L`（Mac: `Cmd+Shift+L`）一键弹出。
  - 自动提取当前活动页面的网址 (URL) 与标题 (Title)。
  - 支持直接编辑标题、摘要描述、**完整 Notes 笔记（支持多行 Markdown / 实时预览）**、标签（带智能频次推荐）。
  - 支持“稍后阅读 (Unread / Read Later)”标记。
  - 自动识别当前页面是否已收藏，若已存在自动回显并切换为“更新/删除”模式。
- **🖥️ 全功能管理面板 (Manager Dashboard)**：
  - 清爽现代的双栏极简布局。
  - **分类过滤**：全部书签、稍后阅读（待读列表）、归档箱。
  - **标签聚合**：按使用频次与字母排序的侧边栏标签云，支持多标签复合筛选。
  - **卡片式列表**：一键展开/折叠查看 Markdown 格式的完整笔记、一键切换已读状态、复制网址、归档、编辑与删除。
- **🔍 毫秒级离线搜索**：
  - 支持普通关键词搜索（同时检索标题、网址、摘要与 Markdown 笔记全文）。
  - 支持高级语法：
    - `#tag`：按标签筛选（如 `#dev #tools`）。
    - `!unread`：仅看稍后阅读内容。
    - `!archived`：搜索归档内容。
    - `site:domain.com`：按域名快速过滤。
  - 快捷键 `/` 快速聚焦搜索栏。
- **📦 导入与导出 (Import & Export)**：
  - **全量 JSON 备份**：完整备份所有书签、Markdown 笔记、标签及时间戳，可随时完整还原。
  - **标准 Netscape HTML 书签**：支持与 Chrome / Firefox / Edge / Safari / Pocket / Raindrop 无缝互导。
  - **智能导入合并**：导入时支持“跳过已有项”或“覆盖更新已有项”。

---

## 🚀 安装与使用指南

### 1. 编译构建
```bash
# 进入项目目录
cd ~/Documents/pinscribe

# 安装依赖
pnpm install

# 编译打包生成 dist 目录
npm run build
```

### 2. 在 Chrome 中加载插件
1. 打开 Chrome 浏览器，在地址栏输入：`chrome://extensions` 并回车；
2. 在右上角开启 **“开发者模式” (Developer mode)** 开关；
3. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**；
4. 选择目录：`/home/qing/Documents/pinscribe/dist`；
5. 插件加载完成！你可以在 Chrome 工具栏中将它固定显示。

### 3. 日常使用
- **收藏网页**：在任意网页点击插件图标（或按 `Ctrl+Shift+L`），输入笔记与标签后按 `Ctrl+Enter` 快速保存。
- **打开管理面板**：在弹窗中点击“管理面板”，或按快捷键 `Ctrl+Shift+O`，即可在新标签页中打开全屏书签中心。

---

## 🛠️ 项目结构

```
pinscribe/
├── public/
│   ├── manifest.json         # 扩展清单文件
│   └── icons/                # 16/48/128 像素图标
├── src/
│   ├── background/
│   │   └── index.ts          # Service worker 后台进程
│   ├── popup/
│   │   ├── index.html        # 快捷收藏弹窗页面
│   │   ├── popup.css
│   │   └── popup.ts
│   ├── manager/
│   │   ├── index.html        # 全屏书签与笔记管理面板
│   │   ├── manager.css
│   │   └── manager.ts
│   ├── db/
│   │   ├── schema.ts         # Bookmark, Tag 数据接口
│   │   └── index.ts          # IndexedDB 事务、索引与 CRUD 封装
│   ├── services/
│   │   ├── search.ts         # 语法解析与本地全文搜索
│   │   ├── exporter.ts       # JSON & Netscape HTML 导出引擎
│   │   └── importer.ts       # HTML & JSON 导入解析引擎
│   └── utils/
│       ├── markdown.ts       # Markdown 安全解析
│       └── helpers.ts        # 常用工具函数
├── tests/
│   └── services.test.ts      # 搜索、导入导出单元测试
└── dist/                     # 打包后的 Chrome 扩展产物
```

---

## 🌐 推送到 GitHub

```bash
cd ~/Documents/pinscribe
git remote add origin git@github.com:keepali/pinscribe.git
git branch -M main
git push -u origin main
```
