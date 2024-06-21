// ==UserScript==
// @name        FedEx Form Filler
// @namespace   https://hixon.dev
// @description Various automations on SmartIT
// @match       https://www.fedex.com/shipping*
// @version     0.2.0
// @author      Michael Hixon
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/ui@0.7
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2/dist/solid.min.js
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/fedex-form-filler.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function (web, ui, solidJs) {
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
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
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

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

/*! @violentmonkey/shortcut v1.4.4 | ISC License */

const isMacintosh = navigator.userAgent.includes('Macintosh');
const modifierList = ['m', 'c', 's', 'a'];
const modifiers = {
  ctrl: 'c',
  control: 'c',
  // macOS
  shift: 's',
  alt: 'a',
  meta: 'm',
  cmd: 'm'
};
const modifierAliases = _extends({}, modifiers, {
  c: 'c',
  s: 's',
  a: 'a',
  m: 'm',
  cm: isMacintosh ? 'm' : 'c',
  ctrlcmd: isMacintosh ? 'm' : 'c'
});
const aliases = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  cr: 'enter',
  escape: 'esc',
  ' ': 'space'
};

function createKeyNode() {
  return {
    children: new Map(),
    shortcuts: new Set()
  };
}
function addKeyNode(root, sequence, shortcut) {
  let node = root;
  for (const key of sequence) {
    let child = node.children.get(key);
    if (!child) {
      child = createKeyNode();
      node.children.set(key, child);
    }
    node = child;
  }
  node.shortcuts.add(shortcut);
}
function getKeyNode(root, sequence) {
  let node = root;
  for (const key of sequence) {
    node = node.children.get(key);
    if (!node) break;
  }
  return node;
}
function removeKeyNode(root, sequence, shortcut) {
  let node = root;
  const ancestors = [node];
  for (const key of sequence) {
    node = node.children.get(key);
    if (!node) return;
    ancestors.push(node);
  }
  if (shortcut) node.shortcuts.delete(shortcut);else node.shortcuts.clear();
  let i = ancestors.length - 1;
  while (i > 0) {
    node = ancestors[i];
    if (node.shortcuts.size || node.children.size) break;
    const last = ancestors[i - 1];
    last.children.delete(sequence[i - 1]);
    i -= 1;
  }
}
function reprNodeTree(root) {
  const result = [];
  const reprChildren = (node, level = 0) => {
    for (const [key, child] of node.children.entries()) {
      result.push(['  '.repeat(level), key, child.shortcuts.size ? ` (${child.shortcuts.size})` : ''].join(''));
      reprChildren(child, level + 1);
    }
  };
  reprChildren(root);
  return result.join('\n');
}

class Subject {
  constructor(value) {
    this.listeners = [];
    this.value = value;
  }
  get() {
    return this.value;
  }
  set(value) {
    this.value = value;
    this.listeners.forEach(listener => listener(value));
  }
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.value);
    return () => this.unsubscribe(callback);
  }
  unsubscribe(callback) {
    const i = this.listeners.indexOf(callback);
    if (i >= 0) this.listeners.splice(i, 1);
  }
}

