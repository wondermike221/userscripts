/**
 * ROVE WORKFLOW ENGINE — INTERACTIVE DEMO & REFERENCE
 * =====================================================
 * Open this userscript on any page, press the rove hotkey (default: Ctrl+Shift+P),
 * and explore each demo live. Read the source alongside.
 *
 * QUICK MENTAL MODEL
 * ------------------
 * A Workflow is a lazy directory: rove calls load() on first activation,
 * caches the returned DirectoryNode, and navigates into it. Every key in
 * that node is a step the technician works through in order.
 *
 * Building blocks (step.*):
 *   step.action(label, fn)                          → runs fn() immediately on select
 *   step.input(label, inputType, storageKey)        → saves to localStorage on change
 *   step.kb(label, url)                             → opens URL in new tab
 *   step.branch(label, loadFn, onSelectFn)          → ephemeral pick list
 *
 * Workflow helpers:
 *   buildSteps([['key', item], ...])                → object from ordered pairs
 *   errorNode('message')                            → abort with visible error step
 *   workflowNode(workflow)                          → wraps Workflow as a lazy DirectoryNodeItem
 */

import { init } from 'rove';
import type { ConsumerConfig, DirectoryItem } from 'rove';
import {
  step,
  buildSteps,
  errorNode,
  workflowNode,
  type Workflow,
} from '../snow/modules/routing/workflow';
import { showToast } from '@violentmonkey/ui';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 1: Minimal — one action, no data
// The simplest possible workflow. Shows the skeleton every workflow shares.
// ─────────────────────────────────────────────────────────────────────────────

