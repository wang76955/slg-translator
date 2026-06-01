# 🎮 SLG 文本翻译工具

SLG（策略类游戏）文本本地化桌面工具。支持多语言翻译、术语管理、批量处理，保持 JSON 结构完整性。

## ✨ 功能

- **项目化管理** — 创建翻译项目，关联游戏文本目录，自动扫描所有 JSON 文件
- **智能 JSON 解析** — 递归提取字符串，自动过滤数字/URL/占位符，展示 Key → 原文对照
- **AI 翻译** — 基于 OpenAI API（GPT-4o-mini / GPT-4o），支持中 ↔ 英/日/韩/法/德等多语种
- **术语管理** — 维护角色名/技能名/物品名等术语表，翻译时自动匹配确保一致性
- **翻译编辑器** — 左右对照视图，逐条编辑，搜索筛选，翻译进度条
- **批量操作** — 一键批量 AI 翻译，增量翻译（只翻新增/变更内容）
- **导出** — 保持原始 JSON 结构，支持 JSON / Excel 导出

## 🖥️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron |
| 前端 | React + TypeScript + Tailwind CSS |
| 状态管理 | Zustand |
| 翻译引擎 | Python（OpenAI API） |
| 存储 | SQLite（better-sqlite3） |

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- Python >= 3.8
- OpenAI API Key

### 安装与运行

`ash
# 克隆仓库
git clone https://github.com/wang76955/slg-translator.git
cd slg-translator

# 安装 Node 依赖
npm install

# 安装 Python 依赖
pip install openai

# 开发模式启动
npm run dev
`

### 构建安装包

`ash
npm run electron:build
`

Windows 生成 elease/SLG-Translator-x.x.x-x64.exe
macOS 生成 elease/SLG-Translator-x.x.x-x64.dmg

## 📖 使用流程

1. **新建项目** — 填写项目名称，选择游戏 JSON 文件目录
2. **设置 API Key** — 在「设置」选项卡填入 OpenAI API Key
3. **选择文件** — 左侧文件树点击 JSON 文件，加载可翻译文本
4. **管理术语** — 在「术语表」中添加角色名/技能名等固定译法
5. **AI 翻译** — 点击「AI 批量翻译」，等待处理完成
6. **校对编辑** — 点击译文区域可逐条手动修改
7. **导出** — 保持原始结构导出翻译后的 JSON

## 📁 项目结构

`
slg-translator/
├── electron/              # Electron 主进程
│   ├── main.ts            # 窗口管理
│   ├── preload.ts         # IPC 桥接
│   ├── database.ts        # SQLite 数据库
│   └── ipc-handlers.ts    # IPC 处理器（20+ API）
├── src/                   # React 前端
│   ├── pages/             # 页面组件
│   ├── components/        # UI 组件
│   ├── stores/            # Zustand 状态
│   └── types/             # TypeScript 类型
├── python/                # 翻译引擎
│   ├── translator.py      # OpenAI API 调用
│   ├── json_parser.py     # JSON 解析
│   └── glossary.py        # 术语表处理
├── test-data/             # 示例测试数据
└── package.json
`

## 📜 许可证

MIT
