import { sendEmailFromTemplate } from '../../../../utils/mailto_utils';
import { fetchTicketData } from '../fetchTicketData';
import { step, buildSteps, errorNode, type Workflow } from '../workflow';
import {
  detectMobileTicketType,
  isAWF,
  isExceptionVendor,
  carrierOrderTemplate,
  orderConfirmationTemplate,
  legalExceptionTemplate,
  legalApprovalTemplate,
} from '../templates/mobile';
import type { DirectoryItem } from 'rove';

const KB_EXCEPTION_LIST =
  'https://ebayinc.service-now.com/esc?id=kb_article_view&sysparm_article=KB0015781';
const KB_MOBILE_PROCESS =
  'https://ebayinc.service-now.com/kb?id=kb_article_view&sysparm_article=KB0015759';
const KB_MOBILE_POLICY =
  'https://ebayinc.service-now.com/kb?id=kb_article_view&sysparm_article=KB0015566';

const ASSET_SHEET_URL =
  'https://ebayinc.sharepoint.com/:x:/s/emeaitpurchasing/EWDXV4fE9ORJqVYV2y5NIb4BftE8XALQOdlD7J3f1Et6fw?e=Zuwflj';

export const mobileOrderWorkflow: Workflow = {
  label: 'Mobile Order',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    const ticketType = detectMobileTicketType(data);
    const awf = isAWF(data);
    const exception = isExceptionVendor(data);

    const steps: [string, DirectoryItem][] = [
      // ── KBs ────────────────────────────────────────────────────────────────
      ['kbProcess', step.kb('KB: Mobile Order Process', KB_MOBILE_PROCESS)],
      ['kbPolicy', step.kb('KB: Mobile Policy', KB_MOBILE_POLICY)],
      [
        'kbException',
        step.kb(
          'KB: AWF Exception List (Aramark/Securitas)',
          KB_EXCEPTION_LIST,
        ),
      ],

      // ── Step 1: Eligibility (manual) ────────────────────────────────────────
      [
        'eligibility',
        step.action(
          `1. Evaluate Eligibility  [${ticketType.toUpperCase()} | ${awf ? 'AWF' : 'FTE'}${exception ? ' | EXCEPTION' : ''}]`,
          () => {},
        ),
      ],
    ];

    // Replacement needs existing carrier/phone before the carrier email
    if (ticketType === 'replacement') {
      steps.push([
        'existingCarrier',
        step.input('2a. Existing Carrier', 'text', 'mobileExistingCarrier'),
      ]);
      steps.push([
        'existingPhone',
        step.input('2b. Existing Phone Number', 'text', 'mobileExistingPhone'),
      ]);
    }

    // ── Step 2/3: Carrier order email ─────────────────────────────────────────
    steps.push([
      'carrierEmail',
      step.action(
        `${ticketType === 'replacement' ? '3' : '2'}. Send T-Mobile Order Email`,
        () => {
          const existingCarrier =
            localStorage.getItem('mobileExistingCarrier') ?? '';
          const existingPhone =
            localStorage.getItem('mobileExistingPhone') ?? '';
          sendEmailFromTemplate(
            carrierOrderTemplate(
              data,
              ticketType,
              existingCarrier,
              existingPhone,
            ),
          );
        },
      ),
    ]);

    // ── Asset tracking sheet ──────────────────────────────────────────────────
    steps.push([
      'assetSheet',
      step.action(
        'Open Asset Tracking Sheet',
        () => window.open(ASSET_SHEET_URL, '_blank'),
        // TODO: add copy row format once format is defined
      ),
    ]);

    // ── Wait for T-Mobile response — collect ship date + order number ─────────
    steps.push([
      'shipDate',
      step.input('Ship Date (from T-Mobile)', 'text', 'mobileShipDate'),
    ]);
    steps.push([
      'orderNumber',
      step.input('Order Number (from T-Mobile)', 'text', 'mobileOrderNumber'),
    ]);

    // ── Step: Confirmation email to requester ─────────────────────────────────
    steps.push([
      'confirmEmail',
      step.action('Send Order Confirmation to Requester', () => {
        const shipDate = localStorage.getItem('mobileShipDate') ?? '';
        const orderNumber = localStorage.getItem('mobileOrderNumber') ?? '';
        sendEmailFromTemplate(
          orderConfirmationTemplate(data, shipDate, orderNumber),
        );
      }),
    ]);

    // ── Legal email — AWF + new only ──────────────────────────────────────────
    if (awf && ticketType === 'new') {
      if (exception) {
        steps.push([
          'legalEmail',
          step.action('Send Legal Exception Email (Aramark/Securitas)', () =>
            sendEmailFromTemplate(legalExceptionTemplate(data)),
          ),
        ]);
      } else {
        steps.push([
          'legalEmail',
          step.action('Send Legal Approval Email to Manager', () =>
            sendEmailFromTemplate(legalApprovalTemplate(data)),
          ),
        ]);
      }
    }

    return buildSteps(steps);
  },
};
