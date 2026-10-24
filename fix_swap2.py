with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
# Fix 2nd card back to thumb-down (first occurrence of wrench is card 2 now, but we need card 2 = thumb)
# We'll find the first wrench and replace with thumb-down, keep second wrench for card 3
parts = content.split('src="/lordicon/system-outline-409-wrench-hover-pinch.json"')
if len(parts) == 3:
    content = parts[0] + 'src="/lordicon/system-outline-1122-thumb-down-hover-pinch.json"' + parts[1] + 'src="/lordicon/system-outline-409-wrench-hover-pinch.json"' + parts[2]
    with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
        f.write(content)
    print('fixed: 2=thumb, 3=wrench')
else:
    print('unexpected count:', len(parts))
