// ─── DVOf: auto-generate dv_ display-value mirror fields ─────────────────────
// ServiceNow JSONv2 with displayvalue=all returns a flat `dv_<field>` string
// alongside every raw field. This mapped type generates those mirrors so you
// only define the base fields once. dv_ fields can be null when the raw field
// is an empty reference or the display value is unavailable.
export type DVOf<T extends object> = {
  [K in string & keyof T as `dv_${K}`]: string | null;
};

// ─── Primitive aliases (documentation, not runtime-enforced) ─────────────────
/** 32-char hex string — a ServiceNow sys_id */
export type SysId = string;
/** ServiceNow datetime: "YYYY-MM-DD HH:mm:ss" */
export type SnowDate = string;
/** Boolean stored as the string "true" or "false" */
export type SnowBool = 'true' | 'false';

// ─── Enums ────────────────────────────────────────────────────────────────────
// Pattern: `const Foo = { ... } as const; type Foo = typeof Foo[keyof typeof Foo]`
// Gives you both Foo.WorkInProgress (value obj) and a union type for the field.

// TODO: Pending and NotStarted values need verification for your eBay instance.
// Right-click the State field on a SNOW record → Show Choice List to get codes.
export const TaskStateCode = {
  Open: '1',
  WorkInProgress: '2',
  ClosedComplete: '3',
  ClosedIncomplete: '4',
  Pending: '-5',
  ClosedSkipped: '7',
  NotStarted: '0',
} as const;
export type TaskStateCode = (typeof TaskStateCode)[keyof typeof TaskStateCode];

export type TaskStateLabel =
  | 'Open'
  | 'Work in Progress'
  | 'Closed Complete'
  | 'Closed Incomplete'
  | 'Pending'
  | 'Closed Skipped'
  | 'Not Started';

// TODO: Monitoring numeric code needs verification (eBay custom).
export const IncidentStateCode = {
  New: '1',
  InProgress: '2',
  OnHold: '3',
  Resolved: '6',
  Closed: '7',
  Canceled: '8',
  Monitoring: '5',
} as const;
export type IncidentStateCode =
  (typeof IncidentStateCode)[keyof typeof IncidentStateCode];

export type IncidentStateLabel =
  | 'New'
  | 'In Progress'
  | 'On Hold'
  | 'Resolved'
  | 'Closed'
  | 'Canceled'
  | 'Monitoring';

