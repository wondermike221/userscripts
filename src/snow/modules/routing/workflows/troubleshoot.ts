import { showToast } from '@violentmonkey/ui';
import { fetchTicketData } from '../fetchTicketData';
import { getWorkNotes } from '../../../api';
import { buildTroubleshootMd } from '../templates/troubleshoot';
import { step, buildSteps, errorNode, type Workflow } from '../workflow';

export const troubleshootWorkflow: Workflow = {
  label: 'Troubleshoot',
  load: async () => {
    const data = await fetchTicketData();
    if (!data) return errorNode('No SNOW record detected');

    const sysId =
      data.type === 'incident' ? data.incident.sys_id : data.task.sys_id;
    const ticketNumber =
      data.type === 'incident' ? data.incident.number : data.task.number;
    const workNotes = await getWorkNotes(sysId);
    const filename = `${ticketNumber}-claude.md`;

    return buildSteps([
      [
        'download',
        step.action('Download CLAUDE.md', () => {
          const content = buildTroubleshootMd(data, workNotes);
          downloadMd(filename, content);
          showToast(`Downloaded ${filename}`, { theme: 'dark' });
        }),
      ],
    ]);
  },
};

function downloadMd(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
