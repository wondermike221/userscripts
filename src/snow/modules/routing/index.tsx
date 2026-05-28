import { init } from 'rove';
import type { ComponentInstance, ConsumerConfig } from 'rove';
import { showToast } from '@violentmonkey/ui';
import {
  convertPlainTextToHTMLTable,
  copyRichTextToClipboard,
} from '../../../utils';
import { createAndInvokeMailto } from '../../../utils/mailto_utils';
import * as snow from '../../../utils/snow_utils';
import { getScTask, getScReqItem, getSysUser, getSnowRecords } from '../../api';
import type { AlmHardware, SysUser } from '../../types';
import { initializeUrlTracking, getCurrentRecord } from '../snowURLParser';

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchTicketData() {
  const { sysId: taskSysId } = getCurrentRecord();
  if (!taskSysId) {
    showToast('No SNOW record detected in URL', { theme: 'dark' });
    return null;
  }
  const task = await getScTask(taskSysId);
  if (!task) {
    showToast('Failed to load task', { theme: 'dark' });
    return null;
  }
  const ritm = await getScReqItem(task.request_item);
  if (!ritm) {
    showToast('Failed to load RITM', { theme: 'dark' });
    return null;
  }
  const user = await getSysUser(ritm.requested_for);
  if (!user) {
    showToast('Failed to load user', { theme: 'dark' });
    return null;
  }
  return { task, ritm, user };
}

// ── Email helper ──────────────────────────────────────────────────────────────

function openEmail(user: SysUser, subject: string, body = '') {
  createAndInvokeMailto(
    user.dv_email ?? '',
    'servicenow@ebay.com',
    subject,
    body,
  );
  showToast('Email draft opened', { theme: 'dark' });
}

// ── Copy actions ──────────────────────────────────────────────────────────────

async function copyJson() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  const [, , html, json] = snow.build_charge_sheet_row_cis(task, user);
  copyRichTextToClipboard([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([JSON.stringify(json)], { type: 'text/plain' }),
    }),
  ]);
  showToast('JSON copied to clipboard', { theme: 'dark' });
}

async function copyCrosscharge() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  const tsv = [
    new Date().toISOString(),
    'SLC',
    '',
    '1',
    task.dv_number,
    user.dv_email,
    user.dv_cost_center,
  ].join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = {
    date: new Date().toISOString(),
    location: task.dv_location,
    number: task.dv_number,
    costCenter: user.dv_cost_center,
    email: user.dv_email,
  };
  copyRichTextToClipboard([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([JSON.stringify(json)], { type: 'text/plain' }),
    }),
  ]);
  showToast('CrossCharge row copied to clipboard', { theme: 'dark' });
}

async function copyChargesheet() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  const [cis] = snow.build_charge_sheet_row_cis(task, user);
  copyRichTextToClipboard(cis);
  showToast('Chargesheet row copied to clipboard', { theme: 'dark' });
}

async function copyDropship() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  copyRichTextToClipboard(snow.build_bh_sheet_row_cis(task, user));
  showToast('Dropship row copied to clipboard', { theme: 'dark' });
}

async function copyExit() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  const manager = await getSysUser(user.manager);
  if (!manager) {
    showToast('Failed to load manager', { theme: 'dark' });
    return;
  }
  const assets = await getSnowRecords<AlmHardware>(
    'alm_hardware',
    `assigned_to=${user.sys_id}^install_status=1`,
  );
  const asset = assets.filter((a) =>
    task.u_variables_parsed.v_assets_to_return.includes(a.asset_tag),
  );
  copyRichTextToClipboard(
    snow.build_exit_sheet_row_cis(task, user, manager, asset[0]),
  );
  showToast('Exit row copied to clipboard', { theme: 'dark' });
}

// ── Email actions ─────────────────────────────────────────────────────────────

async function sendYubikeyEmail() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  openEmail(user, `${task.dv_short_description} | ${task.dv_number}`);
}

async function sendFirstStrikeEmail() {
  const data = await fetchTicketData();
  if (!data) return;
  const { task, user } = data;
  openEmail(user, `${task.dv_short_description} | ${task.dv_number}`);
}

// ── Router ────────────────────────────────────────────────────────────────────

export function initRouting(): ComponentInstance {
  initializeUrlTracking();

  const config: ConsumerConfig = {
    keyPrefix: 'snow',
    defaults: {
      mode: 'dir',
      theme: 'dark',
    },
    tree: {
      json: {
        type: 'action',
        label: 'Copy JSON',
        action: copyJson,
      },
      accessory: {
        type: 'directory',
        label: 'Accessory',
        children: {
          dropship: {
            type: 'action',
            label: 'Dropship',
            action: copyDropship,
          },
          chargesheet: {
            type: 'action',
            label: 'Chargesheet',
            action: copyChargesheet,
          },
          crosscharge: {
            type: 'action',
            label: 'CrossCharge',
            action: copyCrosscharge,
          },
          json: {
            type: 'action',
            label: 'JSON',
            action: copyJson,
          },
          yubikeyEmail: {
            type: 'action',
            label: 'YubiKey Email',
            action: sendYubikeyEmail,
          },
        },
      },
      returns: {
        type: 'directory',
        label: 'Returns',
        children: {
          exit: {
            type: 'directory',
            label: 'Exit',
            children: {
              sheet: {
                type: 'action',
                label: 'Sheet',
                action: copyExit,
              },
              json: {
                type: 'action',
                label: 'JSON',
                action: copyJson,
              },
            },
          },
          returnItEquipment: {
            type: 'directory',
            label: 'Return IT Equipment',
            children: {
              json: {
                type: 'action',
                label: 'JSON',
                action: copyJson,
              },
              first: {
                type: 'action',
                label: 'First Strike Email',
                action: sendFirstStrikeEmail,
              },
            },
          },
        },
      },
      laptop: {
        type: 'directory',
        label: 'Laptop',
        children: {
          todo: {
            type: 'action',
            label: 'TODO',
            action: () => showToast('TODO', { theme: 'dark' }),
          },
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
              showToast(`New Tech NT set to: ${value}`, { theme: 'dark' }),
          },
        },
      },
    },
  };

  return init(config);
}
