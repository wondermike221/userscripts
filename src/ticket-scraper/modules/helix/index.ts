import { wait } from '../../utils';

/**
 * Sets the status to $status and status reason to $reason in Helix.
 * @param status The status to set
 * @param reason The reason to set
 */
export async function setAssetStatus(status, reason) {
  const statusBtn: HTMLElement = document.querySelector(
    'div[ux-id="status-value"]',
  );
  statusBtn?.click();
  const statusDropdown: HTMLElement = document.querySelector(
    `div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`,
  );
  statusDropdown?.click();
  await wait(100);
  setAssetReason(reason);
}

function setAssetReason(reason) {
  if (reason == '') return;
  const reasonDropdown: HTMLElement = document.querySelector(
    `div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`,
  );
  reasonDropdown?.click();
}
