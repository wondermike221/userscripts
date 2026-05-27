// ==UserScript==
// @name        FedEx Form Filler
// @namespace   https://hixon.dev
// @description Various automations on SmartIT
// @match       https://www.fedex.com/shipping/*
// @match       https://www.fedex.com/shippingplus/*
// @version     0.3.0
// @author      Michael Hixon
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2/dist/solid.min.js
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/fedex-form-filler.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function (store, web, solidJs) {
'use strict';

var kt = Object.defineProperty;
var St = (e, t, r) => t in e ? kt(e, t, { enumerable: true, configurable: true, writable: true, value: r }) : e[t] = r;
var Me = (e, t, r) => St(e, typeof t != "symbol" ? t + "" : t, r);
function he(e, t, r) {
  try {
    const l = localStorage.getItem(`${e}.${t}.${r}`);
    return l !== null ? JSON.parse(l) : null;
  } catch {
    return null;
  }
}
function Qe(e, t, r, l) {
  try {
    localStorage.setItem(`${e}.${t}.${r}`, JSON.stringify(l));
  } catch {
  }
}
function Rt(e) {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const l = localStorage.key(r);
      l && l.startsWith(`${e}.`) && t.push(l);
    }
    t.forEach((r) => localStorage.removeItem(r));
  } catch {
  }
}
const Ee = {
  mode: "palette",
  palettePin: "top",
  globalShortcut: "Ctrl+`",
  modeSwapShortcut: "Ctrl+Shift+`",
  rememberLastMode: false,
  theme: "system"
};
function Lt(e) {
  const { keyPrefix: t, defaults: r = {} } = e, l = {
    mode: r.mode ?? Ee.mode,
    palettePin: r.palettePin ?? Ee.palettePin,
    globalShortcut: r.globalShortcut ?? Ee.globalShortcut,
    modeSwapShortcut: r.modeSwapShortcut ?? Ee.modeSwapShortcut,
    rememberLastMode: r.rememberLastMode ?? Ee.rememberLastMode,
    theme: r.theme ?? Ee.theme
  }, a = he(t, "meta", "mode");
  (a === "palette" || a === "dir") && (l.mode = a);
  const n = he(t, "meta", "palettePin");
  (n === "top" || n === "middle" || n === "bottom") && (l.palettePin = n);
  const i = he(t, "meta", "globalShortcut");
  i && (l.globalShortcut = i);
  const s = he(t, "meta", "modeSwapShortcut");
  s && (l.modeSwapShortcut = s);
  const o = he(t, "meta", "rememberLastMode");
  typeof o == "boolean" && (l.rememberLastMode = o);
  const y = he(t, "meta", "theme");
  return (y === "light" || y === "dark" || y === "system") && (l.theme = y), l;
}
function Mt() {
  return {
    x: Math.round(window.innerWidth * 0.375),
    y: Math.round(window.innerHeight * 0.375),
    width: Math.round(window.innerWidth * 0.25),
    height: Math.round(window.innerHeight * 0.25)
  };
}
function At(e) {
  return {
    visible: false,
    mode: e.mode,
    window: Mt(),
    palette: {
      query: "",
      results: [],
      selectedIndex: 0,
      overlay: null
    },
    nav: {
      path: [],
      currentNode: {},
      page: 1,
      totalPages: 1
    },
    meta: e
  };
}
function zt(e) {
  return store.createStore(At(e));
}
function Dt(e, t) {
  e("meta", (r) => ({ ...r, ...t }));
}
const Ht = {
  "`": "Backquote",
  "\\": "Backslash",
  "[": "BracketLeft",
  "]": "BracketRight",
  ";": "Semicolon",
  "'": "Quote",
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  "-": "Minus",
  "=": "Equal",
  " ": "Space"
};
function st(e, t) {
  const r = t.split("+"), l = r[r.length - 1], a = r.includes("Ctrl"), n = r.includes("Shift"), i = r.includes("Alt"), s = r.includes("Meta");
  if (e.ctrlKey !== a || e.shiftKey !== n || e.altKey !== i || e.metaKey !== s)
    return false;
  if (l.length === 1 && /[a-z0-9]/i.test(l))
    return e.key.toLowerCase() === l.toLowerCase();
  const o = Ht[l];
  return o ? e.code === o : e.key === l;
}
class jt {
  constructor() {
    Me(this, "entries", /* @__PURE__ */ new Map());
    Me(this, "shadowHost", null);
    Me(this, "globalHandler");
    Me(this, "scopedHandler");
    this.globalHandler = (t) => {
      for (const r of this.entries.values())
        r.scope === "global" && st(t, r.shortcut) && r.handler(t);
    }, this.scopedHandler = (t) => {
      var a;
      if (!(!this.shadowHost || !(document.activeElement === this.shadowHost || ((a = this.shadowHost.shadowRoot) == null ? void 0 : a.activeElement) != null)))
        for (const n of this.entries.values())
          n.scope === "scoped" && st(t, n.shortcut) && n.handler(t);
    }, document.addEventListener("keydown", this.globalHandler, { capture: true }), document.addEventListener("keydown", this.scopedHandler, { capture: true });
  }
  setShadowHost(t) {
    this.shadowHost = t;
  }
  registerGlobal(t, r, l) {
    this.entries.set(r, { shortcut: t, handler: l, scope: "global" });
  }
  registerScoped(t, r, l) {
    this.entries.set(r, { shortcut: t, handler: l, scope: "scoped" });
  }
  updateShortcut(t, r) {
    const l = this.entries.get(t);
    l && (l.shortcut = r);
  }
  unregister(t) {
    this.entries.delete(t);
  }
  destroy() {
    document.removeEventListener("keydown", this.globalHandler, { capture: true }), document.removeEventListener("keydown", this.scopedHandler, { capture: true }), this.entries.clear();
  }
}
const gt = (e, t) => e > t ? 1 : e < t ? -1 : 0, Ze = 1 / 0, Xe = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), at = "eexxaacctt", Bt = new RegExp("\\p{P}", "gu"), qt = "A-Z", Kt = "a-z", Nt = ["en", { numeric: true, sensitivity: "base" }], Ce = (e, t, r) => e.replace(qt, t).replace(Kt, r), ct = {
  // whether regexps use a /u unicode flag
  unicode: false,
  alpha: null,
  // term segmentation & punct/whitespace merging
  interSplit: "[^A-Za-z\\d']+",
  intraSplit: "[a-z][A-Z]",
  // inter bounds that will be used to increase lft2/rgt2 info counters
  interBound: "[^A-Za-z\\d]",
  // intra bounds that will be used to increase lft1/rgt1 info counters
  intraBound: "[A-Za-z]\\d|\\d[A-Za-z]|[a-z][A-Z]",
  // inter-bounds mode
  // 2 = strict (will only match 'man' on whitepace and punct boundaries: Mega Man, Mega_Man, mega.man)
  // 1 = loose  (plus allowance for alpha-num and case-change boundaries: MegaMan, 0007man)
  // 0 = any    (will match 'man' as any substring: megamaniac)
  interLft: 0,
  interRgt: 0,
  // allowance between terms
  interChars: ".",
  interIns: Ze,
  // allowance between chars in terms
  intraChars: "[a-z\\d']",
  // internally case-insensitive
  intraIns: null,
  intraContr: "'[a-z]{1,2}\\b",
  // multi-insert or single-error mode
  intraMode: 0,
  // single-error bounds for errors within terms, default requires exact first char
  intraSlice: [1, Ze],
  // single-error tolerance toggles
  intraSub: null,
  intraTrn: null,
  intraDel: null,
  // can post-filter matches that are too far apart in distance or length
  // (since intraIns is between each char, it can accum to nonsense matches)
  intraFilt: (e, t, r) => true,
  // should this also accept WIP info?
  toUpper: (e) => e.toLocaleUpperCase(),
  toLower: (e) => e.toLocaleLowerCase(),
  compare: null,
  // final sorting fn
  sort: (e, t, r, l = gt) => {
    let {
      idx: a,
      chars: n,
      terms: i,
      interLft2: s,
      interLft1: o,
      //	interRgt2,
      //	interRgt1,
      start: y,
      intraIns: c,
      interIns: u,
      cases: v
    } = e;
    return a.map((b, E) => E).sort((b, E) => (
      // most contig chars matched
      n[E] - n[b] || // least char intra-fuzz (most contiguous)
      c[b] - c[E] || // most prefix bounds, boosted by full term matches
      i[E] + s[E] + 0.5 * o[E] - (i[b] + s[b] + 0.5 * o[b]) || // highest density of match (least span)
      //	span[ia] - span[ib] ||
      // highest density of match (least term inter-fuzz)
      u[b] - u[E] || // earliest start of match
      y[b] - y[E] || // case match
      v[E] - v[b] || // alphabetic
      l(t[a[b]], t[a[E]])
    ));
  }
}, Ye = (e, t) => t == 0 ? "" : t == 1 ? e + "??" : t == Ze ? e + "*?" : e + `{0,${t}}?`, dt = "(?:\\b|_)";
function ze(e) {
  e = Object.assign({}, ct, e);
  let {
    unicode: t,
    interLft: r,
    interRgt: l,
    intraMode: a,
    intraSlice: n,
    intraIns: i,
    intraSub: s,
    intraTrn: o,
    intraDel: y,
    intraContr: c,
    intraSplit: u,
    interSplit: v,
    intraBound: b,
    interBound: E,
    intraChars: T,
    toUpper: P,
    toLower: z,
    compare: L
  } = e;
  i ?? (i = a), s ?? (s = a), o ?? (o = a), y ?? (y = a), L ?? (L = typeof Intl > "u" ? gt : new Intl.Collator(...Nt).compare);
  let G = e.letters ?? e.alpha;
  if (G != null) {
    let f = P(G), S = z(G);
    v = Ce(v, f, S), u = Ce(u, f, S), E = Ce(E, f, S), b = Ce(b, f, S), T = Ce(T, f, S), c = Ce(c, f, S);
  }
  let d = t ? "u" : "";
  const g = '".+?"', p = new RegExp(g, "gi" + d), H = new RegExp(`(?:\\s+|^)-(?:${T}+|${g})`, "gi" + d);
  let { intraRules: h } = e;
  h == null && (h = (f) => {
    let S = ct.intraSlice, R = 0, q = 0, w = 0, $ = 0;
    if (/[^\d]/.test(f)) {
      let j = f.length;
      j <= 4 ? j >= 3 && (w = Math.min(o, 1), j == 4 && (R = Math.min(i, 1))) : (S = n, R = i, q = s, w = o, $ = y);
    }
    return {
      intraSlice: S,
      intraIns: R,
      intraSub: q,
      intraTrn: w,
      intraDel: $
    };
  });
  let X = !!u, B = new RegExp(u, "g" + d), Y = new RegExp(v, "g" + d), ce = new RegExp("^" + v + "|" + v + "$", "g" + d), ye = new RegExp(c, "gi" + d);
  const le = (f, S = false) => {
    let R = [];
    f = f.replace(p, (w) => (R.push(w), at)), f = f.replace(ce, ""), S || (f = z(f)), X && (f = f.replace(B, (w) => w[0] + " " + w[1]));
    let q = 0;
    return f.split(Y).filter((w) => w != "").map((w) => w === at ? R[q++] : w);
  }, bt = /[^\d]+|\d+/g, Ke = (f, S = 0, R = false) => {
    let q = le(f);
    if (q.length == 0)
      return [];
    let w = Array(q.length).fill("");
    q = q.map((J, Q) => J.replace(ye, (Z) => (w[Q] = Z, "")));
    let $;
    if (a == 1)
      $ = q.map((J, Q) => {
        if (J[0] === '"')
          return Xe(J.slice(1, -1));
        let Z = "";
        for (let V of J.matchAll(bt)) {
          let m = V[0], {
            intraSlice: I,
            intraIns: D,
            intraSub: k,
            intraTrn: M,
            intraDel: C
          } = h(m);
          if (D + k + M + C == 0)
            Z += m + w[Q];
          else {
            let [te, F] = I, re = m.slice(0, te), pe = m.slice(F), W = m.slice(te, F);
            D == 1 && re.length == 1 && re != W[0] && (re += "(?!" + re + ")");
            let xe = W.length, ve = [m];
            if (k)
              for (let K = 0; K < xe; K++)
                ve.push(re + W.slice(0, K) + T + W.slice(K + 1) + pe);
            if (M)
              for (let K = 0; K < xe - 1; K++)
                W[K] != W[K + 1] && ve.push(re + W.slice(0, K) + W[K + 1] + W[K] + W.slice(K + 2) + pe);
            if (C)
              for (let K = 0; K < xe; K++)
                ve.push(re + W.slice(0, K + 1) + "?" + W.slice(K + 1) + pe);
            if (D) {
              let K = Ye(T, 1);
              for (let be = 0; be < xe; be++)
                ve.push(re + W.slice(0, be) + K + W.slice(be) + pe);
            }
            Z += "(?:" + ve.join("|") + ")" + w[Q];
          }
        }
        return Z;
      });
    else {
      let J = Ye(T, i);
      S == 2 && i > 0 && (J = ")(" + J + ")("), $ = q.map((Q, Z) => Q[0] === '"' ? Xe(Q.slice(1, -1)) : Q.split("").map((V, m, I) => (i == 1 && m == 0 && I.length > 1 && V != I[m + 1] && (V += "(?!" + V + ")"), V)).join(J) + w[Z]);
    }
    let j = r == 2 ? dt : "", ae = l == 2 ? dt : "", de = ae + Ye(e.interChars, e.interIns) + j;
    return S > 0 ? R ? $ = j + "(" + $.join(")" + ae + "|" + j + "(") + ")" + ae : ($ = "(" + $.join(")(" + de + ")(") + ")", $ = "(.??" + j + ")" + $ + "(" + ae + ".*)") : ($ = $.join(de), $ = j + $ + ae), [new RegExp($, "i" + d), q, w];
  }, De = (f, S, R) => {
    let [q] = Ke(S);
    if (q == null)
      return null;
    let w = [];
    if (R != null)
      for (let $ = 0; $ < R.length; $++) {
        let j = R[$];
        q.test(f[j]) && w.push(j);
      }
    else
      for (let $ = 0; $ < f.length; $++)
        q.test(f[$]) && w.push($);
    return w;
  };
  let et = !!b, Ne = new RegExp(E, d), Oe = new RegExp(b, d);
  const tt = (f, S, R) => {
    let [q, w, $] = Ke(R, 1), j = le(R, true), [ae] = Ke(R, 2), de = w.length, J = Array(de), Q = Array(de);
    for (let k = 0; k < de; k++) {
      let M = w[k], C = j[k], te = M[0] == '"' ? M.slice(1, -1) : M + $[k], F = C[0] == '"' ? C.slice(1, -1) : C + $[k];
      J[k] = te, Q[k] = F;
    }
    let Z = f.length, V = Array(Z).fill(0), m = {
      // idx in haystack
      idx: Array(Z),
      // start of match
      start: V.slice(),
      // length of match
      //	span: field.slice(),
      // contiguous chars matched
      chars: V.slice(),
      // case matched in term (via term.includes(match))
      cases: V.slice(),
      // contiguous (no fuzz) and bounded terms (intra=0, lft2/1, rgt2/1)
      // excludes terms that are contiguous but have < 2 bounds (substrings)
      terms: V.slice(),
      // cumulative length of unmatched chars (fuzz) within span
      interIns: V.slice(),
      // between terms
      intraIns: V.slice(),
      // within terms
      // interLft/interRgt counters
      interLft2: V.slice(),
      interRgt2: V.slice(),
      interLft1: V.slice(),
      interRgt1: V.slice(),
      ranges: Array(Z)
    }, I = r == 1 || l == 1, D = 0;
    for (let k = 0; k < f.length; k++) {
      let M = S[f[k]], C = M.match(q), te = C.index + C[1].length, F = te, re = false, pe = 0, W = 0, xe = 0, ve = 0, K = 0, be = 0, rt = 0, nt = 0, lt = 0, Pe = [];
      for (let N = 0, U = 2; N < de; N++, U += 2) {
        let ge = z(C[U]), oe = J[N], Ge = Q[N], ie = oe.length, se = ge.length, ne = ge == oe;
        if (C[U] == Ge && rt++, !ne && C[U + 1].length >= ie) {
          let O = z(C[U + 1]).indexOf(oe);
          O > -1 && (Pe.push(F, se, O, ie), F += Ue(C, U, O, ie), ge = oe, se = ie, ne = true, N == 0 && (te = F));
        }
        if (I || ne) {
          let O = F - 1, fe = F + se, we = false, Le = false;
          if (O == -1 || Ne.test(M[O]))
            ne && pe++, we = true;
          else {
            if (r == 2) {
              re = true;
              break;
            }
            if (et && Oe.test(M[O] + M[O + 1]))
              ne && W++, we = true;
            else if (r == 1) {
              let He = C[U + 1], Se = F + se;
              if (He.length >= ie) {
                let $e = 0, _e = false, $t = new RegExp(oe, "ig" + d), ot;
                for (; ot = $t.exec(He); ) {
                  $e = ot.index;
                  let it = Se + $e, Ve = it - 1;
                  if (Ve == -1 || Ne.test(M[Ve])) {
                    pe++, _e = true;
                    break;
                  } else if (Oe.test(M[Ve] + M[it])) {
                    W++, _e = true;
                    break;
                  }
                }
                _e && (we = true, Pe.push(F, se, $e, ie), F += Ue(C, U, $e, ie), ge = oe, se = ie, ne = true, N == 0 && (te = F));
              }
              if (!we) {
                re = true;
                break;
              }
            }
          }
          if (fe == M.length || Ne.test(M[fe]))
            ne && xe++, Le = true;
          else {
            if (l == 2) {
              re = true;
              break;
            }
            if (et && Oe.test(M[fe - 1] + M[fe]))
              ne && ve++, Le = true;
            else if (l == 1) {
              re = true;
              break;
            }
          }
          ne && (K += ie, we && Le && be++);
        }
        if (se > ie && (lt += se - ie), N > 0 && (nt += C[U - 1].length), !e.intraFilt(oe, ge, F)) {
          re = true;
          break;
        }
        N < de - 1 && (F += se + C[U + 1].length);
      }
      if (!re) {
        m.idx[D] = f[k], m.interLft2[D] = pe, m.interLft1[D] = W, m.interRgt2[D] = xe, m.interRgt1[D] = ve, m.chars[D] = K, m.terms[D] = be, m.cases[D] = rt, m.interIns[D] = nt, m.intraIns[D] = lt, m.start[D] = te;
        let N = M.match(ae), U = N.index + N[1].length, ge = Pe.length, oe = ge > 0 ? 0 : 1 / 0, Ge = ge - 4;
        for (let O = 2; O < N.length; ) {
          let fe = N[O].length;
          if (oe <= Ge && Pe[oe] == U) {
            let we = Pe[oe + 1], Le = Pe[oe + 2], He = Pe[oe + 3], Se = O, $e = "";
            for (let _e = 0; _e < we; Se++)
              $e += N[Se], _e += N[Se].length;
            N.splice(O, Se - O, $e), U += Ue(N, O, Le, He), oe += 4;
          } else
            U += fe, O++;
        }
        U = N.index + N[1].length;
        let ie = m.ranges[D] = [], se = U, ne = U;
        for (let O = 2; O < N.length; O++) {
          let fe = N[O].length;
          U += fe, O % 2 == 0 ? ne = U : fe > 0 && (ie.push(se, ne), se = ne = U);
        }
        ne > se && ie.push(se, ne), D++;
      }
    }
    if (D < f.length)
      for (let k in m)
        m[k] = m[k].slice(0, D);
    return m;
  }, Ue = (f, S, R, q) => {
    let w = f[S] + f[S + 1].slice(0, R);
    return f[S - 1] += w, f[S] = f[S + 1].slice(R, R + q), f[S + 1] = f[S + 1].slice(R + q), w.length;
  }, Pt = 5, wt = (f, S, R, q = 1e3, w) => {
    R = R ? R === true ? Pt : R : 0;
    let $ = null, j = null, ae = [];
    S = S.replace(H, (m) => {
      let I = m.trim().slice(1);
      return I = I[0] === '"' ? Xe(I.slice(1, -1)) : I.replace(Bt, ""), I != "" && ae.push(I), "";
    });
    let de = le(S), J;
    if (ae.length > 0) {
      if (J = new RegExp(ae.join("|"), "i" + d), de.length == 0) {
        let m = [];
        for (let I = 0; I < f.length; I++)
          J.test(f[I]) || m.push(I);
        return [m, null, null];
      }
    } else if (de.length == 0)
      return [null, null, null];
    if (R > 0) {
      let m = le(S);
      if (m.length > 1) {
        let I = m.slice().sort((k, M) => M.length - k.length);
        for (let k = 0; k < I.length; k++) {
          if ((w == null ? void 0 : w.length) == 0)
            return [[], null, null];
          w = De(f, I[k], w);
        }
        if (m.length > R)
          return [w, null, null];
        $ = mt(m).map((k) => k.join(" ")), j = [];
        let D = /* @__PURE__ */ new Set();
        for (let k = 0; k < $.length; k++)
          if (D.size < w.length) {
            let M = w.filter((te) => !D.has(te)), C = De(f, $[k], M);
            for (let te = 0; te < C.length; te++)
              D.add(C[te]);
            j.push(C);
          } else
            j.push([]);
      }
    }
    $ == null && ($ = [S], j = [(w == null ? void 0 : w.length) > 0 ? w : De(f, S)]);
    let Q = null, Z = null;
    if (ae.length > 0 && (j = j.map((m) => m.filter((I) => !J.test(f[I])))), j.reduce((m, I) => m + I.length, 0) <= q) {
      Q = {}, Z = [];
      for (let m = 0; m < j.length; m++) {
        let I = j[m];
        if (I == null || I.length == 0)
          continue;
        let D = $[m], k = tt(I, f, D), M = e.sort(k, f, D, L);
        if (m > 0)
          for (let C = 0; C < M.length; C++)
            M[C] += Z.length;
        for (let C in k)
          Q[C] = (Q[C] ?? []).concat(k[C]);
        Z = Z.concat(M);
      }
    }
    return [
      [].concat(...j),
      Q,
      Z
    ];
  };
  return {
    search: (...f) => wt(...f),
    split: le,
    filter: De,
    info: tt,
    sort: e.sort
  };
}
const Ot = (() => {
  let e = {
    A: "ÁÀÃÂÄĄĂÅ",
    a: "áàãâäąăå",
    E: "ÉÈÊËĖĚ",
    e: "éèêëęě",
    I: "ÍÌÎÏĮİ",
    i: "íìîïįı",
    O: "ÓÒÔÕÖ",
    o: "óòôõö",
    U: "ÚÙÛÜŪŲŮŰ",
    u: "úùûüūųůű",
    C: "ÇČĆ",
    c: "çčć",
    D: "Ď",
    d: "ď",
    G: "Ğ",
    g: "ğ",
    L: "Ł",
    l: "ł",
    N: "ÑŃŇ",
    n: "ñńň",
    S: "ŠŚȘŞ",
    s: "šśșş",
    T: "ŢȚŤ",
    t: "ţțť",
    Y: "Ý",
    y: "ý",
    Z: "ŻŹŽ",
    z: "żźž"
  }, t = {}, r = "";
  for (let n in e)
    e[n].split("").forEach((i) => {
      r += i, t[i] = n;
    });
  let l = new RegExp(`[${r}]`, "g"), a = (n) => t[n];
  return (n) => {
    if (typeof n == "string")
      return n.replace(l, a);
    let i = Array(n.length);
    for (let s = 0; s < n.length; s++)
      i[s] = n[s].replace(l, a);
    return i;
  };
})();
function mt(e) {
  e = e.slice();
  let t = e.length, r = [e.slice()], l = new Array(t).fill(0), a = 1, n, i;
  for (; a < t; )
    l[a] < a ? (n = a % 2 && l[a], i = e[a], e[a] = e[n], e[n] = i, ++l[a], a = 1, r.push(e.slice())) : (l[a] = 0, ++a);
  return r;
}
const Ut = (e, t) => t ? `<mark>${e}</mark>` : e, Gt = (e, t) => e + t;
function Vt(e, t, r = Ut, l = "", a = Gt) {
  l = a(l, r(e.substring(0, t[0]), false)) ?? l;
  for (let n = 0; n < t.length; n += 2) {
    let i = t[n], s = t[n + 1];
    l = a(l, r(e.substring(i, s), true)) ?? l, n < t.length - 3 && (l = a(l, r(e.substring(t[n + 1], t[n + 2]), false)) ?? l);
  }
  return l = a(l, r(e.substring(t[t.length - 1]), false)) ?? l, l;
}
ze.latinize = Ot;
ze.permute = (e) => mt([...Array(e.length).keys()]).sort((r, l) => {
  for (let a = 0; a < r.length; a++)
    if (r[a] != l[a])
      return r[a] - l[a];
  return 0;
}).map((r) => r.map((l) => e[l]));
ze.highlight = Vt;
const Wt = new ze({ intraMode: 1 });
function Fe(e, t, r, l, a) {
  for (const [n, i] of Object.entries(e))
    if (i.type === "directory")
      Fe(
        i.children,
        [...t, n],
        [...r, i.label],
        l,
        a
      );
    else {
      const s = r.length > 0 ? `${r.join(" > ")} > ${i.label}` : i.label;
      l.push(s), a.push({
        item: i,
        key: n,
        path: [...t, n],
        pathLabels: [...r],
        score: 0,
        ranges: []
      });
    }
}
function Xt(e) {
  const t = [], r = [];
  return Fe(e, [], [], t, r), { haystack: t, items: r };
}
function ut(e, t) {
  if (!t.trim()) return [];
  const [r, l, a] = Wt.search(e.haystack, t);
  return !r || !l || !a ? [] : a.map((n) => {
    const i = r[n];
    ze.highlight(
      e.haystack[i],
      l.ranges[n],
      (c) => c
    );
    const s = e.items[i], o = l.ranges[n], y = [];
    for (let c = 0; c < o.length; c += 2)
      y.push([o[c], o[c + 1]]);
    return {
      ...s,
      score: l.idx[n],
      ranges: y
    };
  });
}
function Yt(e, t, r, l) {
  const a = [...e.haystack], n = [...e.items];
  return Fe(t, r, l, a, n), { haystack: a, items: n };
}
function Zt(e, t, r) {
  function l(a, n, i, s) {
    return {
      type: "input",
      label: a,
      inputType: n,
      options: s == null ? void 0 : s.options,
      storageKey: `${e}.meta.${i}`,
      onChange: (o) => {
        Qe(e, "meta", i, o), s != null && s.onChange && s.onChange(o), Dt(t, { [i]: o });
      }
    };
  }
  return {
    type: "directory",
    label: "Settings",
    children: {
      theme: l("Theme", "select", "theme", {
        options: ["system", "light", "dark"]
      }),
      mode: l("Default Mode", "select", "mode", {
        options: ["palette", "dir"]
      }),
      "palette-pin": l("Palette Pin", "select", "palettePin", {
        options: ["top", "middle", "bottom"]
      }),
      "remember-mode": l("Remember Last Mode", "checkbox", "rememberLastMode"),
      "global-key": l("Global Shortcut", "text", "globalShortcut", {
        onChange: (a) => {
          r.updateShortcut("global-toggle", a);
        }
      }),
      "swap-key": l("Mode Swap Shortcut", "text", "modeSwapShortcut", {
        onChange: (a) => {
          r.updateShortcut("mode-swap", a);
        }
      })
    }
  };
}
const [Ae, Nr] = solidJs.createSignal(false);
var Jt = /* @__PURE__ */ web.template("<div class=result-path>"), Qt = /* @__PURE__ */ web.template("<div role=option><span class=result-label>"), Ft = /* @__PURE__ */ web.template("<mark class=result-highlight>"), er = /* @__PURE__ */ web.template("<span>");
function tr(e, t) {
  const r = [];
  let l = 0;
  for (const [a, n] of t)
    a > l && r.push({
      text: e.slice(l, a),
      highlighted: false
    }), r.push({
      text: e.slice(a, n),
      highlighted: true
    }), l = n;
  return l < e.length && r.push({
    text: e.slice(l),
    highlighted: false
  }), r;
}
function rr(e) {
  const t = () => e.result.item, r = () => "label" in t() ? t().label : "", l = () => e.result.pathLabels.length > 0 ? e.result.pathLabels.join(" › ") : null, a = () => e.result.ranges.length > 0 ? tr(r(), e.result.ranges) : [{
    text: r(),
    highlighted: false
  }];
  return (() => {
    var n = Qt(), i = n.firstChild;
    return web.addEventListener(n, "click", e.onActivate, true), n.style.setProperty("padding", "8px 14px"), n.style.setProperty("cursor", "pointer"), web.insert(n, web.createComponent(solidJs.Show, {
      get when() {
        return l();
      },
      get children() {
        var s = Jt();
        return s.style.setProperty("font-size", "11px"), s.style.setProperty("color", "var(--rove-text-dim)"), s.style.setProperty("margin-bottom", "2px"), web.insert(s, l), s;
      }
    }), i), web.insert(i, web.createComponent(solidJs.For, {
      get each() {
        return a();
      },
      children: (s) => s.highlighted ? (() => {
        var o = Ft();
        return o.style.setProperty("background", "var(--rove-accent)"), o.style.setProperty("color", "var(--rove-bg)"), o.style.setProperty("border-radius", "2px"), o.style.setProperty("padding", "0 1px"), web.insert(o, () => s.text), o;
      })() : (() => {
        var o = er();
        return web.insert(o, () => s.text), o;
      })()
    })), web.effect((s) => {
      var o = `palette-result${e.selected ? " palette-result--selected" : ""}`, y = e.selected, c = e.selected ? "var(--rove-selected)" : "transparent";
      return o !== s.e && web.className(n, s.e = o), y !== s.t && web.setAttribute(n, "aria-selected", s.t = y), c !== s.a && ((s.a = c) != null ? n.style.setProperty("background", c) : n.style.removeProperty("background")), s;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), n;
  })();
}
web.delegateEvents(["click"]);
var nr = /* @__PURE__ */ web.template("<div>P[<!>] v.vis=<!> v.mode=<!> memo="), lr = /* @__PURE__ */ web.template("<div>DEBUG: palette mounted [<!>] pin="), or = /* @__PURE__ */ web.template('<div class=palette-container role=combobox aria-haspopup=listbox><div class=palette-input-row><input type=text class=palette-input placeholder=Search… aria-autocomplete=list aria-controls=palette-results><button class=palette-mode-btn aria-label="Switch to directory view"title="Switch to directory view">☰</button></div><div role=status aria-live=polite aria-atomic=true></div><div id=palette-results role=listbox>');
function ir(e) {
  let t, r;
  solidJs.createEffect(() => {
    s() && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    const o = e.state.palette.query, y = o ? ut(e.getIndex(), o) : [];
    e.set("palette", (c) => ({
      ...c,
      results: y,
      selectedIndex: 0
    }));
  });
  function l(o) {
    e.set("palette", "query", o.target.value);
  }
  function a(o) {
    const {
      results: y,
      selectedIndex: c
    } = e.state.palette;
    if (o.key === "ArrowDown")
      o.preventDefault(), e.set("palette", "selectedIndex", Math.min(c + 1, y.length - 1));
    else if (o.key === "ArrowUp")
      o.preventDefault(), e.set("palette", "selectedIndex", Math.max(c - 1, 0));
    else if (o.key === "Enter") {
      o.preventDefault();
      const u = y[c];
      u && n(u);
    } else o.key === "Escape" && (o.preventDefault(), e.state.palette.query ? e.set("palette", "query", "") : e.set("visible", false));
  }
  function n(o) {
    const y = o.item;
    if (y.type === "action")
      y.action(), e.set("palette", (c) => ({
        ...c,
        query: "",
        results: [],
        selectedIndex: 0
      }));
    else if (y.type === "input") {
      const c = he(e.keyPrefix, "input", o.path.join(".")), u = c !== null ? {
        ...y,
        defaultValue: c
      } : y;
      e.set("palette", "overlay", {
        type: "input",
        item: u,
        nodeKey: o.key,
        nodePath: o.path
      });
    } else if (y.type === "virtual") {
      let c = false;
      const u = () => {
        c = true;
      };
      e.set("palette", "overlay", {
        type: "loading",
        item: y,
        nodeKey: o.key,
        cancel: u
      }), y.load().then((v) => {
        const b = Yt(e.getIndex(), v, o.path, o.pathLabels);
        e.setIndex(b), c || e.set("palette", "overlay", null);
        const E = e.state.palette.query;
        if (E) {
          const T = ut(b, E);
          e.set("palette", (P) => ({
            ...P,
            results: T
          }));
        }
      }).catch((v) => {
        e.set("palette", "overlay", {
          type: "error",
          message: v instanceof Error ? v.message : "Load failed."
        });
      });
    }
  }
  const i = () => e.state.meta.palettePin, s = solidJs.createMemo(() => e.state.visible && e.state.mode === "palette");
  return solidJs.createEffect(() => {
    if (!Ae()) return;
    const o = s();
    console.log(`[Rove:Palette:${e.keyPrefix}] visible=${o} (state.visible=${e.state.visible} state.mode=${e.state.mode})`);
  }), [web.createComponent(solidJs.Show, {
    get when() {
      return Ae();
    },
    get children() {
      var o = nr(), y = o.firstChild, c = y.nextSibling, u = c.nextSibling, v = u.nextSibling, b = v.nextSibling, E = b.nextSibling;
      return E.nextSibling, o.style.setProperty("position", "fixed"), o.style.setProperty("top", "8px"), o.style.setProperty("color", "#fff"), o.style.setProperty("font-size", "10px"), o.style.setProperty("font-family", "monospace"), o.style.setProperty("padding", "3px 10px"), o.style.setProperty("border-radius", "20px"), o.style.setProperty("z-index", "99999999"), o.style.setProperty("pointer-events", "none"), o.style.setProperty("line-height", "1.6"), web.insert(o, () => e.keyPrefix, c), web.insert(o, () => String(e.state.visible), v), web.insert(o, () => e.state.mode, E), web.insert(o, () => String(s()), null), web.effect((T) => {
        var P = e.keyPrefix.length <= 4 ? "8px" : "auto", z = e.keyPrefix.length <= 4 ? "auto" : "8px", L = s() ? "#00c853" : "#c62828";
        return P !== T.e && ((T.e = P) != null ? o.style.setProperty("left", P) : o.style.removeProperty("left")), z !== T.t && ((T.t = z) != null ? o.style.setProperty("right", z) : o.style.removeProperty("right")), L !== T.a && ((T.a = L) != null ? o.style.setProperty("background", L) : o.style.removeProperty("background")), T;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      }), o;
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return s();
    },
    get children() {
      var o = or(), y = o.firstChild, c = y.firstChild, u = c.nextSibling, v = y.nextSibling, b = v.nextSibling;
      o.style.setProperty("position", "fixed"), o.style.setProperty("left", "50%"), o.style.setProperty("width", "50vw"), o.style.setProperty("max-width", "700px"), o.style.setProperty("min-width", "300px"), o.style.setProperty("z-index", "var(--rove-z-index)"), o.style.setProperty("background", "var(--rove-bg)"), o.style.setProperty("border", "1px solid var(--rove-border)"), o.style.setProperty("border-radius", "var(--rove-border-radius)"), o.style.setProperty("box-shadow", "var(--rove-shadow)"), web.setAttribute(o, "aria-expanded", true), web.insert(o, web.createComponent(solidJs.Show, {
        get when() {
          return Ae();
        },
        get children() {
          var P = lr(), z = P.firstChild, L = z.nextSibling;
          return L.nextSibling, P.style.setProperty("background", "red"), P.style.setProperty("color", "white"), P.style.setProperty("font-size", "10px"), P.style.setProperty("padding", "2px 6px"), P.style.setProperty("font-family", "monospace"), web.insert(P, () => e.keyPrefix, L), web.insert(P, i, null), P;
        }
      }), y), y.style.setProperty("display", "flex"), y.style.setProperty("align-items", "center"), c.$$keydown = a, c.$$input = l;
      var E = t;
      typeof E == "function" ? web.use(E, c) : t = c, c.style.setProperty("flex", "1"), c.style.setProperty("padding", "10px 14px"), c.style.setProperty("border", "none"), c.style.setProperty("background", "transparent"), c.style.setProperty("color", "var(--rove-text)"), c.style.setProperty("font-size", "16px"), c.style.setProperty("outline", "none"), c.style.setProperty("min-width", "0"), u.$$click = () => e.set("mode", "dir"), u.style.setProperty("background", "none"), u.style.setProperty("border", "none"), u.style.setProperty("border-left", "1px solid var(--rove-border)"), u.style.setProperty("cursor", "pointer"), u.style.setProperty("color", "var(--rove-text-dim)"), u.style.setProperty("padding", "0 14px"), u.style.setProperty("font-size", "15px"), u.style.setProperty("line-height", "1"), u.style.setProperty("align-self", "stretch"), u.style.setProperty("display", "flex"), u.style.setProperty("align-items", "center");
      var T = r;
      return typeof T == "function" ? web.use(T, v) : r = v, v.style.setProperty("position", "absolute"), v.style.setProperty("width", "1px"), v.style.setProperty("height", "1px"), v.style.setProperty("overflow", "hidden"), v.style.setProperty("clip", "rect(0,0,0,0)"), v.style.setProperty("white-space", "nowrap"), web.insert(v, () => e.state.palette.results.length > 0 ? `${e.state.palette.results.length} results` : e.state.palette.query ? "No results" : ""), b.style.setProperty("max-height", "50vh"), b.style.setProperty("overflow-y", "auto"), web.insert(b, web.createComponent(solidJs.For, {
        get each() {
          return e.state.palette.results;
        },
        children: (P, z) => web.createComponent(rr, {
          result: P,
          get selected() {
            return z() === e.state.palette.selectedIndex;
          },
          onActivate: () => n(P)
        })
      })), web.effect((P) => {
        var z = i() === "top" ? "0" : i() === "middle" ? "50%" : "auto", L = i() === "bottom" ? "0" : "auto", G = i() === "middle" ? "translate(-50%, -50%)" : "translateX(-50%)", d = e.state.palette.results.length > 0 ? "1px solid var(--rove-border)" : "none";
        return z !== P.e && ((P.e = z) != null ? o.style.setProperty("top", z) : o.style.removeProperty("top")), L !== P.t && ((P.t = L) != null ? o.style.setProperty("bottom", L) : o.style.removeProperty("bottom")), G !== P.a && ((P.a = G) != null ? o.style.setProperty("transform", G) : o.style.removeProperty("transform")), d !== P.o && ((P.o = d) != null ? b.style.setProperty("border-top", d) : b.style.removeProperty("border-top")), P;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), web.effect(() => c.value = e.state.palette.query), o;
    }
  })];
}
web.delegateEvents(["input", "keydown", "click"]);
var sr = /* @__PURE__ */ web.template('<div class=titlebar role=toolbar><button class=titlebar-btn aria-label="Go back">←</button><span class=titlebar-title></span><button class=titlebar-btn aria-label="Switch to palette view"title="Switch to palette view">⌕</button><button class=titlebar-btn aria-label="Reset window position"title="Reset position">□</button><button class=titlebar-btn aria-label=Close>×');
function ar(e) {
  return (() => {
    var t = sr(), r = t.firstChild, l = r.nextSibling, a = l.nextSibling, n = a.nextSibling, i = n.nextSibling;
    return web.addEventListener(t, "mousedown", e.onDragStart, true), t.style.setProperty("display", "flex"), t.style.setProperty("align-items", "center"), t.style.setProperty("padding", "6px 8px"), t.style.setProperty("background", "var(--rove-surface)"), t.style.setProperty("border-bottom", "1px solid var(--rove-border)"), t.style.setProperty("cursor", "move"), t.style.setProperty("user-select", "none"), t.style.setProperty("gap", "6px"), r.$$mousedown = (s) => s.stopPropagation(), r.$$click = (s) => {
      s.stopPropagation(), e.onBack();
    }, r.style.setProperty("background", "none"), r.style.setProperty("border", "none"), r.style.setProperty("font-size", "14px"), r.style.setProperty("padding", "2px 6px"), l.style.setProperty("flex", "1"), l.style.setProperty("text-align", "center"), l.style.setProperty("overflow", "hidden"), l.style.setProperty("text-overflow", "ellipsis"), l.style.setProperty("white-space", "nowrap"), l.style.setProperty("font-weight", "500"), l.style.setProperty("font-size", "13px"), l.style.setProperty("color", "var(--rove-text)"), web.insert(l, () => e.title), a.$$mousedown = (s) => s.stopPropagation(), a.$$click = (s) => {
      s.stopPropagation(), e.onModeSwap();
    }, a.style.setProperty("background", "none"), a.style.setProperty("border", "none"), a.style.setProperty("cursor", "pointer"), a.style.setProperty("color", "var(--rove-text-dim)"), a.style.setProperty("font-size", "14px"), a.style.setProperty("padding", "2px 6px"), n.$$mousedown = (s) => s.stopPropagation(), n.$$click = (s) => {
      s.stopPropagation(), e.onReset();
    }, n.style.setProperty("background", "none"), n.style.setProperty("border", "none"), n.style.setProperty("cursor", "pointer"), n.style.setProperty("color", "var(--rove-text-dim)"), n.style.setProperty("font-size", "12px"), n.style.setProperty("padding", "2px 6px"), i.$$mousedown = (s) => s.stopPropagation(), i.$$click = (s) => {
      s.stopPropagation(), e.onClose();
    }, i.style.setProperty("background", "none"), i.style.setProperty("border", "none"), i.style.setProperty("cursor", "pointer"), i.style.setProperty("color", "var(--rove-text-dim)"), i.style.setProperty("font-size", "16px"), i.style.setProperty("padding", "2px 6px"), web.effect((s) => {
      var o = !e.canGoBack, y = e.canGoBack ? "pointer" : "default", c = e.canGoBack ? "var(--rove-text)" : "var(--rove-text-dim)";
      return o !== s.e && (r.disabled = s.e = o), y !== s.t && ((s.t = y) != null ? r.style.setProperty("cursor", y) : r.style.removeProperty("cursor")), c !== s.a && ((s.a = c) != null ? r.style.setProperty("color", c) : r.style.removeProperty("color")), s;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), t;
  })();
}
web.delegateEvents(["mousedown", "click"]);
var cr = /* @__PURE__ */ web.template('<nav class=breadcrumbs aria-label="Directory path">'), dr = /* @__PURE__ */ web.template("<span>/"), ur = /* @__PURE__ */ web.template("<button>"), yr = /* @__PURE__ */ web.template("<span>…");
function fr(e) {
  const t = () => {
    const r = ["🏠", ...e.pathLabels];
    return r.length > 3 ? [{
      label: "🏠",
      index: -1
    }, {
      label: "…",
      index: -2
    }, {
      label: r[r.length - 2],
      index: e.pathLabels.length - 2
    }, {
      label: r[r.length - 1],
      index: e.pathLabels.length - 1
    }] : r.map((l, a) => ({
      label: l,
      index: a - 1
    }));
  };
  return (() => {
    var r = cr();
    return r.style.setProperty("display", "flex"), r.style.setProperty("align-items", "center"), r.style.setProperty("gap", "2px"), r.style.setProperty("padding", "4px 8px"), r.style.setProperty("font-size", "11px"), r.style.setProperty("color", "var(--rove-text-dim)"), r.style.setProperty("border-bottom", "1px solid var(--rove-border)"), r.style.setProperty("flex-wrap", "wrap"), web.insert(r, web.createComponent(solidJs.For, {
      get each() {
        return t();
      },
      children: (l, a) => [web.createComponent(solidJs.Show, {
        get when() {
          return a() > 0;
        },
        get children() {
          var n = dr();
          return n.style.setProperty("color", "var(--rove-text-dim)"), n;
        }
      }), web.createComponent(solidJs.Show, {
        get when() {
          return l.index !== -2;
        },
        get fallback() {
          return (() => {
            var n = yr();
            return n.style.setProperty("color", "var(--rove-text-dim)"), n;
          })();
        },
        get children() {
          var n = ur();
          return n.$$click = () => e.onNavigateTo(l.index), n.style.setProperty("background", "none"), n.style.setProperty("border", "none"), n.style.setProperty("cursor", "pointer"), n.style.setProperty("color", "var(--rove-accent)"), n.style.setProperty("font-size", "inherit"), n.style.setProperty("padding", "0 2px"), n.style.setProperty("text-decoration", "underline"), web.insert(n, () => l.label), n;
        }
      })]
    })), r;
  })();
}
web.delegateEvents(["click"]);
var hr = /* @__PURE__ */ web.template("<div class=dirview-pagination>/"), pr = /* @__PURE__ */ web.template('<div class=dirview-container role=navigation aria-label="Directory navigator"tabindex=0><div role=listbox class=dirview-items></div><div class=dirview-resize>'), vr = /* @__PURE__ */ web.template("<span>→"), gr = /* @__PURE__ */ web.template("<div class=dirview-item role=option><span class=dirview-item-num>.</span><span class=dirview-item-label>");
const Ie = 9, mr = 200, xr = 150;
function je(e, t) {
  let r = e;
  for (const l of t) {
    const a = r[l];
    if ((a == null ? void 0 : a.type) === "directory")
      r = a.children;
    else
      break;
  }
  return r;
}
function br(e) {
  let t, r = false, l = false, a = 0, n = 0;
  solidJs.onMount(() => {
    const d = he(e.keyPrefix, "window", "state");
    d && e.set("window", d);
  }), solidJs.createEffect(() => {
    const d = e.state.window;
    Qe(e.keyPrefix, "window", "state", d);
  });
  const i = solidJs.createMemo(() => {
    const d = e.state.nav.currentNode;
    return Object.entries(d).map(([g, p]) => ({
      key: g,
      item: p
    }));
  }), s = solidJs.createMemo(() => Math.max(1, Math.ceil(i().length / Ie))), o = solidJs.createMemo(() => {
    const g = (e.state.nav.page - 1) * Ie;
    return i().slice(g, g + Ie);
  });
  solidJs.createEffect(() => {
    const d = s();
    e.state.nav.totalPages !== d && e.set("nav", "totalPages", d);
  });
  function y(d, g) {
    const p = [...e.state.nav.path, d];
    e.set("nav", {
      path: p,
      currentNode: g,
      page: 1,
      totalPages: Math.max(1, Math.ceil(Object.keys(g).length / Ie))
    });
  }
  function c() {
    const d = e.state.nav.path;
    if (d.length === 0) return;
    const g = d.slice(0, -1), p = je(e.rootTree, g);
    e.set("nav", {
      path: g,
      currentNode: p,
      page: 1,
      totalPages: Math.max(1, Math.ceil(Object.keys(p).length / Ie))
    });
  }
  function u(d) {
    const g = d === -1 ? [] : e.state.nav.path.slice(0, d + 1), p = je(e.rootTree, g);
    e.set("nav", {
      path: g,
      currentNode: p,
      page: 1,
      totalPages: Math.max(1, Math.ceil(Object.keys(p).length / Ie))
    });
  }
  function v(d) {
    const {
      key: g,
      item: p
    } = d;
    if (p.type === "directory")
      y(g, p.children);
    else if (p.type === "action")
      p.action();
    else if (p.type === "input") {
      const H = he(e.keyPrefix, "input", [...e.state.nav.path, g].join(".")), h = H !== null ? {
        ...p,
        defaultValue: H
      } : p;
      e.set("palette", "overlay", {
        type: "input",
        item: h,
        nodeKey: g,
        nodePath: [...e.state.nav.path, g]
      });
    } else if (p.type === "virtual") {
      let H = false;
      e.set("palette", "overlay", {
        type: "loading",
        item: p,
        nodeKey: g,
        cancel: () => {
          H = true;
        }
      }), p.load().then((h) => {
        H || (e.set("palette", "overlay", null), y(g, h));
      }).catch((h) => {
        e.set("palette", "overlay", {
          type: "error",
          message: h instanceof Error ? h.message : "Load failed."
        });
      });
    }
  }
  function b(d) {
    if (e.state.mode !== "dir" || !e.state.visible) return;
    if (d.key === "Escape") {
      d.preventDefault(), e.set("visible", false);
      return;
    }
    if (d.key === "Backspace") {
      d.preventDefault(), c();
      return;
    }
    const g = parseInt(d.key);
    if (g >= 1 && g <= 9) {
      d.preventDefault();
      const p = e.state.nav.page, H = s();
      if (g === 1 && p > 1) {
        e.set("nav", "page", p - 1);
        return;
      }
      if (g === 9 && p < H) {
        e.set("nav", "page", p + 1);
        return;
      }
      const h = g - 1, X = o();
      h < X.length && v(X[h]);
    }
  }
  function E(d) {
    if (!t) return;
    r = true;
    const g = t.getBoundingClientRect();
    a = d.clientX - g.left, n = d.clientY - g.top;
    const p = (h) => {
      if (!r) return;
      const X = h.clientX - a, B = h.clientY - n, Y = window.innerWidth - 50, ce = window.innerHeight - 50;
      e.set("window", (ye) => ({
        ...ye,
        x: Math.max(-ye.width + 50, Math.min(X, Y)),
        y: Math.max(0, Math.min(B, ce))
      }));
    }, H = () => {
      r = false, document.removeEventListener("mousemove", p), document.removeEventListener("mouseup", H);
    };
    document.addEventListener("mousemove", p), document.addEventListener("mouseup", H);
  }
  function T(d) {
    d.preventDefault(), d.stopPropagation(), l = true;
    const g = d.clientX, p = d.clientY, H = e.state.window.width, h = e.state.window.height, X = (Y) => {
      if (!l) return;
      const ce = Math.max(mr, H + (Y.clientX - g)), ye = Math.max(xr, h + (Y.clientY - p));
      e.set("window", (le) => ({
        ...le,
        width: ce,
        height: ye
      }));
    }, B = () => {
      l = false, document.removeEventListener("mousemove", X), document.removeEventListener("mouseup", B);
    };
    document.addEventListener("mousemove", X), document.addEventListener("mouseup", B);
  }
  function P() {
    e.set("window", {
      x: Math.round(window.innerWidth * 0.375),
      y: Math.round(window.innerHeight * 0.375),
      width: Math.round(window.innerWidth * 0.25),
      height: Math.round(window.innerHeight * 0.25)
    });
  }
  const z = solidJs.createMemo(() => {
    const d = e.state.nav.path;
    if (d.length === 0) return "Root";
    const g = d.slice(0, -1), p = je(e.rootTree, g), H = d[d.length - 1], h = p[H];
    return (h == null ? void 0 : h.type) === "directory" ? h.label : H;
  }), L = solidJs.createMemo(() => e.state.nav.path.map((d, g) => {
    const H = je(e.rootTree, e.state.nav.path.slice(0, g))[d];
    return (H == null ? void 0 : H.type) === "directory" ? H.label : d;
  })), G = solidJs.createMemo(() => e.state.visible && e.state.mode === "dir");
  return solidJs.createEffect(() => {
    G() && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    if (!Ae()) return;
    const d = G();
    console.log(`[Rove:DirView:${e.keyPrefix}] visible=${d} (state.visible=${e.state.visible} state.mode=${e.state.mode})`);
  }), web.createComponent(solidJs.Show, {
    get when() {
      return G();
    },
    get children() {
      var d = pr(), g = d.firstChild, p = g.nextSibling;
      d.$$keydown = b;
      var H = t;
      return typeof H == "function" ? web.use(H, d) : t = d, d.style.setProperty("position", "fixed"), d.style.setProperty("z-index", "var(--rove-z-index)"), d.style.setProperty("background", "var(--rove-bg)"), d.style.setProperty("border", "1px solid var(--rove-border)"), d.style.setProperty("border-radius", "var(--rove-border-radius)"), d.style.setProperty("box-shadow", "var(--rove-shadow)"), d.style.setProperty("display", "flex"), d.style.setProperty("flex-direction", "column"), d.style.setProperty("overflow", "hidden"), d.style.setProperty("min-width", "200px"), d.style.setProperty("min-height", "150px"), web.insert(d, web.createComponent(ar, {
        get title() {
          return z();
        },
        get canGoBack() {
          return e.state.nav.path.length > 0;
        },
        onBack: c,
        onModeSwap: () => e.set("mode", "palette"),
        onClose: () => e.set("visible", false),
        onReset: P,
        onDragStart: E
      }), g), web.insert(d, web.createComponent(fr, {
        get pathLabels() {
          return L();
        },
        onNavigateTo: u
      }), g), g.style.setProperty("flex", "1"), g.style.setProperty("overflow-y", "auto"), g.style.setProperty("padding", "4px 0"), web.insert(g, web.createComponent(solidJs.For, {
        get each() {
          return o();
        },
        children: (h, X) => (() => {
          var B = gr(), Y = B.firstChild, ce = Y.firstChild, ye = Y.nextSibling;
          return B.addEventListener("mouseleave", (le) => le.currentTarget.style.background = ""), B.addEventListener("mouseenter", (le) => le.currentTarget.style.background = "var(--rove-hover)"), B.$$click = () => v(h), web.setAttribute(B, "aria-selected", false), B.style.setProperty("display", "flex"), B.style.setProperty("align-items", "center"), B.style.setProperty("gap", "8px"), B.style.setProperty("padding", "6px 12px"), B.style.setProperty("cursor", "pointer"), B.style.setProperty("color", "var(--rove-text)"), Y.style.setProperty("color", "var(--rove-text-dim)"), Y.style.setProperty("font-size", "11px"), Y.style.setProperty("min-width", "14px"), web.insert(Y, () => X() + 1, ce), ye.style.setProperty("flex", "1"), web.insert(ye, () => "label" in h.item ? h.item.label : h.key), web.insert(B, web.createComponent(solidJs.Show, {
            get when() {
              return h.item.type === "directory";
            },
            get children() {
              var le = vr();
              return le.style.setProperty("color", "var(--rove-text-dim)"), le;
            }
          }), null), B;
        })()
      })), web.insert(d, web.createComponent(solidJs.Show, {
        get when() {
          return s() > 1;
        },
        get children() {
          var h = hr(), X = h.firstChild;
          return h.style.setProperty("padding", "4px 12px"), h.style.setProperty("font-size", "11px"), h.style.setProperty("color", "var(--rove-text-dim)"), h.style.setProperty("border-top", "1px solid var(--rove-border)"), h.style.setProperty("text-align", "center"), web.insert(h, () => e.state.nav.page, X), web.insert(h, s, null), h;
        }
      }), p), p.$$mousedown = T, p.style.setProperty("position", "absolute"), p.style.setProperty("bottom", "0"), p.style.setProperty("right", "0"), p.style.setProperty("width", "12px"), p.style.setProperty("height", "12px"), p.style.setProperty("cursor", "se-resize"), p.style.setProperty("background", "var(--rove-text-dim)"), p.style.setProperty("clip-path", "polygon(100% 0, 100% 100%, 0 100%)"), p.style.setProperty("opacity", "0.4"), web.effect((h) => {
        var X = `${e.state.window.x}px`, B = `${e.state.window.y}px`, Y = `${e.state.window.width}px`, ce = `${e.state.window.height}px`;
        return X !== h.e && ((h.e = X) != null ? d.style.setProperty("left", X) : d.style.removeProperty("left")), B !== h.t && ((h.t = B) != null ? d.style.setProperty("top", B) : d.style.removeProperty("top")), Y !== h.a && ((h.a = Y) != null ? d.style.setProperty("width", Y) : d.style.removeProperty("width")), ce !== h.o && ((h.o = ce) != null ? d.style.setProperty("height", ce) : d.style.removeProperty("height")), h;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), d;
    }
  });
}
web.delegateEvents(["keydown", "mousedown", "click"]);
var Pr = /* @__PURE__ */ web.template("<div class=modal-loading><span>Loading…</span><button>Dismiss"), wr = /* @__PURE__ */ web.template("<div class=modal-error><p></p><button>Close"), $r = /* @__PURE__ */ web.template("<div class=modal-backdrop><div class=modal-sheet role=dialog aria-modal=true>"), kr = /* @__PURE__ */ web.template("<input type=text class=modal-input-field>"), Sr = /* @__PURE__ */ web.template('<textarea class="modal-input-field modal-textarea">'), _r = /* @__PURE__ */ web.template("<input type=checkbox class=modal-input-checkbox>"), Er = /* @__PURE__ */ web.template("<select class=modal-input-field>"), Cr = /* @__PURE__ */ web.template("<select multiple class=modal-input-field>"), Ir = /* @__PURE__ */ web.template('<div class=modal-input><label class=modal-label></label><div class=modal-actions><button class="modal-btn modal-btn--primary">Accept <kbd>Ctrl+Enter</kbd></button><button class=modal-btn>Cancel <kbd>Esc'), yt = /* @__PURE__ */ web.template("<option>");
function ft(e) {
  return Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((t) => !t.hasAttribute("disabled"));
}
function Tr(e) {
  let t, r = null;
  solidJs.onMount(() => {
    r = document.activeElement;
    const n = ft(t);
    n[0] && n[0].focus();
  }), solidJs.onCleanup(() => {
    r instanceof HTMLElement && r.focus();
  });
  function l(n) {
    var c;
    if (n.key !== "Tab") return;
    const i = ft(t);
    if (i.length === 0) return;
    const s = i[0], o = i[i.length - 1], y = (c = t.ownerDocument) == null ? void 0 : c.activeElement;
    n.shiftKey && y === s ? (n.preventDefault(), o.focus()) : !n.shiftKey && y === o && (n.preventDefault(), s.focus());
  }
  function a(n) {
    l(n), n.key === "Escape" && (n.preventDefault(), e.onCancel());
  }
  return (() => {
    var n = $r(), i = n.firstChild;
    web.addEventListener(n, "click", e.onCancel, true), n.style.setProperty("position", "fixed"), n.style.setProperty("inset", "0"), n.style.setProperty("background", "rgba(0,0,0,0.45)"), n.style.setProperty("z-index", "1000000"), n.style.setProperty("display", "flex"), n.style.setProperty("align-items", "center"), n.style.setProperty("justify-content", "center"), i.$$click = (o) => o.stopPropagation(), i.$$keydown = a;
    var s = t;
    return typeof s == "function" ? web.use(s, i) : t = i, i.style.setProperty("background", "var(--rove-bg)"), i.style.setProperty("border", "1px solid var(--rove-border)"), i.style.setProperty("border-radius", "var(--rove-border-radius)"), i.style.setProperty("box-shadow", "var(--rove-shadow)"), i.style.setProperty("width", "90%"), i.style.setProperty("max-width", "460px"), i.style.setProperty("padding", "20px 24px"), i.style.setProperty("max-height", "80vh"), i.style.setProperty("overflow-y", "auto"), web.insert(i, web.createComponent(solidJs.Switch, {
      get children() {
        return [web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "input";
          },
          get children() {
            return web.createComponent(Rr, {
              get item() {
                return e.overlay.item;
              },
              get onAccept() {
                return e.onAccept;
              },
              get onCancel() {
                return e.onCancel;
              }
            });
          }
        }), web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "loading";
          },
          get children() {
            var o = Pr(), y = o.firstChild, c = y.nextSibling;
            return web.addEventListener(c, "click", e.onCancel, true), o;
          }
        }), web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "error";
          },
          get children() {
            var o = wr(), y = o.firstChild, c = y.nextSibling;
            return web.insert(y, () => e.overlay.message), web.addEventListener(c, "click", e.onCancel, true), o;
          }
        })];
      }
    })), n;
  })();
}
function Rr(e) {
  const t = () => {
    const n = e.item.defaultValue;
    return n !== void 0 ? n : e.item.inputType === "checkbox" ? false : e.item.inputType === "select-multiple" ? [] : "";
  }, [r, l] = solidJs.createSignal(t()), a = e.item.inputType;
  return (() => {
    var n = Ir(), i = n.firstChild, s = i.nextSibling, o = s.firstChild, y = o.nextSibling;
    return web.insert(i, () => e.item.label), web.insert(n, web.createComponent(solidJs.Show, {
      when: a === "text",
      get children() {
        var c = kr();
        return c.$$keydown = (u) => {
          u.key === "Enter" && (u.ctrlKey || u.metaKey) ? (u.preventDefault(), e.onAccept(r())) : u.key === "Escape" && (u.preventDefault(), e.onCancel());
        }, c.$$input = (u) => l(u.currentTarget.value), web.effect(() => c.value = r()), c;
      }
    }), s), web.insert(n, web.createComponent(solidJs.Show, {
      when: a === "textarea",
      get children() {
        var c = Sr();
        return c.$$keydown = (u) => {
          u.key === "Enter" && (u.ctrlKey || u.metaKey) ? (u.preventDefault(), e.onAccept(r())) : u.key === "Escape" && (u.preventDefault(), e.onCancel());
        }, c.$$input = (u) => l(u.currentTarget.value), web.insert(c, () => r()), c;
      }
    }), s), web.insert(n, web.createComponent(solidJs.Show, {
      when: a === "checkbox",
      get children() {
        var c = _r();
        return c.$$keydown = (u) => {
          u.key === "Enter" && (u.ctrlKey || u.metaKey) && (u.preventDefault(), e.onAccept(r()));
        }, c.addEventListener("change", (u) => l(u.currentTarget.checked)), web.effect(() => c.checked = r()), c;
      }
    }), s), web.insert(n, web.createComponent(solidJs.Show, {
      when: a === "select",
      get children() {
        var c = Er();
        return c.$$keydown = (u) => {
          u.key === "Enter" && (u.ctrlKey || u.metaKey) && (u.preventDefault(), e.onAccept(r()));
        }, c.addEventListener("change", (u) => l(u.currentTarget.value)), web.insert(c, () => {
          var u;
          return (u = e.item.options) == null ? void 0 : u.map((v) => (() => {
            var b = yt();
            return b.value = v, web.insert(b, v), b;
          })());
        }), web.effect(() => c.value = r()), c;
      }
    }), s), web.insert(n, web.createComponent(solidJs.Show, {
      when: a === "select-multiple",
      get children() {
        var c = Cr();
        return c.addEventListener("change", (u) => {
          const v = Array.from(u.currentTarget.selectedOptions).map((b) => b.value);
          l(v);
        }), c.$$keydown = (u) => {
          u.key === "Enter" && (u.ctrlKey || u.metaKey) && (u.preventDefault(), e.onAccept(r()));
        }, web.insert(c, () => {
          var u;
          return (u = e.item.options) == null ? void 0 : u.map((v) => (() => {
            var b = yt();
            return b.value = v, web.insert(b, v), b;
          })());
        }), c;
      }
    }), s), o.$$click = () => e.onAccept(r()), web.addEventListener(y, "click", e.onCancel, true), n;
  })();
}
web.delegateEvents(["click", "keydown", "input"]);
var Lr = /* @__PURE__ */ web.template("<div><div>[<!>] visible=<!> mode=</div><div>theme=<!> navKeys=</div><div>palettePin=<!> overlay=");
const Mr = `
:host {
  --rove-font-family: system-ui, sans-serif;
  --rove-border-radius: 6px;
  --rove-z-index: 999999;
  /* Light theme defaults — overridden by data-theme attribute */
  --rove-bg: #ffffff;
  --rove-surface: #f5f5f5;
  --rove-border: #ddd;
  --rove-text: #1a1a1a;
  --rove-text-dim: #666;
  --rove-accent: #1565c0;
  --rove-hover: #f0f0f0;
  --rove-selected: #e3f2fd;
  --rove-input-bg: #fafafa;
  --rove-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

:host([data-theme="dark"]) {
  --rove-bg: #1e1e1e;
  --rove-surface: #2d2d2d;
  --rove-border: #444;
  --rove-text: #e0e0e0;
  --rove-text-dim: #999;
  --rove-accent: #4fc3f7;
  --rove-hover: #3a3a3a;
  --rove-selected: #0d47a1;
  --rove-input-bg: #252525;
  --rove-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

:host([data-theme="light"]) {
  --rove-bg: #ffffff;
  --rove-surface: #f5f5f5;
  --rove-border: #ddd;
  --rove-text: #1a1a1a;
  --rove-text-dim: #666;
  --rove-accent: #1565c0;
  --rove-hover: #f0f0f0;
  --rove-selected: #e3f2fd;
  --rove-input-bg: #fafafa;
  --rove-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

*, *::before, *::after { box-sizing: border-box; }

.rove-root {
  font-family: var(--rove-font-family);
  font-size: 14px;
  color: var(--rove-text);
}

/* Modal sheet */
.modal-input { display: flex; flex-direction: column; gap: 6px; }
.modal-label { font-size: 12px; font-weight: 600; color: var(--rove-text-dim); }
.modal-input-field {
  width: 100%; padding: 8px 10px; box-sizing: border-box;
  border: 1px solid var(--rove-border); border-radius: calc(var(--rove-border-radius) - 2px);
  background: var(--rove-input-bg); color: var(--rove-text);
  font-size: 14px; font-family: var(--rove-font-family); outline: none;
}
.modal-input-field:focus { border-color: var(--rove-accent); }
.modal-textarea { min-height: 80px; resize: vertical; }
.modal-input-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: var(--rove-accent); }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
.modal-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border: 1px solid var(--rove-border);
  border-radius: calc(var(--rove-border-radius) - 2px);
  background: var(--rove-surface); color: var(--rove-text);
  font-size: 13px; font-family: var(--rove-font-family); cursor: pointer;
}
.modal-btn--primary { background: var(--rove-accent); color: #fff; border-color: var(--rove-accent); }
.modal-btn kbd {
  font-size: 10px; opacity: 0.7; background: rgba(0,0,0,0.15);
  padding: 1px 4px; border-radius: 3px; font-family: monospace;
}
.modal-loading, .modal-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 8px 0; color: var(--rove-text);
}
`;
function Ar(e) {
  const t = document.createElement("div");
  t.setAttribute("id", `rove-host-${e.keyPrefix}`), document.body.appendChild(t);
  const r = t.attachShadow({
    mode: "open"
  }), l = document.createElement("style");
  l.textContent = Mr, r.appendChild(l);
  const a = document.createElement("div");
  a.className = "rove-root", r.appendChild(a), t.tabIndex = -1, e.registry.setShadowHost(t);
  const n = window.matchMedia("(prefers-color-scheme: dark)"), i = e.state.meta.theme;
  t.setAttribute("data-theme", i === "system" ? n.matches ? "dark" : "light" : i);
  const s = web.render(() => web.createComponent(zr, web.mergeProps(e, {
    shadowHost: t
  })), a);
  return {
    host: t,
    dispose: s
  };
}
function zr(e) {
  const t = window.matchMedia("(prefers-color-scheme: dark)");
  function r() {
    const i = e.state.meta.theme;
    i === "system" ? e.shadowHost.setAttribute("data-theme", t.matches ? "dark" : "light") : e.shadowHost.setAttribute("data-theme", i);
  }
  solidJs.createEffect(r);
  const l = () => {
    e.state.meta.theme === "system" && r();
  };
  t.addEventListener("change", l), solidJs.onCleanup(() => t.removeEventListener("change", l));
  function a(i) {
    const s = e.state.palette.overlay;
    (s == null ? void 0 : s.type) === "input" && (Qe(e.keyPrefix, "input", s.nodePath.join("."), i), s.item.onChange && s.item.onChange(i), e.set("palette", "overlay", null));
  }
  function n() {
    e.set("palette", "overlay", null);
  }
  return [web.createComponent(ir, {
    get state() {
      return e.state;
    },
    get set() {
      return e.set;
    },
    get keyPrefix() {
      return e.keyPrefix;
    },
    get getIndex() {
      return e.getIndex;
    },
    get setIndex() {
      return e.setIndex;
    }
  }), web.createComponent(br, {
    get state() {
      return e.state;
    },
    get set() {
      return e.set;
    },
    get keyPrefix() {
      return e.keyPrefix;
    },
    get rootTree() {
      return e.rootTree;
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return e.state.palette.overlay !== null;
    },
    get children() {
      return web.createComponent(Tr, {
        get overlay() {
          return e.state.palette.overlay;
        },
        get keyPrefix() {
          return e.keyPrefix;
        },
        onAccept: a,
        onCancel: n
      });
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return Ae();
    },
    get children() {
      var i = Lr(), s = i.firstChild, o = s.firstChild, y = o.nextSibling, c = y.nextSibling, u = c.nextSibling;
      u.nextSibling;
      var v = s.nextSibling, b = v.firstChild, E = b.nextSibling;
      E.nextSibling;
      var T = v.nextSibling, P = T.firstChild, z = P.nextSibling;
      return z.nextSibling, i.style.setProperty("position", "fixed"), i.style.setProperty("bottom", "4px"), i.style.setProperty("background", "#000"), i.style.setProperty("color", "#0f0"), i.style.setProperty("font-size", "10px"), i.style.setProperty("font-family", "monospace"), i.style.setProperty("padding", "3px 8px"), i.style.setProperty("z-index", "99999999"), i.style.setProperty("pointer-events", "none"), i.style.setProperty("border-radius", "3px"), i.style.setProperty("border", "1px solid #0f0"), i.style.setProperty("line-height", "1.8"), i.style.setProperty("opacity", "0.95"), web.insert(s, () => e.keyPrefix, y), web.insert(s, () => String(e.state.visible), u), web.insert(s, () => e.state.mode, null), web.insert(v, () => e.state.meta.theme, E), web.insert(v, () => Object.keys(e.state.nav.currentNode).length, null), web.insert(T, () => e.state.meta.palettePin, z), web.insert(T, () => {
        var L;
        return String(((L = e.state.palette.overlay) == null ? void 0 : L.type) ?? "null");
      }, null), web.effect((L) => {
        var G = e.keyPrefix.length <= 4 ? "4px" : "auto", d = e.keyPrefix.length <= 4 ? "auto" : "4px";
        return G !== L.e && ((L.e = G) != null ? i.style.setProperty("left", G) : i.style.removeProperty("left")), d !== L.t && ((L.t = d) != null ? i.style.setProperty("right", d) : i.style.removeProperty("right")), L;
      }, {
        e: void 0,
        t: void 0
      }), i;
    }
  })];
}
function Dr(e, t) {
  if (!["directory", "action", "input", "virtual"].includes(t.type))
    throw new Error(`Rove: Invalid node type '${t.type}' on node '${e}'.`);
  if (t.type === "input") {
    if ((t.inputType === "select" || t.inputType === "select-multiple") && (!t.options || t.options.length === 0))
      throw new Error(
        `Rove: InputItem '${e}' with inputType '${t.inputType}' requires a non-empty 'options' array.`
      );
    if (t.defaultValue !== void 0) {
      if (t.inputType === "checkbox" && typeof t.defaultValue != "boolean")
        throw new Error(
          `Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`
        );
      if (t.inputType === "select-multiple" && !Array.isArray(t.defaultValue))
        throw new Error(
          `Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`
        );
      if ((t.inputType === "text" || t.inputType === "textarea" || t.inputType === "select") && typeof t.defaultValue != "string")
        throw new Error(
          `Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`
        );
    }
  }
  t.type === "directory" && xt(t.children);
}
function xt(e) {
  if ("meta" in e)
    throw new Error("Rove: 'meta' is a reserved node key.");
  for (const [t, r] of Object.entries(e))
    Dr(t, r);
}
function Hr(e) {
  if (!e.keyPrefix)
    throw new Error("Rove: 'keyPrefix' is required.");
  xt(e.tree);
  const t = Lt(e), [r, l] = zt(t), a = new jt(), n = Zt(e.keyPrefix, l, a), i = { ...e.tree, meta: n };
  let s = Xt(i);
  function o() {
    return s;
  }
  function y(P) {
    s = P;
  }
  l("nav", {
    path: [],
    currentNode: i,
    page: 1,
    totalPages: Math.max(1, Math.ceil(Object.keys(i).length / 9))
  });
  const { host: c, dispose: u } = Ar({
    state: r,
    set: l,
    registry: a,
    keyPrefix: e.keyPrefix,
    onDestroy: T,
    getIndex: o,
    setIndex: y,
    rootTree: i
  });
  a.registerGlobal(t.globalShortcut, "global-toggle", (P) => {
    var z, L;
    P.preventDefault(), r.visible ? document.activeElement !== c && ((z = c.shadowRoot) == null ? void 0 : z.activeElement) == null ? (((L = c.shadowRoot) == null ? void 0 : L.querySelector(
      'input:not([type="hidden"]), textarea, [tabindex="0"]'
    )) ?? c).focus() : l("visible", false) : (l("visible", true), requestAnimationFrame(() => {
      var G;
      ((G = c.shadowRoot) == null ? void 0 : G.activeElement) == null && c.focus();
    }));
  }), a.registerScoped(t.modeSwapShortcut, "mode-swap", (P) => {
    P.preventDefault();
    const z = r.mode === "palette" ? "dir" : "palette";
    l("mode", z);
  });
  function v() {
    l("visible", true), requestAnimationFrame(() => {
      var P;
      ((P = c.shadowRoot) == null ? void 0 : P.activeElement) == null && c.focus();
    });
  }
  function b() {
    console.log(`[Rove:${e.keyPrefix}] hide() called — setting visible=false`), l("visible", false);
  }
  function E() {
    r.visible ? b() : v();
  }
  function T() {
    a.destroy(), u(), c.remove(), Rt(e.keyPrefix);
  }
  return window[`__rove_state_${e.keyPrefix}`] = r, window[`__rove_set_${e.keyPrefix}`] = l, window[`__rove_host_${e.keyPrefix}`] = c, { show: v, hide: b, toggle: E, destroy: T };
}
typeof window < "u" && typeof __USERSCRIPT_BUILD__ < "u" && __USERSCRIPT_BUILD__ && (window.__ROVE__ = { init: Hr });

