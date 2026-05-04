import json
import re

def extract_vocab():
    path = "/Users/dillonchristano/Documents/Antigravity/hsk-learning-app/data.js"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r"const ALL_LESSONS = (\{.*?\});", content, re.DOTALL)
    if not match:
        print("Could not find ALL_LESSONS")
        return

    # Extract the object manually to handle nesting
    text = content
    start = match.start(1)
    count = 0
    all_lessons_str = ""
    for i in range(start, len(text)):
        if text[i] == '{': count += 1
        elif text[i] == '}': count -= 1
        if count == 0:
            all_lessons_str = text[start:i+1]
            break
    
    all_lessons = json.loads(all_lessons_str)
    
    vocab = {} # hanzi -> {pinyin, english, lessons: []}
    
    for lid, lesson in all_lessons.items():
        for ex in lesson.get('exercises', []):
            if ex['type'] == 'matching':
                for p in ex['pairs']:
                    h = p['hanzi']
                    if h not in vocab: vocab[h] = {'pinyin': p['pinyin'], 'english': p['english'], 'lessons': []}
                    if lid not in vocab[h]['lessons']: vocab[h]['lessons'].append(lid)
            elif ex['type'] == 'translate' and 'answer' in ex and isinstance(ex['answer'], list) and len(ex['answer']) == 1:
                h = ex['answer'][0]
                if h not in vocab: vocab[h] = {'pinyin': '', 'english': '', 'lessons': []}
                if lid not in vocab[h]['lessons']: vocab[h]['lessons'].append(lid)
            elif ex['type'] == 'fill_blank' and 'answer' in ex and isinstance(ex['answer'], str):
                h = ex['answer']
                if h not in vocab: vocab[h] = {'pinyin': '', 'english': '', 'lessons': []}
                if lid not in vocab[h]['lessons']: vocab[h]['lessons'].append(lid)
    
    print(json.dumps(vocab, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    extract_vocab()
