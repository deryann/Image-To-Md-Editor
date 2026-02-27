/**
 * 檔案瀏覽器模組
 * 負責檔案列表顯示、上傳、重新命名、刪除、編輯導航
 */
const Browser = (() => {
    let files = [];
    let selectedFile = null;    // 目前選中的檔案（用於 rename / delete）
    let uploadFile = null;      // 待上傳的檔案
    const els = {};

    function cacheElements() {
        els.fileList = document.getElementById('file-list');
        els.btnUpload = document.getElementById('btn-upload');
        // 上傳對話框
        els.uploadModal = document.getElementById('upload-modal');
        els.dropZone = document.getElementById('drop-zone');
        els.fileInput = document.getElementById('file-input');
        els.selectedFilename = document.getElementById('selected-filename');
        els.uploadCancel = document.getElementById('upload-cancel');
        els.uploadConfirm = document.getElementById('upload-confirm');
        // 重新命名對話框
        els.renameModal = document.getElementById('rename-modal');
        els.renameOriginal = document.getElementById('rename-original');
        els.renameInput = document.getElementById('rename-input');
        els.renameCancel = document.getElementById('rename-cancel');
        els.renameConfirm = document.getElementById('rename-confirm');
        // 刪除對話框
        els.deleteModal = document.getElementById('delete-modal');
        els.deleteMessage = document.getElementById('delete-message');
        els.deletePairLabel = document.getElementById('delete-pair-label');
        els.deletePairCheck = document.getElementById('delete-pair-check');
        els.deletePairText = document.getElementById('delete-pair-text');
        els.deleteCancel = document.getElementById('delete-cancel');
        els.deleteConfirm = document.getElementById('delete-confirm');
    }

    async function loadFiles() {
        try {
            const res = await fetch('/api/files');
            if (!res.ok) throw new Error();
            files = await res.json();
            renderTable();
        } catch {
            Toast.show('無法載入檔案清單', 'error');
        }
    }

    function renderTable() {
        els.fileList.innerHTML = files.map(file => {
            const isImage = file.type === 'image';
            const typeBadge = isImage
                ? '<span class="type-badge type-image">圖片</span>'
                : '<span class="type-badge type-markdown">Markdown</span>';
            const pairStatus = file.has_pair ? '✅ 已配對' : '⚠️ 未配對';
            return `<tr>
                <td>${escapeHtml(file.filename)}</td>
                <td>${typeBadge}</td>
                <td>${pairStatus}</td>
                <td>
                    <button class="file-action-btn" title="編輯" data-action="edit" data-filename="${escapeAttr(file.filename)}">✏️</button>
                    <button class="file-action-btn" title="重新命名" data-action="rename" data-filename="${escapeAttr(file.filename)}">📝</button>
                    <button class="file-action-btn" title="刪除" data-action="delete" data-filename="${escapeAttr(file.filename)}">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function findFile(filename) {
        return files.find(f => f.filename === filename);
    }

    // === 表格事件委派 ===
    function handleTableClick(e) {
        const btn = e.target.closest('.file-action-btn');
        if (!btn) return;
        const filename = btn.dataset.filename;
        const action = btn.dataset.action;
        const file = findFile(filename);
        if (!file) return;

        if (action === 'edit') editFile(file);
        else if (action === 'rename') openRenameModal(file);
        else if (action === 'delete') openDeleteModal(file);
    }

    // === 上傳 ===
    function openUploadModal() {
        uploadFile = null;
        els.selectedFilename.textContent = '';
        els.uploadConfirm.disabled = true;
        els.fileInput.value = '';
        els.uploadModal.classList.remove('hidden');
    }

    function closeUploadModal() {
        els.uploadModal.classList.add('hidden');
        uploadFile = null;
    }

    function handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            Toast.show('請選取圖片檔案', 'error');
            return;
        }
        uploadFile = file;
        els.selectedFilename.textContent = file.name;
        els.uploadConfirm.disabled = false;
    }

    async function doUpload() {
        if (!uploadFile) return;
        els.uploadConfirm.disabled = true;
        Spinner.show('上傳中...');
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const filename = data.filename;
            const baseName = filename.replace(/\.[^.]+$/, '');

            // 建立初始 Markdown
            await fetch(`/api/markdown/${baseName}.md`, {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain' },
                body: `![image](../images/${filename})`,
            });

            Toast.show('上傳成功', 'success');
            closeUploadModal();
            await loadFiles();
        } catch {
            Toast.show('上傳失敗', 'error');
        } finally {
            Spinner.hide();
            els.uploadConfirm.disabled = false;
        }
    }

    // === 重新命名 ===
    function openRenameModal(file) {
        selectedFile = file;
        els.renameOriginal.textContent = `原檔名：${file.filename}`;
        els.renameInput.value = file.filename.replace(/\.[^.]+$/, '');
        els.renameModal.classList.remove('hidden');
        els.renameInput.focus();
        els.renameInput.select();
    }

    function closeRenameModal() {
        els.renameModal.classList.add('hidden');
        selectedFile = null;
    }

    async function doRename() {
        if (!selectedFile) return;
        const newName = els.renameInput.value.trim();
        if (!newName) {
            Toast.show('檔名不可為空', 'error');
            return;
        }

        const ext = selectedFile.filename.match(/\.[^.]+$/)?.[0] || '';
        const fullNewName = newName + ext;
        if (fullNewName === selectedFile.filename) {
            closeRenameModal();
            return;
        }

        Spinner.show('重新命名中...');
        try {
            const endpoint = selectedFile.type === 'image'
                ? `/api/images/${selectedFile.filename}/rename`
                : `/api/markdown/${selectedFile.filename}/rename`;
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_name: fullNewName }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || '重新命名失敗');
            }
            Toast.show('重新命名成功', 'success');
            closeRenameModal();
            await loadFiles();
        } catch (e) {
            Toast.show(e.message || '重新命名失敗', 'error');
        } finally {
            Spinner.hide();
        }
    }

    // === 刪除 ===
    function openDeleteModal(file) {
        selectedFile = file;
        els.deleteMessage.textContent = `確定要刪除「${file.filename}」嗎？`;
        els.deletePairCheck.checked = false;

        if (file.has_pair) {
            const baseName = file.filename.replace(/\.[^.]+$/, '');
            const pairName = file.type === 'image' ? `${baseName}.md` : `${baseName} 的圖片`;
            els.deletePairText.textContent = `同時刪除關聯檔案（${pairName}）`;
            els.deletePairLabel.style.display = '';
        } else {
            els.deletePairLabel.style.display = 'none';
        }
        els.deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        els.deleteModal.classList.add('hidden');
        selectedFile = null;
    }

    async function doDelete() {
        if (!selectedFile) return;
        const deletePair = els.deletePairCheck.checked && selectedFile.has_pair;

        Spinner.show('刪除中...');
        try {
            // 刪除主檔案
            const mainEndpoint = selectedFile.type === 'image'
                ? `/api/images/${selectedFile.filename}`
                : `/api/markdown/${selectedFile.filename}`;
            const res = await fetch(mainEndpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error();

            // 若勾選，同時刪除關聯檔案
            if (deletePair) {
                const baseName = selectedFile.filename.replace(/\.[^.]+$/, '');
                if (selectedFile.type === 'image') {
                    await fetch(`/api/markdown/${baseName}.md`, { method: 'DELETE' });
                } else {
                    // 找對應圖片
                    const pairFile = files.find(f =>
                        f.type === 'image' && f.filename.replace(/\.[^.]+$/, '') === baseName
                    );
                    if (pairFile) {
                        await fetch(`/api/images/${pairFile.filename}`, { method: 'DELETE' });
                    }
                }
            }

            Toast.show('刪除成功', 'success');
            closeDeleteModal();
            await loadFiles();
        } catch {
            Toast.show('刪除失敗', 'error');
        } finally {
            Spinner.hide();
        }
    }

    // === 編輯導航 ===
    function editFile(file) {
        const baseName = file.filename.replace(/\.[^.]+$/, '');
        // 找對應圖片檔名
        const imageFile = file.type === 'image'
            ? file
            : files.find(f => f.type === 'image' && f.filename.replace(/\.[^.]+$/, '') === baseName);
        if (imageFile) {
            Editor.showImageByFilename(imageFile.filename);
        }
        Router.navigateTo('editor');
    }

    // === 初始化 ===
    async function init() {
        cacheElements();

        // 表格事件委派
        els.fileList.addEventListener('click', handleTableClick);

        // 上傳按鈕
        els.btnUpload.addEventListener('click', openUploadModal);
        els.uploadCancel.addEventListener('click', closeUploadModal);
        els.uploadConfirm.addEventListener('click', doUpload);
        els.fileInput.addEventListener('change', () => {
            if (els.fileInput.files[0]) handleFileSelect(els.fileInput.files[0]);
        });

        // 拖曳上傳
        els.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            els.dropZone.classList.add('drag-over');
        });
        els.dropZone.addEventListener('dragleave', () => {
            els.dropZone.classList.remove('drag-over');
        });
        els.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            els.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        });

        // 重新命名
        els.renameCancel.addEventListener('click', closeRenameModal);
        els.renameConfirm.addEventListener('click', doRename);
        els.renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doRename();
        });

        // 刪除
        els.deleteCancel.addEventListener('click', closeDeleteModal);
        els.deleteConfirm.addEventListener('click', doDelete);

        // 點擊遮罩關閉
        els.uploadModal.addEventListener('click', (e) => {
            if (e.target === els.uploadModal) closeUploadModal();
        });
        els.renameModal.addEventListener('click', (e) => {
            if (e.target === els.renameModal) closeRenameModal();
        });
        els.deleteModal.addEventListener('click', (e) => {
            if (e.target === els.deleteModal) closeDeleteModal();
        });

        await loadFiles();
    }

    return { init, loadFiles };
})();
