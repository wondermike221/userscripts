import { render } from 'solid-js/web';
import Routing from './modules/routing/index';
import initShortcuts, { mainPanel, toggleMainPanel } from './modules/shortcuts';

window.addEventListener('load', () => {
  console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');
  initShortcuts();
  GM_registerMenuCommand('Toggle main panel', toggleMainPanel);
  render(() => <Routing panelRef={mainPanel} />, mainPanel.body);
});
