import { sendEmailFromTemplate } from '../../../../utils/mailto_utils';
import { fetchTicketData } from '../fetchTicketData';
import { copyJson } from '../actions/copy';
import { fillWorkNotes } from '../actions/snow-page';
import { yubikeyTemplate } from '../templates/yubikey';
import { step, buildSteps, errorNode, type Workflow } from '../workflow';

export const yubikeyWorkflow: Workflow = {
  label: 'YubiKey Ticket',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    return buildSteps([
      [
        'getJson',
        step.action('1. Copy JSON (for label making)', () => copyJson(data)),
      ],
      ['tracking', step.input('2. Tracking Number', 'text', 'yubikeyTracking')],
      [
        'complete',
        step.action('3. Fill Notes + Send Email', () => {
          const tracking = localStorage.getItem('yubikeyTracking') ?? '';
          fillWorkNotes(`Shipped via FedEx. Tracking: ${tracking}`);
          sendEmailFromTemplate(yubikeyTemplate(data, tracking));
        }),
      ],
    ]);
  },
};
