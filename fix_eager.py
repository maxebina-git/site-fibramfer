for n in ['1','2','3']:
    with open(f'src/components/CadeiraCurveSlider{n}.astro','r',encoding='utf-8') as f: content = f.read()
    content = content.replace('<img src=', '<img loading="eager" decoding="async" src=')
    with open(f'src/components/CadeiraCurveSlider{n}.astro','w',encoding='utf-8') as f: f.write(content)
    print('slider', n)