const minimalWorkflow: Workflow = {
  label: 'Hello World',
  load: async () =>
    buildSteps([
      [
        'greet',
        step.action('Say Hello', () =>
          showToast('Hello from rove!', { theme: 'dark' }),
        ),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 2: Ordered steps — the guided checklist pattern
//
// buildSteps() takes an ARRAY of [key, item] pairs, not an object literal.
// Order in the array = order displayed. Keys are identifiers (never shown
// to the user); labels are what appears in the UI.
//
// GOTCHA: If you pass a plain object { stepA: ..., stepB: ... }, JS does not
// guarantee insertion-order in all engines. Always use buildSteps([...]).
// ─────────────────────────────────────────────────────────────────────────────

const orderedStepsWorkflow: Workflow = {
  label: 'Ordered Steps',
  load: async () =>
    buildSteps([
      [
        'step1',
        step.action('1. Do first thing', () =>
          showToast('Step 1 done', { theme: 'dark' }),
        ),
      ],
      [
        'step2',
        step.action('2. Do second thing', () =>
          showToast('Step 2 done', { theme: 'dark' }),
        ),
      ],
      [
        'step3',
        step.action('3. Do third thing', () =>
          showToast('All done!', { theme: 'dark' }),
        ),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 3: Input → Action — the collect-then-use pattern
//
// step.input stores the value to localStorage[storageKey] on every keystroke.
// The subsequent step.action reads it from localStorage when the user fires it.
// This means the user can close the palette, come back, and the value persists.
//
// GOTCHA: storageKey must be GLOBALLY unique across all your workflows.
// 'trackingNumber' collides if two workflows both use that key — whichever
// workflow ran last wins. Prefix with workflow name: 'yubikey_tracking'.
//
// GOTCHA: localStorage persists across page loads and ticket navigations.
// If a tech forgets to clear an input, the next ticket inherits the old value.
// The rove InputItem shows the current stored value as the default — remind
// techs to verify inputs before firing the final action.
// ─────────────────────────────────────────────────────────────────────────────

const inputToActionWorkflow: Workflow = {
  label: 'Input → Action',
  load: async () =>
    buildSteps([
      ['nameInput', step.input('Enter your name', 'text', 'demo_name')],
      [
        'greet',
        step.action('Greet by name', () => {
          const name = localStorage.getItem('demo_name') ?? '(empty)';
          showToast(`Hello, ${name}!`, { theme: 'dark' });
        }),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 4: All InputType variants
//
// inputType options: 'text' | 'textarea' | 'checkbox' | 'select' | 'select-multiple'
// For 'select' and 'select-multiple', provide options: string[] on the InputItem.
// Use step.input for 'text'/'textarea'/'checkbox'; for select you need to
// build the InputItem directly since step.input doesn't accept options.
// ─────────────────────────────────────────────────────────────────────────────

const allInputTypesWorkflow: Workflow = {
  label: 'All Input Types',
  load: async () =>
    buildSteps([
      ['textInput', step.input('Text field', 'text', 'demo_text')],
      [
        'textareaInput',
        step.input('Textarea field', 'textarea', 'demo_textarea'),
      ],
      ['checkboxInput', step.input('Checkbox', 'checkbox', 'demo_checkbox')],

      // 'select' and 'select-multiple' need options — build the InputItem directly:
      [
        'selectInput',
        {
          type: 'input',
          label: 'Select (single)',
          inputType: 'select',
          options: ['Option A', 'Option B', 'Option C'],
          storageKey: 'demo_select',
        },
      ],
      [
        'multiInput',
        {
          type: 'input',
          label: 'Select (multi)',
          inputType: 'select-multiple',
          options: ['Red', 'Green', 'Blue'],
          storageKey: 'demo_multi',
        },
      ],

      [
        'readAll',
        step.action('Read all values', () => {
          const vals = [
            'demo_text',
            'demo_textarea',
            'demo_checkbox',
            'demo_select',
            'demo_multi',
          ]
            .map((k) => `${k}: ${localStorage.getItem(k) ?? 'null'}`)
            .join('\n');
          alert(vals);
        }),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 5: KB links
//
// step.kb is just step.action with window.open hardcoded.
// Put KB links at the TOP of buildSteps so techs see them immediately on load.
// Multiple KBs = multiple entries; they stack naturally.
//
// GOTCHA: window.open after a clipboard write (copyRichTextToClipboard) will
// steal focus and cause the write to fail silently. ALWAYS copy first, then open.
// ─────────────────────────────────────────────────────────────────────────────

const kbLinksWorkflow: Workflow = {
  label: 'KB Links',
  load: async () =>
    buildSteps([
      [
        'kb1',
        step.kb('KB: Primary Reference', 'https://example.com/kb/primary'),
      ],
      [
        'kb2',
        step.kb('KB: Secondary Reference', 'https://example.com/kb/secondary'),
      ],
      [
        'doWork',
        step.action('Do the work', () =>
          showToast('Work done', { theme: 'dark' }),
        ),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 6: Conditional steps — dynamic workflow based on runtime data
//
// load() is async and runs arbitrary code before returning the node.
// Build the steps array with push() to conditionally include steps.
// The user sees only the steps relevant to their situation.
//
// This is the core power of the engine: same menu entry, different steps
// depending on what the ticket data says.
// ─────────────────────────────────────────────────────────────────────────────

const conditionalStepsWorkflow: Workflow = {
  label: 'Conditional Steps',
  load: async () => {
    // Simulate fetching data — in real workflows this is fetchTicketData()
    const simulatedUserType: 'fte' | 'awf' =
      Math.random() > 0.5 ? 'fte' : 'awf';
    const isException = simulatedUserType === 'awf' && Math.random() > 0.5;

    const steps: [string, DirectoryItem][] = [
      // Always-present step shows detected context in label
      [
        'context',
        step.action(
          `Detected: ${simulatedUserType.toUpperCase()}${isException ? ' | EXCEPTION' : ''}`,
          () => showToast(`User type: ${simulatedUserType}`, { theme: 'dark' }),
        ),
      ],
      [
        'commonStep',
        step.action('Common step (always runs)', () =>
          showToast('Common', { theme: 'dark' }),
        ),
      ],
    ];

    // Conditionally push steps based on data
    if (simulatedUserType === 'awf') {
      if (isException) {
        steps.push([
          'legalException',
          step.action('Send Exception Email', () =>
            showToast('Exception email sent', { theme: 'dark' }),
          ),
        ]);
      } else {
        steps.push([
          'legalApproval',
          step.action('Send Approval Email', () =>
            showToast('Approval email sent', { theme: 'dark' }),
          ),
        ]);
      }
    }

    return buildSteps(steps);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 7: Async data fetch + closure capture
//
// load() fetches data once, then step actions close over it.
// The data is captured at load time — if the ticket changes after load,
// the captured data is STALE.
//
// GOTCHA (cache staleness): workflowNode caches the load() result permanently
// until the page reloads. If a tech navigates to a different ticket without
// reloading, the workflow still shows the first ticket's data.
// Solution: navigate away and back, or reload the page, to bust the cache.
// Alternatively, put data reads inside step.action instead of at load time
// for fields that might change — but then you lose the ability to make steps
// conditional on that data.
// ─────────────────────────────────────────────────────────────────────────────

const asyncDataWorkflow: Workflow = {
  label: 'Async Data + Closure',
  load: async () => {
    // Simulates an API call — in real workflows: fetchTicketData()
    const data = await new Promise<{ ticketNumber: string; userName: string }>(
      (resolve) =>
        setTimeout(
          () => resolve({ ticketNumber: 'TASK0001234', userName: 'John Doe' }),
          300,
        ),
    );

    // data is now captured in closure — all steps below can use it
    return buildSteps([
      [
        'showTicket',
        step.action(
          `Ticket: ${data.ticketNumber}`, // label baked in at load time
          () =>
            showToast(`Working on ${data.ticketNumber} for ${data.userName}`, {
              theme: 'dark',
            }),
        ),
      ],
      [
        'copyUser',
        step.action('Copy user name', () =>
          navigator.clipboard.writeText(data.userName),
        ),
      ],
    ]);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 8: Branch — ephemeral pick list (SelectItem)
//
// step.branch shows a one-shot pick list. load() returns string[] (option labels).
// onSelect fires with the chosen string. Nav returns to parent after selection.
//
// Use branch when:
//   - You need the user to pick a template/path
//   - Options are dynamic (built from fetched data)
//   - The choice is one-shot (not persisted)
//
// GOTCHA: branch.load() is called EVERY activation (not cached like workflowNode).
// Don't do expensive fetches inside branch.load — capture data in the outer
// workflow's load() closure and just return the labels from branch.load.
// ─────────────────────────────────────────────────────────────────────────────

const branchWorkflow: Workflow = {
  label: 'Branch (Select)',
  load: async () => {
    // Outer load fetches data once
    const simulatedWorkerSource = 'PeopleX'; // would come from fetchTicketData()

    return buildSteps([
      [
        'chooseTemplate',
        step.branch(
          'Choose Email Template',
          // load() on SelectItem runs every time the branch is activated
          // Keep it cheap — just return labels, not new fetches
          async () => [
            'Workday Template',
            'PeopleX Template',
            'Fieldglass Template',
          ],
          (selected) => {
            // onSelect receives the chosen label string
            showToast(
              `Sending: ${selected} (auto-detected: ${simulatedWorkerSource})`,
              { theme: 'dark' },
            );
          },
        ),
      ],
      [
        'after',
        step.action('Step after branch', () =>
          showToast('Branch done, continuing', { theme: 'dark' }),
        ),
      ],
    ]);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 9: Nested workflow — workflowNode inside a workflow's steps
//
// workflowNode() wraps a Workflow as a lazy DirectoryNodeItem.
// You can embed it inside another workflow's buildSteps to create sub-flows.
// Each nested workflowNode has its own independent cache.
//
// GOTCHA: The nested workflow's load() runs when the user navigates INTO it,
// not when the parent loads. If you need both to share fetched data, fetch
// in the parent and pass it via closure rather than using workflowNode —
// workflowNode always runs its own load() independently.
// ─────────────────────────────────────────────────────────────────────────────

const subWorkflow: Workflow = {
  label: 'Sub-Workflow',
  load: async () =>
    buildSteps([
      [
        'subStep1',
        step.action('Sub step 1', () => showToast('Sub 1', { theme: 'dark' })),
      ],
      [
        'subStep2',
        step.action('Sub step 2', () => showToast('Sub 2', { theme: 'dark' })),
      ],
    ]),
};

const nestedWorkflowDemo: Workflow = {
  label: 'Nested Workflows',
  load: async () =>
    buildSteps([
      [
        'beforeSub',
        step.action('1. Do parent step', () =>
          showToast('Parent step', { theme: 'dark' }),
        ),
      ],
      ['subFlow', workflowNode(subWorkflow)], // ← nested: navigates into subWorkflow on select
      [
        'afterSub',
        step.action('3. Parent resumes after sub', () =>
          showToast('Back in parent', { theme: 'dark' }),
        ),
      ],
    ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 10: errorNode — early exit with visible feedback
//
// Return errorNode() (don't throw) when the workflow can't run.
// The user sees a ✗ label and nothing else in the directory.
// Common uses: wrong page, wrong ticket type, missing data.
//
// GOTCHA: errorNode returns a DirectoryNode (an object), not a string or Error.
// Throwing instead of returning will crash the load() silently — rove will
// show an empty directory with no indication of what went wrong.
// ─────────────────────────────────────────────────────────────────────────────

const guardedWorkflow: Workflow = {
  label: 'Guarded Workflow',
  load: async () => {
    const isCorrectPage =
      window.location.hostname === 'ebayinc.service-now.com';

    if (!isCorrectPage) {
      // CORRECT: return errorNode, don't throw
      return errorNode('Must be on ServiceNow — navigate there first');
    }

    return buildSteps([
      [
        'doWork',
        step.action('Do work (only on SNOW)', () =>
          showToast('On SNOW!', { theme: 'dark' }),
        ),
      ],
    ]);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 11: Multi-step data collection (the full real-world pattern)
//
// Combines: async fetch → conditional steps → inputs → action reads inputs.
// This is the mobile order / yubikey pattern distilled.
// ─────────────────────────────────────────────────────────────────────────────

const fullPatternWorkflow: Workflow = {
  label: 'Full Pattern',
  load: async () => {
    // 1. Fetch data once — everything below closes over it
    const data = await new Promise<{ ticketNumber: string; isAwf: boolean }>(
      (r) =>
        setTimeout(() => r({ ticketNumber: 'TASK0009999', isAwf: true }), 200),
    );

    const steps: [string, DirectoryItem][] = [
      // 2. KB links first so tech can reference docs at any time
      ['kb', step.kb('KB: Process Reference', 'https://example.com/kb')],

      // 3. Informational action (label doubles as status display)
      [
        'status',
        step.action(
          `Ticket ${data.ticketNumber} | ${data.isAwf ? 'AWF' : 'FTE'}`,
          () => {},
        ),
      ],

      // 4. Collect external info (arrives later, e.g., from carrier response)
      [
        'orderNum',
        step.input(
          'Order Number (from carrier)',
          'text',
          'fullPattern_orderNum',
        ),
      ],
      [
        'shipDate',
        step.input('Ship Date (from carrier)', 'text', 'fullPattern_shipDate'),
      ],

      // 5. Action reads inputs + uses closure data
      [
        'confirm',
        step.action('Send Confirmation Email', () => {
          const orderNum = localStorage.getItem('fullPattern_orderNum') ?? '';
          const shipDate = localStorage.getItem('fullPattern_shipDate') ?? '';
          showToast(
            `Ticket ${data.ticketNumber}: order ${orderNum}, ships ${shipDate}`,
            { theme: 'dark' },
          );
        }),
      ],
    ];

    // 6. Conditional step — only for AWF
    if (data.isAwf) {
      steps.push([
        'legalEmail',
        step.action('Send Legal Approval', () =>
          showToast('Legal email sent', { theme: 'dark' }),
        ),
      ]);
    }

    return buildSteps(steps);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WIRE UP — build the rove tree and register menu command
// ─────────────────────────────────────────────────────────────────────────────

const config: ConsumerConfig = {
  keyPrefix: 'demo',
  defaults: { mode: 'dir', theme: 'dark' },
  tree: {
    // Each entry is a lazy directory — loads on first activation, then cached
    d1_helloWorld: workflowNode(minimalWorkflow),
    d2_orderedSteps: workflowNode(orderedStepsWorkflow),
    d3_inputToAction: workflowNode(inputToActionWorkflow),
    d4_allInputTypes: workflowNode(allInputTypesWorkflow),
    d5_kbLinks: workflowNode(kbLinksWorkflow),
    d6_conditional: workflowNode(conditionalStepsWorkflow),
    d7_asyncData: workflowNode(asyncDataWorkflow),
    d8_branch: workflowNode(branchWorkflow),
    d9_nested: workflowNode(nestedWorkflowDemo),
    d10_errorNode: workflowNode(guardedWorkflow),
    d11_fullPattern: workflowNode(fullPatternWorkflow),
  },
};

const rove = init(config);
GM_registerMenuCommand('Rove Demo', () => rove.toggle());
