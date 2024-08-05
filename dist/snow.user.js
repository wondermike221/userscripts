// ==UserScript==
// @name        Snow Helpers
// @namespace   https://hixon.dev
// @description Various automations on SmartIT
// @match       ebayinc.service-now.com/*
// @version     0.1.1
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

(function (web, ui, solidJs) {
'use strict';

var styles = {};
var stylesheet="";

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

// import { register } from '@violentmonkey/shortcut';
// import scrapeCollectPC from './collectpc';

function initShortcuts(mainPanel) {
  document.addEventListener('keydown', customHandleKey);
  mainPanel.hide();
  // addEventListener(document.body, 'keydown', handleKeyWithFocusCheck, false);
  //   mainPanel.hide();
  // let panelToggle = true;
  // const shortcuts = [
  //   {
  //     key: ['alt-`', 'ctrlcmd-k `'],
  //     description: 'Toggle main panel',
  //     action: () => {
  //       console.debug('a-`');
  //       if (panelToggle) {
  //         mainPanel.hide();
  //         panelToggle = false;
  //       } else {
  //         mainPanel.show();
  //         panelToggle = true;
  //       }
  //     },
  //   },
  //   {
  //     key: ['ctrl-alt-f', 'ctrlcmd-k f'],
  //     description: 'get cost center',
  //     action: () => {
  //       console.debug('c-a-f');
  //       //getCostCenter();
  //     },
  //   },
  //   {
  //     key: ['ctrl-alt-x', 'ctrlcmd-k x'],
  //     description: 'scrape collect pc',
  //     action: async () => {
  //       console.debug('c-a-x');
  //       await scrapeCollectPC();
  //     },
  //   },
  //   {
  //     key: ['ctrl-alt-p', 'ctrlcmd-k p'],
  //     description: 'debug',
  //     action: () => {
  //       console.debug('c-a-p');
  //       document
  //         .getElementById('loading-spinner-container')
  //         .classList.toggle('hidden');
  //     },
  //   },
  // ];

  // shortcuts.forEach((item) => {
  //   item.key.forEach((k) => {
  //     register(k, item.action);
  //   });
  // });
}
function customHandleKey(e) {
  // if (e.key === 's' && !isEditableElement(e.target)) {
  //   console.debug('s pressed');
  //   //focusSearchbar();
  //   e.preventDefault();
  // }
  if (e.ctrlKey && e.altKey && isNumericKey(e)) {
    console.debug('ctrl + alt + numeric key pressed');
    const i = whatNumeralKey(e);
    // const cells = getCells(i);
    copyTextToClipboard(`cells at ${i}`);
    ui.showToast('Copied cells to clipboard', {
      theme: 'dark'
    });
    e.preventDefault();
  }
}

// function isEditableElement(element) {
//   return (
//     element.tagName === 'INPUT' ||
//     element.tagName === 'TEXTAREA' ||
//     element.isContentEditable
//   );
// }

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

var css_248z = "";

async function scrapeCollectPC() {
  //   const spinner = document.getElementById('loading-spinner-container');
  //   if (!spinner.classList.contains('hidden')) {
  //     spinner.classList.add('hidden');
  //   }

  const fields = {
    QID: '',
    Name: '',
    NT: '',
    ManagerName: '',
    ManagerEmail: '',
    DeployedAssets: [],
    AssetStatus: [],
    Status: 'TODO',
    Date: '',
    Source: '',
    CostCenter: '',
    PersonalEmail: ''
  };

  //press i to populate user info popover
  const info_btn = unsafeWindow.frames[0].document.querySelector('#viewr\\.sc_task\\.request_item\\.request\\.requested_for');
  await info_btn.click(); //TODO make wait for one second to load.
  //get NT, QID, Date, TODO:costcenter
  const elem_nt = unsafeWindow.frames[0].document.querySelector('#sys_user\\.u_configuration_item_label');
  fields.NT = elem_nt.value;
  const elem_qid = unsafeWindow.frames[0].document.querySelector('#sys_readonly\\.sys_user\\.x_ebay_core_config_sam_qid');
  fields.QID = elem_qid.value;
  const elem_date = unsafeWindow.frames[0].document.querySelector('#sys_readonly\\.sys_user\\.u_termination_date');
  fields.Date = elem_date.value;
  const PEOPLEX_PROFILE_URL = NT => `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
  let user_data, manager_data; //, asset_data;
  try {
    const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(fields.NT));
    user_data = JSON.parse(userResponse);
    const managerResponse = await makeRequest(PEOPLEX_PROFILE_URL(user_data.payload.managerUserId));
    manager_data = JSON.parse(managerResponse);
    // const assetResponse = await startSearchAssetByNT(description_nt);
    // asset_data = assetResponse;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body = 'Data was not scraped successfully. Check that the peoplex is still logged in.';
    ui.showToast(`${title}: ${body}`, {
      theme: 'dark'
    });
  }
  if (fields.QID != user_data.payload.qID) {
    ui.showToast("QID's don't match!");
  }
  if (fields.CostCenter != user_data.payload.costctrCd) {
    ui.showToast("Cost Center's don't match!");
  }
  fields.Name = `${user_data.payload.prefFirstName} ${user_data.payload.prefLastName}`;
  fields.ManagerEmail = manager_data.payload.email;
  fields.ManagerName = manager_data.payload.mgrName;
  fields.Source = user_data.payload.userSrcSys;
  const csvCollectPC = `${fields.QID}\t${fields.Name}\t${fields.NT}\t${fields.ManagerName}\t${fields.ManagerEmail}\t${fields.DeployedAssets}\t${fields.AssetStatus}\t${fields.Status}\t${fields.Date}\t${fields.Source}\t${fields.CostCenter}\t${fields.PersonalEmail}`;
  const html_csvCollectPC = convertPlainTextToHTMLTable(csvCollectPC);
  copyTextToClipboard(html_csvCollectPC, 'text/html');
  //   spinner.classList.add('hidden');
}
async function getSources() {
  const NTS_raw = prompt('Input NTS', '');
  if (NTS_raw == '') {
    console.error('please input well formed NTS');
  }
  const NTS = NTS_raw.split(/\r?\n/);
  const sources = [];
  for (const NT of NTS) {
    const PEOPLEX_PROFILE_URL = NT => `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
    let user_data;
    try {
      const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(NT));
      user_data = JSON.parse(userResponse);
    } catch (e) {
      console.error(e);
      const title = 'Failure!';
      const body = 'Data was not scraped successfully. Check that the peoplex is still logged in.';
      ui.showToast(`${title}: ${body}`, {
        theme: 'dark'
      });
    }
    sources.push(user_data.payload.userSrcSys);
  }
  return sources.join('\n');
}
async function getManagers() {
  const NTS_raw = prompt('Input NTS', '');
  if (NTS_raw == '') {
    console.error('please input well formed NTS');
  }
  const NTS = NTS_raw.split(/\r?\n/);
  const managers = [];
  for (const NT of NTS) {
    const PEOPLEX_PROFILE_URL = NT => `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
    let user_data, manager_data;
    try {
      const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(NT));
      user_data = JSON.parse(userResponse);
      const managerResponse = await makeRequest(PEOPLEX_PROFILE_URL(user_data.payload.managerUserId));
      manager_data = JSON.parse(managerResponse);
    } catch (e) {
      console.error(e);
      const title = 'Failure!';
      const body = 'Data was not scraped successfully. Check that the peoplex is still logged in.';
      ui.showToast(`${title}: ${body}`, {
        theme: 'dark'
      });
    }
    managers.push(`${manager_data.payload.mgrName}\t${manager_data.payload.email}`);
  }
  return managers.join('\n');
}

console.log('%cstarting snow helper...', 'font-size: 2em; color: red;');
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
  GM_registerMenuCommand('scrape collect pc', scrapeCollectPC);
  GM_registerMenuCommand('get sources', getSources);
  GM_registerMenuCommand('get managers', getManagers);
  web.render(() => web.createComponent(Routing, {
    panelRef: panel
  }), panel.body);
}

})(VM.solid.web, VM, VM.solid);
