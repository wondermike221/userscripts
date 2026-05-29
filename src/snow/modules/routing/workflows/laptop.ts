import { errorNode, type Workflow } from '../workflow';

export const laptopReplacementWorkflow: Workflow = {
  label: 'Laptop Replacement',
  load: async () => errorNode('TODO: implement laptop replacement workflow'),
};

export const laptopNewWorkflow: Workflow = {
  label: 'New Laptop',
  load: async () => errorNode('TODO: implement new laptop workflow'),
};
