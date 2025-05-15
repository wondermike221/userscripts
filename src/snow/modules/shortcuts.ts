import { register } from '@violentmonkey/shortcut';
import { getPanel, IPanelResult } from '@violentmonkey/ui';
// global CSS
import globalCss from '../style.css';
// CSS modules
import { stylesheet } from '../style.module.css';

export const mainPanel = getPanel({
  theme: 'dark',
  style: [globalCss, stylesheet].join('\n'),
});

export let panelToggle = false;
function initToggleMainPanel(mainPanel: IPanelResult) {
  return () => {
    if (panelToggle) {
      mainPanel.hide();
      panelToggle = false;
    } else {
      mainPanel.show();
      panelToggle = true;
    }
  };
}
export const toggleMainPanel = initToggleMainPanel(mainPanel);

export default function initShortcuts() {
  // document.addEventListener('keydown', customHandleKey);
  mainPanel.hide();
  const shortcuts = [
    {
      key: ['c-`'],
      description: 'Toggle main panel',
      action: () => {
        console.debug('a-`');
        toggleMainPanel();
      },
    },
    {
      key: ['1'],
      description: 'select option 1',
      action: () => {
        if (panelToggle) {
          console.debug('1 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #crosscharge',
          );
          button?.click();
        }
      },
    },
    {
      key: ['2'],
      description: 'select option 2',
      action: () => {
        if (panelToggle) {
          console.debug('2 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #dropship',
          );
          button?.click();
        }
      },
    },
    {
      key: ['3'],
      description: 'select option 3',
      action: () => {
        if (panelToggle) {
          console.debug('3 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #exit',
          );
          button?.click();
        }
      },
    },
    {
      key: ['4'],
      description: 'select option 4',
      action: () => {
        if (panelToggle) {
          console.debug('4 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #chargesheet',
          );
          button?.click();
        }
      },
    },
    {
      key: ['5'],
      description: 'select option 5',
      action: () => {
        if (panelToggle) {
          console.debug('5 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #fdx-bulk',
          );
          button?.click();
        }
      },
    },
    {
      key: ['6'],
      description: 'select option 6',
      action: () => {
        if (panelToggle) {
          console.debug('6 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #json',
          );
          button?.click();
        }
      },
    },
    {
      key: ['7'],
      description: 'select option 7',
      action: () => {
        if (panelToggle) {
          console.debug('7 pressed');
          // handleScrape('crosscharge', null);
          const button: HTMLButtonElement = document.querySelector(
            'div#routing ol#routing-list #hide',
          );
          button?.click();
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
