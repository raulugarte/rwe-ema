export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // "media + link-panel" variant (RWE "Responsibility & sustainability" beside
  // "Information for…"): a two-cell row whose FIRST cell is a media/video teaser
  // WITH a heading (title + copy + CTA overlaid on the media) and whose SECOND
  // cell is a heading + a list of links. RWE renders this NOT as a 50/50 split
  // but as a wide landscape media area (~74%) beside a narrow teal link panel
  // (~26%). Tag it with reliable classes so the CSS can target the variant
  // without a fragile :has() chain. Scoped so ordinary columns rows are
  // untouched (the media cell must itself contain the heading, which excludes
  // the "Obtaining energy" / "Explore" overlay teasers whose heading lives in
  // the sibling text cell).
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length !== 2) return;
    const [media, links] = cells;
    const isMediaCell = media.querySelector('.video, video') && media.querySelector('h3');
    const isLinkCell = links.querySelector('ul a')
      && links.querySelector('h3')
      && !links.querySelector('.video, video');
    if (isMediaCell && isLinkCell) {
      block.classList.add('columns-media-links');
      media.classList.add('columns-media');
      links.classList.add('columns-links');
    }
  });
}
