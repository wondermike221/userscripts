import { render } from 'solid-js/web';
import { getPanel } from '@violentmonkey/ui';
import initShortcuts from './modules/root/shortcuts';
import { addTitles, addLoadingSpinner } from './modules/root/ui';
import { addObserver } from './modules/root/observer';
import Routing from './modules/routing/index';
// global CSS
import globalCss from './style.css';
// CSS modules
import { stylesheet } from './style.module.css';

console.log('%cstarting ticket scraper...', 'font-size: 2em; color: red;');

window.addEventListener('load', () => {
  initializeApp();
});

function initializeApp() {
  // Let's create a movable panel using @violentmonkey/ui
  const panel = getPanel({
    theme: 'dark',
    style: [globalCss, stylesheet].join('\n'),
  });
  Object.assign(panel.wrapper.style, {
    top: '10vh',
    left: '10vw',
  });
  panel.setMovable(true);
  initShortcuts(panel);
  addTitles();
  addObserver();
  addLoadingSpinner();
  render(Routing, panel.body);
}
