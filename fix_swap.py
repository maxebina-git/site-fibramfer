with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
# Corrige: card 2 deve ser thumbs-up-down (Controle), card 3 wrench (Engenharia)
# Substitui os dois pela ordem correta
content = content.replace(
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"',
    'src="/lordicon/system-outline-3104-thumbs-up-down-hover-pinch.json"')
# Corrige o terceiro que ficou wrong (agora wrench precisa ir para 3, mas já troquei errado)
content = content.replace(
    'src="/lordicon/system-outline-3104-thumbs-up-down-hover-pinch.json"\n          trigger="loop"\n          width="6rem"\n          height="6rem"\n          class="inline-block text-ink rotate-180"',
    'src="/lordicon/system-outline-409-wrench-hover-pinch.json"\n          trigger="loop"\n          width="6rem"\n          height="6rem"\n          class="inline-block text-ink rotate-180"')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('fixed')
