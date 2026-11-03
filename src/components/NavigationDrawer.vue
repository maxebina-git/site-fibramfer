<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Drawer } from 'ds-grupo-rkb'
import { sitePath, stripSiteBase } from '../lib/sitePath'

type MainDrawerSlot =
  | 'a-fibramfer'
  | 'seguranca'
  | 'blog'
  | 'contato'
  | 'privacidade'
  | 'termos'
  | 'cadeira-suspensa'
  | 'admin'
type LegalDrawerSlot = 'privacidade' | 'termos'
type DrawerSlot = MainDrawerSlot | 'blog-posts'

interface Props {
  initialPath?: string
  blogPosts?: Array<{
    id: string
    title: string
  }>
}

interface RouteDefinition {
  path: string
  title: string
  slot: DrawerSlot
  revealKey: string
  postId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: '/',
  blogPosts: () => [],
})

const mainRoutes: RouteDefinition[] = [
  { path: '/a-fibramfer/', title: 'A Fibramfer', slot: 'a-fibramfer', revealKey: 'a-fibramfer' },
  { path: '/admin/', title: 'Admin', slot: 'admin', revealKey: 'admin' },
  { path: '/cadeira-suspensa/', title: 'Cadeira Suspensa', slot: 'cadeira-suspensa', revealKey: 'cadeira-suspensa' },
  { path: '/seguranca/', title: 'Segurança', slot: 'seguranca', revealKey: 'seguranca' },
  { path: '/blog/', title: 'Blog', slot: 'blog', revealKey: 'blog' },
  { path: '/contato/', title: 'Contato', slot: 'contato', revealKey: 'contato' },
  { path: '/privacidade/', title: 'Privacidade', slot: 'privacidade', revealKey: 'privacidade' },
  { path: '/termos/', title: 'Termos de Uso', slot: 'termos', revealKey: 'termos' },
]

const legalSlots = new Set<DrawerSlot>(['privacidade', 'termos'])
const DRAWER_REVEAL_CLOSE_DELAY_MS = 500
const LEGAL_DRAWER_CONTENT_SWAP_MS = 2100
const LEGAL_DRAWER_CLOSE_TOTAL_MS = 2700

const legalLinks = [
  { path: '/privacidade', label: 'Privacidade' },
  { path: '/termos', label: 'Termos' },
]

const dynamicPostId = ref<string | undefined>(undefined)


const routes = computed<RouteDefinition[]>(() => [
  ...mainRoutes,
  ...props.blogPosts.map((post) => ({
    path: `/blog/${post.id}/`,
    title: post.title,
    slot: 'blog-posts' as const,
    revealKey: `blog-post-${post.id}`,
    postId: post.id,
  })),
  ...(dynamicPostId.value
    ? [{
        path: `/blog/${dynamicPostId.value}/`,
        title: 'Blog',
        slot: 'blog-posts' as const,
        revealKey: `blog-post-${dynamicPostId.value}`,
        postId: dynamicPostId.value,
      }]
    : []),
])

const currentPath = ref(normalizePath(props.initialPath))

  watch(currentPath, (newPath) => {
    const titles: Record<string, string> = {
      '/a-fibramfer/': 'A Fibramfer',
      '/cadeira-suspensa/': 'Cadeira Suspensa',
      '/admin/': 'Admin',
      '/seguranca/': 'Segurança',
      '/blog/': 'Blog',
      '/contato/': 'Contato',
    };
    if (titles[newPath]) document.title = titles[newPath] + ' | Fibramfer';
  })

function normalizePath(path: string): string {
  if (path === '/') return path
  return path.replace(/\/+$/, '')
}

function routeForPath(path: string): RouteDefinition | undefined {
  const normalizedPath = normalizePath(path)
  return routes.value.find((route) => normalizePath(route.path) === normalizedPath)
}

function routeForHref(href: string): RouteDefinition | undefined {
  return routeForPath(stripSiteBase(href))
}

