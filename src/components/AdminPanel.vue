<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Button } from 'ds-grupo-rkb'

interface Post {
  id: string
  title: string
  date: string
  category: string
  image: string | null
  content: string
}

const AUTH_KEY = 'admin_auth'
const POSTS_KEY = 'admin_posts'

const authed = ref(false)
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

const posts = ref<Post[]>([])
const editorRef = ref<HTMLDivElement | null>(null)

const editingId = ref<string | null>(null)

// modal state
const modalOpen = ref(false)
const formTitle = ref('')
const formDate = ref('')
const formCategory = ref('')
const formContent = ref('')
const formImage = ref<File | null>(null)
const formImagePreview = ref<string | null>(null)
const formSlug = ref('')

watch(formTitle, (val) => {
  formSlug.value = val ? val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
})

function loadPosts() {
  if (import.meta.env.PROD) {
    fetch('/api/admin.php?action=list')
      .then((r) => r.json())
      .then((d) => { if (d.posts) posts.value = d.posts })
      .catch(() => { /* fallback localStorage */ });
    return;
  }
  try {
    const raw = localStorage.getItem(POSTS_KEY)
    if (raw) posts.value = JSON.parse(raw)
  } catch {
    posts.value = []
  }
}

function savePosts() {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts.value))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fibramfer:posts-updated', { detail: { count: posts.value.length } }))
  }
  if (import.meta.env.PROD) {
    fetch('/api/admin.php?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: posts.value[posts.value.length - 1] || {} })
    }).catch(() => {})
  }
}

function seedPosts() {
  if (posts.value.length === 0) {
    posts.value = [
      {
        id: 'welcome',
        title: 'Welcome to the Blog',
        date: '2026-09-29',
        category: 'News',
        image: '/uploads/welcome.jpg',
        content: "We're excited to launch the new site-fibramfer blog!",
      },
    ]
    savePosts()
  }
}

onMounted(() => {
  authed.value = localStorage.getItem(AUTH_KEY) === '1'
  loadPosts()
  seedPosts()
  window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
  if (formImagePreview.value && formImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(formImagePreview.value)
  }
})

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalOpen.value) {
    closeModal()
  }
}

function handleLogin() {
  emailError.value = ''
  passwordError.value = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  let valid = true
  if (!emailRegex.test(email.value.trim())) {
    emailError.value = 'E-mail inválido'
    valid = false
  }
  if (password.value.length === 0) {
    passwordError.value = 'Senha obrigatória'
    valid = false
  }
  if (!valid) return

  if (email.value.trim() === 'maxebina@gmail.com' && password.value === '4Bolot@828348') {
    localStorage.setItem(AUTH_KEY, '1')
    authed.value = true
  } else {
    passwordError.value = 'E-mail ou senha inválidos'
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY)
  authed.value = false
  email.value = ''
  password.value = ''
}

