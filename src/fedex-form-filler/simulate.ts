import { Shipment } from './legacy';

// A type guard to check if an element is an HTMLInputElement or HTMLTextAreaElement
function isInputOrTextAreaElement(
  element: HTMLElement,
): element is HTMLInputElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  );
}

function setValue(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error(
      'The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.',
    );
  }

  // Set the value of the input element
  inputElement.value = value;

  // Emit the 'input' event for frameworks that track live input changes
  const inputEvent = new Event('input', { bubbles: true });
  inputElement.dispatchEvent(inputEvent);
}

function triggerChange(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
): void {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error(
      'The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.',
    );
  }

  // Emit the 'change' event for frameworks that track changes on blur or after input
  const changeEvent = new Event('change', { bubbles: true });
  inputElement.dispatchEvent(changeEvent);
}

export function simulateUserInteraction(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  setValue(inputElement, value);
  triggerChange(inputElement);
}

export function autofillAction(e, FORM_FIELDS) {
  const ship = new Shipment(e.target.value);

  // click to expand shipment notifications section
  const expandBtn: HTMLElement = document.querySelector(
    '#module\\.emailNotifications\\._headerEdit > a',
  );
  expandBtn.click();

  // set personalMessage value
  FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;

  for (const field in FORM_FIELDS) {
    const fieldItem = document.querySelector(FORM_FIELDS[field].selector);
    const changeEvent = new Event('change');
    switch (FORM_FIELDS[field].type) {
      case 'text':
        fieldItem.value =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
        fieldItem.dispatchEvent(changeEvent);
        break;
      case 'dropdown':
        fieldItem.selectedIndex =
          FORM_FIELDS[field].value === null
            ? ship[field]
            : FORM_FIELDS[field].value;
        fieldItem.dispatchEvent(changeEvent);
        break;
      case 'checkbox':
        simulateClick(fieldItem);
        break;
      case 'button':
        simulateClick(fieldItem);
        break;
      default:
        console.log("you shouldn't be here");
        break;
    }
  }
}

function simulateClick(elem) {
  // Create our event (with options)
  const evt = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  // If cancelled, don't dispatch our event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canceled = !elem.dispatchEvent(evt);
}