const activeRoute = computed(() => routeForPath(currentPath.value))
const activeSlot = computed(() => activeRoute.value?.slot)
const activeRevealKey = computed(() => activeRoute.value?.revealKey ?? '')
const activePostId = computed(() => activeRoute.value?.postId)
const isOpen = computed(() => Boolean(activeRoute.value))
const shouldSkipInitialTransition = computed(() => activeRevealKey.value !== 'a-fibramfer')
const displayedSlot = ref<DrawerSlot | undefined>(activeSlot.value)
const displayedPostId = ref<string | undefined>(activePostId.value)

watch([activeSlot, isOpen], ([nextSlot, nextOpen], [previousSlot, previousOpen]) => {
  if (!nextOpen || nextSlot === previousSlot || previousOpen) return
  displayedSlot.value = nextSlot
  displayedPostId.value = activePostId.value
})

const isLegalRoute = computed(() => Boolean(activeSlot.value && legalSlots.has(activeSlot.value)))
const isClosingLegal = ref(false)
const wasLegalWhenOpen = ref(isLegalRoute.value)
let legalCloseTimer: ReturnType<typeof setTimeout> | null = null

let legalFooterObserver: ResizeObserver | null = null

function applyLegalContext(active: boolean): void {
  if (typeof document === 'undefined') return
  document.body.toggleAttribute('data-legal-drawer', active)
}

function syncLegalFooterHeight(): void {
  const footer = document.querySelector<HTMLElement>('footer')
  if (!footer) return
  document.documentElement.style.setProperty('--legal-footer-height', `${footer.getBoundingClientRect().height}px`)
}

function startLegalFooterSync(): void {
  const footer = document.querySelector<HTMLElement>('footer')
  if (!footer) return
  syncLegalFooterHeight()
  legalFooterObserver = new ResizeObserver(syncLegalFooterHeight)
  legalFooterObserver.observe(footer)
}

function stopLegalFooterSync(): void {
  legalFooterObserver?.disconnect()
  legalFooterObserver = null
  document.documentElement.style.removeProperty('--legal-footer-height')
}

function finishLegalClose(): void {
  legalCloseTimer = null
  isClosingLegal.value = false
  wasLegalWhenOpen.value = false
  applyLegalContext(false)
  stopLegalFooterSync()

  // O contexto legal é mantido até o fim da cortina; o estado do Header já foi
  // liberado no início da saída para que logo e H1 sigam a transição normal.
  document
    .querySelector<HTMLElement>('header[data-fibramfer-header="true"]')
    ?.setAttribute('data-panel-open', 'false')
}

function scheduleLegalClose(): void {
  isClosingLegal.value = true
  applyLegalContext(true)
  if (legalCloseTimer) clearTimeout(legalCloseTimer)
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  if (reducedMotion) {
    finishLegalClose()
    return
  }
  const duration = isOpen.value
    ? LEGAL_DRAWER_CONTENT_SWAP_MS
    : LEGAL_DRAWER_CLOSE_TOTAL_MS
  legalCloseTimer = setTimeout(finishLegalClose, duration)
}

const drawerScrollSelector =
  "[data-fibramfer-drawers] aside[role='dialog'] [data-drawer-reveal-content]"

const drawerRef = ref<InstanceType<typeof Drawer> | null>(null)


let drawerScrollObserver: ResizeObserver | null = null
let drawerContentObserver: MutationObserver | null = null
let observedScrollContainer: HTMLElement | null = null
let drawerScrollRaf = 0

function syncDrawerScrollable(): void {
  if (typeof document === 'undefined') return
  const container = document.querySelector<HTMLElement>(drawerScrollSelector)
  const aside = container?.closest<HTMLElement>("aside[role='dialog']")
  if (!container || !aside) return
  const hasScroll = container.scrollHeight > container.clientHeight + 1
  aside.toggleAttribute('data-drawer-scrollable', hasScroll)
}

function scheduleDrawerScrollSync(): void {
  if (typeof window === 'undefined') return
  if (drawerScrollRaf) cancelAnimationFrame(drawerScrollRaf)
  drawerScrollRaf = requestAnimationFrame(() => {
    drawerScrollRaf = 0
    syncDrawerScrollable()
  })
}

