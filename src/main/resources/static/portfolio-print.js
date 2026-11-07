(function () {
    var btn = document.getElementById('pdfBtn');
    if (btn) btn.addEventListener('click', function () { window.print(); });

    // /u/name?print=1 opens the print window automatically (used by the editor's "Download PDF")
    if (/[?&]print=1/.test(location.search)) {
        window.addEventListener('load', function () {
            var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
            ready.then(function () { setTimeout(function () { window.print(); }, 300); });
        });
    }
})();
