// @ts-nocheck — service worker: compiled by vite-pwa, not the app tsconfig
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

// Web Push: show the notification sent by the backend (war declaration, market
// sale, …). Without this handler the device subscribes but no notification is
// ever displayed, so push notifications appear broken.
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Civilisations', body: event.data.text() }
  }

  const title = payload.title ?? 'Civilisations'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: { url: payload.url ?? '/' },
    }),
  )
})

// Focus an existing tab on the target url or open a new one when the user taps
// the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        return self.clients.openWindow(targetUrl)
      }),
  )
})

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
