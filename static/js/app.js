/**
 * 應用程式主進入點
 */
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Router.init();
    Editor.init();
    Cropper.init();
    Searcher.init();
    Browser.init();
});
