// ==UserScript==
// @name         Scrape Workorder Data
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Various automations to workorder pages
// @author       You
// @match        https://ebay-smartit.onbmc.com/smartit/app/
// @match        https://hub.corp.ebay.com/
// @icon         https://www.google.com/s2/favicons?domain=docs.bmc.com
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/wondermike221/userscripts/main/lib.js
// @connect      *
// @connect      https://hub.corp.ebay.com/searchsvc/profile/*
// @run-at       document-idle
// ==/UserScript==

// Constants
var SUCCESS_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbUlEQVRIiWNgGE7Am4GB4QkDA8N/MjFB8JgCw4mygGiFpAAmahtIigXkxsljBgYGT2wGogcRJXHyiBgLyI0TFH0DGgejFoxaMFIsYEFiM9LCggENoidQmpyK5zExlnsykFeiPmJgYPAgxoKhAQAobmMW+E0ohwAAAABJRU5ErkJggg==";
var FAILURE_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAEi0lEQVRoge2ZTU8bVxSG33NpU5WCKCUTY4TUWBDCh+hiZmE2LMKCOwKFIqxIbQqb/ICA2k35B+2qVf9D1aZVUkWVgqgrpQsWYVEWVIaqRsIIRIlg4YliyxH4nC74ECB7fMdjFpX8Sl5Yc+fc9xnfc+fcY6Cuuuqq63+j3PRUVB5MNF9VfHkw0ZybnooGuUeZDizMJB4qUtuFw2ub+ZlEPLg9f+VnEvHC4bVNRWq7MH1v1vQ+Mgr+2dQcBN+cfhfIKyLSjd8/eVGN2cvK3Z90CA1JQFrPjAnNv/vD468q3VsRIP/p5JycM39Or0iUbnwUDiJ3f9IBIwmg9fI1EZpvevSLL4QvwOt7E7MgfOszxFOKdOOPT5fN7F5U/pOP48yyCKCl3BgBzTb/9PS7ctfLAuSmdJTV29sAGvxtkMdS1C2PnwWC8BJjcUUNi4CUNX+iIhF3Nv38bK/UxbJJnD9657VwMSvM8P8UW0iw6CXGjBPbS4zFSbAoXGwxiJ/NI/+6XCzfJZSd0jYxJQF8YOILityWJwu+OZGdHHUIquSaryZmxSTO3tU2IMYQBHZbfv295ITZ8VEHqnTCBo11KqNtNHtX28JsDMEsbtvCxYmz46OOHD8II/OlYpSSEQAAZPWIzcp8OQnozEB2/I7DfHGfN723kowBAGBfj9gqwHKCEpeLdKjIfNlAidu28IfxuyUQAAAcjN6JQ9h3775g6FhmY0np6789D7QdBwYAgP2RYRvHT9XklzCRRyz6+vOlwC/EqgCAYwgWTlJoCPIY0O1VmAdCAADA/vCQzWSc2KXkCYtuX3pRlXkgJAAA7A4P2UqME/u8PIBCmQdqAAAAu0OOTUoFgfBIsW5f+jOUeQB4K2wAAIAIMYMAMRpOAIpFqcnDC7+E4rbDYrzPn5cHgtu5vBLqPBEKYMu2HdXASUhg86fyiJXbuVI9RNUAW/agQ0LVPPnL8hTB7VxZrQqiKoCtwUEHyrgwM5HHotzYanCIwACbH/XHScjkJAWATkoJs7FComOra1dXSmwN9jpc5gBeQh5EaRI5FBWgAGRyY+vrtS/mNnp7HUVsfhgh0bG19DIAZPq6bYbxe8IjsBtb36hdOb3R2xUkYT3FpGPp9IWlkO7rthUbF4CeUjCCqAiw0dXloAGmW6XHULrnkvlTpbu7bRCSBDE7FAm5tzb8IXwBNrq6HBHzZSMsuieT8U3CdPeHNth8OYHFvZXJBD/U/337drN6U9gE0GY0Eaii+VP9c/NmHPBvaJ1JcHDYlI8NpPZLtlbK9oW4UGgS5vcr923Yw1HR2DwA9GQyyzgqamH2KsYXbkXuvaZyscoC9G9t/Sssn1cyTyy6Z2cncFXZs7OzTCwGEPLFQCZTsisHGCTxWjQ6R1SquUseq6Ie2HkZqiRe6+iwqWyjgOb7dnerb+6eTRKNXGivA/BEoAdehjN/Fr+jwwYXL0HQl/17e1/XIv7xJJY1m7Kso5Rl7acikZr/wZGKROIpyzo4meNhreMDAP66cSOSsqyyCRVWKctqSllW+1XFr6uuuuqqvf4DtHiJ42XrW+MAAAAASUVORK5CYII=";

