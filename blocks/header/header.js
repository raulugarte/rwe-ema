import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// RWE brand logo (inline SVG captured from the source header). Rendered in place
// of the plain "RWE" brand link text so the nav fragment stays portable — the
// flat DA/EDS plain.html carries only text, and the JS supplies the mark.
const RWE_LOGO_SVG = '<svg viewBox="0 0 100 29" width="100" height="29" role="img" aria-label="RWE" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M77.293,0.037 C75.961,0.037 74.938,1.041 74.938,2.392 L74.938,26.308 C74.938,27.609 75.992,28.663 77.293,28.663 L99.99,28.663 L99.99,22.936 L82.207,22.936 L82.207,16.813 L96.956,16.813 L96.956,11.32 L82.207,11.32 L82.207,5.585 L99.79,5.585 L99.79,0.037 z M17.091,13.483 L12.46,13.483 C11.654,13.483 11.153,14.361 11.564,15.055 L20.365,28.663 L29.026,28.663 L21.183,18.059 C24.975,17.565 28.122,15.573 28.122,9.293 C28.122,2.683 25.274,0.037 18.287,0.037 L2.365,0.037 C1.034,0.037 0.01,1.041 0.01,2.392 L0.01,28.663 L7.535,28.663 L7.535,5.484 L17.2,5.484 C20.04,5.484 21.131,6.791 21.131,9.433 C21.131,11.687 19.913,13.483 17.091,13.483 M44.883,27.467 C44.623,28.185 43.941,28.663 43.178,28.663 L38.654,28.663 C37.815,28.663 37.085,28.087 36.891,27.272 L30.381,0.037 L38.091,0.037 L41.67,17.701 L47.296,1.262 C47.547,0.529 48.236,0.037 49.011,0.037 L52.973,0.037 C53.748,0.037 54.437,0.529 54.688,1.262 L60.314,17.701 L63.893,0.037 L71.603,0.037 L65.094,27.272 C64.899,28.087 64.169,28.663 63.33,28.663 L58.807,28.663 C58.043,28.663 57.361,28.185 57.101,27.467 L50.992,10.591 z"></path></svg>';

// Magnifier glyph for the Search affordance (matches RWE's right-cluster search).
const SEARCH_ICON_SVG = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8.5 3a5.5 5.5 0 1 0 3.9 9.4l4.1 4.1M8.5 3a5.5 5.5 0 0 1 3.9 9.4"></path></svg>';

// Shown when the demo search is submitted. Deliberately generic — this control
// is a visual/accessibility demo only and is not wired to any search service.
const SEARCH_DEMO_NOTE = 'Search is not connected in this demo';

/**
 * Builds the Search affordance for the right utility cluster: a toggle button
 * (magnifier + "Search" label, matching the original bar) that expands an
 * accessible search input in place. This is a DEMO-ONLY control — it is not
 * connected to any search backend, API route, or external service. Submitting
 * (Enter or the form's submit) is prevented and surfaces a discreet notice
 * instead of performing any navigation or network request.
 * @returns {{item: HTMLLIElement, close: Function}}
 */
function buildSearch() {
  const item = document.createElement('li');
  item.className = 'nav-search';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open search');
  toggle.innerHTML = `<span class="nav-search-label">Search</span>${SEARCH_ICON_SVG}`;

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.hidden = true;

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'nav-search-input';
  input.setAttribute('aria-label', 'Search');
  input.placeholder = 'Search…';

  // Discreet, screen-reader-announced notice; empty until the user submits.
  const note = document.createElement('p');
  note.className = 'nav-search-note';
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');

  form.append(input, note);

  // Demo control: never navigate or hit a network endpoint. Pressing Enter
  // submits the form, which we cancel and answer with the discreet notice.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = SEARCH_DEMO_NOTE;
  });

  const close = () => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open search');
    form.hidden = true;
    note.textContent = '';
  };
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close search');
    form.hidden = false;
    input.focus();
  };
  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') close(); else open();
  });
  // Escape closes the field even while focus is inside the input.
  form.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') { close(); toggle.focus(); }
  });

  item.append(toggle, form);
  return { item, close };
}

/**
 * Collapses all expanded nav sections in the Menu drawer.
 * @param {Element} sections The nav-sections container
 */
