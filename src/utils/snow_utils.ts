import { convertPlainTextToHTMLTable } from '.';

export function api_url(table, id) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_sys_id', id);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('displayvariables', 'true');
  return base.href;
}

export function api_url_query(table, query, limit = 20) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_action', 'getRecords');
  base.searchParams.append('sysparm_query', query);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('sysparm_record_count', limit.toString());
  return base.href;
}

export function get_sys_id_from_url(table) {
  const url = window.location.href;
  const index = url.indexOf(table);
  const index_sys_id_start = index + table.length + 1;
  let index_sys_id_end = url.indexOf('/', index_sys_id_start);
  if (index_sys_id_end == -1) {
    index_sys_id_end = url.length;
  }
  const sys_id = url.substring(index_sys_id_start, index_sys_id_end);
  return sys_id;
}

export async function get_record(table, sys_id = null) {
  if (sys_id == null) {
    sys_id = get_sys_id_from_url(table);
  }
  const response = await fetch(api_url(table, sys_id));
  const j = await response.json();
  return j;
}

export async function get_records(table, query, limit = 20) {
  const response = await fetch(api_url_query(table, query, limit));
  const j = await response.json();
  return j;
}

export function build_charge_sheet_row_cis(task, user) {
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
    '',
    '',
    '',
    u_variables.street_address,
    '',
    u_variables.city,
    u_variables.v_state,
    u_variables.zip,
    '',
    '1',
    'WFH',
    task.dv_number,
    'mhixon',
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

export function build_exit_json(task, user, manager, asset) {
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
    assetsToReturn: u_variables.v_assets_to_return,
    serialNumber: asset.dv_serial_number,
    installStatus: asset.dv_install_status,
    substatus: asset.dv_substatus,
    model: asset.dv_model,
    terminationDate: user.dv_u_termination_date,
    costCenter: user.dv_cost_center,
    qid: user.dv_x_ebay_core_config_sam_qid,
    title: user.dv_title,
  };
  return json;
}

/*
// Example
let task = await snow_get_record('sc_task');
let ritm = await snow_get_record('sc_req_item', task.records[0].parent); //or request_item instead of parent
let user = await snow_get_record('sys_user', ritm.records[0].requested_for);
let assets = await snow_get_records('alm_hardware', `assigned_to=${user.records[0].sys_id}^install_status=1`);

console.log(build_charge_sheet_row(task.records[0], user.records[0]));
console.log(build_bh_sheet_row(task.records[0], user.records[0]));
*/
