/**
 * Hash Router
 * 根據 URL hash 切換頁面容器的顯示
 */
const Router = (() => {
    const routes = ['editor', 'browser'];
    const defaultRoute = 'editor';

    function getCurrentPage() {
        const hash = window.location.hash;
        const match = hash.match(/^#\/(\w+)/);
        const page = match ? match[1] : null;
        return routes.includes(page) ? page : defaultRoute;
    }

    function updateView() {
        const currentPage = getCurrentPage();

        // 切換頁面容器
        routes.forEach(route => {
            const el = document.getElementById(`page-${route}`);
            if (el) {
                el.classList.toggle('active', route === currentPage);
            }
        });

        // 更新導覽列高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === currentPage);
        });
    }

    function navigateTo(path) {
        window.location.hash = `#/${path}`;
    }

    function init() {
        // 若無 hash 則導向預設路由
        if (!window.location.hash || !routes.includes(getCurrentPage())) {
            window.location.hash = `#/${defaultRoute}`;
        }
        window.addEventListener('hashchange', updateView);
        updateView();
    }

    return { init, navigateTo };
})();
