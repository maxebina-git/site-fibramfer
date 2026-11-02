<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Button } from 'ds-grupo-rkb'
import { Loader2, Check, X, Trash } from '@lucide/vue'

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
const ready = ref(false)
const loadingLogin = ref(false)
const loadingLogout = ref(false)
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

const posts = ref<Post[]>([])
const editorRef = ref<HTMLDivElement | null>(null)

const editingId = ref<string | null>(null)

// modal state
const modalOpen = ref(false)
const confirmId = ref<string | null>(null)
const showLinkConfig = ref(false)
const linkUrl = ref('')
const linkNewTab = ref(false)
const selectedText = ref('')
const isEditingLink = ref(false)
const showTableConfig = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const formTitle = ref('')
const loadingSave = ref(false)
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
  let alreadySynced = false
  try {
    alreadySynced = sessionStorage.getItem('admin_md_sync') === '1'
    sessionStorage.setItem('admin_md_sync', '1')
  } catch {
    alreadySynced = false
  }
  if (!alreadySynced) syncAll(posts.value)
}

function markBlogDirty(changed: boolean) {
  if (changed && typeof window !== 'undefined') {
    ;(window as any).__fibramferBlogDirty = true
  }
}

// No dev o content store do Astro leva ~1,5s para refletir o .md recém-gravado.
// Antes de navegar para o blog, espera o link do post aparecer (ou sumir) no HTML
// de /blog/ para não carregar uma versão desatualizada.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function waitForBlog(id: string, mode: 'present' | 'absent', title?: string): Promise<void> {
  if (import.meta.env.PROD) return
  const needle = `/blog/${id}/`
  const titleNeedle = title ? escapeHtml(title) : null
  const startedAt = Date.now()
  const deadline = startedAt + 9000
  // Mesmo quando a lista já reflete o post, o corpo/edição só aparece ~1,4s depois.
  const minWait = 1800
  while (Date.now() < deadline) {
    try {
      const html = await (await fetch('/blog/', { cache: 'no-store' })).text()
      const has = html.includes(needle)
      const titleOk = !titleNeedle || html.includes(titleNeedle)
      const settled = mode === 'present' ? has && titleOk : !has
      if (settled && Date.now() - startedAt >= minWait) return
    } catch { /* tenta de novo */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

async function syncAll(list: Post[]) {
  const url = import.meta.env.PROD ? '/api/admin.php?action=sync' : '/api/blog-sync'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: list })
    })
    const d = await res.json()
    const changed = import.meta.env.PROD ? true : Number(d?.written) > 0
    if (changed) {
      markBlogDirty(true)
      if (typeof window !== 'undefined') {
        ;(window as any).__fibramferBlogSyncPromise = new Promise((resolve) => setTimeout(resolve, 1800))
      }
    }
  } catch { /* ignore */ }
}

function savePosts() {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts.value))
  } catch { /* quota excedida: mantém em memória e sincroniza via .md */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fibramfer:posts-updated', { detail: { count: posts.value.length } }))
  }
}

async function syncMd(post: Post) {
  const url = import.meta.env.PROD ? '/api/admin.php?action=save' : '/api/blog-sync'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post })
    })
    const d = await res.json()
    if (!import.meta.env.PROD && typeof d?.image === 'string' && d.image.startsWith('/uploads/')) {
      const idx = posts.value.findIndex((p) => p.id === post.id)
      if (idx !== -1 && posts.value[idx].image !== d.image) {
        posts.value[idx] = { ...posts.value[idx], image: d.image }
        savePosts()
      }
    }
    const changed = import.meta.env.PROD ? true : d?.unchanged === false
    if (changed) await waitForBlog(post.id, 'present', post.title)
    markBlogDirty(changed)
  } catch { /* ignore */ }
}

async function deleteMd(id: string) {
  const url = import.meta.env.PROD ? '/api/admin.php?action=delete' : '/api/blog-sync'
  const payload = import.meta.env.PROD ? { id } : { id, delete: true }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const d = await res.json()
    const changed = import.meta.env.PROD ? true : Boolean(d?.deleted)
    if (changed) await waitForBlog(id, 'absent')
    markBlogDirty(changed)
  } catch { /* ignore */ }
}

onMounted(() => {
  authed.value = localStorage.getItem(AUTH_KEY) === '1'
  loadPosts()
  ready.value = true
  window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
  if (formImagePreview.value && formImagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(formImagePreview.value)
  }
})

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (confirmId.value) {
      cancelDelete()
      return
    }
    if (modalOpen.value) {
      closeModal()
    }
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

  loadingLogin.value = true

  setTimeout(() => {
    if (email.value.trim() === 'maxebina@gmail.com' && password.value === '4Bolot@828348') {
      localStorage.setItem(AUTH_KEY, '1')
      authed.value = true
    } else {
      passwordError.value = 'E-mail ou senha inválidos'
    }
    loadingLogin.value = false
  }, 1000)
}

