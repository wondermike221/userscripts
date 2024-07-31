// ==UserScript==
// @name        Ticket Scraper
// @namespace   https://hixon.dev
// @description Various automations on SmartIT
// @match       *://*/*
// @version     0.2.2
// @author      Michael Hixon
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/ui@0.7
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2/dist/solid.min.js
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/ticket-scraper.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function (web, ui, solidJs) {
'use strict';

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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
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
async function makeRequest(url, method = 'GET', payload = null) {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      url,
      method,
      data: payload,
      onload: r => {
        if (r.status === 200) {
          resolve(r.responseText);
        } else {
          reject(new Error(`Request failed with status ${r.status}`));
        }
      },
      onerror: () => reject(new Error('Request failed'))
    });
  });
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
function getCells(i) {
  const data = getDataFromCells();
  let text = '';
  data.forEach(row => {
    const cell = row[i];
    text = text.concat(`${cell}\n`);
  });
  return text;
}
function getDataFromCells() {
  const rows = document.querySelectorAll('div[ng-row]');
  const data = [];
  rows.forEach((row, rIdx) => {
    data.push([]);
    const cells = row.querySelectorAll('div[ng-cell] span[ng-cell-text]');
    cells.forEach(cell => data[rIdx].push(cell.outerText));
  });
  return data;
}
async function getCostCenterFromHub(profileURL) {
  try {
    const r = await makeRequest(profileURL);
    const data = JSON.parse(r).data;
    return data.costCenterCode;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body = 'Data was not scraped successfully. Check that the hub is still logged in.';
    ui.showToast(`${title}: ${body}`, {
      theme: 'dark'
    });
  }
}

