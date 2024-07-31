import { register } from '@violentmonkey/shortcut';
import { IPanelResult, showToast } from '@violentmonkey/ui';
import { copyTextToClipboard } from '../../utils';
import scrapeCollectPC from './collectpc';

export default function initShortcuts(mainPanel: IPanelResult) {
  document.addEventListener('keydown', customHandleKey);
  // addEventListener(document.body, 'keydown', handleKeyWithFocusCheck, false);
  mainPanel.hide();
  let panelToggle = false;
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
    {
      key: ['ctrl-alt-f', 'ctrlcmd-k f'],
      description: 'get cost center',
      action: () => {
        console.debug('c-a-f');
        //getCostCenter();
      },
    },
    {
      key: ['ctrl-alt-x', 'ctrlcmd-k x'],
      description: 'scrape collect pc',
      action: async () => {
        console.debug('c-a-x');
        await scrapeCollectPC();
      },
    },
    {
      key: ['ctrl-alt-p', 'ctrlcmd-k p'],
      description: 'debug',
      action: () => {
        console.debug('c-a-p');
        document
          .getElementById('loading-spinner-container')
          .classList.toggle('hidden');
      },
    },
  ];

  shortcuts.forEach((item) => {
    item.key.forEach((k) => {
      register(k, item.action);
    });
  });
}

function customHandleKey(e) {
  if (e.key === 's' && !isEditableElement(e.target)) {
    console.debug('s pressed');
    //focusSearchbar();
    e.preventDefault();
  }
  if (e.ctrlKey && e.altKey && isNumericKey(e)) {
    console.debug('ctrl + alt + numeric key pressed');
    const i = whatNumeralKey(e);
    // const cells = getCells(i);
    copyTextToClipboard(`cells at ${i}`);
    showToast('Copied cells to clipboard', { theme: 'dark' });
    e.preventDefault();
  }
}

function isEditableElement(element) {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
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
