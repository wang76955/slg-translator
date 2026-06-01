# 🎮 SLG Text Translator

> One-click translation for SLG game text files. Supports OpenAI / DeepSeek and other AI translation services.

## ✨ Features

- **📂 Select Directory** — Manually pick the folder containing game JSON files
- **🎯 Pick Game EXE** — Select the game's `.exe` file; automatically locates the install directory and finds text files
- **🔍 Auto Scan** — Recursively scans all JSON files, automatically extracts translatable text (filters out numbers, URLs, placeholders)
- **🌐 Multi-language** — Supports translation between Chinese, English, Japanese, Korean, French, and German
- **🤖 Multiple AI Providers** — Supports OpenAI (GPT-4o-mini/4o), DeepSeek (deepseek-chat), and custom API endpoints
- **⚡ One-click Translation** — Batch AI translation while preserving the original JSON structure
- **📁 Structure Preserved** — Output directory mirrors the source directory structure exactly

## 🎯 Scope

### ✅ Compatible Games

This tool works with games that **store text in JSON files**, commonly found in:

- **Ren'Py Engine** — Text is typically in `game/tl/` or sidecar JSON files alongside `game/*.rpy`
- **RPG Maker MV / MZ** — Text at `www/data/*.json` (e.g., `CommonEvents.json`, `Actors.json`)
- **Unity + JSON Localization** — Some Unity games store text in `StreamingAssets/` or `localization/` as JSON
- **Mod-friendly Steam Games** — Text often exposed in `localization/`, `locales/`, `lang/` directories
- **Custom Engines with JSON Config** — Many indie SLG titles use JSON for configuration and dialogue

### ❌ Incompatible Games

The following game types **cannot be used directly**:

| Type | Reason | Recommended Approach |
|------|--------|---------------------|
| Unity IL2CPP (binary assets) | Text embedded in `resources.assets` bundles | Extract with AssetStudio first, then convert |
| Unreal Engine | Text in `.locres` or `.pak` archives | Use UE localization tools |
| Cocos2D / Encrypted Custom Engines | Text encrypted or packed in proprietary formats | Requires reverse engineering |
| Video / Image-based Text | Not text-based format | Not supported |

### 🔍 Quick Check

Look for JSON files in the game directory:

```bash
# Run in the game root directory
dir *.json /s
```

If you see many JSON files containing dialogue or UI text in Chinese/English, this tool will likely work.

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron |
| Frontend | React + Tailwind CSS |
| Translation Engine | Node.js (OpenAI SDK) |

## 🚀 Quick Start

### Download (Recommended)

> No development environment required. Download and run.

Go to the [Releases page](https://github.com/wang76955/slg-translator/releases) and download the latest `SLG-Translator-v2.0-win32-x64.zip`.
Extract the archive and run `SLG-Translator.exe`.

### Build from Source\n\n#### Prerequisites

- Node.js >= 18
- Windows 7+ (Game EXE picker is Windows-only)
- OpenAI API Key or DeepSeek API Key

### Install & Run

```bash
# Clone the repository
git clone https://github.com/wang76955/slg-translator.git
cd slg-translator

# Install dependencies
npm install

# Start in development mode (Hot Reload)
npm run dev
```

### Build a Distributable Package

```bash
# Build frontend + main process
npm run build

# Package as a standalone Windows exe (output in release/ directory)
npm run pack
```

After packaging, run `release/SLG-Translator-win32-x64/SLG-Translator.exe`.
You can create a desktop shortcut to this exe for daily use.

## 📖 Usage

### Method 1: Select Directory (Traditional)

1. **Select Directory** — Click「📁 选择游戏目录」and pick the folder containing JSON game files
2. **Scan Files** — Click「🔍 扫描文本文件」to preview translatable content
3. **Configure Translation** — Choose source/target language, AI provider (OpenAI/DeepSeek/Custom), and enter your API Key
4. **One-click Translate** — Click「开始翻译」and wait for completion
5. **Export Results** — Translated files are output to `{original_dir_name}_{target_lang}` directory

### Method 2: Pick Game EXE (Recommended)

> Ideal if you don't know where the game's text files are — just pick the game executable.

1. **Pick Game EXE** — Click「🎯 选择游戏程序」
2. **Select .exe File** — Browse and select the game's main executable (e.g., `SomeGame.exe`)
3. **Auto Locate** — The app uses the exe's directory as the game install directory
4. **Auto Search** — Searches common patterns (`localization/`, `data/`, `Resources/`, `www/data/`, etc.) for JSON files
5. **Auto Select** — Automatically selects the first found text directory as the scan target, then proceeds as Method 1

## 📁 Project Structure

```
slg-translator/
├── src/                     # React Frontend
│   ├── components/           #   UI Components
│   │   └── Section.tsx       #   Card container component
│   ├── constants/            #   Constants
│   │   └── index.ts          #   AI providers + language list
│   ├── types/                #   Type definitions
│   │   ├── index.ts          #   Shared types
│   │   └── electron.d.ts     #   electronAPI type declaration
│   ├── App.tsx               #   Main page
│   ├── index.css
│   └── main.tsx              #   Entry point
├── electron/                 # Electron Main Process
│   ├── main.ts               #   Window management & startup log
│   ├── ipc-handlers.ts       #   IPC handlers
│   ├── shortcut.ts           #   Game directory text search
│   └── preload.cjs           #   Preload script (CJS)
├── core/                     # Platform-agnostic Core Engine
│   ├── types.ts
│   ├── scanner.ts
│   ├── translator.ts
│   └── providers.ts
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

## ⚠️ Notes

- **Game EXE Picker is Windows-only** — Uses the system file dialog to select `.exe` files
- **API Key stays on your machine** — Never uploaded or shared
- **First run after packaging** — Double-click `release/SLG-Translator-win32-x64/SLG-Translator.exe`

## 🔮 Future Plans

- Android version (the `core/` module is already platform-agnostic and reusable)
- Glossary management (glossary support is already built into the translation engine)

## 📜 License

MIT

