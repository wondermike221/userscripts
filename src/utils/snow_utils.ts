export function snow_api_url(table, id) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_sys_id', id);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('displayvariables', 'true');
  return base.href;
}

export function snow_api_url_query(table, query, limit = 20) {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const base = new URL(`/${table}.do`, BASE_URL);
  base.searchParams.append('JSONv2', '');
  base.searchParams.append('sysparm_action', 'getRecords');
  base.searchParams.append('sysparm_query', query);
  base.searchParams.append('displayvalue', 'all');
  base.searchParams.append('sysparm_record_count', limit.toString());
  return base.href;
}

export function snow_get_sys_id_from_url(table) {
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

export async function snow_get_record(table, sys_id = null) {
  if (sys_id == null) {
    sys_id = snow_get_sys_id_from_url(table);
  }
  const response = await fetch(snow_api_url(table, sys_id));
  const j = await response.json();
  return j;
}

export async function snow_get_records(table, query, limit = 20) {
  const response = await fetch(snow_api_url_query(table, query, limit));
  const j = await response.json();
  return j;
}

export function build_charge_sheet_row(task, user) {
  const u_variables = JSON.parse(task.u_variables);
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
  return row.join('\t');
}

export function build_fedex_json(task, user) {
  const u_variables = JSON.parse(task.u_variables);
  const json = {
    address: {
      streetAddress: u_variables.street_address,
      city: u_variables.city,
      state: u_variables.v_state,
      postalCode: u_variables.zip,
      countryCode: 'US',
    },
    contact: {
      name: user.dv_name,
      phone: u_variables.contact_number,
    },
  };
  return json;
}

export function build_bh_sheet_row(task, user) {
  const u_variables = JSON.parse(task.u_variables);
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
  return row.join('\t');
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
