import { showToast } from '@violentmonkey/ui';
import { getCostCenterFromHub, copyTextToClipboard } from '../../../utils';

/**
 * Scrapes a specific workorder for relevant data, organize's it to my spreadsheet's format and adds a button/keyboard shortcut to copy to clipboard
 */
export default async function scrapeAndCopy(sheet) {
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }
  spinner.classList.remove('hidden');
  const title = document
    .querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]')
    .textContent.trim();
  const name = document
    .querySelector('#ticket-record-summary a[ux-id="assignee-name"]')
    .textContent.trim();
  const email = document
    .querySelector('#ticket-record-summary a[ux-id="email-value"]')
    .textContent.trim();
  const ticket_number = document
    .querySelector(
      '#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]',
    )
    .textContent.trim();
  const URL = document.location.href;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Ticket_ID = URL.split('/').slice(-1)[0];
  const description: HTMLElement = document.querySelector(
    '#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]',
  );
  const descText = description.textContent || description.innerText;

  const isYubikeyRequest =
    title.toLowerCase().indexOf('yubikey') !== -1 ||
    title.toLowerCase().indexOf('privileged token') !== -1;
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
      [signee, address, city, state, zip, country, phone, yubi] =
        parseYubiDesc(descText);
    }
  } else if (isLaptopRequest) {
    // let shipped, address = ''
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [signee, addr, phone_number, shipped] =
      parseLaptopRequestDesc(descText);
    const parsedAddress = await parseUSAddress(addr);
    address = parsedAddress.address;
    city = parsedAddress.city;
    state = parsedAddress.state;
    zip = parsedAddress.zip;
    phone = phone_number;
  } else {
    const shipOrOfficeRegex =
      /Do you work primarily from Home or in a site without Local IT\?:(Yes|No)\n/;
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
    day: 'numeric',
  });
  const what = yubi || '';

  let cost_center = 'default';

  const linkedTicketNumber = `${ticket_number}`;
  // linkedTicketNumber.link = URL;

  const costCenterCode = await getCostCenterFromHub(HUB_PROFILE_URL);
  cost_center = costCenterCode;

  if (signee.split(' ').length > 2) {
    showToast('Signee has more than 2 names');
  }
  if (signee != '' && name != signee) {
    showToast('The name and Signee are different values');
  }

  const split = name.split(' ');
  const firstName = split[0];
  const lastName = split[split.length - 1];

  const isSoftwareRequest =
    title.toLowerCase().indexOf('software request') !== -1;

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
  showToast(`${notif_title}: ${body}`, { theme: 'dark' });
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
  const signee = description.match(
    /Name of Individual who will sign for packages:(.*?)(Show more|\sShow less|\n|$)/,
  )[1];
  if (/Preferred Contact Number:/.test(description)) {
    const addr = description.match(/Street Address:(.*?)\n/)[1];
    const countryMatch = description.match(/Country:(.*?)\n/)[1];
    const country =
      countryMatch.toLowerCase().includes('united') &&
      countryMatch.toLowerCase().includes('states')
        ? 'USA'
        : countryMatch;
    const state = description.match(/State\/Province:(.*?)\n/)[1];
    const phone =
      description.match(/Preferred Contact Number:(.*?)\n/)[1] ?? 'n/a';
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
  const yubiType = description.match(
    /Do you want a Standard USB Yubikey, or the USB-c type\? : (USB|USB-c)\n/,
  )[1];
  const yubi = yubiType === 'USB' ? 'Yubikey' : 'Yubikey USB-C';
  const shipOrOfficeRegex =
    /Where would you like your Yubikey shipped\? : (.*?)(Request\sType|\n|$)/;
  if (description.match(shipOrOfficeRegex)[1] != 'Desk Location') {
    const signee = description.match(/Name : (.*)\n/)[1];
    const addr = description.match(/Street Address : (.*)\n/)[1];
    const city = description.match(/City : (.*?)\n/)[1];
    const state = description.match(/State\\\\Province : (.*?)\n/)[1];
    const zip = description.match(/Postal Code : (.*?)\n/)[1];
    const countryMatch = description.match(/Country : (.*?)\n/)[1];
    const country =
      countryMatch.toLowerCase().includes('united') &&
      countryMatch.toLowerCase().includes('states')
        ? 'USA'
        : countryMatch;
    const phone = description.match(
      /Phone Number : (.*?)(Show more|\sShow less|\n|$)/,
    )[1];
    return [signee, addr, city, state, zip, country, phone, yubi];
  }
  //      signee, addr, city, state, zip, country, phone, yubi
  return ['', '', '', '', '', '', '', yubi];
}

function parseLaptopRequestDesc(description) {
  const shipped = description.match(
    /Would you like it shipped to you\? : (Yes|No, I will pickup from my local office) \n/,
  )[1];
  if (shipped === 'Yes') {
    const address = description.match(
      /Shipping Address : ((.|\n)*)\nPhone Number/,
    )[1];
    const signee = description.match(
      /Name of Individual who will sign for packages : (.*?)\n/,
    )[1];
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

    if (
      stateZipParts.length > 1 &&
      stateRegex.test(stateZipParts[stateZipParts.length - 2])
    ) {
      state = stateZipParts[stateZipParts.length - 2];
    }
    if (
      stateZipParts.length > 1 &&
      zipRegex.test(stateZipParts[stateZipParts.length - 1])
    ) {
      zip = stateZipParts[stateZipParts.length - 1];
    }
  }

  return {
    address: address,
    city: city,
    state: state,
    zip: zip,
  };
}
