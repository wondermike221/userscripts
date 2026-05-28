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
} from '../../utils/mailto_utils';

const WORKDAY_TEMPLATE = (
  input: ReturnType<typeof build_exit_json>,
): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.u_variables.contact_email,
    cc: `${input.managerEmail};itreturns@ebay.com;servicenow@ebay.com`,
    subject: `Request for Returned Equipment - ${input.name} | ${input.taskNumber}`,
    body: `Dear ${input.name},

        I hope this message finds you well. I am writing to request the return of company equipment that was assigned to you. Per our records, the following items were issued and have not been returned:

        ${formattedAssets}
        We kindly ask these items to be returned promptly after leaving the company. A FedEx QR code has bleenl sent to your personal email address on file . This code will allow FedEx to package and ship these items to us and makes returning items seamless and quickly and free of charge for you. This email will come directly from FedEx – not ebay. If you do not see this, please check your junk\\spam folder.

        Thank you for your prompt attention to this matter.  If you have any questions or require further information, please feel free to contact us directly at itreturns@ebay.com.

        Best regards,
        `,
  };
};

const PEOPLEX_TEMPLATE = (
  input: ReturnType<typeof build_exit_json>,
): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.managerEmail,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Request for Returned Equipment - ${input.name} | ${input.taskNumber}`,
    body: `Hi ${input.managerName},

        Your exited employee ${input.name} has not returned their equipment.
        ${formattedAssets}
        IT can handle the return but since they were onboarded directly via peoplex we need your help to get the information necessary to start the process.
        Please reply with the following information.
        - Personal Email
        - Phone Number
        - Address
        If they have already returned their equipment, please let me know when and where so we may follow up with the local site.

        Thanks!`,
  };
};

const FIELDGLASS_TEMPLATE = (
  input: ReturnType<typeof build_exit_json>,
): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.u_variables.contact_email,
    cc: 'servicenow@ebay.com',
    subject: `eBay Asset Return for ${input.name} | ${input.taskNumber}`,
    body: `Hi <point of contact>,

We are looking for the return information for the device/s listed below from an exited member of your team ${input.name}. Please provide the following information so we can ensure proper processing for this asset return.

Carrier:

Tracking Number:

Ebay office being shipped to:

As a reminder we ask for all eBay items to be returned, laptop, badge, company phone and related. We do ask for items to be returned within 10 days.

Thank you for your cooperation,

Unreturned Devices:
${formattedAssets.replaceAll('\n', '\n\t')}`,
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
  const input = build_exit_json(task, user, manager, filteredAssets);

  let template: EmailTemplate;
  if (user.dv_u_worker_source == 'Workday') {
    template = WORKDAY_TEMPLATE(input);
  } else if (user.dv_u_worker_source == 'PeopleX') {
    template = PEOPLEX_TEMPLATE(input);
  } else if (user.dv_u_worker_source == 'Fieldglass') {
    template = FIELDGLASS_TEMPLATE(input);
  } else {
    template = {
      to: input.managerEmail,
      cc: '',
      subject: `Exit Process - ${input.name} (${input.taskNumber})`,
      body: `Exit process notification for ${input.name}.\n\nTask: ${input.taskNumber}\nTermination Date: ${input.terminationDate}\n\nPlease review.`,
    };
  }

  sendEmailFromTemplate(template);
}

doWork();
