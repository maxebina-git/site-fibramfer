with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    lines = f.read().splitlines()
# Card 2 (Controle de Qualidade) -> wrench
lines[101] = lines[101].replace('3104-thumbs-up-down', '409-wrench')
# Card 3 (Engenharia de Precisão) -> thumb-down com rotate
lines[115] = lines[115].replace('409-wrench', '1122-thumb-down').replace('class="inline-block text-ink"', 'class="inline-block text-ink rotate-180"')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write('\n'.join(lines)+'\n')
print('done')
