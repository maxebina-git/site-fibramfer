<script setup lang="ts">
import { ref } from 'vue'
import { AccordionGroup, AccordionItem, Button } from 'ds-grupo-rkb'

type SupportTab = 'documents' | 'faq'

const activeTab = ref<SupportTab>('documents')

const documents = [
  'Certificado de Aprovação (CA)',
  'Manual de instruções e uso',
  'Ficha técnica do equipamento',
  'Relatório de ensaios e testes',
  'Termo de garantia',
]
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4 md:p-8">
    <div class="mb-8 flex flex-col gap-2 border-b border-border sm:flex-row" role="tablist" aria-label="Documentação e dúvidas">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'documents'"
        class="border-b-2 px-4 py-3 text-left font-body text-sm font-semibold transition-colors duration-200"
        :class="activeTab === 'documents' ? 'border-accent-500 text-primary-500' : 'border-transparent text-text-secondary hover:text-ink'"
        @click="activeTab = 'documents'"
      >
        Documentos Disponíveis
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'faq'"
        class="border-b-2 px-4 py-3 text-left font-body text-sm font-semibold transition-colors duration-200"
        :class="activeTab === 'faq' ? 'border-accent-500 text-primary-500' : 'border-transparent text-text-secondary hover:text-ink'"
        @click="activeTab = 'faq'"
      >
        Dúvidas Frequentes
      </button>
    </div>

    <div v-if="activeTab === 'documents'" role="tabpanel" class="space-y-4">
      <ul class="divide-y divide-border">
        <li v-for="document in documents" :key="document" class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-500 text-sm font-bold text-ink" aria-hidden="true">✓</span>
            <span class="font-body text-base text-ink">{{ document }}</span>
          </div>
          <Button variant="secondary" size="sm" as="a" href="/contato/">Solicitar</Button>
        </li>
      </ul>
    </div>

    <div v-else role="tabpanel">
      <AccordionGroup :default-index="null" :collapsible="true">
        <AccordionItem title="Como verificar se o CA do produto é válido?" item-id="security-ca">
          O número do CA está gravado no próprio equipamento e pode ser consultado no site do Ministério do Trabalho.
        </AccordionItem>
        <AccordionItem title="Qual a validade do Certificado de Aprovação?" item-id="security-validity">
          O CA tem validade de 5 anos, sendo renovado após novos testes. Todos os produtos Fibramfer possuem CA vigente.
        </AccordionItem>
        <AccordionItem title="A Fibramfer fornece treinamento para uso dos equipamentos?" item-id="security-training">
          Oferecemos orientações técnicas detalhadas e manuais completos. Para treinamentos in-company, entre em contato.
        </AccordionItem>
      </AccordionGroup>
    </div>
  </div>
</template>
