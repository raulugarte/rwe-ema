/*
 * Video block — RWE self-hosted / external video with optional poster.
 *
 * Authoring (DA table, 1 column):
 *   Row 1: "Video"                      (block name)
 *   Row 2: [optional poster image] + a link to the video file (.mp4 or Canto)
 *
 * Decoration:
 *   - Reads the poster <picture>/<img> (if any) and the video URL from the cell.
 *   - With a poster: renders the poster + a "Play Video" overlay button; the
 *     <video> (controls, preload=none) is created and played on click — matching
 *     RWE's click-to-play feature-video pattern and avoiding eager mp4 loads.
 *   - Without a poster: renders a plain <video controls preload="metadata">.
 *   - The raw URL text link is removed (it was only a fallback carrier).
 */
export default function decorate(block) {
  // The video URL is the last anchor in the block; the poster is the img (if any).
  const link = block.querySelector('a[href]');
  if (!link) return;
  const src = link.getAttribute('href');
  const posterImg = block.querySelector('picture img, img');
  const poster = posterImg ? posterImg.getAttribute('src') : '';
  const label = (posterImg && posterImg.getAttribute('alt')) || 'Play Video';

  block.textContent = '';

  const buildVideo = (autoplay) => {
    const video = document.createElement('video');
    video.setAttribute('controls', '');
    video.setAttribute('playsinline', '');
    if (poster) video.setAttribute('poster', poster);
    video.preload = autoplay ? 'auto' : 'metadata';
    const source = document.createElement('source');
    source.setAttribute('src', src);
    source.setAttribute('type', 'video/mp4');
    video.append(source);
    if (autoplay) {
      video.autoplay = true;
      video.muted = true;
    }
    return video;
  };

  if (poster) {
    // click-to-play: poster image + play overlay, video swapped in on activation
    const facade = document.createElement('button');
    facade.type = 'button';
    facade.className = 'video-facade';
    facade.setAttribute('aria-label', label);
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = poster;
    img.alt = posterImg.getAttribute('alt') || '';
    img.loading = 'lazy';
    pic.append(img);
    const play = document.createElement('span');
    play.className = 'video-play';
    play.setAttribute('aria-hidden', 'true');
    facade.append(pic, play);
    facade.addEventListener('click', () => {
      const video = buildVideo(true);
      facade.replaceWith(video);
      video.play?.();
    });
    block.append(facade);
  } else {
    block.append(buildVideo(false));
  }
}
