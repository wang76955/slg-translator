# 🎮 SLG 文本翻译工具

> 一键翻译 SLG 游戏文本文件，支持 OpenAI / DeepSeek 等多种 AI 翻译服务

## ✨ 功能

- **📂 选择目录** — 手动选取游戏文本所在的 JSON 目录
- **🔗 导入快捷方式** — 直接选择游戏的 `.exe` 主程序，自动定位安装目录并检索文本文件
- **🔍 自动扫描** — 递归扫描所有 JSON 文件，自动提取可翻译文本（过滤数字/URL/占位符）
- **🌐 多语言** — 支持中/英/日/韩/法/德互译
- **🤖 多 AI 提供商** — 支持 OpenAI (GPT-4o-mini/4o) 和 DeepSeek (deepseek-chat) 及自定义 API
- **⚡ 一键翻译** — 批量调用 AI 翻译，保持 JSON 结构完整导出
- **📁 保持结构** — 输出目录保持与源目录完全相同的文件结构

## 🎯 适用范围

### ✅ 适合的游戏类型

本工具适用于**以 JSON 文件存储文本**的游戏，常见于：

- **Ren'Py 引擎游戏** — 文本通常位于 `game/tl/` 或 `game/*.rpy` 旁的同名 JSON
- **RPG Maker MV / MZ** — 文本位于 `www/data/*.json`（如 `CommonEvents.json`、`Actors.json` 等）
- **使用 Unity + JSON 本地化的游戏** — 部分 Unity 游戏将文本放在 `StreamingAssets/` 或 `localization/` 下的 JSON 中
- **支持 Mod 的 Steam 游戏** — 文本常暴露在 `localization/`、`locales/`、`lang/` 等目录的 JSON 中
- **自研引擎 + JSON 配置的游戏** — 许多国产 SLG 使用 JSON 作为配置文件

### ❌ 不适合的游戏类型

以下类型游戏**无法直接使用**本工具：

| 类型 | 原因 | 推荐方案 |
|------|------|----------|
| Unity IL2CPP（二进制资源） | 文本嵌入在 resources.assets 等二进制包中 | 先用 AssetStudio 提取，再转换格式 |
| Unreal Engine | 文本在 .locres 或 Pak 包中 | 使用 UE 本地化工具 |
| Cocos2D / 自研引擎（加密资源） | 文本加密或打包在自定义格式中 | 需逆向分析 |
| 视频 / 图片形式文本 | 非文本格式 | 无法处理 |

### 🔍 如何快速判断？

查看游戏目录下是否有 JSON 文件：

```bash
# 在游戏根目录下运行
dir *.json /s
```

如果输出大量 JSON 且内容包含中文或英文对话文本，则大概率可用本工具。


## 🖥️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron |
| 前端 | React + Tailwind CSS |
| 翻译引擎 | Node.js (openai SDK) |

## 🚀 快速开始
### 直接下载（推荐）

> 不需要安装任何开发环境，下载即用

前往 [Releases 页面](https://github.com/wang76955/slg-translator/releases) 下载最新版本的 SLG-Translator-v2.0-win32-x64.zip，
解压后运行 SLG-Translator.exe 即可。

### 从源码构建


### 前置要求

- Node.js >= 18
- Windows 7+（选择游戏程序功能仅限 Windows）
- OpenAI API Key 或 DeepSeek API Key

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/wang76955/slg-translator.git
cd slg-translator

# 安装依赖
npm install

# 开发模式启动（热重载）
npm run dev
```

### 构建可分发版本

```bash
# 构建前端 + 主进程
npm run build

# 打包为 Windows 独立 exe（输出到 release/ 目录）
npm run pack
```

打包完成后，运行 `release/SLG-Translator-win32-x64/SLG-Translator.exe` 即可使用。
也可创建桌面快捷方式指向该 exe，方便日常使用。

## 📖 使用流程

### 方式一：选择目录（传统方式）

1. **选择目录** — 点击「📁 选择游戏目录」选取 SLG 游戏的 JSON 文本文件夹
2. **扫描文件** — 点击「🔍 扫描文本文件」，预览待翻译内容
3. **配置翻译** — 选择源语言/目标语言、AI 提供商（OpenAI/DeepSeek/自定义）、输入 API Key
4. **一键翻译** — 点击「开始翻译」，等待自动完成
5. **导出结果** — 翻译后的文件会输出到 `{原目录名}_{目标语言}` 目录中

### 方式二：选择游戏程序（推荐）

> 适合不知道游戏文本文件在哪的用户，直接选游戏启动 exe 即可

1. **选择游戏程序** — 点击「🎯 选择游戏程序」
2. **选择 .exe 文件** — 在弹出的文件选择器中选取游戏主程序（如 SomeGame.exe）
3. **自动定位** — 应用自动取 exe 所在目录作为游戏安装目录
4. **自动检索** — 在常见目录模式（localization/、data/、Resources/、www/data/ 等）中查找 JSON 文本
5. **自动选中** — 自动将第一个找到的文本目录设为扫描目标，后续流程同方式一

## 📁 项目结构

```
slg-translator/
├── src/                     # React 前端
│   ├── components/           #   UI 组件
│   │   └── Section.tsx       #   卡片容器组件
│   ├── constants/            #   常量配置
│   │   └── index.ts          #   AI 提供商 + 语言列表
│   ├── types/                #   类型定义
│   │   ├── index.ts          #   共享类型
│   │   └── electron.d.ts     #   electronAPI 声明
│   ├── App.tsx               #   主页面
│   ├── index.css
│   └── main.tsx              #   入口
├── electron/                 # Electron 主进程
│   ├── main.ts               #   窗口管理与启动日志
│   ├── ipc-handlers.ts       #   IPC 处理器
│   ├── shortcut.ts           #   游戏目录文本检索
│   └── preload.cjs           #   preload 脚本（CJS）
├── core/                     # 平台无关核心引擎
│   ├── types.ts
│   ├── scanner.ts
│   ├── translator.ts
│   └── providers.ts
├── index.html
├── vite.config.ts
├── package.json
└── README.md
`


## ⚠️ 注意事项

- **选择游戏程序仅支持 Windows**：依赖 `WScript.Shell` COM 对象和 PowerShell，均为 Windows 自带组件
- **PowerShell 无需额外安装**：Windows 7+ 均自带
- **API Key 仅保存在本机**：不会上传或泄露
- **打包后首次使用**：双击 `release/SLG-Translator-win32-x64/SLG-Translator.exe` 即可

## 🔮 未来计划

- Android 版本（core/ 已设计为平台无关，可直接复用）
- 术语表管理（glossary 功能已在翻译引擎中预留）

## 📜 许可证

MIT

