import { render } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { getPanel } from '@violentmonkey/ui';
// global CSS
import globalCss from './style.css';
// CSS modules
import { stylesheet } from './style.module.css';
import { addFedExAutofillTextArea } from './legacy';
import { simulateUserInteraction } from './simulate';

function Counter() {
    const [count, setCount] = createSignal(0);

    return (
        <div>
            <p>Count: {count()}</p>
            <textarea placeholder='Paste excel row here to autofill'></textarea>
            <button onClick={() => setCount(count() + 1)}>Increment</button>
        </div>
    );
}

window.addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    //Legacy autofill
    addFedExAutofillTextArea();

    //updated autofill
    initializeAutofill();
    const panel = getPanel({
        theme: 'dark',
        style: [globalCss, stylesheet].join('\n'),
    });
    Object.assign(panel.wrapper.style, {
        top: '10vh',
        left: '10vw',
    });
    panel.setMovable(true);
    panel.show();
    render(Counter, document);
}


function initializeAutofill() {
    for (const span of document.querySelectorAll('label > span') as NodeListOf<HTMLElement>) {
        span.dataset.label = span.textContent
    }
    //TODO: make list of labels that matter and loop this code through them.
    const inputs = {
        country: {
            selector: ' Country/Territory ',
            value: '193: US',
            type: 'dropdown',
        },
        signature_options: {
            selector: ' Signature options ',
            value: true,
            type: 'checkbox',
        },
        zip: {
            selector: ' Postal code ',
            value: null,
            type: 'text',
        },
        name: {
            selector: " Contact name *(Required)",
            type: "text",
            value: null,
        },
        email: {
            selector: ' Email ',
            value: null,
            type: 'text',
        },
        address1: {
            selector: ' Address line 1 ',
            value: null,
            type: 'text',
        },
        address2: {
            selector: ' Address line 2 ',
            value: null,
            type: 'text',
        },
        city: {
            selector: ' City ',
            value: null,
            type: 'text',
        },
        state: {
            selector: ' State or province ',
            value: null,
            type: 'dropdown',
        },
        phone: {
            selector: ' Phone number ',
            value: null,
            type: 'text',
        },
        cost_center: {
            selector: ' Cost Center ',
            value: null,
            type: 'text',
        },
        signature: {
            selector: ' Select signature type ',
            value: '4: DIRECT',
            type: 'dropdown',
        },
        billing: {
            selector: ' Bill transportation cost to ',
            value: '2: Object',
            type: 'dropdown',
        },
        weight: {
            selector: ' Weight ',
            value: '1',
            type: 'text',
        }
    }
    for (const i of inputs) {
        const input: HTMLInputElement | HTMLTextAreaElement = document.querySelector(`input:has(+ label > span[data-label="${i.selector}"])`)
        simulateUserInteraction(input, i.value);
    }
}