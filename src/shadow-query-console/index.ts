import './meta.js?userscript-metadata';
import { ShadowQuery } from '../utils/ShadowQuery';

declare global {
  interface Window {
    ShadowQuery: typeof ShadowQuery;
  }
}

unsafeWindow.ShadowQuery = ShadowQuery;
