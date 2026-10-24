with open('src/components/HeroCurveSlider.astro','r',encoding='utf-8') as f:
    content = f.read()
if '<img' in content:
    content = content.replace('<img', '<img class="w-full h-full object-cover"')
    with open('src/components/HeroCurveSlider.astro','w',encoding='utf-8') as f:
        f.write(content)
    print('object-cover added to img')
else:
    print('no direct img tag; checking for <img inside loop')
    # Try to add class to existing img via regex-like split
    # If no img, we may need to add object-cover to container or to the image source rendering
