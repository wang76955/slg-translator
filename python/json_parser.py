import json
import sys
import re

def extract_texts(obj, prefix=''):
    \"\"\"递归提取 JSON 中所有字符串值\"\"\"
    texts = []
    if isinstance(obj, str):
        # 过滤纯数字、URL、占位符
        if re.match(r'^\d+$', obj):
            return texts
        if re.match(r'^https?://', obj):
            return texts
        if re.match(r'^\{[\w.]+\}$', obj):
            return texts
        if re.match(r'^%[\w.]+%$', obj):
            return texts
        texts.append({
            'keyPath': prefix,
            'text': obj,
            'context': prefix
        })
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            texts.extend(extract_texts(item, f'{prefix}[{i}]'))
    elif isinstance(obj, dict):
        for key, value in obj.items():
            new_prefix = f'{prefix}.{key}' if prefix else key
            texts.extend(extract_texts(value, new_prefix))
    return texts

def apply_translations(obj, translations, prefix=''):
    \"\"\"将翻译结果应用到原始 JSON 结构\"\"\"
    if isinstance(obj, str):
        trans = translations.get(prefix)
        return trans if trans else obj
    elif isinstance(obj, list):
        return [apply_translations(item, translations, f'{prefix}[{i}]') for i, item in enumerate(obj)]
    elif isinstance(obj, dict):
        return {key: apply_translations(value, translations, f'{prefix}.{key}' if prefix else key) for key, value in obj.items()}
    return obj

if __name__ == '__main__':
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        texts = extract_texts(data)
        print(json.dumps(texts, ensure_ascii=False))
