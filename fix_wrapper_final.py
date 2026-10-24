with open('src/components/sections/CadeiraSuspensa.astro','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace('class="h-[280px] overflow-hidden"', 'class="h-[280px]"')
with open('src/components/sections/CadeiraSuspensa.astro','w',encoding='utf-8') as f:
    f.write(content)
print('wrapper fixed')
