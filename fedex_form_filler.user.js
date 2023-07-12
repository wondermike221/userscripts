
// @name         Autofill FedEx Shipment Form
// @namespace    https://hixon.dev
// @version      0.1
// @description  Adds a textarea to the form that will take in a copied row from a spreadsheet (format below), parses it and fills each input. FORMAT (Date	Site	What	Qty.	Work Order	Email	Cost Center	Who	Address	Address 2	City	State	Zip	Phone)
// @match        https://www.fedex.com/shipping/*
// @icon         https://www.google.com/s2/favicons?domain=fedex.com
// @require      https://raw.githubusercontent.com/wondermike221/userscripts/main/lib.js
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/wondermike221/userscripts/main/fedex_form_filler.user.js
// @homepageURL  https://github.com/wondermike221/userscripts
// ==/UserScript==


/** TODOS
 * [ ] Automatically click check address
 * [ ] Add second submit button near top
 * [ ] 
*/

// CONSTANTS
const TEXTAREA_STYLES = `
      margin-bottom: 5px;
      padding-bottom: 10px;
      width:calc(100% - 5px);
      border-bottom: solid 2px #660099;
      font-weight:bold;
      resize: vertical;
  `;

const FORM_FIELDS = {
  name: {
    selector: 'fedex-input-field[data-test-id="receiver-name"] input',
    value: null,
    type: "text",
  },
  email: {
    selector: 'fedex-input-field[data-test-id="receiver-email"] input',
    value: null,
    type: "text",
  },
  phone: {
    selector: "fedex-input-field[data-test-id='receiver-telephone-number'] input",
    value: null,
    type: "text",
  },
  country: {
    selector: "fedex-input-field[data-test-id='receiver-country-code'] input",
    value: "193", // 193 = United States
    type: "dropdown",
  },
  address1: {
    selector: "fedex-input-field[data-test-id='receiver-address-line1'] input",
    value: null,
    type: "text",
  },
  address2: {
    selector: "fedex-input-field[data-test-id='receiver-address-line2'] input",
    value: null,
    type: "text",
  },
  zip: {
    selector: "fedex-input-sanitised[data-test-id='receiver-postal-code'] input",
    value: null,
    type: "text",
  },
  state: {
    selector: "fedex-input-search[data-test-id='receiver-state-or-province'] input",
    value: null,
    type: "text",
  },
  city: {
    selector: "fedex-input-search[data-test-id='receiver-city'] input",
    value: null,
    type: "text",
  },
  personalMessage: {
    selector: '[name="notificationData.emailMessage"]',
    value: null,
    type: "text",
  },
  cost_center: {
    selector: "#billingData\\.yourReference",
    value: null,
    type: "text",
  },
  signature: {
    selector: "#ss\\.signature\\.sel",
    value: 3,
    type: "dropdown",
  },
  add_email: {
    selector: 'button[data-test-id="add-notification-dropdown"]',
    value: null,
    type: "button",
  },
  add_recipient_email: {
    selector: 'button[data-test-id="add-receiver-notifications"]',
    value: null,
    type: "button",
  },
  "delivery notification": {
    selector:'fedex-checkbox[data-test-id="notification-checkbox"] input',
    value: true,
    type: "checkbox",
  },
  "exceptions notification": {
    selector:
      "#notificationData\\.recipientNotifications\\.exceptionNotificationFlag",
    value: true,
    type: "checkbox",
  },
  "estimated delivery notification": {
    selector:
      "#notificationData\\.recipientNotifications\\.estimatedDeliveryNotificationFlag",
    value: true,
    type: "checkbox",
  },
};

(() => {
  "use strict";

  addFedExAutofillTextArea(FORM_FIELDS, TEXTAREA_STYLES);
  
})();

function addFedExAutofillTextArea(FORM_FIELDS, TEXTAREA_STYLES) {
  const colLeft = document.getElementById("columnLeft");
  const textArea = document.createElement("textarea");
  textArea.placeholder = "Paste excel row here to autofill";
  textArea.addEventListener("input", function (e) {
    autofillAction(FORM_FIELDS, e);
  });
  textArea.style = TEXTAREA_STYLES;
  colLeft.prepend(textArea);
  textArea.focus();
}

function autofillAction(FORM_FIELDS, e) {
  let ship = new Shipment(e.target.value);

  // click to expand shipment notifications section
  document
    .querySelector("#module\\.emailNotifications\\._headerEdit > a")
    .click();

  // set personalMessage value
  FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;

  for (let field in FORM_FIELDS) {
    let fieldItem = document.querySelector(FORM_FIELDS[field].selector);
    switch (FORM_FIELDS[field].type) {
      case "text":
        fieldItem.value =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
        break;
      case "dropdown":
        fieldItem.value =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
        break;
      case "checkbox":
        fieldItem.checked = FORM_FIELDS[field].value;
        break;
      case "button":
        fieldItem.click();
        break;
      default:
        console.log("you shouldn't be here");
        break;
    }
  }
}
