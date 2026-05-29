import { init } from 'rove';
import type { ComponentInstance, ConsumerConfig } from 'rove';
import { showToast } from '@violentmonkey/ui';
import { initializeUrlTracking } from '../snowURLParser';
import { workflowNode } from './workflow';
import { yubikeyWorkflow } from './workflows/yubikey';
import {
  accessoryDropshipWorkflow,
  accessoryDeliveredWorkflow,
} from './workflows/accessory';
import {
  exitWorkflow,
  firstStrikeWorkflow,
  secondStrikeWorkflow,
} from './workflows/returns';
import {
  laptopReplacementWorkflow,
  laptopNewWorkflow,
} from './workflows/laptop';
import {
  awfNewPhoneWorkflow,
  awfReplacementPhoneWorkflow,
} from './workflows/mobile';

export function initRouting(): ComponentInstance {
  initializeUrlTracking();

  const config: ConsumerConfig = {
    keyPrefix: 'snow',
    defaults: {
      mode: 'dir',
      theme: 'dark',
    },
    tree: {
      accessory: {
        type: 'directory',
        label: 'Accessory',
        children: {
          dropship: workflowNode(accessoryDropshipWorkflow),
          delivered: workflowNode(accessoryDeliveredWorkflow),
          yubikey: workflowNode(yubikeyWorkflow),
        },
      },
      returns: {
        type: 'directory',
        label: 'Returns',
        children: {
          exit: workflowNode(exitWorkflow),
          firstStrike: workflowNode(firstStrikeWorkflow),
          secondStrike: workflowNode(secondStrikeWorkflow),
        },
      },
      laptop: {
        type: 'directory',
        label: 'Laptop',
        children: {
          replacement: workflowNode(laptopReplacementWorkflow),
          new: workflowNode(laptopNewWorkflow),
        },
      },
      mobile: {
        type: 'directory',
        label: 'Mobile',
        children: {
          awfNewPhone: workflowNode(awfNewPhoneWorkflow),
          awfReplacementPhone: workflowNode(awfReplacementPhoneWorkflow),
        },
      },
      config: {
        type: 'directory',
        label: 'Settings',
        children: {
          techNT: {
            type: 'input',
            label: 'Technician NT',
            inputType: 'text',
            storageKey: 'techNT',
            onChange: (value) =>
              showToast(`Tech NT set to: ${value}`, { theme: 'dark' }),
          },
        },
      },
    },
  };

  return init(config);
}
