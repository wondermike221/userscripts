import { showToast } from '@violentmonkey/ui';
import { makeRequest, copyTextToClipboard } from '../utils';

export async function getSources() {
  const NTS_raw = prompt('Input NTS', '');
  if (NTS_raw == '') {
    console.error('please input well formed NTS');
  }
  const NTS = NTS_raw.split(/\r?\n/);
  const sources = [];
  for (const NT of NTS) {
    const PEOPLEX_PROFILE_URL = (NT) =>
      `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
    let user_data;
    try {
      const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(NT));
      user_data = JSON.parse(userResponse);
    } catch (e) {
      console.error(e);
      const title = 'Failure!';
      const body =
        'Data was not scraped successfully. Check that the peoplex is still logged in.';
      showToast(`${title}: ${body}`, { theme: 'dark' });
    }
    sources.push(user_data.payload.userSrcSys);
  }
  copyTextToClipboard(sources.join('\n'));
  showToast('Sources successfully copied to clipboard', { theme: 'dark' });
}
