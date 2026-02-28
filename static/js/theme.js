/**
 * 主題模組
 * 負責 Dark/Light Mode 切換、localStorage 持久化、系統偏好自動偵測
 */
const Theme = (() => {
    const STORAGE_KEY = 'theme-preference';
    const els = {};

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Dark Mode 時顯示 ☀️（代表點擊後切回 Light）；Light Mode 時顯示 🌙
        els.icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    function init() {
        els.btn = document.getElementById('btn-theme-toggle');
        els.icon = document.getElementById('theme-icon');
        els.btn.addEventListener('click', toggle);
        // FOUC 防止 script 已設定 data-theme attribute，這裡只需同步 icon 狀態
        const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        applyTheme(current);
        // 監聽系統偏好變更（僅在使用者未手動設定時生效）
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    return { init };
})();
