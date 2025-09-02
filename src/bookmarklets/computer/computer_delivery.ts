import { get_record, build_minimal_json } from '../../utils/snow_utils';
import {
  EmailTemplate,
  sendEmailFromTemplate,
  createSimpleHtmlBody,
} from '../../utils/mailto_utils';

interface DeliveryInput {
  name: string;
  email: string;
  number: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
}

const COMPUTER_DELIVERY_TEMPLATE = (input: DeliveryInput): EmailTemplate => {
  const plainTextBody = `Hi ${input.name},

I hope this message finds you well. I wanted to confirm that your computer equipment has been delivered to your address:

${input.streetAddress}
${input.city}, ${input.state} ${input.postalCode}

Please confirm receipt of the following:
- Computer/Laptop
- Power adapter
- Any additional accessories included

If you have received all items and they are in good working condition, please reply to confirm delivery. If there are any issues with the delivery, missing items, or damage, please let us know immediately so we can resolve the situation.

For setup assistance or technical support, please don't hesitate to reach out.

Thank you for your time.

Best regards,
IT Support Team`;

  const htmlBody = createSimpleHtmlBody(`
        <p>Hi <strong>${input.name}</strong>,</p>
        
        <p>I hope this message finds you well. I wanted to confirm that your computer equipment has been delivered to your address:</p>
        
        <p><strong>Delivery Address:</strong><br>
        ${input.streetAddress}<br>
        ${input.city}, ${input.state} ${input.postalCode}</p>
        
        <p><strong>Please confirm receipt of the following:</strong></p>
        <ul>
            <li>✅ Computer/Laptop</li>
            <li>✅ Power adapter</li>
            <li>✅ Any additional accessories included</li>
        </ul>
        
        <p>If you have <strong>received all items</strong> and they are in good working condition, please reply to confirm delivery.</p>
        
        <p><strong>⚠️ Important:</strong> If there are any issues with the delivery, missing items, or damage, please let us know immediately so we can resolve the situation.</p>
        
        <p><em>For setup assistance or technical support, please don't hesitate to reach out.</em></p>
        
        <p>Thank you for your time.</p>
        
        <p><strong>Best regards,</strong><br>
        IT Support Team</p>
    `);

  return {
    to: input.email,
    cc: 'servicenow@ebay.com',
    subject: `Computer Delivery Confirmation - ${input.name} | ${input.number}`,
    body: plainTextBody,
    htmlBody: htmlBody,
  };
};

async function doWork() {
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];

  const input = build_minimal_json(task, user) as DeliveryInput;
  const template = COMPUTER_DELIVERY_TEMPLATE(input);

  sendEmailFromTemplate(template);
}

doWork();