async function scrapeAssetsUsingNameTags() {
  if (document.hasFocus()) {
    console.log('has focus');
    assetCollectionFromNameTags();
  } else {
    console.log('does not have focus');
    window.addEventListener('focus', assetCollectionFromNameTags, {
      once: true
    });
  }
}
async function assetCollectionFromNameTags() {
  console.log('beginning asset scrape');
  try {
    const clipboardContents = await navigator.clipboard.read();
    const blob = await clipboardContents[0].getType('text/plain');
    const text = await blob.text();
    let parsed,
      NTS = null;
    if (text.includes('\t')) {
      parsed = text.trim().split(/\r?\n/).map(line => line.split('\t')).map(line => {
        if (line[3].includes(',')) {
          return [line[0], line[3].split(',').map(s => s.trim())];
        } else {
          return [line[0], [line[3].trim()]];
        }
      }).reduce((prev, curr) => {
        return _extends({}, prev, {
          [curr[0]]: curr[1]
        });
      }, {});
      NTS = Object.keys(parsed);
    } else {
      NTS = text.trim().split(/\r?\n/);
    }
    let results = await getAssetsInfo(NTS);
    results = results.map(r => r.value).flat().filter(v => v.status != 'Disposed' && v.owned == 'ownedby' && v.sn != undefined).map(i => {
      if (i.status == 'None Assigned') {
        i.sn = parsed[i.nt][0];
      }
      return i;
    });
    if (text.includes('\t')) {
      results = results.filter(r => parsed[r.nt].includes(r.sn));
      const copy = results.reduce((prev, curr) => {
        if (prev.length != 0 && curr.nt == prev[prev.length - 1].nt) {
          prev[prev.length - 1] = _extends({}, prev[prev.length - 1], {
            status: `${prev[prev.length - 1].status}, ${curr.status}`
          });
          // prev[prev.length - 1].status += ` ${curr.status}`
          return prev;
        } else {
          prev.push(curr);
          return prev;
        }
      }, []).map(r => r.status).join('\n');
      const cBlob = new Blob([copy], {
        type: 'text/plain'
      });
      const data = [new ClipboardItem({
        ['text/plain']: cBlob
      })];
      await navigator.clipboard.write(data);
      console.log(copy);
      ui.showToast('Success! Asset information has been collected and written to the clipboard.', {
        theme: 'dark'
      });
    }
    console.log(results);
  } catch (e) {
    console.log(e);
  }
}
const ROUTE_APP_PREFIX = 'https://ebay-smartit.onbmc.com/smartit/app/#';
const ROUTE_REST_PREFIX = 'https://ebay-smartit.onbmc.com/smartit/rest';
const ROUTES = {
  searchAsset: Q => `${ROUTE_REST_PREFIX}/globalsearch?chunk_index=0&chunk_size=50&search_text=${Q}&suggest_search=true`,
  search: SEARCH_QUERY => `${ROUTE_APP_PREFIX}/search/${SEARCH_QUERY}`,
  // query must be url encoded
  workOrder: ID => `${ROUTE_APP_PREFIX}/workorder/${ID}`,
  // WOGDHWUVDUMKRAS1NHM1S1NHM1PA41 => 30
  incident: ID => `${ROUTE_APP_PREFIX}/incident/${ID}`,
  // IDGG1QUMAPMURAS12DSCS12DSC0Z7Q => 30
  task: ID => `${ROUTE_APP_PREFIX}/task/${ID}`,
  // TMGDHWUVDUMKRAS1NHM2S1NHM2PA6F => 30
  ticketConsole: () => `${ROUTE_APP_PREFIX}/ticket-console`,
  allAssets: NT => `${ROUTE_REST_PREFIX}/asset/${NT}?allAssets=true`,
  asset: ID => `${ROUTE_REST_PREFIX}/asset/details/${ID}/BMC_COMPUTERSYSTEM` //OI-621BD3CE368211EEB92ABAD6D1CD7F55 =>
};
async function getAssetsInfo(NTS) {
  try {
    const CONCURRENT_REQUEST_LIMIT = 5;
    const iterator = NTS.entries();
    const results = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const workers = Array(CONCURRENT_REQUEST_LIMIT).fill(iterator).map(iter => {
      for (const [i, NT] of iter) {
        results[i] = getAssetInfo(NT);
      }
    });
    const r = await Promise.allSettled(results);
    return r;
  } catch (e) {
    console.log(e);
  }
}
async function getAssetInfo(NT) {
  const r = await makeRequest(ROUTES.allAssets(NT));
  const j = await JSON.parse(r);
  const results = filterReleventAssetInfo(j, NT);
  return results;
}
function filterReleventAssetInfo(r_json, nt) {
  const results = [];
  let count = 0;
  r_json.forEach(j => {
    j.items.forEach(item => {
      count += item.totalMatches;
      item.objects.forEach(object => {
        const r = {
          status: object.status.value,
          nt: object.owner.loginId,
          sn: object.serialNumber,
          fullName: object.owner.fullName,
          id: object.reconciliationId,
          name: object.name,
          owned: object.role,
          model: object.product.name
        };
        results.push(r);
      });
    });
  });
  if (count == 0) {
    return [{
      status: 'None Assigned',
      nt,
      sn: 'N/A',
      owned: 'ownedby'
    }];
  }
  return results;
}
async function startSearchAssetByNT(NT) {
  let results = await getAssetInfo(NT);
  results = results
  // .map(r => r.value)
  // .flat()
  .filter(v => v.status != 'Disposed' && v.owned == 'ownedby' && v.sn != undefined);
  console.log(results);
  return results;
}

/**
 * Scrapes a specific workorder for relevant data, organize's it to my spreadsheet's format and adds a button/keyboard shortcut to copy to clipboard
 */
