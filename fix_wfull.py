with open('src/components/sections/CadeiraSuspensa.astro','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace('class="h-[280px]"', 'class="h-[280px] w-full"')
with open('src/components/sections/CadeiraSuspensa.astro','w',encoding='utf-8') as f:
    f.write(content)
print('w-full added')