function logout() {
  loadingLogout.value = true
  setTimeout(() => {
    localStorage.removeItem(AUTH_KEY)
    authed.value = false
    email.value = ''
    password.value = ''
    loadingLogout.value = false
  }, 1000)
}

function exec(cmd: string, value?: string) {
  if (editorRef.value) editorRef.value.focus()
  document.execCommand(cmd, false, value || '')
}

const TABLE_HTML = '<table class="w-full text-left border-collapse"><tr><th class="p-2 bg-surface-alt">Título</th><th class="p-2 bg-surface-alt">Data</th></tr><tr><td class="p-2"></td><td class="p-2"></td></tr></table>'

let savedSelection: Range | null = null

function openLinkConfig() {
  showLinkConfig.value = !showLinkConfig.value
  if (showLinkConfig.value) {
    linkUrl.value = ''
    linkNewTab.value = false
    isEditingLink.value = false
    showTableConfig.value = false
    // Save current selection in editor and detect existing link
    if (editorRef.value) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && editorRef.value.contains(sel.anchorNode)) {
        savedSelection = sel.getRangeAt(0).cloneRange()
        selectedText.value = sel.toString().trim()
        // Detect if selection has a link
        const anchorNode = sel.anchorNode
        const linkNode = anchorNode && anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode
        const linkElement = linkNode?.closest ? linkNode.closest('a') : (linkNode as HTMLElement)?.closest('a')
        if (linkElement) {
          linkUrl.value = linkElement.href || ''
          linkNewTab.value = linkElement.target === '_blank'
          selectedText.value = linkElement.textContent?.trim() || ''
          isEditingLink.value = true
        } else {
          selectedText.value = sel.toString().trim()
        }
      }
    }
  }
}

function insertLink() {
  // If linkUrl is empty but we have selected text and saved selection, it's a link removal
  const isRemoving = !linkUrl.value.trim() && selectedText.value.trim() && savedSelection
  if (!isRemoving && (!linkUrl.value.trim() || !selectedText.value.trim())) return

  // Focus editor and restore saved selection before inserting/removing
  if (editorRef.value) {
    editorRef.value.focus()
    if (savedSelection) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelection)
      }
    }
  }

  if (isRemoving) {
    // Remove the link
    exec('unlink')
  } else {
    // Insert or update link
    const textToLink = selectedText.value.trim() || linkUrl.value.trim()
    const html = linkNewTab.value
      ? `<a href="${linkUrl.value.trim()}" target="_blank" rel="noopener noreferrer">${selectedText.value.trim()}</a>`
      : `<a href="${linkUrl.value.trim()}">${selectedText.value.trim()}</a>`
    exec('insertHTML', html)
  }

  linkUrl.value = ''
  linkNewTab.value = false
  selectedText.value = ''
  showLinkConfig.value = false
  savedSelection = null
}

function cancelLink() {
  linkUrl.value = ''
  linkNewTab.value = false
  isEditingLink.value = false
  selectedText.value = ''
  showLinkConfig.value = false
  savedSelection = null
}

function removeLink() {
  if (!selectedText.value.trim() || !savedSelection) return
  // Focus editor and restore saved selection before removing
  if (editorRef.value) {
    editorRef.value.focus()
    if (savedSelection) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelection)
      }
    }
  }
  exec('unlink')
  linkUrl.value = ''
  linkNewTab.value = false
  isEditingLink.value = false
  selectedText.value = ''
  showLinkConfig.value = false
  savedSelection = null
}

function openTableConfig() {
  showTableConfig.value = !showTableConfig.value
  if (showTableConfig.value) {
    tableRows.value = 3
    tableCols.value = 3
    showLinkConfig.value = false
  }
}

function insertTable() {
  const rows = Math.max(1, Number(tableRows.value) || 3)
  const cols = Math.max(1, Number(tableCols.value) || 3)
  let html = '<table class="w-full text-left border-collapse">'
  html += '<tr>' + Array(cols).fill('<th class="p-2 bg-surface-alt">Coluna</th>').join('') + '</tr>'
  for (let i = 0; i < rows; i++) {
    html += '<tr>' + Array(cols).fill('<td class="p-2"></td>').join('') + '</tr>'
  }
  html += '</table>'
  exec('insertHTML', html)
  tableRows.value = 3
  tableCols.value = 3
  showTableConfig.value = false
}

function cancelTable() {
  tableRows.value = 3
  tableCols.value = 3
  showTableConfig.value = false
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
  confirmId.value = id
}

