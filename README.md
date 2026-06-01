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

## 🖥️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron |
| 前端 | React + Tailwind CSS |
| 翻译引擎 | Node.js (openai SDK) |

## 🚀 快速开始

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
3. **自动定位** — 应用自动使用 exe 所在目录作为游戏安装目录
4. **自动检索** — 在常见目录模式（localization/、data/、Resources/、www/data/ 等）中查找 JSON 文本
5. **自动选中** — 自动将第一个找到的文本目录设为扫描目标，后续流程同方式一

## 📁 项目结构

```
slg-translator/
├── core/                    # 平台无关核心引擎（可复用于未来 Android 版）
│   ├── types.ts             #   共享类型定义
│   ├── scanner.ts           #   JSON 扫描与文本提取
│   ├── translator.ts        #   AI 翻译引擎（OpenAI/DeepSeek）
│   └── providers.ts         #   AI 提供商配置
├── electron/                # Electron 主进程
│   ├── main.ts              #   窗口管理与启动日志
│   ├── ipc-handlers.ts      #   IPC 处理器（目录/快捷方式/扫描/翻译）
│   └── shortcut.ts          #   .lnk 快捷方式解析（PowerShell COM）
├── src/                     # React 前端
│   ├── App.tsx              #   单页面应用（含游戏程序选择 UI）
│   └── main.tsx             #   入口
├── preload.cjs              # preload 脚本（CJS 格式）
├── vite.config.ts           # Vite + Electron 构建配置
└── package.json
```

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

