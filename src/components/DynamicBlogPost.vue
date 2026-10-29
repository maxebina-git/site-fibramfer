<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ id: string }>()
const post = ref<any>(null)

onMounted(async () => {
  if (import.meta.env.PROD) {
    try {
      const res = await fetch('/api/admin.php?action=list')
      const data = await res.json()
      if (data.posts) post.value = data.posts.find((p: any) => p.id === props.id)
    } catch {}
  }
  if (!post.value) {
    try {
      const raw = localStorage.getItem('admin_posts')
      if (raw) {
        const arr = JSON.parse(raw)
        post.value = arr.find((p: any) => p.id === props.id)
      }
    } catch {}
  }
})
</script>

<template>
  <article v-if="post" class="mx-auto max-w-4xl px-6 py-12">
    <h1 class="font-display text-4xl font-black uppercase leading-tight text-primary-500 mb-4">{{ post.title }}</h1>
    <p class="text-text-secondary mb-6">{{ post.date || '—' }} · {{ post.category || 'Blog' }}</p>
    <img v-if="post.image" :src="post.image" class="w-full h-64 object-cover rounded-lg mb-8" />
    <div v-html="post.content || ''" class="prose text-ink"></div>
  </article>
  <div v-else class="mx-auto max-w-4xl px-6 py-12 text-text-secondary">Post não encontrado.</div>
</template>
