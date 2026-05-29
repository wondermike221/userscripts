import { showToast } from '@violentmonkey/ui';
import { createAndInvokeMailto } from '../../../utils/mailto_utils';
import {
  getScTask,
  getScReqItem,
  getSysUser,
  getSnowRecords,
  getIncident,
  type TicketData,
} from '../../api';
import type { AlmHardware } from '../../types';
import { getCurrentRecord } from '../snowURLParser';

export async function fetchTicketData(): Promise<TicketData | null> {
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

export function openEmail(email: string, subject: string, body = '') {
  createAndInvokeMailto(email, 'servicenow@ebay.com', subject, body);
  showToast('Email draft opened', { theme: 'dark' });
}
