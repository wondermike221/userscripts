import {
  s,
  emailBody,
  type EmailTemplate,
} from '../../../../utils/mailto_utils';
import {
  convertPlainTextToHTMLTable,
  copyRichTextToClipboard,
} from '../../../../utils';
import type { ScTaskTicketData } from '../../../api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MobileUVariables {
  v_device_type: string;
  street_address: string;
  city: string;
  v_state: string;
  zip: string;
  ship_it: string; // "Ship to Address" | "Office Pickup"
}

export type MobileTicketType = 'new' | 'replacement' | 'unknown';

const OFFICE_ADDRESS = '339 W 13490 S Floor 5, Draper, UT 84020';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseMobileVars(dvUVariables: string | null): MobileUVariables {
  try {
    return JSON.parse(dvUVariables ?? '{}') as MobileUVariables;
  } catch {
    return {
      v_device_type: '',
      street_address: '',
      city: '',
      v_state: '',
      zip: '',
      ship_it: '',
    };
  }
}

// TODO: fill in actual x_ebay_core_config_type/subtype values once extracted from SNOW
export function detectMobileTicketType(
  data: ScTaskTicketData,
): MobileTicketType {
  const type = (data.task.x_ebay_core_config_type ?? '').toLowerCase();
  const subtype = (data.task.x_ebay_core_config_subtype ?? '').toLowerCase();
  if (type.includes('replacement') || subtype.includes('replacement'))
    return 'replacement';
  if (type.includes('new') || subtype.includes('new')) return 'new';
  return 'unknown';
}

export function isAWF(data: ScTaskTicketData): boolean {
  return data.user.dv_u_worker_source !== 'Workday';
}

export function isExceptionVendor(data: ScTaskTicketData): boolean {
  const vendor = (data.user.dv_u_vendor ?? '').toLowerCase();
  return vendor.includes('aramark') || vendor.includes('securitas');
}

interface DeviceNames {
  carrier: string; // email 1: "Apple iPhone 17"
  confirm: string; // email 2: "iPhone 17 - 256 GB"
  manufacturer: string; // sheet: "APPLE" | "SAMSUNG"
  sheetModel: string; // sheet dropdown: "IPHONE 17" | "GALAXY S25 FE"
}

// Add new models here as they are released
function mapDevice(raw: string): DeviceNames {
  const v = raw.toLowerCase();
  if (v.includes('iphone 17'))
    return {
      carrier: 'Apple iPhone 17',
      confirm: 'iPhone 17 - 256 GB',
      manufacturer: 'APPLE',
      sheetModel: 'IPHONE 17',
    };
  if (v.includes('s25 fe') || v.includes('galaxy s25'))
    return {
      carrier: 'Samsung Galaxy S25 FE',
      confirm: 'Galaxy S25 FE - 128 GB',
      manufacturer: 'SAMSUNG',
      sheetModel: 'GALAXY S25 FE',
    };
  if (v.includes('s24 fe') || v.includes('galaxy s24'))
    return {
      carrier: 'Samsung Galaxy S24 FE',
      confirm: 'Galaxy S24 FE - 128 GB',
      manufacturer: 'SAMSUNG',
      sheetModel: 'GALAXY S25 FE',
    };
  // Fallback — tech should verify sheet values
  return {
    carrier: raw,
    confirm: raw,
    manufacturer: raw.toUpperCase(),
    sheetModel: raw.toUpperCase(),
  };
}

// ── Asset tracking sheet row ──────────────────────────────────────────────────
// Paste starts at Manufacturer column (cols 1-3 Asset tag/SAP PO/Line are skipped).
// Columns: Manufacturer | Model | Location | Serial | Vendor | Owned by |
//          User ID | IMEI | Asset function | Created | Ticket # | Ordered Date | Order #

export function copyAssetSheetRow(data: ScTaskTicketData): void {
  const { task, user } = data;
  const vars = parseMobileVars(data.task.dv_u_variables);
  const device = mapDevice(vars.v_device_type);

  const row = [
    device.manufacturer, // Manufacturer
    device.sheetModel, // Model (dropdown)
    user.dv_location ?? task.dv_location ?? '', // Location
    '', // Serial number (empty until shipped)
    'T-MOBILE', // Vendor
    'ryawilson', // Owned by
    user.user_name ?? '', // User ID
    '', // IMEI (empty until shipped)
    'SMARTPHONE', // Asset function
    '', // Created (Uploaded) — skip
    task.dv_number ?? '', // Ticket Number
    new Date().toLocaleDateString(), // Ordered Date
    '', // Order Number (filled after T-Mobile responds)
  ];

  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  copyRichTextToClipboard([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([tsv], { type: 'text/plain' }),
    }),
  ]);
}

function shippingAddress(vars: MobileUVariables): string {
  if (vars.ship_it === 'Office Pickup') return OFFICE_ADDRESS;
  return `${vars.street_address}, ${vars.city}, ${vars.v_state} ${vars.zip}`;
}

// ── Email 1: Carrier Order (T-Mobile) ─────────────────────────────────────────