async function scrapeAndCopy(sheet) {
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }
  spinner.classList.remove('hidden');
  const title = document.querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]').textContent.trim();
  const name = document.querySelector('#ticket-record-summary a[ux-id="assignee-name"]').textContent.trim();
  const email = document.querySelector('#ticket-record-summary a[ux-id="email-value"]').textContent.trim();
  const ticket_number = document.querySelector('#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]').textContent.trim();
  const URL = document.location.href;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  URL.split('/').slice(-1)[0];
  const description = document.querySelector('#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]');
  const descText = description.textContent || description.innerText;
  const isYubikeyRequest = title.toLowerCase().indexOf('yubikey') !== -1 || title.toLowerCase().indexOf('privileged token') !== -1;
  const isLaptopRequest = title.toLowerCase().indexOf('laptop  request') !== -1; //Yes the title of laptop request has two spaces between the words...

  let yubi = '',
    signee = '',
    address = '',
    // eslint-disable-next-line prefer-const
    address2 = '',
    city = '',
    state = '',
    zip = '',
    country = '',
    phone = ''; // default any missing info to empty strings

  if (isYubikeyRequest) {
    const priviledgedTokenRequest = /Assign YubiKey for Regular Account/;
    if (!priviledgedTokenRequest.test(descText)) {
      [signee, address, city, state, zip, country, phone, yubi] = parseYubiDesc(descText);
    }
  } else if (isLaptopRequest) {
    // let shipped, address = ''
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [signee, addr, phone_number, shipped] = parseLaptopRequestDesc(descText);
    const parsedAddress = await parseUSAddress(addr);
    address = parsedAddress.address;
    city = parsedAddress.city;
    state = parsedAddress.state;
    zip = parsedAddress.zip;
    phone = phone_number;
  } else {
    const shipOrOfficeRegex = /Do you work primarily from Home or in a site without Local IT\?:(Yes|No)\n/;
    const matched = descText.match(shipOrOfficeRegex);
    if (matched && !(matched[1] == 'No')) {
      [signee, address, city, state, zip, country, phone] = parseDesc(descText);
      signee = signee.trim();
    }
  }
  const nametag = email.split('@')[0];
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`;
  const date = new Date().toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const what = yubi || '';
  let cost_center = 'default';
  const linkedTicketNumber = `${ticket_number}`;
  // linkedTicketNumber.link = URL;

  const costCenterCode = await getCostCenterFromHub(HUB_PROFILE_URL);
  cost_center = costCenterCode;
  if (signee.split(' ').length > 2) {
    ui.showToast('Signee has more than 2 names');
  }
  if (signee != '' && name != signee) {
    ui.showToast('The name and Signee are different values');
  }
  const split = name.split(' ');
  const firstName = split[0];
  const lastName = split[split.length - 1];
  const isSoftwareRequest = title.toLowerCase().indexOf('software request') !== -1;
  if (isSoftwareRequest) {
    const csvSoftwareSheet = `${date}\tSLC\t\t\t\t\t\t${linkedTicketNumber}\t${email}\t1\t\t\t\t${cost_center}\t\t\tNormal\t`;
    copyTextToClipboard(csvSoftwareSheet);
  } else if (isLaptopRequest) {
    const csvLaptopRequest = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}\t${name || signee}\t${address}\t${address2}\t${city}\t${state}\t${zip}\t${phone}\t${country || 'USA'}\t\t\t\t\t\tn\t`;
    copyTextToClipboard(csvLaptopRequest);
  } else if (sheet == 'accessories') {
    const csvAccessoriesSheet = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}\t${name || signee}\t${address}\t${address2}\t${city}\t${state}\t${zip}\t${phone}\t${country || 'USA'}\t\t\t\t\t\tn\t`;
    copyTextToClipboard(csvAccessoriesSheet);
  } else if (sheet == 'purchasing') {
    const csvPurchasingSheet = `${date}\t${firstName}\t${lastName}\t\t\t\t${address}\t${address2}\t${city}\t${state}\t${zip}\t\t${linkedTicketNumber}\t1`;
    copyTextToClipboard(csvPurchasingSheet);
  } else if (sheet == 'cross-charge') {
    const csvCrossChargeSheet = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}`;
    copyTextToClipboard(csvCrossChargeSheet);
  }
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }
  const notif_title = 'Success!';
  const body = 'Data was scraped successfully';
  ui.showToast(`${notif_title}: ${body}`, {
    theme: 'dark'
  });
}

/* Example Description:
  Headsets & Webcams: ["[Standard] Wired Headset"]
  Can't find your Computer Name?  Please enter here::Dell Optiplex 7080
  Do you work primarily from Home or in a site without Local IT?:Yes
  IS VIP?:No
  Street Address:583 eBay Way
  Country:United States
  State/Province:Utah
  Preferred Contact Number:8011234567
  City:Draper
  Postal Code:84020
  Name of Individual who will sign for packages:John Smith
*/
/**
 * Parses general workorder and returns each item in an array.
 */
