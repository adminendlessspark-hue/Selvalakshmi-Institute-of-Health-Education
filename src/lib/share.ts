/**
 * Utility for safe sharing and opening external links without triggering 'about:blank#blocked' in sandboxed iframe environments.
 */

export const generateReadableUrlParam = (text: string) => {
  if (!text) return "";
  return text.split('').map(char => {
    if ([' ', '?', '&', '=', '#', '%', '+'].includes(char)) {
      return encodeURIComponent(char);
    }
    return char;
  }).join('');
};

export const openExternalUrl = (url: string) => {
  if (!url) return;

  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    window.location.href = url;
  }
};

export const shareToWhatsApp = (text: string, title?: string, url?: string) => {
  const fullText = url ? `${text}\n${url}` : text;

  // 1. Always attempt copying text to clipboard so user never loses their share content
  // Fire and forget to preserve user gesture for the popup
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).catch(() => {});
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  const waUrl = isMobile 
    ? `whatsapp://send?text=${encodeURIComponent(fullText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;

  // 2. Try Native Web Share API first if supported (mostly mobile)
  if (navigator.share && isMobile) {
    navigator.share({
      title: title || 'Selvalakshmi Health Education',
      text: fullText,
    }).catch((err: any) => {
      // If user cancelled, don't force open WhatsApp
      if (err && err.name === 'AbortError') return;
      openExternalUrl(waUrl);
    });
    return;
  }

  // 3. Fallback for Mobile vs Desktop
  openExternalUrl(waUrl);
};

