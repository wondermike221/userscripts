/* eslint-disable @typescript-eslint/no-unused-vars */
// libraries
// import { faCopy } from '@fortawesome/free-solid-svg-icons'; // https://fontawesome.com/icons/copy?style=solid
import { createSignal, onMount, Show, For, createMemo } from 'solid-js';
import { IPanelResult, showToast } from '@violentmonkey/ui';
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

import { DirectoryNav } from '../../components/DirectoryNav';
import { DirectoryTree, Node, NodeType } from '../DirectoryTree';
import {
  initializeUrlTracking,
  getCurrentRecord,
  ServiceNowRecordInfo,
} from '../snowURLParser'; // Import ServiceNow URL parser
import { m } from '@violentmonkey/dom';
// import '../../styles.css';

interface RoutingProps {
  panelRef: IPanelResult;
}

export default function Routing({ panelRef }: RoutingProps) {
  const [treeInstance] = createSignal(new DirectoryTree('Main Options'));
  const [actionLog, setActionLog] = createSignal<string[]>([]);
  const [statusMessage, setStatusMessage] = createSignal<string>(
    'Click component to focus. Use 1-9 or Backspace.',
  );
  const [treeReady, setTreeReady] = createSignal(false);
  const [isPanelVisible, setIsPanelVisible] = createSignal(true);

  // Get the reactive signal for the current ServiceNow record
  const currentSNRecord = getCurrentRecord;

  // Create a memoized display string for the DirectoryNav header
  const recordDisplayString = createMemo(() => {
    const record = currentSNRecord();
    if (record && record.table && record.sysId) {
      return `Table: ${record.table}, ID: ${record.sysId.substring(0, 8)}...`; // Shorten sysId for display
    }
    return null; // Don't display if no record info
  });

  // Simulated toggleMainPanel function (replace with your actual import)
  const togglePanel = () => {
    setIsPanelVisible((prev) => !prev);
    const message = `Panel visibility toggled to: ${!isPanelVisible() ? 'Visible' : 'Hidden'}`;
    console.log(message); // For demonstration
    setStatusMessage(message);
    // Call your actual toggle function here if it's imported
    toggleMainPanel();
  };

  const logUserAction = (message: string, node?: Node) => {
    const logEntry = node ? `${message} (Node: ${node.name})` : message;
    console.log(logEntry);
    setActionLog((prev) => [logEntry, ...prev].slice(0, 7));
    setStatusMessage(message);
  };

  onMount(() => {
    Object.assign(panelRef.wrapper.style, {
      bottom: '50%',
      left: '50%',
      minWidth: '25vw',
    });
    Object.assign(panelRef.body.style, {
      fontFamily: 'sans-serif',
      backgroundColor: '#1e1e1e',
      color: '#f0f0f0',
      maxWidth: '400px',
      borderRadius: '8px',
    });
    // Initialize ServiceNow URL tracking when the app mounts
    initializeUrlTracking();
    const tree = treeInstance();

    const Accessory = tree.addNode(
      tree.root.id,
      'Accessory',
      NodeType.DIRECTORY,
    );
    const Exit = tree.addNode(tree.root.id, 'Exit', NodeType.DIRECTORY);
    const Laptop = tree.addNode(tree.root.id, 'Laptop', NodeType.DIRECTORY);
    const Settings = tree.addNode(tree.root.id, 'Settings', NodeType.DIRECTORY);

    if (Accessory) {
      tree.addNode(Accessory.id, 'Dropship', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('dropship');
      });
      tree.addNode(Accessory.id, 'Chargesheet', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('chargesheet');
      });
      // tree.addNode(Accessory.id, 'FDX Bulk', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      tree.addNode(Accessory.id, 'CrossCharge', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('crosscharge');
      });
      tree.addNode(Accessory.id, 'JSON', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('json');
      });
    }

    if (Exit) {
      // tree.addNode(Exit.id, 'Exit', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      // tree.addNode(Exit.id, 'Exit - Asset', NodeType.LEAF, () => {
      //   logUserAction('Copying...');
      //   showToast('TODO', { theme: 'dark' });
      // });
      tree.addNode(Exit.id, 'Sheet', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('exit');
      });
      // tree.addNode(Exit.id, 'Sheet - Receiving', NodeType.LEAF, () => logUserAction('Copying...'));
      tree.addNode(Exit.id, 'JSON', NodeType.LEAF, () => {
        logUserAction('Copying...');
        handleScrape('json');
      });
    }

    if (Laptop) {
      tree.addNode(Laptop.id, 'TODO', NodeType.LEAF, () => {
        logUserAction('Copying...');
        showToast('TODO', { theme: 'dark' });
      });
      // tree.addNode(Laptop.id, 'Dropship', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'Chargesheet', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'FDX Bulk', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'CrossCharge', NodeType.LEAF, () => logUserAction('Copying...'));
      // tree.addNode(Laptop.id, 'JSON', NodeType.LEAF, () => logUserAction('Copying...'));
    }

    if (Settings) {
      tree.addNode(Settings.id, 'Technician NT', NodeType.LEAF, () => {
        logUserAction('Change Tech NT...');
        const newTech = prompt('Enter new Tech NT:');
        // store the new tech in local storage
        if (newTech) {
          localStorage.setItem('techNT', newTech);
          showToast(`New Tech NT set to: ${newTech}`, { theme: 'dark' });
        }
      });
    }

    setTreeReady(true);
  });

  return (
    <>
      <Show
        when={treeReady()}
        fallback={
          <p style={{ 'text-align': 'center', padding: '20px', color: '#888' }}>
            Loading directory structure...
          </p>
        }
      >
        <DirectoryNav
          tree={treeInstance()}
          onLeafAction={logUserAction}
          onClose={togglePanel}
          currentRecordDisplay={recordDisplayString()}
        />
      </Show>
    </>
  );
}

