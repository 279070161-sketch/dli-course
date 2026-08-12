/**
 * Universal Analytics & Event Tracking Adapter for DLI Course Web App
 * Compatible with Google Analytics 4 (GA4), Cloudflare Web Analytics, etc.
 */
(function() {
  // =========================================================================
  // CONFIGURATION PLACEHOLDER
  // Paste your Measurement ID here when available (e.g., 'G-XXXXXXXXXX')
  // =========================================================================
  window.GA_MEASUREMENT_ID = 'G-FFYEYPJWDC';

  // GA4 Auto Loader
  if (window.GA_MEASUREMENT_ID && window.GA_MEASUREMENT_ID.trim() !== '') {
    const id = window.GA_MEASUREMENT_ID.trim();
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', id, {
      send_page_view: false // SPA Hash routing handles PageView manually
    });

    console.log(`[Analytics] Google Analytics 4 initialized with ID: ${id}`);
  }

  /**
   * Track Single Page Application (SPA) Page Views
   * @param {string} pagePath - URL Hash or Path (e.g., '#lesson-2.1')
   * @param {string} pageTitle - Lesson Title
   */
  window.trackPageView = function(pagePath, pageTitle) {
    pagePath = pagePath || window.location.hash || '/overview';
    pageTitle = pageTitle || document.title;

    if (window.gtag && window.GA_MEASUREMENT_ID) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
      });
    }
  };

  /**
   * Track Custom User Interaction Events
   * @param {string} eventName - Custom event key
   * @param {Object} eventParams - Optional parameters metadata
   */
  window.trackEvent = function(eventName, eventParams = {}) {
    if (window.gtag && window.GA_MEASUREMENT_ID) {
      window.gtag('event', eventName, eventParams);
    }
  };
})();