function parseDesc(description) {
  const signee = description.match(/Name of Individual who will sign for packages:(.*?)(Show more|\sShow less|\n|$)/)[1];
  if (/Preferred Contact Number:/.test(description)) {
    var _description$match$;
    const addr = description.match(/Street Address:(.*?)\n/)[1];
    const countryMatch = description.match(/Country:(.*?)\n/)[1];
    const country = countryMatch.toLowerCase().includes('united') && countryMatch.toLowerCase().includes('states') ? 'USA' : countryMatch;
    const state = description.match(/State\/Province:(.*?)\n/)[1];
    const phone = (_description$match$ = description.match(/Preferred Contact Number:(.*?)\n/)[1]) != null ? _description$match$ : 'n/a';
    const city = description.match(/City:(.*?)\n/)[1];
    const zip = description.match(/Postal Code:(.*?)\n/)[1];
    return [signee, addr, city, state, zip, country, phone];
  } else if (/Phone Number:/.test(description)) {
    const addr = description.match(/Shipping Address:(.*?)\n/)[1];
    const phone = description.match(/Phone Number:(.*?)\n/)[1];
    return [signee, addr, '', '', '', '', phone];
  }
}

/**
 * Parses the description on a yubikey workorder and returns each item in an array.
 */
function parseYubiDesc(description) {
  const yubiType = description.match(/Do you want a Standard USB Yubikey, or the USB-c type\? : (USB|USB-c)\n/)[1];
  const yubi = yubiType === 'USB' ? 'Yubikey' : 'Yubikey USB-C';
  const shipOrOfficeRegex = /Where would you like your Yubikey shipped\? : (.*?)(Request\sType|\n|$)/;
  if (description.match(shipOrOfficeRegex)[1] != 'Desk Location') {
    const signee = description.match(/Name : (.*)\n/)[1];
    const addr = description.match(/Street Address : (.*)\n/)[1];
    const city = description.match(/City : (.*?)\n/)[1];
    const state = description.match(/State\\\\Province : (.*?)\n/)[1];
    const zip = description.match(/Postal Code : (.*?)\n/)[1];
    const countryMatch = description.match(/Country : (.*?)\n/)[1];
    const country = countryMatch.toLowerCase().includes('united') && countryMatch.toLowerCase().includes('states') ? 'USA' : countryMatch;
    const phone = description.match(/Phone Number : (.*?)(Show more|\sShow less|\n|$)/)[1];
    return [signee, addr, city, state, zip, country, phone, yubi];
  }
  //      signee, addr, city, state, zip, country, phone, yubi
  return ['', '', '', '', '', '', '', yubi];
}
function parseLaptopRequestDesc(description) {
  const shipped = description.match(/Would you like it shipped to you\? : (Yes|No, I will pickup from my local office) \n/)[1];
  if (shipped === 'Yes') {
    const address = description.match(/Shipping Address : ((.|\n)*)\nPhone Number/)[1];
    const signee = description.match(/Name of Individual who will sign for packages : (.*?)\n/)[1];
    const phone = description.match(/Phone Number : (.*)\n/)[1];
    return [signee, address, phone, shipped];
  }
  return ['', '', '', shipped];
}
function parseUSAddress(addr) {
  addr = addr.trim().replace('\n', ',');
  const parts = addr.split(',');
  const zipRegex = /^\d{5}(?:[-\s]\d{4})?$/;
  const stateRegex = /^[A-Z]{2}$/;
  let address = '';
  let city = '';
  let state = '';
  let zip = '';

  // Parse address line 1 and 2
  if (parts.length >= 1) {
    address = parts[0].trim();
  }

  // Parse city, state, and zip
  if (parts.length >= 2) {
    const stateZip = parts[parts.length - 1].trim();
    const stateZipParts = stateZip.split(' ');
    city = parts[1];
    if (stateZipParts.length > 1 && stateRegex.test(stateZipParts[stateZipParts.length - 2])) {
      state = stateZipParts[stateZipParts.length - 2];
    }
    if (stateZipParts.length > 1 && zipRegex.test(stateZipParts[stateZipParts.length - 1])) {
      zip = stateZipParts[stateZipParts.length - 1];
    }
  }
  return {
    address: address,
    city: city,
    state: state,
    zip: zip
  };
}

