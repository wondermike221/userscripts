import { register } from '@violentmonkey/shortcut';
import { IPanelResult, showToast } from '@violentmonkey/ui';
import { copyTextToClipboard, getCells } from '../../../utils';
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
      key: ['ctrl-alt-d', 'ctrlcmd-k d'],
      description: 'Scrape accessories',
      action: () => {
        console.debug('c-a-d');
        scrapeAndCopy('accessories');
      },
    },
    {
      key: ['ctrl-alt-s', 'ctrlcmd-k s'],
      description: 'Scrape purchasing',
      action: () => {
        console.debug('c-a-s');
        scrapeAndCopy('purchasing');
      },
    },
    {
      key: ['ctrl-alt-g', 'ctrlcmd-k g'],
      description: 'Scrape cross-charge',
      action: () => {
        console.debug('c-a-g');
        scrapeAndCopy('cross-charge');
      },
    },
    {
      key: ['ctrl-alt-x', 'ctrlcmd-k x'],
      description: 'Scrape collect pc',
      action: () => {
        console.debug('c-a-x');
        scrapeCollectPC();
      },
    },
    {
      key: ['ctrl-alt-c', 'ctrlcmd-k c'],
      description: 'Set ticket status to closed and self service',
      action: () => {
        console.debug('c-a-c');
        if (window.location.href.includes('task')) {
          setTicketStatus('Closed', 'Success', '');
        } else {
          setTicketStatus('Completed', '', 'Self Service');
        }
      },
    },
    {
      key: ['ctrl-alt-z', 'ctrlcmd-k z'],
      description:
        'Set ticket status to pending supplier delivery and self service',
      action: () => {
        console.debug('c-a-z');
        setTicketStatus('Pending', 'Supplier Delivery', 'Self Service');
      },
    },
    {
      key: ['ctrl-alt-a', 'ctrlcmd-k a'],
      description: 'Scrape cost center',
      action: () => {
        console.debug('c-a-a');
        setTicketStatus('In Progress', '', '');
      },
    },
    {
      key: ['ctrl-alt-w', 'ctrlcmd-k w'],
      description: 'set asset to received, storage and copy NT to clipboard',
      action: () => {
        console.debug('c-a-w');
        const emailElement =
          document.querySelector('a[ux-id="email-value"]') ??
          document.querySelector('a[ux-id="email"]');

        const nt = emailElement.textContent.trim().split('@')[0];
        setAssetStatus('Received', 'Storage');
        copyTextToClipboard(nt);
      },
    },
    {
      key: ['alt-w', '∑'],
      description:
        'set asset to reserved, data preservation hold and copy NT to clipboard',
      action: () => {
        console.debug('a-w');
        const emailElement =
          document.querySelector('a[ux-id="email-value"]') ??
          document.querySelector('a[ux-id="email"]');

        const nt = emailElement.textContent.trim().split('@')[0];
        setAssetStatus('Reserved', 'Data Preservation Hold');
        copyTextToClipboard(nt);
      },
    },
    {
      key: ['ctrl-alt-l', 'ctrlcmd-k l'],
      description: 'set asset to end of life, ready for disposal',
      action: () => {
        console.debug('c-a-l');
        setAssetStatus('End of Life', 'Ready for Disposal');
      },
    },
    {
      key: ['ctrl-alt-e', 'ctrlcmd-k e'],
      description: 'set asset to deployed, in production',
      action: () => {
        console.debug('c-a-e');
        setAssetStatus('Deployed', 'In Production');
      },
    },
    {
      key: ['ctrl-alt-f', 'ctrlcmd-k f'],
      description: 'get cost center',
      action: () => {
        console.debug('c-a-f');
        getCostCenter();
      },
    },
    {
      key: ['ctrl-alt-n', 'ctrlcmd-k n'],
      description: 'scrape assets using name tags',
      action: () => {
        console.debug('c-a-n');
        scrapeAssetsUsingNameTags();
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
    focusSearchbar();
    e.preventDefault();
  }
  if (e.ctrlKey && e.altKey && isNumericKey(e)) {
    console.debug('ctrl + alt + numeric key pressed');
    const i = whatNumeralKey(e);
    const cells = getCells(i);
    copyTextToClipboard(cells);
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
