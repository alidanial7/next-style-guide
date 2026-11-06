/**
 * Blocking FOUC script for Server Component layouts.
 * Keep in sync with `theme-provider.tsx` (storage key + class attribute).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("theme")||"system";var r=s==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);if(r==="light"||r==="dark")d.style.colorScheme=r}catch(e){}})();`;
