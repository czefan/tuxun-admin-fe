export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'Y') {
    return;
  }

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) {
        print.error();
        return;
      }
    },
    serviceWorker: {
      url: `${import.meta.env.BASE_URL || '/'}mockServiceWorker.js`
    }
  });
}