function exec(cmd: string, value?: string) {
  if (editorRef.value) editorRef.value.focus()
  document.execCommand(cmd, false, value || '')
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function deletePost(id: string) {
  if (!confirm('Excluir este post?')) return
  posts.value = posts.value.filter((p) => p.id !== id)
  savePosts()
}

function openModal(post?: Post) {
  editingId.value = post ? post.id : null
    if (post) {
      formTitle.value = post.title
      formDate.value = post.date
      formCategory.value = post.category
      formContent.value = post.content
      setTimeout(() => { if (editorRef.value) editorRef.value.innerHTML = post.content || '' }, 0)
      formImagePreview.value = post.image
      formImage.value = null
      formSlug.value = post ? (post.id || slugify(post.title) || '') : ''
    } else {
    formTitle.value = ''
    formDate.value = new Date().toISOString().slice(0, 10)
    formCategory.value = ''
    formContent.value = ''
    formImage.value = null
    formImagePreview.value = null
  }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingId.value = null
  if (formImagePreview.value && formImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(formImagePreview.value)
  }
  formImage.value = null
  formImagePreview.value = null
}

function onImageChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (!file) return
  formImage.value = file
  const reader = new FileReader()
  reader.onload = () => {
    formImagePreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

function savePost() {
  if (!formTitle.value.trim()) return

  const imageValue = formImagePreview.value

  if (editingId.value) {
    const idx = posts.value.findIndex((p) => p.id === editingId.value)
    if (idx !== -1) {
      posts.value[idx] = {
        ...posts.value[idx],
        title: formTitle.value.trim(),
        date: formDate.value,
        category: formCategory.value.trim(),
        image: imageValue,
        content: formContent.value,
      }
    }
  } else {
    const id = formSlug.value || slugify(formTitle.value) || 'post'
    posts.value.unshift({
      id,
      title: formTitle.value.trim(),
      date: formDate.value,
      category: formCategory.value.trim(),
      image: imageValue,
      content: formContent.value,
    })
  }

  savePosts()
  closeModal()
}
</script>

<template>
  <!-- LOGIN VIEW -->
  <div v-if="!authed" class="mx-auto max-w-md">
    <div class="mb-6 text-center">
      <p class="mb-2 font-body text-sm font-semibold uppercase tracking-[0.16em] text-accent-500">Área restrita</p>
      <h1 class="font-display text-4xl font-black uppercase leading-tight text-primary-500 md:text-6xl">Admin</h1>
    </div>
    <div class="rounded-lg border border-border bg-surface p-6 shadow-card md:p-8">
      <h2 class="mb-6 font-display text-2xl font-bold text-ink">Login</h2>
    <form class="flex flex-col gap-5" @submit.prevent="handleLogin">
      <div class="flex flex-col gap-1.5">
        <label for="admin-email" class="text-sm font-medium text-ink">E-mail</label>
        <input
          id="admin-email"
          v-model="email"
          type="email"
          placeholder="seu@email.com.br"
          class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        />
        <p v-if="emailError" class="text-sm text-error-500">{{ emailError }}</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="admin-password" class="text-sm font-medium text-ink">Senha</label>
        <input
          id="admin-password"
          v-model="password"
          type="password"
          placeholder="••••••"
          class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        />
        <p v-if="passwordError" class="text-sm text-error-500">{{ passwordError }}</p>
      </div>

      <Button id="admin-submit-cta" variant="primary" size="lg" type="submit" fullWidth>
        Entrar
      </Button>
    </form>
  </div>
  </div>

  <!-- ADMIN VIEW -->
  <div v-else class="mx-auto max-w-7xl px-4 md:px-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="font-display text-3xl font-black uppercase leading-tight text-primary-500 md:text-4xl">Administrar Blog</h1>
      <div class="flex items-center gap-3">
        <Button variant="primary" size="sm" @click="openModal()">+ Novo post</Button>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-border shadow-card">
      <table class="w-full text-left border-collapse">
        <thead class="bg-surface-alt">
          <tr>
            <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink">Título</th>
            <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink">Data</th>
            <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink">Categoria</th>
            <th class="font-display text-sm font-bold uppercase tracking-wide px-6 py-3 text-ink text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="post in posts" :key="post.id" class="bg-surface hover:bg-surface-alt transition-colors">
            <td class="px-6 py-3 font-body text-base font-medium text-ink">{{ post.title }}</td>
            <td class="px-6 py-3 font-body text-base text-text-secondary">{{ formatDate(post.date) }}</td>
            <td class="px-6 py-3 font-body text-base text-text-secondary">{{ post.category || '—' }}</td>
            <td class="px-6 py-3 font-body text-base text-right">
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="rounded-md bg-surface-alt px-2 py-1 text-sm font-medium text-primary-500 hover:bg-surface cursor-pointer" @click="openModal(post)">Editar</button>
                <button type="button" class="rounded-md bg-surface-alt px-2 py-1 text-sm font-medium text-error-500 hover:bg-surface cursor-pointer" @click="deletePost(post.id)">Excluir</button>
              </div>
            </td>
          </tr>
          <tr v-if="posts.length === 0">
            <td colspan="4" class="px-6 py-8 text-center text-text-secondary">Nenhum post cadastrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <button type="button" class="text-sm font-medium text-text-secondary hover:text-ink cursor-pointer" @click="logout">Sair p/ login</button>
    </div>
  </div>

  <!-- MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
      >
      <div class="w-full max-w-2xl rounded-lg border border-border bg-surface p-6 shadow-card md:p-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-2xl font-bold text-ink">{{ editingId ? 'Editar post' : 'Novo post' }}</h2>
          <button
            type="button"
            aria-label="Fechar"
            class="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-surface-alt hover:text-ink"
            @click="closeModal"
          >
            ✕
          </button>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="savePost">
          <div class="flex flex-col gap-1.5">
            <label for="post-title" class="text-sm font-medium text-ink">Título</label>
            <input
              id="post-title"
              v-model="formTitle"
              type="text"
              placeholder="Título do post"
              class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            />
          </div>

          <div class="text-text-secondary text-sm mt-1 font-mono leading-snug" style="letter-spacing:-0.02em; margin-top: 2px;">slug: www.fibramfer.com.br/blog/{{ formSlug }}</div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="post-date" class="text-sm font-medium text-ink">Data</label>
              <input
                id="post-date"
                v-model="formDate"
                type="date"
                class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="post-category" class="text-sm font-medium text-ink">Categoria</label>
              <input
                id="post-category"
                v-model="formCategory"
                type="text"
                placeholder="Ex.: News"
                class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="post-image" class="text-sm font-medium text-ink">Imagem do post</label>
            <input
              id="post-image"
              type="file"
              accept="image/*"
              class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink file:mr-3 file:rounded-md file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
              @change="onImageChange"
            />
            <img
              v-if="formImagePreview"
              :src="formImagePreview"
              alt="Preview"
              class="mt-2 h-40 w-full rounded-lg object-cover bg-surface-alt"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="post-content" class="text-sm font-medium text-ink">Conteúdo</label>
            <div class="flex flex-wrap items-center gap-1 border-b border-border bg-surface-alt p-2">
              <button type="button" title="Negrito" aria-label="Aplicar negrito" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-bold text-ink hover:bg-surface cursor-pointer" @click="exec('bold')">B</button>
              <button type="button" title="Sublinhado" aria-label="Aplicar sublinhado" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm underline text-ink hover:bg-surface cursor-pointer" @click="exec('underline')">U</button>
              <button type="button" title="Lista com marcadores" aria-label="Inserir lista com marcadores" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('insertUnorderedList')">• Lista</button>
              <button type="button" title="Citação" aria-label="Aplicar citação" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('formatBlock', '<blockquote>')">❝ Citação</button>
              <button type="button" title="Inserir tabela" aria-label="Inserir tabela" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('insertHTML', '<table class=\'w-full text-left border-collapse\'><tr><th class=\'p-2 bg-surface-alt\'>Título</th><th class=\'p-2 bg-surface-alt\'>Data</th></tr><tr><td class=\'p-2\'></td><td class=\'p-2\'></td></tr></table>')">▦ Tabela</button>
              <button type="button" title="Inserir link" aria-label="Inserir link" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('createLink', (prompt('URL do link') || ''))">🔗 Link</button>
            </div>
            <div
              ref="editorRef"
              id="post-content"
              contenteditable="true"
              @input="formContent = ($event.target as HTMLElement).innerHTML || ''"
              class="w-full min-h-[12rem] resize-y rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 overflow-auto"
            ></div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" type="button" @click="closeModal">Cancelar</Button>
            <Button variant="primary" size="md" type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .w-full.max-w-2xl,
.modal-leave-active .w-full.max-w-2xl {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from .w-full.max-w-2xl,
.modal-leave-to .w-full.max-w-2xl {
  transform: scale(0.96);
  opacity: 0;
}
</style>
