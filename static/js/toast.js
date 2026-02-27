/**
 * Toast 通知元件
 * 用法：Toast.show('訊息', 'success') 或 Toast.show('錯誤', 'error')
 */
const Toast = (() => {
    let container = null;

    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type} toast-enter`;
        toast.textContent = message;
        getContainer().appendChild(toast);

        // 觸發進入動畫
        requestAnimationFrame(() => {
            toast.classList.remove('toast-enter');
        });

        // 3 秒後淡出並移除
        setTimeout(() => {
            toast.classList.add('toast-exit');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3000);
    }

    return { show };
})();