/**
 * Retrieves the cost center associated with the user's nametag by scraping the basic data, making a request to the hub, and notifying of success.
 *
 * @return {Promise<void>} Promise that resolves once the cost center has been retrieved and copied to the clipboard.
 */
async function getCostCenter() {
  //scrape basic data
  const email = document.querySelector('#ticket-record-summary a[ux-id="email-value"]').textContent.trim();
  const nametag = email.split('@')[0];

  //start loading spinner
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  //make request to hub for cost center
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`;
  const cost_center = await getCostCenterFromHub(HUB_PROFILE_URL);

  //stop loading spinner
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  //notify of success
  const notif_title = 'Success!';
  const body = 'Data was scraped successfully';
  ui.showToast(`${notif_title}: ${body}`, {
    theme: 'dark'
  });

  //copy to clipboard
  copyTextToClipboard(cost_center);
}

/**
 * Clicks status element then set's status to $status, status reason to $reason and reported source to $source.
 * @param status The status to set
 * @param reason The reason to set
 */
async function setTicketStatus(status = 'Completed', reason, source) {
  const statusBtn = document.querySelector('#ticket-record-summary div[ux-id="status-value"]');
  statusBtn == null || statusBtn.click();
  const statusDropdown = document.querySelector(`#ticket-record-summary div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`);
  statusDropdown == null || statusDropdown.click();
  await wait(100);
  setReason(reason);
  setSource(source);
}
function setReason(reason) {
  if (reason == '') return;
  const reasonDropdown = document.querySelector(`#ticket-record-summary div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`);
  reasonDropdown == null || reasonDropdown.click();
}
function setSource(source) {
  if (source == '') return;
  const sourceDropdown = document.querySelector(`#ticket-record-summary div[ux-id="field_reported_source"] label ul li a[aria-label="${source}"]`);
  sourceDropdown == null || sourceDropdown.click();
}

const EXPANDED_STATE = {
  showMoreBtn: false,
  notesTextBox: false
};
function expand_things() {
  const showMoreBtn = document.querySelector('button[ux-id="show-more"]');
  if (EXPANDED_STATE.showMoreBtn || showMoreBtn) {
    showMoreBtn.click();
    EXPANDED_STATE.showMoreBtn = true;
  } else {
    return false;
  }
  const notesTextBox = document.querySelector('[ux-id="add-note-textbox"]');
  if (EXPANDED_STATE.notesTextBox || notesTextBox) {
    notesTextBox.click();
    EXPANDED_STATE.notesTextBox = true;
  } else {
    return false;
  }
  const statusValue = document.querySelector('[ux-id="status-value"]');
  statusValue.focus();
  return true;
}

/**
 * Focuses on the search bar
 */
function focusSearchbar() {
  const searchBtn = document.querySelector('#header-search_button');
  searchBtn.click();
  //Automatically set to 'All'
  const searchTypeBtn = document.querySelector('div[ux-id="global-search-dropdown"] ul li a[aria-label="All"]');
  searchTypeBtn.click();
  const searchInput = document.querySelector('input[ux-id="search-text"]');
  searchInput.focus();
}

