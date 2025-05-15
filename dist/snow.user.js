// ==UserScript==
// @name        Snow Helpers
// @namespace   https://hixon.dev
// @description Various automations on SerciveNow
// @match       https://ebayinc.service-now.com/*
// @match       ebayinc.service-now.com/*
// @version     0.2.1
// @author      Michael Hixon
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/ui@0.7
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2/dist/solid.min.js
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/snow.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function (web, solidJs, ui) {
'use strict';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
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
const enable = () => getService().enable();
const disable = () => getService().disable();

// import { showToast } from '@violentmonkey/ui';

function copyTextToClipboard(text, mime = 'text/plain') {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  const type = mime;
  const blob = new Blob([text], {
    type
  });
  const data = [new ClipboardItem({
    [type]: blob
  })];
  navigator.clipboard.write(data).then(function () {
    console.log('Async: Copying to clipboard was successful!');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}
async function copyRichTextToClipboard(clipboardItems) {
  if (!navigator.clipboard) {
    const blb = await clipboardItems[0].getType('text/plain');
    const text = await blb.text();
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.write(clipboardItems).then(function () {
    console.log('Async: Copying to clipboard was successful!');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }
  document.body.removeChild(textArea);
}

// Converts a plain text table to an HTML table
function convertPlainTextToHTMLTable(plainText) {
  const rows = plainText.trim().split('\n');
  const htmlRows = rows.map(row => {
    const cells = row.split('\t').map(cell => `<td>${cell.trim()}</td>`).join('');
    return `<tr>${cells}</tr>`;
  });
  return `<table>${htmlRows.join('')}</table>`;
}

// deprecated
/* export function getCells(i) {
  const data = getDataFromCells();
  let text = '';
  data.forEach((row) => {
    const cell = row[i];
    text = text.concat(`${cell}\n`);
  });
  return text;
}

// deprecated
export function getDataFromCells() {
  const rows = document.querySelectorAll('div[ng-row]');
  const data = [];

  rows.forEach((row, rIdx) => {
    data.push([]);
    const cells = row.querySelectorAll(
      'div[ng-cell] span[ng-cell-text]',
    ) as NodeListOf<HTMLElement>;
    cells.forEach((cell) => data[rIdx].push(cell.outerText));
  });
  return data;
}

// deprecated
export async function getCostCenterFromHub(profileURL) {
  try {
    const r = await makeRequest(profileURL);
    const data = JSON.parse(r).data;
    return data.costCenterCode;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body =
      'Data was not scraped successfully. Check that the hub is still logged in.';
    showToast(`${title}: ${body}`, { theme: 'dark' });
  }
} */

function api_url(table, id) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_sys_id', id);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('displayvariables', 'true');
  return base.href;
}
function api_url_query(table, query, limit = 20) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_action', 'getRecords');
  base.searchParams.append('sysparm_query', query);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('sysparm_record_count', limit.toString());
  return base.href;
}
function get_sys_id_from_url(table) {
  const url = window.location.href;
  const index = url.indexOf(table);
  const index_sys_id_start = index + table.length + 1;
  let index_sys_id_end = url.indexOf('/', index_sys_id_start);
  if (index_sys_id_end == -1) {
    index_sys_id_end = url.length;
  }
  const sys_id = url.substring(index_sys_id_start, index_sys_id_end);
  return sys_id;
}
async function get_record(table, sys_id = null) {
  if (sys_id == null) {
    sys_id = get_sys_id_from_url(table);
  }
  const response = await fetch(api_url(table, sys_id));
  const j = await response.json();
  return j;
}
async function get_records(table, query, limit = 20) {
  const response = await fetch(api_url_query(table, query, limit));
  const j = await response.json();
  return j;
}
function build_charge_sheet_row_cis(task, user) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [new Date().toLocaleDateString(), 'SLC', '', '1', task.dv_number, user.dv_email, user.dv_cost_center, user.dv_name, u_variables.street_address, '', u_variables.city, u_variables.v_state, u_variables.zip, u_variables.contact_number, 'USA'];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_minimal_json(task, user);
  const cis = [new ClipboardItem({
    'text/html': new Blob([html], {
      type: 'text/html'
    }),
    'text/plain': new Blob([JSON.stringify(json)], {
      type: 'text/plain'
    })
  })];
  return [cis, tsv, html, json];
}
function build_bh_sheet_row_cis(task, user) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [new Date().toLocaleDateString(), user.dv_name.split(' ')[0], user.dv_name.split(' ')[1], '', '', '', u_variables.street_address, '', u_variables.city, u_variables.v_state, u_variables.zip, '', '1', 'WFH', task.dv_number, 'mhixon', 'Normal'];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_minimal_json(task, user);
  return [new ClipboardItem({
    'text/html': new Blob([html], {
      type: 'text/html'
    }),
    'text/plain': new Blob([JSON.stringify(json)], {
      type: 'text/plain'
    })
  })];
}
function build_minimal_json(task, user) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const json = {
    streetAddress: u_variables.street_address,
    city: u_variables.city,
    state: u_variables.v_state,
    postalCode: u_variables.zip,
    name: user.dv_name,
    phone: u_variables.contact_number,
    email: user.dv_email,
    number: task.dv_number,
    costCenter: user.dv_cost_center,
    date: new Date().toLocaleDateString(),
    location: task.dv_location
  };
  return json;
}
function build_exit_sheet_row_cis(task, user, manager, asset) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [task.dv_number, task.dv_location, user.dv_name, user.dv_user_name, user.dv_u_worker_source, user.dv_u_vendor, manager.dv_name, manager.dv_email, u_variables.v_assets_to_return, asset.dv_serial_number, asset.dv_install_status, asset.dv_substatus, asset.dv_model, user.dv_u_termination_date, user.dv_cost_center, user.dv_x_ebay_core_config_sam_qid, user.dv_title];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_exit_json(task, user, manager, asset);
  return [new ClipboardItem({
    'text/html': new Blob([html], {
      type: 'text/html'
    }),
    'text/plain': new Blob([JSON.stringify(json)], {
      type: 'text/plain'
    })
  })];
}
function build_exit_json(task, user, manager, asset) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const json = {
    taskNumber: task.dv_number,
    location: task.dv_location,
    name: user.dv_name,
    userName: user.dv_user_name,
    workerSource: user.dv_u_worker_source,
    vendor: user.dv_u_vendor,
    managerName: manager.dv_name,
    managerEmail: manager.dv_email,
    assetsToReturn: u_variables.v_assets_to_return,
    serialNumber: asset.dv_serial_number,
    installStatus: asset.dv_install_status,
    substatus: asset.dv_substatus,
    model: asset.dv_model,
    terminationDate: user.dv_u_termination_date,
    costCenter: user.dv_cost_center,
    qid: user.dv_x_ebay_core_config_sam_qid,
    title: user.dv_title
  };
  return json;
}

