/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSignal } from 'solid-js';
import styles from '../../style.module.css';
import { getCostCenterFromHub } from '../../utils';

export default function Routing() {
  const [getRoute, setRoute] = createSignal(window.location);
  const [getNT, setNT] = createSignal(0);

  return (
    <div>
      <p>Drag me</p>
      <button class={styles.plus1} onClick={() => getCostCenterFromHub}>
        Get Cost Center for {getNT()}
      </button>
      <p>
        <span class={styles.count}>{getNT()}</span> people think this is
        amazing.
      </p>
    </div>
  );
}
