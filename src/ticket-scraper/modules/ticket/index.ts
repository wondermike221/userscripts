import { showToast } from '@violentmonkey/ui';
import { copyTextToClipboard, getCostCenterFromHub, wait } from '../../utils';

/**
 * Retrieves the cost center associated with the user's nametag by scraping the basic data, making a request to the hub, and notifying of success.
 *
 * @return {Promise<void>} Promise that resolves once the cost center has been retrieved and copied to the clipboard.
 */
export async function getCostCenter() {
  //scrape basic data
  const email = (
    document.querySelector(
      '#ticket-record-summary a[ux-id="email-value"]',
    ) as HTMLElement
  ).textContent.trim();
  const nametag = email.split('@')[0];

  //start loading spinner
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  //make request to hub for cost center
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`;
  const cost_center = await getCostCenterFromHub(HUB_PROFILE_URL);

  //stop loading spinner
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  //notify of success
  const notif_title = 'Success!';
  const body = 'Data was scraped successfully';
  showToast(`${notif_title}: ${body}`, { theme: 'dark' });

  //copy to clipboard
  copyTextToClipboard(cost_center);
}

/**
 * Clicks status element then set's status to $status, status reason to $reason and reported source to $source.
 * @param status The status to set
 * @param reason The reason to set
 */
export async function setTicketStatus(status = 'Completed', reason, source) {
  const statusBtn: HTMLElement = document.querySelector(
    '#ticket-record-summary div[ux-id="status-value"]',
  );
  statusBtn?.click();
  const statusDropdown: HTMLElement = document.querySelector(
    `#ticket-record-summary div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`,
  );
  statusDropdown?.click();
  await wait(100);
  setReason(reason);
  setSource(source);
}

function setReason(reason) {
  if (reason == '') return;
  const reasonDropdown: HTMLElement = document.querySelector(
    `#ticket-record-summary div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`,
  );
  reasonDropdown?.click();
}

function setSource(source) {
  if (source == '') return;
  const sourceDropdown: HTMLElement = document.querySelector(
    `#ticket-record-summary div[ux-id="field_reported_source"] label ul li a[aria-label="${source}"]`,
  );
  sourceDropdown?.click();
}
