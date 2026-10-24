import re
# 2
with open('src/components/CadeiraCurveSlider2.astro','r',encoding='utf-8') as f: c=f.read()
c=c.replace("const sliderId = 'cs1-", "const sliderId = 'cs2-")
c=c.replace("001.webp","004.webp").replace("002.webp","005.webp").replace("003.webp","006.webp")
c=c.replace("Cadeira Suspensa 1","Cadeira Suspensa 4").replace("Cadeira Suspensa 2","Cadeira Suspensa 5").replace("Cadeira Suspensa 3","Cadeira Suspensa 6")
with open('src/components/CadeiraCurveSlider2.astro','w',encoding='utf-8') as f: f.write(c)
print('2 ok')
# 3
with open('src/components/CadeiraCurveSlider3.astro','r',encoding='utf-8') as f: c=f.read()
c=c.replace("const sliderId = 'cs1-", "const sliderId = 'cs3-")
c=c.replace("001.webp","007.webp").replace("002.webp","008.webp")
c = re.sub(r"  \{ src: '/assets/cadeira-suspensa/003\.webp', alt: 'Cadeira Suspensa 3' \},\n", '', c)
c=c.replace("Cadeira Suspensa 1","Cadeira Suspensa 7").replace("Cadeira Suspensa 2","Cadeira Suspensa 8")
with open('src/components/CadeiraCurveSlider3.astro','w',encoding='utf-8') as f: f.write(c)
print('3 ok')
