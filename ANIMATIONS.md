# MODUS — Animation & Dynamic Upgrades
## Instructions for Claude Code
> Apply these to index.html and any department page that has a hero photo.
> All vanilla JS and CSS — no libraries required.

---

## 1. Hero Parallax Scroll Effect

Add to the `<style>` block or modus.css. The `.bg` element scrolls at 40% of the page scroll speed, creating depth.

```css
/* In existing .bg rule — add will-change for GPU compositing */
.bg {
  will-change: transform;
}
```

```javascript
// Add before closing </body> tag
// Hero parallax — runs on every scroll tick via rAF
(function(){
  var bg = document.querySelector('.bg');
  if (!bg) return;
  var ticking = false;
  window.addEventListener('scroll', function(){
    if (!ticking) {
      requestAnimationFrame(function(){
        var y = window.scrollY;
        bg.style.transform = 'translateY(' + (y * 0.4) + 'px)';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
```

---

## 2. Ken Burns Slow Zoom on Hero Photo

Replaces the static background with a slow breathing zoom. Add this CSS animation to the `.bg` element on any page with a photo hero.

```css
/* Ken Burns — 20 second slow zoom, reverses */
@keyframes kenBurns {
  0%   { transform: scale(1.00) translateY(0); }
  50%  { transform: scale(1.06) translateY(-10px); }
  100% { transform: scale(1.00) translateY(0); }
}

.bg.ken-burns {
  animation: kenBurns 20s ease-in-out infinite;
  will-change: transform;
}
```

Add class `ken-burns` to the `.bg` div in HTML:
```html
<div class="bg ken-burns"></div>
```

> **Note:** Do not combine Ken Burns with the parallax scroll script above — they conflict. Use one or the other per page. Ken Burns for landing pages (more cinematic), parallax for department pages (more editorial).

---

## 3. Scroll-Triggered Reveals on Cards and Sections

Elements fade and rise into view as the reader scrolls to them. Uses the browser-native IntersectionObserver — no library needed.

```css
/* Add to modus.css */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.9s var(--ease), transform 0.9s var(--ease);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger siblings */
.reveal:nth-child(2) { transition-delay: 0.1s; }
.reveal:nth-child(3) { transition-delay: 0.2s; }
.reveal:nth-child(4) { transition-delay: 0.3s; }
.reveal:nth-child(5) { transition-delay: 0.4s; }
.reveal:nth-child(6) { transition-delay: 0.5s; }
```

```javascript
// Intersection Observer — add before </body> on any page using .reveal
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el){
    observer.observe(el);
  });
})();
```

**Apply to HTML:** Add class `reveal` to any card, section, or block you want to animate in:
```html
<div class="card reveal">...</div>
<div class="axis-block reveal">...</div>
<div class="terrain-card reveal">...</div>
```

---

## 4. MODUS Index Bars — Animate In On Scroll

The score bars draw from 0 to their target value when the Index component scrolls into view.

```css
/* Override the static fill — bars start at 0 width */
.modus-index .modus-axis-fill {
  width: 0 !important;
  transition: width 1.2s var(--ease);
}
.modus-index.animated .modus-axis-fill {
  width: var(--target-width) !important;
}
```

```javascript
// Index bar animation — add before </body> on any page with .modus-index
(function(){
  document.querySelectorAll('.modus-axis-fill').forEach(function(bar){
    var w = bar.style.width || bar.getAttribute('data-width') || '80%';
    bar.setAttribute('data-width', w);
    bar.style.setProperty('--target-width', w);
    bar.style.width = '0';
  });

  var indexObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        entry.target.querySelectorAll('.modus-axis-fill').forEach(function(bar, i){
          setTimeout(function(){
            bar.style.width = bar.getAttribute('data-width');
          }, i * 120);
        });
        indexObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.modus-index').forEach(function(el){
    indexObserver.observe(el);
  });
})();
```

---

## 5. Navigation — Colour Morph on Scroll

The nav transitions from transparent (on a dark hero) to cream (when the reader has scrolled past the hero) automatically.

