/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSignal, onMount } from 'solid-js';
import styles from '../../style.module.css';
import { getCostCenterFromHub } from '../../../utils';

export default function Routing(props) {
  onMount(() => {
    Object.assign(props.panelRef.wrapper.style, {
      display: 'block',
      width: '100%',
      position: 'relative',
      bottom: 'calc(100 - var(20vh))',
      left: 0,
      right: 0,
      transition: 'all 0.1s ease-out',
      overflowY: 'scroll',
    });
    props.panelRef.setMovable(true);
  });
  const [getRoute, setRoute] = createSignal(window.location);
  const [getNT, setNT] = createSignal(0);

  return (
    <div
      style={{
        display: 'block',
        width: '100%',
        position: 'relative',
        bottom: 'calc(100 - var(20vh))',
        left: 0,
        right: 0,
        transition: 'all 0.1s ease-out',
        'overflow-y': 'scroll',
      }}
    >
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