function collapseAllNavSections(sections) {
  if (!sections) return;
  sections.querySelectorAll('.default-content-wrapper > ul > li[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Opens/closes the Menu drawer (the primary navigation overlay). The RWE header
 * keeps all primary sections behind a single "Menu" button at every width, so
 * this toggle is not gated by breakpoint.
 * @param {Element} nav The nav element
 * @param {Element} navSections The nav-sections drawer
 * @param {Boolean|null} forceExpanded Optional explicit state
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // sub-menus always start collapsed when the drawer opens/closes
  collapseAllNavSections(navSections);
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  if (!nav || nav.getAttribute('aria-expanded') !== 'true') return;
  const navSections = nav.querySelector('.nav-sections');
  toggleMenu(nav, navSections);
  const button = nav.querySelector('.nav-hamburger button');
  if (button) button.focus();
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment. This project serves content under /content, so the
  // nav fragment lives at /content/nav (a `nav` metadata value still overrides).
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/content/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand: replace the plain "RWE" text with the inline logo SVG (keeps <a>).
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
    const brandAnchor = navBrand.querySelector('a');
    if (brandAnchor) {
      brandAnchor.setAttribute('aria-label', 'RWE — home');
      brandAnchor.innerHTML = RWE_LOGO_SVG;
    }
  }

  // Primary sections live behind the Menu button as click-to-expand accordions
  // (the RWE mega-menu is an overlay, not an inline bar).
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const submenu = navSection.querySelector(':scope > ul');
      if (submenu) navSection.classList.add('nav-drop');
      navSection.setAttribute('aria-expanded', 'false');
      navSection.addEventListener('click', (e) => {
        // clicks inside the section's own submenu navigate; only the section
        // row (its top-level label/caret) toggles the accordion open/closed.
        if (submenu && submenu.contains(e.target)) return;
        if (!submenu) return;
        e.preventDefault();
        const expanded = navSection.getAttribute('aria-expanded') === 'true';
        navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    });
  }

  // Utility links: the RWE bar splits them — Contact + Apps & Tools sit in the
  // left cluster next to Menu; RWE Global + Search + language stay on the right.
  const navTools = nav.querySelector('.nav-tools');
  let leftToolsList = null;
  const search = buildSearch();
  if (navTools) {
    const toolsList = navTools.querySelector('ul');
    if (toolsList) {
      toolsList.setAttribute('aria-label', 'Utility navigation');
      const items = [...toolsList.children];
      if (items.length > 2) {
        leftToolsList = document.createElement('ul');
        leftToolsList.setAttribute('aria-label', 'Quick links');
        // first two items (Contact, Apps & Tools) move to the left cluster
        leftToolsList.append(items[0], items[1]);
      }
      // Search sits between RWE Global and the language item (matches RWE order:
      // RWE Global · Search · language). Insert before the last remaining item.
      const lastItem = toolsList.lastElementChild;
      if (lastItem) toolsList.insertBefore(search.item, lastItem);
      else toolsList.append(search.item);
    }
  }

  // Menu button (hamburger + "Menu" label) opens the primary-nav drawer.
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
      <span class="nav-hamburger-label">Menu</span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));

  // Left cluster: Menu + Contact + Apps & Tools.
  const navMenu = document.createElement('div');
  navMenu.className = 'nav-menu';
  navMenu.append(hamburger);
  if (leftToolsList) navMenu.append(leftToolsList);

  // Re-order for a sensible tab order: Menu cluster, logo, right utilities,
  // then the (overlay) sections drawer.
  nav.prepend(navMenu);
  if (navBrand) nav.append(navBrand);
  if (navTools) nav.append(navTools);
  if (navSections) nav.append(navSections);

  nav.setAttribute('aria-expanded', 'false');
  window.addEventListener('keydown', closeOnEscape);
  // Escape also collapses the search field; a click outside the header dismisses it.
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') search.close(); });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) search.close(); });
  // close the drawer when focus leaves the header entirely
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget) && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, navSections);
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Transparent-over-hero header: add `.is-scrolled` once the page scrolls past
  // the hero so the bar gains its solid gradient background and stays legible
  // over light content (matches RWE's header behaviour). Threshold is a small
  // offset; rAF-throttled to avoid layout thrash.
  let ticking = false;
  const applyScrollState = () => {
    navWrapper.classList.toggle('is-scrolled', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(applyScrollState);
      ticking = true;
    }
  }, { passive: true });
  applyScrollState();
}
