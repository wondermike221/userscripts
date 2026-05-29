import { sendEmailFromTemplate } from '../../../../utils/mailto_utils';
import { fetchTicketData } from '../fetchTicketData';
import { copyExit } from '../actions/copy';
import {
  workdayFirstStrikeTemplate,
  peopleXFirstStrikeTemplate,
  fieldglassFirstStrikeTemplate,
} from '../templates/returns';
import { step, buildSteps, errorNode, type Workflow } from '../workflow';

export const exitWorkflow: Workflow = {
  label: 'Exit Ticket',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    return buildSteps([
      ['sheet', step.action('1. Copy Exit Sheet Row', () => copyExit(data))],
    ]);
  },
};

export const firstStrikeWorkflow: Workflow = {
  label: 'First Strike Email',
  load: async () => {
    const data = await fetchTicketData();
    if (!data || data.type !== 'sc_task')
      return errorNode('Open an SC task first');

    const kbs: [string, ReturnType<typeof step.kb>][] = [
      [
        'kbProcess',
        step.kb(
          'KB: Exit Process',
          'https://placeholder.example.com/exit-process',
        ),
      ],
      [
        'kbFedex',
        step.kb(
          'KB: FedEx Return Labels',
          'https://placeholder.example.com/fedex-returns',
        ),
      ],
    ];

    const source = data.user.dv_u_worker_source;

    const emailStep: [
      string,
      ReturnType<typeof step.action> | ReturnType<typeof step.branch>,
    ] =
      source === 'Workday'
        ? [
            'send',
            step.action('Send Workday Template', () =>
              sendEmailFromTemplate(workdayFirstStrikeTemplate(data)),
            ),
          ]
        : source === 'PeopleX'
          ? [
              'send',
              step.action('Send PeopleX Template', () =>
                sendEmailFromTemplate(peopleXFirstStrikeTemplate(data)),
              ),
            ]
          : source === 'Fieldglass'
            ? [
                'send',
                step.action('Send Fieldglass Template', () =>
                  sendEmailFromTemplate(fieldglassFirstStrikeTemplate(data)),
                ),
              ]
            : [
                'chooseTemplate',
                step.branch(
                  'Choose Template',
                  async () => ['Workday', 'PeopleX', 'Fieldglass'],
                  (value) => {
                    if (value === 'Workday')
                      sendEmailFromTemplate(workdayFirstStrikeTemplate(data));
                    else if (value === 'PeopleX')
                      sendEmailFromTemplate(peopleXFirstStrikeTemplate(data));
                    else if (value === 'Fieldglass')
                      sendEmailFromTemplate(
                        fieldglassFirstStrikeTemplate(data),
                      );
                  },
                ),
              ];

    return buildSteps([...kbs, emailStep]);
  },
};

export const secondStrikeWorkflow: Workflow = {
  label: 'Second Strike Email',
  load: async () => {
    // TODO: implement second strike templates
    return errorNode('Second strike templates not yet implemented');
  },
};
