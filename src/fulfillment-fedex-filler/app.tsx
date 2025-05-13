import { render } from 'solid-js/web';
import { getPanel } from '@violentmonkey/ui';
// global CSS
import globalCss from './style.css';
// CSS modules
import { stylesheet } from './style.module.css';
import { simulateUserInteraction } from './simulate';
import { register } from '@violentmonkey/shortcut';
import { onMount } from 'solid-js';
// import { waitForElm } from '../utils';

enum ToggleState {
  Hidden,
  Focused,
  Blurred,
}

function GUI(props) {
  let ref: HTMLTextAreaElement;
  onMount(() => {
    ref.focus();
    const panel = props.panelRef;

    panel.show();
    let toggleState: ToggleState = ToggleState.Focused;
    const updateToggle = () => {
      switch (toggleState) {
        case ToggleState.Hidden:
          toggleState = ToggleState.Focused;
          ref.focus();
          panel.show();
          break;
        case ToggleState.Focused:
          toggleState = ToggleState.Hidden;
          ref.blur();
          panel.hide();
          break;
        case ToggleState.Blurred:
          toggleState = ToggleState.Focused;
          ref.focus();
          break;
      }
    };
    register('ctrl-`', updateToggle);
    register('ctrlcmd-k `', updateToggle);

    ref.addEventListener('blur', () => {
      toggleState = ToggleState.Blurred;
    });
    ref.addEventListener('focus', () => {
      toggleState = ToggleState.Focused;
    });
    initializeAutofill();
  });

  return (
    <div
      style={{
        height: '10vh',
        width: '100%',
        'background-color': 'rgba(0, 0, 0, 0.8)',
        color: 'rgba(51, 51, 51)',
      }}
    >
      <textarea
        ref={ref}
        onInput={props.update}
        placeholder="Paste excel row here to autofill"
        style={{ width: '100%' }}
      ></textarea>
    </div>
  );
}

window.addEventListener('load', () => {
  initializeApp();
});

function initializeApp() {}

function initializeAutofill() {
  const signature_selector = `ui-checkbox[data-test-id="signature-options-checkbox"]`;
  (document.querySelector(signature_selector) as HTMLElement).click();

  const FORM_FIELDS = {
    country: {
      selector: 'receiver-country-code',
      value: '193: US',
      type: 'dropdown',
      elementType: 'select',
    },
    // signature_options: {
    //   selector: 'signature-options-checkbox',
    //   value: true,
    //   type: 'checkbox',
    //   elementType: 'input',
    // },
    zip: {
      selector: 'receiver-postal-code',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    name: {
      selector: 'receiver-name',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    email: {
      selector: 'receiver-email',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    address1: {
      selector: 'receiver-address-line1',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    address2: {
      selector: 'receiver-address-line2',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    city: {
      selector: 'receiver-city',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    phone: {
      selector: 'receiver-telephone-number',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    cost_center: {
      selector: 'references-input-control',
      value: null,
      type: 'text',
      elementType: 'input',
    },
    signature: {
      selector: 'signature-option',
      value: '4: DIRECT',
      type: 'dropdown',
      elementType: 'select',
    },
    billing: {
      selector: 'bill-to',
      value: '2: Object',
      type: 'dropdown',
      elementType: 'select',
    },
    weight: {
      selector: 'weight-0',
      value: '1',
      type: 'text',
      elementType: 'input',
    },
    state: {
      selector: 'receiver-state-or-province',
      value: null,
      type: 'dropdown',
      elementType: 'select',
    },
    service: {
      selector: 'service',
      value: '5: PRIORITY_OVERNIGHT',
      type: 'dropdown',
      elementType: 'select',
    },
  };

  function autoFillAction() {
    // const ship = new Shipment(e.target.value);
    for (const field in FORM_FIELDS) {
      const selector = `[data-test-id="${FORM_FIELDS[field].selector}"] ${FORM_FIELDS[field].elementType}`;
      const input: HTMLInputElement | HTMLTextAreaElement =
        document.querySelector(selector);
      simulateUserInteraction(input, FORM_FIELDS[field].value);
    }
  }

  const panel = getPanel({
    theme: 'dark',
    style: [globalCss, stylesheet].join('\n'),
  });
  Object.assign(panel.wrapper.style, {
    display: 'block',
    width: '100%',
    position: 'relative',
    bottom: 'calc(100 - var(20vh))',
    left: 0,
    right: 0,
    transition: 'all 0.1s ease-out',
    overflowY: 'scroll',
  });

  render(() => <GUI update={autoFillAction} panelRef={panel} />, panel.body);
}
