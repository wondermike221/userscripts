// ==UserScript==
// @name        Snow Helpers
// @namespace   https://hixon.dev
// @description Various automations on SerciveNow
// @match       https://ebayinc.service-now.com/*
// @match       ebayinc.service-now.com/*
// @version     0.2.4
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

// Get technician NT from local storage
let technicianNT = localStorage.getItem('techNT');
if (technicianNT === null) {
  technicianNT = '';
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
  const row = [new Date().toLocaleDateString(), user.dv_name.split(' ')[0], user.dv_name.split(' ')[1], u_variables.street_address, '', u_variables.city, u_variables.v_state, u_variables.zip, '', '1', 'WFH', task.dv_number, technicianNT, 'Normal'];
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
function build_exit_json(task, user, manager, assets) {
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
    assetsToReturn: assets.map(asset => {
      return {
        serialNumber: asset.dv_serial_number,
        assetTag: asset.dv_asset_tag,
        installStatus: asset.dv_install_status,
        substatus: asset.dv_substatus,
        model: asset.dv_model
      };
    }),
    terminationDate: user.dv_u_termination_date,
    costCenter: user.dv_cost_center,
    qid: user.dv_x_ebay_core_config_sam_qid,
    title: user.dv_title,
    u_variables: u_variables
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

// Utility to construct the ServiceNow JSONv2 API URL
function buildApiUrl(table, sysId) {
  // In a browser context, window.location.origin is suitable.
  // If this code were to run in a Node.js environment, a base URL would need to be provided.
  const BASE_URL = 'https://ebayinc.service-now.com'; // Use a concrete base URL as seen in snow_utils.ts
  const url = new URL(`/${table}.do`, BASE_URL);
  url.searchParams.append('JSONv2', '');
  url.searchParams.append('sysparm_sys_id', sysId);
  url.searchParams.append('displayvalue', 'all');
  url.searchParams.append('displayvariables', 'true');
  return url.href;
}

// Utility to construct the ServiceNow JSONv2 API URL for queries
function buildApiUrlQuery(table, query, limit = 20) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const url = new URL(`/${table}.do`, BASE_URL);
  url.searchParams.append('JSONv2', '');
  url.searchParams.append('sysparm_action', 'getRecords');
  url.searchParams.append('sysparm_query', query);
  url.searchParams.append('displayvalue', 'all');
  url.searchParams.append('sysparm_record_count', limit.toString());
  return url.href;
}

// Generic function to fetch a single record by its sys_id
async function getSnowRecord(table, sysId) {
  const apiUrl = buildApiUrl(table, sysId);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${table} with sys_id ${sysId}: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.records && data.records.length > 0) {
      return data.records[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${table} with sys_id ${sysId}:`, error);
    return null;
  }
}

// Generic function to fetch multiple records by query
async function getSnowRecords(table, query, limit) {
  const apiUrl = buildApiUrlQuery(table, query, limit);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch records from ${table} with query "${query}": ${response.statusText}`);
    }
    const data = await response.json();
    if (data.records) {
      return data.records;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching records from ${table} with query "${query}":`, error);
    return [];
  }
}
async function getScReqItem(sysId) {
  const record = await getSnowRecord('sc_req_item', sysId);
  if (!record) return null;
  try {
    return _extends({}, record, {
      u_variables_parsed: JSON.parse(record.u_variables)
    });
  } catch (e) {
    console.error(`Error parsing u_variables for sc_req_item ${sysId}:`, e);
    return _extends({}, record, {
      u_variables_parsed: {}
    });
  }
}
async function getScTask(sysId) {
  const record = await getSnowRecord('sc_task', sysId);
  if (!record) return null;
  try {
    return _extends({}, record, {
      u_variables_parsed: JSON.parse(record.u_variables)
    });
  } catch (e) {
    console.error(`Error parsing u_variables for sc_task ${sysId}:`, e);
    return _extends({}, record, {
      u_variables_parsed: {}
    });
  }
}
async function getSysUser(sysId) {
  return getSnowRecord('sys_user', sysId);
}

var css_248z = ".directory-nav-container{background-color:#2c2c2c;border:1px solid #4a4a4a;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);box-sizing:border-box;color:#e0e0e0;display:flex;flex-direction:column;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-height:40vh;max-width:25vw;min-height:30vh;overflow:hidden;padding:6px;position:relative;width:100%}.directory-nav-container:focus{border-color:#0078d4;outline:2px solid #0078d4}.directory-header{align-items:center;border-bottom:1px solid #444;display:flex;flex-shrink:0;justify-content:space-between;margin-bottom:8px;padding-bottom:8px}.header-left-controls{align-items:center;display:flex;flex-grow:1;overflow:hidden}.back-button{background:transparent;border:none;border-radius:4px;color:#a0a0a0;cursor:pointer;flex-shrink:0;font-size:22px;font-weight:700;line-height:1;margin-right:10px;padding:4px 8px;transition:background-color .2s ease,color .2s ease}.back-button:hover{background-color:#3a3a3a;color:#e0e0e0}.back-button:disabled{color:#555;cursor:not-allowed}.current-path{color:#e0e0e0;flex-grow:1;font-size:1.1em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.close-button{background:transparent;border:none;border-radius:4px;color:#a0a0a0;cursor:pointer;flex-shrink:0;font-size:20px;font-weight:700;line-height:1;margin-left:10px;padding:4px 8px;transition:background-color .2s ease,color .2s ease}.close-button:hover{background-color:#555;color:#fff}.current-record-info{background-color:#333;border-radius:4px;color:#b0b0b0;font-size:.85em;margin-bottom:8px;overflow:hidden;padding:4px 8px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.options-list-wrapper{flex-grow:1;overflow:hidden;position:relative}.options-view{background-color:#2c2c2c;box-sizing:border-box;height:100%;left:0;padding:0;position:absolute;top:0;width:100%}.options-view ul{height:100%;list-style:none;margin:0;overflow-y:auto;padding:0}.options-list-item{align-items:center;border-bottom:1px solid #383838;cursor:pointer;display:flex;padding:12px 10px;transition:background-color .15s ease}.options-list-item:last-child{border-bottom:none}.options-list-item:hover{background-color:#3a3a3a}.option-number{color:#0090d4;font-size:.95em;font-weight:700;margin-right:15px;min-width:22px;text-align:right}.option-name{color:#d0d0d0;flex-grow:1}.option-type-indicator{color:#888;font-size:1em;margin-left:10px}.empty-directory-message{color:#888;font-style:italic;padding:30px 15px;text-align:center}:root{--transition-duration:0.25s}.slide-forward-enter-from{opacity:.8;transform:translateX(100%)}.slide-forward-enter-to{opacity:1;transform:translateX(0)}.slide-forward-enter-active{transition:transform var(--transition-duration) ease-out,opacity var(--transition-duration) ease-out}.slide-forward-exit-from{opacity:1;transform:translateX(0)}.slide-forward-exit-to{opacity:.8;transform:translateX(-100%)}.slide-forward-exit-active{transition:transform var(--transition-duration) ease-in,opacity var(--transition-duration) ease-in}.slide-backward-enter-from{opacity:.8;transform:translateX(-100%)}.slide-backward-enter-to{opacity:1;transform:translateX(0)}.slide-backward-enter-active{transition:transform var(--transition-duration) ease-out,opacity var(--transition-duration) ease-out}.slide-backward-exit-from{opacity:1;transform:translateX(0)}.slide-backward-exit-to{opacity:.8;transform:translateX(100%)}.slide-backward-exit-active{transition:transform var(--transition-duration) ease-in,opacity var(--transition-duration) ease-in}.initial-load-enter-active,.initial-load-exit-active{transition:none!important}";

var stylesheet="";

const mainPanel = ui.getPanel({
  theme: 'dark',
  style: [css_248z, stylesheet].join('\n')
});
mainPanel.setMovable(true);
let panelToggle = false;
function initToggleMainPanel(mainPanel) {
  return () => {
    if (panelToggle) {
      mainPanel.hide();
      panelToggle = false;
    } else {
      mainPanel.show();
      // mainPanel.body.focus();
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

const noop = () => {
    /* noop */
};
const noopTransition = (el, done) => done();
/**
 * Create an element transition interface for switching between single elements.
 * It can be used to implement own transition effect, or a custom `<Transition>`-like component.
 *
 * It will observe {@link source} and return a signal with array of elements to be rendered (current one and exiting ones).
 *
 * @param source a signal with the current element. Any nullish value will mean there is no element.
 * Any object can used as the source, but most likely you will want to use a `HTMLElement` or `SVGElement`.
 * @param options transition options {@link SwitchTransitionOptions}
 * @returns a signal with an array of the current element and exiting previous elements.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/transition-group#createSwitchTransition
 *
 * @example
 * const [el, setEl] = createSignal<HTMLDivElement>();
 *
 * const rendered = createSwitchTransition(el, {
 *   onEnter(el, done) {
 *     // the enter callback is called before the element is inserted into the DOM
 *     // so run the animation in the next animation frame / microtask
 *     queueMicrotask(() => { ... })
 *   },
 *   onExit(el, done) {
 *     // the exitting element is kept in the DOM until the done() callback is called
 *   },
 * })
 *
 * // change the source to trigger the transition
 * setEl(refToHtmlElement);
 */
function createSwitchTransition(source, options) {
    const initSource = solidJs.untrack(source);
    const initReturned = initSource ? [initSource] : [];
    if (web.isServer) {
        return () => initReturned;
    }
    const { onEnter = noopTransition, onExit = noopTransition } = options;
    const [returned, setReturned] = solidJs.createSignal(options.appear ? [] : initReturned);
    const [isTransitionPending] = solidJs.useTransition();
    let next;
    let isExiting = false;
    function exitTransition(el, after) {
        if (!el)
            return after && after();
        isExiting = true;
        onExit(el, () => {
            solidJs.batch(() => {
                isExiting = false;
                setReturned(p => p.filter(e => e !== el));
                after && after();
            });
        });
    }
    function enterTransition(after) {
        const el = next;
        if (!el)
            return after && after();
        next = undefined;
        setReturned(p => [el, ...p]);
        onEnter(el, after ?? noop);
    }
    const triggerTransitions = options.mode === "out-in"
        ? // exit -> enter
            // exit -> enter
            prev => isExiting || exitTransition(prev, enterTransition)
        : options.mode === "in-out"
            ? // enter -> exit
                // enter -> exit
                prev => enterTransition(() => exitTransition(prev))
            : // exit & enter
                // exit & enter
                prev => {
                    exitTransition(prev);
                    enterTransition();
                };
    solidJs.createComputed((prev) => {
        const el = source();
        if (solidJs.untrack(isTransitionPending)) {
            // wait for pending transition to end before animating
            isTransitionPending();
            return prev;
        }
        if (el !== prev) {
            next = el;
            solidJs.batch(() => solidJs.untrack(() => triggerTransitions(prev)));
        }
        return el;
    }, options.appear ? undefined : initSource);
    return returned;
}

/**
 * Default predicate used in `resolveElements()` and `resolveFirst()` to filter Elements.
 *
 * On the client it uses `instanceof Element` check, on the server it checks for the object with `t` property. (generated by compiling JSX)
 */
const defaultElementPredicate = web.isServer
    ? (item) => item != null && typeof item === "object" && "t" in item
    : (item) => item instanceof Element;
/**
 * Utility for resolving recursively nested JSX children in search of the first element that matches a predicate.
 *
 * It does **not** create a computation - should be wrapped in one to repeat the resolution on changes.
 *
 * @param value JSX children
 * @param predicate predicate to filter elements
 * @returns single found element or `null` if no elements were found
 */
function getFirstChild(value, predicate) {
    if (predicate(value))
        return value;
    if (typeof value === "function" && !value.length)
        return getFirstChild(value(), predicate);
    if (Array.isArray(value)) {
        for (const item of value) {
            const result = getFirstChild(item, predicate);
            if (result)
                return result;
        }
    }
    return null;
}
function resolveFirst(fn, predicate = defaultElementPredicate, serverPredicate = defaultElementPredicate) {
    const children = solidJs.createMemo(fn);
    return solidJs.createMemo(() => getFirstChild(children(), web.isServer ? serverPredicate : predicate));
}

function createClassnames(props) {
    return solidJs.createMemo(() => {
        const name = props.name || "s";
        return {
            enterActive: (props.enterActiveClass || name + "-enter-active").split(" "),
            enter: (props.enterClass || name + "-enter").split(" "),
            enterTo: (props.enterToClass || name + "-enter-to").split(" "),
            exitActive: (props.exitActiveClass || name + "-exit-active").split(" "),
            exit: (props.exitClass || name + "-exit").split(" "),
            exitTo: (props.exitToClass || name + "-exit-to").split(" "),
            move: (props.moveClass || name + "-move").split(" "),
        };
    });
}
// https://github.com/solidjs-community/solid-transition-group/issues/12
// for the css transition be triggered properly on firefox
// we need to wait for two frames before changeing classes
function nextFrame(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
}
/**
 * Run an enter transition on an element - common for both Transition and TransitionGroup
 */
function enterTransition(classes, events, el, done) {
    const { onBeforeEnter, onEnter, onAfterEnter } = events;
    // before the elements are added to the DOM
    onBeforeEnter?.(el);
    el.classList.add(...classes.enter);
    el.classList.add(...classes.enterActive);
    // after the microtask the elements will be added to the DOM
    // and onEnter will be called in the same frame
    queueMicrotask(() => {
        // Don't animate element if it's not in the DOM
        // This can happen when elements are changed under Suspense
        if (!el.parentNode)
            return done?.();
        onEnter?.(el, () => endTransition());
    });
    nextFrame(() => {
        el.classList.remove(...classes.enter);
        el.classList.add(...classes.enterTo);
        if (!onEnter || onEnter.length < 2) {
            el.addEventListener("transitionend", endTransition);
            el.addEventListener("animationend", endTransition);
        }
    });
    function endTransition(e) {
        if (!e || e.target === el) {
            done?.(); // starts exit transition in "in-out" mode
            el.removeEventListener("transitionend", endTransition);
            el.removeEventListener("animationend", endTransition);
            el.classList.remove(...classes.enterActive);
            el.classList.remove(...classes.enterTo);
            onAfterEnter?.(el);
        }
    }
}
/**
 * @private
 *
 * Run an exit transition on an element - common for both Transition and TransitionGroup
 */
function exitTransition(classes, events, el, done) {
    const { onBeforeExit, onExit, onAfterExit } = events;
    // Don't animate element if it's not in the DOM
    // This can happen when elements are changed under Suspense
    if (!el.parentNode)
        return done?.();
    onBeforeExit?.(el);
    el.classList.add(...classes.exit);
    el.classList.add(...classes.exitActive);
    onExit?.(el, () => endTransition());
    nextFrame(() => {
        el.classList.remove(...classes.exit);
        el.classList.add(...classes.exitTo);
        if (!onExit || onExit.length < 2) {
            el.addEventListener("transitionend", endTransition);
            el.addEventListener("animationend", endTransition);
        }
    });
    function endTransition(e) {
        if (!e || e.target === el) {
            // calling done() will remove element from the DOM,
            // but also trigger onChange callback in <TransitionGroup>.
            // Which is why the classes need to removed afterwards,
            // so that removing them won't change el styles when for the move transition
            done?.();
            el.removeEventListener("transitionend", endTransition);
            el.removeEventListener("animationend", endTransition);
            el.classList.remove(...classes.exitActive);
            el.classList.remove(...classes.exitTo);
            onAfterExit?.(el);
        }
    }
}
const TRANSITION_MODE_MAP = {
    inout: "in-out",
    outin: "out-in",
};
/**
 * The `<Transition>` component lets you apply enter and leave animations on element passed to `props.children`.
 *
 * It only supports transitioning a single element at a time.
 *
 * @param props {@link TransitionProps}
 */
const Transition = props => {
    const classnames = createClassnames(props);
    return createSwitchTransition(resolveFirst(() => props.children), {
        mode: TRANSITION_MODE_MAP[props.mode],
        appear: props.appear,
        onEnter(el, done) {
            enterTransition(classnames(), props, el, done);
        },
        onExit(el, done) {
            exitTransition(classnames(), props, el, done);
        },
    });
};

var q = Object.defineProperty;
var z = (r, t, n) => t in r ? q(r, t, { enumerable: true, configurable: true, writable: true, value: n }) : r[t] = n;
var $ = (r, t, n) => z(r, typeof t != "symbol" ? t + "" : t, n);
var b = /* @__PURE__ */ ((r) => (r.DIRECTORY = "DIRECTORY", r.LEAF = "LEAF", r))(b || {});
class Y {
  /**
   * Creates an instance of Node.
   * @param id A unique identifier for the node.
   * @param name The display name of the node.
   * @param type The type of the node (DIRECTORY or LEAF).
   * @param parent The parent node (null if root).
   * @param action The callback function if the node is a LEAF.
   */
  constructor(t, n, i, y = null, c) {
    $(this, "id");
    $(this, "name");
    $(this, "type");
    $(this, "parent");
    // Properties specific to type
    $(this, "children");
    $(this, "action");
    this.id = t, this.name = n, this.type = i, this.parent = y, i === "DIRECTORY" ? this.children = [] : i === "LEAF" && (typeof c != "function" ? (console.warn(
      `Action for LEAF node "${n}" (ID: ${t}) is not a function.`
    ), this.action = () => console.warn(`No action defined for "${n}" (ID: ${t})`)) : this.action = c);
  }
}
class ae {
  // For quick node lookup by ID
  /**
   * Creates an instance of DirectoryTree.
   * @param rootName The name for the root directory.
   */
  constructor(t = "Root") {
    $(this, "root");
    $(this, "nodeMap");
    const n = "root-" + this.generateId();
    this.root = new Y(n, t, "DIRECTORY", null), this.nodeMap = /* @__PURE__ */ new Map(), this.nodeMap.set(n, this.root);
  }
  /**
   * Generates a simple unique ID.
   * @returns A random string ID.
   */
  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
  /**
   * Adds a new node (directory or leaf) to a specified parent node.
   * @param parentNode The parent Node object.
   * @param name The display name of the new node.
   * @param type The type of the new node (DIRECTORY or LEAF).
   * @param action Optional callback function if the node is a LEAF.
   * @returns The created Node, or null if creation failed.
   */
  addNodeToParent(t, n, i, y) {
    if (!t)
      return console.error(
        `Cannot add node "${n}": Parent node is null or undefined.`
      ), null;
    if (t.type !== "DIRECTORY")
      return console.error(
        `Parent node "${t.name}" (ID: ${t.id}) is not a directory.`
      ), null;
    if (t.children || (t.children = [], console.warn(
      `Children array was missing for directory node "${t.name}". Initialized.`
    )), t.children.length >= 9)
      return console.warn(
        `Directory "${t.name}" (ID: ${t.id}) already has 9 items. Cannot add "${n}".`
      ), null;
    const c = i.toLowerCase() + "-" + this.generateId(), g = new Y(c, n, i, t, y);
    return t.children.push(g), this.nodeMap.set(c, g), g;
  }
  /**
   * Convenience method to add a node using the parent's ID.
   * @param parentId The ID of the parent node.
   * @param name The display name of the new node.
   * @param type The type of the new node.
   * @param action Optional callback for LEAF nodes.
   * @returns The created Node, or null if parent not found or creation failed.
   */
  addNode(t, n, i, y) {
    const c = this.findNode(t);
    return c ? this.addNodeToParent(c, n, i, y) : (console.error(`Parent node with id "${t}" not found.`), null);
  }
  /**
   * Finds a node in the tree by its ID.
   * @param id The ID of the node to find.
   * @returns The Node if found, otherwise null.
   */
  findNode(t) {
    return this.nodeMap.get(t) || null;
  }
  /**
   * Retrieves the path from the root to the specified node as an array of node names.
   * Useful for breadcrumbs or displaying the current location.
   * @param nodeId The ID of the target node.
   * @returns An array of strings (node names) representing the path, or an empty array if node not found.
   */
  getNodePathNames(t) {
    const n = [];
    let i = this.findNode(t);
    for (; i; )
      n.unshift(i.name), i = i.parent;
    return n;
  }
}
var J = /* @__PURE__ */ web.template('<button class=close-button aria-label="Close panel">&times; '), Q = /* @__PURE__ */ web.template("<div class=current-record-info>"), U = /* @__PURE__ */ web.template("<ul>"), V = /* @__PURE__ */ web.template("<div class=options-view>"), X = /* @__PURE__ */ web.template('<div class=directory-nav-container tabindex=0><div class=directory-header><div class=header-left-controls><button class=back-button aria-label="Go back">&larr;</button><div class=current-path></div></div></div><div class=options-list-wrapper>'), Z = /* @__PURE__ */ web.template("<p class=empty-directory-message>"), ee = /* @__PURE__ */ web.template("<span class=option-type-indicator>&rarr;"), te = /* @__PURE__ */ web.template("<li class=options-list-item role=button tabindex=0><span class=option-number>.</span><span class=option-name>");
function le(r) {
  const t = () => r.initialNodeId ? r.tree.findNode(r.initialNodeId) : r.tree.root, [n, i] = solidJs.createSignal(t() || r.tree.root), [y, c] = solidJs.createSignal(false), [g, w] = solidJs.createSignal("initial-load");
  let _;
  solidJs.createEffect(solidJs.on(() => r.initialNodeId, (e) => {
    var o, d;
    if (e) {
      const l = r.tree.findNode(e);
      l && l.id !== ((o = n()) == null ? void 0 : o.id) && (w("initial-load"), i(l));
    } else ((d = n()) == null ? void 0 : d.id) !== r.tree.root.id && (w("initial-load"), i(r.tree.root));
  }));
  const F = solidJs.createMemo(() => n() ? n().name : "Loading..."), E = solidJs.createMemo(() => {
    const e = n();
    return e && e.type === b.DIRECTORY && e.children ? e.children.map((o, d) => ({
      ...o,
      displayIndex: d + 1
    })) : [];
  }), D = (e) => {
    if (e) {
      if (e.type === b.DIRECTORY)
        w("slide-forward"), i(e);
      else if (e.type === b.LEAF && e.action)
        try {
          e.action(), r.onLeafAction && r.onLeafAction(`Executed: ${e.name}`, e);
        } catch (o) {
          console.error(`Error executing action for "${e.name}":`, o), r.onLeafAction && r.onLeafAction(`Error executing: ${e.name}`, e);
        }
    }
  }, N = () => {
    var o;
    const e = (o = n()) == null ? void 0 : o.parent;
    e && (w("slide-backward"), i(e));
  }, S = (e) => {
    var o;
    if (y())
      if (e.key === "Backspace")
        (o = n()) != null && o.parent && (e.preventDefault(), e.stopPropagation(), N());
      else {
        let d = -1;
        if (e.key >= "1" && e.key <= "9")
          d = parseInt(e.key);
        else if (e.code.startsWith("Numpad") && e.code.length === 7) {
          const l = parseInt(e.code.substring(6));
          l >= 1 && l <= 9 && (d = l);
        }
        if (d !== -1) {
          e.preventDefault(), e.stopPropagation();
          const l = d - 1, I = E();
          l >= 0 && l < I.length && D(I[l]);
        }
      }
  };
  return solidJs.createEffect(solidJs.on(n, () => {
    g() === "initial-load" && queueMicrotask(() => {
    });
  }, {
    defer: true
  })), (() => {
    var e = X(), o = e.firstChild, d = o.firstChild, l = d.firstChild, I = l.nextSibling, T = o.nextSibling;
    e.$$keydown = S, e.addEventListener("blur", () => c(false)), e.addEventListener("focus", () => c(true));
    var L = _;
    return typeof L == "function" ? web.use(L, e) : _ = e, l.$$click = N, web.insert(I, F), web.insert(o, web.createComponent(solidJs.Show, {
      get when() {
        return r.onClose;
      },
      get children() {
        var a = J();
        return a.$$click = () => r.onClose && r.onClose(), a;
      }
    }), null), web.insert(e, web.createComponent(solidJs.Show, {
      get when() {
        return r.currentRecordDisplay;
      },
      get children() {
        var a = Q();
        return web.insert(a, () => r.currentRecordDisplay), a;
      }
    }), T), web.insert(T, web.createComponent(Transition, {
      get name() {
        return g();
      },
      mode: "outin",
      get children() {
        var a = V();
        return web.insert(a, web.createComponent(solidJs.Show, {
          get when() {
            return E().length > 0;
          },
          get fallback() {
            return (() => {
              var u = Z();
              return web.insert(u, () => {
                var s;
                return ((s = n()) == null ? void 0 : s.type) === b.DIRECTORY ? "This directory is empty." : "No options.";
              }), u;
            })();
          },
          get children() {
            var u = U();
            return web.insert(u, web.createComponent(solidJs.For, {
              get each() {
                return E();
              },
              children: (s) => (() => {
                var h = te(), p = h.firstChild, B = p.firstChild, j = p.nextSibling;
                return h.addEventListener("keypress", (x) => {
                  (x.key === "Enter" || x.key === " ") && D(s);
                }), h.$$click = () => D(s), web.insert(p, () => s.displayIndex, B), web.insert(j, () => s.name), web.insert(h, web.createComponent(solidJs.Show, {
                  get when() {
                    return s.type === b.DIRECTORY;
                  },
                  get children() {
                    return ee();
                  }
                }), null), web.effect(() => web.setAttribute(h, "aria-label", `Option ${s.displayIndex}: ${s.name}`)), h;
              })()
            })), u;
          }
        })), web.effect((u) => (u = n() ? "block" : "none") != null ? a.style.setProperty("display", u) : a.style.removeProperty("display")), a;
      }
    })), web.effect((a) => {
      var h, p;
      var u = ((h = n()) == null ? void 0 : h.parent) === null, s = r.tree.getNodePathNames(((p = n()) == null ? void 0 : p.id) || r.tree.root.id).join(" / ");
      return u !== a.e && (l.disabled = a.e = u), s !== a.t && web.setAttribute(I, "title", a.t = s), a;
    }, {
      e: void 0,
      t: void 0
    }), e;
  })();
}
web.delegateEvents(["keydown", "click"]);

// modules/ServiceNowURLParser.ts
const [currentRecord, setCurrentRecord] = solidJs.createSignal({
  table: null,
  sysId: null,
  fullMatch: null
});

// Regex to capture specific table names and a 32-character hexadecimal sys_id
// It looks for /record/TABLE_NAME/SYS_ID
// TABLE_NAME can be sc_task, sc_req_item, sys_user, alm_hardware
const SN_URL_REGEX = /\/record\/(sc_task|sc_req_item|sys_user|alm_hardware)\/([a-f0-9]{32})/i;
function parseUrl(url) {
  const match = url.match(SN_URL_REGEX);
  if (match && match[1] && match[2]) {
    return {
      table: match[1],
      sysId: match[2],
      fullMatch: match[0] // The part of the URL like /record/sc_task/sys_id
    };
  }
  return {
    table: null,
    sysId: null,
    fullMatch: null
  };
}
function updateRecordInfoFromCurrentLocation() {
  var _currentRecord, _currentRecord2;
  const newInfo = parseUrl(location.href);
  // Only update if there's a change to avoid unnecessary re-renders
  if (newInfo.table !== ((_currentRecord = currentRecord()) == null ? void 0 : _currentRecord.table) || newInfo.sysId !== ((_currentRecord2 = currentRecord()) == null ? void 0 : _currentRecord2.sysId)) {
    setCurrentRecord(newInfo);
  }
}
let isInitialized = false;
function initializeUrlTracking() {
  if (isInitialized) {
    return;
  }
  const handleLocationChange = () => {
    updateRecordInfoFromCurrentLocation();
  };

  // Wrap history methods to detect SPA navigation
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event('locationchangeevent')); // Custom event
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event('locationchangeevent')); // Custom event
  };
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('locationchangeevent', handleLocationChange);

  // Initial parse
  handleLocationChange();
  isInitialized = true;

  // Cleanup function for SolidJS onCleanup or if manually called
  const cleanup = () => {
    window.removeEventListener('popstate', handleLocationChange);
    window.removeEventListener('locationchangeevent', handleLocationChange);
    // Restore original history methods if necessary, though often not required for userscripts
    // history.pushState = originalPushState;
    // history.replaceState = originalReplaceState;
    isInitialized = false;
  };

  // If used within a Solid component's setup (like onMount),
  // onCleanup will handle this. If called globally, cleanup needs manual management if desired.
  if (typeof solidJs.onCleanup === 'function') {
    solidJs.onCleanup(cleanup);
  }
}

// Export the reactive getter for the current record
const getCurrentRecord = currentRecord;

var _tmpl$ = /*#__PURE__*/web.template(`<p style=text-align:center;padding:20px;color:#888>Loading directory structure...`);

// import '../../styles.css';

function Routing({
  panelRef
}) {
  const [treeInstance] = solidJs.createSignal(new ae('Main Options'));
  const [actionLog, setActionLog] = solidJs.createSignal([]);
  const [statusMessage, setStatusMessage] = solidJs.createSignal('Click component to focus. Use 1-9 or Backspace.');
  const [treeReady, setTreeReady] = solidJs.createSignal(false);
  const [isPanelVisible, setIsPanelVisible] = solidJs.createSignal(true);

  // Get the reactive signal for the current ServiceNow record
  const currentSNRecord = getCurrentRecord;

  // Create a memoized display string for the DirectoryNav header
  const recordDisplayString = solidJs.createMemo(() => {
    const record = currentSNRecord();
    if (record && record.table && record.sysId) {
      return `Table: ${record.table}, ID: ${record.sysId.substring(0, 8)}...`; // Shorten sysId for display
    }
    return null; // Don't display if no record info
  });

  // Simulated toggleMainPanel function (replace with your actual import)
  const togglePanel = () => {
    setIsPanelVisible(prev => !prev);
    const message = `Panel visibility toggled to: ${!isPanelVisible() ? 'Visible' : 'Hidden'}`;
    console.log(message); // For demonstration
    setStatusMessage(message);
    // Call your actual toggle function here if it's imported
    toggleMainPanel();
  };
  const logUserAction = (message, node) => {
    const logEntry = node ? `${message} (Node: ${node.name})` : message;
    console.log(logEntry);
    setActionLog(prev => [logEntry, ...prev].slice(0, 7));
    setStatusMessage(message);
  };
  solidJs.onMount(() => {
    Object.assign(panelRef.wrapper.style, {
      bottom: '50%',
      left: '50%',
      minWidth: '20vw'
    });
    Object.assign(panelRef.body.style, {
      fontFamily: 'sans-serif',
      backgroundColor: '#1e1e1e',
      color: '#f0f0f0',
      maxWidth: '25vw',
      borderRadius: '8px'
    });
    // Initialize ServiceNow URL tracking when the app mounts
    initializeUrlTracking();
    const tree = treeInstance();
    const Accessory = tree.addNode(tree.root.id, 'Accessory', b.DIRECTORY);
    const Exit = tree.addNode(tree.root.id, 'Exit', b.DIRECTORY);
    const Laptop = tree.addNode(tree.root.id, 'Laptop', b.DIRECTORY);
    const Settings = tree.addNode(tree.root.id, 'Settings', b.DIRECTORY);
    if (Accessory) {
      tree.addNode(Accessory.id, 'Dropship', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('dropship');
      });
      tree.addNode(Accessory.id, 'Chargesheet', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('chargesheet');
      });
      // tree.addNode(Accessory.id, 'FDX Bulk', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      tree.addNode(Accessory.id, 'CrossCharge', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('crosscharge');
      });
      tree.addNode(Accessory.id, 'JSON', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('json');
      });
    }
    if (Exit) {
      // tree.addNode(Exit.id, 'Exit', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      // tree.addNode(Exit.id, 'Exit - Asset', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      tree.addNode(Exit.id, 'Sheet', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('exit');
      });
      // tree.addNode(Exit.id, 'Sheet - Receiving', NodeType.LEAF, () => logUserAction('Copying...'));
      tree.addNode(Exit.id, 'JSON', b.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('json');
      });
    }
    if (Laptop) {
      tree.addNode(Laptop.id, 'TODO', b.LEAF, () => {
        logUserAction('Copying...');
        ui.showToast('TODO', {
          theme: 'dark'
        });
      });
      // tree.addNode(Laptop.id, 'Dropship', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'Chargesheet', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'FDX Bulk', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'CrossCharge', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'JSON', NodeType.LEAF, () => logUserAction('Copying...'));
    }
    if (Settings) {
      tree.addNode(Settings.id, 'Technician NT', b.LEAF, () => {
        logUserAction('Change Tech NT...');
        const newTech = prompt('Enter new Tech NT:');
        // store the new tech in local storage
        if (newTech) {
          localStorage.setItem('techNT', newTech);
          ui.showToast(`New Tech NT set to: ${newTech}`, {
            theme: 'dark'
          });
        }
      });
    }
    setTreeReady(true);
  });
  return web.createComponent(solidJs.Show, {
    get when() {
      return treeReady();
    },
    get fallback() {
      return _tmpl$();
    },
    get children() {
      return web.createComponent(le, {
        get tree() {
          return treeInstance();
        },
        onLeafAction: logUserAction,
        onClose: togglePanel,
        get currentRecordDisplay() {
          return recordDisplayString();
        }
      });
    }
  });
}
async function handleScrape(type) {
  disable();
  const {
    sysId: taskSysId
  } = getCurrentRecord();
  if (!taskSysId) {
    ui.showToast('No SNOW record detected in URL', {
      theme: 'dark'
    });
    enable();
    return;
  }
  const task = await getScTask(taskSysId);
  if (!task) {
    ui.showToast('Failed to load task', {
      theme: 'dark'
    });
    enable();
    return;
  }
  const ritm = await getScReqItem(task.request_item);
  if (!ritm) {
    ui.showToast('Failed to load RITM', {
      theme: 'dark'
    });
    enable();
    return;
  }
  const user = await getSysUser(ritm.requested_for);
  if (!user) {
    ui.showToast('Failed to load user', {
      theme: 'dark'
    });
    enable();
    return;
  }
  switch (type) {
    case 'json':
      {
        const json = build_minimal_json(task, user);
        copyTextToClipboard(JSON.stringify(json));
        ui.showToast('JSON successfully copied to clipboard', {
          theme: 'dark'
        });
        break;
      }
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
        copyRichTextToClipboard([new ClipboardItem({
          'text/html': new Blob([crosscharge_html], {
            type: 'text/html'
          }),
          'text/plain': new Blob([JSON.stringify(crosscharge_json)], {
            type: 'text/plain'
          })
        })]);
        ui.showToast('CrossCharge row successfully copied to clipboard', {
          theme: 'dark'
        });
        break;
      }
    case 'chargesheet':
      {
        const [chargesheet_cis] = build_charge_sheet_row_cis(task, user);
        copyRichTextToClipboard(chargesheet_cis);
        ui.showToast('Chargesheet row successfully copied to clipboard', {
          theme: 'dark'
        });
        break;
      }
    case 'dropship':
      {
        const dropship = build_bh_sheet_row_cis(task, user);
        copyRichTextToClipboard(dropship);
        ui.showToast('Dropship row successfully copied to clipboard', {
          theme: 'dark'
        });
        break;
      }
    case 'exit':
      {
        const manager = await getSysUser(user.manager);
        if (!manager) {
          ui.showToast('Failed to load manager', {
            theme: 'dark'
          });
          enable();
          return;
        }
        const assets = await getSnowRecords('alm_hardware', `assigned_to=${user.sys_id}^install_status=1`);
        const asset = assets.filter(a => task.u_variables_parsed.v_assets_to_return.includes(a.asset_tag));
        const exit = build_exit_sheet_row_cis(task, user, manager, asset[0]);
        copyRichTextToClipboard(exit);
        ui.showToast('Exit row successfully copied to clipboard', {
          theme: 'dark'
        });
        break;
      }
    case 'fdx-bulk':
      {
        ui.showToast('TODO: FDX bulk not yet implemented', {
          theme: 'dark'
        });
        break;
      }
  }
  enable();
}

