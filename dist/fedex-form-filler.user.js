// ==UserScript==
// @name        FedEx Form Filler
// @namespace   https://hixon.dev
// @description Various automations on SmartIT
// @match       https://www.fedex.com/shipping/*
// @version     0.2.0
// @author      Michael Hixon
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/ui@0.7
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2/dist/solid.min.js
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/fedex-form-filler.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_addStyle
// ==/UserScript==

(function (web, solidJs, ui) {
'use strict';

var css_248z = "";

var stylesheet="*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.style-module_count__frDyq{--un-text-opacity:1;color:rgb(249 115 22/var(--un-text-opacity))}.style-module_plus1__lcZ2-{float:right}";

class Shipment {
  constructor(row) {
    this.name = '';
    this.email = '';
    this.what = '';
    this.address1 = '';
    this.address2 = '';
    this.zip = '';
    this.city = '';
    this.state = '';
    this.phone = '';
    this.work_order = '';
    this.cost_center = '';
    this.qty = '';
    const cols = row.split('\t');
    this.what = cols[2];
    this.qty = cols[3];
    this.work_order = cols[4];
    this.email = cols[5];
    this.cost_center = cols[6];
    this.name = cols[7];
    this.address1 = cols[8];
    this.address2 = cols[9];
    this.city = cols[10];
    this.state = cols[11].toUpperCase();
    this.zip = cols[12];
    this.phone = cols[13];
  }
}
const FORM_FIELDS = {
  name: {
    selector: '#toData\\.contactName',
    value: null,
    type: 'text'
  },
  email: {
    selector: '#notificationData\\.recipientNotifications\\.email',
    value: null,
    type: 'text'
  },
  address1: {
    selector: '#toData\\.addressLine1',
    value: null,
    type: 'text'
  },
  address2: {
    selector: '#toData\\.addressLine2',
    value: null,
    type: 'text'
  },
  city: {
    selector: '#toData\\.city',
    value: null,
    type: 'text'
  },
  state: {
    selector: '#toData\\.stateProvinceCode',
    value: null,
    type: 'dropdown'
  },
  zip: {
    selector: '#toData\\.zipPostalCode',
    value: null,
    type: 'text'
  },
  phone: {
    selector: '#toData\\.phoneNumber',
    value: null,
    type: 'text'
  },
  personalMessage: {
    selector: '[name="notificationData.emailMessage"]',
    value: null,
    type: 'text'
  },
  cost_center: {
    selector: '#billingData\\.yourReference',
    value: null,
    type: 'text'
  },
  signature: {
    selector: '#ss\\.signature\\.sel',
    value: 3,
    type: 'dropdown'
  },
  'delivery notification': {
    selector: '#notificationData\\.senderNotifications\\.deliveryNotificationFlag',
    value: true,
    type: 'checkbox'
  },
  'exceptions notification': {
    selector: '#notificationData\\.recipientNotifications\\.exceptionNotificationFlag',
    value: true,
    type: 'checkbox'
  },
  'estimated delivery notification': {
    selector: '#notificationData\\.recipientNotifications\\.estimatedDeliveryNotificationFlag',
    value: true,
    type: 'checkbox'
  }
};
function addFedExAutofillTextArea() {
  const colLeft = document.getElementById('columnLeft');
  const textArea = document.createElement('textarea');
  //   textArea.setAttribute('id', `fedexAutofillTextArea-${uuid}`);
  //   textArea.dataset['uuid'] = uuid;
  textArea.placeholder = 'Paste excel row here to autofill';
  textArea.addEventListener('input', function (e) {
    autofillAction(FORM_FIELDS, e);
  });
  const TEXTAREA_STYLES = {
    marginBottom: '5px',
    paddingBottom: '10px',
    width: 'calc(100% - 5px)',
    borderBottom: 'solid 2px #660099',
    fontWeight: 'bold',
    resize: 'vertical'
  };
  for (const property in TEXTAREA_STYLES) textArea.style[property] = TEXTAREA_STYLES[property];
  colLeft.prepend(textArea);
  textArea.focus();
}
function autofillAction(FORM_FIELDS, e) {
  const ship = new Shipment(e.target.value);

  // click to expand shipment notifications section
  const expandBtn = document.querySelector('#module\\.emailNotifications\\._headerEdit > a');
  expandBtn.click();

  // set personalMessage value
  FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;
  for (const field in FORM_FIELDS) {
    const fieldItem = document.querySelector(FORM_FIELDS[field].selector);
    switch (FORM_FIELDS[field].type) {
      case 'text':
        fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
        break;
      case 'dropdown':
        fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
        break;
      case 'checkbox':
        fieldItem.checked = FORM_FIELDS[field].value;
        break;
      default:
        console.log("you shouldn't be here");
        break;
    }
  }
}

// A type guard to check if an element is an HTMLInputElement or HTMLTextAreaElement
function isInputOrTextAreaElement(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
}
function setValue(inputElement, value) {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error('The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.');
  }

  // Set the value of the input element
  inputElement.value = value;

  // Emit the 'input' event for frameworks that track live input changes
  const inputEvent = new Event('input', {
    bubbles: true
  });
  inputElement.dispatchEvent(inputEvent);
}
function triggerChange(inputElement) {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error('The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.');
  }

  // Emit the 'change' event for frameworks that track changes on blur or after input
  const changeEvent = new Event('change', {
    bubbles: true
  });
  inputElement.dispatchEvent(changeEvent);
}
function simulateUserInteraction(inputElement, value) {
  setValue(inputElement, value);
  triggerChange(inputElement);
}

