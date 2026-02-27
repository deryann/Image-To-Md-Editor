/**
 * 跨檔案搜尋模組
 * 搜尋所有 Markdown 檔案內容，支援 Find Next/Prev 接續搜尋
 */
const Searcher = (() => {
    let results = [];
    let currentIndex = -1;
    let currentQuery = '';
    let isOpen = false;

    const els = {};

    function cacheElements() {
        els.bar = document.getElementById('search-bar');
        els.input = document.getElementById('search-input');
        els.count = document.getElementById('search-count');
        els.prevBtn = document.getElementById('search-prev');
        els.nextBtn = document.getElementById('search-next');
        els.closeBtn = document.getElementById('search-close');
    }

    function open() {
        isOpen = true;
        els.bar.classList.remove('hidden');
        els.input.focus();
        els.input.select();
    }

    function close() {
        isOpen = false;
        els.bar.classList.add('hidden');
        results = [];
        currentIndex = -1;
        currentQuery = '';
        els.count.textContent = '';
    }

    async function doSearch(query) {
        if (!query.trim()) return;

        currentQuery = query;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
            Toast.show('搜尋失敗', 'error');
            return;
        }
        const data = await res.json();
        results = data.results;

        if (results.length === 0) {
            currentIndex = -1;
            els.count.textContent = '無結果';
            return;
        }

        currentIndex = 0;
        await goToMatch(currentIndex);
    }

    async function goToMatch(index) {
        if (results.length === 0 || index < 0 || index >= results.length) return;

        const match = results[index];
        currentIndex = index;

        // 跳轉到匹配的檔案
        if (match.image_filename) {
            const jumped = await Editor.showImageByFilename(match.image_filename);
            if (!jumped) return;
        }

        // 若為預覽模式，切回編輯模式
        if (Editor.isPreviewMode()) {
            Editor.togglePreview();
        }

        // 在 textarea 中選取匹配文字
        const textarea = Editor.getTextarea();
        const content = textarea.value;
        const lines = content.split('\n');

        // 計算字元偏移 (line + column → charOffset)
        let charOffset = 0;
        for (let i = 0; i < Math.min(match.line - 1, lines.length); i++) {
            charOffset += lines[i].length + 1; // +1 for newline
        }
        charOffset += match.column;

        const queryLen = currentQuery.length;
        textarea.selectionStart = charOffset;
        textarea.selectionEnd = charOffset + queryLen;
        textarea.focus();

        // 捲動到選取位置
        // 使用 scrollIntoView 技巧：暫時設定 selectionEnd 觸發瀏覽器自動捲動
        textarea.blur();
        textarea.selectionStart = charOffset;
        textarea.selectionEnd = charOffset + queryLen;
        textarea.focus();

        updateCount();
    }

    function updateCount() {
        if (results.length === 0) {
            els.count.textContent = '無結果';
        } else {
            els.count.textContent = `${currentIndex + 1} / ${results.length}`;
        }
    }

    async function findNext() {
        if (results.length === 0) return;
        const nextIdx = (currentIndex + 1) % results.length;
        await goToMatch(nextIdx);
    }

    async function findPrev() {
        if (results.length === 0) return;
        const prevIdx = (currentIndex - 1 + results.length) % results.length;
        await goToMatch(prevIdx);
    }

    function handleSearchBarKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = els.input.value;
            if (e.shiftKey) {
                findPrev();
            } else if (query !== currentQuery) {
                doSearch(query);
            } else {
                findNext();
            }
        } else if (e.key === 'F3') {
            e.preventDefault();
            if (e.shiftKey) {
                findPrev();
            } else {
                findNext();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }

    function handleGlobalKeydown(e) {
        // Ctrl+Shift+F 開啟搜尋列
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            open();
            return;
        }

        // F3 / Shift+F3 全域快捷鍵（搜尋列開啟時）
        if (isOpen && e.key === 'F3') {
            e.preventDefault();
            if (e.shiftKey) {
                findPrev();
            } else {
                findNext();
            }
        }
    }

    function init() {
        cacheElements();

        els.prevBtn.addEventListener('click', findPrev);
        els.nextBtn.addEventListener('click', findNext);
        els.closeBtn.addEventListener('click', close);
        els.input.addEventListener('keydown', handleSearchBarKeydown);

        document.addEventListener('keydown', handleGlobalKeydown);
    }

    return { init };
})();
