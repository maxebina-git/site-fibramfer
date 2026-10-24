with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
# Apply delay-75 to VISÃO parent and delay-150 to VALORES parent by replacing specific patterns
content = content.replace(
    'hover:shadow-elevation-3 transition-all duration-300">\n        <div class="flex items-center gap-3 mb-2">\n          <h3 class="font-display text-xl font-bold mb-2 text-ink">VALORES',
    'hover:shadow-elevation-3 transition-all duration-300 delay-150">\n        <div class="flex items-center gap-3 mb-2">\n          <h3 class="font-display text-xl font-bold mb-2 text-ink">VALORES'
)
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('done')