/*
// Example
let task = await snow_get_record('sc_task');
let ritm = await snow_get_record('sc_req_item', task.records[0].parent); //or request_item instead of parent
let user = await snow_get_record('sys_user', ritm.records[0].requested_for);
let assets = await snow_get_records('alm_hardware', `assigned_to=${user.records[0].sys_id}^install_status=1`);

console.log(build_charge_sheet_row(task.records[0], user.records[0]));
console.log(build_bh_sheet_row(task.records[0], user.records[0]));
*/

var css_248z = "";

var stylesheet="";

const mainPanel = ui.getPanel({
  theme: 'dark',
  style: [css_248z, stylesheet].join('\n')
});
let panelToggle = false;
function initToggleMainPanel(mainPanel) {
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
const toggleMainPanel = initToggleMainPanel(mainPanel);
function initShortcuts() {
  // document.addEventListener('keydown', customHandleKey);
  mainPanel.hide();
  const shortcuts = [{
    key: ['c-`'],
    description: 'Toggle main panel',
    action: () => {
      console.debug('a-`');
      toggleMainPanel();
    }
  }];
  shortcuts.forEach(item => {
    item.key.forEach(k => {
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

var _tmpl$ = /*#__PURE__*/web.template(`<div id=routing><p>Copy:</p><ol id=routing-list><li><button id=crosscharge>CrossCharge</button></li><li><button id=dropship>Dropship</button></li><li><button id=exit>Exit</button></li><li><button id=chargesheet>Charge Sheet</button></li><li><button id=fdx-bulk>FDX Bulk</button></li><li><button id=json>JSON</button></li><li><button id=hide>Hide`);
function Routing(props) {
  solidJs.onMount(() => {
    Object.assign(props.panelRef.wrapper.style, {
      bottom: '50%',
      left: '50%',
      width: '250px'
    });
    props.panelRef.setMovable(true);
  });
  return (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$4.nextSibling,
      _el$7 = _el$6.firstChild,
      _el$8 = _el$6.nextSibling,
      _el$9 = _el$8.firstChild,
      _el$0 = _el$8.nextSibling,
      _el$1 = _el$0.firstChild,
      _el$10 = _el$0.nextSibling,
      _el$11 = _el$10.firstChild,
      _el$12 = _el$10.nextSibling,
      _el$13 = _el$12.firstChild,
      _el$14 = _el$12.nextSibling,
      _el$15 = _el$14.firstChild;
    _el$2.style.setProperty("width", "240px");
    _el$2.style.setProperty("background-color", "gray");
    _el$2.style.setProperty("margin", "0");
    _el$2.style.setProperty("padding", "0 0 0 10px");
    web.addEventListener(_el$5, "click", e => handleScrape('crosscharge', e));
    web.addEventListener(_el$7, "click", e => handleScrape('dropship', e));
    web.addEventListener(_el$9, "click", e => handleScrape('exit', e));
    web.addEventListener(_el$1, "click", e => handleScrape('chargesheet', e));
    web.addEventListener(_el$11, "click", e => handleScrape('fdx-bulk', e));
    web.addEventListener(_el$13, "click", e => handleScrape('json', e));
    web.addEventListener(_el$15, "click", e => handleScrape('hide', e));
    return _el$;
  })();
}
async function handleScrape(type, event) {
  disable();
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.parent)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];
  switch (type) {
    case 'json':
      {
        const json = build_minimal_json(task, user);
        copyTextToClipboard(JSON.stringify(json));
        ui.showToast('JSON successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'crosscharge':
      {
        const crosscharge_tsv = [new Date().toISOString(), 'SLC', '', '1', task.dv_number, user.dv_email, user.dv_cost_center].join('\t');
        const crosscharge_html = convertPlainTextToHTMLTable(crosscharge_tsv);
        const crosscharge_json = {
          date: new Date().toISOString(),
          location: task.dv_location,
          number: task.dv_number,
          costCenter: user.dv_cost_center,
          email: user.dv_email
        };
        const crosscharge = [new ClipboardItem({
          'text/html': new Blob([crosscharge_html], {
            type: 'text/html'
          }),
          'text/plain': new Blob([JSON.stringify(crosscharge_json)], {
            type: 'text/plain'
          })
        })];
        if (event.ctrlKey) {
          copyTextToClipboard(crosscharge_tsv);
        } else if (event.shiftKey) {
          copyTextToClipboard(JSON.stringify(crosscharge_json));
        } else {
          copyRichTextToClipboard(crosscharge);
        }
        ui.showToast('CrossCharge row successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'chargesheet':
      {
        const [chargesheet_cis, chargesheet_tsv, chargesheet_html, chargesheet_json] = build_charge_sheet_row_cis(task, user);
        if (event.ctrlKey) {
          copyTextToClipboard(chargesheet_tsv);
        } else if (event.shiftKey) {
          copyTextToClipboard(JSON.stringify(chargesheet_json));
        } else {
          copyRichTextToClipboard(chargesheet_cis);
        }
        ui.showToast('Chargesheet row successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'dropship':
      {
        const dropship = build_bh_sheet_row_cis(task, user);
        copyRichTextToClipboard(dropship);
        ui.showToast('Dropship row successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'exit':
      {
        // TODO
        const manager = (await get_record('sys_user', user.manager)).records[0];
        const assets = await get_records('alm_hardware', `assigned_to=${user.sys_id}^install_status=1`);
        const task_u_vars = JSON.parse(task.dv_u_variables);
        const asset = assets.records.filter(a => task_u_vars.v_assets_to_return.includes(a.asset_tag));
        console.log(assets);
        const exit = build_exit_sheet_row_cis(task, user, manager, asset[0]);
        copyRichTextToClipboard(exit);
        console.log('exit TODO');
        ui.showToast('Exit row successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'fdx-bulk':
      {
        // const fdx = snow.build_fdx_row_cis(task, user);
        // copyRichTextToClipboard(fdx);
        ui.showToast('TODO:Fdx row successfully copied to clipboard', {
          theme: 'dark'
        });
      }
      break;
    case 'hide':
      toggleMainPanel();
      break;
  }
  enable();
}

window.addEventListener('load', () => {
  console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');
  initShortcuts();
  GM_registerMenuCommand('Toggle main panel', toggleMainPanel);
  web.render(() => web.createComponent(Routing, {
    panelRef: mainPanel
  }), mainPanel.body);
});

})(VM.solid.web, VM.solid, VM);
