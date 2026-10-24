with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
old = '          class="inline-block text-ink rotate-180"\n        />'
new = '          class="inline-block text-ink group-hover:text-fibra-gold-500 transition-colors rotate-180"\n        />'
content = content.replace(old, new)
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('done')