function observeDrawerScrollContainer(): void {
  const container = document.querySelector<HTMLElement>(drawerScrollSelector)
  if (container === observedScrollContainer) return
  observedScrollContainer = container
  drawerScrollObserver?.disconnect()
  drawerContentObserver?.disconnect()
  drawerScrollObserver = null
  drawerContentObserver = null
  if (!container) return

  // Mede imediatamente, antes da cortina revelar o conteúdo. Assim o botão
  // Fechar já nasce à direita, ligeiramente ao lado da scrollbar, sem piscar
  // primeiro na posição padrão.
  syncDrawerScrollable()

  drawerScrollObserver = new ResizeObserver(scheduleDrawerScrollSync)
  drawerScrollObserver.observe(container)
  drawerContentObserver = new MutationObserver(scheduleDrawerScrollSync)
  drawerContentObserver.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })
}

function stopDrawerScrollSync(): void {
  if (drawerScrollRaf) {
    cancelAnimationFrame(drawerScrollRaf)
    drawerScrollRaf = 0
  }
  drawerScrollObserver?.disconnect()
  drawerContentObserver?.disconnect()
  drawerScrollObserver = null
  drawerContentObserver = null
  observedScrollContainer = null
  window.removeEventListener('resize', scheduleDrawerScrollSync)
  document
    .querySelector<HTMLElement>("aside[role='dialog']")
    ?.removeAttribute('data-drawer-scrollable')
}

watch(isLegalRoute, (active) => {
  if (typeof document === 'undefined') return
  if (active) {
    isClosingLegal.value = false
    if (legalCloseTimer) { clearTimeout(legalCloseTimer); legalCloseTimer = null }
    applyLegalContext(true)
    startLegalFooterSync()
  } else {
    // Keep legal context (floating bar + header state) alive during the
    // curtain close animation; remove only after the drawer has closed.
    scheduleLegalClose()
  }
})

function syncFromLocation(): void {
  const path = normalizePath(stripSiteBase(window.location.pathname))
  const queryPostId = path === '/blog'
    ? new URLSearchParams(window.location.search).get('post')?.trim() || undefined
    : undefined

  dynamicPostId.value = queryPostId
  currentPath.value = queryPostId ? `/blog/${queryPostId}/` : path
}

function navigateTo(path: string): void {
  const normalizedPath = normalizePath(path)

  // Se o admin acabou de criar/editar/excluir um post, o HTML já carregado do
  // blog está desatualizado (o reload automático foi suprimido). Nesse caso,
  // espera a sincronização terminar e faz um carregamento real da rota do blog.
  const isBlogRoute = normalizedPath === '/blog' || normalizedPath.startsWith('/blog/')
  const blogState = typeof window !== 'undefined' ? (window as any) : null
  if (isBlogRoute && blogState && (blogState.__fibramferBlogDirty || blogState.__fibramferBlogSyncPromise)) {
    const pending: Promise<unknown> | undefined = blogState.__fibramferBlogSyncPromise
    blogState.__fibramferBlogDirty = false
    blogState.__fibramferBlogSyncPromise = undefined
    const go = () => window.location.assign(sitePath(path))
    if (pending && typeof pending.then === 'function') {
      Promise.race([
        Promise.resolve(pending).catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 9000)),
      ]).then(go)
    } else {
      go()
    }
    return
  }

  const targetUrl = new URL(sitePath(path), window.location.href)
  const currentUrl = `${window.location.pathname}${window.location.search}`
  const nextUrl = `${targetUrl.pathname}${targetUrl.search}`
  if (currentUrl !== nextUrl) {
    // A direct-load lock is only for the first paint after refresh. Once the
    // user navigates, restore the normal transition behavior for route changes.
    document.body.removeAttribute('data-fibramfer-direct-drawer')
    document.body.removeAttribute('data-fibramfer-initializing')
    window.history.pushState({}, '', nextUrl)
  }

  syncFromLocation()
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function handleOpenUpdate(value: boolean): void {
  if (!value) {
    // Post do blog fecha para a lista; a própria lista /blog/ fecha para a home,
    // igual às outras páginas (senão a rota não muda e a cortina não fecha).
    if (currentPath.value.startsWith('/blog/')) {
      navigateTo('/blog/')
    } else {
      navigateTo('/')
    }
  }
}

