with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    lines = f.read().splitlines()
new = [
    '        <LordIcon',
    '          src="/lordicon/system-outline-3235-badge-ribbon-hover-pinch.json"',
    '          trigger="loop"',
    '          class="w-8 h-8 inline-block text-ink"',
    '        />'
]
for i, line in enumerate(lines):
    if 'text-2xl' in line and '<span' in line:
        lines[i:i+1] = new
        break
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('replaced at', i+1)
