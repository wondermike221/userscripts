export class Shipment {
  name = '';
  email = '';
  what = '';
  address1 = '';
  address2 = '';
  zip = '';
  city = '';
  state = '';
  phone = '';
  work_order = '';
  cost_center = '';
  qty = '';
  constructor(row) {
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
    type: 'text',
  },
  email: {
    selector: '#notificationData\\.recipientNotifications\\.email',
    value: null,
    type: 'text',
  },
  address1: {
    selector: '#toData\\.addressLine1',
    value: null,
    type: 'text',
  },
  address2: {
    selector: '#toData\\.addressLine2',
    value: null,
    type: 'text',
  },
  city: {
    selector: '#toData\\.city',
    value: null,
    type: 'text',
  },
  state: {
    selector: '#toData\\.stateProvinceCode',
    value: null,
    type: 'dropdown',
  },
  zip: {
    selector: '#toData\\.zipPostalCode',
    value: null,
    type: 'text',
  },
  phone: {
    selector: '#toData\\.phoneNumber',
    value: null,
    type: 'text',
  },
  personalMessage: {
    selector: '[name="notificationData.emailMessage"]',
    value: null,
    type: 'text',
  },
  cost_center: {
    selector: '#billingData\\.yourReference',
    value: null,
    type: 'text',
  },
  signature: {
    selector: '#ss\\.signature\\.sel',
    value: 3,
    type: 'dropdown',
  },
  'delivery notification': {
    selector:
      '#notificationData\\.senderNotifications\\.deliveryNotificationFlag',
    value: true,
    type: 'checkbox',
  },
  'exceptions notification': {
    selector:
      '#notificationData\\.recipientNotifications\\.exceptionNotificationFlag',
    value: true,
    type: 'checkbox',
  },
  'estimated delivery notification': {
    selector:
      '#notificationData\\.recipientNotifications\\.estimatedDeliveryNotificationFlag',
    value: true,
    type: 'checkbox',
  },
};

export function addFedExAutofillTextArea() {
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
    resize: 'vertical',
  };
  for (const property in TEXTAREA_STYLES)
    textArea.style[property] = TEXTAREA_STYLES[property];

  colLeft.prepend(textArea);
  textArea.focus();
}

function autofillAction(FORM_FIELDS, e) {
  const ship = new Shipment(e.target.value);

  // click to expand shipment notifications section
  const expandBtn: HTMLElement = document.querySelector(
    '#module\\.emailNotifications\\._headerEdit > a',
  );
  expandBtn.click();

  // set personalMessage value
  FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;

  for (const field in FORM_FIELDS) {
    const fieldItem = document.querySelector(FORM_FIELDS[field].selector);
    switch (FORM_FIELDS[field].type) {
      case 'text':
        fieldItem.value =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
        break;
      case 'dropdown':
        fieldItem.value =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
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
