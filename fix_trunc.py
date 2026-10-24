with open('src/components/sections/CadeiraSuspensa.astro','r',encoding='utf-8') as f: lines = f.read().splitlines()
for i,line in enumerate(lines):
    if 'gsap.registerPlugin' in line:
        with open('src/components/sections/CadeiraSuspensa.astro','w',encoding='utf-8') as f:
            f.write("\n".join(lines[:i]))
        print('truncado em', i+1)
        break