function confirmDelete() {
  const id = confirmId.value
  if (!id) return
  posts.value = posts.value.filter((p) => p.id !== id)
  savePosts()
  ;(window as any).__fibramferBlogDirty = true
  ;(window as any).__fibramferBlogSyncPromise = deleteMd(id)
  confirmId.value = null
}

function cancelDelete() {
  confirmId.value = null
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

async function savePost() {
  if (!formTitle.value.trim()) return

  const imageValue = formImagePreview.value

  let synced: Post | undefined
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
      synced = posts.value[idx]
    }
  } else {
    const id = formSlug.value || slugify(formTitle.value) || 'post'
    const created: Post = {
      id,
      title: formTitle.value.trim(),
      date: formDate.value,
      category: formCategory.value.trim(),
      image: imageValue,
      content: formContent.value,
    }
    posts.value.unshift(created)
    synced = created
  }

  savePosts()
  if (synced) {
    ;(window as any).__fibramferBlogDirty = true
    ;(window as any).__fibramferBlogSyncPromise = syncMd(synced)
  }
  loadingSave.value = true
  await new Promise((r) => setTimeout(r, 1000))
  closeModal()
  loadingSave.value = false
}
</script>

<template>
  <!-- LOADING (evita flash da tela de login no SSR/recarregamento) -->
  <div v-if="!ready" class="mx-auto max-w-7xl px-4 py-8 md:px-8" aria-busy="true"></div>

  <!-- LOGIN VIEW -->
  <div v-else-if="!authed" class="mx-auto max-w-md">
    <div class="mb-6 text-center">
      <p class="mb-2 font-body text-sm font-semibold uppercase tracking-[0.16em] text-accent-500">Área restrita</p>
      <h1 class="font-display text-4xl font-bold text-center text-ink mb-2">Admin</h1>
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

      <Button id="admin-submit-cta" variant="primary" size="lg" type="submit" fullWidth :disabled="loadingLogin" class="cursor-pointer">
        <span class="flex items-center justify-center gap-2">
          <Loader2 v-if="loadingLogin" class="w-4 h-4 animate-spin" />
          <span>{{ loadingLogin ? 'Entrando...' : 'Entrar' }}</span>
        </span>
      </Button>
    </form>
  </div>
  </div>

  <!-- ADMIN VIEW -->
  <div v-else class="mx-auto max-w-7xl px-4 md:px-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="font-display text-4xl font-bold text-center text-ink mb-2">Administrar Blog</h1>
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
                <div v-if="confirmId === post.id" class="flex items-center justify-end gap-2">
                  <button type="button" class="rounded-md bg-error-500 px-2 py-1 hover:bg-error-600 cursor-pointer" @click="confirmDelete" aria-label="Confirmar exclusão">
                    <Check class="w-4 h-4 text-white" />
                  </button>
                  <button type="button" class="rounded-md bg-surface-alt px-2 py-1 hover:bg-surface cursor-pointer" @click="cancelDelete" aria-label="Cancelar exclusão">
                    <X class="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
                <button v-else type="button" class="rounded-md bg-surface-alt px-2 py-1 text-sm font-medium text-error-500 hover:bg-surface cursor-pointer" @click="deletePost(post.id)">Excluir</button>
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
      <button type="button" class="text-sm font-medium text-text-secondary hover:text-ink cursor-pointer flex items-center gap-2" @click="logout" :disabled="loadingLogout">
        <Loader2 v-if="loadingLogout" class="w-3.5 h-3.5 animate-spin" />
        <span>{{ loadingLogout ? 'Saindo...' : 'Sair p/ login' }}</span>
      </button>
    </div>
  </div>

  <!-- MODAL -->
  <Teleport to="body">
    <Transition name="modal" mode="out-in">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
      >
      <div class="w-full max-w-5xl rounded-lg border border-border bg-surface p-6 shadow-card md:p-8">
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
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label for="post-title" class="text-sm font-medium text-ink">Título</label>
              <input
                id="post-title"
                v-model="formTitle"
                type="text"
                placeholder="Título do post"
                class="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              />
              <div class="text-text-secondary text-sm font-mono leading-snug" style="letter-spacing:-0.02em;">slug: www.fibramfer.com.br/blog/{{ formSlug }}</div>
            </div>
          </div>

          <div class="flex flex-row gap-5">
            <div class="md:w-1/3 flex flex-col gap-5">
              <div class="grid grid-cols-1 gap-5 md:grid-cols-1">
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
            </div>
            <div class="md:w-2/3 flex flex-col gap-1.5">
              <label for="post-content" class="text-sm font-medium text-ink">Conteúdo</label>
            <div class="flex flex-wrap items-center gap-1 border-b border-border bg-surface-alt p-2">
              <button type="button" title="Negrito" aria-label="Aplicar negrito" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-bold text-ink hover:bg-surface cursor-pointer" @click="exec('bold')">B</button>
              <button type="button" title="Sublinhado" aria-label="Aplicar sublinhado" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm underline text-ink hover:bg-surface cursor-pointer" @click="exec('underline')">U</button>
              <button type="button" title="Lista com marcadores" aria-label="Inserir lista com marcadores" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('insertUnorderedList')">• Lista</button>
              <button type="button" title="Citação" aria-label="Aplicar citação" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="exec('formatBlock', '<blockquote>')">❝ Citação</button>
              <button type="button" title="Inserir tabela" aria-label="Inserir tabela" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="openTableConfig">▦ Tabela</button>
              <button type="button" title="Inserir link" aria-label="Inserir link" class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm text-ink hover:bg-surface cursor-pointer" @click="openLinkConfig">🔗 Link</button>
            </div>
            
            <!-- Link Config Panel -->
            <div v-if="showLinkConfig" class="border-b border-border bg-surface-alt p-2 flex flex-col gap-2">
              <input
                v-model="linkUrl"
                type="url"
                placeholder="https://exemplo.com"
                class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                @keydown.enter.prevent="insertLink"
              />
              <div class="flex flex-wrap items-center gap-2">
                <label class="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input type="checkbox" v-model="linkNewTab" class="rounded border-border text-primary-500 focus:ring-primary-500" />
                  Nova janela
                </label>
                <span class="text-text-secondary">|</span>
                <button type="button" class="rounded-md border border-border bg-surface-alt px-3 py-1.5 hover:bg-surface cursor-pointer flex items-center gap-2" @click="cancelLink">
                  <X class="w-4 h-4 text-text-secondary" />
                  Cancelar
                </button>
                <span v-if="isEditingLink" class="text-text-secondary">|</span>
                <button v-if="isEditingLink" type="button" class="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-alt cursor-pointer flex items-center gap-2 text-text-secondary" @click="removeLink" aria-label="Remover link">
                  <Trash class="w-4 h-4" />
                  Remover link
                </button>
                <span class="text-text-secondary">|</span>
                <button type="button" class="rounded-md bg-success-500 px-3 py-1.5 hover:bg-success-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white" @click="insertLink" :disabled="!linkUrl.trim() || !selectedText.trim()">
                  <Check class="w-4 h-4" />
                  Ok
                </button>
              </div>
            </div>

            <!-- Table Config Panel -->
            <div v-if="showTableConfig" class="border-b border-border bg-surface-alt p-2 flex flex-wrap items-center gap-2">
              <div class="flex items-center gap-1">
                <label class="text-sm text-ink">Linhas</label>
                <input
                  v-model.number="tableRows"
                  type="number"
                  min="1"
                  max="20"
                  class="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                />
              </div>
              <div class="flex items-center gap-1">
                <label class="text-sm text-ink">Colunas</label>
                <input
                  v-model.number="tableCols"
                  type="number"
                  min="1"
                  max="10"
                  class="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                />
              </div>
              <button type="button" class="rounded-md bg-success-500 px-3 py-1.5 hover:bg-success-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white" @click="insertTable">
                  <Check class="w-4 h-4" />
                  Ok
                </button>
              <button type="button" class="rounded-md border border-border bg-surface-alt px-3 py-1.5 hover:bg-surface cursor-pointer flex items-center gap-2" @click="cancelTable">
                <X class="w-4 h-4 text-text-secondary" />
                Cancelar
              </button>
            </div>
            <div
              ref="editorRef"
              id="post-content"
              contenteditable="true"
              @input="formContent = ($event.target as HTMLElement).innerHTML || ''"
              class="w-full h-[12rem] rounded-lg border border-border bg-surface px-3.5 py-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 overflow-auto"
            ></div>
          </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" type="button" @click="closeModal">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" :disabled="loadingSave">
          <span class="flex items-center justify-center gap-2">
            <Loader2 v-if="loadingSave" class="w-4 h-4 animate-spin" />
            <span>{{ loadingSave ? 'Salvando...' : 'Salvar' }}</span>
          </span>
        </Button>
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

<style is:global>
#post-content a {
  color: var(--color-primary-500);
  text-decoration: underline;
  cursor: pointer;
}
#post-content ul {
  list-style: disc;
  padding-left: 1.2rem;
  margin: 0.25rem 0;
}
#post-content blockquote {
  border-left: 3px solid #9ca3af;
  padding-left: 0.75rem;
  color: #4b5563;
  font-style: italic;
  display: block;
  margin: 0.25rem 0;
}
#post-content strong,
#post-content b {
  font-weight: 700;
}
#post-content u {
  text-decoration: underline;
}
</style>