function buildKey(key) {
  const {
    caseSensitive,
    modifierState
  } = key;
  let {
    base
  } = key;
  if (!caseSensitive || base.length > 1) base = base.toLowerCase();
  base = aliases[base] || base;
  const keyExp = [...modifierList.filter(m => modifierState[m]), base].filter(Boolean).join('-');
  return `${caseSensitive ? '' : 'i:'}${keyExp}`;
}
function breakKey(shortcut) {
  const pieces = shortcut.split(/-(.)/);
  const parts = [pieces[0]];
  for (let i = 1; i < pieces.length; i += 2) {
    parts.push(pieces[i] + pieces[i + 1]);
  }
  return parts;
}
function parseKey(shortcut, caseSensitive) {
  const parts = breakKey(shortcut);
  const base = parts.pop();
  const modifierState = {};
  for (const part of parts) {
    const key = modifierAliases[part.toLowerCase()];
    if (!key) throw new Error(`Unknown modifier key: ${part}`);
    modifierState[key] = true;
  }
  // Alt/Shift modifies the character.
  // In case sensitive mode, we only need to check the modified character: <c-A> = Ctrl+Shift+KeyA
  // In case insensitive mode, we check the keyCode as well as modifiers: <c-s-a> = Ctrl+Shift+KeyA
  // So if Alt/Shift appears in the shortcut, we must switch to case insensitive mode.
  caseSensitive && (caseSensitive = !(modifierState.a || modifierState.s));
  return {
    base,
    modifierState,
    caseSensitive
  };
}
function getSequence(input) {
  return Array.isArray(input) ? input : input.split(/\s+/);
}
function normalizeSequence(input, caseSensitive) {
  return getSequence(input).map(key => parseKey(key, caseSensitive));
}
function parseCondition(condition) {
  return condition.split('&&').map(key => {
    key = key.trim();
    if (!key) return;
    if (key[0] === '!') {
      return {
        not: true,
        field: key.slice(1).trim()
      };
    }
    return {
      not: false,
      field: key
    };
  }).filter(Boolean);
}
class KeyboardService {
  constructor(options) {
    this._context = {};
    this._conditionData = {};
    this._data = [];
    this._root = createKeyNode();
    this.sequence = new Subject([]);
    this._timer = 0;
    this._reset = () => {
      this._cur = undefined;
      this.sequence.set([]);
      this._resetTimer();
    };
    this.handleKey = e => {
      // Chrome sends a trusted keydown event with no key when choosing from autofill
      if (!e.key || modifiers[e.key.toLowerCase()]) return;
      this._resetTimer();
      const keyExps = [
      // case sensitive mode, `e.key` is the character considering Alt/Shift
      buildKey({
        base: e.key,
        modifierState: {
          c: e.ctrlKey,
          m: e.metaKey
        },
        caseSensitive: true
      }),
      // case insensitive mode, using `e.code` with modifiers including Alt/Shift
      buildKey({
        base: e.code,
        modifierState: {
          c: e.ctrlKey,
          s: e.shiftKey,
          a: e.altKey,
          m: e.metaKey
        },
        caseSensitive: false
      }),
      // case insensitive mode, using `e.key` with modifiers
      buildKey({
        // Note: `e.key` might be different from what you expect because of Alt Graph
        // ref: https://en.wikipedia.org/wiki/AltGr_key
        base: e.key,
        modifierState: {
          c: e.ctrlKey,
          s: e.shiftKey,
          a: e.altKey,
          m: e.metaKey
        },
        caseSensitive: false
      })];
      const state = this._handleKeyOnce(keyExps, false);
      if (state) {
        e.preventDefault();
        if (state === 2) this._reset();
      }
      this._timer = window.setTimeout(this._reset, this.options.sequenceTimeout);
    };
    this.options = _extends({}, KeyboardService.defaultOptions, options);
  }
  _resetTimer() {
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = 0;
    }
  }
  _addCondition(condition) {
    let cache = this._conditionData[condition];
    if (!cache) {
      const value = parseCondition(condition);
      cache = {
        count: 0,
        value,
        result: this._evalCondition(value)
      };
      this._conditionData[condition] = cache;
    }
    cache.count += 1;
  }
  _removeCondition(condition) {
    const cache = this._conditionData[condition];
    if (cache) {
      cache.count -= 1;
      if (!cache.count) {
        delete this._conditionData[condition];
      }
    }
  }
  _evalCondition(conditions) {
    return conditions.every(cond => {
      let value = this._context[cond.field];
      if (cond.not) value = !value;
      return value;
    });
  }
  _checkShortcut(item) {
    const cache = item.condition && this._conditionData[item.condition];
    const enabled = !cache || cache.result;
    if (item.enabled !== enabled) {
      item.enabled = enabled;
      this._enableShortcut(item);
    }
  }
  _enableShortcut(item) {
    (item.enabled ? addKeyNode : removeKeyNode)(this._root, item.sequence, item);
  }
  enable() {
    this.disable();
    document.addEventListener('keydown', this.handleKey);
  }
  disable() {
    document.removeEventListener('keydown', this.handleKey);
  }
  register(key, callback, options) {
    const {
      caseSensitive,
      condition
    } = _extends({
      caseSensitive: false
    }, options);
    const sequence = normalizeSequence(key, caseSensitive).map(key => buildKey(key));
    const item = {
      sequence,
      condition,
      callback,
      enabled: false,
      caseSensitive
    };
    if (condition) this._addCondition(condition);
    this._checkShortcut(item);
    this._data.push(item);
    return () => {
      const index = this._data.indexOf(item);
      if (index >= 0) {
        this._data.splice(index, 1);
        if (condition) this._removeCondition(condition);
        item.enabled = false;
        this._enableShortcut(item);
      }
    };
  }
  setContext(key, value) {
    this._context[key] = value;
    for (const cache of Object.values(this._conditionData)) {
      cache.result = this._evalCondition(cache.value);
    }
    for (const item of this._data) {
      this._checkShortcut(item);
    }
  }
  _handleKeyOnce(keyExps, fromRoot) {
    var _cur, _cur2;
    let cur = this._cur;
    if (fromRoot || !cur) {
      // set fromRoot to true to avoid another retry
      fromRoot = true;
      cur = this._root;
    }
    if (cur) {
      let next;
      for (const key of keyExps) {
        next = getKeyNode(cur, [key]);
        if (next) {
          this.sequence.set([...this.sequence.get(), key]);
          break;
        }
      }
      cur = next;
    }
    this._cur = cur;
    const [shortcut] = [...(((_cur = cur) == null ? void 0 : _cur.shortcuts) || [])];
    if (!fromRoot && !shortcut && !((_cur2 = cur) != null && _cur2.children.size)) {
      // Nothing is matched with the last key, rematch from root
      this._reset();
      return this._handleKeyOnce(keyExps, true);
    }
    if (shortcut) {
      try {
        shortcut.callback();
      } catch (_unused) {
        // ignore
      }
      return 2;
    }
    return this._cur ? 1 : 0;
  }
  repr() {
    return reprNodeTree(this._root);
  }
}
KeyboardService.defaultOptions = {
  sequenceTimeout: 500
};
let service;
function getService() {
  if (!service) {
    service = new KeyboardService();
    service.enable();
  }
  return service;
}
const register = (...args) => getService().register(...args);

