// ==UserScript==
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

(function () {
  "use strict";

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
      selector: "#toData\\.contactName",
      value: null,
      type: "text",
    },
    email: {
      selector: "#notificationData\\.recipientNotifications\\.email",
      value: null,
      type: "text",
    },
    address1: {
      selector: "#toData\\.addressLine1",
      value: null,
      type: "text",
    },
    address2: {
      selector: "#toData\\.addressLine2",
      value: null,
      type: "text",
    },
    city: {
      selector: "#toData\\.city",
      value: null,
      type: "text",
    },
    state: {
      selector: "#toData\\.stateProvinceCode",
      value: null,
      type: "dropdown",
    },
    zip: {
      selector: "#toData\\.zipPostalCode",
      value: null,
      type: "text",
    },
    phone: {
      selector: "#toData\\.phoneNumber",
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
    "delivery notification": {
      selector:
        "#notificationData\\.senderNotifications\\.deliveryNotificationFlag",
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
      default:
        console.log("you shouldn't be here");
        break;
    }
  }
}
