import { init } from 'rove';
import type { ComponentInstance, ConsumerConfig } from 'rove';
import { enable, disable } from '@violentmonkey/shortcut';
import { showToast } from '@violentmonkey/ui';
import {
  convertPlainTextToHTMLTable,
  copyRichTextToClipboard,
  copyTextToClipboard,
} from '../../../utils';
import * as snow from '../../../utils/snow_utils';
import { getScTask, getScReqItem, getSysUser, getSnowRecords } from '../../api';
import type { AlmHardware } from '../../types';
import { initializeUrlTracking, getCurrentRecord } from '../snowURLParser';

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
          dropship: {
            type: 'action',
            label: 'Dropship',
            action: () => handleScrape('dropship'),
          },
          chargesheet: {
            type: 'action',
            label: 'Chargesheet',
            action: () => handleScrape('chargesheet'),
          },
          crosscharge: {
            type: 'action',
            label: 'CrossCharge',
            action: () => handleScrape('crosscharge'),
          },
          json: {
            type: 'action',
            label: 'JSON',
            action: () => handleScrape('json'),
          },
        },
      },
      exit: {
        type: 'directory',
        label: 'Exit',
        children: {
          sheet: {
            type: 'action',
            label: 'Sheet',
            action: () => handleScrape('exit'),
          },
          json: {
            type: 'action',
            label: 'JSON',
            action: () => handleScrape('json'),
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
      settings: {
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

type ScrapeType =
  | 'json'
  | 'crosscharge'
  | 'chargesheet'
  | 'dropship'
  | 'exit'
  | 'fdx-bulk';

export async function handleScrape(type: ScrapeType) {
  disable();

  const { sysId: taskSysId } = getCurrentRecord();
  if (!taskSysId) {
    showToast('No SNOW record detected in URL', { theme: 'dark' });
    enable();
    return;
  }

  const task = await getScTask(taskSysId);
  if (!task) {
    showToast('Failed to load task', { theme: 'dark' });
    enable();
    return;
  }

  const ritm = await getScReqItem(task.request_item);
  if (!ritm) {
    showToast('Failed to load RITM', { theme: 'dark' });
    enable();
    return;
  }

  const user = await getSysUser(ritm.requested_for);
  if (!user) {
    showToast('Failed to load user', { theme: 'dark' });
    enable();
    return;
  }

  switch (type) {
    case 'json': {
      const json = snow.build_minimal_json(task, user);
      copyTextToClipboard(JSON.stringify(json));
      showToast('JSON successfully copied to clipboard', { theme: 'dark' });
      break;
    }
    case 'crosscharge': {
      const crosscharge_tsv = [
        new Date().toISOString(),
        'SLC',
        '',
        '1',
        task.dv_number,
        user.dv_email,
        user.dv_cost_center,
      ].join('\t');
      const crosscharge_html = convertPlainTextToHTMLTable(crosscharge_tsv);
      const crosscharge_json = {
        date: new Date().toISOString(),
        location: task.dv_location,
        number: task.dv_number,
        costCenter: user.dv_cost_center,
        email: user.dv_email,
      };
      copyRichTextToClipboard([
        new ClipboardItem({
          'text/html': new Blob([crosscharge_html], { type: 'text/html' }),
          'text/plain': new Blob([JSON.stringify(crosscharge_json)], {
            type: 'text/plain',
          }),
        }),
      ]);
      showToast('CrossCharge row successfully copied to clipboard', {
        theme: 'dark',
      });
      break;
    }
    case 'chargesheet': {
      const [chargesheet_cis] = snow.build_charge_sheet_row_cis(task, user);
      copyRichTextToClipboard(chargesheet_cis);
      showToast('Chargesheet row successfully copied to clipboard', {
        theme: 'dark',
      });
      break;
    }
    case 'dropship': {
      const dropship = snow.build_bh_sheet_row_cis(task, user);
      copyRichTextToClipboard(dropship);
      showToast('Dropship row successfully copied to clipboard', {
        theme: 'dark',
      });
      break;
    }
    case 'exit': {
      const manager = await getSysUser(user.manager);
      if (!manager) {
        showToast('Failed to load manager', { theme: 'dark' });
        enable();
        return;
      }
      const assets = await getSnowRecords<AlmHardware>(
        'alm_hardware',
        `assigned_to=${user.sys_id}^install_status=1`,
      );
      const asset = assets.filter((a) =>
        task.u_variables_parsed.v_assets_to_return.includes(a.asset_tag),
      );
      const exit = snow.build_exit_sheet_row_cis(task, user, manager, asset[0]);
      copyRichTextToClipboard(exit);
      showToast('Exit row successfully copied to clipboard', { theme: 'dark' });
      break;
    }
    case 'fdx-bulk': {
      showToast('TODO: FDX bulk not yet implemented', { theme: 'dark' });
      break;
    }
  }

  enable();
}