function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

var _tmpl$ = /*#__PURE__*/web.template(`<div><textarea placeholder="Paste excel row here to autofill">`);
var ToggleState = /*#__PURE__*/function (ToggleState) {
  ToggleState[ToggleState["Hidden"] = 0] = "Hidden";
  ToggleState[ToggleState["Focused"] = 1] = "Focused";
  ToggleState[ToggleState["Blurred"] = 2] = "Blurred";
  return ToggleState;
}(ToggleState || {});
function GUI(props) {
  let ref;
  solidJs.onMount(() => {
    ref.focus();
    const panel = props.panelRef;
    panel.show();
    let toggleState = ToggleState.Focused;
    register('a-`', () => {
      switch (toggleState) {
        case ToggleState.Hidden:
          toggleState = ToggleState.Focused;
          ref.focus();
          panel.show();
          break;
        case ToggleState.Focused:
          toggleState = ToggleState.Hidden;
          ref.blur();
          panel.hide();
          break;
        case ToggleState.Blurred:
          toggleState = ToggleState.Focused;
          ref.focus();
          break;
      }
    });
    ref.addEventListener('blur', () => {
      toggleState = ToggleState.Blurred;
    });
    ref.addEventListener('focus', () => {
      toggleState = ToggleState.Focused;
    });
  });
  return (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild;
    _el$.style.setProperty("height", "10vh");
    _el$.style.setProperty("width", "100%");
    _el$.style.setProperty("background-color", "rgba(0, 0, 0, 0.8)");
    _el$.style.setProperty("color", "rgba(51, 51, 51)");
    web.addEventListener(_el$2, "input", props.update, true);
    var _ref$ = ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$2) : ref = _el$2;
    _el$2.style.setProperty("width", "100%");
    return _el$;
  })();
}
window.addEventListener('load', () => {
  initializeApp();
});
function initializeApp() {
  // example legacy url:
  //https://www.fedex.com/shipping/shipEntryAction.do?method=doEntry&link=1&locale=en_US&urlparams=us&sType=F
  //Legacy autofill
  if (window.location.href.includes('shipping/shipEntryAction')) {
    addFedExAutofillTextArea();
  }

  //example new url:
  //https://www.fedex.com/shippingplus/en-us/shipment/create
  //updated autofill
  if (window.location.href.includes('shippingplus')) {
    waitForElm('address-to-form').then(() => {
      initializeAutofill();
    });
  }
}
function initializeAutofill() {
  const signature_selector = `ui-checkbox[data-test-id="signature-options-checkbox"]`;
  document.querySelector(signature_selector).click();
  const FORM_FIELDS = {
    country: {
      selector: 'receiver-country-code',
      value: '193: US',
      type: 'dropdown',
      elementType: 'select'
    },
    // signature_options: {
    //   selector: 'signature-options-checkbox',
    //   value: true,
    //   type: 'checkbox',
    //   elementType: 'input',
    // },
    zip: {
      selector: 'receiver-postal-code',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    name: {
      selector: 'receiver-name',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    email: {
      selector: 'receiver-email',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    address1: {
      selector: 'receiver-address-line1',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    address2: {
      selector: 'receiver-address-line2',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    city: {
      selector: 'receiver-city',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    phone: {
      selector: 'receiver-telephone-number',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    cost_center: {
      selector: 'references-input-control',
      value: null,
      type: 'text',
      elementType: 'input'
    },
    signature: {
      selector: 'signature-option',
      value: '4: DIRECT',
      type: 'dropdown',
      elementType: 'select'
    },
    billing: {
      selector: 'bill-to',
      value: '2: Object',
      type: 'dropdown',
      elementType: 'select'
    },
    weight: {
      selector: 'weight-0',
      value: '1',
      type: 'text',
      elementType: 'input'
    },
    state: {
      selector: 'receiver-state-or-province',
      value: null,
      type: 'dropdown',
      elementType: 'select'
    },
    service: {
      selector: 'service',
      value: '5: PRIORITY_OVERNIGHT',
      type: 'dropdown',
      elementType: 'select'
    }
  };
  function autoFillAction(e) {
    const ship = new Shipment(e.target.value);
    for (const field in FORM_FIELDS) {
      const selector = `[data-test-id="${FORM_FIELDS[field].selector}"] ${FORM_FIELDS[field].elementType}`;
      const input = document.querySelector(selector);
      simulateUserInteraction(input, FORM_FIELDS[field].value || ship[field]);
    }
  }
  const panel = ui.getPanel({
    theme: 'dark',
    style: [css_248z, stylesheet].join('\n')
  });
  Object.assign(panel.wrapper.style, {
    display: 'block',
    width: '100%',
    position: 'relative',
    bottom: 'calc(100 - var(20vh))',
    left: 0,
    right: 0,
    transition: 'all 0.1s ease-out',
    overflowY: 'scroll'
  });
  web.render(() => web.createComponent(GUI, {
    update: autoFillAction,
    panelRef: panel
  }), panel.body);
}
web.delegateEvents(["input"]);

})(VM.solid.web, VM, VM.solid);