async function scrapeCollectPC() {
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  document.querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]').textContent.trim();
  const name = document.querySelector('#ticket-record-summary a[ux-id="assignee-name"]').textContent.trim();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  document.querySelector('#ticket-record-summary a[ux-id="email-value"]').textContent.trim();
  const work_order = document.querySelector('#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]').textContent.trim();
  const description = document.querySelector('#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]');
  const descText = description.textContent || description.innerText;
  const parsedDesc = descText.split(/\r?\n/).reduce((acc, item) => {
    if (item.indexOf(':') == -1) return acc;
    const [key, value] = item.split(':');
    acc[key.trim()] = value ? value.trim() : '';
    return acc;
  }, {});
  const PEOPLEX_PROFILE_URL = `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${parsedDesc['Login ID']}`;
  const description_nt = parsedDesc['Login ID'];
  const timeline_feed = document.querySelector('div[ux-id="activity-feed"] div.timeline-feed');
  const create_date_text = [...timeline_feed.children].at(-2).querySelector('span.feed-item__date-time').textContent;
  const create_date = new Date(create_date_text).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  spinner.classList.remove('hidden');
  let user_data, manager_data, asset_data;
  try {
    const userResponse = await makeRequest(PEOPLEX_PROFILE_URL);
    user_data = JSON.parse(userResponse);
    const managerResponse = await makeRequest(`https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${user_data.payload.managerUserId}`);
    manager_data = JSON.parse(managerResponse);
    const assetResponse = await startSearchAssetByNT(description_nt);
    asset_data = assetResponse;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body = 'Data was not scraped successfully. Check that the peoplex is still logged in.';
    ui.showToast(`${title}: ${body}`, {
      theme: 'dark'
    });
  }
  const assets = (ad => {
    return ad.map(a => {
      if (ad.length > 1) {
        //excel does not support more than one link per cell.
        return a.sn;
      } else {
        return `<a href="https://ebay-smartit.onbmc.com/smartit/app/#/asset/${a.id}/BMC_COMPUTERSYSTEM">${a.sn}</a>`;
      }
    }).join(',');
  })(asset_data);
  const manager_email = manager_data.payload.email;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (userSrcSys => {
    // not currently used.
    if (userSrcSys == 'FG') {
      return 'MM AWF';
    } else {
      return 'MM FTE';
    }
  })(user_data.payload.userSrcSys);
  const csvCollectPC = `${work_order}\t${name}\t${parsedDesc['Login ID']}\t${parsedDesc['Manager Name']}\t${manager_email}\t${assets}\t\tTODO\t${create_date}\t${user_data.payload.userSrcSys}\t${user_data.payload.costctrCd}`;
  const html_csvCollectPC = convertPlainTextToHTMLTable(csvCollectPC);
  copyTextToClipboard(html_csvCollectPC, 'text/html');
  spinner.classList.add('hidden');
}

/**
 * Sets the status to $status and status reason to $reason in Helix.
 * @param status The status to set
 * @param reason The reason to set
 */
async function setAssetStatus(status, reason) {
  const statusBtn = document.querySelector('div[ux-id="status-value"]');
  statusBtn == null || statusBtn.click();
  const statusDropdown = document.querySelector(`div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`);
  statusDropdown == null || statusDropdown.click();
  await wait(100);
  setAssetReason(reason);
}
function setAssetReason(reason) {
  if (reason == '') return;
  const reasonDropdown = document.querySelector(`div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`);
  reasonDropdown == null || reasonDropdown.click();
}

