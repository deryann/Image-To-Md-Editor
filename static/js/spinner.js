/**
 * Loading Spinner 元件
 * 用法：Spinner.show('載入中...') / Spinner.hide()
 */
const Spinner = (() => {
    let overlay = null;

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'spinner-overlay hidden';
        overlay.innerHTML = `
            <div class="spinner-circle"></div>
            <div class="spinner-message"></div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function show(message = '載入中...') {
        if (!overlay) createOverlay();
        overlay.querySelector('.spinner-message').textContent = message;
        overlay.classList.remove('hidden');
    }

    function hide() {
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    return { show, hide };
})();
