import { render } from 'solid-js/web';
import { getPanel } from '@violentmonkey/ui';
import Routing from './modules/routing/index';
import initShortcuts from './modules/shortcuts';

// global CSS
import globalCss from './style.css';
// CSS modules
import { stylesheet } from './style.module.css';

console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');

window.addEventListener('load', () => {
  initializeApp();
});

function initializeApp() {
  // Let's create a movable panel using @violentmonkey/ui
  const panel = getPanel({
    theme: 'dark',
    style: [globalCss, stylesheet].join('\n'),
  });

  initShortcuts(panel);

  render(() => <Routing panelRef={panel} />, panel.body);
}