export type ThemeMode = "light" | "dark" | "system";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("ss-theme") as ThemeMode) || "dark";
}

export function applyTheme(mode: ThemeMode) {
  localStorage.setItem("ss-theme", mode);
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export const themeInitScript = `(function(){try{var m=localStorage.getItem('ss-theme')||'dark';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
