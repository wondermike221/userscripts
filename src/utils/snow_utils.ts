import { convertPlainTextToHTMLTable } from '.';

// Get technician NT from local storage
let technicianNT = localStorage.getItem('techNT');
if (technicianNT === null) {
  technicianNT = '';
}

export function build_charge_sheet_row_cis(
  task,
  user,
): [ClipboardItem[], string, string, Record<string, unknown>] {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [
    new Date().toLocaleDateString(),
    'SLC',
    '',
    '1',
    task.dv_number,
    user.dv_email,
    user.dv_cost_center,
    user.dv_name,
    u_variables.street_address,
    '',
    u_variables.city,
    u_variables.v_state,
    u_variables.zip,
    u_variables.contact_number,
    'USA',
  ];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_minimal_json(task, user);
  const cis = [
    new ClipboardItem({
      'text/html': new Blob([html], {
        type: 'text/html',
      }),
      'text/plain': new Blob([JSON.stringify(json)], {
        type: 'text/plain',
      }),
    }),
  ];
  return [cis, tsv, html, json];
}

export function build_bh_sheet_row_cis(task, user) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [
    new Date().toLocaleDateString(),
    user.dv_name.split(' ')[0],
    user.dv_name.split(' ')[1],
    u_variables.street_address,
    '',
    u_variables.city,
    u_variables.v_state,
    u_variables.zip,
    '',
    '1',
    'WFH',
    task.dv_number,
    technicianNT,
    'Normal',
  ];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_minimal_json(task, user);
  return [
    new ClipboardItem({
      'text/html': new Blob([html], {
        type: 'text/html',
      }),
      'text/plain': new Blob([JSON.stringify(json)], {
        type: 'text/plain',
      }),
    }),
  ];
}

export function build_minimal_json(task, user) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const json = {
    streetAddress: u_variables.street_address,
    address2: '',
    city: u_variables.city,
    state: u_variables.v_state,
    postalCode: u_variables.zip,
    name: user.dv_name,
    phone: u_variables.contact_number,
    email: user.dv_email,
    number: task.dv_number,
    costCenter: user.dv_cost_center,
    date: new Date().toLocaleDateString(),
    location: task.dv_location,
  };
  return json;
}

export function build_exit_sheet_row_cis(task, user, manager, asset) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const row = [
    task.dv_number,
    task.dv_location,
    user.dv_name,
    user.dv_user_name,
    user.dv_u_worker_source,
    user.dv_u_vendor,
    manager.dv_name,
    manager.dv_email,
    u_variables.v_assets_to_return,
    asset.dv_serial_number,
    asset.dv_install_status,
    asset.dv_substatus,
    asset.dv_model,
    user.dv_u_termination_date,
    user.dv_cost_center,
    user.dv_x_ebay_core_config_sam_qid,
    user.dv_title,
  ];
  const tsv = row.join('\t');
  const html = convertPlainTextToHTMLTable(tsv);
  const json = build_exit_json(task, user, manager, asset);
  return [
    new ClipboardItem({
      'text/html': new Blob([html], {
        type: 'text/html',
      }),
      'text/plain': new Blob([JSON.stringify(json)], {
        type: 'text/plain',
      }),
    }),
  ];
}

export function build_exit_json(task, user, manager, assets) {
  const u_variables = JSON.parse(task.dv_u_variables);
  const json = {
    taskNumber: task.dv_number,
    location: task.dv_location,
    name: user.dv_name,
    userName: user.dv_user_name,
    workerSource: user.dv_u_worker_source,
    vendor: user.dv_u_vendor,
    managerName: manager.dv_name,
    managerEmail: manager.dv_email,
    assetsToReturn: assets.map((asset) => {
      return {
        serialNumber: asset.dv_serial_number,
        assetTag: asset.dv_asset_tag,
        installStatus: asset.dv_install_status,
        substatus: asset.dv_substatus,
        model: asset.dv_model,
      };
    }),
    terminationDate: user.dv_u_termination_date,
    costCenter: user.dv_cost_center,
    qid: user.dv_x_ebay_core_config_sam_qid,
    title: user.dv_title,
    u_variables: u_variables,
  };
  return json;
}
