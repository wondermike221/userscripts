import {
  getSysIdFromUrl,
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
} from '../../snow/api';
import type { AlmHardware } from '../../snow/types';
import {
  Asset,
  EmailTemplate,
  sendEmailFromTemplate,
  formatAssets,
} from '../../utils/mailto_utils';

type TemplateInput = {
  name: string;
  email: string;
  number: string;
  assetsToReturn: Asset[];
};

// Template 1: [Add your template name here]
const TEMPLATE_1 = (input: TemplateInput): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.email,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Return Equipment - ${input.name} | ${input.number}`,
    body: `Hi ${input.name},

[Your template content here]

Assets to return:
${formattedAssets}

Thank you,
ITSS`,
  };
};

// Template 2: [Add your template name here]
const TEMPLATE_2 = (input: TemplateInput): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.email,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Return Equipment - ${input.name} | ${input.number}`,
    body: `Hi ${input.name},

[Your template content here]

Assets to return:
${formattedAssets}

Thank you,
ITSS`,
  };
};

// Template 3: [Add your template name here]
const TEMPLATE_3 = (input: TemplateInput): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.email,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Return Equipment - ${input.name} | ${input.number}`,
    body: `Hi ${input.name},

[Your template content here]

Assets to return:
${formattedAssets}

Thank you,
ITSS`,
  };
};

// Template 4: [Add your template name here]
const TEMPLATE_4 = (input: TemplateInput): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.email,
    cc: 'itreturns@ebay.com;servicenow@ebay.com',
    subject: `Return Equipment - ${input.name} | ${input.number}`,
    body: `Hi ${input.name},

[Your template content here]

Assets to return:
${formattedAssets}

Thank you,
ITSS`,
  };
};

async function doWork() {
  const taskSysId = getSysIdFromUrl('sc_task');
  const task = await getScTask(taskSysId);
  const ritm = task ? await getScReqItem(task.request_item) : null;
  const user = ritm ? await getSysUser(ritm.requested_for) : null;
  const assets = user
    ? await getSnowRecords<AlmHardware>(
        'alm_hardware',
        `assigned_to=${user.sys_id}^install_status=1`,
      )
    : [];

  if (!task || !user) {
    alert('Failed to load required ticket data.');
    return;
  }

  const input: TemplateInput = {
    name: user.dv_name ?? user.user_name,
    email: user.email,
    number: task.number,
    assetsToReturn: assets.map((a) => ({
      model: a.dv_model ?? '',
      serialNumber: a.dv_serial_number ?? '',
      assetTag: a.dv_asset_tag ?? '',
    })),
  };

  const choice = prompt(
    'Choose a template:\n1 - [Template 1 name]\n2 - [Template 2 name]\n3 - [Template 3 name]\n4 - [Template 4 name]',
    '1',
  );

  let template: EmailTemplate;
  switch (choice) {
    case '1':
      template = TEMPLATE_1(input);
      break;
    case '2':
      template = TEMPLATE_2(input);
      break;
    case '3':
      template = TEMPLATE_3(input);
      break;
    case '4':
      template = TEMPLATE_4(input);
      break;
    default:
      alert('Invalid choice. Please select 1-4.');
      return;
  }

  sendEmailFromTemplate(template);
}

doWork();