export async function handleScrape(type) {
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
        copyRichTextToClipboard(crosscharge);
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
        copyRichTextToClipboard(chargesheet_cis);
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
  }
  enable();
}

// export default function Routing(props) {
//   onMount(() => {
//     Object.assign(props.panelRef.wrapper.style, {
//       bottom: '50%',
//       left: '50%',
//       width: '250px',
//     });
//     props.panelRef.setMovable(true);
//   });
//   // const [getRoute, setRoute] = createSignal(window.location);

//   return (
//     <div id="routing">
//       <p
//         style={{
//           width: '240px',
//           'background-color': 'gray',
//           margin: 0,
//           padding: '0 0 0 10px',
//         }}
//       >
//         Copy:
//       </p>
//       <ol id="routing-list">
//         <li>
//           <button
//             id="crosscharge"
//             on:click={(e) => handleScrape('crosscharge', e)}
//           >
//             CrossCharge
//           </button>
//         </li>
//         <li>
//           <button id="dropship" on:click={(e) => handleScrape('dropship', e)}>
//             Dropship
//           </button>
//         </li>
//         <li>
//           <button id="exit" on:click={(e) => handleScrape('exit', e)}>
//             Exit
//           </button>
//         </li>
//         <li>
//           <button
//             id="chargesheet"
//             on:click={(e) => handleScrape('chargesheet', e)}
//           >
//             Charge Sheet
//           </button>
//         </li>
//         <li>
//           <button id="fdx-bulk" on:click={(e) => handleScrape('fdx-bulk', e)}>
//             FDX Bulk
//           </button>
//         </li>
//         <li>
//           <button id="json" on:click={(e) => handleScrape('json', e)}>
//             JSON
//           </button>
//         </li>
//         <li>
//           <button id="hide" on:click={(e) => handleScrape('hide', e)}>
//             Hide
//           </button>
//         </li>
//       </ol>
//     </div>
//   );
// }