var _tmpl$ = /*#__PURE__*/web.template(`<div><p>Count: </p><textarea placeholder="Paste excel row here to autofill"></textarea><button>Increment`);
function Counter() {
  const [count, setCount] = solidJs.createSignal(0);
  return (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild;
      _el$2.firstChild;
      var _el$4 = _el$2.nextSibling,
      _el$5 = _el$4.nextSibling;
    web.insert(_el$2, count, null);
    _el$5.$$click = () => setCount(count() + 1);
    return _el$;
  })();
}
window.addEventListener('load', () => {
  initializeApp();
});
function initializeApp() {
  //Legacy autofill
  addFedExAutofillTextArea();

  //updated autofill
  initializeAutofill();
  const panel = ui.getPanel({
    theme: 'dark',
    style: [css_248z, stylesheet].join('\n')
  });
  Object.assign(panel.wrapper.style, {
    top: '10vh',
    left: '10vw'
  });
  panel.setMovable(true);
  panel.show();
  web.render(Counter, document);
}
function initializeAutofill() {
  for (const span of document.querySelectorAll('label > span')) {
    span.dataset.label = span.textContent;
  }
  //TODO: make list of labels that matter and loop this code through them.
  const inputs = {
    country: {
      selector: ' Country/Territory ',
      value: '193: US',
      type: 'dropdown'
    },
    signature_options: {
      selector: ' Signature options ',
      value: true,
      type: 'checkbox'
    },
    zip: {
      selector: ' Postal code ',
      value: null,
      type: 'text'
    },
    name: {
      selector: ' Contact name *(Required)',
      type: 'text',
      value: null
    },
    email: {
      selector: ' Email ',
      value: null,
      type: 'text'
    },
    address1: {
      selector: ' Address line 1 ',
      value: null,
      type: 'text'
    },
    address2: {
      selector: ' Address line 2 ',
      value: null,
      type: 'text'
    },
    city: {
      selector: ' City ',
      value: null,
      type: 'text'
    },
    state: {
      selector: ' State or province ',
      value: null,
      type: 'dropdown'
    },
    phone: {
      selector: ' Phone number ',
      value: null,
      type: 'text'
    },
    cost_center: {
      selector: ' Cost Center ',
      value: null,
      type: 'text'
    },
    signature: {
      selector: ' Select signature type ',
      value: '4: DIRECT',
      type: 'dropdown'
    },
    billing: {
      selector: ' Bill transportation cost to ',
      value: '2: Object',
      type: 'dropdown'
    },
    weight: {
      selector: ' Weight ',
      value: '1',
      type: 'text'
    }
  };
  for (const i of inputs) {
    const input = document.querySelector(`input:has(+ label > span[data-label="${i.selector}"])`);
    simulateUserInteraction(input, i.value);
  }
}
web.delegateEvents(["click"]);

})(VM.solid.web, VM.solid, VM);
