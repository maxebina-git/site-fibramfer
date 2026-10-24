with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    'src="/lordicon/system-outline-1122-thumb-down-hover-pinch.json"\n          trigger="loop"\n          width="6rem"',
    'src="/lordicon/system-outline-1122-thumb-down-hover-pinch.json"\n          trigger="loop"\n          speed="0.3"\n          width="6rem"')
content = content.replace(
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"\n          trigger="loop"\n          width="6rem"',
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"\n          trigger="loop"\n          speed="0.3"\n          width="6rem"')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('speed 0.3 applied to cards 2/3')
