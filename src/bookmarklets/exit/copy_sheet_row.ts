import { copyRichTextToClipboard } from '../../utils';
import {
  get_record,
  get_records,
  build_exit_sheet_row_cis,
} from '../../utils/snow_utils';

const task = (await get_record('sc_task')).records[0];
const ritm = (await get_record('sc_req_item', task.request_item)).records[0];
const user = (await get_record('sys_user', ritm.requested_for)).records[0];
const manager = (await get_record('sys_user', user.manager)).records[0];
const assets = await get_records(
  'alm_hardware',
  `assigned_to=${user.sys_id}^install_status=1`,
);
const task_u_vars = JSON.parse(task.dv_u_variables);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asset = assets.records.filter((a: any) =>
  task_u_vars.v_assets_to_return.includes(a.asset_tag),
);
console.log(assets);
const exit = build_exit_sheet_row_cis(task, user, manager, asset[0]);
copyRichTextToClipboard(exit);
alert('Exit row copied.');
