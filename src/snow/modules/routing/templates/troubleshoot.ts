import type { TicketData, SysJournalEntry } from '../../../api';

const DISRUPTION_KEYWORDS =
  /\b(down|broken|not working|outage|error|fail|issue|problem|unexpected)\b/i;

export function buildTroubleshootMd(
  data: TicketData,
  workNotes: SysJournalEntry[],
): string {
  const sections: string[] = [];
  const ticketNumber =
    data.type === 'incident' ? data.incident.number : data.task.number;

  sections.push(`# CLAUDE.md — Troubleshooting Context`);
  sections.push(
    `> Generated ${new Date().toISOString()} from ${window.location.href}`,
  );

  // ── Ticket Summary ──────────────────────────────────────────────────────────
  const base = data.type === 'incident' ? data.incident : data.task;
  sections.push(`## Ticket Summary

| Field | Value |
|-------|-------|
| Number | ${base.number} |
| Type | ${data.type === 'incident' ? 'Incident (INC)' : 'Service Catalog Task (SCTASK)'} |
| State | ${base.dv_state ?? '—'} |
| Priority | ${base.dv_priority ?? '—'} |
| Urgency | ${base.dv_urgency ?? '—'} |
| Impact | ${base.dv_impact ?? '—'} |
| Assignment Group | ${base.dv_assignment_group ?? '—'} |
| Assigned To | ${base.dv_assigned_to ?? '—'} |
| Opened | ${base.opened_at} |
| Location | ${base.dv_location ?? '—'} |`);

  // ── Short Description / Description ─────────────────────────────────────────
  sections.push(`## Short Description\n\n${base.short_description}`);

  const rawDesc =
    data.type === 'incident'
      ? data.incident.description
      : data.ritm.description;
  if (rawDesc) {
    sections.push(`## Description\n\n${stripHtml(rawDesc)}`);
  }

  // ── Requester / Caller ───────────────────────────────────────────────────────
  const { user, manager } = data;
  sections.push(`## Requester / Caller

| Field | Value |
|-------|-------|
| Name | ${user.dv_name ?? user.name} |
| Username | ${user.user_name} |
| Email | ${user.dv_email ?? user.email} |
| Department | ${user.dv_department ?? '—'} |
| Title | ${user.title || '—'} |
| Manager | ${manager ? (manager.dv_name ?? manager.name) : '—'} |
| Manager Email | ${manager ? (manager.dv_email ?? manager.email) : '—'} |`);

  // ── Catalog Context (SCTASK only) ────────────────────────────────────────────
  if (data.type === 'sc_task') {
    const { task, ritm } = data;
    sections.push(`## Catalog Context

| Field | Value |
|-------|-------|
| Task Number | ${task.number} |
| Parent RITM | ${ritm.dv_number ?? ritm.number} |
| Catalog Item | ${ritm.dv_cat_item ?? '—'} |
| RITM Short Description | ${ritm.short_description} |`);

    if (ritm.description) {
      sections.push(`### RITM Description\n\n${stripHtml(ritm.description)}`);
    }

    // Assets
    const { assets } = data;
    if (assets.length === 0) {
      sections.push(`## Assigned Assets\n\n_No assets assigned._`);
    } else {
      const rows = assets
        .map(
          (a) =>
            `| ${a.dv_asset_tag ?? a.asset_tag} | ${a.dv_model ?? '—'} | ${a.serial_number || '—'} | ${a.dv_install_status ?? '—'} |`,
        )
        .join('\n');
      sections.push(
        `## Assigned Assets\n\n| Asset Tag | Model | Serial | Status |\n|-----------|-------|--------|--------|\n${rows}`,
      );
    }
  }

  // ── Incident Details (INC only) ──────────────────────────────────────────────
  if (data.type === 'incident') {
    const { incident } = data;
    sections.push(`## Incident Details

| Field | Value |
|-------|-------|
| Category | ${incident.dv_category ?? '—'} |
| Subcategory | ${incident.dv_subcategory ?? '—'} |
| Severity | ${incident.dv_severity ?? '—'} |
| Detection Source | ${incident.u_observability_detection_source || '—'} |
| Cause | ${incident.cause || '—'} |
| Resolution Notes | ${stripHtml(incident.resolution_notes || '') || '—'} |`);
  }

  // ── Work Notes ───────────────────────────────────────────────────────────────
  if (workNotes.length === 0) {
    sections.push(`## Work Notes\n\n_No work notes found._`);
  } else {
    const noteBlocks = workNotes
      .map(
        (n) =>
          `### ${n.sys_created_on} — ${n.sys_created_by}\n\n${stripHtml(n.value)}`,
      )
      .join('\n\n---\n\n');
    sections.push(
      `## Work Notes (${workNotes.length} entries, most recent first)\n\n${noteBlocks}`,
    );
  }

  // ── Notes for Claude ─────────────────────────────────────────────────────────
  let typeContext: string;
  if (data.type === 'incident') {
    typeContext =
      'This is an **Incident (INC)** — an unplanned disruption or degradation of IT service. The goal is to restore service as quickly as possible, then identify root cause.';
  } else {
    const desc = `${base.short_description} ${data.ritm.description ?? ''}`;
    if (DISRUPTION_KEYWORDS.test(desc)) {
      typeContext =
        '> **NOTE:** This is classified as a **Service Catalog Task (SCTASK)** — a routine fulfillment request — but its description suggests it may be an unexpected disruption rather than a routine request. Treat it as an incident until confirmed otherwise.';
    } else {
      typeContext =
        'This is a **Service Catalog Task (SCTASK)** — a routine IT fulfillment request (e.g. hardware provisioning, software access, device ordering).';
    }
  }

  sections.push(`## Notes for Claude

${typeContext}

**How to use this file:**
1. Create a directory named \`${ticketNumber}/\` and save this file as \`CLAUDE.md\` inside it.
2. Open Claude Code in that directory: run \`claude\` from the terminal.
3. Claude Code will read this file automatically on startup.
4. Ask Claude to help troubleshoot, draft communications, or plan resolution steps.`);

  return sections.join('\n\n') + '\n';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}
