<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { sitePath } from '../lib/sitePath'

interface GridPost {
  id: string
  title?: string
  date?: string
  image?: string
}

const props = withDefaults(defineProps<{
  devPosts?: GridPost[]
}>(), {
  devPosts: () => [],
})

const CACHE_KEY = 'fibramfer:blog-posts-cache'
const CACHE_TTL_MS = 5 * 60 * 1000

// null = carregando; array vazio = nada publicado; error = falha na API
const posts = ref<GridPost[] | null>(null)
const error = ref(false)

function readCache(): GridPost[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (cached && typeof cached.at === 'number' && Date.now() - cached.at < CACHE_TTL_MS && Array.isArray(cached.posts)) {
      return cached.posts as GridPost[]
    }
  } catch { /* ignora */ }
  return null
}

function writeCache(list: GridPost[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), posts: list }))
  } catch { /* ignora */ }
}

async function load() {
  if (import.meta.env.DEV) {
    posts.value = props.devPosts
    return
  }
  const cached = readCache()
  if (cached) {
    posts.value = cached
    return
  }
  try {
    const res = await fetch(sitePath('/api/admin.php?action=list'), { cache: 'no-store' })
    if (!res.ok) throw new Error('blog api')
    const data = await res.json()
    const list: GridPost[] = Array.isArray(data?.posts) ? data.posts : []
    writeCache(list)
    posts.value = list
  } catch {
    posts.value = []
    error.value = true
  }
}

onMounted(() => {
  void load()
})

function postHref(id: string): string {
  return sitePath('/blog/?post=' + encodeURIComponent(id))
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
</script>

<template>
  <p v-if="posts === null" class="text-text-secondary text-center col-span-full">Carregando posts...</p>
  <p v-else-if="error" class="text-text-secondary text-center col-span-full">Não foi possível carregar os posts.</p>
  <p v-else-if="posts.length === 0" class="text-text-secondary msg-empty-blog col-span-full text-center">Nenhum post publicado ainda.</p>
  <template v-else>
    <article
      v-for="post in posts"
      :key="post.id"
      class="bg-surface rounded-lg shadow-card border border-border overflow-hidden flex flex-col"
    >
      <img
        v-if="post.image"
        :src="sitePath(post.image)"
        :alt="post.title || ''"
        class="h-48 w-full object-cover bg-surface-alt"
      />
      <div v-else class="h-48 bg-surface-alt"></div>
      <div class="p-6 flex flex-col flex-1">
        <h2 class="font-display text-xl font-bold text-ink mb-2">
          <a
            :href="postHref(post.id)"
            class="hover:underline decoration-accent-500 decoration-2 underline-offset-4"
          >{{ post.title }}</a>
        </h2>
        <time class="text-text-secondary text-sm mt-auto" :datetime="post.date || ''">{{ formatDate(post.date) }}</time>
      </div>
    </article>
  </template>
</template>
