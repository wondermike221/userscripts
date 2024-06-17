import { showToast } from '@violentmonkey/ui';
import {
  makeRequest,
  convertPlainTextToHTMLTable,
  copyTextToClipboard,
} from '../../utils';
import { startSearchAssetByNT } from '../helix/assets';

export default async function scrapeCollectPC() {
  const spinner = document.getElementById('loading-spinner-container');
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const title = document
    .querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]')
    .textContent.trim();
  const name = document
    .querySelector('#ticket-record-summary a[ux-id="assignee-name"]')
    .textContent.trim();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const email = document
    .querySelector('#ticket-record-summary a[ux-id="email-value"]')
    .textContent.trim();
  const work_order = document
    .querySelector(
      '#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]',
    )
    .textContent.trim();
  const description: HTMLElement = document.querySelector(
    '#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]',
  );
  const descText: string = description.textContent || description.innerText;
  const parsedDesc = descText.split(/\r?\n/).reduce((acc, item) => {
    if (item.indexOf(':') == -1) return acc;
    const [key, value] = item.split(':');
    acc[key.trim()] = value ? value.trim() : '';
    return acc;
  }, {});
  const PEOPLEX_PROFILE_URL = `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${parsedDesc['Login ID']}`;
  const description_nt = parsedDesc['Login ID'];
  const timeline_feed = document.querySelector(
    'div[ux-id="activity-feed"] div.timeline-feed',
  );
  const create_date_text = [...timeline_feed.children]
    .at(-2)
    .querySelector('span.feed-item__date-time').textContent;
  const create_date = new Date(create_date_text).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  spinner.classList.remove('hidden');
  let user_data, manager_data, asset_data;
  try {
    const userResponse = await makeRequest(PEOPLEX_PROFILE_URL);
    user_data = JSON.parse(userResponse);
    const managerResponse = await makeRequest(
      `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${user_data.payload.managerUserId}`,
    );
    manager_data = JSON.parse(managerResponse);
    const assetResponse = await startSearchAssetByNT(description_nt);
    asset_data = assetResponse;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body =
      'Data was not scraped successfully. Check that the peoplex is still logged in.';
    showToast(`${title}: ${body}`, { theme: 'dark' });
  }
  const assets = ((ad) => {
    return ad
      .map((a) => {
        if (ad.length > 1) {
          //excel does not support more than one link per cell.
          return a.sn;
        } else {
          return `<a href="https://ebay-smartit.onbmc.com/smartit/app/#/asset/${a.id}/BMC_COMPUTERSYSTEM">${a.sn}</a>`;
        }
      })
      .join(',');
  })(asset_data);
  const manager_email = manager_data.payload.email;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const template = ((userSrcSys) => {
    // not currently used.
    if (userSrcSys == 'FG') {
      return 'MM AWF';
    } else {
      return 'MM FTE';
    }
  })(user_data.payload.userSrcSys);
  const csvCollectPC = `${work_order}\t${name}\t${parsedDesc['Login ID']}\t${parsedDesc['Manager Name']}\t${manager_email}\t${assets}\t\tTODO\t${create_date}\t${user_data.payload.userSrcSys}\t${user_data.payload.costctrCd}`;
  const html_csvCollectPC = convertPlainTextToHTMLTable(csvCollectPC);
  copyTextToClipboard(html_csvCollectPC, 'text/html');
  spinner.classList.add('hidden');
}
