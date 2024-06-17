import { register } from '@violentmonkey/shortcut';
import { IPanelResult } from '@violentmonkey/ui';
import { copyTextToClipboard, getCells } from '../../utils';
import { scrapeAssetsUsingNameTags } from '../helix/assets';
import scrapeAndCopy from '../ticket/accessory';
import { getCostCenter } from '../ticket/index';
import { focusSearchbar } from '../root';
import scrapeCollectPC from '../ticket/collectpc';
import { setAssetStatus } from '../helix';
import { setTicketStatus } from '../ticket';

export default function initShortcuts(mainPanel: IPanelResult) {
  document.addEventListener('keydown', customHandleKey);
  // addEventListener(document.body, 'keydown', handleKeyWithFocusCheck, false);
  mainPanel.hide();
  let panelToggle = false;
  const shortcuts = {
    'a-`': () => {
      if (panelToggle) {
        mainPanel.hide();
        panelToggle = false;
      } else {
        mainPanel.show();
        panelToggle = true;
      }
    },
    'c-a-d': () => {
      console.debug('c-a-d');
      scrapeAndCopy('accessories');
    },
    'c-a-s': () => {
      console.debug('c-a-s');
      scrapeAndCopy('purchasing');
    },
    'c-a-g': () => {
      console.debug('c-a-g');
      scrapeAndCopy('cross-charge');
    },
    'c-a-x': () => {
      console.debug('c-a-x');
      scrapeCollectPC();
    },
    'c-a-c': () => {
      console.debug('c-a-c');
      if(window.location.href.includes('task')) {
        setTicketStatus('Closed', 'Success', '');
      } else {
        setTicketStatus('Completed', '', 'Self Service');
      }
    },
    'c-a-z': () => {
      console.debug('c-a-z');
      setTicketStatus('Pending', 'Supplier Delivery', 'Self Service');
    },
    'c-a-a': () => {
      console.debug('c-a-a');
      setTicketStatus('In Progress', '', '');
    },
    'c-a-w': () => {
      console.debug('c-a-w');
      const emailElement =
        document.querySelector('a[ux-id="email-value"]') ??
        document.querySelector('a[ux-id="email"]');

      const nt = emailElement.textContent.trim().split('@')[0];
      setAssetStatus('Received', 'Storage');
      copyTextToClipboard(nt);
    },
    'c-a-l': () => {
      console.debug('c-a-l');
      setAssetStatus('Disposed', 'Ready for Disposal');
    },
    'c-a-e': () => {
      console.debug('c-a-e');
      setAssetStatus('Deployed', 'In Production');
    },
    'c-a-f': () => {
      console.debug('c-a-f');
      getCostCenter();
    },
    'c-a-n': () => {
      console.debug('c-a-n');
      scrapeAssetsUsingNameTags();
    },
    'c-a-p': () => {
      console.debug('c-a-p');
      document
        .getElementById('loading-spinner-container')
        .classList.toggle('hidden');
    },
  };

  Object.entries(shortcuts).forEach(([key, value]) => {
    register(key, value);
  });
}

function customHandleKey(e) {
  if (e.key === 's' && !isEditableElement(e.target)) {
    console.debug('s pressed');
    focusSearchbar();
    e.preventDefault();
  }
  if (e.ctrlKey && e.altKey && isNumericKey(e)) {
    console.debug('ctrl + alt + numeric key pressed');
    const i = whatNumeralKey(e);
    const cells = getCells(i);
    copyTextToClipboard(cells);
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
