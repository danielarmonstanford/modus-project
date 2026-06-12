(function () {
  var currentLang = localStorage.getItem('modus-lang') || 'en';
  var langBtn = document.getElementById('langBtn');
  var langLbl = document.getElementById('langLabel');

  function applyLang(lang) {
    document.documentElement.lang = lang;
    if (langLbl) langLbl.textContent = lang === 'en' ? 'FR' : 'EN';
    document.querySelectorAll('[data-en]').forEach(function (el) {
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.fr;
    });
  }

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      currentLang = currentLang === 'en' ? 'fr' : 'en';
      localStorage.setItem('modus-lang', currentLang);
      applyLang(currentLang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyLang(currentLang); });
  } else {
    applyLang(currentLang);
  }
})();
