export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return
  }

  let observer: IntersectionObserver | null = null

  const bindReveal = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal-on-scroll'))

    if (prefersReducedMotion) {
      for (const node of nodes) node.classList.add('is-visible')
      observer?.disconnect()
      observer = null
      return
    }

    observer?.disconnect()
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      }
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    })

    for (const node of nodes) {
      if (!node.classList.contains('is-visible')) {
        observer.observe(node)
      }
    }
  }

  nuxtApp.hook('page:finish', () => {
    window.requestAnimationFrame(bindReveal)
  })

  window.requestAnimationFrame(bindReveal)
})
