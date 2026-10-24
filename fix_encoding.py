content = r"""---
import { Button } from 'ds-grupo-rkb';
const { class: className = '' } = Astro.props;
---

<section class={`py-20 ${className}`}>
  <div class="text-center mb-12">
    <h2 class="font-display text-3xl font-bold mb-4 text-ink">Cadeira Suspensa</h2>
    <p class="text-text-secondary">Este equipamento atende as normas do ministério do trabalho - NR18 Portaria 13 de 09.07.2002.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    {[1, 2, 3].map((i) => (
      <div class="bg-surface p-6 rounded-lg shadow-card border border-border hover:shadow-elevation-3 transition-shadow">
        <div class="w-full h-48 bg-surface-alt rounded-lg mb-4"></div>
        <h3 class="font-display text-xl font-bold mb-2 text-ink">Cadeira Suspensa {i}</h3>
        <p class="text-text-secondary mb-4">Descrição detalhada do produto, destacando as vantagens técnicas e diferenciais de mercado.</p>
        <Button variant="secondary" size="sm">Ver Detalhes</Button>
      </div>
    ))}
  </div>
</section>
"""
with open('src/components/sections/CadeiraSuspensa.astro', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK')
