// Service Worker Registration for PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', {
          // Update service worker ngay khi có version mới
          updateViaCache: 'none'
        })
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
          
          // Check for updates mỗi khi page load
          setInterval(() => {
            registration.update().catch((err) => {
              console.log('[SW] Update check failed:', err);
            });
          }, 60000); // Check mỗi 60 giây
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[SW] New Service Worker available');
                    // Auto reload sau 1 giây
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    // First time install
                    console.log('[SW] Service Worker installed for the first time');
                  }
                }
              });
            }
          });
          
          // Listen for controller change (khi SW mới take over)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[SW] Controller changed, reloading...');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

// Prompt user to install PWA
export function promptInstall() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install button or notification
    console.log('PWA can be installed');
    
    return false;
  });

  return deferredPrompt;
}

