import { init } from 'rove';
import { addFedExAutofillTextArea, Shipment } from './legacy';
import { simulateUserInteraction, selectByText } from './simulate';
import { waitForElm } from '../utils';

const FORM_FIELDS: Record<
  string,
  { selector: string; value: string | null; type: string; elementType: string }
> = {
  country: {
    selector: 'receiver-country-code',
    value: '190: US',
    type: 'dropdown',
    elementType: 'select',
  },
  zip: {
    selector: 'receiver-postal-code',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  name: {
    selector: 'receiver-name',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  address1: {
    selector: 'receiver-address-line1',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  address2: {
    selector: 'receiver-address-line2',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  city: {
    selector: 'receiver-city',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  phone: {
    selector: 'receiver-telephone-number',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  cost_center: {
    selector: 'references-input-control',
    value: null,
    type: 'text',
    elementType: 'input',
  },
  signature: {
    selector: 'signature-option',
    value: '4: DIRECT',
    type: 'dropdown',
    elementType: 'select',
  },
  billing: {
    selector: 'bill-to',
    value: 'Draper Mailroom',
    type: 'dropdown-text',
    elementType: 'select',
  },
  weight: {
    selector: 'weight-0',
    value: '1',
    type: 'text',
    elementType: 'input',
  },
  state: {
    selector: 'receiver-state-or-province',
    value: null,
    type: 'dropdown',
    elementType: 'select',
  },
  service: {
    selector: 'service',
    value: '5: PRIORITY_OVERNIGHT',
    type: 'dropdown',
    elementType: 'select',
  },
};

function fillForm(ship: Partial<Shipment>) {
  const data = ship as Record<string, string | undefined>;
  for (const field in FORM_FIELDS) {
    const { selector, elementType, type, value } = FORM_FIELDS[field];
    const el = document.querySelector(
      `[data-test-id="${selector}"] ${elementType}`,
    ) as HTMLInputElement | HTMLSelectElement | null;
    if (!el) continue;
    if (type === 'dropdown-text') {
      selectByText(el as HTMLSelectElement, value ?? data[field] ?? '');
    } else {
      simulateUserInteraction(el, value ?? data[field] ?? '');
    }
  }
}

function autoFillFromRow() {
  const row = prompt('Paste spreadsheet row:');
  if (!row) return;
  fillForm(new Shipment(row));
}

function autoFillFromJSON() {
  const jsonStr = prompt('Paste JSON (from SNOW script):');
  if (!jsonStr) return;
  try {
    const d = JSON.parse(jsonStr);
    fillForm({
      name: d.name ?? '',
      address1: d.streetAddress ?? '',
      address2: '',
      city: d.city ?? '',
      state: d.state ?? '',
      zip: d.postalCode ?? '',
      phone: d.phone ?? '',
      cost_center: d.costCenter ?? '',
      email: d.email ?? '',
    });
  } catch {
    console.error('[fedex-form-filler] Invalid JSON');
  }
}

function initializeStaticFields() {
  const signatureCheckboxSel = `ui-checkbox[data-test-id="signature-options-checkbox"] input[type="checkbox"]`;
  waitForElm(signatureCheckboxSel).then(() => {
    const el = document.querySelector(signatureCheckboxSel) as HTMLElement;
    el?.click();
    el?.dispatchEvent(new Event('change'));
  });

  const signatureOptionSel = `signature-options[data-test-id="signature-options"] select`;
  waitForElm(signatureOptionSel).then(() => {
    const el = document.querySelector(signatureOptionSel) as HTMLSelectElement;
    el.value = '4: DIRECT';
    el.dispatchEvent(new Event('change'));
  });

  const accountSwitcherSel = `account-switcher [data-test-id="account-switcher"] select`;
  waitForElm(accountSwitcherSel).then(() => {
    const el = document.querySelector(accountSwitcherSel) as HTMLSelectElement;
    selectByText(el, 'Draper Mailroom');
  });
}

window.addEventListener('load', () => {
  if (window.location.href.includes('shipping/shipEntryAction')) {
    addFedExAutofillTextArea();
  }

  if (window.location.href.includes('shippingplus')) {
    waitForElm('address-to-form').then(() => {
      initializeStaticFields();

      const rove = init({
        keyPrefix: 'fedex',
        defaults: { mode: 'dir', theme: 'dark' },
        tree: {
          autofill: {
            type: 'directory',
            label: 'Autofill',
            children: {
              pasteRow: {
                type: 'action',
                label: 'Paste Row',
                action: autoFillFromRow,
              },
              pasteJson: {
                type: 'action',
                label: 'Paste JSON',
                action: autoFillFromJSON,
              },
            },
          },
        },
      });

      GM_registerMenuCommand('FedEx Autofill', () => rove.toggle());
    });
  }
});
