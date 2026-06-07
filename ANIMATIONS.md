# MODUS Animation System

> Read before adding motion to any MODUS page. Every animation decision flows from the same editorial principles as the design system: restraint, specificity, no performance.

---

## Principles

- **Motion serves content, not itself.** Animation should make something clearer or feel more considered — never decorative.
- **No libraries.** Vanilla CSS transitions + `@keyframes` + vanilla JS `IntersectionObserver` only.
- **No `!important`.** If you need it, the architecture is wrong.
- **Durations are slow by default.** MODUS is not a SaaS dashboard. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (already in modus.css as `var(--ease)`).
- **Respect `prefers-reduced-motion`.** Wrap all non-essential motion in `@media (prefers-reduced-motion: no-preference)` or check in JS.

---

## Animation Catalogue

### 1. Ken Burns — Hero image drift

**What it does:** Slowly scales and translates the hero background image over 24 seconds, creating a sense of depth on still photography.

**Where used:** `index.html` (`.bg` element)

**CSS — keyframe:**
```css
@keyframes kenBurns {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.08) translate(-1.5%, 1%); }
}
```

**CSS — apply:**
```css
.hero-bg-element {
  animation: kenBurns 24s ease-in-out forwards;
  transform-origin: center center;
}
```

**Rules:**
- Duration: 20–28s. Never shorter — fast zoom reads as cheap.
- `forwards` fill mode: the image holds its final position. Do not loop.
- Direction of drift: slightly left and down. Adjust `translate()` values if the image's subject is off-centre — the subject should never drift out of frame.
- Do not apply to `.hero-bg::after` (the gradient overlay) — it must stay fixed.

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .hero-bg-element { animation: none; }
}
```

---

### 2. Nav Scroll Morph — Navigation bar transition

**What it does:** The navigation bar transitions from transparent (floating over a dark hero) to a solid cream/dark background as the user scrolls past the hero.

**Where used:** `index.html` (`.bar`), `methodology/index.html` (`.nav`), and all department homepages.

**Two variants:**

#### Variant A — Dark page (index.html, dark-hero pages)
Nav starts transparent over dark image; morphs to dark frosted glass on scroll/wheel.

```css
/* Applied via JS when user scrolls/wheels */
.bar {
  transition: background 0.4s ease, backdrop-filter 0.4s ease;
}
.bar.is-scrolled {
  background: rgba(10, 10, 20, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

**JS (wheel/touch for overflow:hidden pages):**
```js
(function () {
  var bar = document.querySelector('.bar');
  function onScroll() { bar.classList.add('is-scrolled'); }
  window.addEventListener('wheel', onScroll, { once: true, passive: true });
  window.addEventListener('touchmove', onScroll, { once: true, passive: true });
})();
```

#### Variant B — Light page (methodology, department pages with cream hero)
Nav starts as default cream background; gains stronger visual weight on scroll.

```css
.nav {
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.nav.is-scrolled {
  background: rgba(240, 232, 213, 0.96);
  box-shadow: 0 1px 0 rgba(27, 35, 64, 0.10);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**JS (scroll-based for normal scrolling pages):**
```js
(function () {
  var nav = document.getElementById('site-nav');
  var THRESHOLD = 20; // px before morph triggers
  function update() {
    if (window.scrollY > THRESHOLD) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
```

**Rules:**
- Threshold: 20px for cream pages. Use `window.innerHeight * 0.8` for pages where the nav should stay transparent until after the hero.
- Always add the `transition` to the nav element, not just the `.is-scrolled` state.
- The logo image swap (beige ↔ navy) should accompany the background change on dark pages: `logo.src = '/assets/images/logo-navy.png'`.

---

### 3. Scroll Reveals — Section entrance animation

**What it does:** Content blocks enter with a fade + upward translate when they scroll into the viewport. Used for axis blocks, cards, and editorial sections that benefit from staged entrance.

**Where used:** `methodology/index.html` (`.axis-block` elements), available for use on any department page.

**CSS — base class:**
```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

**CSS — stagger delays (add to siblings in a group):**
```css
.reveal-delay-1 { transition-delay: 0.08s; }
.reveal-delay-2 { transition-delay: 0.16s; }
.reveal-delay-3 { transition-delay: 0.24s; }
.reveal-delay-4 { transition-delay: 0.32s; }
```

**JS — IntersectionObserver:**
```js
(function () {
  var reveals = document.querySelectorAll('.reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(function (el) { observer.observe(el); });
})();
```

**Rules:**
- `unobserve` after triggering — the animation runs once, not on every scroll.
- `threshold: 0.15` — element must be 15% visible before triggering. Prevents premature reveals.
- `rootMargin: '0px 0px -40px 0px'` — bottom margin means the element must clear 40px above the fold. Adjust to taste.
- Do not apply `.reveal` to elements above the fold on page load — they should be immediately visible.
- Maximum stagger: 4 siblings. Beyond that the delay grows annoying.

**Axis bar extension (MODUS Index bars):**

When a reveal block contains a `.axis-bar-fill`, animate the bar after reveal triggers:

```js
var fill = entry.target.querySelector('.axis-bar-fill');
if (fill) {
  var target = fill.getAttribute('data-w') || '0%';
  setTimeout(function () { fill.style.width = target; }, 120);
}
```

HTML:
```html
<div class="axis-bar-fill" data-w="90%"></div>
```

CSS (add to page `<style>`, not modus.css — it overrides the static component):
```css
.axis-bar-fill {
  width: 0;
  transition: width 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}
```

The `data-w` value must match the percentage that modus.css would otherwise receive as an inline `style="width:XX%"`. Use `data-w` instead of inline style when the bar is inside a `.reveal` block.

---

## Pre-existing Animations (index.html only)

These keyframes are defined in `index.html`'s inline `<style>` and are not part of modus.css. Do not replicate them on other pages.

| Keyframe  | Used on         | Effect                          |
|-----------|-----------------|----------------------------------|
| `riseIn`  | `.logo-wrap`    | Logo rises from below, fades in  |
| `fadeU`   | `.tagline`, `.notify` | Fades up from below         |
| `fadeD`   | `.bar`          | Nav fades down from above        |
| `drawL`   | `.rule`         | Rule line draws left to right    |
| `kenBurns`| `.bg`           | Hero image slow zoom + drift     |

---

## Reduced Motion

All non-essential animations must be disabled when the user has requested reduced motion. Add to the page `<style>` block:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .axis-bar-fill {
    transition: none;
  }
}
```

For `kenBurns` on index.html, add:
```css
@media (prefers-reduced-motion: reduce) {
  .bg { animation: none; }
}
```

---

*This file is the canonical source for all MODUS animation decisions. When in doubt, consult this file before adding motion to a page.*
