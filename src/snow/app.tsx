import { initRouting } from './modules/routing/index';
import initShortcuts from './modules/shortcuts';
import './style.css';

window.addEventListener('load', () => {
  console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');
  const rove = initRouting();
  initShortcuts();
  GM_registerMenuCommand('Toggle main panel', () => rove.toggle());
});
