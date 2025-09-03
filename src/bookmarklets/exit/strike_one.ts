import {
  get_record,
  get_records,
  build_exit_json,
} from '../../utils/snow_utils';
import {
  EmailTemplate,
  formatAssets,
  sendEmailFromTemplate,
} from '../../utils/mailto_utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WORKDAY_TEMPLATE = (input: any): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: input.contact_email,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PEOPLEX_TEMPLATE = (input: any): EmailTemplate => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FIELDGLASS_TEMPLATE = (input: any): EmailTemplate => {
  const formattedAssets = formatAssets(input.assetsToReturn);
  return {
    to: 'awf-advisors@ebay.com',
    cc: '',
    subject: `Exited Employee Information Request`,
    body: `Hi Team,
        I have the following exited employees who have not returned their IT equipment and we need their vendor contacts.
        
        -${input.name} (${input.userName})
        ${formattedAssets.replaceAll('\n', '\n\t')}
        Thanks!
        `,
  };
};

async function doWork() {
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];
  const manager = (await get_record('sys_user', user.manager)).records[0];
  const assets = await get_records(
    'alm_hardware',
    `assigned_to=${user.sys_id}^install_status=1`,
  );
  const task_u_vars = JSON.parse(task.dv_u_variables);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredAssets = assets.records.filter((a: any) =>
    task_u_vars.v_assets_to_return.includes(a.asset_tag),
  );
  const input = build_exit_json(task, user, manager, filteredAssets);

  // Execute the appropriate template based on worker source
  let template: EmailTemplate;

  if (user.dv_u_worker_source == 'Workday') {
    template = WORKDAY_TEMPLATE(input);
  } else if (user.dv_u_worker_source == 'PeopleX') {
    template = PEOPLEX_TEMPLATE(input);
  } else if (user.dv_u_worker_source == 'Fieldglass') {
    template = FIELDGLASS_TEMPLATE(input);
  } else {
    // Fallback template
    template = {
      to: input.managerEmail,
      cc: '',
      subject: `Exit Process - ${input.name} (${input.taskNumber})`,
      body: `Exit process notification for ${input.name}.\n\nTask: ${input.taskNumber}\nTermination Date: ${input.terminationDate}\n\nPlease review.`,
    };
  }

  // Send the email using the template
  sendEmailFromTemplate(template);
}
doWork();
