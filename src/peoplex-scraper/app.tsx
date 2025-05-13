// import { render } from 'solid-js/web';
// import { getPanel } from '@violentmonkey/ui';
import { getSources } from './collectpc';

// global CSS
// import globalCss from './style.css';
// CSS modules
// import { stylesheet } from './style.module.css';

console.log(
  '%cstarting peoplex-scraper helper...',
  'font-size: 2em; color: red;',
);

window.addEventListener('load', () => {
  initializeApp();
});

function initializeApp() {
  // Let's create a movable panel using @violentmonkey/ui
  // const panel = getPanel({
  //   theme: 'dark',
  //   style: [globalCss, stylesheet].join('\n'),
  // });
  // render(() => panel);

  GM_registerMenuCommand('get sources', getSources);
}
