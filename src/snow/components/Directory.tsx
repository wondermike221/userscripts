import { createSignal, For } from 'solid-js';

type DirectoryEntry = {
  id: string;
  label: string;
  description?: string;
  onClick: () => void;
};

interface DirectoryProps {
  entries: DirectoryEntry[];
  title?: string;
  style?: Record<string, string>;
}

export default function Directory(props: DirectoryProps) {
  const [selected, setSelected] = createSignal<string | null>(null);

  const handleClick = (entry: DirectoryEntry) => {
    setSelected(entry.id);
    entry.onClick();
  };

  return (
    <div
      style={{
        padding: '1em',
        background: '#222',
        color: '#eee',
        borderRadius: '8px',
        minWidth: '220px',
        ...props.style,
      }}
    >
      {props.title && (
        <h2 style={{ margin: '0 0 1em 0', fontSize: '1.2em' }}>
          {props.title}
        </h2>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <For each={props.entries}>
          {(entry) => (
            <li
              style={{
                margin: '0.5em 0',
                background: selected() === entry.id ? '#444' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '0.5em',
                transition: 'background 0.2s',
              }}
              tabIndex={0}
              onClick={() => handleClick(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClick(entry);
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{entry.label}</div>
              {entry.description && (
                <div style={{ fontSize: '0.9em', color: '#aaa' }}>
                  {entry.description}
                </div>
              )}
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
