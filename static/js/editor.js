/**
 * 編輯器模組
 * 負責圖片清單管理、圖片切換、載入對應 Markdown
 */
const Editor = (() => {
    let images = [];
    let currentIndex = -1;
    let currentMarkdown = '';

    const els = {};

    function cacheElements() {
        els.prevBtn = document.getElementById('btn-prev');
        els.nextBtn = document.getElementById('btn-next');
        els.filename = document.getElementById('current-filename');
        els.image = document.getElementById('preview-image');
    }

    async function loadImageList() {
        const res = await fetch('/api/images');
        if (!res.ok) {
            Toast.show('無法載入圖片清單', 'error');
            return;
        }
        images = await res.json();
    }

    async function loadMarkdown(baseName) {
        const res = await fetch(`/api/markdown/${baseName}.md`);
        if (res.ok) {
            currentMarkdown = await res.text();
        } else {
            currentMarkdown = '';
        }
    }

    async function showImage(index) {
        if (index < 0 || index >= images.length) return;
        currentIndex = index;

        const info = images[currentIndex];
        els.image.src = `/data/images/${info.filename}`;
        els.image.alt = info.filename;

        updateToolbar();

        const baseName = info.filename.replace(/\.[^.]+$/, '');
        await loadMarkdown(baseName);
    }

    function updateToolbar() {
        if (images.length === 0) {
            els.filename.textContent = '—';
            els.prevBtn.disabled = true;
            els.nextBtn.disabled = true;
            return;
        }
        els.filename.textContent = images[currentIndex].filename;
        els.prevBtn.disabled = currentIndex <= 0;
        els.nextBtn.disabled = currentIndex >= images.length - 1;
    }

    function prev() {
        if (currentIndex > 0) showImage(currentIndex - 1);
    }

    function next() {
        if (currentIndex < images.length - 1) showImage(currentIndex + 1);
    }

    async function init() {
        cacheElements();
        els.prevBtn.addEventListener('click', prev);
        els.nextBtn.addEventListener('click', next);

        await loadImageList();

        if (images.length > 0) {
            await showImage(0);
        } else {
            updateToolbar();
        }
    }

    return { init };
})();
