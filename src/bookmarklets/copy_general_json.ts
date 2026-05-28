import { copyTextToClipboard } from '../utils';
import {
  getSysIdFromUrl,
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
} from '../snow/api';
import type { AlmHardware } from '../snow/types';
import { showNotification } from '../utils/mailto_utils';

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
const task_u_vars = task ? JSON.parse(task.dv_u_variables ?? '{}') : {};
const result = JSON.stringify({ task, task_u_vars, user, manager, assets });
copyTextToClipboard(result);
showNotification('Copied JSON to Clipboard.');
