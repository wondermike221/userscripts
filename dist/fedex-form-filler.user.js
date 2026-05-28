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

var St = Object.defineProperty;
var Et = (e, t, r) => t in e ? St(e, t, { enumerable: true, configurable: true, writable: true, value: r }) : e[t] = r;
var Be = (e, t, r) => Et(e, typeof t != "symbol" ? t + "" : t, r);
function ce(e, t, r) {
  try {
    const l = localStorage.getItem(`${e}.${t}.${r}`);
    return l !== null ? JSON.parse(l) : null;
  } catch {
    return null;
  }
}
function $e(e, t, r, l) {
  try {
    localStorage.setItem(`${e}.${t}.${r}`, JSON.stringify(l));
  } catch {
  }
}
function At(e) {
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
const Ce = {
  mode: "palette",
  palettePin: "top",
  globalShortcut: "Ctrl+`",
  modeSwapShortcut: "Ctrl+Shift+`",
  rememberLastMode: false,
  theme: "system"
};
function Mt(e) {
  const { keyPrefix: t, defaults: r = {} } = e, l = {
    mode: r.mode ?? Ce.mode,
    palettePin: r.palettePin ?? Ce.palettePin,
    globalShortcut: r.globalShortcut ?? Ce.globalShortcut,
    modeSwapShortcut: r.modeSwapShortcut ?? Ce.modeSwapShortcut,
    rememberLastMode: r.rememberLastMode ?? Ce.rememberLastMode,
    theme: r.theme ?? Ce.theme
  }, u = ce(t, "meta", "mode");
  (u === "palette" || u === "dir") && (l.mode = u);
  const n = ce(t, "meta", "palettePin");
  (n === "top" || n === "middle" || n === "bottom") && (l.palettePin = n);
  const c = ce(t, "meta", "globalShortcut");
  c && (l.globalShortcut = c);
  const y = ce(t, "meta", "modeSwapShortcut");
  y && (l.modeSwapShortcut = y);
  const p = ce(t, "meta", "rememberLastMode");
  typeof p == "boolean" && (l.rememberLastMode = p);
  const I = ce(t, "meta", "theme");
  return (I === "light" || I === "dark" || I === "system") && (l.theme = I), l;
}
function Dt() {
  return {
    x: Math.round(window.innerWidth * 0.375),
    y: Math.round(window.innerHeight * 0.375),
    width: Math.round(window.innerWidth * 0.25),
    height: Math.round(window.innerHeight * 0.25)
  };
}
function Rt(e) {
  return {
    visible: false,
    mode: e.mode,
    window: Dt(),
    palette: {
      query: "",
      results: [],
      selectedIndex: 0,
      overlay: null
    },
    nav: {
      history: [],
      page: 1,
      totalPages: 1
    },
    meta: e
  };
}
function zt(e) {
  return store.createStore(Rt(e));
}
function Ht(e, t) {
  e("meta", (r) => ({ ...r, ...t }));
}
const jt = {
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
function yt(e, t) {
  const r = t.split("+"), l = r[r.length - 1], u = r.includes("Ctrl"), n = r.includes("Shift"), c = r.includes("Alt"), y = r.includes("Meta");
  if (e.ctrlKey !== u || e.shiftKey !== n || e.altKey !== c || e.metaKey !== y)
    return false;
  if (l.length === 1 && /[a-z0-9]/i.test(l))
    return e.key.toLowerCase() === l.toLowerCase();
  const p = jt[l];
  return p ? e.code === p : e.key === l;
}
class qt {
  constructor() {
    Be(this, "entries", /* @__PURE__ */ new Map());
    Be(this, "shadowHost", null);
    Be(this, "globalHandler");
    Be(this, "scopedHandler");
    this.globalHandler = (t) => {
      for (const r of this.entries.values())
        r.scope === "global" && yt(t, r.shortcut) && r.handler(t);
    }, this.scopedHandler = (t) => {
      var u;
      if (!(!this.shadowHost || !(document.activeElement === this.shadowHost || ((u = this.shadowHost.shadowRoot) == null ? void 0 : u.activeElement) != null)))
        for (const n of this.entries.values())
          n.scope === "scoped" && yt(t, n.shortcut) && n.handler(t);
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
const wt = (e, t) => e > t ? 1 : e < t ? -1 : 0, lt = 1 / 0, tt = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), pt = "eexxaacctt", Bt = new RegExp("\\p{P}", "gu"), Nt = "A-Z", Vt = "a-z", Kt = ["en", { numeric: true, sensitivity: "base" }], Te = (e, t, r) => e.replace(Nt, t).replace(Vt, r), ft = {
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
  interIns: lt,
  // allowance between chars in terms
  intraChars: "[a-z\\d']",
  // internally case-insensitive
  intraIns: null,
  intraContr: "'[a-z]{1,2}\\b",
  // multi-insert or single-error mode
  intraMode: 0,
  // single-error bounds for errors within terms, default requires exact first char
  intraSlice: [1, lt],
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
  sort: (e, t, r, l = wt) => {
    let {
      idx: u,
      chars: n,
      terms: c,
      interLft2: y,
      interLft1: p,
      //	interRgt2,
      //	interRgt1,
      start: I,
      intraIns: h,
      interIns: v,
      cases: a
    } = e;
    return u.map((g, x) => x).sort((g, x) => (
      // most contig chars matched
      n[x] - n[g] || // least char intra-fuzz (most contiguous)
      h[g] - h[x] || // most prefix bounds, boosted by full term matches
      c[x] + y[x] + 0.5 * p[x] - (c[g] + y[g] + 0.5 * p[g]) || // highest density of match (least span)
      //	span[ia] - span[ib] ||
      // highest density of match (least term inter-fuzz)
      v[g] - v[x] || // earliest start of match
      I[g] - I[x] || // case match
      a[x] - a[g] || // alphabetic
      l(t[u[g]], t[u[x]])
    ));
  }
}, rt = (e, t) => t == 0 ? "" : t == 1 ? e + "??" : t == lt ? e + "*?" : e + `{0,${t}}?`, ht = "(?:\\b|_)";
function Ve(e) {
  e = Object.assign({}, ft, e);
  let {
    unicode: t,
    interLft: r,
    interRgt: l,
    intraMode: u,
    intraSlice: n,
    intraIns: c,
    intraSub: y,
    intraTrn: p,
    intraDel: I,
    intraContr: h,
    intraSplit: v,
    interSplit: a,
    intraBound: g,
    interBound: x,
    intraChars: L,
    toUpper: R,
    toLower: w,
    compare: B
  } = e;
  c ?? (c = u), y ?? (y = u), p ?? (p = u), I ?? (I = u), B ?? (B = typeof Intl > "u" ? wt : new Intl.Collator(...Kt).compare);
  let P = e.letters ?? e.alpha;
  if (P != null) {
    let S = R(P), z = w(P);
    a = Te(a, S, z), v = Te(v, S, z), x = Te(x, S, z), g = Te(g, S, z), L = Te(L, S, z), h = Te(h, S, z);
  }
  let _ = t ? "u" : "";
  const Y = '".+?"', se = new RegExp(Y, "gi" + _), O = new RegExp(`(?:\\s+|^)-(?:${L}+|${Y})`, "gi" + _);
  let { intraRules: Z } = e;
  Z == null && (Z = (S) => {
    let z = ft.intraSlice, j = 0, s = 0, o = 0, d = 0;
    if (/[^\d]/.test(S)) {
      let i = S.length;
      i <= 4 ? i >= 3 && (o = Math.min(p, 1), i == 4 && (j = Math.min(c, 1))) : (z = n, j = c, s = y, o = p, d = I);
    }
    return {
      intraSlice: z,
      intraIns: j,
      intraSub: s,
      intraTrn: o,
      intraDel: d
    };
  });
  let ue = !!v, de = new RegExp(v, "g" + _), Ke = new RegExp(a, "g" + _), Fe = new RegExp("^" + a + "|" + a + "$", "g" + _), Oe = new RegExp(h, "gi" + _);
  const ae = (S, z = false) => {
    let j = [];
    S = S.replace(se, (o) => (j.push(o), pt)), S = S.replace(Fe, ""), z || (S = w(S)), ue && (S = S.replace(de, (o) => o[0] + " " + o[1]));
    let s = 0;
    return S.split(Ke).filter((o) => o != "").map((o) => o === pt ? j[s++] : o);
  }, Ue = /[^\d]+|\d+/g, He = (S, z = 0, j = false) => {
    let s = ae(S);
    if (s.length == 0)
      return [];
    let o = Array(s.length).fill("");
    s = s.map(($, k) => $.replace(Oe, (E) => (o[k] = E, "")));
    let d;
    if (u == 1)
      d = s.map(($, k) => {
        if ($[0] === '"')
          return tt($.slice(1, -1));
        let E = "";
        for (let N of $.matchAll(Ue)) {
          let m = N[0], {
            intraSlice: D,
            intraIns: q,
            intraSub: A,
            intraTrn: V,
            intraDel: H
          } = Z(m);
          if (q + A + V + H == 0)
            E += m + o[k];
          else {
            let [Q, J] = D, ee = m.slice(0, Q), pe = m.slice(J), F = m.slice(Q, J);
            q == 1 && ee.length == 1 && ee != F[0] && (ee += "(?!" + ee + ")");
            let me = F.length, fe = [m];
            if (A)
              for (let U = 0; U < me; U++)
                fe.push(ee + F.slice(0, U) + L + F.slice(U + 1) + pe);
            if (V)
              for (let U = 0; U < me - 1; U++)
                F[U] != F[U + 1] && fe.push(ee + F.slice(0, U) + F[U + 1] + F[U] + F.slice(U + 2) + pe);
            if (H)
              for (let U = 0; U < me; U++)
                fe.push(ee + F.slice(0, U + 1) + "?" + F.slice(U + 1) + pe);
            if (q) {
              let U = rt(L, 1);
              for (let xe = 0; xe < me; xe++)
                fe.push(ee + F.slice(0, xe) + U + F.slice(xe) + pe);
            }
            E += "(?:" + fe.join("|") + ")" + o[k];
          }
        }
        return E;
      });
    else {
      let $ = rt(L, c);
      z == 2 && c > 0 && ($ = ")(" + $ + ")("), d = s.map((k, E) => k[0] === '"' ? tt(k.slice(1, -1)) : k.split("").map((N, m, D) => (c == 1 && m == 0 && D.length > 1 && N != D[m + 1] && (N += "(?!" + N + ")"), N)).join($) + o[E]);
    }
    let i = r == 2 ? ht : "", f = l == 2 ? ht : "", C = f + rt(e.interChars, e.interIns) + i;
    return z > 0 ? j ? d = i + "(" + d.join(")" + f + "|" + i + "(") + ")" + f : (d = "(" + d.join(")(" + C + ")(") + ")", d = "(.??" + i + ")" + d + "(" + f + ".*)") : (d = d.join(C), d = i + d + f), [new RegExp(d, "i" + _), s, o];
  }, ge = (S, z, j) => {
    let [s] = He(z);
    if (s == null)
      return null;
    let o = [];
    if (j != null)
      for (let d = 0; d < j.length; d++) {
        let i = j[d];
        s.test(S[i]) && o.push(i);
      }
    else
      for (let d = 0; d < S.length; d++)
        s.test(S[d]) && o.push(d);
    return o;
  };
  let Ge = !!g, ke = new RegExp(x, _), _e = new RegExp(g, _);
  const We = (S, z, j) => {
    let [s, o, d] = He(j, 1), i = ae(j, true), [f] = He(j, 2), C = o.length, $ = Array(C), k = Array(C);
    for (let A = 0; A < C; A++) {
      let V = o[A], H = i[A], Q = V[0] == '"' ? V.slice(1, -1) : V + d[A], J = H[0] == '"' ? H.slice(1, -1) : H + d[A];
      $[A] = Q, k[A] = J;
    }
    let E = S.length, N = Array(E).fill(0), m = {
      // idx in haystack
      idx: Array(E),
      // start of match
      start: N.slice(),
      // length of match
      //	span: field.slice(),
      // contiguous chars matched
      chars: N.slice(),
      // case matched in term (via term.includes(match))
      cases: N.slice(),
      // contiguous (no fuzz) and bounded terms (intra=0, lft2/1, rgt2/1)
      // excludes terms that are contiguous but have < 2 bounds (substrings)
      terms: N.slice(),
      // cumulative length of unmatched chars (fuzz) within span
      interIns: N.slice(),
      // between terms
      intraIns: N.slice(),
      // within terms
      // interLft/interRgt counters
      interLft2: N.slice(),
      interRgt2: N.slice(),
      interLft1: N.slice(),
      interRgt1: N.slice(),
      ranges: Array(E)
    }, D = r == 1 || l == 1, q = 0;
    for (let A = 0; A < S.length; A++) {
      let V = z[S[A]], H = V.match(s), Q = H.index + H[1].length, J = Q, ee = false, pe = 0, F = 0, me = 0, fe = 0, U = 0, xe = 0, st = 0, it = 0, at = 0, be = [];
      for (let G = 0, X = 2; G < C; G++, X += 2) {
        let he = w(H[X]), le = $[G], Qe = k[G], ne = le.length, oe = he.length, te = he == le;
        if (H[X] == Qe && st++, !te && H[X + 1].length >= ne) {
          let W = w(H[X + 1]).indexOf(le);
          W > -1 && (be.push(J, oe, W, ne), J += je(H, X, W, ne), he = le, oe = ne, te = true, G == 0 && (Q = J));
        }
        if (D || te) {
          let W = J - 1, ye = J + oe, Pe = false, qe = false;
          if (W == -1 || ke.test(V[W]))
            te && pe++, Pe = true;
          else {
            if (r == 2) {
              ee = true;
              break;
            }
            if (Ge && _e.test(V[W] + V[W + 1]))
              te && F++, Pe = true;
            else if (r == 1) {
              let Ye = H[X + 1], Se = J + oe;
              if (Ye.length >= ne) {
                let we = 0, Ee = false, _t = new RegExp(le, "ig" + _), ct;
                for (; ct = _t.exec(Ye); ) {
                  we = ct.index;
                  let ut = Se + we, et = ut - 1;
                  if (et == -1 || ke.test(V[et])) {
                    pe++, Ee = true;
                    break;
                  } else if (_e.test(V[et] + V[ut])) {
                    F++, Ee = true;
                    break;
                  }
                }
                Ee && (Pe = true, be.push(J, oe, we, ne), J += je(H, X, we, ne), he = le, oe = ne, te = true, G == 0 && (Q = J));
              }
              if (!Pe) {
                ee = true;
                break;
              }
            }
          }
          if (ye == V.length || ke.test(V[ye]))
            te && me++, qe = true;
          else {
            if (l == 2) {
              ee = true;
              break;
            }
            if (Ge && _e.test(V[ye - 1] + V[ye]))
              te && fe++, qe = true;
            else if (l == 1) {
              ee = true;
              break;
            }
          }
          te && (U += ne, Pe && qe && xe++);
        }
        if (oe > ne && (at += oe - ne), G > 0 && (it += H[X - 1].length), !e.intraFilt(le, he, J)) {
          ee = true;
          break;
        }
        G < C - 1 && (J += oe + H[X + 1].length);
      }
      if (!ee) {
        m.idx[q] = S[A], m.interLft2[q] = pe, m.interLft1[q] = F, m.interRgt2[q] = me, m.interRgt1[q] = fe, m.chars[q] = U, m.terms[q] = xe, m.cases[q] = st, m.interIns[q] = it, m.intraIns[q] = at, m.start[q] = Q;
        let G = V.match(f), X = G.index + G[1].length, he = be.length, le = he > 0 ? 0 : 1 / 0, Qe = he - 4;
        for (let W = 2; W < G.length; ) {
          let ye = G[W].length;
          if (le <= Qe && be[le] == X) {
            let Pe = be[le + 1], qe = be[le + 2], Ye = be[le + 3], Se = W, we = "";
            for (let Ee = 0; Ee < Pe; Se++)
              we += G[Se], Ee += G[Se].length;
            G.splice(W, Se - W, we), X += je(G, W, qe, Ye), le += 4;
          } else
            X += ye, W++;
        }
        X = G.index + G[1].length;
        let ne = m.ranges[q] = [], oe = X, te = X;
        for (let W = 2; W < G.length; W++) {
          let ye = G[W].length;
          X += ye, W % 2 == 0 ? te = X : ye > 0 && (ne.push(oe, te), oe = te = X);
        }
        te > oe && ne.push(oe, te), q++;
      }
    }
    if (q < S.length)
      for (let A in m)
        m[A] = m[A].slice(0, q);
    return m;
  }, je = (S, z, j, s) => {
    let o = S[z] + S[z + 1].slice(0, j);
    return S[z - 1] += o, S[z] = S[z + 1].slice(j, j + s), S[z + 1] = S[z + 1].slice(j + s), o.length;
  }, Xe = 5, Je = (S, z, j, s = 1e3, o) => {
    j = j ? j === true ? Xe : j : 0;
    let d = null, i = null, f = [];
    z = z.replace(O, (m) => {
      let D = m.trim().slice(1);
      return D = D[0] === '"' ? tt(D.slice(1, -1)) : D.replace(Bt, ""), D != "" && f.push(D), "";
    });
    let C = ae(z), $;
    if (f.length > 0) {
      if ($ = new RegExp(f.join("|"), "i" + _), C.length == 0) {
        let m = [];
        for (let D = 0; D < S.length; D++)
          $.test(S[D]) || m.push(D);
        return [m, null, null];
      }
    } else if (C.length == 0)
      return [null, null, null];
    if (j > 0) {
      let m = ae(z);
      if (m.length > 1) {
        let D = m.slice().sort((A, V) => V.length - A.length);
        for (let A = 0; A < D.length; A++) {
          if ((o == null ? void 0 : o.length) == 0)
            return [[], null, null];
          o = ge(S, D[A], o);
        }
        if (m.length > j)
          return [o, null, null];
        d = $t(m).map((A) => A.join(" ")), i = [];
        let q = /* @__PURE__ */ new Set();
        for (let A = 0; A < d.length; A++)
          if (q.size < o.length) {
            let V = o.filter((Q) => !q.has(Q)), H = ge(S, d[A], V);
            for (let Q = 0; Q < H.length; Q++)
              q.add(H[Q]);
            i.push(H);
          } else
            i.push([]);
      }
    }
    d == null && (d = [z], i = [(o == null ? void 0 : o.length) > 0 ? o : ge(S, z)]);
    let k = null, E = null;
    if (f.length > 0 && (i = i.map((m) => m.filter((D) => !$.test(S[D])))), i.reduce((m, D) => m + D.length, 0) <= s) {
      k = {}, E = [];
      for (let m = 0; m < i.length; m++) {
        let D = i[m];
        if (D == null || D.length == 0)
          continue;
        let q = d[m], A = We(D, S, q), V = e.sort(A, S, q, B);
        if (m > 0)
          for (let H = 0; H < V.length; H++)
            V[H] += E.length;
        for (let H in A)
          k[H] = (k[H] ?? []).concat(A[H]);
        E = E.concat(V);
      }
    }
    return [
      [].concat(...i),
      k,
      E
    ];
  };
  return {
    search: (...S) => Je(...S),
    split: ae,
    filter: ge,
    info: We,
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
    e[n].split("").forEach((c) => {
      r += c, t[c] = n;
    });
  let l = new RegExp(`[${r}]`, "g"), u = (n) => t[n];
  return (n) => {
    if (typeof n == "string")
      return n.replace(l, u);
    let c = Array(n.length);
    for (let y = 0; y < n.length; y++)
      c[y] = n[y].replace(l, u);
    return c;
  };
})();
function $t(e) {
  e = e.slice();
  let t = e.length, r = [e.slice()], l = new Array(t).fill(0), u = 1, n, c;
  for (; u < t; )
    l[u] < u ? (n = u % 2 && l[u], c = e[u], e[u] = e[n], e[n] = c, ++l[u], u = 1, r.push(e.slice())) : (l[u] = 0, ++u);
  return r;
}
const Ut = (e, t) => t ? `<mark>${e}</mark>` : e, Gt = (e, t) => e + t;
function Wt(e, t, r = Ut, l = "", u = Gt) {
  l = u(l, r(e.substring(0, t[0]), false)) ?? l;
  for (let n = 0; n < t.length; n += 2) {
    let c = t[n], y = t[n + 1];
    l = u(l, r(e.substring(c, y), true)) ?? l, n < t.length - 3 && (l = u(l, r(e.substring(t[n + 1], t[n + 2]), false)) ?? l);
  }
  return l = u(l, r(e.substring(t[t.length - 1]), false)) ?? l, l;
}
Ve.latinize = Ot;
Ve.permute = (e) => $t([...Array(e.length).keys()]).sort((r, l) => {
  for (let u = 0; u < r.length; u++)
    if (r[u] != l[u])
      return r[u] - l[u];
  return 0;
}).map((r) => r.map((l) => e[l]));
Ve.highlight = Wt;
const Xt = new Ve({ intraMode: 1 });
function ot(e, t, r, l, u) {
  for (const [n, c] of Object.entries(e))
    if (c.type === "directory")
      ot(
        c.children,
        [...t, n],
        [...r, c.label],
        l,
        u
      );
    else {
      const y = r.length > 0 ? `${r.join(" > ")} > ${c.label}` : c.label;
      l.push(y), u.push({
        item: c,
        key: n,
        path: [...t, n],
        pathLabels: [...r],
        score: 0,
        ranges: []
      });
    }
}
function Yt(e) {
  const t = [], r = [];
  return ot(e, [], [], t, r), { haystack: t, items: r };
}
function vt(e, t) {
  if (!t.trim()) return [];
  const [r, l, u] = Xt.search(e.haystack, t);
  return !r || !l || !u ? [] : u.map((n) => {
    const c = r[n];
    Ve.highlight(
      e.haystack[c],
      l.ranges[n],
      (h) => h
    );
    const y = e.items[c], p = l.ranges[n], I = [];
    for (let h = 0; h < p.length; h += 2)
      I.push([p[h], p[h + 1]]);
    return {
      ...y,
      score: l.idx[n],
      ranges: I
    };
  });
}
function Zt(e, t, r, l) {
  const u = [...e.haystack], n = [...e.items];
  return ot(t, r, l, u, n), { haystack: u, items: n };
}
function Ft(e, t, r) {
  function l(u, n, c, y) {
    return {
      type: "input",
      label: u,
      inputType: n,
      options: y == null ? void 0 : y.options,
      storageKey: `${e}.meta.${c}`,
      onChange: (p) => {
        $e(e, "meta", c, p), y != null && y.onChange && y.onChange(p), Ht(t, { [c]: p });
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
        onChange: (u) => {
          r.updateShortcut("global-toggle", u);
        }
      }),
      "swap-key": l("Mode Swap Shortcut", "text", "modeSwapShortcut", {
        onChange: (u) => {
          r.updateShortcut("mode-swap", u);
        }
      })
    }
  };
}
const [Ne, rl] = solidJs.createSignal(false);
var Jt = /* @__PURE__ */ web.template("<div class=result-path>"), Qt = /* @__PURE__ */ web.template("<div role=option><span class=result-label>"), er = /* @__PURE__ */ web.template("<mark class=result-highlight>"), tr = /* @__PURE__ */ web.template("<span>");
function rr(e, t) {
  const r = [];
  let l = 0;
  for (const [u, n] of t)
    u > l && r.push({
      text: e.slice(l, u),
      highlighted: false
    }), r.push({
      text: e.slice(u, n),
      highlighted: true
    }), l = n;
  return l < e.length && r.push({
    text: e.slice(l),
    highlighted: false
  }), r;
}
function lr(e) {
  const t = () => e.result.item, r = () => "label" in t() ? t().label : "", l = () => e.result.pathLabels.length > 0 ? e.result.pathLabels.join(" › ") : null, u = () => e.result.ranges.length > 0 ? rr(r(), e.result.ranges) : [{
    text: r(),
    highlighted: false
  }];
  return (() => {
    var n = Qt(), c = n.firstChild;
    return web.addEventListener(n, "click", e.onActivate, true), n.style.setProperty("padding", "8px 14px"), n.style.setProperty("cursor", "pointer"), web.insert(n, web.createComponent(solidJs.Show, {
      get when() {
        return l();
      },
      get children() {
        var y = Jt();
        return y.style.setProperty("font-size", "11px"), y.style.setProperty("color", "var(--rove-text-dim)"), y.style.setProperty("margin-bottom", "2px"), web.insert(y, l), y;
      }
    }), c), web.insert(c, web.createComponent(solidJs.For, {
      get each() {
        return u();
      },
      children: (y) => y.highlighted ? (() => {
        var p = er();
        return p.style.setProperty("background", "var(--rove-accent)"), p.style.setProperty("color", "var(--rove-bg)"), p.style.setProperty("border-radius", "2px"), p.style.setProperty("padding", "0 1px"), web.insert(p, () => y.text), p;
      })() : (() => {
        var p = tr();
        return web.insert(p, () => y.text), p;
      })()
    })), web.effect((y) => {
      var p = `palette-result${e.selected ? " palette-result--selected" : ""}`, I = e.selected, h = e.selected ? "var(--rove-selected)" : "transparent";
      return p !== y.e && web.className(n, y.e = p), I !== y.t && web.setAttribute(n, "aria-selected", y.t = I), h !== y.a && ((y.a = h) != null ? n.style.setProperty("background", h) : n.style.removeProperty("background")), y;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), n;
  })();
}
web.delegateEvents(["click"]);
var nr = /* @__PURE__ */ web.template("<div>P[<!>] vis=<!> eph="), or = /* @__PURE__ */ web.template("<div>DEBUG: palette mounted [<!>] pin="), sr = /* @__PURE__ */ web.template("<div><span>Select: </span><span>Esc to cancel"), ir = /* @__PURE__ */ web.template("<div>No options match"), gt = /* @__PURE__ */ web.template("<div id=palette-results role=listbox>"), ar = /* @__PURE__ */ web.template('<div class=palette-container role=combobox aria-haspopup=listbox><div class=palette-input-row><input type=text class=palette-input aria-autocomplete=list aria-controls=palette-results><button class=palette-mode-btn aria-label="Switch to directory view"title="Switch to directory view">☰</button></div><div role=status aria-live=polite aria-atomic=true>'), cr = /* @__PURE__ */ web.template("<div role=option>");
function ur(e) {
  let t, r;
  const [l, u] = solidJs.createSignal(null);
  solidJs.createEffect(() => {
    v() || u(null);
  }), solidJs.createEffect(() => {
    v() && e.state.palette.overlay === null && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    if (l()) return;
    const a = e.state.palette.query, g = a ? vt(e.getIndex(), a) : [];
    e.set("palette", (x) => ({
      ...x,
      results: g,
      selectedIndex: 0
    }));
  });
  const n = solidJs.createMemo(() => {
    const a = l();
    if (!a) return [];
    const g = e.state.palette.query.toLowerCase();
    return g ? a.options.filter(({
      key: x,
      item: L
    }) => ("label" in L ? L.label : x).toLowerCase().includes(g)) : a.options;
  });
  function c(a) {
    const g = a.target.value;
    e.set("palette", "query", g), u((x) => x ? {
      ...x,
      selectedIndex: 0
    } : null);
  }
  function y(a) {
    const g = l();
    if (g) {
      const R = n();
      if (a.key === "ArrowDown")
        a.preventDefault(), u((w) => w ? {
          ...w,
          selectedIndex: Math.min(w.selectedIndex + 1, R.length - 1)
        } : null);
      else if (a.key === "ArrowUp")
        a.preventDefault(), u((w) => w ? {
          ...w,
          selectedIndex: Math.max(w.selectedIndex - 1, 0)
        } : null);
      else if (a.key === "Enter") {
        a.preventDefault();
        const w = R[g.selectedIndex];
        w && p(w);
      } else a.key === "Escape" && (a.preventDefault(), u(null), e.set("palette", "query", ""));
      return;
    }
    const {
      results: x,
      selectedIndex: L
    } = e.state.palette;
    if (a.key === "ArrowDown")
      a.preventDefault(), e.set("palette", "selectedIndex", Math.min(L + 1, x.length - 1));
    else if (a.key === "ArrowUp")
      a.preventDefault(), e.set("palette", "selectedIndex", Math.max(L - 1, 0));
    else if (a.key === "Enter") {
      a.preventDefault();
      const R = x[L];
      R && I(R);
    } else a.key === "Escape" && (a.preventDefault(), e.state.palette.query ? e.set("palette", "query", "") : e.set("visible", false));
  }
  function p(a) {
    var x;
    const g = l();
    (x = g == null ? void 0 : g.onSelect) == null || x.call(g, a.key, a.item), u(null), e.set("palette", (L) => ({
      ...L,
      query: "",
      results: [],
      selectedIndex: 0
    }));
  }
  function I(a) {
    const g = a.item;
    if (g.type === "action")
      g.action(), e.set("palette", (x) => ({
        ...x,
        query: "",
        results: [],
        selectedIndex: 0
      })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
    else if (g.type === "input") {
      const x = ce(e.keyPrefix, "input", a.path.join(".")), L = x !== null ? {
        ...g,
        defaultValue: x
      } : g;
      e.set("palette", (R) => ({
        ...R,
        query: "",
        results: [],
        selectedIndex: 0,
        overlay: {
          type: "input",
          item: L,
          nodeKey: a.key,
          nodePath: a.path
        }
      }));
    } else if (g.type === "virtual") {
      let x = false;
      e.set("palette", "overlay", {
        type: "loading",
        item: g,
        nodeKey: a.key,
        cancel: () => {
          x = true;
        }
      }), g.load().then((L) => {
        if (!x)
          if (e.set("palette", "overlay", null), g.mode === "ephemeral") {
            const R = Object.entries(L).map(([w, B]) => ({
              key: w,
              item: B
            }));
            u({
              options: R,
              label: g.label,
              selectedIndex: 0,
              onSelect: g.onSelect
            }), e.set("palette", (w) => ({
              ...w,
              query: "",
              results: [],
              selectedIndex: 0
            }));
          } else {
            const R = Zt(e.getIndex(), L, a.path, a.pathLabels);
            e.setIndex(R);
            const w = e.state.palette.query;
            if (w) {
              const B = vt(R, w);
              e.set("palette", (P) => ({
                ...P,
                results: B
              }));
            }
          }
      }).catch((L) => {
        e.set("palette", "overlay", {
          type: "error",
          message: L instanceof Error ? L.message : "Load failed."
        });
      });
    }
  }
  const h = () => e.state.meta.palettePin, v = solidJs.createMemo(() => e.state.visible && e.state.mode === "palette");
  return solidJs.createEffect(() => {
    Ne() && console.log(`[Rove:Palette:${e.keyPrefix}] visible=${v()}`);
  }), [web.createComponent(solidJs.Show, {
    get when() {
      return Ne();
    },
    get children() {
      var a = nr(), g = a.firstChild, x = g.nextSibling, L = x.nextSibling, R = L.nextSibling;
      return R.nextSibling, a.style.setProperty("position", "fixed"), a.style.setProperty("top", "8px"), a.style.setProperty("color", "#fff"), a.style.setProperty("font-size", "10px"), a.style.setProperty("font-family", "monospace"), a.style.setProperty("padding", "3px 10px"), a.style.setProperty("border-radius", "20px"), a.style.setProperty("z-index", "99999999"), a.style.setProperty("pointer-events", "none"), a.style.setProperty("line-height", "1.6"), web.insert(a, () => e.keyPrefix, x), web.insert(a, () => String(v()), R), web.insert(a, (() => {
        var w = web.memo(() => !!l());
        return () => w() ? l().label : "none";
      })(), null), web.effect((w) => {
        var B = e.keyPrefix.length <= 4 ? "8px" : "auto", P = e.keyPrefix.length <= 4 ? "auto" : "8px", _ = v() ? "#00c853" : "#c62828";
        return B !== w.e && ((w.e = B) != null ? a.style.setProperty("left", B) : a.style.removeProperty("left")), P !== w.t && ((w.t = P) != null ? a.style.setProperty("right", P) : a.style.removeProperty("right")), _ !== w.a && ((w.a = _) != null ? a.style.setProperty("background", _) : a.style.removeProperty("background")), w;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      }), a;
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return v();
    },
    get children() {
      var a = ar(), g = a.firstChild, x = g.firstChild, L = x.nextSibling, R = g.nextSibling;
      a.style.setProperty("position", "fixed"), a.style.setProperty("left", "50%"), a.style.setProperty("width", "50vw"), a.style.setProperty("max-width", "700px"), a.style.setProperty("min-width", "300px"), a.style.setProperty("z-index", "var(--rove-z-index)"), a.style.setProperty("background", "var(--rove-bg)"), a.style.setProperty("border", "1px solid var(--rove-border)"), a.style.setProperty("border-radius", "var(--rove-border-radius)"), a.style.setProperty("box-shadow", "var(--rove-shadow)"), web.setAttribute(a, "aria-expanded", true), web.insert(a, web.createComponent(solidJs.Show, {
        get when() {
          return Ne();
        },
        get children() {
          var P = or(), _ = P.firstChild, Y = _.nextSibling;
          return Y.nextSibling, P.style.setProperty("background", "red"), P.style.setProperty("color", "white"), P.style.setProperty("font-size", "10px"), P.style.setProperty("padding", "2px 6px"), P.style.setProperty("font-family", "monospace"), web.insert(P, () => e.keyPrefix, Y), web.insert(P, h, null), P;
        }
      }), g), web.insert(a, web.createComponent(solidJs.Show, {
        get when() {
          return l() !== null;
        },
        get children() {
          var P = sr(), _ = P.firstChild;
          _.firstChild;
          var Y = _.nextSibling;
          return P.style.setProperty("padding", "6px 14px"), P.style.setProperty("font-size", "11px"), P.style.setProperty("color", "var(--rove-accent)"), P.style.setProperty("background", "var(--rove-selected)"), P.style.setProperty("display", "flex"), P.style.setProperty("align-items", "center"), P.style.setProperty("gap", "6px"), _.style.setProperty("font-weight", "600"), web.insert(_, () => l().label, null), Y.style.setProperty("color", "var(--rove-text-dim)"), Y.style.setProperty("margin-left", "auto"), P;
        }
      }), g), g.style.setProperty("display", "flex"), g.style.setProperty("align-items", "center"), x.$$keydown = y, x.$$input = c;
      var w = t;
      typeof w == "function" ? web.use(w, x) : t = x, x.style.setProperty("flex", "1"), x.style.setProperty("padding", "10px 14px"), x.style.setProperty("border", "none"), x.style.setProperty("background", "transparent"), x.style.setProperty("color", "var(--rove-text)"), x.style.setProperty("font-size", "16px"), x.style.setProperty("outline", "none"), x.style.setProperty("min-width", "0"), L.$$click = () => e.set("mode", "dir"), L.style.setProperty("background", "none"), L.style.setProperty("border", "none"), L.style.setProperty("border-left", "1px solid var(--rove-border)"), L.style.setProperty("cursor", "pointer"), L.style.setProperty("color", "var(--rove-text-dim)"), L.style.setProperty("padding", "0 14px"), L.style.setProperty("font-size", "15px"), L.style.setProperty("line-height", "1"), L.style.setProperty("align-self", "stretch"), L.style.setProperty("display", "flex"), L.style.setProperty("align-items", "center");
      var B = r;
      return typeof B == "function" ? web.use(B, R) : r = R, R.style.setProperty("position", "absolute"), R.style.setProperty("width", "1px"), R.style.setProperty("height", "1px"), R.style.setProperty("overflow", "hidden"), R.style.setProperty("clip", "rect(0,0,0,0)"), R.style.setProperty("white-space", "nowrap"), web.insert(R, (() => {
        var P = web.memo(() => !!l());
        return () => P() ? `${n().length} options` : e.state.palette.results.length > 0 ? `${e.state.palette.results.length} results` : e.state.palette.query ? "No results" : "";
      })()), web.insert(a, web.createComponent(solidJs.Show, {
        get when() {
          return l() !== null;
        },
        get children() {
          var P = gt();
          return P.style.setProperty("max-height", "50vh"), P.style.setProperty("overflow-y", "auto"), P.style.setProperty("border-top", "1px solid var(--rove-border)"), web.insert(P, web.createComponent(solidJs.For, {
            get each() {
              return n();
            },
            children: (_, Y) => {
              const se = () => {
                var O;
                return Y() === (((O = l()) == null ? void 0 : O.selectedIndex) ?? -1);
              };
              return (() => {
                var O = cr();
                return O.addEventListener("mouseleave", (Z) => {
                  Z.currentTarget.style.background = se() ? "var(--rove-selected)" : "";
                }), O.addEventListener("mouseenter", (Z) => {
                  se() || (Z.currentTarget.style.background = "var(--rove-hover)");
                }), O.$$click = () => p(_), O.style.setProperty("display", "flex"), O.style.setProperty("align-items", "center"), O.style.setProperty("padding", "8px 14px"), O.style.setProperty("cursor", "pointer"), O.style.setProperty("color", "var(--rove-text)"), O.style.setProperty("font-size", "14px"), web.insert(O, () => "label" in _.item ? _.item.label : _.key), web.effect((Z) => {
                  var ue = se(), de = se() ? "var(--rove-selected)" : "transparent";
                  return ue !== Z.e && web.setAttribute(O, "aria-selected", Z.e = ue), de !== Z.t && ((Z.t = de) != null ? O.style.setProperty("background", de) : O.style.removeProperty("background")), Z;
                }, {
                  e: void 0,
                  t: void 0
                }), O;
              })();
            }
          }), null), web.insert(P, web.createComponent(solidJs.Show, {
            get when() {
              return n().length === 0;
            },
            get children() {
              var _ = ir();
              return _.style.setProperty("padding", "8px 14px"), _.style.setProperty("color", "var(--rove-text-dim)"), _.style.setProperty("font-size", "13px"), _;
            }
          }), null), P;
        }
      }), null), web.insert(a, web.createComponent(solidJs.Show, {
        get when() {
          return l() === null;
        },
        get children() {
          var P = gt();
          return P.style.setProperty("max-height", "50vh"), P.style.setProperty("overflow-y", "auto"), web.insert(P, web.createComponent(solidJs.For, {
            get each() {
              return e.state.palette.results;
            },
            children: (_, Y) => web.createComponent(lr, {
              result: _,
              get selected() {
                return Y() === e.state.palette.selectedIndex;
              },
              onActivate: () => I(_)
            })
          })), web.effect((_) => (_ = e.state.palette.results.length > 0 ? "1px solid var(--rove-border)" : "none") != null ? P.style.setProperty("border-top", _) : P.style.removeProperty("border-top")), P;
        }
      }), null), web.effect((P) => {
        var _ = h() === "top" ? "0" : h() === "middle" ? "50%" : "auto", Y = h() === "bottom" ? "0" : "auto", se = h() === "middle" ? "translate(-50%, -50%)" : "translateX(-50%)", O = l() ? "Filter…" : "Search…";
        return _ !== P.e && ((P.e = _) != null ? a.style.setProperty("top", _) : a.style.removeProperty("top")), Y !== P.t && ((P.t = Y) != null ? a.style.setProperty("bottom", Y) : a.style.removeProperty("bottom")), se !== P.a && ((P.a = se) != null ? a.style.setProperty("transform", se) : a.style.removeProperty("transform")), O !== P.o && web.setAttribute(x, "placeholder", P.o = O), P;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), web.effect(() => x.value = e.state.palette.query), a;
    }
  })];
}
web.delegateEvents(["input", "keydown", "click"]);
var dr = /* @__PURE__ */ web.template("<span>Select"), yr = /* @__PURE__ */ web.template('<div class=titlebar role=toolbar><button class=titlebar-btn aria-label="Go back">←</button><span class=titlebar-title><span></span></span><button class=titlebar-btn aria-label="Switch to palette view"title="Switch to palette view">⌕</button><button class=titlebar-btn aria-label="Reset window position"title="Reset position">□</button><button class=titlebar-btn aria-label=Close>×');
function pr(e) {
  return (() => {
    var t = yr(), r = t.firstChild, l = r.nextSibling, u = l.firstChild, n = l.nextSibling, c = n.nextSibling, y = c.nextSibling;
    return web.addEventListener(t, "mousedown", e.onDragStart, true), t.style.setProperty("display", "flex"), t.style.setProperty("align-items", "center"), t.style.setProperty("padding", "6px 8px"), t.style.setProperty("background", "var(--rove-surface)"), t.style.setProperty("border-bottom", "1px solid var(--rove-border)"), t.style.setProperty("cursor", "move"), t.style.setProperty("user-select", "none"), t.style.setProperty("gap", "6px"), r.$$mousedown = (p) => p.stopPropagation(), r.$$click = (p) => {
      p.stopPropagation(), e.onBack();
    }, r.style.setProperty("background", "none"), r.style.setProperty("border", "none"), r.style.setProperty("font-size", "14px"), r.style.setProperty("padding", "2px 6px"), l.style.setProperty("flex", "1"), l.style.setProperty("display", "flex"), l.style.setProperty("align-items", "center"), l.style.setProperty("justify-content", "center"), l.style.setProperty("gap", "6px"), l.style.setProperty("overflow", "hidden"), l.style.setProperty("font-weight", "500"), l.style.setProperty("font-size", "13px"), l.style.setProperty("color", "var(--rove-text)"), web.insert(l, web.createComponent(solidJs.Show, {
      get when() {
        return e.ephemeral;
      },
      get children() {
        var p = dr();
        return p.style.setProperty("font-size", "10px"), p.style.setProperty("font-weight", "600"), p.style.setProperty("color", "var(--rove-accent)"), p.style.setProperty("background", "var(--rove-selected)"), p.style.setProperty("padding", "1px 6px"), p.style.setProperty("border-radius", "10px"), p.style.setProperty("white-space", "nowrap"), p.style.setProperty("flex-shrink", "0"), p;
      }
    }), u), u.style.setProperty("overflow", "hidden"), u.style.setProperty("text-overflow", "ellipsis"), u.style.setProperty("white-space", "nowrap"), web.insert(u, () => e.title), n.$$mousedown = (p) => p.stopPropagation(), n.$$click = (p) => {
      p.stopPropagation(), e.onModeSwap();
    }, n.style.setProperty("background", "none"), n.style.setProperty("border", "none"), n.style.setProperty("cursor", "pointer"), n.style.setProperty("color", "var(--rove-text-dim)"), n.style.setProperty("font-size", "14px"), n.style.setProperty("padding", "2px 6px"), c.$$mousedown = (p) => p.stopPropagation(), c.$$click = (p) => {
      p.stopPropagation(), e.onReset();
    }, c.style.setProperty("background", "none"), c.style.setProperty("border", "none"), c.style.setProperty("cursor", "pointer"), c.style.setProperty("color", "var(--rove-text-dim)"), c.style.setProperty("font-size", "12px"), c.style.setProperty("padding", "2px 6px"), y.$$mousedown = (p) => p.stopPropagation(), y.$$click = (p) => {
      p.stopPropagation(), e.onClose();
    }, y.style.setProperty("background", "none"), y.style.setProperty("border", "none"), y.style.setProperty("cursor", "pointer"), y.style.setProperty("color", "var(--rove-text-dim)"), y.style.setProperty("font-size", "16px"), y.style.setProperty("padding", "2px 6px"), web.effect((p) => {
      var I = !e.canGoBack, h = e.canGoBack ? "pointer" : "default", v = e.canGoBack ? "var(--rove-text)" : "var(--rove-text-dim)";
      return I !== p.e && (r.disabled = p.e = I), h !== p.t && ((p.t = h) != null ? r.style.setProperty("cursor", h) : r.style.removeProperty("cursor")), v !== p.a && ((p.a = v) != null ? r.style.setProperty("color", v) : r.style.removeProperty("color")), p;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), t;
  })();
}
web.delegateEvents(["mousedown", "click"]);
var fr = /* @__PURE__ */ web.template('<nav class=breadcrumbs aria-label="Directory path">'), hr = /* @__PURE__ */ web.template("<span>/"), vr = /* @__PURE__ */ web.template("<button>"), gr = /* @__PURE__ */ web.template("<span>…");
function mr(e) {
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
    }] : r.map((l, u) => ({
      label: l,
      index: u - 1
    }));
  };
  return (() => {
    var r = fr();
    return r.style.setProperty("display", "flex"), r.style.setProperty("align-items", "center"), r.style.setProperty("gap", "2px"), r.style.setProperty("padding", "4px 8px"), r.style.setProperty("font-size", "11px"), r.style.setProperty("color", "var(--rove-text-dim)"), r.style.setProperty("border-bottom", "1px solid var(--rove-border)"), r.style.setProperty("flex-wrap", "wrap"), web.insert(r, web.createComponent(solidJs.For, {
      get each() {
        return t();
      },
      children: (l, u) => [web.createComponent(solidJs.Show, {
        get when() {
          return u() > 0;
        },
        get children() {
          var n = hr();
          return n.style.setProperty("color", "var(--rove-text-dim)"), n;
        }
      }), web.createComponent(solidJs.Show, {
        get when() {
          return l.index !== -2;
        },
        get fallback() {
          return (() => {
            var n = gr();
            return n.style.setProperty("color", "var(--rove-text-dim)"), n;
          })();
        },
        get children() {
          var n = vr();
          return n.$$click = () => e.onNavigateTo(l.index), n.style.setProperty("background", "none"), n.style.setProperty("border", "none"), n.style.setProperty("cursor", "pointer"), n.style.setProperty("color", "var(--rove-accent)"), n.style.setProperty("font-size", "inherit"), n.style.setProperty("padding", "0 2px"), n.style.setProperty("text-decoration", "underline"), web.insert(n, () => l.label), n;
        }
      })]
    })), r;
  })();
}
web.delegateEvents(["click"]);
var xr = /* @__PURE__ */ web.template("<div role=listbox class=dirview-items>"), br = /* @__PURE__ */ web.template("<div>/"), Pr = /* @__PURE__ */ web.template('<div class=dirview-container role=navigation aria-label="Directory navigator"tabindex=0><div class=dirview-resize>'), wr = /* @__PURE__ */ web.template("<textarea class=dirview-inline-field>"), $r = /* @__PURE__ */ web.template("<input type=text class=dirview-inline-field>"), kr = /* @__PURE__ */ web.template("<div class=dirview-inline><label class=dirview-inline-label></label><span class=dirview-inline-hint>"), _r = /* @__PURE__ */ web.template("<div role=listbox>"), Sr = /* @__PURE__ */ web.template("<div class=dirview-multiselect-footer> selected · Enter to save · Esc to cancel"), Er = /* @__PURE__ */ web.template("<div role=option><span>.</span><span></span><span>"), Cr = /* @__PURE__ */ web.template("<span>"), Tr = /* @__PURE__ */ web.template("<span>✓"), Ir = /* @__PURE__ */ web.template("<span>→"), Lr = /* @__PURE__ */ web.template("<div class=dirview-item role=option><span>.</span><span>");
const Ze = 9, Ar = 200, Mr = 150;
function Dr(e) {
  let t, r, l = false, u = false, n = 0, c = 0;
  const [y, p] = solidJs.createSignal(null), [I, h] = solidJs.createSignal(null), [v, a] = solidJs.createSignal(""), [g, x] = solidJs.createSignal(null), [L, R] = solidJs.createSignal(0);
  solidJs.createEffect(() => {
    if (!I()) {
      r = void 0;
      return;
    }
    requestAnimationFrame(() => {
      var i;
      const o = r;
      if (!o) return;
      o.focus();
      const d = o.value.length;
      (i = o.setSelectionRange) == null || i.call(o, d, d);
    });
  });
  const w = () => e.state.nav.history, B = () => w()[w().length - 1], P = () => {
    var s;
    return ((s = B()) == null ? void 0 : s.node) ?? {};
  }, _ = () => w().slice(1).map((s) => s.key), Y = () => w().slice(1).map((s) => s.label), se = () => w().length > 1 || I() !== null || g() !== null, O = () => {
    var s, o, d;
    return ((s = I()) == null ? void 0 : s.item.label) ?? ((o = g()) == null ? void 0 : o.item.label) ?? ((d = B()) == null ? void 0 : d.label) ?? "Root";
  };
  function Z(s) {
    return Math.max(1, Math.ceil(Object.keys(s).length / Ze));
  }
  function ue(s, o, d) {
    const i = {
      key: s,
      label: d,
      node: o
    };
    e.set("nav", (f) => ({
      ...f,
      history: [...f.history, i],
      page: 1,
      totalPages: Z(o)
    }));
  }
  function de(s) {
    const o = w().slice(0, s.returnHistoryLength), d = o[o.length - 1];
    e.set("nav", (i) => ({
      ...i,
      history: o,
      page: 1,
      totalPages: Z((d == null ? void 0 : d.node) ?? {})
    })), p(null), t == null || t.focus();
  }
  function Ke() {
    if (I()) {
      h(null), t == null || t.focus();
      return;
    }
    if (g()) {
      x(null), t == null || t.focus();
      return;
    }
    const s = w();
    if (s.length <= 1) return;
    const o = y();
    if (o && s.length <= o.returnHistoryLength + 1) {
      de(o);
      return;
    }
    const d = s.slice(0, -1), i = d[d.length - 1];
    e.set("nav", (f) => ({
      ...f,
      history: d,
      page: 1,
      totalPages: Z((i == null ? void 0 : i.node) ?? {})
    }));
  }
  function Fe(s) {
    if (I()) {
      h(null);
      return;
    }
    if (g()) {
      x(null);
      return;
    }
    const o = w(), d = s === -1 ? [o[0]] : o.slice(0, s + 2), i = d[d.length - 1];
    e.set("nav", (C) => ({
      ...C,
      history: d,
      page: 1,
      totalPages: Z((i == null ? void 0 : i.node) ?? {})
    }));
    const f = y();
    f && d.length <= f.returnHistoryLength && p(null);
  }
  solidJs.onMount(() => {
    const s = ce(e.keyPrefix, "window", "state");
    s && e.set("window", s);
  }), solidJs.createEffect(() => {
    if (!j()) return;
    const s = t;
    s && (s.addEventListener("keydown", Xe), solidJs.onCleanup(() => s.removeEventListener("keydown", Xe)));
  }), solidJs.createEffect(() => $e(e.keyPrefix, "window", "state", e.state.window));
  const Oe = solidJs.createMemo(() => Object.entries(P()).map(([s, o]) => ({
    key: s,
    item: o
  }))), ae = solidJs.createMemo(() => Math.max(1, Math.ceil(Oe().length / Ze))), Ue = solidJs.createMemo(() => {
    const s = (e.state.nav.page - 1) * Ze;
    return Oe().slice(s, s + Ze);
  });
  solidJs.createEffect(() => {
    const s = ae();
    e.state.nav.totalPages !== s && e.set("nav", "totalPages", s);
  });
  function He(s, o) {
    L();
    const d = ce(e.keyPrefix, "input", [..._(), s].join(".")), i = d !== null ? d : o.defaultValue;
    return i == null ? "" : o.inputType === "checkbox" ? typeof i == "boolean" ? i ? "✓" : "○" : "" : o.inputType === "select-multiple" ? Array.isArray(i) && i.length > 0 ? `${i.join(", ")}` : "" : typeof i == "string" ? i : "";
  }
  function ge() {
    var d, i;
    const s = I();
    if (!s) return;
    const o = v();
    $e(e.keyPrefix, "input", s.nodePath.join("."), o), (i = (d = s.item).onChange) == null || i.call(d, o), h(null), R((f) => f + 1), t == null || t.focus();
  }
  function Ge() {
    var o, d;
    const s = g();
    s && ($e(e.keyPrefix, "input", s.nodePath.join("."), s.selected), (d = (o = s.item).onChange) == null || d.call(o, s.selected), x(null), R((i) => i + 1), t == null || t.focus());
  }
  function ke(s) {
    const o = g();
    if (!o) return;
    const d = o.item.options ?? [];
    if (s >= d.length) return;
    const i = d[s], f = o.selected.includes(i) ? o.selected.filter((C) => C !== i) : [...o.selected, i];
    x({
      ...o,
      selected: f
    });
  }
  function _e(s) {
    var f;
    const {
      key: o,
      item: d
    } = s, i = y();
    d.type === "directory" ? ue(o, d.children, d.label) : d.type === "action" ? (d.action(), i && ((f = i.onSelect) == null || f.call(i, o, d), de(i))) : d.type === "input" ? We(o, d) : d.type === "virtual" && je(o, d);
  }
  function We(s, o) {
    var f;
    const d = [..._(), s], i = ce(e.keyPrefix, "input", d.join("."));
    if (o.inputType === "checkbox") {
      const $ = !(i !== null ? i : o.defaultValue ?? false);
      $e(e.keyPrefix, "input", d.join("."), $), (f = o.onChange) == null || f.call(o, $), R((k) => k + 1);
    } else if (o.inputType === "text" || o.inputType === "textarea") {
      const C = i !== null ? i : o.defaultValue ?? "";
      a(C), h({
        key: s,
        nodePath: d,
        item: o
      });
    } else if (o.inputType === "select") {
      const C = i !== null ? i : o.defaultValue ?? "", $ = o.options ?? [], k = {};
      for (const N of $) {
        const m = N;
        k[m] = {
          type: "action",
          label: m,
          action: () => {
            var D;
            $e(e.keyPrefix, "input", d.join("."), m), (D = o.onChange) == null || D.call(o, m), R((q) => q + 1);
          }
        };
      }
      const E = w().length;
      ue(s, k, o.label), p({
        returnHistoryLength: E,
        selectedKey: C
      });
    } else if (o.inputType === "select-multiple") {
      const C = i !== null && Array.isArray(i) ? i : Array.isArray(o.defaultValue) ? o.defaultValue : [];
      x({
        key: s,
        nodePath: d,
        item: o,
        selected: [...C]
      });
    }
  }
  function je(s, o) {
    let d = false;
    e.set("palette", "overlay", {
      type: "loading",
      item: o,
      nodeKey: s,
      cancel: () => {
        d = true;
      }
    }), o.load().then((i) => {
      if (!d)
        if (e.set("palette", "overlay", null), o.mode === "ephemeral") {
          const f = w().length;
          ue(s, i, o.label), p({
            returnHistoryLength: f,
            onSelect: o.onSelect
          });
        } else
          ue(s, i, o.label);
    }).catch((i) => {
      e.set("palette", "overlay", {
        type: "error",
        message: i instanceof Error ? i.message : "Load failed."
      });
    });
  }
  function Xe(s) {
    if (e.state.mode !== "dir" || !e.state.visible) return;
    const o = s.target;
    if (o.tagName === "INPUT" || o.tagName === "TEXTAREA") {
      s.key === "Escape" && (s.preventDefault(), h(null), t == null || t.focus());
      return;
    }
    if (g()) {
      if (s.key === "Enter") {
        s.preventDefault(), Ge();
        return;
      }
      if (s.key === "Escape") {
        s.preventDefault(), x(null), t == null || t.focus();
        return;
      }
      const f = s.code.match(/^(?:Digit|Numpad)([1-9])$/), C = f ? parseInt(f[1]) : NaN;
      isNaN(C) || (s.preventDefault(), ke(C - 1));
      return;
    }
    if (s.key === "Escape") {
      s.preventDefault();
      const f = y();
      f ? de(f) : e.set("visible", false);
      return;
    }
    if (s.key === "Backspace") {
      s.preventDefault(), Ke();
      return;
    }
    const d = s.code.match(/^(?:Digit|Numpad)([1-9])$/), i = d ? parseInt(d[1]) : NaN;
    if (!isNaN(i)) {
      s.preventDefault();
      const f = e.state.nav.page, C = ae();
      if (i === 1 && f > 1) {
        e.set("nav", "page", f - 1);
        return;
      }
      if (i === 9 && f < C) {
        e.set("nav", "page", f + 1);
        return;
      }
      const $ = i - 1, k = Ue();
      $ < k.length && _e(k[$]);
    }
  }
  function Je(s) {
    if (!t) return;
    l = true;
    const o = t.getBoundingClientRect();
    n = s.clientX - o.left, c = s.clientY - o.top;
    const d = (f) => {
      l && e.set("window", (C) => ({
        ...C,
        x: Math.max(-C.width + 50, Math.min(f.clientX - n, window.innerWidth - 50)),
        y: Math.max(0, Math.min(f.clientY - c, window.innerHeight - 50))
      }));
    }, i = () => {
      l = false, document.removeEventListener("mousemove", d), document.removeEventListener("mouseup", i);
    };
    document.addEventListener("mousemove", d), document.addEventListener("mouseup", i);
  }
  function S(s) {
    s.preventDefault(), s.stopPropagation(), u = true;
    const o = s.clientX, d = s.clientY, i = e.state.window.width, f = e.state.window.height, C = (k) => {
      u && e.set("window", (E) => ({
        ...E,
        width: Math.max(Ar, i + (k.clientX - o)),
        height: Math.max(Mr, f + (k.clientY - d))
      }));
    }, $ = () => {
      u = false, document.removeEventListener("mousemove", C), document.removeEventListener("mouseup", $);
    };
    document.addEventListener("mousemove", C), document.addEventListener("mouseup", $);
  }
  function z() {
    e.set("window", {
      x: Math.round(window.innerWidth * 0.375),
      y: Math.round(window.innerHeight * 0.375),
      width: Math.round(window.innerWidth * 0.25),
      height: Math.round(window.innerHeight * 0.25)
    });
  }
  const j = solidJs.createMemo(() => e.state.visible && e.state.mode === "dir");
  return solidJs.createEffect(() => {
    j() && e.state.palette.overlay === null && !I() && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    Ne() && console.log(`[Rove:DirView:${e.keyPrefix}] visible=${j()}`);
  }), web.createComponent(solidJs.Show, {
    get when() {
      return j();
    },
    get children() {
      var s = Pr(), o = s.firstChild, d = t;
      return typeof d == "function" ? web.use(d, s) : t = s, s.style.setProperty("position", "fixed"), s.style.setProperty("z-index", "var(--rove-z-index)"), s.style.setProperty("background", "var(--rove-bg)"), s.style.setProperty("border", "1px solid var(--rove-border)"), s.style.setProperty("border-radius", "var(--rove-border-radius)"), s.style.setProperty("box-shadow", "var(--rove-shadow)"), s.style.setProperty("display", "flex"), s.style.setProperty("flex-direction", "column"), s.style.setProperty("overflow", "hidden"), s.style.setProperty("min-width", "200px"), s.style.setProperty("min-height", "150px"), web.insert(s, web.createComponent(pr, {
        get title() {
          return O();
        },
        get canGoBack() {
          return se();
        },
        get ephemeral() {
          return y() !== null;
        },
        onBack: Ke,
        onModeSwap: () => e.set("mode", "palette"),
        onClose: () => e.set("visible", false),
        onReset: z,
        onDragStart: Je
      }), o), web.insert(s, web.createComponent(mr, {
        get pathLabels() {
          return Y();
        },
        onNavigateTo: Fe
      }), o), web.insert(s, web.createComponent(solidJs.Switch, {
        get children() {
          return [web.createComponent(solidJs.Match, {
            get when() {
              return I();
            },
            children: (i) => (() => {
              var f = kr(), C = f.firstChild, $ = C.nextSibling;
              return web.insert(C, () => i().item.label), web.insert(f, web.createComponent(solidJs.Show, {
                get when() {
                  return i().item.inputType === "textarea";
                },
                get children() {
                  var k = wr();
                  return k.$$keydown = (E) => {
                    E.key === "Enter" && (E.ctrlKey || E.metaKey) && (E.preventDefault(), ge());
                  }, k.$$input = (E) => a(E.currentTarget.value), web.use((E) => {
                    r = E;
                  }, k), web.effect(() => k.value = v()), k;
                }
              }), $), web.insert(f, web.createComponent(solidJs.Show, {
                get when() {
                  return i().item.inputType === "text";
                },
                get children() {
                  var k = $r();
                  return k.$$keydown = (E) => {
                    E.key === "Enter" && (E.preventDefault(), ge());
                  }, k.$$input = (E) => a(E.currentTarget.value), web.use((E) => {
                    r = E;
                  }, k), web.effect(() => k.value = v()), k;
                }
              }), $), web.insert($, () => i().item.inputType === "textarea" ? "Ctrl+Enter to save · Esc to cancel" : "Enter to save · Esc to cancel"), f;
            })()
          }), web.createComponent(solidJs.Match, {
            get when() {
              return g();
            },
            children: (i) => [(() => {
              var f = _r();
              return f.style.setProperty("flex", "1"), f.style.setProperty("overflow-y", "auto"), f.style.setProperty("padding", "4px 0"), web.insert(f, web.createComponent(solidJs.For, {
                get each() {
                  return i().item.options ?? [];
                },
                children: (C, $) => {
                  const k = () => i().selected.includes(C);
                  return (() => {
                    var E = Er(), N = E.firstChild, m = N.firstChild, D = N.nextSibling, q = D.nextSibling;
                    return E.addEventListener("mouseleave", (A) => A.currentTarget.style.background = ""), E.addEventListener("mouseenter", (A) => A.currentTarget.style.background = "var(--rove-hover)"), E.$$click = () => ke($()), E.style.setProperty("display", "flex"), E.style.setProperty("align-items", "center"), E.style.setProperty("gap", "8px"), E.style.setProperty("padding", "6px 12px"), E.style.setProperty("cursor", "pointer"), E.style.setProperty("color", "var(--rove-text)"), N.style.setProperty("color", "var(--rove-text-dim)"), N.style.setProperty("font-size", "11px"), N.style.setProperty("min-width", "14px"), web.insert(N, () => $() + 1, m), D.style.setProperty("min-width", "14px"), D.style.setProperty("font-size", "13px"), web.insert(D, () => k() ? "☑" : "☐"), q.style.setProperty("flex", "1"), web.insert(q, C), web.effect((A) => {
                      var V = k(), H = k() ? "var(--rove-accent)" : "var(--rove-text-dim)";
                      return V !== A.e && web.setAttribute(E, "aria-selected", A.e = V), H !== A.t && ((A.t = H) != null ? D.style.setProperty("color", H) : D.style.removeProperty("color")), A;
                    }, {
                      e: void 0,
                      t: void 0
                    }), E;
                  })();
                }
              })), f;
            })(), (() => {
              var f = Sr(), C = f.firstChild;
              return web.insert(f, () => i().selected.length, C), f;
            })()]
          }), web.createComponent(solidJs.Match, {
            when: true,
            get children() {
              return [(() => {
                var i = xr();
                return i.style.setProperty("flex", "1"), i.style.setProperty("overflow-y", "auto"), i.style.setProperty("padding", "4px 0"), web.insert(i, web.createComponent(solidJs.For, {
                  get each() {
                    return Ue();
                  },
                  children: (f, C) => (() => {
                    var $ = Lr(), k = $.firstChild, E = k.firstChild, N = k.nextSibling;
                    return $.addEventListener("mouseleave", (m) => m.currentTarget.style.background = ""), $.addEventListener("mouseenter", (m) => m.currentTarget.style.background = "var(--rove-hover)"), $.$$click = () => _e(f), web.setAttribute($, "aria-selected", false), $.style.setProperty("display", "flex"), $.style.setProperty("align-items", "center"), $.style.setProperty("gap", "8px"), $.style.setProperty("padding", "6px 12px"), $.style.setProperty("cursor", "pointer"), $.style.setProperty("color", "var(--rove-text)"), k.style.setProperty("color", "var(--rove-text-dim)"), k.style.setProperty("font-size", "11px"), k.style.setProperty("min-width", "14px"), web.insert(k, () => C() + 1, E), N.style.setProperty("flex", "1"), web.insert(N, () => "label" in f.item ? f.item.label : f.key), web.insert($, web.createComponent(solidJs.Show, {
                      get when() {
                        return f.item.type === "input";
                      },
                      get children() {
                        var m = Cr();
                        return m.style.setProperty("font-size", "11px"), m.style.setProperty("color", "var(--rove-text-dim)"), m.style.setProperty("max-width", "80px"), m.style.setProperty("overflow", "hidden"), m.style.setProperty("text-overflow", "ellipsis"), m.style.setProperty("white-space", "nowrap"), web.insert(m, () => He(f.key, f.item)), m;
                      }
                    }), null), web.insert($, web.createComponent(solidJs.Show, {
                      get when() {
                        var m;
                        return ((m = y()) == null ? void 0 : m.selectedKey) === f.key;
                      },
                      get children() {
                        var m = Tr();
                        return m.style.setProperty("color", "var(--rove-accent)"), m.style.setProperty("font-size", "13px"), m;
                      }
                    }), null), web.insert($, web.createComponent(solidJs.Show, {
                      get when() {
                        return f.item.type === "directory" || f.item.type === "virtual" || f.item.type === "input" && f.item.inputType === "select" || f.item.type === "input" && f.item.inputType === "select-multiple";
                      },
                      get children() {
                        var m = Ir();
                        return m.style.setProperty("color", "var(--rove-text-dim)"), m;
                      }
                    }), null), $;
                  })()
                })), i;
              })(), web.createComponent(solidJs.Show, {
                get when() {
                  return ae() > 1;
                },
                get children() {
                  var i = br(), f = i.firstChild;
                  return i.style.setProperty("padding", "4px 12px"), i.style.setProperty("font-size", "11px"), i.style.setProperty("color", "var(--rove-text-dim)"), i.style.setProperty("border-top", "1px solid var(--rove-border)"), i.style.setProperty("text-align", "center"), web.insert(i, () => e.state.nav.page, f), web.insert(i, ae, null), i;
                }
              })];
            }
          })];
        }
      }), o), o.$$mousedown = S, o.style.setProperty("position", "absolute"), o.style.setProperty("bottom", "0"), o.style.setProperty("right", "0"), o.style.setProperty("width", "12px"), o.style.setProperty("height", "12px"), o.style.setProperty("cursor", "se-resize"), o.style.setProperty("background", "var(--rove-text-dim)"), o.style.setProperty("clip-path", "polygon(100% 0, 100% 100%, 0 100%)"), o.style.setProperty("opacity", "0.4"), web.effect((i) => {
        var f = `${e.state.window.x}px`, C = `${e.state.window.y}px`, $ = `${e.state.window.width}px`, k = `${e.state.window.height}px`;
        return f !== i.e && ((i.e = f) != null ? s.style.setProperty("left", f) : s.style.removeProperty("left")), C !== i.t && ((i.t = C) != null ? s.style.setProperty("top", C) : s.style.removeProperty("top")), $ !== i.a && ((i.a = $) != null ? s.style.setProperty("width", $) : s.style.removeProperty("width")), k !== i.o && ((i.o = k) != null ? s.style.setProperty("height", k) : s.style.removeProperty("height")), i;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), s;
    }
  });
}
web.delegateEvents(["mousedown", "input", "keydown", "click"]);
var Rr = /* @__PURE__ */ web.template("<div class=modal-loading><span>Loading…</span><button>Dismiss"), zr = /* @__PURE__ */ web.template("<div class=modal-error><p></p><button>Close"), Hr = /* @__PURE__ */ web.template("<div class=modal-backdrop><div class=modal-sheet role=dialog aria-modal=true>"), jr = /* @__PURE__ */ web.template("<input type=text class=modal-input-field>"), qr = /* @__PURE__ */ web.template('<textarea class="modal-input-field modal-textarea">'), Br = /* @__PURE__ */ web.template("<input type=checkbox class=modal-input-checkbox>"), Nr = /* @__PURE__ */ web.template("<select class=modal-input-field>"), Vr = /* @__PURE__ */ web.template("<select multiple class=modal-input-field>"), Kr = /* @__PURE__ */ web.template('<div class=modal-input><label class=modal-label></label><div class=modal-actions><button class="modal-btn modal-btn--primary">Accept <kbd>Ctrl+Enter</kbd></button><button class=modal-btn>Cancel <kbd>Esc'), mt = /* @__PURE__ */ web.template("<option>");
function xt(e) {
  return Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((t) => !t.hasAttribute("disabled"));
}
function Or(e) {
  let t, r = null;
  solidJs.onMount(() => {
    r = document.activeElement;
    const n = xt(t);
    n[0] && n[0].focus();
  }), solidJs.onCleanup(() => {
    r instanceof HTMLElement && r.focus();
  });
  function l(n) {
    var h;
    if (n.key !== "Tab") return;
    const c = xt(t);
    if (c.length === 0) return;
    const y = c[0], p = c[c.length - 1], I = (h = t.ownerDocument) == null ? void 0 : h.activeElement;
    n.shiftKey && I === y ? (n.preventDefault(), p.focus()) : !n.shiftKey && I === p && (n.preventDefault(), y.focus());
  }
  function u(n) {
    l(n), n.key === "Escape" && (n.preventDefault(), e.onCancel());
  }
  return (() => {
    var n = Hr(), c = n.firstChild;
    web.addEventListener(n, "click", e.onCancel, true), n.style.setProperty("position", "fixed"), n.style.setProperty("inset", "0"), n.style.setProperty("background", "rgba(0,0,0,0.45)"), n.style.setProperty("z-index", "1000000"), n.style.setProperty("display", "flex"), n.style.setProperty("align-items", "center"), n.style.setProperty("justify-content", "center"), c.$$click = (p) => p.stopPropagation(), c.$$keydown = u;
    var y = t;
    return typeof y == "function" ? web.use(y, c) : t = c, c.style.setProperty("background", "var(--rove-bg)"), c.style.setProperty("border", "1px solid var(--rove-border)"), c.style.setProperty("border-radius", "var(--rove-border-radius)"), c.style.setProperty("box-shadow", "var(--rove-shadow)"), c.style.setProperty("width", "90%"), c.style.setProperty("max-width", "460px"), c.style.setProperty("padding", "20px 24px"), c.style.setProperty("max-height", "80vh"), c.style.setProperty("overflow-y", "auto"), web.insert(c, web.createComponent(solidJs.Switch, {
      get children() {
        return [web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "input";
          },
          get children() {
            return web.createComponent(Ur, {
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
            var p = Rr(), I = p.firstChild, h = I.nextSibling;
            return web.addEventListener(h, "click", e.onCancel, true), p;
          }
        }), web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "error";
          },
          get children() {
            var p = zr(), I = p.firstChild, h = I.nextSibling;
            return web.insert(I, () => e.overlay.message), web.addEventListener(h, "click", e.onCancel, true), p;
          }
        })];
      }
    })), n;
  })();
}
function Ur(e) {
  const t = () => {
    const n = e.item.defaultValue;
    return n !== void 0 ? n : e.item.inputType === "checkbox" ? false : e.item.inputType === "select-multiple" ? [] : "";
  }, [r, l] = solidJs.createSignal(t()), u = e.item.inputType;
  return (() => {
    var n = Kr(), c = n.firstChild, y = c.nextSibling, p = y.firstChild, I = p.nextSibling;
    return web.insert(c, () => e.item.label), web.insert(n, web.createComponent(solidJs.Show, {
      when: u === "text",
      get children() {
        var h = jr();
        return h.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, h.addEventListener("focus", (v) => {
          const a = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(a, a);
        }), h.$$input = (v) => l(v.currentTarget.value), web.effect(() => h.value = r()), h;
      }
    }), y), web.insert(n, web.createComponent(solidJs.Show, {
      when: u === "textarea",
      get children() {
        var h = qr();
        return h.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, h.addEventListener("focus", (v) => {
          const a = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(a, a);
        }), h.$$input = (v) => l(v.currentTarget.value), web.insert(h, () => r()), h;
      }
    }), y), web.insert(n, web.createComponent(solidJs.Show, {
      when: u === "checkbox",
      get children() {
        var h = Br();
        return h.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, h.addEventListener("change", (v) => l(v.currentTarget.checked)), web.effect(() => h.checked = r()), h;
      }
    }), y), web.insert(n, web.createComponent(solidJs.Show, {
      when: u === "select",
      get children() {
        var h = Nr();
        return h.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, h.addEventListener("change", (v) => l(v.currentTarget.value)), web.insert(h, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((a) => (() => {
            var g = mt();
            return g.value = a, web.insert(g, a), g;
          })());
        }), web.effect(() => h.value = r()), h;
      }
    }), y), web.insert(n, web.createComponent(solidJs.Show, {
      when: u === "select-multiple",
      get children() {
        var h = Vr();
        return h.addEventListener("change", (v) => {
          const a = Array.from(v.currentTarget.selectedOptions).map((g) => g.value);
          l(a);
        }), h.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, web.insert(h, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((a) => (() => {
            var g = mt();
            return g.value = a, web.insert(g, a), g;
          })());
        }), h;
      }
    }), y), p.$$click = () => e.onAccept(r()), web.addEventListener(I, "click", e.onCancel, true), n;
  })();
}
web.delegateEvents(["click", "keydown", "input"]);
var Gr = /* @__PURE__ */ web.template("<div><div>[<!>] visible=<!> mode=</div><div>theme=<!> navDepth=</div><div>palettePin=<!> overlay=");
const Wr = `
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

/* DirView focus ring */
.dirview-container:focus {
  outline: 2px solid var(--rove-accent);
  outline-offset: -2px;
}

/* DirView inline text/textarea input */
.dirview-inline {
  flex: 1; display: flex; flex-direction: column; padding: 12px; gap: 8px; overflow: hidden;
}
.dirview-inline-label {
  font-size: 11px; font-weight: 600; color: var(--rove-text-dim);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.dirview-inline-field {
  width: 100%; padding: 8px 10px; box-sizing: border-box;
  border: 1px solid var(--rove-border); border-radius: calc(var(--rove-border-radius) - 2px);
  background: var(--rove-input-bg); color: var(--rove-text);
  font-size: 14px; font-family: var(--rove-font-family); outline: none; resize: vertical;
}
.dirview-inline-field:focus { border-color: var(--rove-accent); }
.dirview-inline-hint { font-size: 11px; color: var(--rove-text-dim); }
.dirview-multiselect-footer {
  padding: 4px 12px; font-size: 11px; color: var(--rove-text-dim);
  border-top: 1px solid var(--rove-border); text-align: center;
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
function Xr(e) {
  const t = document.createElement("div");
  t.setAttribute("id", `rove-host-${e.keyPrefix}`), document.body.appendChild(t);
  const r = t.attachShadow({
    mode: "open"
  }), l = document.createElement("style");
  l.textContent = Wr, r.appendChild(l);
  const u = document.createElement("div");
  u.className = "rove-root", r.appendChild(u), t.tabIndex = -1, e.registry.setShadowHost(t);
  const n = window.matchMedia("(prefers-color-scheme: dark)"), c = e.state.meta.theme;
  t.setAttribute("data-theme", c === "system" ? n.matches ? "dark" : "light" : c);
  const y = web.render(() => web.createComponent(Yr, web.mergeProps(e, {
    shadowHost: t
  })), u);
  return {
    host: t,
    dispose: y
  };
}
function Yr(e) {
  const t = window.matchMedia("(prefers-color-scheme: dark)");
  function r() {
    const c = e.state.meta.theme;
    c === "system" ? e.shadowHost.setAttribute("data-theme", t.matches ? "dark" : "light") : e.shadowHost.setAttribute("data-theme", c);
  }
  solidJs.createEffect(r);
  const l = () => {
    e.state.meta.theme === "system" && r();
  };
  t.addEventListener("change", l), solidJs.onCleanup(() => t.removeEventListener("change", l));
  function u(c) {
    const y = e.state.palette.overlay;
    (y == null ? void 0 : y.type) === "input" && ($e(e.keyPrefix, "input", y.nodePath.join("."), c), y.item.onChange && y.item.onChange(c), e.set("palette", "overlay", null));
  }
  function n() {
    e.set("palette", "overlay", null);
  }
  return [web.createComponent(ur, {
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
  }), web.createComponent(Dr, {
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
      return web.createComponent(Or, {
        get overlay() {
          return e.state.palette.overlay;
        },
        get keyPrefix() {
          return e.keyPrefix;
        },
        onAccept: u,
        onCancel: n
      });
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return Ne();
    },
    get children() {
      var c = Gr(), y = c.firstChild, p = y.firstChild, I = p.nextSibling, h = I.nextSibling, v = h.nextSibling;
      v.nextSibling;
      var a = y.nextSibling, g = a.firstChild, x = g.nextSibling;
      x.nextSibling;
      var L = a.nextSibling, R = L.firstChild, w = R.nextSibling;
      return w.nextSibling, c.style.setProperty("position", "fixed"), c.style.setProperty("bottom", "4px"), c.style.setProperty("background", "#000"), c.style.setProperty("color", "#0f0"), c.style.setProperty("font-size", "10px"), c.style.setProperty("font-family", "monospace"), c.style.setProperty("padding", "3px 8px"), c.style.setProperty("z-index", "99999999"), c.style.setProperty("pointer-events", "none"), c.style.setProperty("border-radius", "3px"), c.style.setProperty("border", "1px solid #0f0"), c.style.setProperty("line-height", "1.8"), c.style.setProperty("opacity", "0.95"), web.insert(y, () => e.keyPrefix, I), web.insert(y, () => String(e.state.visible), v), web.insert(y, () => e.state.mode, null), web.insert(a, () => e.state.meta.theme, x), web.insert(a, () => e.state.nav.history.length - 1, null), web.insert(L, () => e.state.meta.palettePin, w), web.insert(L, () => {
        var B;
        return String(((B = e.state.palette.overlay) == null ? void 0 : B.type) ?? "null");
      }, null), web.effect((B) => {
        var P = e.keyPrefix.length <= 4 ? "4px" : "auto", _ = e.keyPrefix.length <= 4 ? "auto" : "4px";
        return P !== B.e && ((B.e = P) != null ? c.style.setProperty("left", P) : c.style.removeProperty("left")), _ !== B.t && ((B.t = _) != null ? c.style.setProperty("right", _) : c.style.removeProperty("right")), B;
      }, {
        e: void 0,
        t: void 0
      }), c;
    }
  })];
}
function Zr(e, t) {
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
  t.type === "directory" && kt(t.children);
}
function kt(e) {
  if ("meta" in e)
    throw new Error("Rove: 'meta' is a reserved node key.");
  for (const [t, r] of Object.entries(e))
    Zr(t, r);
}
function Fr(e) {
  if (!e.keyPrefix)
    throw new Error("Rove: 'keyPrefix' is required.");
  kt(e.tree);
  const t = Mt(e), [r, l] = zt(t), u = new qt(), n = Ft(e.keyPrefix, l, u), c = { ...e.tree, meta: n };
  let y = Yt(c);
  function p() {
    return y;
  }
  function I(w) {
    y = w;
  }
  l("nav", {
    history: [{ key: "", label: "Root", node: c }],
    page: 1,
    totalPages: Math.max(1, Math.ceil(Object.keys(c).length / 9))
  });
  const { host: h, dispose: v } = Xr({
    state: r,
    set: l,
    registry: u,
    keyPrefix: e.keyPrefix,
    onDestroy: R,
    getIndex: p,
    setIndex: I,
    rootTree: c
  });
  u.registerGlobal(t.globalShortcut, "global-toggle", (w) => {
    var B, P;
    w.preventDefault(), r.mode === "palette" ? l("visible", !r.visible) : r.visible ? document.activeElement !== h && ((B = h.shadowRoot) == null ? void 0 : B.activeElement) == null ? (((P = h.shadowRoot) == null ? void 0 : P.querySelector(
      'input:not([type="hidden"]), textarea, [tabindex="0"]'
    )) ?? h).focus() : l("visible", false) : (l("visible", true), requestAnimationFrame(() => {
      var _;
      ((_ = h.shadowRoot) == null ? void 0 : _.activeElement) == null && h.focus();
    }));
  });
  const a = (w) => {
    r.mode !== "palette" || !r.visible || w.composedPath().includes(h) || l("visible", false);
  };
  document.addEventListener("focusin", a, true), document.addEventListener("mousedown", a, true), u.registerScoped(t.modeSwapShortcut, "mode-swap", (w) => {
    w.preventDefault();
    const B = r.mode === "palette" ? "dir" : "palette";
    l("mode", B);
  });
  function g() {
    l("visible", true), requestAnimationFrame(() => {
      var w;
      ((w = h.shadowRoot) == null ? void 0 : w.activeElement) == null && h.focus();
    });
  }
  function x() {
    console.log(`[Rove:${e.keyPrefix}] hide() called — setting visible=false`), l("visible", false);
  }
  function L() {
    r.visible ? x() : g();
  }
  function R() {
    u.destroy(), document.removeEventListener("focusin", a, true), document.removeEventListener("mousedown", a, true), v(), h.remove(), At(e.keyPrefix);
  }
  return window[`__rove_state_${e.keyPrefix}`] = r, window[`__rove_set_${e.keyPrefix}`] = l, window[`__rove_host_${e.keyPrefix}`] = h, { show: g, hide: x, toggle: L, destroy: R };
}
typeof window < "u" && typeof __USERSCRIPT_BUILD__ < "u" && __USERSCRIPT_BUILD__ && (window.__ROVE__ = { init: Fr });

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
    var _d$name, _d$streetAddress, _d$address, _d$city, _d$state, _d$postalCode, _d$phone, _d$costCenter, _d$email;
    const d = JSON.parse(jsonStr);
    fillForm({
      name: (_d$name = d.name) != null ? _d$name : '',
      address1: (_d$streetAddress = d.streetAddress) != null ? _d$streetAddress : '',
      address2: (_d$address = d.address2) != null ? _d$address : '',
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
      const rove = Fr({
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
