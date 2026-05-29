import { sendEmailFromTemplate } from '../../../../utils/mailto_utils';
import { fetchTicketData } from '../fetchTicketData';
import { copyJson, copyDropship } from '../actions/copy';
import { fillWorkNotes } from '../actions/snow-page';
import {
  accessoryDeliveryTemplate,
  accessoryDeliveredTemplate,
} from '../templates/accessory';
import { step, buildSteps, errorNode, type Workflow } from '../workflow';

export const accessoryDropshipWorkflow: Workflow = {
  label: 'Accessory Dropship',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    return buildSteps([
      [
        'getJson',
        step.action('1. Copy JSON (for label making)', () => copyJson(data)),
      ],
      [
        'sheet',
        step.action('2. Copy Dropship Sheet Row', () => copyDropship(data)),
      ],
      [
        'tracking',
        step.input('3. Tracking Number', 'text', 'accessoryTracking'),
      ],
      [
        'complete',
        step.action('4. Fill Notes + Send Shipping Email', () => {
          const tracking = localStorage.getItem('accessoryTracking') ?? '';
          fillWorkNotes(`Shipped via FedEx. Tracking: ${tracking}`);
          sendEmailFromTemplate(accessoryDeliveryTemplate(data, tracking));
        }),
      ],
    ]);
  },
};

export const accessoryDeliveredWorkflow: Workflow = {
  label: 'Accessory Delivered',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    return buildSteps([
      [
        'send',
        step.action('Send Delivered Email', () => {
          sendEmailFromTemplate(accessoryDeliveredTemplate(data));
        }),
      ],
    ]);
  },
};
