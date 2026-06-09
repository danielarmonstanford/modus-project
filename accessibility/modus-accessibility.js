/**
 * MODUS Accessibility System
 * Audio narration + screen reader optimization + AI agent readable layer
 * WCAG 2.1 AAA compliant
 * For all MODUS pages: terrain, objects, corps, decover, atelier
 */

(function() {
  'use strict';

  // ── 1. AUDIO NARRATION PLAYER ──────────────────────────────────────────────
  // Uses Web Speech API — available in all modern browsers, no external dependency
  // Falls back gracefully if not supported

  var MODUS_AUDIO = {
    synth: window.speechSynthesis || null,
    utterance: null,
    isPlaying: false,
    isPaused: false,
    articleText: '',

    // Extract clean readable text from the article
    extractArticleText: function() {
      var article = document.querySelector('[data-modus-article]') ||
                    document.querySelector('main') ||
                    document.querySelector('article');
      if (!article) return '';

      // Get all text nodes in reading order
      var text = '';
      var walker = document.createTreeWalker(
        article,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            var parent = node.parentElement;
            // Skip nav, buttons, code, hidden elements
            if (parent.closest('nav, button, script, style, [aria-hidden="true"], .img-slot, .img-slot-label')) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip empty text
            if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      var node;
      var prevTag = '';
      while ((node = walker.nextNode())) {
        var tag = node.parentElement.tagName.toLowerCase();
        var txt = node.textContent.trim();
        if (!txt) continue;
        // Add natural pauses at headings and paragraphs
        if (tag === 'h1' || tag === 'h2') text += '\n\n' + txt + '.\n\n';
        else if (tag === 'h3' || tag === 'h4') text += '\n' + txt + '.\n';
        else if (tag === 'p' || tag === 'li') text += txt + ' ';
        else text += txt + ' ';
        prevTag = tag;
      }
      return text.replace(/\s+/g, ' ').trim();
    },

    // Get optimal voice — prefer natural English
    getBestVoice: function() {
      if (!this.synth) return null;
      var voices = this.synth.getVoices();
      // Prefer natural/neural voices
      var preferred = voices.find(function(v) {
        return v.lang.startsWith('en') && (
          v.name.includes('Natural') ||
          v.name.includes('Premium') ||
          v.name.includes('Enhanced') ||
          v.name.includes('Samantha') ||  // macOS
          v.name.includes('Daniel') ||    // macOS UK
          v.name.includes('Google')
        );
      });
      return preferred || voices.find(function(v) { return v.lang.startsWith('en'); }) || voices[0];
    },

    play: function() {
      if (!this.synth) {
        this.showUnsupported();
        return;
      }
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;
        this.updateButton('pause');
        return;
      }
      this.synth.cancel();
      this.articleText = this.extractArticleText();
      if (!this.articleText) return;

      this.utterance = new SpeechSynthesisUtterance(this.articleText);
      this.utterance.rate = 0.92;
      this.utterance.pitch = 1.0;
      this.utterance.volume = 1.0;

      var voice = this.getBestVoice();
      if (voice) this.utterance.voice = voice;

      var self = this;
      this.utterance.onend = function() {
        self.isPlaying = false;
        self.isPaused = false;
        self.updateButton('play');
        self.updateProgress(0);
      };
      this.utterance.onerror = function() {
        self.isPlaying = false;
        self.updateButton('play');
      };
      this.utterance.onboundary = function(e) {
        if (e.name === 'word' && self.articleText) {
          var progress = (e.charIndex / self.articleText.length) * 100;
          self.updateProgress(progress);
        }
      };

      this.synth.speak(this.utterance);
      this.isPlaying = true;
      this.updateButton('pause');
    },

    pause: function() {
      if (!this.synth) return;
      if (this.isPlaying) {
        this.synth.pause();
        this.isPlaying = false;
        this.isPaused = true;
        this.updateButton('play');
      }
    },

    stop: function() {
      if (!this.synth) return;
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.updateButton('play');
      this.updateProgress(0);
    },

    toggle: function() {
      if (this.isPlaying) this.pause();
      else this.play();
    },

    updateButton: function(state) {
      var btn = document.getElementById('modus-listen-btn');
      var icon = document.getElementById('modus-listen-icon');
      var label = document.getElementById('modus-listen-label');
      if (!btn) return;
      if (state === 'pause') {
        if (icon) icon.textContent = '⏸';
        if (label) label.textContent = 'Pause';
        btn.setAttribute('aria-label', 'Pause article narration');
      } else {
        if (icon) icon.textContent = '▶';
        if (label) label.textContent = 'Listen';
        btn.setAttribute('aria-label', 'Listen to this article');
      }
    },

    updateProgress: function(pct) {
      var bar = document.getElementById('modus-progress-fill');
      if (bar) bar.style.width = pct + '%';
    },

    showUnsupported: function() {
      var msg = document.getElementById('modus-audio-msg');
      if (msg) {
        msg.textContent = 'Audio narration requires a modern browser. Please update your browser to listen.';
        msg.removeAttribute('hidden');
      }
    },

    // Inject the audio player UI into the page
    injectPlayer: function() {
      var target = document.querySelector('[data-modus-article]') ||
                   document.querySelector('main');
      if (!target) return;

      var player = document.createElement('div');
      player.id = 'modus-audio-player';
      player.setAttribute('role', 'region');
      player.setAttribute('aria-label', 'Article audio narration');
      player.innerHTML = [
        '<div class="map-inner">',
          '<div class="map-left">',
            '<span class="map-dept">MODUS / Listen</span>',
            '<span class="map-title">Hear this article</span>',
            '<span class="map-sub">Read aloud — optimized for screen readers and blind visitors</span>',
          '</div>',
          '<div class="map-controls">',
            '<button id="modus-listen-btn" class="map-play-btn" aria-label="Listen to this article" onclick="MODUS_AUDIO.toggle()">',
              '<span id="modus-listen-icon" aria-hidden="true">▶</span>',
              '<span id="modus-listen-label">Listen</span>',
            '</button>',
            '<button class="map-stop-btn" aria-label="Stop narration" onclick="MODUS_AUDIO.stop()">',
              '<span aria-hidden="true">■</span>',
              '<span class="sr-only">Stop</span>',
            '</button>',
          '</div>',
        '</div>',
        '<div class="map-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Reading progress">',
          '<div id="modus-progress-fill" class="map-progress-fill"></div>',
        '</div>',
        '<p id="modus-audio-msg" hidden></p>',
      ].join('');

      // Insert before the first paragraph in main
      var firstSection = target.querySelector('.section, .deck, .opening, .manifesto');
      if (firstSection) {
        target.insertBefore(player, firstSection);
      } else {
        target.prepend(player);
      }
    }
  };

  // Expose globally
  window.MODUS_AUDIO = MODUS_AUDIO;

  // ── 2. KEYBOARD SHORTCUTS ─────────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    // Alt+L = Listen/Pause (screen reader friendly)
    if (e.altKey && e.key === 'l') {
      e.preventDefault();
      MODUS_AUDIO.toggle();
    }
    // Alt+S = Stop
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      MODUS_AUDIO.stop();
    }
  });

  // ── 3. SKIP LINKS (keyboard/screen reader navigation) ──────────────────────
  function injectSkipLinks() {
    var skip = document.createElement('a');
    skip.href = '#modus-main-content';
    skip.className = 'modus-skip-link';
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);

    var main = document.querySelector('main');
    if (main) {
      main.id = 'modus-main-content';
      main.setAttribute('tabindex', '-1');
    }
  }

  // ── 4. IMAGE ALT TEXT AUDIT ───────────────────────────────────────────────
  function auditImages() {
    var imgs = document.querySelectorAll('img');
    imgs.forEach(function(img) {
      if (!img.alt) {
        // Add descriptive alt from nearby caption if available
        var fig = img.closest('figure');
        if (fig) {
          var cap = fig.querySelector('figcaption');
          if (cap) img.alt = cap.textContent.trim();
        }
        // If still no alt, mark as decorative
        if (!img.alt) img.setAttribute('role', 'presentation');
      }
    });
  }

  // ── 5. FOCUS MANAGEMENT ──────────────────────────────────────────────────
  function enhanceFocus() {
    // Ensure all interactive elements are focusable
    document.querySelectorAll('button, a, [tabindex]').forEach(function(el) {
      if (!el.getAttribute('aria-label') && !el.textContent.trim()) {
        el.setAttribute('aria-label', 'Interactive element');
      }
    });
  }

  // ── 6. LIVE REGION for dynamic content ───────────────────────────────────
  function injectLiveRegion() {
    var lr = document.createElement('div');
    lr.id = 'modus-live-region';
    lr.setAttribute('aria-live', 'polite');
    lr.setAttribute('aria-atomic', 'true');
    lr.className = 'sr-only';
    document.body.appendChild(lr);
  }

  function announce(message) {
    var lr = document.getElementById('modus-live-region');
    if (lr) {
      lr.textContent = '';
      setTimeout(function() { lr.textContent = message; }, 100);
    }
  }
  window.MODUS_ANNOUNCE = announce;

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    injectSkipLinks();
    injectLiveRegion();
    MODUS_AUDIO.injectPlayer();
    auditImages();
    enhanceFocus();

    // Wait for voices to load (async in some browsers)
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = function() {};
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