export const Priority = {
  Critical: '1',
  High: '2',
  Moderate: '3',
  Low: '4',
  Planning: '5',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const Urgency = { High: '1', Medium: '2', Low: '3' } as const;
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const Impact = { High: '1', Medium: '2', Low: '3' } as const;
export type Impact = (typeof Impact)[keyof typeof Impact];

export const Severity = { High: '1', Medium: '2', Low: '3' } as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

// TODO: Racked, Deprecated, InTransit codes are eBay custom — verify values.
export const InstallStatus = {
  InUse: '1',
  OnOrder: '3',
  InStock: '6',
  Retired: '7',
  Missing: '8',
  InTransit: '9',
  Racked: '10',
  Deprecated: '11',
} as const;
export type InstallStatus = (typeof InstallStatus)[keyof typeof InstallStatus];

// ─── Catalog variable ─────────────────────────────────────────────────────────
// `variables` comes back as a pre-parsed array — NOT a JSON string.
export const SnowVariableType = {
  YesNo: 2,
  MultiLineText: 3,
  MultipleChoice: 4,
  SelectBox: 5,
  SingleLineText: 6,
  CheckBox: 7,
  Reference: 8,
  Date: 9,
  DateTime: 10,
  Container: 14,
  RichText: 23,
} as const;
export type SnowVariableType =
  (typeof SnowVariableType)[keyof typeof SnowVariableType];

export interface SnowVariable {
  question_text: string;
  name: string;
  type: number;
  value: string;
  order: number;
}

// ─── Utility: add typed u_variables_parsed without `any` cast ────────────────
export type WithParsedVars<TRecord, TVars> = TRecord & {
  u_variables_parsed: TVars;
};

// ─── Catalog item variable shapes ─────────────────────────────────────────────
export interface ExitRITM_UVariables {
  additional_equipment_to_return: string;
  city: string;
  contact_email: string;
  contact_number: string;
  country: string;
  office_location: string;
  packing_materials: string;
  ship_it: string;
  street_address: string;
  v_assets_to_return: string;
  v_category: string;
  v_description: string;
  v_recipient_name: string;
  v_remove_from_zero_tough: string;
  v_requested_for: string;
  v_short_description: string;
  v_state: string;
  v_sub_type: string;
  v_type: string;
  v_update_asset: string;
  v_verify_factory_reset: string;
  v_watch_list: string;
  vs_it_desktop_support: string;
  vs_returns_shipping_info: string;
  zip: string;
}

export interface ExitSCTask_UVariables {
  additional_equipment_to_return: string;
  city: string;
  contact_email: string;
  contact_number: string;
  country: string;
  office_location: string;
  packing_materials: string;
  ship_it: string;
  street_address: string;
  v_assets_to_return: string;
  v_remove_from_zero_tough: string;
  v_update_asset: string;
  v_verify_factory_reset: string;
  vs_returns_shipping_info: string;
  zip: string;
}

// ─── Task base ────────────────────────────────────────────────────────────────
// Fields shared by sc_task, sc_req_item, and incident.
// Excludes: variables (SnowVariable[] — no dv_ mirror), __status (JSONv2 meta).
// DVOf<ScTaskRaw> (applied in derived types) generates dv_ for ALL these fields
// plus the derived-type-specific ones in one shot.
export interface SnowTaskBaseRaw {
  sys_id: SysId;
  sys_class_name: string;
  sys_created_by: string;
  sys_created_on: SnowDate;
  sys_updated_by: string;
  sys_updated_on: SnowDate;
  sys_domain: string;
  sys_domain_path: string;
  sys_mod_count: string;
  sys_tags: string;

  number: string;
  state: string; // narrowed to TaskStateCode | IncidentStateCode in derived
  priority: string; // use Priority
  urgency: string; // use Urgency
  impact: string; // use Impact
  active: SnowBool;
  made_sla: SnowBool;
  escalation: string;

  short_description: string;
  description: string;
  comments: string;
  work_notes: string;
  work_notes_list: string;
  comments_and_work_notes: string;
  close_notes: string;

  opened_at: SnowDate;
  opened_by: SysId;
  closed_at: SnowDate;
  closed_by: SysId;
  work_start: SnowDate;
  work_end: SnowDate;
  due_date: SnowDate;
  expected_start: SnowDate;
  activity_due: SnowDate;
  sla_due: SnowDate;
  follow_up: SnowDate;
  business_duration: string;
  calendar_duration: string;
  time_worked: string;

  parent: string;
  assignment_group: SysId;
  assigned_to: SysId;
  location: SysId;
  company: SysId;
  business_service: SysId;
  service_offering: SysId;
  cmdb_ci: SysId;
  contract: SysId;
  universal_request: string;

  approval: string;
  approval_set: SnowDate;
  approval_history: string;
  upon_approval: string;
  upon_reject: string;

  contact_type: string;
  correlation_id: string;
  correlation_display: string;
  route_reason: string;
  user_input: string;

  watch_list: string;
  group_list: string;
  additional_assignee_list: string;
  skills: string;
  knowledge: SnowBool;
  reassignment_count: string;
  task_effective_number: string;
  sn_ai_sentiment: string;

  // eBay custom — confirmed shared across all task tables
  u_variables: string; // JSON string; parse via WithParsedVars in api layer
  u_cis: string;
  u_config_items: string;
  u_ci_s_not_found: string;
  u_line_of_business: string;
  u_domain_organization: string;
  u_executive_organization: string;
  u_organization: string;
  u_dedicated_team: SysId;
  u_kba_found: string;
  u_tag: string;
  u_disable_automation: SnowBool;
  u_propagate_comment: SnowBool;
  u_add_as_additional_comments: SnowBool;
  u_resolution_type: string;
  u_resolution_subtype: string;
  u_spawn_record_id: string;
  u_spawned_from: string;
  u_archival_status: string;
  u_archived_at: SnowDate;
  u_notes: string;
  u_description: string;
  u_blocked_item: string;
  u_substate_correlate: string;
  u_request_priority: string;
  u_sla_pause_reason: string; // found in diagnostic, missing from old types
  u_observability_reliability_goal: string; // found in diagnostic, missing from old types

  x_ebay_bug_bounty_jira_ticket: string;
  x_ebay_capacity_name: string;
  x_ebay_core_config_category: string;
  x_ebay_core_config_routing_type: string;
  x_ebay_core_config_show_activity: string;
  x_ebay_core_config_subtype: string;
  x_ebay_core_config_type: string;
  x_ebay_jira_int_jira_issue: string;
  x_ebay_message_bus_msb_transaction_id: string;
  x_ebay_nsa_event_severity: string;
  x_ebay_nsa_primary_event: string;
  x_pd_integration_conf_bridge: string;
  x_pd_integration_incident_id: string;
}

export type SnowTaskBase = SnowTaskBaseRaw &
  DVOf<SnowTaskBaseRaw> & {
    __status: string;
    variables: SnowVariable[];
  };

// ─── sc_task ──────────────────────────────────────────────────────────────────
export interface ScTaskRaw extends SnowTaskBaseRaw {
  state: TaskStateCode;
  request_item: SysId;
  request: SysId;
  cat_item: SysId;
  sc_catalog: SysId;
  order: string;
  calendar_stc: string;
  u_dependency: string;
  u_triage_note: string;
  u_pending: SnowBool;
  u_sub_state: string;
  u_substate_correlation: string;
  x_ebay_dc_asset_substate: string;
}

export type ScTask = ScTaskRaw &
  DVOf<ScTaskRaw> & {
    __status: string;
    variables: SnowVariable[];
  };

// ─── sc_req_item ──────────────────────────────────────────────────────────────
export interface ScReqItemRaw extends SnowTaskBaseRaw {
  state: TaskStateCode;
  requested_for: SysId;
  request: SysId;
  cat_item: SysId;
  sc_catalog: SysId;
  order_guide: SysId;
  order: string;
  context: SysId;
  flow_context: SysId;
  stage: string;
  price: string;
  recurring_price: string;
  recurring_frequency: string;
  quantity: string;
  quantity_sourced: string;
  billable: SnowBool;
  backordered: SnowBool;
  sourced: SnowBool;
  received: SnowDate;
  estimated_delivery: SnowDate;
}

export type ScReqItem = ScReqItemRaw &
  DVOf<ScReqItemRaw> & {
    __status: string;
    variables: SnowVariable[];
  };

// ─── incident ─────────────────────────────────────────────────────────────────
export interface IncidentRaw extends SnowTaskBaseRaw {
  state: IncidentStateCode;
  incident_state: IncidentStateCode;
  severity: Severity;
  caller_id: SysId;
  parent_incident: SysId;
  problem_id: SysId;
  rfc: SysId;
  cause: string;
  caused_by: string;
  subcategory: string;
  category: string;
  hold_reason: string;
  close_code: string;
  notify: string;
  reopen_count: string;
  reopened_time: SnowDate;
  resolved_at: SnowDate;
  resolved_by: SysId;
  reopened_by: SysId;
  origin_id: string;
  origin_table: string;
  calendar_stc: string;
  business_stc: string;
  business_impact: string;

  u_alerted_by: string;
  u_atb_state: string;
  u_cause: string;
  u_cause_of_outage: string;
  u_circuit_id: string;
  u_circuit_vendor: string;
  u_community_impact_assessment: string;
  u_condition: string;
  u_configuration_items: string;
  u_contact_info: string;
  u_customer_impact: string;
  u_dc_ops_event_class: string;
  u_detection: string;
  u_detected_at: SnowDate;
  u_diagnosis: string;
  u_dimensions: string;
  u_direct_cause_subtype: string;
  u_direct_cause_type: string;
  u_environment: string;
  u_escalation: string;
  u_fci_state: string;
  u_feature_area: string;
  u_feature_area_temp: string;
  u_impacted_location_s: string;
  u_impacted_regions: string;
  u_incident_class: string;
  u_incident_recommendations: string;
  u_internal_impact: string;
  u_lost_teammate_productive_hours: string;
  u_management_report: string;
  u_mitigation: string;
  u_mitigation_started: SnowDate;
  u_no_cr_reason: string;
  u_number_of_reports_on_cskb: string;
  u_number_of_reports_to_it_helpdesk: string;
  u_of_impact_to_workflows: string;
  u_over_under_forecast_needed: string;
  u_p0_p1_bug: SnowBool;
  u_p1_issue_type: string;
  u_prevention: string;
  u_reference_ticket: string;
  u_related_bug: string;
  u_reported_by: SysId;
  u_restore_sop: string;
  u_root_cause_afg: string;
  u_root_cause_cat: string;
  u_service_impaired_at: SnowDate;
  u_service_restored_at: SnowDate;
  u_system_impact_assessment: string;
  u_tcb: string;
  u_time_to_detect_minutes: string;
  u_time_to_mitigate: string;
  u_time_to_restore_minutes: string;
  u_time_to_triage: string;
  u_total_customer_contacts: string;
  u_total_customer_interactions_impacted: string;
  u_total_employees_impact: string;
  u_total_teammates_impacted: string;
  u_vendor: string;
  u_vendor_circuit_id: string;
  u_vendor_ticket_reference: string;
  u_x_ebay_integration_update_source: string;
  u_affected_flows: string;
  u_cskb: string;

  x_ebay_nsa_dedup_count: string;
  x_ebay_sec_call_total_calls_answered: string;
  x_ebay_sec_call_total_calls_made: string;
  x_pd_integration_incident: string;
  x_pd_integration_incident_key: string;

  x_syna3_synack_app_cvss_score: string;
  x_syna3_synack_app_impact: string;
  x_syna3_synack_app_recommended_fix: string;
  x_syna3_synack_app_resolve_notes: string;
  x_syna3_synack_app_synack_category: string;
  x_syna3_synack_app_synack_cvss_blob: string;
  x_syna3_synack_app_synack_cwe_ids: string;
  x_syna3_synack_app_synack_exploitable_locations: string;
  x_syna3_synack_app_synack_http_requests: string;
  x_syna3_synack_app_synack_id: string;
  x_syna3_synack_app_synack_link: string;
  x_syna3_synack_app_synack_patch_attempts: string;
  x_syna3_synack_app_synack_patch_verification_enabled: string;
  x_syna3_synack_app_synack_status: string;
  x_syna3_synack_app_synack_tag_list: string;
}

export type Incident = IncidentRaw &
  DVOf<IncidentRaw> & {
    __status: string;
    variables: SnowVariable[];
  };

// ─── alm_hardware ─────────────────────────────────────────────────────────────
export interface AlmHardwareRaw {
  sys_id: SysId;
  sys_class_name: string;
  sys_created_by: string;
  sys_created_on: SnowDate;
  sys_updated_by: string;
  sys_updated_on: SnowDate;
  sys_domain: string;
  sys_domain_path: string;
  sys_mod_count: string;
  sys_tags: string;

  asset_tag: string;
  asset_function: string;
  display_name: string;
  serial_number: string;
  mac_addr: string;
  model: SysId;
  model_category: SysId;
  model_component: SysId;
  model_component_id: string;
  product_instance_id: string;

  install_status: InstallStatus;
  substatus: string;
  life_cycle_stage: string;
  life_cycle_stage_status: string;
  old_status: string;
  old_substatus: string;
  pre_allocated: SnowBool;
  eligible_for_refresh: SnowBool;
  skip_sync: SnowBool;
  retired: SnowBool;

  assigned_to: SysId;
  managed_by: SysId;
  owned_by: SysId;
  supported_by: SysId;
  support_group: SysId;
  location: SysId;
  company: SysId;
  vendor: SysId;
  stockroom: SysId;
  cost_center: SysId;
  department: SysId;
  ci: SysId;
  beneficiary: SysId;
  reserved_for: SysId;
  gl_account: SysId;
  lease_id: SysId;
  request_line: SysId;
  parent: string;

  invoice_number: string;
  po_number: string;
  order_date: SnowDate;
  purchase_date: SnowDate;
  delivery_date: SnowDate;
  install_date: SnowDate;
  assigned: SnowDate;
  warranty_expiration: SnowDate;
  retirement_date: SnowDate;
  residual_date: SnowDate;
  depreciation_date: SnowDate;
  checked_out: SnowDate;
  checked_in: SnowDate;
  due: SnowDate;
  due_in: string;

  cost: string;
  quantity: string;
  residual: string;
  salvage_value: string;
  resold_value: string;
  resale_price: string;
  depreciated_amount: string;
  acquisition_method: string;
  expenditure_type: string;
  justification: string;
  disposal_reason: string;
  comments: string;
  work_notes: string;

  u_dedicated_team: SysId;
  u_reservation_details: string;
  u_reservation_expiration: SnowDate;
  u_licensing_serial_number: string;
  u_imei_number: string;

  x_ebay_dc_asset_asset_received: string;
  x_ebay_dc_asset_audited_by: SysId;
  x_ebay_dc_asset_audited_on: SnowDate;
  x_ebay_dc_asset_budget_category: string;
  x_ebay_dc_asset_chassis_position: string;
  x_ebay_dc_asset_cms_oid: string;
  x_ebay_dc_asset_created_by_user: SysId;
  x_ebay_dc_asset_current_state_aging: string;
  x_ebay_dc_asset_current_substate_aging: string;
  x_ebay_dc_asset_dctrack_id: string;
  x_ebay_dc_asset_enrollment_type: string;
  x_ebay_dc_asset_eol: SnowDate;
  x_ebay_dc_asset_eol_plan: string;
  x_ebay_dc_asset_eol_year: string;
  x_ebay_dc_asset_eolyear: string;
  x_ebay_dc_asset_execution_line: string;
  x_ebay_dc_asset_hostid_hex: string;
  x_ebay_dc_asset_hostname: string;
  x_ebay_dc_asset_last_scrubbed_on: SnowDate;
  x_ebay_dc_asset_net_return_value: string;
  x_ebay_dc_asset_number: string;
  x_ebay_dc_asset_onsite_service_fees: string;
  x_ebay_dc_asset_owner_team: SysId;
  x_ebay_dc_asset_po_number: string;
  x_ebay_dc_asset_pow_audited_by: SysId;
  x_ebay_dc_asset_pow_audited_on: SnowDate;
  x_ebay_dc_asset_power_cord_quantity: string;
  x_ebay_dc_asset_purchase_config: string;
  x_ebay_dc_asset_rack_profile_instance: SysId;
  x_ebay_dc_asset_refresh_policy: string;
  x_ebay_dc_asset_reserved_resource: SnowBool;
  x_ebay_dc_asset_rfid_tag: string;
  x_ebay_dc_asset_ru_position: string;
  x_ebay_dc_asset_ru_value: string;
  x_ebay_dc_asset_sap_linkage_cat: string;
  x_ebay_dc_asset_sap_po_line: string;
  x_ebay_dc_asset_sap_uid: string;
  x_ebay_dc_asset_server_reserved_resource: SnowBool;
  x_ebay_dc_asset_u_capacity_state: string;
  x_ebay_dc_asset_u_capacity_substate: string;
  x_ebay_espare_spare_rule: SysId;
  x_ebay_integration_update_source: string;
}

export type AlmHardware = AlmHardwareRaw &
  DVOf<AlmHardwareRaw> & {
    __status: string;
  };

// ─── sys_user ─────────────────────────────────────────────────────────────────
export interface SysUserRaw {
  sys_id: SysId;
  sys_class_name: string;
  sys_created_by: string;
  sys_created_on: SnowDate;
  sys_updated_by: string;
  sys_updated_on: SnowDate;
  sys_domain: string;
  sys_domain_path: string;
  sys_mod_count: string;
  sys_tags: string;

  user_name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  name: string;
  email: string;
  phone: string;
  mobile_phone: string;
  home_phone: string;
  fax: string;
  title: string;
  introduction: string;
  photo: string;
  avatar: string;

  department: SysId;
  company: SysId;
  manager: SysId;
  location: SysId;
  cost_center: SysId;
  building: SysId;
  schedule: SysId;

  active: SnowBool;
  vip: SnowBool;
  web_service_access_only: SnowBool;
  internal_integration_user: SnowBool;
  enable_multifactor_authn: SnowBool;
  geolocation_tracked: SnowBool;
  on_schedule: SnowBool;

  notification: string;
  calendar_integration: string;
  employee_number: string;
  gender: string;
  date_format: string;
  time_format: string;
  time_zone: string;
  preferred_language: string;
  country: string;
  city: string;
  street: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
  business_criticality: string;

  last_login: SnowDate;
  last_login_time: SnowDate;
  last_position_update: SnowDate;
  failed_attempts: string;
  agent_status: string;
  identity_type: string;
  sso_source: string;
  source: string;
  federated_id: string;

  u_userprincipalname: string;
  u_type: string;
  u_cms_oid: string;
  u_jira_id: string;
  u_vp: SysId;
  u_svp: SysId;
  u_director: SysId;
  u_primary_group: SysId;
  u_custodian: SysId;
  u_custodian_date: SnowDate;
  u_hire_date: SnowDate;
  u_termination_date: SnowDate;
  u_owner: string;
  u_entitlements: string;
  u_is_gcx_supervisor: SnowBool;
  u_gcx_supervisor: SysId;
  u_worker_source: string;
  u_covered_person: SnowBool;
  u_restrict_email_change: SnowBool;
  u_vendor: SnowBool;
  u_configuration_item: SysId;

  x_ebay_core_config_a_account: string;
  x_ebay_core_config_budget_manager: SysId;
  x_ebay_core_config_financial_analyst: SysId;
  x_ebay_core_config_peoplex_sync: SnowBool;
  x_ebay_core_config_sam_qid: string;
  x_ebay_core_config_sam_personnel_id: string;
  x_pd_integration_pagerduty_id: string;
}

export type SysUser = SysUserRaw &
  DVOf<SysUserRaw> & {
    __status: string;
  };