// export default function Routing(props) {
//   onMount(() => {
//     Object.assign(props.panelRef.wrapper.style, {
//       bottom: '50%',
//       left: '50%',
//       width: '250px',
//     });
//     props.panelRef.setMovable(true);
//   });
//   // const [getRoute, setRoute] = createSignal(window.location);

//   return (
//     <div id="routing">
//       <p
//         style={{
//           width: '240px',
//           'background-color': 'gray',
//           margin: 0,
//           padding: '0 0 0 10px',
//         }}
//       >
//         Copy:
//       </p>
//       <ol id="routing-list">
//         <li>
//           <button
//             id="crosscharge"
//             on:click={(e) => handleScrape('crosscharge', e)}
//           >
//             CrossCharge
//           </button>
//         </li>
//         <li>
//           <button id="dropship" on:click={(e) => handleScrape('dropship', e)}>
//             Dropship
//           </button>
//         </li>
//         <li>
//           <button id="exit" on:click={(e) => handleScrape('exit', e)}>
//             Exit
//           </button>
//         </li>
//         <li>
//           <button
//             id="chargesheet"
//             on:click={(e) => handleScrape('chargesheet', e)}
//           >
//             Charge Sheet
//           </button>
//         </li>
//         <li>
//           <button id="fdx-bulk" on:click={(e) => handleScrape('fdx-bulk', e)}>
//             FDX Bulk
//           </button>
//         </li>
//         <li>
//           <button id="json" on:click={(e) => handleScrape('json', e)}>
//             JSON
//           </button>
//         </li>
//         <li>
//           <button id="hide" on:click={(e) => handleScrape('hide', e)}>
//             Hide
//           </button>
//         </li>
//       </ol>
//     </div>
//   );
// }

window.addEventListener('load', () => {
  console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');
  initShortcuts();
  GM_registerMenuCommand('Toggle main panel', toggleMainPanel);
  web.render(() => web.createComponent(Routing, {
    panelRef: mainPanel
  }), mainPanel.body);
});

})(VM.solid.web, VM.solid, VM);
