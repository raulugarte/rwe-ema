import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment. This project serves content under /content, so the
  // footer fragment lives at /content/footer (a `footer` metadata value overrides).
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Tag structural regions so the CSS can lay them out without the fragment
  // needing classes (DA/EDS plain.html stays flat and class-free):
  //  - first section  -> social icons + "Talk to us"      (.footer-social)
  //  - middle sections -> link-group columns               (.footer-links)
  //  - last section    -> legal bar + copyright            (.footer-legal)
  const sections = [...footer.children];
  sections.forEach((section, i) => {
    if (i === 0) section.classList.add('footer-social');
    else if (i === sections.length - 1) section.classList.add('footer-legal');
    else section.classList.add('footer-links');
  });

  block.append(footer);
}
