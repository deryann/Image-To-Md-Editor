/**
 * 裁切模組
 * 負責圖片拖曳框選裁切、Ctrl+C 複製裁切圖片、Ctrl+V 貼上上傳嵌入
 */
const Cropper = (() => {
    let selection = null;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    const els = {};

    function init() {
        els.container = document.getElementById('image-preview');
        els.image = document.getElementById('preview-image');
        els.overlay = document.getElementById('crop-overlay');
        els.mdEditor = document.getElementById('md-editor');

        resizeOverlay();

        const ro = new ResizeObserver(() => resizeOverlay());
        ro.observe(els.container);

        els.image.addEventListener('load', () => resizeOverlay());

        els.overlay.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection) {
                const sel = window.getSelection();
                const hasTextSelection = sel && sel.toString().length > 0;
                if (!hasTextSelection) {
                    e.preventDefault();
                    cropToClipboard();
                }
            }
        });

        els.mdEditor.addEventListener('paste', onPaste);
    }

    function resizeOverlay() {
        if (!els.image.naturalWidth) return;

        const rect = els.image.getBoundingClientRect();
        const containerRect = els.container.getBoundingClientRect();

        els.overlay.width = rect.width;
        els.overlay.height = rect.height;
        els.overlay.style.left = (rect.left - containerRect.left) + 'px';
        els.overlay.style.top = (rect.top - containerRect.top) + 'px';

        if (selection) {
            drawSelection();
        }
    }

    function onMouseDown(e) {
        e.preventDefault();
        const rect = els.overlay.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        dragging = true;
        selection = null;
        clearOverlay();
    }

    function onMouseMove(e) {
        if (!dragging) return;

        const rect = els.overlay.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, els.overlay.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, els.overlay.height));

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        const ctx = els.overlay.getContext('2d');
        clearOverlay();

        // 半透明藍色填充
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.fillRect(x, y, w, h);

        // 虛線邊框
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(x, y, w, h);
    }

    function onMouseUp(e) {
        if (!dragging) return;
        dragging = false;

        const rect = els.overlay.getBoundingClientRect();
        const endX = Math.max(0, Math.min(e.clientX - rect.left, els.overlay.width));
        const endY = Math.max(0, Math.min(e.clientY - rect.top, els.overlay.height));

        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);

        // 忽略過小的框選
        if (w < 5 || h < 5) {
            selection = null;
            clearOverlay();
            return;
        }

        // 轉換為圖片原始座標
        const scaleX = els.image.naturalWidth / els.overlay.width;
        const scaleY = els.image.naturalHeight / els.overlay.height;

        selection = {
            x: Math.round(x * scaleX),
            y: Math.round(y * scaleY),
            w: Math.round(w * scaleX),
            h: Math.round(h * scaleY),
        };

        drawSelection();
    }

    function clearOverlay() {
        const ctx = els.overlay.getContext('2d');
        ctx.clearRect(0, 0, els.overlay.width, els.overlay.height);
    }

    function drawSelection() {
        if (!selection) return;

        const scaleX = els.overlay.width / els.image.naturalWidth;
        const scaleY = els.overlay.height / els.image.naturalHeight;

        const x = selection.x * scaleX;
        const y = selection.y * scaleY;
        const w = selection.w * scaleX;
        const h = selection.h * scaleY;

        const ctx = els.overlay.getContext('2d');
        clearOverlay();

        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(x, y, w, h);
    }

    async function cropToClipboard() {
        if (!selection) return;

        const offscreen = document.createElement('canvas');
        offscreen.width = selection.w;
        offscreen.height = selection.h;

        const ctx = offscreen.getContext('2d');
        ctx.drawImage(
            els.image,
            selection.x, selection.y, selection.w, selection.h,
            0, 0, selection.w, selection.h
        );

        try {
            const blob = await new Promise((resolve) =>
                offscreen.toBlob(resolve, 'image/png')
            );
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
            ]);
            Toast.show('已複製裁切圖片', 'success');
        } catch (err) {
            Toast.show('複製失敗：' + err.message, 'error');
        }
    }

    async function onPaste(e) {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;

        let imageFile = null;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                imageFile = item.getAsFile();
                break;
            }
        }

        if (!imageFile) return;

        e.preventDefault();

        const baseName = Editor.getBaseName();
        if (!baseName) {
            Toast.show('尚未選擇圖片，無法嵌入', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);

        try {
            const res = await fetch(`/api/embedded-images?base_name=${encodeURIComponent(baseName)}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                Toast.show('圖片上傳失敗', 'error');
                return;
            }

            const data = await res.json();
            const mdImage = `![image](${data.path})`;

            // 插入至游標位置
            const textarea = els.mdEditor;
            const pos = textarea.selectionStart;
            const before = textarea.value.substring(0, pos);
            const after = textarea.value.substring(textarea.selectionEnd);
            textarea.value = before + mdImage + after;
            textarea.selectionStart = textarea.selectionEnd = pos + mdImage.length;

            // 觸發 input 事件以更新儲存按鈕狀態
            textarea.dispatchEvent(new Event('input'));

            Toast.show('圖片已嵌入', 'success');
        } catch (err) {
            Toast.show('圖片上傳失敗：' + err.message, 'error');
        }
    }

    return { init };
})();
