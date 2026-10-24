with open('src/components/HeroCurveSlider.astro','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace('class="relative mx-auto w-full max-w-[393px] overflow-hidden bg-deep rounded-lg shadow-card border', 'class="relative mx-auto aspect-[1179/1218] w-full max-w-[393px] overflow-hidden bg-deep rounded-lg shadow-card border')
content = content.replace('const VIEW_H = 913;', 'const VIEW_H = 1218;')
content = content.replace('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMid slice"\n              width="100%"\n              height="100%"')
with open('src/components/HeroCurveSlider.astro','w',encoding='utf-8') as f:
    f.write(content)
print('slider fixed')
