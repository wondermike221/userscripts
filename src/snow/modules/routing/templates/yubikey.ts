import {
  s,
  emailBody,
  type EmailTemplate,
} from '../../../../utils/mailto_utils';
import type { ScTaskTicketData } from '../../../api';

export function yubikeyTemplate(
  data: ScTaskTicketData,
  tracking: string,
): EmailTemplate {
  const { task, user } = data;
  const firstName = (user.dv_name ?? '').split(' ')[0];

  const plainBody = `Hi ${firstName},

Your YubiKey has been shipped! Tracking: ${tracking}

Please let us know once you receive it.

Regards,
ITSS Team`;

  const htmlBody = emailBody(
    s.p(`Hi ${s.b(firstName)},`),
    s.p('Your YubiKey has been shipped!'),
    s.p(`${s.b('Tracking:')} ${tracking}`),
    s.p('Please let us know once you receive it.'),
    s.p('Regards,<br>ITSS Team'),
  );

  return {
    to: user.dv_email ?? '',
    cc: 'servicenow@ebay.com',
    subject: `${task.dv_short_description} | ${task.dv_number}`,
    body: plainBody,
    htmlBody,
  };
}