class Shipment {
  constructor(row) {
    this.name = '';
    this.email = '';
    this.what = '';
    this.address1 = '';
    this.address2 = '';
    this.zip = '';
    this.city = '';
    this.state = '';
    this.phone = '';
    this.work_order = '';
    this.cost_center = '';
    this.qty = '';
    const cols = row.split('\t');
    this.what = cols[2];
    this.qty = cols[3];
    this.work_order = cols[4];
    this.email = cols[5];
    this.cost_center = cols[6];
    this.name = cols[7];
    this.address1 = cols[8];
    this.address2 = cols[9];
    this.city = cols[10];
    this.state = cols[11].toUpperCase();
    this.zip = cols[12];
    this.phone = cols[13];
  }
}
const FORM_FIELDS$1 = {
  name: {
    selector: '#toData\\.contactName',
    value: null,
    type: 'text'
  },
  email: {
    selector: '#notificationData\\.recipientNotifications\\.email',
    value: null,
    type: 'text'
  },
  address1: {
    selector: '#toData\\.addressLine1',
    value: null,
    type: 'text'
  },
  address2: {
    selector: '#toData\\.addressLine2',
    value: null,
    type: 'text'
  },
  city: {
    selector: '#toData\\.city',
    value: null,
    type: 'text'
  },
  state: {
    selector: '#toData\\.stateProvinceCode',
    value: null,
    type: 'dropdown'
  },
  zip: {
    selector: '#toData\\.zipPostalCode',
    value: null,
    type: 'text'
  },
  phone: {
    selector: '#toData\\.phoneNumber',
    value: null,
    type: 'text'
  },
  personalMessage: {
    selector: '[name="notificationData.emailMessage"]',
    value: null,
    type: 'text'
  },
  cost_center: {
    selector: '#billingData\\.yourReference',
    value: null,
    type: 'text'
  },
  signature: {
    selector: '#ss\\.signature\\.sel',
    value: 3,
    type: 'dropdown'
  },
  'delivery notification': {
    selector: '#notificationData\\.senderNotifications\\.deliveryNotificationFlag',
    value: true,
    type: 'checkbox'
  },
  'exceptions notification': {
    selector: '#notificationData\\.recipientNotifications\\.exceptionNotificationFlag',
    value: true,
    type: 'checkbox'
  },
  'estimated delivery notification': {
    selector: '#notificationData\\.recipientNotifications\\.estimatedDeliveryNotificationFlag',
    value: true,
    type: 'checkbox'
  }
};
function addFedExAutofillTextArea() {
  const colLeft = document.getElementById('columnLeft');
  const textArea = document.createElement('textarea');
  //   textArea.setAttribute('id', `fedexAutofillTextArea-${uuid}`);
  //   textArea.dataset['uuid'] = uuid;
  textArea.placeholder = 'Paste excel row here to autofill';
  textArea.addEventListener('input', function (e) {
    autofillAction(FORM_FIELDS$1, e);
  });
  const TEXTAREA_STYLES = {
    marginBottom: '5px',
    paddingBottom: '10px',
    width: 'calc(100% - 5px)',
    borderBottom: 'solid 2px #660099',
    fontWeight: 'bold',
    resize: 'vertical'
  };
  for (const property in TEXTAREA_STYLES) textArea.style[property] = TEXTAREA_STYLES[property];
  colLeft.prepend(textArea);
  textArea.focus();
}
function autofillAction(FORM_FIELDS, e) {
  const ship = new Shipment(e.target.value);

  // click to expand shipment notifications section
  const expandBtn = document.querySelector('#module\\.emailNotifications\\._headerEdit > a');
  expandBtn.click();

  // set personalMessage value
  FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;
  for (const field in FORM_FIELDS) {
    const fieldItem = document.querySelector(FORM_FIELDS[field].selector);
    switch (FORM_FIELDS[field].type) {
      case 'text':
        fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
        break;
      case 'dropdown':
        fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
        break;
      case 'checkbox':
        fieldItem.checked = FORM_FIELDS[field].value;
        break;
      default:
        console.log("you shouldn't be here");
        break;
    }
  }
}

