import {
  AlmHardware,
  ScReqItem,
  ScTask,
  Incident,
  SysUser,
  ExitRITM_UVariables,
  ExitSCTask_UVariables,
} from './types';

// Utility to construct the ServiceNow JSONv2 API URL
function buildApiUrl(table: string, sysId: string): string {
  // In a browser context, window.location.origin is suitable.
  // If this code were to run in a Node.js environment, a base URL would need to be provided.
  const BASE_URL = 'https://ebayinc.service-now.com'; // Use a concrete base URL as seen in snow_utils.ts
  const url = new URL(`/${table}.do`, BASE_URL);
  url.searchParams.append('JSONv2', '');
  url.searchParams.append('sysparm_sys_id', sysId);
  url.searchParams.append('displayvalue', 'all');
  url.searchParams.append('displayvariables', 'true');
  return url.href;
}

// Utility to construct the ServiceNow JSONv2 API URL for queries
function buildApiUrlQuery(
  table: string,
  query: string,
  limit: number = 20,
): string {
  const BASE_URL = 'https://ebayinc.service-now.com';
  const url = new URL(`/${table}.do`, BASE_URL);
  url.searchParams.append('JSONv2', '');
  url.searchParams.append('sysparm_action', 'getRecords');
  url.searchParams.append('sysparm_query', query);
  url.searchParams.append('displayvalue', 'all');
  url.searchParams.append('sysparm_record_count', limit.toString());
  return url.href;
}

// Generic function to fetch a single record by its sys_id
export async function getSnowRecord<T>(
  table: string,
  sysId: string,
): Promise<T | null> {
  const apiUrl = buildApiUrl(table, sysId);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${table} with sys_id ${sysId}: ${response.statusText}`,
      );
    }
    const data = await response.json();
    if (data.records && data.records.length > 0) {
      return data.records[0] as T;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${table} with sys_id ${sysId}:`, error);
    return null;
  }
}

// Generic function to fetch multiple records by query
export async function getSnowRecords<T>(
  table: string,
  query: string,
  limit?: number,
): Promise<T[]> {
  const apiUrl = buildApiUrlQuery(table, query, limit);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch records from ${table} with query "${query}": ${response.statusText}`,
      );
    }
    const data = await response.json();
    if (data.records) {
      return data.records as T[];
    }
    return [];
  } catch (error) {
    console.error(
      `Error fetching records from ${table} with query "${query}":`,
      error,
    );
    return [];
  }
}

// Specific API functions for each table
export async function getAlmHardware(
  sysId: string,
): Promise<AlmHardware | null> {
  return getSnowRecord<AlmHardware>('alm_hardware', sysId);
}

export async function getScReqItem(sysId: string): Promise<ScReqItem | null> {
  const record = await getSnowRecord<ScReqItem>('sc_req_item', sysId);
  if (record && record.u_variables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (record as any).u_variables_parsed = JSON.parse(
        record.u_variables,
      ) as ExitRITM_UVariables;
    } catch (e) {
      console.error(`Error parsing u_variables for sc_req_item ${sysId}:`, e);
    }
  }
  return record;
}

export async function getScTask(sysId: string): Promise<ScTask | null> {
  const record = await getSnowRecord<ScTask>('sc_task', sysId);
  if (record && record.u_variables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (record as any).u_variables_parsed = JSON.parse(
        record.u_variables,
      ) as ExitSCTask_UVariables;
    } catch (e) {
      console.error(`Error parsing u_variables for sc_task ${sysId}:`, e);
    }
  }
  return record;
}

export async function getIncident(sysId: string): Promise<Incident | null> {
  return getSnowRecord<Incident>('incident', sysId);
}

export async function getSysUser(sysId: string): Promise<SysUser | null> {
  return getSnowRecord<SysUser>('sys_user', sysId);
}

// Re-export types for convenience
export * from './types';
