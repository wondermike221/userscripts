import { init } from 'rove';
import type { ComponentInstance, ConsumerConfig } from 'rove';
import { showToast } from '@violentmonkey/ui';
import { copyRichTextToClipboard } from '../../../utils';
import { createAndInvokeMailto } from '../../../utils/mailto_utils';
import * as snow from '../../../utils/snow_utils';
import {
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
  getIncident,
  type TicketData,
} from '../../api';
import type { AlmHardware } from '../../types';
import { initializeUrlTracking, getCurrentRecord } from '../snowURLParser';

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchTicketData(): Promise<TicketData | null> {
  const { sysId, table } = getCurrentRecord();
  if (!sysId || !table) {
    showToast('No SNOW record detected in URL', { theme: 'dark' });
    return null;
  }

  if (table === 'incident') {
    const incident = await getIncident(sysId);
    if (!incident) {
      showToast('Failed to load incident', { theme: 'dark' });
      return null;
    }
    const user = await getSysUser(incident.caller_id);
    if (!user) {
      showToast('Failed to load user', { theme: 'dark' });
      return null;
    }
    const manager = user.manager ? await getSysUser(user.manager) : null;
    return { type: 'incident', incident, user, manager };
  }

  const task = await getScTask(sysId);
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
  const manager = user.manager ? await getSysUser(user.manager) : null;
  const assets = await getSnowRecords<AlmHardware>(
    'alm_hardware',
    `assigned_to=${user.sys_id}^install_status=1`,
  );
  return { type: 'sc_task', task, ritm, user, manager, assets };
}

// ── Email helper ──────────────────────────────────────────────────────────────

function openEmail(email: string, subject: string, body = '') {
  createAndInvokeMailto(email, 'servicenow@ebay.com', subject, body);
  showToast('Email draft opened', { theme: 'dark' });
}

// ── Copy actions ──────────────────────────────────────────────────────────────

async function copyJson() {
  const data = await fetchTicketData();
  if (!data || data.type !== 'sc_task') return;
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

async function copyDropship() {
  const data = await fetchTicketData();
  if (!data || data.type !== 'sc_task') return;
  const { task, user } = data;
  copyRichTextToClipboard(snow.build_bh_sheet_row_cis(task, user));
  showToast('Dropship row copied to clipboard', { theme: 'dark' });
}

async function copyExit() {
  const data = await fetchTicketData();
  if (!data || data.type !== 'sc_task') return;
  const { task, user, manager, assets } = data;
  if (!manager) {
    showToast('Failed to load manager', { theme: 'dark' });
    return;
  }
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
  if (!data || data.type !== 'sc_task') return;
  const { task, user } = data;
  openEmail(
    user.dv_email ?? '',
    `${task.dv_short_description} | ${task.dv_number}`,
  );
}

async function sendFirstStrikeEmail() {
  const data = await fetchTicketData();
  if (!data) return;
  if (data.type === 'sc_task') {
    openEmail(
      data.user.dv_email ?? '',
      `${data.task.dv_short_description} | ${data.task.dv_number}`,
    );
  } else {
    openEmail(
      data.user.dv_email ?? '',
      `${data.incident.dv_short_description} | ${data.incident.dv_number}`,
    );
  }
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
