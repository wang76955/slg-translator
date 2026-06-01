import json
import sys
import os

# Allow running without openai installed (will show error message)
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

def translate_batch(texts, source_lang, target_lang, glossary=None, api_key=None, model='gpt-4o-mini'):
    \"\"\"调用 OpenAI API 批量翻译文本\"\"\"
    if not api_key:
        return {'error': 'API key is required'}
    
    if OpenAI is None:
        return {'error': 'openai package not installed. Run: pip install openai'}
    
    client = OpenAI(api_key=api_key)
    
    # 构建系统提示词
    system_prompt = f'你是一个专业的游戏本地化翻译专家。将以下{source_lang}文本翻译成{target_lang}。'
    
    lang_map = {
        'zh': '中文', 'en': 'English', 'ja': '日本語',
        'ko': '한국어', 'fr': 'Français', 'de': 'Deutsch'
    }
    src_name = lang_map.get(source_lang, source_lang)
    tgt_name = lang_map.get(target_lang, target_lang)
    
    system_prompt = f'You are a professional game localization translator. Translate the following {src_name} text to {tgt_name}.'
    
    # 术语表
    if glossary:
        system_prompt += '\n\nIMPORTANT: Maintain consistency for these terms:\n'
        for g in glossary:
            system_prompt += f'- {g["source"]} -> {g["target"]}\n'
    
    system_prompt += '''
Rules:
1. Keep all HTML/XML tags, format strings (%s, {0}, etc.), and special characters unchanged
2. Keep all variable placeholders like {name}, , %d unchanged
3. Ensure proper context for game UI, quests, skills, and items
4. Maintain the original meaning and tone
5. Return ONLY a valid JSON object with keyPath -> translation mappings'''
    
    # 构建消息
    user_content = 'Translate the following text items. Return a JSON object where each key is the keyPath and value is the translation:\n\n'
    user_content += json.dumps({t['keyPath']: t['text'] for t in texts}, ensure_ascii=False)
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content}
            ],
            temperature=0.3,
            response_format={'type': 'json_object'}
        )
        
        result_text = response.choices[0].message.content
        translations = json.loads(result_text)
        
        # 构建返回格式
        result = []
        for t in texts:
            translated = translations.get(t['keyPath'], '')
            result.append({
                'keyPath': t['keyPath'],
                'sourceText': t['text'],
                'translatedText': translated
            })
        
        return {'translations': result}
    
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    # 接收 JSON 输入作为命令行参数
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
        result = translate_batch(
            texts=input_data.get('texts', []),
            source_lang=input_data.get('source_lang', 'zh'),
            target_lang=input_data.get('target_lang', 'en'),
            glossary=input_data.get('glossary', []),
            api_key=input_data.get('api_key', ''),
            model=input_data.get('model', 'gpt-4o-mini')
        )
        print(json.dumps(result, ensure_ascii=False))
    else:
        # 交互模式：从 stdin 读取
        input_data = json.loads(sys.stdin.read())
        result = translate_batch(
            texts=input_data.get('texts', []),
            source_lang=input_data.get('source_lang', 'zh'),
            target_lang=input_data.get('target_lang', 'en'),
            glossary=input_data.get('glossary', []),
            api_key=input_data.get('api_key', ''),
            model=input_data.get('model', 'gpt-4o-mini')
        )
        print(json.dumps(result, ensure_ascii=False))
