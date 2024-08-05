import { showToast } from '@violentmonkey/ui';
import {
  makeRequest,
  convertPlainTextToHTMLTable,
  copyTextToClipboard,
} from '../../utils';

export default async function scrapeCollectPC() {
  //   const spinner = document.getElementById('loading-spinner-container');
  //   if (!spinner.classList.contains('hidden')) {
  //     spinner.classList.add('hidden');
  //   }

  const fields = {
    QID: '',
    Name: '',
    NT: '',
    ManagerName: '',
    ManagerEmail: '',
    DeployedAssets: [],
    AssetStatus: [],
    Status: 'TODO',
    Date: '',
    Source: '',
    CostCenter: '',
    PersonalEmail: '',
  };

  //press i to populate user info popover
  const info_btn: HTMLElement = unsafeWindow.frames[0].document.querySelector(
    '#viewr\\.sc_task\\.request_item\\.request\\.requested_for',
  );
  await info_btn.click(); //TODO make wait for one second to load.
  //get NT, QID, Date, TODO:costcenter
  const elem_nt: HTMLInputElement =
    unsafeWindow.frames[0].document.querySelector(
      '#sys_user\\.u_configuration_item_label',
    );
  fields.NT = elem_nt.value;
  const elem_qid: HTMLInputElement =
    unsafeWindow.frames[0].document.querySelector(
      '#sys_readonly\\.sys_user\\.x_ebay_core_config_sam_qid',
    );
  fields.QID = elem_qid.value;
  const elem_date: HTMLInputElement =
    unsafeWindow.frames[0].document.querySelector(
      '#sys_readonly\\.sys_user\\.u_termination_date',
    );
  fields.Date = elem_date.value;

  const PEOPLEX_PROFILE_URL = (NT) =>
    `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
  let user_data, manager_data; //, asset_data;
  try {
    const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(fields.NT));
    user_data = JSON.parse(userResponse);
    const managerResponse = await makeRequest(
      PEOPLEX_PROFILE_URL(user_data.payload.managerUserId),
    );
    manager_data = JSON.parse(managerResponse);
    // const assetResponse = await startSearchAssetByNT(description_nt);
    // asset_data = assetResponse;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body =
      'Data was not scraped successfully. Check that the peoplex is still logged in.';
    showToast(`${title}: ${body}`, { theme: 'dark' });
  }

  if (fields.QID != user_data.payload.qID) {
    showToast("QID's don't match!");
  }
  if (fields.CostCenter != user_data.payload.costctrCd) {
    showToast("Cost Center's don't match!");
  }
  fields.Name = `${user_data.payload.prefFirstName} ${user_data.payload.prefLastName}`;
  fields.ManagerEmail = manager_data.payload.email;
  fields.ManagerName = manager_data.payload.mgrName;
  fields.Source = user_data.payload.userSrcSys;

  const csvCollectPC = `${fields.QID}\t${fields.Name}\t${fields.NT}\t${fields.ManagerName}\t${fields.ManagerEmail}\t${fields.DeployedAssets}\t${fields.AssetStatus}\t${fields.Status}\t${fields.Date}\t${fields.Source}\t${fields.CostCenter}\t${fields.PersonalEmail}`;
  const html_csvCollectPC = convertPlainTextToHTMLTable(csvCollectPC);
  copyTextToClipboard(html_csvCollectPC, 'text/html');
  //   spinner.classList.add('hidden');
}

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
}

export async function getManagers() {
  const NTS_raw = prompt('Input NTS', '');
  if (NTS_raw == '') {
    console.error('please input well formed NTS');
  }
  const NTS = NTS_raw.split(/\r?\n/);
  const managers = [];
  for (const NT of NTS) {
    const PEOPLEX_PROFILE_URL = (NT) =>
      `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${NT}`;
    let user_data, manager_data;
    try {
      const userResponse = await makeRequest(PEOPLEX_PROFILE_URL(NT));
      user_data = JSON.parse(userResponse);
      const managerResponse = await makeRequest(
        PEOPLEX_PROFILE_URL(user_data.payload.managerUserId),
      );
      manager_data = JSON.parse(managerResponse);
    } catch (e) {
      console.error(e);
      const title = 'Failure!';
      const body =
        'Data was not scraped successfully. Check that the peoplex is still logged in.';
      showToast(`${title}: ${body}`, { theme: 'dark' });
    }
    managers.push(
      `${manager_data.payload.mgrName}\t${manager_data.payload.email}`,
    );
  }
  copyTextToClipboard(managers.join('\n'));
}