(function () {
  "use strict";

  //add spinner
  const spinner_container = spinner_setup();
  // register the handler
  document.addEventListener("keyup", doc_keyUp, false);
  console.log("event listener added");
})();

/**
 * Keyboard shortcuts:
 * Ctrl + Alt + d == scrape data off workorder and copy to the clipboard
 * Ctrl + Alt + c == set workorder to completed with Reported Source = Web
 */
function doc_keyUp(e) {
  if (e.ctrlKey && e.altKey && e.key === "d") {
    scrapeAndCopy(document);
  } else if (e.ctrlKey && e.altKey && e.key === "x") {
    scrapeCheckedAndCopy();
  } else if (e.ctrlKey && e.altKey && e.key === "c") {
    setWOComplete();
  } else if (e.ctrlKey && e.altKey && e.key === "p") {
    //TODO: command palette
    document.getElementById("scraper_spinner").classList.toggle("hidden");
  }
}

/**
 * Scrapes a specific workorder for relevant data, organize's it to my spreadsheet's format and adds a button/keyboard shortcut to copy to clipboard
 */
function scrapeAndCopy(document) {
  const spinner = document.getElementById("scraper_spinner");
  if (!spinner.classList.contains("hidden")) {
    spinner.classList.add("hidden");
  }
  const name = document
    .querySelector(
      "#ticket-record-summary > div.editable-content-section__content > div.ticket__customized-main-section.ng-scope > div.layout-renderer.ng-isolate-scope > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(1) > div > div:nth-child(1) > div > div > div.person-name__details.ng-isolate-scope > label > span > a"
    )
    .text.trim();
  const email = document
    .querySelector(
      "#ticket-record-summary > div.editable-content-section__content > div.ticket__customized-main-section.ng-scope > div.layout-renderer.ng-isolate-scope > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > div > div > label > a"
    )
    .text.trim();
  const work_order = document
    .querySelector(
      "#ticket-record-summary > div.editable-content-section__content > title-bar > div.title-bar__section.col-md-12 > div > div.pull-left.row.col-md-12.title-bar__display > div.title-bar__configuration-section.panel-field-area.ng-scope > div > div:nth-child(1) > div > div > label > span"
    )
    .textContent.trim();
  const description = document.querySelector(
    "#ticket-record-summary > div.editable-content-section__content > div.ticket__customized-main-section.ng-scope > div.layout-renderer.ng-isolate-scope > div:nth-child(2) > div.col-sm-8.layout-renderer__column > div:nth-child(2) > div > div > div.custom-field.col-md-12 > div > div"
  );
  const descText = description.textContent || description.innerText;

  const isYubikeyRequest = descText.indexOf("I need a Yubikey") !== -1;
  let yubi = "",
    addr = "",
    city = "",
    state = "",
    zip = "",
    phone = ""; // default any missing info to empty strings
  if (isYubikeyRequest) {
    //check if we're scraping a yubikey request.
    const shipOrOfficeRegex =
      /Where would you like your Yubikey shipped\? : (.*?)(Request\sType|\n)/;
    if (descText.match(shipOrOfficeRegex)[1] == "Desk Location") {
      // In office request doesn't have shipping information
      //nothing to parse. TODO:in the future will parse yubiType.
      yubi = parseYubiDesc(descText, false);
    } else {
      [yubi, addr, city, state, zip, phone] = parseYubiDesc(descText);
    }
  } else {
    const shipOrOfficeRegex =
      /Do you work primarily from Home or in a site without Local IT\?:(Yes|No)\n/;
    const priviledgedTokenRequest = /Assign YubiKey for Regular Account/;
    if (
      priviledgedTokenRequest.test(descText) ||
      descText.match(shipOrOfficeRegex)[1] == "No"
    ) {
      //nothing to parse in the description
    } else {
      [addr, phone] = parseDesc(descText);
    }
  }

  const nametag = email.split("@")[0];
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`;
  const date = new Date().toLocaleDateString("en-us", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const what = yubi || "";

  let cost_center = "default";
  GM_xmlhttpRequest({
    method: "GET",
    url: HUB_PROFILE_URL,
    onload: (r) => {
      let data;
      try {
        data = JSON.parse(r.response).data;
      } catch (e) {
        let title = "Failure!";
        let body =
          "Data was not scraped successfully. Check that the hub is still logged in.";
        notify({ title, FAILURE_ICON, body });
        return;
      }
      cost_center = data.costCenterCode;
      const csv = `${date}\tSLC\t${what}\t1\t${work_order}\t${email}\t${cost_center}\t${name}\t${addr}\t\t${city}\t${state}\t${zip}\t${phone}\tUSA\t\t\t\t\tn\t`;
      console.log(csv);
      copyTextToClipboard(csv);

      if (!spinner.classList.contains("hidden")) {
        spinner.classList.add("hidden");
      }
      let title = "Success!";
      let body = "Data was scraped successfully";
      notify({ title, SUCCESS_ICON, body });
    },
  });
}

// const WORK_ORDER_URL_LAYOUT = `https://ebay-smartit.onbmc.com/smartit/app/#/workorder/${id}`

/**
 * Scrapes all workorders that are checked on the current listing and copy's to the clipboard in my spreadsheet's format.
 */
function scrapeCheckedAndCopy() {
  const selectedRows = document.querySelectorAll(
    "[ux-id='ticket-console-grid-list'] .ngViewport [ng-row].ngRow.selected"
  );
  // Assert that we are on the correct page and have selected an item.
  if (
    window.location.href !=
      "https://ebay-smartit.onbmc.com/smartit/app/#/ticket-console" ||
    selectedRows.length === 0
  ) {
    console.log("wrong page");
    let title = "Error!";
    let body =
      "Please ensure you are on a listing page and have selected at least one item.";
    notify({ title, SUCCESS_ICON, body });
    return;
  }
  const workorders = getWorkOrdersFromSelected(selectedRows);

  //   fetch("https://ebay-smartit.onbmc.com/smartit/rest/v2/person/workitems/get", {
  //     "headers": {
  //       "accept": "application/json, text/plain, */*",
  //       "accept-language": "en-US,en;q=0.9",
  //       "cache-control": "no-cache",
  //       "content-type": "application/json;charset=UTF-8",
  //       "pragma": "no-cache",
  //       "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
  //       "sec-ch-ua-mobile": "?0",
  //       "sec-ch-ua-platform": "\"Windows\"",
  //       "sec-fetch-dest": "empty",
  //       "sec-fetch-mode": "cors",
  //       "sec-fetch-site": "same-origin",
  //       "x-xsrf-token": "189b8q5j2cecuvpgfqo9jqb2a31vrvs53ijtjsdtg3nes0gs0b6b"
  //     },
  //     "referrer": "https://ebay-smartit.onbmc.com/",
  //     "referrerPolicy": "origin",
  //     "body": "{\"filterCriteria\":{\"ticketSpecificStatuses\":[\"Assigned\"],\"assignees\":[{\"loginId\":\"mhixon\"}]},\"chunkInfo\":{\"startIndex\":0,\"chunkSize\":75},\"sortInfo\":{},\"attributeNames\":[\"priority\",\"id\",\"slaStatus\",\"customerName\",\"assignee\",\"summary\",\"status\",\"actualStartDate\",\"submitDate\",\"lastModifiedDate\",\"customerSite\",\"needsAttention\"],\"customAttributeNames\":[]}",
  //     "method": "POST",
  //     "mode": "cors",
  //     "credentials": "include"
  //   });

  // Promise.allSettled()
  //   .then((results) => {

  // });
}

function getWorkOrdersFromSelected(selectedRows) {
  const headerHTML = document.querySelector(
    "#main > div > div.tc__panel > div.tc__list.ng-scope > div > div.ngTopPanel.ng-scope .ngHeaderContainer .ngHeaderScroller"
  );
  const headers = parseColumnHeaders(headerHTML);
  let displayId_idx = headers.indexOf("Display Id");
  console.log({ headers, displayId_idx });

  let workorders = [];
  for (let item of selectedRows) {
    workorders.push(
      item.querySelectorAll("span.ng-binding")[displayId_idx - 1].innerText
    );
  }
  console.log({ workorders });
  return workorders;
}

/**
 * Returns an array of the column headers
 */
function parseColumnHeaders(container) {
  const headers = [];
  for (let inner of container.children) {
    if (inner === container.children[0]) {
      //headers.push("checkbox");
    } else {
      headers.push(inner.querySelector('[ux-id="column-header"]').innerText);
    }
  }
  return headers;
}

/**
 * Parses general workorder and returns each item in an array.
 */
function parseDesc(description) {
  const addr = description.match(/Shipping Address:(.*?)\n/)[1];
  const phone = description.match(/Phone Number:(.*?)\n/)[1];
  return [addr, phone];
}

/**
 * Parses the description on a yubikey workorder and returns each item in an array.
 */
function parseYubiDesc(description, wfh = true) {
  const yubiType = description.match(
    /Do you want a Standard USB Yubikey, or the USB-c type\? : (USB|USB-c)\n/
  )[1];
  const yubi = yubiType === "USB" ? "Yubikey" : "Yubikey USB-C";
  if (wfh) {
    const addr = description.match(/Street Address : (.*)\n/)[1];
    const city = description.match(/City : (.*?)\n/)[1];
    const state = description.match(/State\\\\Province : (.*?)\n/)[1];
    const zip = description.match(/Postal Code : (.*?)\n/)[1];
    const phone = description.match(
      /Phone Number : (.*?)(Show more|\sShow less)/
    )[1];
    return [yubi, addr, city, state, zip, phone];
  }
  return yubi;
}

/**
 * Clicks status element then set's status to complete and reported source to web and finally focuses the save element.
 * Focuses the save element instead of clicking so you can back out in case the shortcut was accidentally pressed.
 */
function setWOComplete() {
  const actionBtn = document.querySelector(
    "#ticket-record-summary > div.editable-content-section__content > div.status-bar__section.ng-scope.ng-isolate-scope > div > div > div.status-bar__status.ng-scope > div"
  );
  Promise.resolve(actionBtn.click()).then(() => {
    const completedEl = document.querySelector(
      '#ticket-record-summary > div.editable-content-section__content.editable-layout-section__content > div.status-bar__section.ng-scope.ng-isolate-scope.status-bar__section-edit > div > div > div.col-sm-4.update-status__dropdown > label > div > ul > li > a[aria-label="Completed"'
    );
    const webEl = document.querySelector(
      '#ticket-record-summary > div.editable-content-section__content.editable-layout-section__content > div.ticket__customized-main-section.ng-scope > div > div:nth-child(2) > div.col-sm-4.layout-renderer__column > div > div:nth-child(4) > div > div > label > div > div > div > ul > li > a[aria-label="Web"'
    );
    const saveEl = document.querySelector(
      "#ticket-record-summary > div.editable-content-section__controls.ng-scope.editable-layout-section__controls-active > div > button.small-btn_primary.ng-binding.ng-scope"
    );
    completedEl.click();
    webEl.click();
    saveEl.focus();
  });
}