function onDrawerClose(): void {}

function handleRevealContent(slot: string | number | undefined): void {
  if (slot === undefined) return
  const route = routes.value.find((item) => item.revealKey === String(slot))
  if (!route) return
  displayedSlot.value = route.slot
  displayedPostId.value = route.postId
}

async function syncBlogPostVisibility(): Promise<void> {
  await nextTick()
  const postId = displayedPostId.value

  document.querySelectorAll<HTMLElement>('[data-blog-post-id]').forEach((post) => {
    post.hidden = !postId || post.dataset.blogPostId !== postId
  })
}

function handleDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const target = event.target as Element | null
  const link = target?.closest<HTMLAnchorElement>('a[href]')
  if (!link || link.target === '_blank') return

  const href = link.getAttribute('href')
  if (!href) return

  const route = href === '/' ? { path: '/' } : routeForHref(href)
  if (!route) return

  event.preventDefault()
  navigateTo(route.path)
}

function handleAdminShortcut(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey)) return
  if (event.key.toLowerCase() !== 'y') return
  const active = document.activeElement as HTMLElement | null
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return
  event.preventDefault()
  const path = normalizePath(stripSiteBase(window.location.pathname))
  if (path === '/admin') {
    navigateTo('/')
  } else {
    navigateTo('/admin/')
  }
}

onMounted(() => {
  syncFromLocation()
  if (isLegalRoute.value) {
    startLegalFooterSync()
  }
  void syncBlogPostVisibility()
  window.addEventListener('popstate', syncFromLocation)
  window.addEventListener('fibramfer:navigate', (e: CustomEvent) => {
    if (e.detail?.path) {
      currentPath.value = normalizePath(e.detail.path)
    }
  })
  window.addEventListener('resize', scheduleDrawerScrollSync)
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleAdminShortcut, true)
  void nextTick(() => {
    observeDrawerScrollContainer()
    if (isOpen.value) {
      document.body.dataset.fibramferDrawerReady = 'true'
      if (!shouldSkipInitialTransition.value) {
        document.body.removeAttribute('data-fibramfer-direct-drawer')
      }
    }
    scheduleDrawerScrollSync()
  })
  if (isOpen.value) {
    void nextTick(() => {
      if (typeof document !== 'undefined') focusCloseButton()
    })
  }
})

// Foca o botão de fechar do drawer quando ele abre (acessibilidade)
function focusCloseButton(): void {
  if (typeof document === 'undefined') return
  const drawerPanel = document.querySelector<HTMLElement>(
    "[data-fibramfer-drawers] aside[role='dialog']"
  )
  const closeBtn = drawerPanel?.querySelector<HTMLButtonElement>(
    "button[aria-label*='fechar' i], button[aria-label*='close' i], [data-drawer-close]"
  )
  if (closeBtn) {
    closeBtn.focus()
    // Remove focus ring aplicado pelo DS (pode vir via inline style ou shadow DOM)
    closeBtn.style.outline = '0'
    closeBtn.style.outlineOffset = '0'
    closeBtn.style.boxShadow = 'none'
    closeBtn.style.border = 'none'
    // Garante que permanece sem ring mesmo se o DS reaplicar
    closeBtn.addEventListener('focus', () => {
      closeBtn.style.outline = '0'
      closeBtn.style.outlineOffset = '0'
      closeBtn.style.boxShadow = 'none'
      closeBtn.style.border = 'none'
    }, { once: true })
  }
}

