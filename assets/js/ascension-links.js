(function () {
  'use strict';

  var destination = 'https://www.ascensionsenses.com/';
  var skippedParents = 'a, button, script, style, noscript, textarea, option';
  var linking = false;

  function linkText(root) {
    if (linking || !root) return;
    linking = true;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf('ASCENSION') === -1) continue;
      if (node.parentElement && node.parentElement.closest(skippedParents)) continue;
      nodes.push(node);
    }

    nodes.forEach(function (textNode) {
      var parts = textNode.nodeValue.split('ASCENSION');
      var fragment = document.createDocumentFragment();

      parts.forEach(function (part, index) {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (index < parts.length - 1) {
          var link = document.createElement('a');
          link.href = destination;
          link.className = 'ascension-hot-link';
          link.textContent = 'ASCENSION';
          link.style.color = 'inherit';
          link.style.textDecoration = 'underline';
          link.style.textUnderlineOffset = '0.16em';
          fragment.appendChild(link);
        }
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    linking = false;
  }

  function start() {
    linkText(document.body);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (addedNode) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            linkText(addedNode.parentNode);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            linkText(addedNode);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
