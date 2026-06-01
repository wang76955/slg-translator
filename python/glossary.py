import json

def build_glossary_prompt(entries):
    \"\"\"根据术语表构建 system prompt 片段\"\"\"
    if not entries:
        return ''
    
    prompt = '以下是需要保持一致的术语翻译对照表，请严格遵守：\\n\\n'
    prompt += '| 原文 | 译文 |\\n'
    prompt += '|------|------|\\n'
    for entry in entries:
        prompt += f'| {entry[\"source\"]} | {entry[\"target\"]} |\\n'
    prompt += '\\n请确保这些术语在翻译中保持一致。\\n'
    return prompt

def load_glossary(file_path):
    \"\"\"从 JSON 文件加载术语表\"\"\"
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)
