/* eslint-disable @typescript-eslint/no-unused-vars */
// libraries
// import { faCopy } from '@fortawesome/free-solid-svg-icons'; // https://fontawesome.com/icons/copy?style=solid
import { createSignal, onMount } from 'solid-js';
import { showToast } from '@violentmonkey/ui';
import { enable, disable } from '@violentmonkey/shortcut';
// utils
import {
  convertPlainTextToHTMLTable,
  copyRichTextToClipboard,
  copyTextToClipboard,
} from '../../../utils';
import * as snow from '../../../utils/snow_utils';
// modules
import { toggleMainPanel } from '../shortcuts';

export default function Routing(props) {
  onMount(() => {
    Object.assign(props.panelRef.wrapper.style, {
      bottom: '50%',
      left: '50%',
      width: '250px',
    });
    props.panelRef.setMovable(true);
  });
  // const [getRoute, setRoute] = createSignal(window.location);

  return (
    <div id="routing">
      <p
        style={{
          width: '240px',
          'background-color': 'gray',
          margin: 0,
          padding: '0 0 0 10px',
        }}
      >
        Copy:
      </p>
      <ol id="routing-list">
        <li>
          <button
            id="crosscharge"
            on:click={(e) => handleScrape('crosscharge', e)}
          >
            CrossCharge
          </button>
        </li>
        <li>
          <button id="dropship" on:click={(e) => handleScrape('dropship', e)}>
            Dropship
          </button>
        </li>
        <li>
          <button id="exit" on:click={(e) => handleScrape('exit', e)}>
            Exit
          </button>
        </li>
        <li>
          <button
            id="chargesheet"
            on:click={(e) => handleScrape('chargesheet', e)}
          >
            Charge Sheet
          </button>
        </li>
        <li>
          <button id="fdx-bulk" on:click={(e) => handleScrape('fdx-bulk', e)}>
            FDX Bulk
          </button>
        </li>
        <li>
          <button id="json" on:click={(e) => handleScrape('json', e)}>
            JSON
          </button>
        </li>
        <li>
          <button id="hide" on:click={(e) => handleScrape('hide', e)}>
            Hide
          </button>
        </li>
      </ol>
    </div>
  );
}

export async function handleScrape(type, event) {
  disable();
  const task = (await snow.get_record('sc_task')).records[0];
  const ritm = (await snow.get_record('sc_req_item', task.parent)).records[0];
  const user = (await snow.get_record('sys_user', ritm.requested_for))
    .records[0];
  switch (type) {
    case 'json':
      {
        const json = snow.build_minimal_json(task, user);
        copyTextToClipboard(JSON.stringify(json));
        showToast('JSON successfully copied to clipboard', { theme: 'dark' });
      }
      break;
    case 'crosscharge':
      {
        const crosscharge_tsv = [
          new Date().toISOString(),
          'SLC',
          '',
          '1',
          task.dv_number,
          user.dv_email,
          user.dv_cost_center,
        ].join('\t');
        const crosscharge_html = convertPlainTextToHTMLTable(crosscharge_tsv);
        const crosscharge_json = {
          date: new Date().toISOString(),
          location: task.dv_location,
          number: task.dv_number,
          costCenter: user.dv_cost_center,
          email: user.dv_email,
        };
        const crosscharge = [
          new ClipboardItem({
            'text/html': new Blob([crosscharge_html], { type: 'text/html' }),
            'text/plain': new Blob([JSON.stringify(crosscharge_json)], {
              type: 'text/plain',
            }),
          }),
        ];
        if (event.ctrlKey) {
          copyTextToClipboard(crosscharge_tsv);
        } else if (event.shiftKey) {
          copyTextToClipboard(JSON.stringify(crosscharge_json));
        } else {
          copyRichTextToClipboard(crosscharge);
        }
        showToast('CrossCharge row successfully copied to clipboard', {
          theme: 'dark',
        });
      }
      break;
    case 'chargesheet':
      {
        const [
          chargesheet_cis,
          chargesheet_tsv,
          chargesheet_html,
          chargesheet_json,
        ] = snow.build_charge_sheet_row_cis(task, user);
        if (event.ctrlKey) {
          copyTextToClipboard(chargesheet_tsv);
        } else if (event.shiftKey) {
          copyTextToClipboard(JSON.stringify(chargesheet_json));
        } else {
          copyRichTextToClipboard(chargesheet_cis);
        }
        showToast('Chargesheet row successfully copied to clipboard', {
          theme: 'dark',
        });
      }
      break;
    case 'dropship':
      {
        const dropship = snow.build_bh_sheet_row_cis(task, user);
        copyRichTextToClipboard(dropship);
        showToast('Dropship row successfully copied to clipboard', {
          theme: 'dark',
        });
      }
      break;
    case 'exit':
      {
        // TODO
        const manager = (await snow.get_record('sys_user', user.manager))
          .records[0];
        const assets = await snow.get_records(
          'alm_hardware',
          `assigned_to=${user.sys_id}^install_status=1`,
        );
        const task_u_vars = JSON.parse(task.dv_u_variables);
        const asset = assets.records.filter((a) =>
          task_u_vars.v_assets_to_return.includes(a.asset_tag),
        );
        console.log(assets);
        const exit = snow.build_exit_sheet_row_cis(
          task,
          user,
          manager,
          asset[0],
        );
        copyRichTextToClipboard(exit);
        console.log('exit TODO');
        showToast('Exit row successfully copied to clipboard', {
          theme: 'dark',
        });
      }
      break;
    case 'fdx-bulk':
      {
        // const fdx = snow.build_fdx_row_cis(task, user);
        // copyRichTextToClipboard(fdx);
        showToast('TODO:Fdx row successfully copied to clipboard', {
          theme: 'dark',
        });
      }
      break;
    case 'hide':
      toggleMainPanel();
      break;
  }
  enable();
}