// A type guard to check if an element is an HTMLInputElement or HTMLTextAreaElement
function isInputOrTextAreaElement(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}
function setValue(inputElement, value) {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error('The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.');
  }

  // Set the value of the input element
  inputElement.value = value;

  // Emit the 'input' event for frameworks that track live input changes
  const inputEvent = new Event('input', {
    bubbles: true
  });
  inputElement.dispatchEvent(inputEvent);
}
function triggerChange(inputElement) {
  if (!isInputOrTextAreaElement(inputElement)) {
    throw new Error('The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.');
  }

  // Emit the 'change' event for frameworks that track changes on blur or after input
  const changeEvent = new Event('change', {
    bubbles: true
  });
  inputElement.dispatchEvent(changeEvent);
}
function simulateUserInteraction(inputElement, value) {
  setValue(inputElement, value);
  triggerChange(inputElement);
}

/**
 * Selects a dropdown option by matching text content instead of value attribute.
 * This is more robust than selecting by Angular's internal value (e.g., "2: Object").
 * @param selectElement - The select element to update
 * @param textToMatch - The text content to search for (e.g., "Draper Mailroom")
 */
function selectByText(selectElement, textToMatch) {
  if (!(selectElement instanceof HTMLSelectElement)) {
    throw new Error('The element must be an instance of HTMLSelectElement.');
  }

  // Find the option that contains the text
  const options = Array.from(selectElement.options);
  const matchingOption = options.find(option => {
    var _option$textContent;
    return (_option$textContent = option.textContent) == null ? void 0 : _option$textContent.trim().includes(textToMatch);
  });
  if (matchingOption) {
    selectElement.value = matchingOption.value;
    const changeEvent = new Event('change', {
      bubbles: true
    });
    selectElement.dispatchEvent(changeEvent);
  } else {
    console.warn(`Could not find option containing "${textToMatch}" in dropdown`);
  }
}