```css
/* Add to modus.css nav section */
.nav {
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}
.nav.scrolled {
  background: rgba(240, 232, 213, 0.96) !important;
  border-color: var(--border) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 0 var(--border);
}
.nav.scrolled .nav-link { color: var(--mid) !important; }
.nav.scrolled .nav-link:hover { color: var(--navy) !important; }
```

```javascript
// Nav scroll morph — add before </body> on pages with .nav.dark hero
(function(){
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var heroH = window.innerHeight * 0.5;
  window.addEventListener('scroll', function(){
    if (window.scrollY > heroH) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
})();
```

---

## 6. Gold Dot Custom Cursor (editorial sections only)

On editorial text areas, the cursor becomes a small gold circle — a refined touch that signals you are in a curated space.

```css
/* Add to modus.css */
.editorial-cursor { cursor: none; }

.gold-cursor {
  width: 8px; height: 8px;
  background: var(--gold);
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: transform 0.15s var(--ease), opacity 0.2s ease, width 0.2s var(--ease), height 0.2s var(--ease);
  mix-blend-mode: multiply;
}
.gold-cursor.hovering {
  width: 28px; height: 28px;
  background: rgba(212,168,75,0.18);
  border: 0.5px solid var(--gold);
}
```

```javascript
// Custom gold cursor — add before </body> on pages where you want it
(function(){
  var cursor = document.createElement('div');
  cursor.className = 'gold-cursor';
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', function(e){
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Expand on links and buttons
  document.querySelectorAll('a, button').forEach(function(el){
    el.addEventListener('mouseenter', function(){ cursor.classList.add('hovering'); });
    el.addEventListener('mouseleave', function(){ cursor.classList.remove('hovering'); });
  });

  // Add editorial-cursor class to the article or main content area
  var editorial = document.querySelector('.article, .intro-section, .body-text');
  if (editorial) editorial.classList.add('editorial-cursor');
})();
```

---

## 7. Horizontal Scroll Department Strip (for homepage future use)

A touch-scrollable department navigation strip — horizontal scroll on mobile, mouse-drag on desktop.

```css
.dept-strip {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: var(--space-4) var(--gutter);
  border-top: 0.5px solid var(--border);
  border-bottom: 0.5px solid var(--border);
}
.dept-strip::-webkit-scrollbar { display: none; }
.dept-strip-item {
  scroll-snap-align: start;
  flex-shrink: 0;
  font-family: var(--font-ui);
  font-size: var(--text-micro);
  letter-spacing: var(--track-widest);
  text-transform: uppercase;
  color: var(--mid);
  white-space: nowrap;
  padding: var(--space-1) 0;
  border-bottom: 1px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}
.dept-strip-item:hover,
.dept-strip-item.active {
  color: var(--navy);
  border-color: var(--gold);
}
```

```html
<!-- Add below nav on homepage when departments are live -->
<div class="dept-strip" role="navigation" aria-label="MODUS departments">
  <a class="dept-strip-item" href="/terrain">Terrain</a>
  <a class="dept-strip-item" href="/objects">Objects</a>
  <a class="dept-strip-item" href="/spatial">Spatial</a>
  <a class="dept-strip-item" href="/decover">Décover</a>
  <a class="dept-strip-item" href="/atelier">Atelier</a>
  <a class="dept-strip-item" href="/collections">Collections</a>
  <a class="dept-strip-item" href="/wellness">Wellness</a>
  <a class="dept-strip-item" href="/figures">Figures</a>
</div>
```

---

## Implementation Order for Claude Code

Apply in this order — each step is independent and won't break the others:

1. Add Ken Burns to `index.html` hero (most impactful, one CSS class change)
2. Add nav scroll morph to `index.html` and all department pages
3. Add scroll reveals to cards on department pages
4. Add Index bar animation to `methodology/index.html`
5. Add gold cursor to `methodology/index.html` and article pages
6. Add department strip to `index.html` when 3+ departments are live

Each animation block above is self-contained. Copy the CSS into modus.css and the JS block before `</body>` on the relevant page.
