import {
  s,
  emailBody,
  formatAssets,
  type EmailTemplate,
  type Asset,
} from '../../../../utils/mailto_utils';
import type { ScTaskTicketData } from '../../../api';

function assetsFromData(data: ScTaskTicketData): Asset[] {
  const taskUVars = JSON.parse(data.task.dv_u_variables ?? '{}');
  return data.assets
    .filter((a) => taskUVars.v_assets_to_return?.includes(a.asset_tag))
    .map((a) => ({
      model: a.dv_model ?? '',
      serialNumber: a.dv_serial_number ?? '',
      assetTag: a.dv_asset_tag ?? '',
    }));
}

export function workdayFirstStrikeTemplate(
  data: ScTaskTicketData,
): EmailTemplate {
  const { task, user } = data;
  const assets = assetsFromData(data);
  const formattedAssets = formatAssets(assets);
  const contactEmail =
    JSON.parse(data.task.dv_u_variables ?? '{}').contact_email ?? '';

  const plainBody = `Dear ${user.dv_name},

I hope this message finds you well. I am writing to request the return of company equipment that was assigned to you. Per our records, the following items were issued and have not been returned:

${formattedAssets}
We kindly ask these items to be returned promptly after leaving the company. A FedEx QR code has been sent to your personal email address on file. This code will allow FedEx to package and ship these items to us and makes returning items seamless and free of charge for you. This email will come directly from FedEx – not eBay. If you do not see this, please check your junk/spam folder.

Thank you for your prompt attention to this matter. If you have any questions, please contact us at itreturns@ebay.com.

Best regards,`;

  const htmlBody = emailBody(
    s.p(`Dear ${s.b(user.dv_name ?? '')},`),
    s.p(
      'I hope this message finds you well. I am writing to request the return of company equipment that was assigned to you. Per our records, the following items were issued and have not been returned:',
    ),
    s.ul(
      assets.map(
        (a) => `${a.model} [SN: ${a.serialNumber}, Tag: ${a.assetTag}]`,
      ),
    ),
    s.p(
      'We kindly ask these items to be returned promptly after leaving the company. A FedEx QR code has been sent to your personal email address on file. This code will allow FedEx to package and ship these items to us free of charge. This email will come directly from FedEx – not eBay. If you do not see it, please check your junk/spam folder.',
    ),
    s.p(
      `Thank you for your prompt attention to this matter. If you have any questions, please contact us at ${s.a('mailto:itreturns@ebay.com', 'itreturns@ebay.com')}.`,
    ),
    s.p('Best regards,'),
  );

  return {
    to: contactEmail,
    cc: `${data.manager?.dv_email ?? ''};itreturns@ebay.com;servicenow@ebay.com`,
    subject: `Request for Returned Equipment - ${user.dv_name} | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}

export function peopleXFirstStrikeTemplate(
  data: ScTaskTicketData,
): EmailTemplate {
  const { task, user, manager } = data;
  const assets = assetsFromData(data);
  const formattedAssets = formatAssets(assets);

  const plainBody = `Hi ${manager?.dv_name ?? 'Manager'},

Your exited employee ${user.dv_name} has not returned their equipment.
${formattedAssets}
IT can handle the return but since they were onboarded directly via PeopleX we need your help to get the information necessary to start the process.

Please reply with the following information:
- Personal Email
- Phone Number
- Address

If they have already returned their equipment, please let me know when and where so we may follow up with the local site.

Thanks!`;

  const htmlBody = emailBody(
    s.p(`Hi ${s.b(manager?.dv_name ?? 'Manager')},`),
    s.p(
      `Your exited employee ${s.b(user.dv_name ?? '')} has not returned their equipment.`,
    ),
    s.ul(
      assets.map(
        (a) => `${a.model} [SN: ${a.serialNumber}, Tag: ${a.assetTag}]`,
      ),
    ),
    s.p(
      'IT can handle the return but since they were onboarded directly via PeopleX we need your help to get the information necessary to start the process.',
    ),
    s.p('Please reply with the following information:'),
    s.ul(['Personal Email', 'Phone Number', 'Address']),
    s.p(
      'If they have already returned their equipment, please let me know when and where so we may follow up with the local site.',
    ),
    s.p('Thanks!'),
  );

  return {
    to: manager?.dv_email ?? '',
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Request for Returned Equipment - ${user.dv_name} | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}

export function fieldglassFirstStrikeTemplate(
  data: ScTaskTicketData,
): EmailTemplate {
  const { task, user } = data;
  const assets = assetsFromData(data);
  const formattedAssets = formatAssets(assets);
  const contactEmail =
    JSON.parse(data.task.dv_u_variables ?? '{}').contact_email ?? '';

  const plainBody = `Hi <point of contact>,

We are looking for the return information for the device(s) listed below from an exited member of your team ${user.dv_name}. Please provide the following information so we can ensure proper processing for this asset return.

Carrier:
Tracking Number:
eBay office being shipped to:

As a reminder we ask for all eBay items to be returned within 10 days.

Thank you for your cooperation,

Unreturned Devices:
${formattedAssets}`;

  const htmlBody = emailBody(
    s.p('Hi <point of contact>,'),
    s.p(
      `We are looking for the return information for the device(s) listed below from an exited member of your team ${s.b(user.dv_name ?? '')}. Please provide the following information so we can ensure proper processing for this asset return.`,
    ),
    s.ul(['Carrier:', 'Tracking Number:', 'eBay office being shipped to:']),
    s.p(
      'As a reminder we ask for all eBay items to be returned within 10 days.',
    ),
    s.p('Thank you for your cooperation,'),
    s.p(`${s.b('Unreturned Devices:')}`),
    s.ul(
      assets.map(
        (a) => `${a.model} [SN: ${a.serialNumber}, Tag: ${a.assetTag}]`,
      ),
    ),
  );

  return {
    to: contactEmail,
    cc: 'servicenow@ebay.com',
    subject: `eBay Asset Return for ${user.dv_name} | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}
