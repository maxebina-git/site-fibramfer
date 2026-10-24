for n in ['2','3']:
    with open(f'src/components/CadeiraCurveSlider{n}.astro', 'r', encoding='utf-8') as f:
        content = f.read()
    old = "window.addEventListener('fibramfer:drawer-open', tryInit);\n</script>"
    new = "window.addEventListener('fibramfer:drawer-open', tryInit);\n  setTimeout(tryInit, 500);\n</script>"
    content = content.replace(old, new)
    with open(f'src/components/CadeiraCurveSlider{n}.astro', 'w', encoding='utf-8') as f:
        f.write(content)
    print('slider', n)
