import { get_record, get_records } from '../../utils/snow_utils';
import {
  EmailTemplate,
  sendEmailFromTemplate,
  formatAssets,
} from '../../utils/mailto_utils';

// Template 1: [Add your template name here]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_1 = (input: any): EmailTemplate => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_2 = (input: any): EmailTemplate => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_3 = (input: any): EmailTemplate => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_4 = (input: any): EmailTemplate => {
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
  // Fetch data from ServiceNow
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];

  // Get assets if needed
  const assets = await get_records(
    'alm_hardware',
    `assigned_to=${user.sys_id}^install_status=1`,
  );

  // Build input data
  const input = {
    name: user.name || user.user_name,
    email: user.email,
    number: task.number,
    taskNumber: task.number,
    assetsToReturn: assets.records,
    // Add any other fields you need
  };

  // Template chooser dialog
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
