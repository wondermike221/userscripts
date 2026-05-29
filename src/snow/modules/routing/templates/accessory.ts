import {
  s,
  emailBody,
  makeTrackingLink,
  type EmailTemplate,
} from '../../../../utils/mailto_utils';
import type { ScTaskTicketData } from '../../../api';

export function accessoryDeliveryTemplate(
  data: ScTaskTicketData,
  tracking: string,
): EmailTemplate {
  const { task, user } = data;
  const firstName = (user.dv_name ?? '').split(' ')[0];

  const plainBody = `Great news ${firstName}! Your accessories are on their way.

Tracking: ${tracking}

Please be ready to sign for delivery. We'll be closing your request now.

Thank you,
ITSS Global Support`;

  const htmlBody = emailBody(
    s.p(
      `${s.b('Great news ' + firstName + '!')} Your accessories are on their way.`,
    ),
    s.p(`${s.b('Tracking:')} ${makeTrackingLink(tracking)}`),
    s.p(
      `Please be ready to sign for delivery. We'll be closing your request now.`,
    ),
    s.p('Thank you,<br>ITSS Global Support'),
  );

  return {
    to: user.dv_email ?? '',
    cc: 'servicenow@ebay.com',
    subject: `Deploy Computer Accessories - ${user.dv_name} | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}

export function accessoryDeliveredTemplate(
  data: ScTaskTicketData,
): EmailTemplate {
  const { task, user } = data;
  const firstName = (user.dv_name ?? '').split(' ')[0];

  const plainBody = `Hi ${firstName} –
Our records indicate your equipment was delivered successfully, your equipment request ticket has been closed.

Regards,
ITSS Team`;

  const htmlBody = emailBody(
    s.p(`Hi ${s.b(firstName)} –`),
    s.p(
      'Our records indicate your equipment was delivered successfully, your equipment request ticket has been closed.',
    ),
    s.p('Regards,<br>ITSS Team'),
  );

  return {
    to: user.dv_email ?? '',
    cc: 'servicenow@ebay.com',
    subject: `Deploy IT Equipment | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}