// import { showToast } from '@violentmonkey/ui';

function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// deprecated
/* export function getCells(i) {
  const data = getDataFromCells();
  let text = '';
  data.forEach((row) => {
    const cell = row[i];
    text = text.concat(`${cell}\n`);
  });
  return text;
}

// deprecated
export function getDataFromCells() {
  const rows = document.querySelectorAll('div[ng-row]');
  const data = [];

  rows.forEach((row, rIdx) => {
    data.push([]);
    const cells = row.querySelectorAll(
      'div[ng-cell] span[ng-cell-text]',
    ) as NodeListOf<HTMLElement>;
    cells.forEach((cell) => data[rIdx].push(cell.outerText));
  });
  return data;
}

// deprecated
export async function getCostCenterFromHub(profileURL) {
  try {
    const r = await makeRequest(profileURL);
    const data = JSON.parse(r).data;
    return data.costCenterCode;
  } catch (e) {
    console.error(e);
    const title = 'Failure!';
    const body =
      'Data was not scraped successfully. Check that the hub is still logged in.';
    showToast(`${title}: ${body}`, { theme: 'dark' });
  }
} */

const FORM_FIELDS = {
  country: {
    selector: 'receiver-country-code',
    value: '190: US',
    type: 'dropdown',
    elementType: 'select'
  },
  zip: {
    selector: 'receiver-postal-code',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  name: {
    selector: 'receiver-name',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  address1: {
    selector: 'receiver-address-line1',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  address2: {
    selector: 'receiver-address-line2',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  city: {
    selector: 'receiver-city',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  phone: {
    selector: 'receiver-telephone-number',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  cost_center: {
    selector: 'references-input-control',
    value: null,
    type: 'text',
    elementType: 'input'
  },
  signature: {
    selector: 'signature-option',
    value: '4: DIRECT',
    type: 'dropdown',
    elementType: 'select'
  },
  billing: {
    selector: 'bill-to',
    value: 'Draper Mailroom',
    type: 'dropdown-text',
    elementType: 'select'
  },
  weight: {
    selector: 'weight-0',
    value: '1',
    type: 'text',
    elementType: 'input'
  },
  state: {
    selector: 'receiver-state-or-province',
    value: null,
    type: 'dropdown',
    elementType: 'select'
  },
  service: {
    selector: 'service',
    value: '5: PRIORITY_OVERNIGHT',
    type: 'dropdown',
    elementType: 'select'
  }
};
function fillForm(ship) {
  const data = ship;
  for (const field in FORM_FIELDS) {
    const {
      selector,
      elementType,
      type,
      value
    } = FORM_FIELDS[field];
    const el = document.querySelector(`[data-test-id="${selector}"] ${elementType}`);
    if (!el) continue;
    if (type === 'dropdown-text') {
      var _ref;
      selectByText(el, (_ref = value != null ? value : data[field]) != null ? _ref : '');
    } else {
      var _ref2;
      simulateUserInteraction(el, (_ref2 = value != null ? value : data[field]) != null ? _ref2 : '');
    }
  }
}
function autoFillFromRow() {
  const row = prompt('Paste spreadsheet row:');
  if (!row) return;
  fillForm(new Shipment(row));
}
function autoFillFromJSON() {
  const jsonStr = prompt('Paste JSON (from SNOW script):');
  if (!jsonStr) return;
  try {
    var _d$name, _d$streetAddress, _d$city, _d$state, _d$postalCode, _d$phone, _d$costCenter, _d$email;
    const d = JSON.parse(jsonStr);
    fillForm({
      name: (_d$name = d.name) != null ? _d$name : '',
      address1: (_d$streetAddress = d.streetAddress) != null ? _d$streetAddress : '',
      address2: '',
      city: (_d$city = d.city) != null ? _d$city : '',
      state: (_d$state = d.state) != null ? _d$state : '',
      zip: (_d$postalCode = d.postalCode) != null ? _d$postalCode : '',
      phone: (_d$phone = d.phone) != null ? _d$phone : '',
      cost_center: (_d$costCenter = d.costCenter) != null ? _d$costCenter : '',
      email: (_d$email = d.email) != null ? _d$email : ''
    });
  } catch (_unused) {
    console.error('[fedex-form-filler] Invalid JSON');
  }
}
function initializeStaticFields() {
  const signatureCheckboxSel = `ui-checkbox[data-test-id="signature-options-checkbox"] input[type="checkbox"]`;
  waitForElm(signatureCheckboxSel).then(() => {
    const el = document.querySelector(signatureCheckboxSel);
    el == null || el.click();
    el == null || el.dispatchEvent(new Event('change'));
  });
  const signatureOptionSel = `signature-options[data-test-id="signature-options"] select`;
  waitForElm(signatureOptionSel).then(() => {
    const el = document.querySelector(signatureOptionSel);
    el.value = '4: DIRECT';
    el.dispatchEvent(new Event('change'));
  });
  const accountSwitcherSel = `account-switcher [data-test-id="account-switcher"] select`;
  waitForElm(accountSwitcherSel).then(() => {
    const el = document.querySelector(accountSwitcherSel);
    selectByText(el, 'Draper Mailroom');
  });
}
window.addEventListener('load', () => {
  if (window.location.href.includes('shipping/shipEntryAction')) {
    addFedExAutofillTextArea();
  }
  if (window.location.href.includes('shippingplus')) {
    waitForElm('address-to-form').then(() => {
      initializeStaticFields();
      const rove = Hr({
        keyPrefix: 'fedex',
        defaults: {
          mode: 'dir',
          theme: 'dark'
        },
        tree: {
          autofill: {
            type: 'directory',
            label: 'Autofill',
            children: {
              pasteRow: {
                type: 'action',
                label: 'Paste Row',
                action: autoFillFromRow
              },
              pasteJson: {
                type: 'action',
                label: 'Paste JSON',
                action: autoFillFromJSON
              }
            }
          }
        }
      });
      GM_registerMenuCommand('FedEx Autofill', () => rove.toggle());
    });
  }
});

})(VM.solid.store, VM.solid.web, VM.solid);
