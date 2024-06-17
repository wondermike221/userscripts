import { addTitles } from './ui';

export default function eventAdder() {
  const events = [
    () => {
      window.addEventListener('popstate', (event) => {
        console.log(
          `location: ${document.location}, state: ${JSON.stringify(event.state)}`,
        );
        addTitles();
      });
    },
    () => {
      window.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.getAttribute('ux-id') === 'preset-name') {
          console.log('preset name clicked');
          addTitles();
        }
      });
    },
  ];
  for (const e of events) {
    e();
  }
}
