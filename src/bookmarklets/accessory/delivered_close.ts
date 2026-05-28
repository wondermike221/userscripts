import {
  getSysIdFromUrl,
  getScTask,
  getScReqItem,
  getSysUser,
} from '../../snow/api';
import { build_minimal_json } from '../../utils/snow_utils';
import { EmailTemplate, sendEmailFromTemplate } from '../../utils/mailto_utils';

interface DeliveryInput {
  name: string;
  email: string;
  number: string;
}

const ACCESSORY_DELIVERY_TEMPLATE = (input: DeliveryInput): EmailTemplate => {
  const firstName = input.name.split(' ')[0];
  const plainTextBody = `Hi ${firstName} –
Our records indicate your equipment was delivered successfully, your equipment request ticket has been closed.\n\nRegards,\nITSS Team`;

  return {
    to: input.email,
    cc: 'servicenow@ebay.com',
    subject: `Deploy IT Equipment | ${input.number}`,
    body: plainTextBody,
  };
};

async function doWork() {
  const taskSysId = getSysIdFromUrl('sc_task');
  const task = await getScTask(taskSysId);
  const ritm = task ? await getScReqItem(task.request_item) : null;
  const user = ritm ? await getSysUser(ritm.requested_for) : null;

  if (!task || !user) {
    alert('Failed to load required ticket data.');
    return;
  }

  const baseInput = build_minimal_json(task, user);
  const input: DeliveryInput = { ...baseInput };
  sendEmailFromTemplate(ACCESSORY_DELIVERY_TEMPLATE(input));
}

doWork();
