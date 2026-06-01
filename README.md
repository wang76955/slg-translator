# 🎮 SLG 文本翻译工具

> 一键翻译 SLG 游戏文本文件，支持 OpenAI / DeepSeek 等多种 AI 翻译服务

## ✨ 功能

- **📂 选择目录** — 选取游戏文本所在的 JSON 目录
- **🔍 自动扫描** — 递归扫描所有 JSON 文件，自动提取可翻译文本（过滤数字/URL/占位符）
- **🌐 多语言** — 支持中/英/日/韩/法/德互译
- **🤖 多 AI 提供商** — 支持 OpenAI (GPT-4o-mini/4o) 和 DeepSeek (deepseek-chat)
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
- OpenAI API Key 或 DeepSeek API Key

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/wang76955/slg-translator.git
cd slg-translator

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

### 构建安装包

```bash
npm run electron:build
```

## 📖 使用流程

1. **选择目录** — 点击「选择目录」选取 SLG 游戏的 JSON 文本文件夹
2. **扫描文件** — 自动扫描所有 JSON 文件，预览待翻译内容
3. **配置翻译** — 选择源语言/目标语言、AI 提供商（OpenAI/DeepSeek/自定义）、输入 API Key
4. **一键翻译** — 点击「开始翻译」，等待自动完成
5. **导出结果** — 翻译后的文件会输出到 `{原目录名}_{目标语言}` 目录中

## 📁 项目结构

```
slg-translator/
├── core/                    # 平台无关核心引擎（可复用于未来 Android 版）
│   ├── types.ts             #   共享类型定义
│   ├── scanner.ts           #   JSON 扫描与文本提取
│   ├── translator.ts        #   AI 翻译引擎（OpenAI/DeepSeek）
│   └── providers.ts         #   AI 提供商配置
├── electron/                # Electron 桌面端
│   ├── main.ts              #   窗口管理
│   ├── preload.ts           #   IPC 桥接
│   └── ipc-handlers.ts      #   IPC 处理器
├── src/                     # React 前端
│   ├── App.tsx              #   单页面应用
│   └── main.tsx             #   入口
├── test-data/               # 示例测试数据
└── package.json
```

## 🔮 未来计划

- Android 版本（core/ 已设计为平台无关，可直接复用）

## 📜 许可证

MIT