export function carrierOrderTemplate(
  data: ScTaskTicketData,
  ticketType: MobileTicketType,
  existingCarrier: string,
  existingPhone: string,
): EmailTemplate {
  const { task, user } = data;
  const vars = parseMobileVars(data.task.dv_u_variables);
  const device = mapDevice(vars.v_device_type);
  const address = shippingAddress(vars);
  const isNew = ticketType === 'new';

  const body = `Hi Jessica,

Please order a ${isNew ? 'new' : 'replacement'} ${device.carrier} with ${isNew ? 'new service' : 'upgrade'} for ${user.dv_name} with overnight Shipping

Existing Carrier: ${isNew ? 'N/a' : existingCarrier}
Existing Mobile Number: ${isNew ? 'N/a' : existingPhone}
Account Number: 391999581

Upgrade – ${isNew ? 'No' : 'Yes'}
Device Type / Model: ${device.carrier}
Rate Plan: ZGEV36SUB
Plan Type: Subsidy rate plan
Term: 36-month subsidy agreement

Shipping Information
    User Name: ${user.dv_name}
    Address: ${address}

Please let me know if any further information is needed to complete this.

Thank you,`;

  return {
    to: 'jessica.drummond7@t-mobilesupport.com',
    cc: 'mobileadmin@ebay.com;servicenow@ebay.com',
    subject: `${task.dv_number} - ${task.dv_short_description}`,
    body,
  };
}

// ── Email 2: Order Confirmation to Requester ──────────────────────────────────

export function orderConfirmationTemplate(
  data: ScTaskTicketData,
  shipDate: string,
  orderNumber: string,
): EmailTemplate {
  const { task, user } = data;
  const vars = parseMobileVars(data.task.dv_u_variables);
  const device = mapDevice(vars.v_device_type);
  const kbLink =
    'https://ebayinc.service-now.com/esc?id=kb_article&sysparm_article=KB0015388';
  const returnForm = 'https://ebayinc.service-now.com/esc?id=return_device'; // TODO: confirm URL

  const plainBody = `Hi ${user.dv_name},

Your new device ${device.confirm} has been ordered with overnight shipping.
Estimated Ship Date: ${shipDate}
The Order number is ${orderNumber}

Let us know when you receive your new device so that we can add service with eSIM as the service currently may not allow the change to happen manually.

Please keep in mind that all eBay owned devices need to be returned. You may use this form to assist with returning the device: ${returnForm}
Please make sure that when returning your device that you have removed all user information and locks.

Please let me know if you do not receive your equipment, or if you have any issues during setup.

Company Phone Setup (IOS/Android): ${kbLink}`;

  const htmlBody = emailBody(
    s.p(`Hi ${s.b(user.dv_name ?? '')},`),
    s.p(
      `Your new device ${s.b(device.confirm)} has been ordered with overnight shipping.`,
    ),
    s.p(
      `${s.b('Estimated Ship Date:')} ${shipDate}<br>${s.b('Order Number:')} ${orderNumber}`,
    ),
    s.p(
      'Let us know when you receive your new device so that we can add service with eSIM as the service currently may not allow the change to happen manually.',
    ),
    s.p(
      `Please keep in mind that all eBay owned devices need to be returned. You may use ${s.a(returnForm, 'this form')} to assist with returning the device.<br>Please make sure that when returning your device that you have removed all user information and locks.`,
    ),
    s.p(
      'Please let me know if you do not receive your equipment, or if you have any issues during setup.',
    ),
    s.p(s.a(kbLink, 'Company Phone Setup (IOS/Android)')),
  );

  return {
    to: user.dv_email ?? '',
    cc: 'mobileadmin@ebay.com;servicenow@ebay.com',
    subject: `${task.dv_number} - ${task.dv_short_description}`,
    body: plainBody,
    htmlBody,
  };
}

// ── Email 3a: Legal Exception (Aramark / Securitas) ───────────────────────────

export function legalExceptionTemplate(data: ScTaskTicketData): EmailTemplate {
  const { task, user, manager } = data;
  const vendor = user.dv_u_vendor ?? '';
  const qid = user.dv_x_ebay_core_config_sam_qid ?? '';
  // Country: not directly on user obj in a clean field; default USA, tech can correct
  const country = 'USA';

  const body = `Hi Robin,

We ordered a mobile phone & service line for ${user.dv_name}, who is with ${vendor} for their role with eBay:

QID: ${qid}
Worker Name: ${user.dv_name}
Country: ${country}
Manager: ${manager?.dv_name ?? ''}
Vendor: ${vendor}

Please add to the exception list.`;

  return {
    to: 'robiharris@ebay.com',
    cc: 'servicenow@ebay.com',
    subject: `RE: ${task.dv_number} : New Mobile Phone and Service`,
    body,
  };
}

// ── Email 3b: Legal Approval (AWF, non-exception) ─────────────────────────────

export function legalApprovalTemplate(data: ScTaskTicketData): EmailTemplate {
  const { task, user, manager } = data;
  const firstName = (user.dv_name ?? '').split(' ')[0];

  const body = `Hello ${manager?.dv_name ?? ''},

I am reaching out to you regarding ${user.dv_name}'s request to order a phone with a line of service. ${firstName} is an AWF, so an additional step is required to approve the phone/service line purchased. Below is the list of requested information needed. Once you have this information please respond to this email thread with the information directly to Robin Harris (robiharris@ebay.com) in the To: field and Mobile Management (mobileadmin@ebay.com) in the Cc field. For Robin to approve the purchase with legal, the email with the requested information must come directly from the AWF's manager to Robin Harris. Once we have the approval from Robin, we can proceed with ordering the phone/service line.

AWF name:
AWF title and description of role:
AWF Vendor:
Manager name:
Manager Title:
Business reason why AWF needs phone:

Please let me know if you have any questions.`;

  return {
    to: manager?.dv_email ?? '',
    cc: 'servicenow@ebay.com',
    subject: `${task.dv_number} : New Mobile Phone and Service`,
    body,
  };
}
