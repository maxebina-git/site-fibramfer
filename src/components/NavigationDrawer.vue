<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Drawer } from 'ds-grupo-rkb'

type MainDrawerSlot = 'a-fibramfer' | 'produtos' | 'seguranca' | 'blog' | 'contato' | 'privacidade' | 'termos'
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
  { path: '/produtos/', title: 'Produtos', slot: 'produtos', revealKey: 'produtos' },
  { path: '/seguranca/', title: 'Segurança', slot: 'seguranca', revealKey: 'seguranca' },
  { path: '/blog/', title: 'Blog', slot: 'blog', revealKey: 'blog' },
  { path: '/contato/', title: 'Contato', slot: 'contato', revealKey: 'contato' },
  { path: '/privacidade/', title: 'Privacidade', slot: 'privacidade', revealKey: 'privacidade' },
  { path: '/termos/', title: 'Termos de Uso', slot: 'termos', revealKey: 'termos' },
]

const legalSlots = new Set<DrawerSlot>(['privacidade', 'termos'])

const legalLinks = [
  { path: '/privacidade', label: 'Privacidade' },
  { path: '/termos', label: 'Termos' },
]



const routes = computed<RouteDefinition[]>(() => [
  ...mainRoutes,
  ...props.blogPosts.map((post) => ({
    path: `/blog/${post.id}/`,
    title: post.title,
    slot: 'blog-posts' as const,
    revealKey: `blog-post-${post.id}`,
    postId: post.id,
  })),
])

const currentPath = ref(normalizePath(props.initialPath))

function normalizePath(path: string): string {
  if (path === '/') return path
  return path.replace(/\/+$/, '')
}

function routeForPath(path: string): RouteDefinition | undefined {
  const normalizedPath = normalizePath(path)
  return routes.value.find((route) => normalizePath(route.path) === normalizedPath)
}

function routeForHref(href: string): RouteDefinition | undefined {
  return routeForPath(href)
}

const activeRoute = computed(() => routeForPath(currentPath.value))
const activeSlot = computed(() => activeRoute.value?.slot)
const activeRevealKey = computed(() => activeRoute.value?.revealKey ?? '')
const activePostId = computed(() => activeRoute.value?.postId)
const isOpen = computed(() => Boolean(activeRoute.value))
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

  // The header must leave its open state only after the legal curtain has
  // finished closing. Otherwise the menu reappears while the curtain is still
  // using the legal inset values.
  document
    .querySelector<HTMLElement>('header[data-fibramfer-header="true"]')
    ?.setAttribute('data-panel-open', 'false')
}

function scheduleLegalClose(): void {
  isClosingLegal.value = true
  applyLegalContext(true)
  if (legalCloseTimer) clearTimeout(legalCloseTimer)
  legalCloseTimer = setTimeout(finishLegalClose, 2200)
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
  currentPath.value = normalizePath(window.location.pathname)
}

function navigateTo(path: string): void {
  const normalizedPath = normalizePath(path)

  if (normalizePath(window.location.pathname) !== normalizedPath) {
    // A direct-load lock is only for the first paint after refresh. Once the
    // user navigates, restore the normal transition behavior for route changes.
    document.body.removeAttribute('data-fibramfer-direct-drawer')
    document.body.removeAttribute('data-fibramfer-initializing')
    window.history.pushState({}, '', path)
  }

  syncFromLocation()
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function handleOpenUpdate(value: boolean): void {
  if (!value) navigateTo('/')
}

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
   void nextTick(() => {
     observeDrawerScrollContainer()
     if (isOpen.value) {
       document.body.dataset.fibramferDrawerReady = 'true'
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

    // isLegalRoute starts the delayed cleanup above. Keep the legal context and
    // the header in its open state until the synchronized reveal/fade has
    // finished, so the closing curtain keeps the same geometry and the hidden
    // header menu cannot flash back into view.
    if (isClosingLegal.value || wasLegalWhenOpen.value) {
      if (!isClosingLegal.value) scheduleLegalClose()
      header?.setAttribute('data-panel-open', 'true')
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
        skip-initial-transition
        :reveal-key="activeRevealKey"
       panel-width="three-quarters"
       @update:open="handleOpenUpdate"
       @reveal-content="handleRevealContent"
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
          :href="link.path"
          :aria-current="currentPath === link.path ? 'page' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>
    </div>
</template>
