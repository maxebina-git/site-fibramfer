with open('src/components/sections/FibramferHistoria.astro','r',encoding='utf-8') as f:
    content = f.read()
# Remove current-color prop and revert class to original for each LordIcon
content = content.replace('          current-color\n          class="inline-block text-ink group-hover:text-fibra-gold-500 transition-colors"', '          class="inline-block text-ink"')
content = content.replace('          current-color\n          class="inline-block text-ink group-hover:text-fibra-gold-500 transition-colors rotate-180"', '          class="inline-block text-ink rotate-180"')
with open('src/components/sections/FibramferHistoria.astro','w',encoding='utf-8') as f:
    f.write(content)
print('reverted')
