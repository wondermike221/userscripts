/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSignal, onMount } from 'solid-js';
import styles from '../../style.module.css';
import { copyRichTextToClipboard, copyTextToClipboard } from '../../../utils';
import * as snow from '../../../utils/snow_utils';

export default function Routing(props) {
  onMount(() => {
    Object.assign(props.panelRef.wrapper.style, {
      display: 'block',
      position: 'relative',
      bottom: '50%',
      left: '50%',
    });
    props.panelRef.setMovable(true);
  });
  const [getRoute, setRoute] = createSignal(window.location);

  return (
    <div
      style={{
        width: '10vw',
        height: '10vh',
      }}
    >
      <span>
        {' '}
        Copy:
        <button on:click={() => handleCopy('json')}>(1) JSON</button>
        <button on:click={() => handleCopy('csv')}>(2) CSV</button>
        <button on:click={() => handleCopy('tsv')}>(3) TSV</button>
        <button on:click={() => handleCopy('dropship')}>(4) Dropship</button>
        <button on:click={() => handleCopy('exit')}>(5) Exit</button>
        <button on:click={() => handleCopy('hide', props.panelRef)}>
          (6) Hide
        </button>
      </span>
    </div>
  );
}

async function handleCopy(type, panel = null) {
  const task = await snow.snow_get_record('sc_task');
  const ritm = await snow.snow_get_record(
    'sc_req_item',
    task.records[0].parent,
  );
  const user = await snow.snow_get_record(
    'sys_user',
    ritm.records[0].requested_for,
  );
  switch (type) {
    case 'json':
      {
        const json = snow.build_minimal_json(task, user);
        copyTextToClipboard(JSON.stringify(json));
      }
      break;
    case 'csv':
      {
        // TODO
        // const csv = snow.build_minimal_csv(task, user);
        // copyTextToClipboard(csv);
        console.log('csv TODO');
      }
      break;
    case 'tsv':
      {
        const tsv = snow.build_charge_sheet_row(task, user);
        copyTextToClipboard(tsv);
      }
      break;
    case 'dropship':
      {
        const dropship = snow.build_bh_sheet_row(task, user);
        copyTextToClipboard(dropship);
      }
      break;
    case 'exit':
      {
        // TODO
        // const exit = snow.build_exit_json(task, user);
        // copyTextToClipboard(JSON.stringify(exit));
        console.log('exit TODO');
      }
      break;
    case 'hide':
      panel.hide();
      break;
  }
}
