for n in ['2','3']:
    path = f'src/components/CadeiraCurveSlider{n}.astro'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("const sliderId = 'cs1-", f"const sliderId = 'cs{n}-")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('slider', n, 'ok')