function initShortcuts(mainPanel) {
  document.addEventListener('keydown', customHandleKey);
  // addEventListener(document.body, 'keydown', handleKeyWithFocusCheck, false);
  mainPanel.hide();
  let panelToggle = false;
  const shortcuts = [{
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
    }
  }, {
    key: ['ctrl-alt-d', 'ctrlcmd-k d'],
    description: 'Scrape accessories',
    action: () => {
      console.debug('c-a-d');
      scrapeAndCopy('accessories');
    }
  }, {
    key: ['ctrl-alt-s', 'ctrlcmd-k s'],
    description: 'Scrape purchasing',
    action: () => {
      console.debug('c-a-s');
      scrapeAndCopy('purchasing');
    }
  }, {
    key: ['ctrl-alt-g', 'ctrlcmd-k g'],
    description: 'Scrape cross-charge',
    action: () => {
      console.debug('c-a-g');
      scrapeAndCopy('cross-charge');
    }
  }, {
    key: ['ctrl-alt-x', 'ctrlcmd-k x'],
    description: 'Scrape collect pc',
    action: () => {
      console.debug('c-a-x');
      scrapeCollectPC();
    }
  }, {
    key: ['ctrl-alt-c', 'ctrlcmd-k c'],
    description: 'Set ticket status to closed and self service',
    action: () => {
      console.debug('c-a-c');
      if (window.location.href.includes('task')) {
        setTicketStatus('Closed', 'Success', '');
      } else {
        setTicketStatus('Completed', '', 'Self Service');
      }
    }
  }, {
    key: ['ctrl-alt-z', 'ctrlcmd-k z'],
    description: 'Set ticket status to pending supplier delivery and self service',
    action: () => {
      console.debug('c-a-z');
      setTicketStatus('Pending', 'Supplier Delivery', 'Self Service');
    }
  }, {
    key: ['ctrl-alt-a', 'ctrlcmd-k a'],
    description: 'Scrape cost center',
    action: () => {
      console.debug('c-a-a');
      setTicketStatus('In Progress', '', '');
    }
  }, {
    key: ['ctrl-alt-w', 'ctrlcmd-k w'],
    description: 'set asset to received, storage and copy NT to clipboard',
    action: () => {
      var _document$querySelect;
      console.debug('c-a-w');
      const emailElement = (_document$querySelect = document.querySelector('a[ux-id="email-value"]')) != null ? _document$querySelect : document.querySelector('a[ux-id="email"]');
      const nt = emailElement.textContent.trim().split('@')[0];
      setAssetStatus('Received', 'Storage');
      copyTextToClipboard(nt);
    }
  }, {
    key: ['alt-w', '∑'],
    description: 'set asset to reserved, data preservation hold and copy NT to clipboard',
    action: () => {
      var _document$querySelect2;
      console.debug('a-w');
      const emailElement = (_document$querySelect2 = document.querySelector('a[ux-id="email-value"]')) != null ? _document$querySelect2 : document.querySelector('a[ux-id="email"]');
      const nt = emailElement.textContent.trim().split('@')[0];
      setAssetStatus('Reserved', 'Data Preservation Hold');
      copyTextToClipboard(nt);
    }
  }, {
    key: ['ctrl-alt-l', 'ctrlcmd-k l'],
    description: 'set asset to end of life, ready for disposal',
    action: () => {
      console.debug('c-a-l');
      setAssetStatus('End of Life', 'Ready for Disposal');
    }
  }, {
    key: ['ctrl-alt-e', 'ctrlcmd-k e'],
    description: 'set asset to deployed, in production',
    action: () => {
      console.debug('c-a-e');
      setAssetStatus('Deployed', 'In Production');
    }
  }, {
    key: ['ctrl-alt-f', 'ctrlcmd-k f'],
    description: 'get cost center',
    action: () => {
      console.debug('c-a-f');
      getCostCenter();
    }
  }, {
    key: ['ctrl-alt-n', 'ctrlcmd-k n'],
    description: 'scrape assets using name tags',
    action: () => {
      console.debug('c-a-n');
      scrapeAssetsUsingNameTags();
    }
  }, {
    key: ['ctrl-alt-p', 'ctrlcmd-k p'],
    description: 'debug',
    action: () => {
      console.debug('c-a-p');
      document.getElementById('loading-spinner-container').classList.toggle('hidden');
    }
  }];
  shortcuts.forEach(item => {
    item.key.forEach(k => {
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
    ui.showToast('Copied cells to clipboard', {
      theme: 'dark'
    });
    e.preventDefault();
  }
}
function isEditableElement(element) {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
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

function addTitles() {
  const cellsWithText = document.querySelectorAll('span[ng-cell-text]');
  for (const cell of cellsWithText) {
    cell.setAttribute('title', cell.textContent);
  }
}
function addTitle(node) {
  node.setAttribute('title', node.textContent);
}
const SPINNER_STYLES = `.scraper-loading-spinner {
    border: 16px solid #f3f3f3; /* Light grey */
    border-top: 16px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: spin 2s linear infinite;
  
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -100% -100%;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  #loading-spinner-container {
    display: block;
    position: fixed;
    height: 100vh;
    width: 100vw;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background-color:rgba(0, 0, 0, 0.5);
    z-index: 2;
    cursor: pointer;
  }
  
  #loading-spinner-container.hidden {
    display: none;
  }`;
function addLoadingSpinner() {
  // create styles element
  const style = document.createElement('style');
  style.textContent = SPINNER_STYLES;

  // create spinner element
  const spinner = document.createElement('div');
  spinner.classList.add('scraper-loading-spinner');

  // create spinner-container element
  const spinnerContainer = document.createElement('div');
  spinnerContainer.setAttribute('id', 'loading-spinner-container');
  spinnerContainer.classList.add('hidden');
  spinnerContainer.appendChild(spinner);

  // add click handler
  spinnerContainer.addEventListener('click', () => {
    spinnerContainer.classList.toggle('hidden');
  });

  // add to body
  document.head.appendChild(style);
  document.body.appendChild(spinnerContainer);
}

/**
 * Adds a mutation observer to the document body to detect changes in the DOM.
 * When a child node is added, it checks if the node matches a certain criteria and performs
 * the corresponding action.
 *
 * @return {MutationObserver} The mutation observer.
 */
function addObserver() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && nodeMatches(node, 'SPAN', 'ng-cell-text', '')) {
            addTitle(node);
          } else if (node.nodeType === Node.ELEMENT_NODE && nodeMatches(node, 'BUTTON', 'ux-id', 'show-more')) {
            expand_things();
          }
        });
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  return observer;
}

