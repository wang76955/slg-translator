import type { AiProvider } from '../types'

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini（推荐，性价比高）', supportsJsonMode: true },
      { id: 'gpt-4o', name: 'GPT-4o（质量最高）', supportsJsonMode: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsJsonMode: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo（速度快）', supportsJsonMode: true },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat（推荐，性价比高）', supportsJsonMode: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner（推理模型）', supportsJsonMode: false },
    ],
  },
  {
    id: 'custom',
    name: '自定义 API',
    baseURL: '',
    models: [
      { id: 'custom', name: '自定义模型', supportsJsonMode: true },
    ],
  },
]

export const LANGUAGES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]
