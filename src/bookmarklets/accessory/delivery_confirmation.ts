import { get_record, build_minimal_json } from '../../utils/snow_utils';
import {
  EmailTemplate,
  sendEmailFromTemplate,
  makeTrackingLink,
  createSimpleHtmlBody,
  link,
} from '../../utils/mailto_utils';

interface DeliveryInput {
  name: string;
  email: string;
  number: string;
  tracking: string;
}

const ACCESSORY_DELIVERY_TEMPLATE = (input: DeliveryInput): EmailTemplate => {
  //expects a fedex or UPS tracking number
  const trackingLink = makeTrackingLink(input.tracking);
  const plainTextBody = `Great news ${input.name}! Your accessories are on their way.

Shipping Details:
${input.tracking}

Please make a note of your shipping
details and be ready to sign for delivery. We'll be closing your request now. If you have any delivery issues,
please contact us via the below channels.

Hub
Services Chats
Go to Hub Services (hubservices.corp.ebay.com), sign in with your eBay username and password, click the
chat icon in the top-right corner of the window.

Unable to access Hub Services? Give our helpline a call.

Toll-Free: +1(877) 417-7474
North America: +1(408) 376-7474
Europe: +49 (30) 8019 6363
UK: +44 (0) 207 173 4272
Ireland: +353-124-32358
Asia: +86 (21) 2099 3388
India: +91 80 66743100

Thank you,
ITSS Global Support`;

  const htmlBody = createSimpleHtmlBody(`
        <p><strong>Great news ${input.name}!</strong> Your accessories are on their way.</p>
        
        <p><strong>Shipping Details:</strong><br>
        ${trackingLink}</p>
        
        <p>Please make a note of your shipping details and be ready to sign for delivery. We'll be closing your request now. If you have any delivery issues, please contact us via the below channels.</p>
        
        <p><strong>Hub Services Chats</strong><br>
        Go to ${link('https://hubservices.corp.ebay.com', 'Hub Services')} (hubservices.corp.ebay.com), sign in with your eBay username and password, click the chat icon in the top-right corner of the window.</p>
        
        <p><strong>Unable to access Hub Services? Give our helpline a call.</strong></p>
        
        <p><strong>Toll-Free:</strong> ${link('tel:+1(877) 417-7474', '+1(877) 417-7474')}<br>
        <strong>North America:</strong> ${link('tel:+1(408) 376-7474', '+1(408) 376-7474')}<br>
        <strong>Europe:</strong> ${link('tel:+49 (30) 8019 6363', '+49 (30) 8019 6363')}<br>
        <strong>UK:</strong> ${link('tel:+44 (0) 207 173 4272', '+44 (0) 207 173 4272')}<br>
        <strong>Ireland:</strong> ${link('tel:+353-124-32358', '+353-124-32358')}<br>
        <strong>Asia:</strong> ${link('tel:+86 (21) 2099 3388', '+86 (21) 2099 3388')}<br>
        <strong>India:</strong> ${link('tel:+91 80 66743100', '+91 80 66743100')}</p>
        
        <p><strong>Thank you,</strong><br>
        ITSS Global Support</p>
    `);

  return {
    to: input.email,
    cc: 'servicenow@ebay.com',
    subject: `Deploy Computer Accessories - ${input.name} | ${input.number}`,
    body: plainTextBody,
    htmlBody: htmlBody,
  };
};

async function doWork() {
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];

  const baseInput = build_minimal_json(task, user);
  const trackingNumber = prompt('Enter Tracking Number');
  const input: DeliveryInput = {
    ...baseInput,
    tracking: trackingNumber || '',
  };
  const template = ACCESSORY_DELIVERY_TEMPLATE(input);

  sendEmailFromTemplate(template);
}

doWork();
