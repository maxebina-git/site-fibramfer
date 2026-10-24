with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
# Troca card 2 para thumb-down; card 3 para wrench rotate-180
content = content.replace(
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"',
    'src="/lordicon/system-outline-1122-thumb-down-hover-pinch.json"', 1)
# O terceiro agora precisa ser wrench com rotate (já está thumb-down no 3, troca para wrench)
content = content.replace(
    'src="/lordicon/system-outline-1122-thumb-down-hover-pinch.json"\n          trigger="loop"\n          width="6rem"\n          height="6rem"\n          class="inline-block text-ink rotate-180"',
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"\n          trigger="loop"\n          width="6rem"\n          height="6rem"\n          class="inline-block text-ink rotate-180"')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('swapped')
