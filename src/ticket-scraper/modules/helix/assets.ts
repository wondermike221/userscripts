import { makeRequest } from '../../utils';
import { showToast } from '@violentmonkey/ui';

export async function scrapeAssetsUsingNameTags() {
  if (document.hasFocus()) {
    console.log('has focus');
    assetCollectionFromNameTags();
  } else {
    console.log('does not have focus');
    window.addEventListener('focus', assetCollectionFromNameTags, {
      once: true,
    });
  }
}

async function assetCollectionFromNameTags() {
  console.log('beginning asset scrape');
  try {
    const clipboardContents = await navigator.clipboard.read();
    const blob = await clipboardContents[0].getType('text/plain');
    const text = await blob.text();
    let parsed: { [nt: string]: string[] },
      NTS: string[] = null;
    if (text.includes('\t')) {
      parsed = text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.split('\t'))
        .map((line) => {
          if (line[3].includes(',')) {
            return [line[0], line[3].split(',').map((s) => s.trim())];
          } else {
            return [line[0], [line[3].trim()]];
          }
        })
        .reduce((prev, curr) => {
          return {
            ...prev,
            [curr[0] as string]: curr[1],
          };
        }, {});
      NTS = Object.keys(parsed);
    } else {
      NTS = text.trim().split(/\r?\n/);
    }

    let results = await getAssetsInfo(NTS);
    results = results
      .map((r) => r.value)
      .flat()
      .filter(
        (v) =>
          v.status != 'Disposed' && v.owned == 'ownedby' && v.sn != undefined,
      )
      .map((i) => {
        if (i.status == 'None Assigned') {
          i.sn = parsed[i.nt][0];
        }
        return i;
      });

    if (text.includes('\t')) {
      results = results.filter((r) => parsed[r.nt].includes(r.sn));

      const copy = results
        .reduce((prev, curr) => {
          if (prev.length != 0 && curr.nt == prev[prev.length - 1].nt) {
            prev[prev.length - 1] = {
              ...prev[prev.length - 1],
              status: `${prev[prev.length - 1].status}, ${curr.status}`,
            };
            // prev[prev.length - 1].status += ` ${curr.status}`
            return prev;
          } else {
            prev.push(curr);
            return prev;
          }
        }, [])
        .map((r) => r.status)
        .join('\n');
      const cBlob = new Blob([copy], { type: 'text/plain' });
      const data = [new ClipboardItem({ ['text/plain']: cBlob })];
      await navigator.clipboard.write(data);
      console.log(copy);
      showToast(
        'Success! Asset information has been collected and written to the clipboard.',
        { theme: 'dark' },
      );
    }
    console.log(results);
  } catch (e) {
    console.log(e);
  }
}

const ROUTE_APP_PREFIX = 'https://ebay-smartit.onbmc.com/smartit/app/#';
const ROUTE_REST_PREFIX = 'https://ebay-smartit.onbmc.com/smartit/rest';
const ROUTES = {
  searchAsset: (Q: string) =>
    `${ROUTE_REST_PREFIX}/globalsearch?chunk_index=0&chunk_size=50&search_text=${Q}&suggest_search=true`,
  search: (SEARCH_QUERY: string) =>
    `${ROUTE_APP_PREFIX}/search/${SEARCH_QUERY}`, // query must be url encoded
  workOrder: (ID: string) => `${ROUTE_APP_PREFIX}/workorder/${ID}`, // WOGDHWUVDUMKRAS1NHM1S1NHM1PA41 => 30
  incident: (ID: string) => `${ROUTE_APP_PREFIX}/incident/${ID}`, // IDGG1QUMAPMURAS12DSCS12DSC0Z7Q => 30
  task: (ID: string) => `${ROUTE_APP_PREFIX}/task/${ID}`, // TMGDHWUVDUMKRAS1NHM2S1NHM2PA6F => 30
  ticketConsole: () => `${ROUTE_APP_PREFIX}/ticket-console`,
  allAssets: (NT: string) => `${ROUTE_REST_PREFIX}/asset/${NT}?allAssets=true`,
  asset: (ID: string) =>
    `${ROUTE_REST_PREFIX}/asset/details/${ID}/BMC_COMPUTERSYSTEM`, //OI-621BD3CE368211EEB92ABAD6D1CD7F55 =>
};

async function getAssetsInfo(NTS: string[]) {
  try {
    const CONCURRENT_REQUEST_LIMIT = 5;
    const iterator = NTS.entries();
    const results = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const workers = Array(CONCURRENT_REQUEST_LIMIT)
      .fill(iterator)
      .map((iter) => {
        for (const [i, NT] of iter) {
          results[i] = getAssetInfo(NT);
        }
      });
    const r = await Promise.allSettled(results);
    return r;
  } catch (e) {
    console.log(e);
  }
}

async function getAssetInfo(NT: string) {
  const r = await makeRequest(ROUTES.allAssets(NT));
  const j = await JSON.parse(r);
  const results = filterReleventAssetInfo(j, NT);
  return results;
}

function filterReleventAssetInfo(
  r_json: IAllAssetsResponse[],
  nt: string,
): (IAssetInfoReduced | IEmptyAssetInfo)[] {
  const results = [];
  let count = 0;
  r_json.forEach((j) => {
    j.items.forEach((item) => {
      count += item.totalMatches;
      item.objects.forEach((object) => {
        const r = {
          status: object.status.value,
          nt: object.owner.loginId,
          sn: object.serialNumber,
          fullName: object.owner.fullName,
          id: object.reconciliationId,
          name: object.name,
          owned: object.role,
          model: object.product.name,
        };
        results.push(r);
      });
    });
  });
  if (count == 0) {
    return [
      {
        status: 'None Assigned',
        nt,
        sn: 'N/A',
        owned: 'ownedby',
      },
    ];
  }
  return results;
}

export async function startSearchAssetByNT(NT) {
  let results = await getAssetInfo(NT);
  results = results
    // .map(r => r.value)
    // .flat()
    .filter(
      (v) =>
        v.status != 'Disposed' && v.owned == 'ownedby' && v.sn != undefined,
    );
  console.log(results);
  return results;
}

interface IEmptyAssetInfo {
  status: 'None Assigned';
  nt: string;
  sn: 'N/A';
  owned: 'ownedby';
}

interface IAllAssetsResponse {
  dataSourceName: string;
  items: IAssetInfoItem[];
  syncTime: number;
}

interface IAssetInfoItem {
  objects: IAssetInfoObject[];
  totalMatches: number;
  exceededChunkSize: boolean;
}

interface IAssetInfoObject {
  assetExtension: { serialNumber: string };
  assetType: string;
  classId: string;
  company: { name: string };
  customFields: object;
  desc: string;
  manufacturer: string;
  name: string;
  needsReconciliation: boolean;
  owner: {
    firstName: string;
    lastName: string;
    fullName: string;
    company: { name: string };
    loginId: string;
    customFields: object;
  };
  product: { name: string };
  categorization: [];
  reconciliationId: string;
  role: string;
  serialNumber: string;
  site: { name: string; siteGroup: { name: string } };
  status: { value: string };
  type: string;
  verified: boolean;
}

interface IAssetInfoReduced {
  status: string;
  nt: string;
  sn: string;
  fullName: string;
  id: string;
  name: string;
  owned: string;
  model: string;
}
