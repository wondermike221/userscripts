import { register } from '@violentmonkey/shortcut';
import { IPanelResult } from '@violentmonkey/ui';

export default function initShortcuts(mainPanel: IPanelResult) {
  // document.addEventListener('keydown', customHandleKey);
  mainPanel.hide();
  let panelToggle = true;
  const shortcuts = [
    {
      key: ['alt-`', 'ctrlcmd-k `'],
      description: 'Toggle main panel',
      action: () => {
        console.debug('a-`');
        if (panelToggle) {
          mainPanel.hide();
          panelToggle = false;
        } else {
          mainPanel.show();
          panelToggle = true;
        }
      },
    },
  ];

  shortcuts.forEach((item) => {
    item.key.forEach((k) => {
      register(k, item.action);
    });
  });
}

/* function customHandleKey(e) {
   if (e.ctrlKey && e.altKey && isNumericKey(e)) {
    console.debug('ctrl + alt + numeric key pressed');
    const i = whatNumeralKey(e);
    // const cells = getCells(i);
    copyTextToClipboard(`cells at ${i}`);
    showToast('Copied cells to clipboard', { theme: 'dark' });
    e.preventDefault();
  }

function isNumericKey(e) {
  // Get the key value as a string
  const key = e.key;
  // Check if the key is a numeric character (0-9)
  return key >= '0' && key <= '9';
}

function whatNumeralKey(e) {
  // Get the key value as a string
  const key = e.key;
  // Check if the key is a numeric character (0-9)
  if (key >= '0' && key <= '9') {
    // Return the numeric value of the key
    return parseInt(key, 10);
  } else {
    // Return null or some other value to indicate a non-numeric key
    return null;
  }
}
*/
