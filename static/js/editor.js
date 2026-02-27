/**
 * 編輯器模組
 * 負責圖片清單管理、圖片切換、載入對應 Markdown、編輯與儲存
 */
const Editor = (() => {
    let images = [];
    let currentIndex = -1;
    let savedMarkdown = '';
    let previewMode = false;

    const els = {};

    function cacheElements() {
        els.prevBtn = document.getElementById('btn-prev');
        els.nextBtn = document.getElementById('btn-next');
        els.filename = document.getElementById('current-filename');
        els.image = document.getElementById('preview-image');
        els.mdFilename = document.getElementById('current-md-filename');
        els.saveBtn = document.getElementById('btn-save');
        els.mdEditor = document.getElementById('md-editor');
        els.ocrBtn = document.getElementById('btn-ocr');
        els.previewBtn = document.getElementById('btn-preview');
        els.mdPreview = document.getElementById('md-preview');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: els.mdEditor.value }),
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

    function renderPreview() {
        let html = marked.parse(els.mdEditor.value);
        // 將 ./embedded_images/ 相對路徑轉換為 /data/mds/embedded_images/
        html = html.replace(
            /src="\.\/embedded_images\//g,
            'src="/data/mds/embedded_images/'
        );
        els.mdPreview.innerHTML = html;
        // 渲染 Mermaid 圖表
        mermaid.run({ nodes: els.mdPreview.querySelectorAll('pre code.language-mermaid') });
    }

    function togglePreview() {
        previewMode = !previewMode;
        els.previewBtn.classList.toggle('active', previewMode);
        els.mdEditor.classList.toggle('hidden', previewMode);
        els.mdPreview.classList.toggle('hidden', !previewMode);
        if (previewMode) {
            renderPreview();
        }
    }

    async function ocr() {
        if (currentIndex < 0) return;

        els.ocrBtn.disabled = true;
        Spinner.show('OCR 辨識中...');
        try {
            const formData = new FormData();
            formData.append('filename', images[currentIndex].filename);
            const res = await fetch('/api/ocr', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('OCR failed');
            const data = await res.json();
            els.mdEditor.value += '\n' + data.text;
            updateSaveBtn();
            Toast.show('OCR 辨識完成', 'success');
        } catch {
            Toast.show('OCR 辨識失敗', 'error');
        } finally {
            Spinner.hide();
            els.ocrBtn.disabled = false;
        }
    }

    async function init() {
        cacheElements();
        els.prevBtn.addEventListener('click', prev);
        els.nextBtn.addEventListener('click', next);
        els.saveBtn.addEventListener('click', save);
        els.ocrBtn.addEventListener('click', ocr);
        els.previewBtn.addEventListener('click', togglePreview);

        els.mdEditor.addEventListener('input', updateSaveBtn);

        mermaid.initialize({ startOnLoad: false });

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

    function getBaseName() {
        if (currentIndex < 0) return null;
        return images[currentIndex].filename.replace(/\.[^.]+$/, '');
    }

    async function showImageByFilename(filename) {
        if (images.length === 0) await loadImageList();
        const idx = images.findIndex(img => img.filename === filename);
        if (idx >= 0) await showImage(idx);
    }

    return { init, getBaseName, showImageByFilename };
})();
