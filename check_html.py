with open('dist/cadeira-suspensa/index.html','r',encoding='utf-8',errors='ignore') as f: content = f.read()
print('sliders:', content.count('data-hero-curve-slider'))
for s in ['cs1-','cs2-','cs3-']:
    print(s, 'count:', content.count(s))
print('tryInit:', 'tryInit' in content)
