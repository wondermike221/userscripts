import {
  getSysIdFromUrl,
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
} from '../../snow/api';
import type { AlmHardware } from '../../snow/types';
import { build_exit_json } from '../../utils/snow_utils';
import {
  EmailTemplate,
  formatAssets,
  sendEmailFromTemplate,
  createSimpleHtmlBody,
} from '../../utils/mailto_utils';

interface ReturnInquiryInput {
  name: string;
  managerName: string;
  managerEmail: string;
  taskNumber: string;
  assetsToReturn: Array<{
    model: string;
    serialNumber: string;
    assetTag: string;
  }>;
}

const COMPUTER_RETURN_INQUIRY_TEMPLATE = (
  input: ReturnInquiryInput,
): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  const plainTextBody = `Hi ${input.managerName},

I hope this message finds you well. I am following up regarding the return of computer equipment assigned to ${input.name}.

According to our records, the following items have not been returned:
${formattedAssets}

Could you please help us determine the status of these items? Specifically:
- Has the equipment been returned to a local office or IT department?
- Is the employee still in possession of the equipment?
- Are there any special circumstances we should be aware of?

If the equipment has already been returned, please let us know when and where so we can update our records accordingly.

Thank you for your assistance in resolving this matter.

Best regards,
IT Asset Management Team`;

  const htmlBody = createSimpleHtmlBody(`
        <p>Hi <strong>${input.managerName}</strong>,</p>

        <p>I hope this message finds you well. I am following up regarding the return of computer equipment assigned to <strong>${input.name}</strong>.</p>

        <p><strong>According to our records, the following items have not been returned:</strong></p>
        <p>${formattedAssets.replace(/\n/g, '<br>')}</p>

        <p>Could you please help us determine the status of these items? Specifically:</p>
        <ul>
            <li>Has the equipment been returned to a local office or IT department?</li>
            <li>Is the employee still in possession of the equipment?</li>
            <li>Are there any special circumstances we should be aware of?</li>
        </ul>

        <p><strong>Note:</strong> If the equipment has already been returned, please let us know when and where so we can update our records accordingly.</p>

        <p>Thank you for your assistance in resolving this matter.</p>

        <p><strong>Best regards,</strong><br>
        IT Asset Management Team</p>
    `);

  return {
    to: input.managerEmail,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Computer Return Inquiry - ${input.name} | ${input.taskNumber}`,
    body: plainTextBody,
    htmlBody: htmlBody,
  };
};

async function doWork() {
  const taskSysId = getSysIdFromUrl('sc_task');
  const task = await getScTask(taskSysId);
  const ritm = task ? await getScReqItem(task.request_item) : null;
  const user = ritm ? await getSysUser(ritm.requested_for) : null;
  const manager = user?.manager ? await getSysUser(user.manager) : null;
  const assets = user
    ? await getSnowRecords<AlmHardware>(
        'alm_hardware',
        `assigned_to=${user.sys_id}^install_status=1`,
      )
    : [];

  if (!task || !user || !manager) {
    alert('Failed to load required ticket data.');
    return;
  }

  const task_u_vars = JSON.parse(task.dv_u_variables ?? '{}');
  const filteredAssets = assets.filter((a) =>
    task_u_vars.v_assets_to_return.includes(a.asset_tag),
  );
  const input = build_exit_json(
    task,
    user,
    manager,
    filteredAssets,
  ) as ReturnInquiryInput;
  sendEmailFromTemplate(COMPUTER_RETURN_INQUIRY_TEMPLATE(input));
}

doWork();
