import { get_record, build_minimal_json } from '../../utils/snow_utils';
import { EmailTemplate, sendEmailFromTemplate } from '../../utils/mailto_utils';
// import { ShadowQuery } from '../../utils/ShadowQuery';

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

// Function to add text to work notes
// function addToWorkNotes(text: string) {
//   // TODO: Replace with actual ServiceNow work notes selector
//   const workNotesSelector = 'textarea[name="work_notes"]';
//   const workNotesElement = ShadowQuery.find(workNotesSelector) as HTMLTextAreaElement;

//   if (workNotesElement) {
//     // Add the text to existing work notes (if any)
//     const existingText = workNotesElement.value;
//     const newText = existingText ? `${existingText}\n\n${text}` : text;
//     workNotesElement.value = newText;

//     // Trigger change event to ensure ServiceNow recognizes the update
//     workNotesElement.dispatchEvent(new Event('change', { bubbles: true }));
//     workNotesElement.dispatchEvent(new Event('input', { bubbles: true }));

//     console.log('Added text to work notes:', text);
//   } else {
//     console.warn('Work notes element not found. Please update the selector:', workNotesSelector);
//   }
// }

// Function to add text to work notes
// function addToComments(text: string) {
//   // TODO: Replace with actual ServiceNow work notes selector
//   const commentsSelector = 'textarea[name="work_notes"]';
//   const commentsElement = ShadowQuery.find(commentsSelector) as HTMLTextAreaElement;

//   if (commentsElement) {
//     // Add the text to existing work notes (if any)
//     const existingText = commentsElement.value;
//     const newText = existingText ? `${existingText}\n\n${text}` : text;
//     commentsElement.value = newText;

//     // Trigger change event to ensure ServiceNow recognizes the update
//     commentsElement.dispatchEvent(new Event('change', { bubbles: true }));
//     commentsElement.dispatchEvent(new Event('input', { bubbles: true }));

//     console.log('Added text to work notes:', text);
//   } else {
//     console.warn('Work notes element not found. Please update the selector:', commentsElement);
//   }
// }

// Function to close the ticket
/* function closeTicket() {
  // TODO: Replace with actual ServiceNow close ticket selector
  const closeButtonSelector = '[data-action="close"]'; // Placeholder selector
  const closeButton = document.querySelector(closeButtonSelector) as HTMLButtonElement;

  if (closeButton) {
    closeButton.click();
    console.log('Ticket close button clicked');
  } else {
    console.warn('Close button not found. Please update the selector:', closeButtonSelector);
  }
} */

async function doWork() {
  const task = (await get_record('sc_task')).records[0];
  const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
  const user = (await get_record('sys_user', ritm.requested_for)).records[0];

  const baseInput = build_minimal_json(task, user);
  const input: DeliveryInput = {
    ...baseInput,
  };
  const template = ACCESSORY_DELIVERY_TEMPLATE(input);

  // Send the email
  sendEmailFromTemplate(template);

  // Not necessary since email cc put's body into comments for us.
  // Add the plain text email content to work notes
  // const commentsText = `${template.body}`;
  // addToComments(commentsText);

  // TODO: Uncomment when ready to auto-close tickets
  // closeTicket();
}

doWork();
