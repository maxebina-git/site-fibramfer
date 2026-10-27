<script setup lang="ts">
import { onMounted } from 'vue';

const partners = [
  { name: 'AMC PROTESTE DISTRIBUIDORA BRASIL LTDA', tel: 'tel AMC' },
  { name: 'CASA DAS CORDAS LTDA', tel: 'tel CASA' },
  { name: 'ECOHABITAT COMERCIO E REPRESENTACOES LTDA', tel: 'tel ECOHABITAT' },
  { name: 'EDSEG - EQUIPAMENTOS DE PROTECAO LTDA', tel: 'tel EDSEG' },
  { name: 'EQUIVALE - EQUIPAMENTOS DE PROTECAO LTDA', tel: 'tel EQUIVALE' },
  { name: 'JACKSON ALEXANDRE MARIA ME', tel: 'tel JACKSON' },
  { name: 'LITORAL COMERCIO DE EPI LTDA', tel: 'tel LITORAL' },
  { name: 'LMF UNIFORMES E EPIS LTDA', tel: 'tel LMF' },
  { name: 'MARCOS PEREIRA DE SOUSA', tel: 'tel MARCOS' },
  { name: 'NICOVER BRASIL COMERCIO E REPRESENTACOES LTDA', tel: 'tel NICOVER' },
  { name: 'OCL COMERCIO E IMPORTACAO LTDA', tel: 'tel OCL' },
  { name: 'PRATICIBOR - COMERCIO DE PLASTICOS E BORRACHAS LTDA', tel: 'tel PRATICIBOR' },
  { name: 'STILO BORRACHAS E PLASTICOS LTDA', tel: 'tel STILO' },
  { name: 'SUPER MIX COMERCIO E ARTIGOS DE USO PESSOAL LTDA', tel: 'tel SUPER' },
  { name: 'TH SAFE EQUIPAMENTOS DE SEGURANCA LTDA', tel: 'tel TH' },
];

function shuffle(arr: typeof partners) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

onMounted(() => {
  console.log('PartnerTable montado');
  shuffle(partners);
});
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-border shadow-card">
    <table class="w-full text-left border-collapse">
      <thead class="bg-surface-alt">
        <tr>
          <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink">Parceria</th>
          <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink">Contato</th>
        </tr>
      </thead>
      <tbody id="partners-tbody" class="divide-y divide-border">
        <tr v-for="p in partners" :key="p.name" class="bg-surface hover:bg-surface-alt transition-colors">
          <td class="px-6 py-3 font-body text-base font-medium text-ink">{{ p.name }}</td>
          <td class="px-6 py-3 font-body text-base text-text-secondary">{{ p.tel }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
