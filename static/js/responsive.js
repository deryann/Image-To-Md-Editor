/**
 * 響應式設計模組
 * 負責小螢幕下的圖片/編輯器 Tab 切換
 */
const Responsive = (() => {
    const MOBILE_BREAKPOINT = 768;

    let panelLeft;
    let panelRight;
    let tabContainer;
    let tabs;
    let activePanel = 'left';

    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    function applyMobileState() {
        if (isMobile()) {
            if (activePanel === 'left') {
                panelLeft.classList.remove('mobile-hidden');
                panelRight.classList.add('mobile-hidden');
            } else {
                panelLeft.classList.add('mobile-hidden');
                panelRight.classList.remove('mobile-hidden');
            }
        } else {
            panelLeft.classList.remove('mobile-hidden');
            panelRight.classList.remove('mobile-hidden');
        }
    }

    function switchTab(panel) {
        activePanel = panel;

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panel);
        });

        applyMobileState();
    }

    function init() {
        panelLeft = document.querySelector('.panel-left');
        panelRight = document.querySelector('.panel-right');
        tabContainer = document.getElementById('mobile-tabs');
        tabs = tabContainer.querySelectorAll('.mobile-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.panel));
        });

        window.addEventListener('resize', applyMobileState);
        applyMobileState();
    }

    return { init };
})();
