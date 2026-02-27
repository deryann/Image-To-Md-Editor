/**
 * 編輯器模組
 * 負責圖片清單管理、圖片切換、載入對應 Markdown、編輯與儲存
 */
const Editor = (() => {
    let images = [];
    let currentIndex = -1;
    let savedMarkdown = '';

    const els = {};

    function cacheElements() {
        els.prevBtn = document.getElementById('btn-prev');
        els.nextBtn = document.getElementById('btn-next');
        els.filename = document.getElementById('current-filename');
        els.image = document.getElementById('preview-image');
        els.mdFilename = document.getElementById('current-md-filename');
        els.saveBtn = document.getElementById('btn-save');
        els.mdEditor = document.getElementById('md-editor');
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
            savedMarkdown = await res.text();
        } else {
            savedMarkdown = '';
        }
        els.mdEditor.value = savedMarkdown;
        els.mdFilename.textContent = `${baseName}.md`;
        updateSaveBtn();
    }

    function isDirty() {
        return els.mdEditor.value !== savedMarkdown;
    }

    function confirmDiscard() {
        if (!isDirty()) return true;
        return window.confirm('尚有未儲存的變更，確定要捨棄嗎？');
    }

    function updateSaveBtn() {
        if (images.length === 0) {
            els.saveBtn.disabled = true;
            els.saveBtn.classList.remove('has-changes');
            return;
        }
        const dirty = isDirty();
        els.saveBtn.disabled = !dirty;
        els.saveBtn.classList.toggle('has-changes', dirty);
    }

    async function save() {
        if (currentIndex < 0 || !isDirty()) return;

        const baseName = images[currentIndex].filename.replace(/\.[^.]+$/, '');
        const res = await fetch(`/api/markdown/${baseName}.md`, {
            method: 'PUT',
            headers: { 'Content-Type': 'text/plain' },
            body: els.mdEditor.value,
        });

        if (res.ok) {
            savedMarkdown = els.mdEditor.value;
            updateSaveBtn();
            Toast.show('儲存成功', 'success');
        } else {
            Toast.show('儲存失敗', 'error');
        }
    }

    async function showImage(index) {
        if (index < 0 || index >= images.length) return;

        if (currentIndex >= 0 && !confirmDiscard()) return;

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
        els.saveBtn.addEventListener('click', save);

        els.mdEditor.addEventListener('input', updateSaveBtn);

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        });

        await loadImageList();

        if (images.length > 0) {
            await showImage(0);
        } else {
            updateToolbar();
        }
    }

    return { init };
})();
