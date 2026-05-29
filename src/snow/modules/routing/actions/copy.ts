import { showToast } from '@violentmonkey/ui';
import { copyRichTextToClipboard } from '../../../../utils';
import * as snow from '../../../../utils/snow_utils';
import type { ScTaskTicketData } from '../../../api';

export function copyJson(data: ScTaskTicketData): void {
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

export function copyDropship(data: ScTaskTicketData): void {
  copyRichTextToClipboard(snow.build_bh_sheet_row_cis(data.task, data.user));
  showToast('Dropship row copied to clipboard', { theme: 'dark' });
}

export function copyExit(data: ScTaskTicketData): void {
  const { task, user, manager, assets } = data;
  if (!manager) {
    showToast('No manager found for user', { theme: 'dark' });
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
