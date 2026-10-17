// Abertura com a logo: só na primeira visita da sessão e sem "reduzir movimento"
(function () {
  var root = document.documentElement, ok = function () { root.classList.remove('fonts-wait'); };
  root.classList.add('fonts-wait');
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('800 1em Archivo'), document.fonts.load('400 1em Archivo')]).then(ok, ok);
  } else ok();
  setTimeout(ok, 1500);
})();
(function () {
  var seen = false;
  try { seen = sessionStorage.getItem('apoio-intro') === '1'; } catch (e) {}
  if (!seen && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('intro-on');
    setTimeout(function () { document.documentElement.classList.remove('intro-on'); }, 6000);
  }
})();
