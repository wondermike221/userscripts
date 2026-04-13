import { copyTextToClipboard } from '../utils';
import { get_record, get_records } from '../utils/snow_utils';
import { showNotification } from '../utils/mailto_utils';

const task = (await get_record('sc_task')).records[0];
const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
const user = (await get_record('sys_user', ritm.requested_for)).records[0];
const manager = (await get_record('sys_user', user.manager)).records[0];
const assets = await get_records(
  'alm_hardware',
  `assigned_to=${user.sys_id}^install_status=1`,
);
const task_u_vars = JSON.parse(task.dv_u_variables);
const result = JSON.stringify({ task, task_u_vars, user, manager, assets });
copyTextToClipboard(result);
showNotification('Copied JSON to Clipboard.');
