with open('src/components/sections/CadeiraSuspensa.astro','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    '    <HeroCurveSlider\n      slides={[\n        { src: \'/assets/cadeira-suspensa/001.webp\', alt: \'Cadeira Suspensa 1 - vista 1\' },',
    '    <div class="h-[280px] w-full">\n    <HeroCurveSlider\n      slides={[\n        { src: \'/assets/cadeira-suspensa/001.webp\', alt: \'Cadeira Suspensa 1 - vista 1\' },')
content = content.replace(
    '      idPrefix="cs1"\n    />\n    <h3 class="font-display text-xl font-bold mb-2 text-ink">Cadeira Suspensa 1</h3>',
    '      idPrefix="cs1"\n    />\n    </div>\n    <h3 class="font-display text-xl font-bold mb-2 text-ink">Cadeira Suspensa 1</h3>')
with open('src/components/sections/CadeiraSuspensa.astro','w',encoding='utf-8') as f:
    f.write(content)
print('wrapper rebuilt')
