/**
 * Utility for safe sharing and opening external links without triggering 'about:blank#blocked' in sandboxed iframe environments.
 */

export const openExternalUrl = (url: string) => {
  if (!url) return;

  try {
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      // In an iframe sandbox, opening '_blank' popups causes 'about:blank#blocked'.
      // We safely redirect the top frame or current location.
      try {
        window.top!.location.href = url;
      } catch (e) {
        window.location.href = url;
      }
      return;
    }

    // Standalone browser tab
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
};

export const shareToWhatsApp = async (text: string, title?: string, url?: string) => {
  const fullText = url ? `${text}\n${url}` : text;

  // 1. Always attempt copying text to clipboard so user never loses their share content
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
    }
  } catch (err) {
    // Ignore clipboard permission errors silently
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 2. Try Native Web Share API first if supported
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || 'Selvalakshmi Health Education',
        text: fullText,
      });
      return;
    } catch (err: any) {
      // If user cancelled, don't force open WhatsApp
      if (err && err.name === 'AbortError') return;
    }
  }

  // 3. Fallback for Mobile vs Desktop
  if (isMobile) {
    // Native deep link schema for WhatsApp on mobile devices
    const mobileWaScheme = `whatsapp://send?text=${encodeURIComponent(fullText)}`;
    openExternalUrl(mobileWaScheme);
  } else {
    // Universal WhatsApp Web / API link
    const webWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    openExternalUrl(webWaUrl);
  }
};

