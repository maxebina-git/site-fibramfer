<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sitePath } from '../lib/sitePath'

const props = defineProps<{ id?: string }>()
const post = ref<any>(null)
const loading = ref(true)
const error = ref('')

async function loadPost() {
  const id = props.id || new URLSearchParams(window.location.search).get('post') || ''
  if (!id) {
    loading.value = false
    error.value = 'Post não encontrado.'
    return
  }

  try {
    if (import.meta.env.PROD) {
      const res = await fetch(sitePath('/api/admin.php?action=list'), { cache: 'no-store' })
      if (!res.ok) throw new Error('blog api')
      const data = await res.json()
      if (Array.isArray(data.posts)) post.value = data.posts.find((p: any) => p.id === id)
    } else {
      const raw = localStorage.getItem('admin_posts')
      if (raw) {
        const arr = JSON.parse(raw)
        post.value = arr.find((p: any) => p.id === id)
      }
    }
  } catch {
    error.value = 'Não foi possível carregar este post.'
  } finally {
    loading.value = false
  }

  if (!post.value && !error.value) {
    error.value = 'Post não encontrado.'
  }
}

onMounted(() => {
  void loadPost()
})
</script>

<template>
  <article v-if="post" class="mx-auto max-w-4xl px-6 py-12">
    <a :href="sitePath('/blog/')" class="font-medium text-primary-500 hover:underline decoration-accent-500 decoration-2 underline-offset-4">← Voltar para o Blog</a>
    <h1 class="font-display text-4xl font-black uppercase leading-tight text-primary-500 mb-4">{{ post.title }}</h1>
    <p class="text-text-secondary mb-6">{{ post.date || '—' }} · {{ post.category || 'Blog' }}</p>
    <img v-if="post.image" :src="sitePath(post.image)" class="w-full h-64 object-cover rounded-lg mb-8" />
    <div v-html="post.content || ''" class="prose text-ink"></div>
  </article>
  <div v-else-if="loading" class="mx-auto max-w-4xl px-6 py-12 text-text-secondary">Carregando post...</div>
  <div v-else class="mx-auto max-w-4xl px-6 py-12 text-text-secondary">{{ error }}</div>
</template>
