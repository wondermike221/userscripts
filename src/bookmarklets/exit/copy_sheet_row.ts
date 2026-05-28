import { copyRichTextToClipboard } from '../../utils';
import {
  getSysIdFromUrl,
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
} from '../../snow/api';
import type { AlmHardware } from '../../snow/types';
import { build_exit_sheet_row_cis } from '../../utils/snow_utils';

const taskSysId = getSysIdFromUrl('sc_task');
const task = await getScTask(taskSysId);
const ritm = task ? await getScReqItem(task.request_item) : null;
const user = ritm ? await getSysUser(ritm.requested_for) : null;
const manager = user?.manager ? await getSysUser(user.manager) : null;
const assets = user
  ? await getSnowRecords<AlmHardware>(
      'alm_hardware',
      `assigned_to=${user.sys_id}^install_status=1`,
    )
  : [];

if (!task || !user || !manager) {
  alert('Failed to load required ticket data.');
} else {
  const task_u_vars = JSON.parse(task.dv_u_variables ?? '{}');
  const asset = assets.filter((a) =>
    task_u_vars.v_assets_to_return.includes(a.asset_tag),
  );
  const exit = build_exit_sheet_row_cis(task, user, manager, asset[0]);
  copyRichTextToClipboard(exit);
  alert('Exit row copied.');
}
