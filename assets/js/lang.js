(function () {
  var currentLang = localStorage.getItem('modus-lang') || 'en';
  var langBtn = document.getElementById('langBtn');
  var langLbl = document.getElementById('langLabel');

  function applyLang(lang) {
    document.documentElement.lang = lang;
    if (langLbl) {
      var narrow = window.innerWidth < 500;
      langLbl.textContent = lang === 'en' ? (narrow ? 'F' : 'FR') : (narrow ? 'E' : 'EN');
    }
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

  window.addEventListener('resize', function () { applyLang(currentLang); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyLang(currentLang); });
  } else {
    applyLang(currentLang);
  }
})();
