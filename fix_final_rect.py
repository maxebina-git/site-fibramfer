with open('src/components/HeroCurveSlider.astro','r',encoding='utf-8') as f:
    content = f.read()
# Aspect retangular menor que 1218 (ex: 1179/700 -> mais largo que alto)
content = content.replace('aspect-[1179/1218]', 'aspect-[1179/700]')
# ViewBox proporcional para máscara acompanhar
content = content.replace('const VIEW_H = 1218;', 'const VIEW_H = 700;')
with open('src/components/HeroCurveSlider.astro','w',encoding='utf-8') as f:
    f.write(content)
print('slider retangular + mask 700')