watch(isOpen, async (open, previousOpen) => {
  if (typeof document === 'undefined') return
  const header = document.querySelector<HTMLElement>('header[data-fibramfer-header="true"]')
  if (!open) {
    document.body.removeAttribute('data-panel-drawer-open')
    document.body.removeAttribute('data-fibramfer-direct-drawer')
    // Evita aria-hidden retido com foco descendente ao fechar
    const active = document.activeElement as HTMLElement | null
    if (active && active.closest?.("aside[role='dialog']")) {
      active.blur()
      // Devolve foco ao trigger do menu (header) quando houver
      const header = document.querySelector<HTMLElement>('header[data-fibramfer-header="true"]')
      const trigger = header?.querySelector<HTMLButtonElement>('button[aria-label*="Admin" i], button[data-fibramfer-admin-trigger]')
      if (trigger) { try { trigger.focus() } catch {} }
    }

    // Dispatch close event for dependent components (e.g., F1 animation)
    window.dispatchEvent(new CustomEvent('fibramfer:drawer-close', {
      detail: {
        delay: DRAWER_REVEAL_CLOSE_DELAY_MS,
        legal: isLegalRoute.value,
      },
    }))

    // isLegalRoute inicia a limpeza atrasada acima. O contexto legal permanece
    // durante a cortina, enquanto o Header é liberado imediatamente; as regras
    // legais continuam ocultando o menu sem atrasar o retorno do logo e do H1.
    if (isClosingLegal.value || wasLegalWhenOpen.value) {
      if (!isClosingLegal.value) scheduleLegalClose()
      // Libera logo e H1 imediatamente, como no fechamento das drawers comuns.
      // O contexto legal continua ativo até a cortina terminar, preservando a
      // geometria do painel e os links legais durante a saída.
      header?.setAttribute('data-panel-open', 'false')
      return
    }

    document.body.removeAttribute('data-legal-drawer')
    header?.setAttribute('data-panel-open', 'false')
    return
  }
  await nextTick()
  focusCloseButton()
  wasLegalWhenOpen.value = isLegalRoute.value
  document.body.dataset.panelDrawerOpen = 'true'
  if (isLegalRoute.value) document.body.dataset.legalDrawer = 'true'
  header?.setAttribute('data-panel-open', 'true')

  // A abertura inicial de uma rota carregada diretamente não é uma nova
  // abertura do usuário. O evento só deve reiniciar animações quando o
  // drawer realmente passa de fechado para aberto durante a navegação.
  if (previousOpen === false) {
    window.dispatchEvent(new CustomEvent('fibramfer:drawer-open', {
      detail: {
        path: currentPath.value,
        legal: isLegalRoute.value,
      },
    }))
  }
}, { immediate: true })

watch([isOpen, displayedSlot], async () => {
  await nextTick()
  observeDrawerScrollContainer()
  scheduleDrawerScrollSync()
})

watch([displayedPostId, displayedSlot], () => {
  void syncBlogPostVisibility()
})

  onBeforeUnmount(() => {
  if (legalCloseTimer) { clearTimeout(legalCloseTimer); legalCloseTimer = null }
  applyLegalContext(false)
  stopLegalFooterSync()
    stopDrawerScrollSync()
    document.body.removeAttribute('data-fibramfer-drawer-ready')
    window.removeEventListener('popstate', syncFromLocation)
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleAdminShortcut, true)
})
</script>

<template>
  <div data-fibramfer-drawers class="contents">
    <Drawer
      :open="isOpen"
      :title="activeRoute?.title ?? ''"
      placement="right"
      transition="fade"
      fullscreen
      :modal="false"
      :show-title="false"
      :show-divider="false"
      :close-on-overlay="false"
      synchronize-fade
      reveal
      :skip-initial-transition="shouldSkipInitialTransition"
      :reveal-key="activeRevealKey"
      :reveal-close-delay="DRAWER_REVEAL_CLOSE_DELAY_MS"
      panel-width="three-quarters"
      @update:open="handleOpenUpdate"
      @reveal-content="handleRevealContent"
      @close="onDrawerClose"
      >
        <div
          v-if="displayedSlot"
          :key="displayedSlot"
          class="contents"
          :data-active-blog-post="displayedPostId"
        >
            <slot :name="displayedSlot" />
        </div>
      </Drawer>
      <nav
        v-if="isLegalRoute || isClosingLegal"
        aria-label="Links legais"
        class="fibramfer-legal-floating"
      >
        <a
          v-for="link in legalLinks"
          :key="link.path"
          :href="sitePath(link.path)"
          :aria-current="currentPath === link.path ? 'page' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>
    </div>
</template>
