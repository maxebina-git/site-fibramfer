with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    lines = f.read().splitlines()
# Card 2 (Controle de Qualidade) is around line 101 src -> should be thumbs-up-down
# Card 3 (Engenharia) is around line 115 src -> should be wrench with rotate-180
for i, line in enumerate(lines):
    if i == 101 and '409-wrench' in line:
        lines[i] = line.replace('409-wrench', '3104-thumbs-up-down')
    if i == 115 and '1122-thumb-down' in line:
        lines[i] = line.replace('1122-thumb-down', '409-wrench')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('fixed by index')