/**
 * Helper function to check if a node matches a certain criteria.
 * @param node The node to check.
 * @param tagName The tag name to check.
 * @param attribute The attribute to check for existence.
 * @param value The attribute value to check. Leave blank if you only want to check for the existence of the attribute.
 * @returns boolean true if the node matches, false otherwise.
 */
function nodeMatches(node, tagName, attribute, value = '') {
  const tagNameCheck = node.tagName === tagName;
  const attributeCheck = node.hasAttribute(attribute);
  const attributeValueCheck = node.getAttribute(attribute) === value;
  return tagNameCheck && attributeCheck && attributeValueCheck;
}

var styles = {"count":"style-module_count__OKr75","plus1":"style-module_plus1__EdUM3"};
var stylesheet="*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.style-module_count__OKr75{--un-text-opacity:1;color:rgb(249 115 22/var(--un-text-opacity))}.style-module_plus1__EdUM3{float:right}";

var _tmpl$ = /*#__PURE__*/web.template(`<div><p>Drag me</p><button>Get Cost Center for </button><p><span></span> people think this is amazing.`);
function Routing(props) {
  solidJs.onMount(() => {
    Object.assign(props.panelRef.wrapper.style, {
      display: 'block',
      width: '100%',
      position: 'relative',
      bottom: 'calc(100 - var(20vh))',
      left: 0,
      right: 0,
      transition: 'all 0.1s ease-out',
      overflowY: 'scroll'
    });
    props.panelRef.setMovable(true);
  });
  solidJs.createSignal(window.location);
  const [getNT, setNT] = solidJs.createSignal(0);
  return (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.nextSibling;
      _el$3.firstChild;
      var _el$5 = _el$3.nextSibling,
      _el$6 = _el$5.firstChild;
    _el$.style.setProperty("display", "block");
    _el$.style.setProperty("width", "100%");
    _el$.style.setProperty("position", "relative");
    _el$.style.setProperty("bottom", "calc(100 - var(20vh))");
    _el$.style.setProperty("left", "0");
    _el$.style.setProperty("right", "0");
    _el$.style.setProperty("transition", "all 0.1s ease-out");
    _el$.style.setProperty("overflow-y", "scroll");
    _el$3.$$click = () => getCostCenterFromHub;
    web.insert(_el$3, getNT, null);
    web.insert(_el$6, getNT);
    web.effect(_p$ => {
      var _v$ = styles.plus1,
        _v$2 = styles.count;
      _v$ !== _p$.e && web.className(_el$3, _p$.e = _v$);
      _v$2 !== _p$.t && web.className(_el$6, _p$.t = _v$2);
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$;
  })();
}
web.delegateEvents(["click"]);

var css_248z = "";

console.log('%cstarting ticket scraper...', 'font-size: 2em; color: red;');
window.addEventListener('load', () => {
  initializeApp();
});
function initializeApp() {
  // Let's create a movable panel using @violentmonkey/ui
  const panel = ui.getPanel({
    theme: 'dark',
    style: [css_248z, stylesheet].join('\n')
  });
  initShortcuts(panel);
  addTitles();
  addObserver();
  addLoadingSpinner();
  web.render(() => web.createComponent(Routing, {
    panelRef: panel
  }), panel.body);
}

})(VM.solid.web, VM, VM.solid);
