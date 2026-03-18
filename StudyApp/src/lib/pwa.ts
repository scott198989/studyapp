export async function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  await navigator.serviceWorker.register('/sw.js')
}
