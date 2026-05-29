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
var Ne = (e, t, r) => Et(e, typeof t != "symbol" ? t + "" : t, r);
function de(e, t, r) {
  try {
    const n = localStorage.getItem(`${e}.${t}.${r}`);
    return n !== null ? JSON.parse(n) : null;
  } catch {
    return null;
  }
}
function $e(e, t, r, n) {
  try {
    localStorage.setItem(`${e}.${t}.${r}`, JSON.stringify(n));
  } catch {
  }
}
function At(e) {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const n = localStorage.key(r);
      n && n.startsWith(`${e}.`) && t.push(n);
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
  const { keyPrefix: t, defaults: r = {} } = e, n = {
    mode: r.mode ?? Ce.mode,
    palettePin: r.palettePin ?? Ce.palettePin,
    globalShortcut: r.globalShortcut ?? Ce.globalShortcut,
    modeSwapShortcut: r.modeSwapShortcut ?? Ce.modeSwapShortcut,
    rememberLastMode: r.rememberLastMode ?? Ce.rememberLastMode,
    theme: r.theme ?? Ce.theme
  }, d = de(t, "meta", "mode");
  (d === "palette" || d === "dir") && (n.mode = d);
  const o = de(t, "meta", "palettePin");
  (o === "top" || o === "middle" || o === "bottom") && (n.palettePin = o);
  const a = de(t, "meta", "globalShortcut");
  a && (n.globalShortcut = a);
  const u = de(t, "meta", "modeSwapShortcut");
  u && (n.modeSwapShortcut = u);
  const y = de(t, "meta", "rememberLastMode");
  typeof y == "boolean" && (n.rememberLastMode = y);
  const T = de(t, "meta", "theme");
  return (T === "light" || T === "dark" || T === "system") && (n.theme = T), n;
}
function Dt() {
  return {
    x: Math.round(window.innerWidth * 0.375),
    y: Math.round(window.innerHeight * 0.375),
    width: Math.round(window.innerWidth * 0.25),
    height: Math.round(window.innerHeight * 0.25)
  };
}
function zt(e) {
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
function Rt(e) {
  return store.createStore(zt(e));
}
function Ht(e, t) {
  e("meta", (r) => ({ ...r, ...t }));
}
const qt = {
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
  const r = t.split("+"), n = r[r.length - 1], d = r.includes("Ctrl"), o = r.includes("Shift"), a = r.includes("Alt"), u = r.includes("Meta");
  if (e.ctrlKey !== d || e.shiftKey !== o || e.altKey !== a || e.metaKey !== u)
    return false;
  if (n.length === 1 && /[a-z0-9]/i.test(n))
    return e.key.toLowerCase() === n.toLowerCase();
  const y = qt[n];
  return y ? e.code === y : e.key === n;
}
class jt {
  constructor() {
    Ne(this, "entries", /* @__PURE__ */ new Map());
    Ne(this, "shadowHost", null);
    Ne(this, "globalHandler");
    Ne(this, "scopedHandler");
    this.globalHandler = (t) => {
      for (const r of this.entries.values())
        r.scope === "global" && yt(t, r.shortcut) && r.handler(t);
    }, this.scopedHandler = (t) => {
      var d;
      if (!(!this.shadowHost || !(document.activeElement === this.shadowHost || ((d = this.shadowHost.shadowRoot) == null ? void 0 : d.activeElement) != null)))
        for (const o of this.entries.values())
          o.scope === "scoped" && yt(t, o.shortcut) && o.handler(t);
    }, document.addEventListener("keydown", this.globalHandler, { capture: true }), document.addEventListener("keydown", this.scopedHandler, { capture: true });
  }
  setShadowHost(t) {
    this.shadowHost = t;
  }
  registerGlobal(t, r, n) {
    this.entries.set(r, { shortcut: t, handler: n, scope: "global" });
  }
  registerScoped(t, r, n) {
    this.entries.set(r, { shortcut: t, handler: n, scope: "scoped" });
  }
  updateShortcut(t, r) {
    const n = this.entries.get(t);
    n && (n.shortcut = r);
  }
  unregister(t) {
    this.entries.delete(t);
  }
  destroy() {
    document.removeEventListener("keydown", this.globalHandler, { capture: true }), document.removeEventListener("keydown", this.scopedHandler, { capture: true }), this.entries.clear();
  }
}
const wt = (e, t) => e > t ? 1 : e < t ? -1 : 0, nt = 1 / 0, rt = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), pt = "eexxaacctt", Nt = new RegExp("\\p{P}", "gu"), Bt = "A-Z", Vt = "a-z", Ot = ["en", { numeric: true, sensitivity: "base" }], Ie = (e, t, r) => e.replace(Bt, t).replace(Vt, r), ft = {
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
  interIns: nt,
  // allowance between chars in terms
  intraChars: "[a-z\\d']",
  // internally case-insensitive
  intraIns: null,
  intraContr: "'[a-z]{1,2}\\b",
  // multi-insert or single-error mode
  intraMode: 0,
  // single-error bounds for errors within terms, default requires exact first char
  intraSlice: [1, nt],
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
  sort: (e, t, r, n = wt) => {
    let {
      idx: d,
      chars: o,
      terms: a,
      interLft2: u,
      interLft1: y,
      //	interRgt2,
      //	interRgt1,
      start: T,
      intraIns: g,
      interIns: v,
      cases: i
    } = e;
    return d.map((m, h) => h).sort((m, h) => (
      // most contig chars matched
      o[h] - o[m] || // least char intra-fuzz (most contiguous)
      g[m] - g[h] || // most prefix bounds, boosted by full term matches
      a[h] + u[h] + 0.5 * y[h] - (a[m] + u[m] + 0.5 * y[m]) || // highest density of match (least span)
      //	span[ia] - span[ib] ||
      // highest density of match (least term inter-fuzz)
      v[m] - v[h] || // earliest start of match
      T[m] - T[h] || // case match
      i[h] - i[m] || // alphabetic
      n(t[d[m]], t[d[h]])
    ));
  }
}, lt = (e, t) => t == 0 ? "" : t == 1 ? e + "??" : t == nt ? e + "*?" : e + `{0,${t}}?`, ht = "(?:\\b|_)";
function Fe(e) {
  e = Object.assign({}, ft, e);
  let {
    unicode: t,
    interLft: r,
    interRgt: n,
    intraMode: d,
    intraSlice: o,
    intraIns: a,
    intraSub: u,
    intraTrn: y,
    intraDel: T,
    intraContr: g,
    intraSplit: v,
    interSplit: i,
    intraBound: m,
    interBound: h,
    intraChars: L,
    toUpper: M,
    toLower: x,
    compare: H
  } = e;
  a ?? (a = d), u ?? (u = d), y ?? (y = d), T ?? (T = d), H ?? (H = typeof Intl > "u" ? wt : new Intl.Collator(...Ot).compare);
  let P = e.letters ?? e.alpha;
  if (P != null) {
    let I = M(P), q = x(P);
    i = Ie(i, I, q), v = Ie(v, I, q), h = Ie(h, I, q), m = Ie(m, I, q), L = Ie(L, I, q), g = Ie(g, I, q);
  }
  let $ = t ? "u" : "";
  const X = '".+?"', se = new RegExp(X, "gi" + $), K = new RegExp(`(?:\\s+|^)-(?:${L}+|${X})`, "gi" + $);
  let { intraRules: F } = e;
  F == null && (F = (I) => {
    let q = ft.intraSlice, B = 0, V = 0, l = 0, s = 0;
    if (/[^\d]/.test(I)) {
      let p = I.length;
      p <= 4 ? p >= 3 && (l = Math.min(y, 1), p == 4 && (B = Math.min(a, 1))) : (q = o, B = a, V = u, l = y, s = T);
    }
    return {
      intraSlice: q,
      intraIns: B,
      intraSub: V,
      intraTrn: l,
      intraDel: s
    };
  });
  let ae = !!v, ue = new RegExp(v, "g" + $), Ve = new RegExp(i, "g" + $), Je = new RegExp("^" + i + "|" + i + "$", "g" + $), Oe = new RegExp(g, "gi" + $);
  const ce = (I, q = false) => {
    let B = [];
    I = I.replace(se, (l) => (B.push(l), pt)), I = I.replace(Je, ""), q || (I = x(I)), ae && (I = I.replace(ue, (l) => l[0] + " " + l[1]));
    let V = 0;
    return I.split(Ve).filter((l) => l != "").map((l) => l === pt ? B[V++] : l);
  }, Ke = /[^\d]+|\d+/g, He = (I, q = 0, B = false) => {
    let V = ce(I);
    if (V.length == 0)
      return [];
    let l = Array(V.length).fill("");
    V = V.map((k, E) => k.replace(Oe, (S) => (l[E] = S, "")));
    let s;
    if (d == 1)
      s = V.map((k, E) => {
        if (k[0] === '"')
          return rt(k.slice(1, -1));
        let S = "";
        for (let C of k.matchAll(Ke)) {
          let _ = C[0], {
            intraSlice: w,
            intraIns: j,
            intraSub: z,
            intraTrn: R,
            intraDel: N
          } = F(_);
          if (j + z + R + N == 0)
            S += _ + l[E];
          else {
            let [Z, Q] = w, ee = _.slice(0, Z), pe = _.slice(Q), J = _.slice(Z, Q);
            j == 1 && ee.length == 1 && ee != J[0] && (ee += "(?!" + ee + ")");
            let me = J.length, fe = [_];
            if (z)
              for (let U = 0; U < me; U++)
                fe.push(ee + J.slice(0, U) + L + J.slice(U + 1) + pe);
            if (R)
              for (let U = 0; U < me - 1; U++)
                J[U] != J[U + 1] && fe.push(ee + J.slice(0, U) + J[U + 1] + J[U] + J.slice(U + 2) + pe);
            if (N)
              for (let U = 0; U < me; U++)
                fe.push(ee + J.slice(0, U + 1) + "?" + J.slice(U + 1) + pe);
            if (j) {
              let U = lt(L, 1);
              for (let xe = 0; xe < me; xe++)
                fe.push(ee + J.slice(0, xe) + U + J.slice(xe) + pe);
            }
            S += "(?:" + fe.join("|") + ")" + l[E];
          }
        }
        return S;
      });
    else {
      let k = lt(L, a);
      q == 2 && a > 0 && (k = ")(" + k + ")("), s = V.map((E, S) => E[0] === '"' ? rt(E.slice(1, -1)) : E.split("").map((C, _, w) => (a == 1 && _ == 0 && w.length > 1 && C != w[_ + 1] && (C += "(?!" + C + ")"), C)).join(k) + l[S]);
    }
    let p = r == 2 ? ht : "", c = n == 2 ? ht : "", f = c + lt(e.interChars, e.interIns) + p;
    return q > 0 ? B ? s = p + "(" + s.join(")" + c + "|" + p + "(") + ")" + c : (s = "(" + s.join(")(" + f + ")(") + ")", s = "(.??" + p + ")" + s + "(" + c + ".*)") : (s = s.join(f), s = p + s + c), [new RegExp(s, "i" + $), V, l];
  }, ge = (I, q, B) => {
    let [V] = He(q);
    if (V == null)
      return null;
    let l = [];
    if (B != null)
      for (let s = 0; s < B.length; s++) {
        let p = B[s];
        V.test(I[p]) && l.push(p);
      }
    else
      for (let s = 0; s < I.length; s++)
        V.test(I[s]) && l.push(s);
    return l;
  };
  let Ue = !!m, ke = new RegExp(h, $), _e = new RegExp(m, $);
  const Ge = (I, q, B) => {
    let [V, l, s] = He(B, 1), p = ce(B, true), [c] = He(B, 2), f = l.length, k = Array(f), E = Array(f);
    for (let z = 0; z < f; z++) {
      let R = l[z], N = p[z], Z = R[0] == '"' ? R.slice(1, -1) : R + s[z], Q = N[0] == '"' ? N.slice(1, -1) : N + s[z];
      k[z] = Z, E[z] = Q;
    }
    let S = I.length, C = Array(S).fill(0), _ = {
      // idx in haystack
      idx: Array(S),
      // start of match
      start: C.slice(),
      // length of match
      //	span: field.slice(),
      // contiguous chars matched
      chars: C.slice(),
      // case matched in term (via term.includes(match))
      cases: C.slice(),
      // contiguous (no fuzz) and bounded terms (intra=0, lft2/1, rgt2/1)
      // excludes terms that are contiguous but have < 2 bounds (substrings)
      terms: C.slice(),
      // cumulative length of unmatched chars (fuzz) within span
      interIns: C.slice(),
      // between terms
      intraIns: C.slice(),
      // within terms
      // interLft/interRgt counters
      interLft2: C.slice(),
      interRgt2: C.slice(),
      interLft1: C.slice(),
      interRgt1: C.slice(),
      ranges: Array(S)
    }, w = r == 1 || n == 1, j = 0;
    for (let z = 0; z < I.length; z++) {
      let R = q[I[z]], N = R.match(V), Z = N.index + N[1].length, Q = Z, ee = false, pe = 0, J = 0, me = 0, fe = 0, U = 0, xe = 0, st = 0, it = 0, at = 0, be = [];
      for (let G = 0, Y = 2; G < f; G++, Y += 2) {
        let he = x(N[Y]), le = k[G], et = E[G], ne = le.length, oe = he.length, te = he == le;
        if (N[Y] == et && st++, !te && N[Y + 1].length >= ne) {
          let W = x(N[Y + 1]).indexOf(le);
          W > -1 && (be.push(Q, oe, W, ne), Q += qe(N, Y, W, ne), he = le, oe = ne, te = true, G == 0 && (Z = Q));
        }
        if (w || te) {
          let W = Q - 1, ye = Q + oe, Pe = false, je = false;
          if (W == -1 || ke.test(R[W]))
            te && pe++, Pe = true;
          else {
            if (r == 2) {
              ee = true;
              break;
            }
            if (Ue && _e.test(R[W] + R[W + 1]))
              te && J++, Pe = true;
            else if (r == 1) {
              let Xe = N[Y + 1], Se = Q + oe;
              if (Xe.length >= ne) {
                let we = 0, Ee = false, _t = new RegExp(le, "ig" + $), ct;
                for (; ct = _t.exec(Xe); ) {
                  we = ct.index;
                  let dt = Se + we, tt = dt - 1;
                  if (tt == -1 || ke.test(R[tt])) {
                    pe++, Ee = true;
                    break;
                  } else if (_e.test(R[tt] + R[dt])) {
                    J++, Ee = true;
                    break;
                  }
                }
                Ee && (Pe = true, be.push(Q, oe, we, ne), Q += qe(N, Y, we, ne), he = le, oe = ne, te = true, G == 0 && (Z = Q));
              }
              if (!Pe) {
                ee = true;
                break;
              }
            }
          }
          if (ye == R.length || ke.test(R[ye]))
            te && me++, je = true;
          else {
            if (n == 2) {
              ee = true;
              break;
            }
            if (Ue && _e.test(R[ye - 1] + R[ye]))
              te && fe++, je = true;
            else if (n == 1) {
              ee = true;
              break;
            }
          }
          te && (U += ne, Pe && je && xe++);
        }
        if (oe > ne && (at += oe - ne), G > 0 && (it += N[Y - 1].length), !e.intraFilt(le, he, Q)) {
          ee = true;
          break;
        }
        G < f - 1 && (Q += oe + N[Y + 1].length);
      }
      if (!ee) {
        _.idx[j] = I[z], _.interLft2[j] = pe, _.interLft1[j] = J, _.interRgt2[j] = me, _.interRgt1[j] = fe, _.chars[j] = U, _.terms[j] = xe, _.cases[j] = st, _.interIns[j] = it, _.intraIns[j] = at, _.start[j] = Z;
        let G = R.match(c), Y = G.index + G[1].length, he = be.length, le = he > 0 ? 0 : 1 / 0, et = he - 4;
        for (let W = 2; W < G.length; ) {
          let ye = G[W].length;
          if (le <= et && be[le] == Y) {
            let Pe = be[le + 1], je = be[le + 2], Xe = be[le + 3], Se = W, we = "";
            for (let Ee = 0; Ee < Pe; Se++)
              we += G[Se], Ee += G[Se].length;
            G.splice(W, Se - W, we), Y += qe(G, W, je, Xe), le += 4;
          } else
            Y += ye, W++;
        }
        Y = G.index + G[1].length;
        let ne = _.ranges[j] = [], oe = Y, te = Y;
        for (let W = 2; W < G.length; W++) {
          let ye = G[W].length;
          Y += ye, W % 2 == 0 ? te = Y : ye > 0 && (ne.push(oe, te), oe = te = Y);
        }
        te > oe && ne.push(oe, te), j++;
      }
    }
    if (j < I.length)
      for (let z in _)
        _[z] = _[z].slice(0, j);
    return _;
  }, qe = (I, q, B, V) => {
    let l = I[q] + I[q + 1].slice(0, B);
    return I[q - 1] += l, I[q] = I[q + 1].slice(B, B + V), I[q + 1] = I[q + 1].slice(B + V), l.length;
  }, Qe = 5, We = (I, q, B, V = 1e3, l) => {
    B = B ? B === true ? Qe : B : 0;
    let s = null, p = null, c = [];
    q = q.replace(K, (_) => {
      let w = _.trim().slice(1);
      return w = w[0] === '"' ? rt(w.slice(1, -1)) : w.replace(Nt, ""), w != "" && c.push(w), "";
    });
    let f = ce(q), k;
    if (c.length > 0) {
      if (k = new RegExp(c.join("|"), "i" + $), f.length == 0) {
        let _ = [];
        for (let w = 0; w < I.length; w++)
          k.test(I[w]) || _.push(w);
        return [_, null, null];
      }
    } else if (f.length == 0)
      return [null, null, null];
    if (B > 0) {
      let _ = ce(q);
      if (_.length > 1) {
        let w = _.slice().sort((z, R) => R.length - z.length);
        for (let z = 0; z < w.length; z++) {
          if ((l == null ? void 0 : l.length) == 0)
            return [[], null, null];
          l = ge(I, w[z], l);
        }
        if (_.length > B)
          return [l, null, null];
        s = $t(_).map((z) => z.join(" ")), p = [];
        let j = /* @__PURE__ */ new Set();
        for (let z = 0; z < s.length; z++)
          if (j.size < l.length) {
            let R = l.filter((Z) => !j.has(Z)), N = ge(I, s[z], R);
            for (let Z = 0; Z < N.length; Z++)
              j.add(N[Z]);
            p.push(N);
          } else
            p.push([]);
      }
    }
    s == null && (s = [q], p = [(l == null ? void 0 : l.length) > 0 ? l : ge(I, q)]);
    let E = null, S = null;
    if (c.length > 0 && (p = p.map((_) => _.filter((w) => !k.test(I[w])))), p.reduce((_, w) => _ + w.length, 0) <= V) {
      E = {}, S = [];
      for (let _ = 0; _ < p.length; _++) {
        let w = p[_];
        if (w == null || w.length == 0)
          continue;
        let j = s[_], z = Ge(w, I, j), R = e.sort(z, I, j, H);
        if (_ > 0)
          for (let N = 0; N < R.length; N++)
            R[N] += S.length;
        for (let N in z)
          E[N] = (E[N] ?? []).concat(z[N]);
        S = S.concat(R);
      }
    }
    return [
      [].concat(...p),
      E,
      S
    ];
  };
  return {
    search: (...I) => We(...I),
    split: ce,
    filter: ge,
    info: Ge,
    sort: e.sort
  };
}
const Kt = (() => {
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
  for (let o in e)
    e[o].split("").forEach((a) => {
      r += a, t[a] = o;
    });
  let n = new RegExp(`[${r}]`, "g"), d = (o) => t[o];
  return (o) => {
    if (typeof o == "string")
      return o.replace(n, d);
    let a = Array(o.length);
    for (let u = 0; u < o.length; u++)
      a[u] = o[u].replace(n, d);
    return a;
  };
})();
function $t(e) {
  e = e.slice();
  let t = e.length, r = [e.slice()], n = new Array(t).fill(0), d = 1, o, a;
  for (; d < t; )
    n[d] < d ? (o = d % 2 && n[d], a = e[d], e[d] = e[o], e[o] = a, ++n[d], d = 1, r.push(e.slice())) : (n[d] = 0, ++d);
  return r;
}
const Ut = (e, t) => t ? `<mark>${e}</mark>` : e, Gt = (e, t) => e + t;
function Wt(e, t, r = Ut, n = "", d = Gt) {
  n = d(n, r(e.substring(0, t[0]), false)) ?? n;
  for (let o = 0; o < t.length; o += 2) {
    let a = t[o], u = t[o + 1];
    n = d(n, r(e.substring(a, u), true)) ?? n, o < t.length - 3 && (n = d(n, r(e.substring(t[o + 1], t[o + 2]), false)) ?? n);
  }
  return n = d(n, r(e.substring(t[t.length - 1]), false)) ?? n, n;
}
Fe.latinize = Kt;
Fe.permute = (e) => $t([...Array(e.length).keys()]).sort((r, n) => {
  for (let d = 0; d < r.length; d++)
    if (r[d] != n[d])
      return r[d] - n[d];
  return 0;
}).map((r) => r.map((n) => e[n]));
Fe.highlight = Wt;
const Xt = new Fe({ intraMode: 1 });
function Ze(e, t, r, n, d) {
  for (const [o, a] of Object.entries(e))
    if (a.type === "directory" && a.children && !a.load)
      Ze(
        a.children,
        [...t, o],
        [...r, a.label],
        n,
        d
      );
    else if (a.type === "directory" && a.load && a.children)
      Ze(
        a.children,
        [...t, o],
        [...r, a.label],
        n,
        d
      );
    else {
      const u = "label" in a ? a.label : o, y = r.length > 0 ? `${r.join(" > ")} > ${u}` : u;
      n.push(y), d.push({
        item: a,
        key: o,
        path: [...t, o],
        pathLabels: [...r],
        score: 0,
        ranges: []
      });
    }
}
function Yt(e) {
  const t = [], r = [];
  return Ze(e, [], [], t, r), { haystack: t, items: r };
}
function Zt(e, t) {
  if (!t.trim()) return [];
  const [r, n, d] = Xt.search(e.haystack, t);
  return !r || !n || !d ? [] : d.map((o) => {
    const a = r[o], u = e.items[a], y = n.ranges[o], T = [];
    for (let g = 0; g < y.length; g += 2)
      T.push([y[g], y[g + 1]]);
    return {
      ...u,
      score: n.idx[o],
      ranges: T
    };
  });
}
function vt(e, t, r, n) {
  const d = [...e.haystack], o = [...e.items];
  return Ze(t, r, n, d, o), { haystack: d, items: o };
}
function Ft(e, t, r) {
  function n(d, o, a, u) {
    return {
      type: "input",
      label: d,
      inputType: o,
      options: u == null ? void 0 : u.options,
      storageKey: `${e}.meta.${a}`,
      onChange: (y) => {
        $e(e, "meta", a, y), u != null && u.onChange && u.onChange(y), Ht(t, { [a]: y });
      }
    };
  }
  return {
    type: "directory",
    label: "Settings",
    children: {
      theme: n("Theme", "select", "theme", {
        options: ["system", "light", "dark"]
      }),
      mode: n("Default Mode", "select", "mode", {
        options: ["palette", "dir"]
      }),
      "palette-pin": n("Palette Pin", "select", "palettePin", {
        options: ["top", "middle", "bottom"]
      }),
      "remember-mode": n("Remember Last Mode", "checkbox", "rememberLastMode"),
      "global-key": n("Global Shortcut", "text", "globalShortcut", {
        onChange: (d) => {
          r.updateShortcut("global-toggle", d);
        }
      }),
      "swap-key": n("Mode Swap Shortcut", "text", "modeSwapShortcut", {
        onChange: (d) => {
          r.updateShortcut("mode-swap", d);
        }
      })
    }
  };
}
const [Be, rl] = solidJs.createSignal(false);
var Jt = /* @__PURE__ */ web.template("<div class=result-path>"), Qt = /* @__PURE__ */ web.template("<div role=option><span class=result-label>"), er = /* @__PURE__ */ web.template("<mark class=result-highlight>"), tr = /* @__PURE__ */ web.template("<span>");
function rr(e, t) {
  const r = [];
  let n = 0;
  for (const [d, o] of t)
    d > n && r.push({
      text: e.slice(n, d),
      highlighted: false
    }), r.push({
      text: e.slice(d, o),
      highlighted: true
    }), n = o;
  return n < e.length && r.push({
    text: e.slice(n),
    highlighted: false
  }), r;
}
function lr(e) {
  const t = () => e.result.item, r = () => "label" in t() ? t().label : "", n = () => e.result.pathLabels.length > 0 ? e.result.pathLabels.join(" › ") : null, d = () => e.result.ranges.length > 0 ? rr(r(), e.result.ranges) : [{
    text: r(),
    highlighted: false
  }];
  return (() => {
    var o = Qt(), a = o.firstChild;
    return web.addEventListener(o, "click", e.onActivate, true), o.style.setProperty("padding", "8px 14px"), o.style.setProperty("cursor", "pointer"), web.insert(o, web.createComponent(solidJs.Show, {
      get when() {
        return n();
      },
      get children() {
        var u = Jt();
        return u.style.setProperty("font-size", "11px"), u.style.setProperty("color", "var(--rove-text-dim)"), u.style.setProperty("margin-bottom", "2px"), web.insert(u, n), u;
      }
    }), a), web.insert(a, web.createComponent(solidJs.For, {
      get each() {
        return d();
      },
      children: (u) => u.highlighted ? (() => {
        var y = er();
        return y.style.setProperty("background", "var(--rove-accent)"), y.style.setProperty("color", "var(--rove-bg)"), y.style.setProperty("border-radius", "2px"), y.style.setProperty("padding", "0 1px"), web.insert(y, () => u.text), y;
      })() : (() => {
        var y = tr();
        return web.insert(y, () => u.text), y;
      })()
    })), web.effect((u) => {
      var y = `palette-result${e.selected ? " palette-result--selected" : ""}`, T = e.selected, g = e.selected ? "var(--rove-selected)" : "transparent";
      return y !== u.e && web.className(o, u.e = y), T !== u.t && web.setAttribute(o, "aria-selected", u.t = T), g !== u.a && ((u.a = g) != null ? o.style.setProperty("background", g) : o.style.removeProperty("background")), u;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), o;
  })();
}
web.delegateEvents(["click"]);
var nr = /* @__PURE__ */ web.template("<div>P[<!>] vis=<!> eph="), or = /* @__PURE__ */ web.template("<div>DEBUG: palette mounted [<!>] pin="), sr = /* @__PURE__ */ web.template("<div><span>Select: </span><span>Esc to cancel"), ir = /* @__PURE__ */ web.template("<div>No options match"), gt = /* @__PURE__ */ web.template("<div id=palette-results role=listbox>"), ar = /* @__PURE__ */ web.template('<div class=palette-container role=combobox aria-haspopup=listbox><div class=palette-input-row><input type=text class=palette-input aria-autocomplete=list aria-controls=palette-results><button class=palette-mode-btn aria-label="Switch to directory view"title="Switch to directory view">☰</button></div><div role=status aria-live=polite aria-atomic=true>'), cr = /* @__PURE__ */ web.template("<div role=option>");
function dr(e) {
  let t, r;
  const [n, d] = solidJs.createSignal(null);
  solidJs.createEffect(() => {
    v() || d(null);
  }), solidJs.createEffect(() => {
    v() && e.state.palette.overlay === null && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    if (n()) return;
    const i = e.state.palette.query, m = i ? Zt(e.getIndex(), i) : [];
    e.set("palette", (h) => ({
      ...h,
      results: m,
      selectedIndex: 0
    }));
  });
  const o = solidJs.createMemo(() => {
    const i = n();
    if (!i) return [];
    const m = e.state.palette.query.toLowerCase();
    return m ? i.options.filter(({
      key: h,
      item: L
    }) => ("label" in L ? L.label : h).toLowerCase().includes(m)) : i.options;
  });
  function a(i) {
    const m = i.target.value;
    e.set("palette", "query", m), d((h) => h ? {
      ...h,
      selectedIndex: 0
    } : null);
  }
  function u(i) {
    const m = n();
    if (m) {
      const M = o();
      if (i.key === "ArrowDown")
        i.preventDefault(), d((x) => x ? {
          ...x,
          selectedIndex: Math.min(x.selectedIndex + 1, M.length - 1)
        } : null);
      else if (i.key === "ArrowUp")
        i.preventDefault(), d((x) => x ? {
          ...x,
          selectedIndex: Math.max(x.selectedIndex - 1, 0)
        } : null);
      else if (i.key === "Enter") {
        i.preventDefault();
        const x = M[m.selectedIndex];
        x && y(x);
      } else i.key === "Escape" && (i.preventDefault(), d(null), e.set("palette", "query", ""));
      return;
    }
    const {
      results: h,
      selectedIndex: L
    } = e.state.palette;
    if (i.key === "ArrowDown")
      i.preventDefault(), e.set("palette", "selectedIndex", Math.min(L + 1, h.length - 1));
    else if (i.key === "ArrowUp")
      i.preventDefault(), e.set("palette", "selectedIndex", Math.max(L - 1, 0));
    else if (i.key === "Enter") {
      i.preventDefault();
      const M = h[L];
      M && T(M);
    } else i.key === "Escape" && (i.preventDefault(), e.state.palette.query ? e.set("palette", "query", "") : e.set("visible", false));
  }
  function y(i) {
    var h;
    const m = n();
    (h = m == null ? void 0 : m.onSelect) == null || h.call(m, i.key, i.item), d(null), e.set("palette", (L) => ({
      ...L,
      query: "",
      results: [],
      selectedIndex: 0
    }));
  }
  function T(i) {
    const m = i.item;
    if (m.type === "action")
      m.action(), e.set("palette", (h) => ({
        ...h,
        query: "",
        results: [],
        selectedIndex: 0
      })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
    else if (m.type === "input") {
      const h = de(e.keyPrefix, "input", i.path.join(".")), L = h !== null ? {
        ...m,
        defaultValue: h
      } : m;
      e.set("palette", (M) => ({
        ...M,
        query: "",
        results: [],
        selectedIndex: 0,
        overlay: {
          type: "input",
          item: L,
          nodeKey: i.key,
          nodePath: i.path
        }
      }));
    } else if (m.type === "directory" && m.load) {
      const h = m;
      if (h.children) {
        const L = vt(e.getIndex(), h.children, i.path, i.pathLabels);
        e.setIndex(L);
        const M = Object.entries(h.children).map(([x, H]) => ({
          item: H,
          key: x,
          path: [...i.path, x],
          pathLabels: [...i.pathLabels, h.label],
          score: 0,
          ranges: []
        }));
        e.set("palette", (x) => ({
          ...x,
          query: "",
          results: M,
          selectedIndex: 0
        })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
      } else {
        const L = h.load;
        let M = false;
        e.set("palette", "overlay", {
          type: "loading",
          label: h.label,
          cancel: () => {
            M = true;
          }
        }), L().then((x) => {
          if (M) return;
          h.children = x, e.set("palette", "overlay", null);
          const H = vt(e.getIndex(), x, i.path, i.pathLabels);
          e.setIndex(H);
          const P = Object.entries(x).map(([$, X]) => ({
            item: X,
            key: $,
            path: [...i.path, $],
            pathLabels: [...i.pathLabels, h.label],
            score: 0,
            ranges: []
          }));
          e.set("palette", ($) => ({
            ...$,
            query: "",
            results: P,
            selectedIndex: 0
          })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
        }).catch((x) => {
          e.set("palette", "overlay", {
            type: "error",
            message: x instanceof Error ? x.message : "Load failed."
          });
        });
      }
    } else if (m.type === "select") {
      const h = m, L = (M) => {
        const x = M.map((H) => ({
          key: H,
          item: {
            type: "action",
            label: H,
            action: () => {
              h.onSelect(H);
            }
          }
        }));
        d({
          options: x,
          label: h.label,
          selectedIndex: 0
        }), e.set("palette", (H) => ({
          ...H,
          query: "",
          results: [],
          selectedIndex: 0
        }));
      };
      if (h.options)
        L(h.options);
      else if (h.load) {
        let M = false;
        e.set("palette", "overlay", {
          type: "loading",
          label: h.label,
          cancel: () => {
            M = true;
          }
        }), h.load().then((x) => {
          M || (e.set("palette", "overlay", null), L(x));
        }).catch((x) => {
          e.set("palette", "overlay", {
            type: "error",
            message: x instanceof Error ? x.message : "Load failed."
          });
        });
      }
    }
  }
  const g = () => e.state.meta.palettePin, v = solidJs.createMemo(() => e.state.visible && e.state.mode === "palette");
  return solidJs.createEffect(() => {
    Be() && console.log(`[Rove:Palette:${e.keyPrefix}] visible=${v()}`);
  }), [web.createComponent(solidJs.Show, {
    get when() {
      return Be();
    },
    get children() {
      var i = nr(), m = i.firstChild, h = m.nextSibling, L = h.nextSibling, M = L.nextSibling;
      return M.nextSibling, i.style.setProperty("position", "fixed"), i.style.setProperty("top", "8px"), i.style.setProperty("color", "#fff"), i.style.setProperty("font-size", "10px"), i.style.setProperty("font-family", "monospace"), i.style.setProperty("padding", "3px 10px"), i.style.setProperty("border-radius", "20px"), i.style.setProperty("z-index", "99999999"), i.style.setProperty("pointer-events", "none"), i.style.setProperty("line-height", "1.6"), web.insert(i, () => e.keyPrefix, h), web.insert(i, () => String(v()), M), web.insert(i, (() => {
        var x = web.memo(() => !!n());
        return () => x() ? n().label : "none";
      })(), null), web.effect((x) => {
        var H = e.keyPrefix.length <= 4 ? "8px" : "auto", P = e.keyPrefix.length <= 4 ? "auto" : "8px", $ = v() ? "#00c853" : "#c62828";
        return H !== x.e && ((x.e = H) != null ? i.style.setProperty("left", H) : i.style.removeProperty("left")), P !== x.t && ((x.t = P) != null ? i.style.setProperty("right", P) : i.style.removeProperty("right")), $ !== x.a && ((x.a = $) != null ? i.style.setProperty("background", $) : i.style.removeProperty("background")), x;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      }), i;
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return v();
    },
    get children() {
      var i = ar(), m = i.firstChild, h = m.firstChild, L = h.nextSibling, M = m.nextSibling;
      i.style.setProperty("position", "fixed"), i.style.setProperty("left", "50%"), i.style.setProperty("width", "50vw"), i.style.setProperty("max-width", "700px"), i.style.setProperty("min-width", "300px"), i.style.setProperty("z-index", "var(--rove-z-index)"), i.style.setProperty("background", "var(--rove-bg)"), i.style.setProperty("border", "1px solid var(--rove-border)"), i.style.setProperty("border-radius", "var(--rove-border-radius)"), i.style.setProperty("box-shadow", "var(--rove-shadow)"), web.setAttribute(i, "aria-expanded", true), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return Be();
        },
        get children() {
          var P = or(), $ = P.firstChild, X = $.nextSibling;
          return X.nextSibling, P.style.setProperty("background", "red"), P.style.setProperty("color", "white"), P.style.setProperty("font-size", "10px"), P.style.setProperty("padding", "2px 6px"), P.style.setProperty("font-family", "monospace"), web.insert(P, () => e.keyPrefix, X), web.insert(P, g, null), P;
        }
      }), m), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() !== null;
        },
        get children() {
          var P = sr(), $ = P.firstChild;
          $.firstChild;
          var X = $.nextSibling;
          return P.style.setProperty("padding", "6px 14px"), P.style.setProperty("font-size", "11px"), P.style.setProperty("color", "var(--rove-accent)"), P.style.setProperty("background", "var(--rove-selected)"), P.style.setProperty("display", "flex"), P.style.setProperty("align-items", "center"), P.style.setProperty("gap", "6px"), $.style.setProperty("font-weight", "600"), web.insert($, () => n().label, null), X.style.setProperty("color", "var(--rove-text-dim)"), X.style.setProperty("margin-left", "auto"), P;
        }
      }), m), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), h.$$keydown = u, h.$$input = a;
      var x = t;
      typeof x == "function" ? web.use(x, h) : t = h, h.style.setProperty("flex", "1"), h.style.setProperty("padding", "10px 14px"), h.style.setProperty("border", "none"), h.style.setProperty("background", "transparent"), h.style.setProperty("color", "var(--rove-text)"), h.style.setProperty("font-size", "16px"), h.style.setProperty("outline", "none"), h.style.setProperty("min-width", "0"), L.$$click = () => e.set("mode", "dir"), L.style.setProperty("background", "none"), L.style.setProperty("border", "none"), L.style.setProperty("border-left", "1px solid var(--rove-border)"), L.style.setProperty("cursor", "pointer"), L.style.setProperty("color", "var(--rove-text-dim)"), L.style.setProperty("padding", "0 14px"), L.style.setProperty("font-size", "15px"), L.style.setProperty("line-height", "1"), L.style.setProperty("align-self", "stretch"), L.style.setProperty("display", "flex"), L.style.setProperty("align-items", "center");
      var H = r;
      return typeof H == "function" ? web.use(H, M) : r = M, M.style.setProperty("position", "absolute"), M.style.setProperty("width", "1px"), M.style.setProperty("height", "1px"), M.style.setProperty("overflow", "hidden"), M.style.setProperty("clip", "rect(0,0,0,0)"), M.style.setProperty("white-space", "nowrap"), web.insert(M, (() => {
        var P = web.memo(() => !!n());
        return () => P() ? `${o().length} options` : e.state.palette.results.length > 0 ? `${e.state.palette.results.length} results` : e.state.palette.query ? "No results" : "";
      })()), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() !== null;
        },
        get children() {
          var P = gt();
          return P.style.setProperty("max-height", "50vh"), P.style.setProperty("overflow-y", "auto"), P.style.setProperty("border-top", "1px solid var(--rove-border)"), web.insert(P, web.createComponent(solidJs.For, {
            get each() {
              return o();
            },
            children: ($, X) => {
              const se = () => {
                var K;
                return X() === (((K = n()) == null ? void 0 : K.selectedIndex) ?? -1);
              };
              return (() => {
                var K = cr();
                return K.addEventListener("mouseleave", (F) => {
                  F.currentTarget.style.background = se() ? "var(--rove-selected)" : "";
                }), K.addEventListener("mouseenter", (F) => {
                  se() || (F.currentTarget.style.background = "var(--rove-hover)");
                }), K.$$click = () => y($), K.style.setProperty("display", "flex"), K.style.setProperty("align-items", "center"), K.style.setProperty("padding", "8px 14px"), K.style.setProperty("cursor", "pointer"), K.style.setProperty("color", "var(--rove-text)"), K.style.setProperty("font-size", "14px"), web.insert(K, () => "label" in $.item ? $.item.label : $.key), web.effect((F) => {
                  var ae = se(), ue = se() ? "var(--rove-selected)" : "transparent";
                  return ae !== F.e && web.setAttribute(K, "aria-selected", F.e = ae), ue !== F.t && ((F.t = ue) != null ? K.style.setProperty("background", ue) : K.style.removeProperty("background")), F;
                }, {
                  e: void 0,
                  t: void 0
                }), K;
              })();
            }
          }), null), web.insert(P, web.createComponent(solidJs.Show, {
            get when() {
              return o().length === 0;
            },
            get children() {
              var $ = ir();
              return $.style.setProperty("padding", "8px 14px"), $.style.setProperty("color", "var(--rove-text-dim)"), $.style.setProperty("font-size", "13px"), $;
            }
          }), null), P;
        }
      }), null), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() === null;
        },
        get children() {
          var P = gt();
          return P.style.setProperty("max-height", "50vh"), P.style.setProperty("overflow-y", "auto"), web.insert(P, web.createComponent(solidJs.For, {
            get each() {
              return e.state.palette.results;
            },
            children: ($, X) => web.createComponent(lr, {
              result: $,
              get selected() {
                return X() === e.state.palette.selectedIndex;
              },
              onActivate: () => T($)
            })
          })), web.effect(($) => ($ = e.state.palette.results.length > 0 ? "1px solid var(--rove-border)" : "none") != null ? P.style.setProperty("border-top", $) : P.style.removeProperty("border-top")), P;
        }
      }), null), web.effect((P) => {
        var $ = g() === "top" ? "0" : g() === "middle" ? "50%" : "auto", X = g() === "bottom" ? "0" : "auto", se = g() === "middle" ? "translate(-50%, -50%)" : "translateX(-50%)", K = n() ? "Filter…" : "Search…";
        return $ !== P.e && ((P.e = $) != null ? i.style.setProperty("top", $) : i.style.removeProperty("top")), X !== P.t && ((P.t = X) != null ? i.style.setProperty("bottom", X) : i.style.removeProperty("bottom")), se !== P.a && ((P.a = se) != null ? i.style.setProperty("transform", se) : i.style.removeProperty("transform")), K !== P.o && web.setAttribute(h, "placeholder", P.o = K), P;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), web.effect(() => h.value = e.state.palette.query), i;
    }
  })];
}
web.delegateEvents(["input", "keydown", "click"]);
var ur = /* @__PURE__ */ web.template("<span>Select"), yr = /* @__PURE__ */ web.template('<div class=titlebar role=toolbar><button class=titlebar-btn aria-label="Go back">←</button><span class=titlebar-title><span></span></span><button class=titlebar-btn aria-label="Switch to palette view"title="Switch to palette view">⌕</button><button class=titlebar-btn aria-label="Reset window position"title="Reset position">□</button><button class=titlebar-btn aria-label=Close>×');
function pr(e) {
  return (() => {
    var t = yr(), r = t.firstChild, n = r.nextSibling, d = n.firstChild, o = n.nextSibling, a = o.nextSibling, u = a.nextSibling;
    return web.addEventListener(t, "mousedown", e.onDragStart, true), t.style.setProperty("display", "flex"), t.style.setProperty("align-items", "center"), t.style.setProperty("padding", "6px 8px"), t.style.setProperty("background", "var(--rove-surface)"), t.style.setProperty("border-bottom", "1px solid var(--rove-border)"), t.style.setProperty("cursor", "move"), t.style.setProperty("user-select", "none"), t.style.setProperty("gap", "6px"), r.$$mousedown = (y) => y.stopPropagation(), r.$$click = (y) => {
      y.stopPropagation(), e.onBack();
    }, r.style.setProperty("background", "none"), r.style.setProperty("border", "none"), r.style.setProperty("font-size", "14px"), r.style.setProperty("padding", "2px 6px"), n.style.setProperty("flex", "1"), n.style.setProperty("display", "flex"), n.style.setProperty("align-items", "center"), n.style.setProperty("justify-content", "center"), n.style.setProperty("gap", "6px"), n.style.setProperty("overflow", "hidden"), n.style.setProperty("font-weight", "500"), n.style.setProperty("font-size", "13px"), n.style.setProperty("color", "var(--rove-text)"), web.insert(n, web.createComponent(solidJs.Show, {
      get when() {
        return e.ephemeral;
      },
      get children() {
        var y = ur();
        return y.style.setProperty("font-size", "10px"), y.style.setProperty("font-weight", "600"), y.style.setProperty("color", "var(--rove-accent)"), y.style.setProperty("background", "var(--rove-selected)"), y.style.setProperty("padding", "1px 6px"), y.style.setProperty("border-radius", "10px"), y.style.setProperty("white-space", "nowrap"), y.style.setProperty("flex-shrink", "0"), y;
      }
    }), d), d.style.setProperty("overflow", "hidden"), d.style.setProperty("text-overflow", "ellipsis"), d.style.setProperty("white-space", "nowrap"), web.insert(d, () => e.title), o.$$mousedown = (y) => y.stopPropagation(), o.$$click = (y) => {
      y.stopPropagation(), e.onModeSwap();
    }, o.style.setProperty("background", "none"), o.style.setProperty("border", "none"), o.style.setProperty("cursor", "pointer"), o.style.setProperty("color", "var(--rove-text-dim)"), o.style.setProperty("font-size", "14px"), o.style.setProperty("padding", "2px 6px"), a.$$mousedown = (y) => y.stopPropagation(), a.$$click = (y) => {
      y.stopPropagation(), e.onReset();
    }, a.style.setProperty("background", "none"), a.style.setProperty("border", "none"), a.style.setProperty("cursor", "pointer"), a.style.setProperty("color", "var(--rove-text-dim)"), a.style.setProperty("font-size", "12px"), a.style.setProperty("padding", "2px 6px"), u.$$mousedown = (y) => y.stopPropagation(), u.$$click = (y) => {
      y.stopPropagation(), e.onClose();
    }, u.style.setProperty("background", "none"), u.style.setProperty("border", "none"), u.style.setProperty("cursor", "pointer"), u.style.setProperty("color", "var(--rove-text-dim)"), u.style.setProperty("font-size", "16px"), u.style.setProperty("padding", "2px 6px"), web.effect((y) => {
      var T = !e.canGoBack, g = e.canGoBack ? "pointer" : "default", v = e.canGoBack ? "var(--rove-text)" : "var(--rove-text-dim)";
      return T !== y.e && (r.disabled = y.e = T), g !== y.t && ((y.t = g) != null ? r.style.setProperty("cursor", g) : r.style.removeProperty("cursor")), v !== y.a && ((y.a = v) != null ? r.style.setProperty("color", v) : r.style.removeProperty("color")), y;
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
    }] : r.map((n, d) => ({
      label: n,
      index: d - 1
    }));
  };
  return (() => {
    var r = fr();
    return r.style.setProperty("display", "flex"), r.style.setProperty("align-items", "center"), r.style.setProperty("gap", "2px"), r.style.setProperty("padding", "4px 8px"), r.style.setProperty("font-size", "11px"), r.style.setProperty("color", "var(--rove-text-dim)"), r.style.setProperty("border-bottom", "1px solid var(--rove-border)"), r.style.setProperty("flex-wrap", "wrap"), web.insert(r, web.createComponent(solidJs.For, {
      get each() {
        return t();
      },
      children: (n, d) => [web.createComponent(solidJs.Show, {
        get when() {
          return d() > 0;
        },
        get children() {
          var o = hr();
          return o.style.setProperty("color", "var(--rove-text-dim)"), o;
        }
      }), web.createComponent(solidJs.Show, {
        get when() {
          return n.index !== -2;
        },
        get fallback() {
          return (() => {
            var o = gr();
            return o.style.setProperty("color", "var(--rove-text-dim)"), o;
          })();
        },
        get children() {
          var o = vr();
          return o.$$click = () => e.onNavigateTo(n.index), o.style.setProperty("background", "none"), o.style.setProperty("border", "none"), o.style.setProperty("cursor", "pointer"), o.style.setProperty("color", "var(--rove-accent)"), o.style.setProperty("font-size", "inherit"), o.style.setProperty("padding", "0 2px"), o.style.setProperty("text-decoration", "underline"), web.insert(o, () => n.label), o;
        }
      })]
    })), r;
  })();
}
web.delegateEvents(["click"]);
var xr = /* @__PURE__ */ web.template("<div role=listbox class=dirview-items>"), br = /* @__PURE__ */ web.template("<div>/"), Pr = /* @__PURE__ */ web.template('<div class=dirview-container role=navigation aria-label="Directory navigator"tabindex=0><div class=dirview-resize>'), wr = /* @__PURE__ */ web.template("<textarea class=dirview-inline-field>"), $r = /* @__PURE__ */ web.template("<input type=text class=dirview-inline-field>"), kr = /* @__PURE__ */ web.template("<div class=dirview-inline><label class=dirview-inline-label></label><span class=dirview-inline-hint>"), _r = /* @__PURE__ */ web.template("<div role=listbox>"), Sr = /* @__PURE__ */ web.template("<div class=dirview-multiselect-footer> selected · Enter to save · Esc to cancel"), Er = /* @__PURE__ */ web.template("<div role=option><span>.</span><span></span><span>"), Cr = /* @__PURE__ */ web.template("<span>"), Ir = /* @__PURE__ */ web.template("<span>✓"), Tr = /* @__PURE__ */ web.template("<span>→"), Lr = /* @__PURE__ */ web.template("<div class=dirview-item role=option><span>.</span><span>");
const Ye = 9, Ar = 200, Mr = 150;
function Dr(e) {
  let t, r, n = false, d = false, o = 0, a = 0;
  const [u, y] = solidJs.createSignal(null), [T, g] = solidJs.createSignal(null), [v, i] = solidJs.createSignal(""), [m, h] = solidJs.createSignal(null), [L, M] = solidJs.createSignal(0);
  solidJs.createEffect(() => {
    if (!T()) {
      r = void 0;
      return;
    }
    requestAnimationFrame(() => {
      var c;
      const s = r;
      if (!s) return;
      s.focus();
      const p = s.value.length;
      (c = s.setSelectionRange) == null || c.call(s, p, p);
    });
  });
  const x = () => e.state.nav.history, H = () => x()[x().length - 1], P = () => {
    var l;
    return ((l = H()) == null ? void 0 : l.node) ?? {};
  }, $ = () => x().slice(1).map((l) => l.key), X = () => x().slice(1).map((l) => l.label), se = () => x().length > 1 || T() !== null || m() !== null, K = () => {
    var l, s, p;
    return ((l = T()) == null ? void 0 : l.item.label) ?? ((s = m()) == null ? void 0 : s.item.label) ?? ((p = H()) == null ? void 0 : p.label) ?? "Root";
  };
  function F(l) {
    return Math.max(1, Math.ceil(Object.keys(l).length / Ye));
  }
  function ae(l, s, p) {
    const c = {
      key: l,
      label: p,
      node: s
    };
    e.set("nav", (f) => ({
      ...f,
      history: [...f.history, c],
      page: 1,
      totalPages: F(s)
    }));
  }
  function ue(l) {
    const s = x().slice(0, l.returnHistoryLength), p = s[s.length - 1];
    e.set("nav", (c) => ({
      ...c,
      history: s,
      page: 1,
      totalPages: F((p == null ? void 0 : p.node) ?? {})
    })), y(null), t == null || t.focus();
  }
  function Ve() {
    if (T()) {
      g(null), t == null || t.focus();
      return;
    }
    if (m()) {
      h(null), t == null || t.focus();
      return;
    }
    const l = x();
    if (l.length <= 1) return;
    const s = u();
    if (s && l.length <= s.returnHistoryLength + 1) {
      ue(s);
      return;
    }
    const p = l.slice(0, -1), c = p[p.length - 1];
    e.set("nav", (f) => ({
      ...f,
      history: p,
      page: 1,
      totalPages: F((c == null ? void 0 : c.node) ?? {})
    }));
  }
  function Je(l) {
    if (T()) {
      g(null);
      return;
    }
    if (m()) {
      h(null);
      return;
    }
    const s = x(), p = l === -1 ? [s[0]] : s.slice(0, l + 2), c = p[p.length - 1];
    e.set("nav", (k) => ({
      ...k,
      history: p,
      page: 1,
      totalPages: F((c == null ? void 0 : c.node) ?? {})
    }));
    const f = u();
    f && p.length <= f.returnHistoryLength && y(null);
  }
  solidJs.onMount(() => {
    const l = de(e.keyPrefix, "window", "state");
    l && e.set("window", l);
  }), solidJs.createEffect(() => {
    if (!V()) return;
    const l = t;
    l && (l.addEventListener("keydown", We), solidJs.onCleanup(() => l.removeEventListener("keydown", We)));
  }), solidJs.createEffect(() => $e(e.keyPrefix, "window", "state", e.state.window));
  const Oe = solidJs.createMemo(() => Object.entries(P()).map(([l, s]) => ({
    key: l,
    item: s
  }))), ce = solidJs.createMemo(() => Math.max(1, Math.ceil(Oe().length / Ye))), Ke = solidJs.createMemo(() => {
    const l = (e.state.nav.page - 1) * Ye;
    return Oe().slice(l, l + Ye);
  });
  solidJs.createEffect(() => {
    const l = ce();
    e.state.nav.totalPages !== l && e.set("nav", "totalPages", l);
  });
  function He(l, s) {
    L();
    const p = de(e.keyPrefix, "input", [...$(), l].join(".")), c = p !== null ? p : s.defaultValue;
    return c == null ? "" : s.inputType === "checkbox" ? typeof c == "boolean" ? c ? "✓" : "○" : "" : s.inputType === "select-multiple" ? Array.isArray(c) && c.length > 0 ? `${c.join(", ")}` : "" : typeof c == "string" ? c : "";
  }
  function ge() {
    var p, c;
    const l = T();
    if (!l) return;
    const s = v();
    $e(e.keyPrefix, "input", l.nodePath.join("."), s), (c = (p = l.item).onChange) == null || c.call(p, s), g(null), M((f) => f + 1), t == null || t.focus();
  }
  function Ue() {
    var s, p;
    const l = m();
    l && ($e(e.keyPrefix, "input", l.nodePath.join("."), l.selected), (p = (s = l.item).onChange) == null || p.call(s, l.selected), h(null), M((c) => c + 1), t == null || t.focus());
  }
  function ke(l) {
    const s = m();
    if (!s) return;
    const p = s.item.options ?? [];
    if (l >= p.length) return;
    const c = p[l], f = s.selected.includes(c) ? s.selected.filter((k) => k !== c) : [...s.selected, c];
    h({
      ...s,
      selected: f
    });
  }
  function _e(l) {
    var f;
    const {
      key: s,
      item: p
    } = l, c = u();
    p.type === "directory" ? p.children ? ae(s, p.children, p.label) : p.load && qe(s, p.label, p) : p.type === "action" ? (p.action(), c && ((f = c.onSelect) == null || f.call(c, s, p), ue(c))) : p.type === "input" ? Ge(s, p) : p.type === "select" && Qe(s, p);
  }
  function Ge(l, s) {
    var f;
    const p = [...$(), l], c = de(e.keyPrefix, "input", p.join("."));
    if (s.inputType === "checkbox") {
      const E = !(c !== null ? c : s.defaultValue ?? false);
      $e(e.keyPrefix, "input", p.join("."), E), (f = s.onChange) == null || f.call(s, E), M((S) => S + 1);
    } else if (s.inputType === "text" || s.inputType === "textarea") {
      const k = c !== null ? c : s.defaultValue ?? "";
      i(k), g({
        key: l,
        nodePath: p,
        item: s
      });
    } else if (s.inputType === "select") {
      const k = c !== null ? c : s.defaultValue ?? "", E = s.options ?? [], S = {};
      for (const _ of E) {
        const w = _;
        S[w] = {
          type: "action",
          label: w,
          action: () => {
            var j;
            $e(e.keyPrefix, "input", p.join("."), w), (j = s.onChange) == null || j.call(s, w), M((z) => z + 1);
          }
        };
      }
      const C = x().length;
      ae(l, S, s.label), y({
        returnHistoryLength: C,
        selectedKey: k
      });
    } else if (s.inputType === "select-multiple") {
      const k = c !== null && Array.isArray(c) ? c : Array.isArray(s.defaultValue) ? s.defaultValue : [];
      h({
        key: l,
        nodePath: p,
        item: s,
        selected: [...k]
      });
    }
  }
  function qe(l, s, p) {
    let c = false;
    e.set("palette", "overlay", {
      type: "loading",
      label: s,
      cancel: () => {
        c = true;
      }
    }), p.load().then((f) => {
      c || (p.children = f, e.set("palette", "overlay", null), ae(l, f, s));
    }).catch((f) => {
      e.set("palette", "overlay", {
        type: "error",
        message: f instanceof Error ? f.message : "Load failed."
      });
    });
  }
  function Qe(l, s) {
    const p = (c) => {
      const f = {};
      for (const k of c)
        f[k] = {
          type: "action",
          label: k,
          action: () => {
            s.onSelect(k);
          }
        };
      return f;
    };
    if (s.options) {
      const c = x().length;
      ae(l, p(s.options), s.label), y({
        returnHistoryLength: c
      });
    } else if (s.load) {
      let c = false;
      e.set("palette", "overlay", {
        type: "loading",
        label: s.label,
        cancel: () => {
          c = true;
        }
      }), s.load().then((f) => {
        if (c) return;
        e.set("palette", "overlay", null);
        const k = x().length;
        ae(l, p(f), s.label), y({
          returnHistoryLength: k
        });
      }).catch((f) => {
        e.set("palette", "overlay", {
          type: "error",
          message: f instanceof Error ? f.message : "Load failed."
        });
      });
    }
  }
  function We(l) {
    if (e.state.mode !== "dir" || !e.state.visible) return;
    const s = l.target;
    if (s.tagName === "INPUT" || s.tagName === "TEXTAREA") {
      l.key === "Escape" && (l.preventDefault(), g(null), t == null || t.focus());
      return;
    }
    if (m()) {
      if (l.key === "Enter") {
        l.preventDefault(), Ue();
        return;
      }
      if (l.key === "Escape") {
        l.preventDefault(), h(null), t == null || t.focus();
        return;
      }
      const f = l.code.match(/^(?:Digit|Numpad)([1-9])$/), k = f ? parseInt(f[1]) : NaN;
      isNaN(k) || (l.preventDefault(), ke(k - 1));
      return;
    }
    if (l.key === "Escape") {
      l.preventDefault();
      const f = u();
      f ? ue(f) : e.set("visible", false);
      return;
    }
    if (l.key === "Backspace") {
      l.preventDefault(), Ve();
      return;
    }
    const p = l.code.match(/^(?:Digit|Numpad)([1-9])$/), c = p ? parseInt(p[1]) : NaN;
    if (!isNaN(c)) {
      l.preventDefault();
      const f = e.state.nav.page, k = ce();
      if (c === 1 && f > 1) {
        e.set("nav", "page", f - 1);
        return;
      }
      if (c === 9 && f < k) {
        e.set("nav", "page", f + 1);
        return;
      }
      const E = c - 1, S = Ke();
      E < S.length && _e(S[E]);
    }
  }
  function I(l) {
    if (!t) return;
    n = true;
    const s = t.getBoundingClientRect();
    o = l.clientX - s.left, a = l.clientY - s.top;
    const p = (f) => {
      n && e.set("window", (k) => ({
        ...k,
        x: Math.max(-k.width + 50, Math.min(f.clientX - o, window.innerWidth - 50)),
        y: Math.max(0, Math.min(f.clientY - a, window.innerHeight - 50))
      }));
    }, c = () => {
      n = false, document.removeEventListener("mousemove", p), document.removeEventListener("mouseup", c);
    };
    document.addEventListener("mousemove", p), document.addEventListener("mouseup", c);
  }
  function q(l) {
    l.preventDefault(), l.stopPropagation(), d = true;
    const s = l.clientX, p = l.clientY, c = e.state.window.width, f = e.state.window.height, k = (S) => {
      d && e.set("window", (C) => ({
        ...C,
        width: Math.max(Ar, c + (S.clientX - s)),
        height: Math.max(Mr, f + (S.clientY - p))
      }));
    }, E = () => {
      d = false, document.removeEventListener("mousemove", k), document.removeEventListener("mouseup", E);
    };
    document.addEventListener("mousemove", k), document.addEventListener("mouseup", E);
  }
  function B() {
    e.set("window", {
      x: Math.round(window.innerWidth * 0.375),
      y: Math.round(window.innerHeight * 0.375),
      width: Math.round(window.innerWidth * 0.25),
      height: Math.round(window.innerHeight * 0.25)
    });
  }
  const V = solidJs.createMemo(() => e.state.visible && e.state.mode === "dir");
  return solidJs.createEffect(() => {
    V() && e.state.palette.overlay === null && !T() && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    Be() && console.log(`[Rove:DirView:${e.keyPrefix}] visible=${V()}`);
  }), web.createComponent(solidJs.Show, {
    get when() {
      return V();
    },
    get children() {
      var l = Pr(), s = l.firstChild, p = t;
      return typeof p == "function" ? web.use(p, l) : t = l, l.style.setProperty("position", "fixed"), l.style.setProperty("z-index", "var(--rove-z-index)"), l.style.setProperty("background", "var(--rove-bg)"), l.style.setProperty("border", "1px solid var(--rove-border)"), l.style.setProperty("border-radius", "var(--rove-border-radius)"), l.style.setProperty("box-shadow", "var(--rove-shadow)"), l.style.setProperty("display", "flex"), l.style.setProperty("flex-direction", "column"), l.style.setProperty("overflow", "hidden"), l.style.setProperty("min-width", "200px"), l.style.setProperty("min-height", "150px"), web.insert(l, web.createComponent(pr, {
        get title() {
          return K();
        },
        get canGoBack() {
          return se();
        },
        get ephemeral() {
          return u() !== null;
        },
        onBack: Ve,
        onModeSwap: () => e.set("mode", "palette"),
        onClose: () => e.set("visible", false),
        onReset: B,
        onDragStart: I
      }), s), web.insert(l, web.createComponent(mr, {
        get pathLabels() {
          return X();
        },
        onNavigateTo: Je
      }), s), web.insert(l, web.createComponent(solidJs.Switch, {
        get children() {
          return [web.createComponent(solidJs.Match, {
            get when() {
              return T();
            },
            children: (c) => (() => {
              var f = kr(), k = f.firstChild, E = k.nextSibling;
              return web.insert(k, () => c().item.label), web.insert(f, web.createComponent(solidJs.Show, {
                get when() {
                  return c().item.inputType === "textarea";
                },
                get children() {
                  var S = wr();
                  return S.$$keydown = (C) => {
                    C.key === "Enter" && (C.ctrlKey || C.metaKey) && (C.preventDefault(), ge());
                  }, S.$$input = (C) => i(C.currentTarget.value), web.use((C) => {
                    r = C;
                  }, S), web.effect(() => S.value = v()), S;
                }
              }), E), web.insert(f, web.createComponent(solidJs.Show, {
                get when() {
                  return c().item.inputType === "text";
                },
                get children() {
                  var S = $r();
                  return S.$$keydown = (C) => {
                    C.key === "Enter" && (C.preventDefault(), ge());
                  }, S.$$input = (C) => i(C.currentTarget.value), web.use((C) => {
                    r = C;
                  }, S), web.effect(() => S.value = v()), S;
                }
              }), E), web.insert(E, () => c().item.inputType === "textarea" ? "Ctrl+Enter to save · Esc to cancel" : "Enter to save · Esc to cancel"), f;
            })()
          }), web.createComponent(solidJs.Match, {
            get when() {
              return m();
            },
            children: (c) => [(() => {
              var f = _r();
              return f.style.setProperty("flex", "1"), f.style.setProperty("overflow-y", "auto"), f.style.setProperty("padding", "4px 0"), web.insert(f, web.createComponent(solidJs.For, {
                get each() {
                  return c().item.options ?? [];
                },
                children: (k, E) => {
                  const S = () => c().selected.includes(k);
                  return (() => {
                    var C = Er(), _ = C.firstChild, w = _.firstChild, j = _.nextSibling, z = j.nextSibling;
                    return C.addEventListener("mouseleave", (R) => R.currentTarget.style.background = ""), C.addEventListener("mouseenter", (R) => R.currentTarget.style.background = "var(--rove-hover)"), C.$$click = () => ke(E()), C.style.setProperty("display", "flex"), C.style.setProperty("align-items", "center"), C.style.setProperty("gap", "8px"), C.style.setProperty("padding", "6px 12px"), C.style.setProperty("cursor", "pointer"), C.style.setProperty("color", "var(--rove-text)"), _.style.setProperty("color", "var(--rove-text-dim)"), _.style.setProperty("font-size", "11px"), _.style.setProperty("min-width", "14px"), web.insert(_, () => E() + 1, w), j.style.setProperty("min-width", "14px"), j.style.setProperty("font-size", "13px"), web.insert(j, () => S() ? "☑" : "☐"), z.style.setProperty("flex", "1"), web.insert(z, k), web.effect((R) => {
                      var N = S(), Z = S() ? "var(--rove-accent)" : "var(--rove-text-dim)";
                      return N !== R.e && web.setAttribute(C, "aria-selected", R.e = N), Z !== R.t && ((R.t = Z) != null ? j.style.setProperty("color", Z) : j.style.removeProperty("color")), R;
                    }, {
                      e: void 0,
                      t: void 0
                    }), C;
                  })();
                }
              })), f;
            })(), (() => {
              var f = Sr(), k = f.firstChild;
              return web.insert(f, () => c().selected.length, k), f;
            })()]
          }), web.createComponent(solidJs.Match, {
            when: true,
            get children() {
              return [(() => {
                var c = xr();
                return c.style.setProperty("flex", "1"), c.style.setProperty("overflow-y", "auto"), c.style.setProperty("padding", "4px 0"), web.insert(c, web.createComponent(solidJs.For, {
                  get each() {
                    return Ke();
                  },
                  children: (f, k) => (() => {
                    var E = Lr(), S = E.firstChild, C = S.firstChild, _ = S.nextSibling;
                    return E.addEventListener("mouseleave", (w) => w.currentTarget.style.background = ""), E.addEventListener("mouseenter", (w) => w.currentTarget.style.background = "var(--rove-hover)"), E.$$click = () => _e(f), web.setAttribute(E, "aria-selected", false), E.style.setProperty("display", "flex"), E.style.setProperty("align-items", "center"), E.style.setProperty("gap", "8px"), E.style.setProperty("padding", "6px 12px"), E.style.setProperty("cursor", "pointer"), E.style.setProperty("color", "var(--rove-text)"), S.style.setProperty("color", "var(--rove-text-dim)"), S.style.setProperty("font-size", "11px"), S.style.setProperty("min-width", "14px"), web.insert(S, () => k() + 1, C), _.style.setProperty("flex", "1"), web.insert(_, () => "label" in f.item ? f.item.label : f.key), web.insert(E, web.createComponent(solidJs.Show, {
                      get when() {
                        return f.item.type === "input";
                      },
                      get children() {
                        var w = Cr();
                        return w.style.setProperty("font-size", "11px"), w.style.setProperty("color", "var(--rove-text-dim)"), w.style.setProperty("max-width", "80px"), w.style.setProperty("overflow", "hidden"), w.style.setProperty("text-overflow", "ellipsis"), w.style.setProperty("white-space", "nowrap"), web.insert(w, () => He(f.key, f.item)), w;
                      }
                    }), null), web.insert(E, web.createComponent(solidJs.Show, {
                      get when() {
                        var w;
                        return ((w = u()) == null ? void 0 : w.selectedKey) === f.key;
                      },
                      get children() {
                        var w = Ir();
                        return w.style.setProperty("color", "var(--rove-accent)"), w.style.setProperty("font-size", "13px"), w;
                      }
                    }), null), web.insert(E, web.createComponent(solidJs.Show, {
                      get when() {
                        return f.item.type === "directory" || f.item.type === "select" || f.item.type === "input" && f.item.inputType === "select" || f.item.type === "input" && f.item.inputType === "select-multiple";
                      },
                      get children() {
                        var w = Tr();
                        return w.style.setProperty("color", "var(--rove-text-dim)"), w;
                      }
                    }), null), E;
                  })()
                })), c;
              })(), web.createComponent(solidJs.Show, {
                get when() {
                  return ce() > 1;
                },
                get children() {
                  var c = br(), f = c.firstChild;
                  return c.style.setProperty("padding", "4px 12px"), c.style.setProperty("font-size", "11px"), c.style.setProperty("color", "var(--rove-text-dim)"), c.style.setProperty("border-top", "1px solid var(--rove-border)"), c.style.setProperty("text-align", "center"), web.insert(c, () => e.state.nav.page, f), web.insert(c, ce, null), c;
                }
              })];
            }
          })];
        }
      }), s), s.$$mousedown = q, s.style.setProperty("position", "absolute"), s.style.setProperty("bottom", "0"), s.style.setProperty("right", "0"), s.style.setProperty("width", "12px"), s.style.setProperty("height", "12px"), s.style.setProperty("cursor", "se-resize"), s.style.setProperty("background", "var(--rove-text-dim)"), s.style.setProperty("clip-path", "polygon(100% 0, 100% 100%, 0 100%)"), s.style.setProperty("opacity", "0.4"), web.effect((c) => {
        var f = `${e.state.window.x}px`, k = `${e.state.window.y}px`, E = `${e.state.window.width}px`, S = `${e.state.window.height}px`;
        return f !== c.e && ((c.e = f) != null ? l.style.setProperty("left", f) : l.style.removeProperty("left")), k !== c.t && ((c.t = k) != null ? l.style.setProperty("top", k) : l.style.removeProperty("top")), E !== c.a && ((c.a = E) != null ? l.style.setProperty("width", E) : l.style.removeProperty("width")), S !== c.o && ((c.o = S) != null ? l.style.setProperty("height", S) : l.style.removeProperty("height")), c;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      }), l;
    }
  });
}
web.delegateEvents(["mousedown", "input", "keydown", "click"]);
var zr = /* @__PURE__ */ web.template("<div class=modal-loading><span>Loading <!>…</span><button>Dismiss"), Rr = /* @__PURE__ */ web.template("<div class=modal-error><p></p><button>Close"), Hr = /* @__PURE__ */ web.template("<div class=modal-backdrop><div class=modal-sheet role=dialog aria-modal=true>"), qr = /* @__PURE__ */ web.template("<input type=text class=modal-input-field>"), jr = /* @__PURE__ */ web.template('<textarea class="modal-input-field modal-textarea">'), Nr = /* @__PURE__ */ web.template("<input type=checkbox class=modal-input-checkbox>"), Br = /* @__PURE__ */ web.template("<select class=modal-input-field>"), Vr = /* @__PURE__ */ web.template("<select multiple class=modal-input-field>"), Or = /* @__PURE__ */ web.template('<div class=modal-input><label class=modal-label></label><div class=modal-actions><button class="modal-btn modal-btn--primary">Accept <kbd>Ctrl+Enter</kbd></button><button class=modal-btn>Cancel <kbd>Esc'), mt = /* @__PURE__ */ web.template("<option>");
function xt(e) {
  return Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((t) => !t.hasAttribute("disabled"));
}
function Kr(e) {
  let t, r = null;
  solidJs.onMount(() => {
    r = document.activeElement;
    const o = xt(t);
    o[0] && o[0].focus();
  }), solidJs.onCleanup(() => {
    r instanceof HTMLElement && r.focus();
  });
  function n(o) {
    var g;
    if (o.key !== "Tab") return;
    const a = xt(t);
    if (a.length === 0) return;
    const u = a[0], y = a[a.length - 1], T = (g = t.ownerDocument) == null ? void 0 : g.activeElement;
    o.shiftKey && T === u ? (o.preventDefault(), y.focus()) : !o.shiftKey && T === y && (o.preventDefault(), u.focus());
  }
  function d(o) {
    n(o), o.key === "Escape" && (o.preventDefault(), e.onCancel());
  }
  return (() => {
    var o = Hr(), a = o.firstChild;
    web.addEventListener(o, "click", e.onCancel, true), o.style.setProperty("position", "fixed"), o.style.setProperty("inset", "0"), o.style.setProperty("background", "rgba(0,0,0,0.45)"), o.style.setProperty("z-index", "1000000"), o.style.setProperty("display", "flex"), o.style.setProperty("align-items", "center"), o.style.setProperty("justify-content", "center"), a.$$click = (y) => y.stopPropagation(), a.$$keydown = d;
    var u = t;
    return typeof u == "function" ? web.use(u, a) : t = a, a.style.setProperty("background", "var(--rove-bg)"), a.style.setProperty("border", "1px solid var(--rove-border)"), a.style.setProperty("border-radius", "var(--rove-border-radius)"), a.style.setProperty("box-shadow", "var(--rove-shadow)"), a.style.setProperty("width", "90%"), a.style.setProperty("max-width", "460px"), a.style.setProperty("padding", "20px 24px"), a.style.setProperty("max-height", "80vh"), a.style.setProperty("overflow-y", "auto"), web.insert(a, web.createComponent(solidJs.Switch, {
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
            var y = zr(), T = y.firstChild, g = T.firstChild, v = g.nextSibling;
            v.nextSibling;
            var i = T.nextSibling;
            return web.insert(T, () => e.overlay.label, v), web.addEventListener(i, "click", e.onCancel, true), y;
          }
        }), web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "error";
          },
          get children() {
            var y = Rr(), T = y.firstChild, g = T.nextSibling;
            return web.insert(T, () => e.overlay.message), web.addEventListener(g, "click", e.onCancel, true), y;
          }
        })];
      }
    })), o;
  })();
}
function Ur(e) {
  const t = () => {
    const o = e.item.defaultValue;
    return o !== void 0 ? o : e.item.inputType === "checkbox" ? false : e.item.inputType === "select-multiple" ? [] : "";
  }, [r, n] = solidJs.createSignal(t()), d = e.item.inputType;
  return (() => {
    var o = Or(), a = o.firstChild, u = a.nextSibling, y = u.firstChild, T = y.nextSibling;
    return web.insert(a, () => e.item.label), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "text",
      get children() {
        var g = qr();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, g.addEventListener("focus", (v) => {
          const i = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(i, i);
        }), g.$$input = (v) => n(v.currentTarget.value), web.effect(() => g.value = r()), g;
      }
    }), u), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "textarea",
      get children() {
        var g = jr();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, g.addEventListener("focus", (v) => {
          const i = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(i, i);
        }), g.$$input = (v) => n(v.currentTarget.value), web.insert(g, () => r()), g;
      }
    }), u), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "checkbox",
      get children() {
        var g = Nr();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, g.addEventListener("change", (v) => n(v.currentTarget.checked)), web.effect(() => g.checked = r()), g;
      }
    }), u), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "select",
      get children() {
        var g = Br();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, g.addEventListener("change", (v) => n(v.currentTarget.value)), web.insert(g, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
            var m = mt();
            return m.value = i, web.insert(m, i), m;
          })());
        }), web.effect(() => g.value = r()), g;
      }
    }), u), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "select-multiple",
      get children() {
        var g = Vr();
        return g.addEventListener("change", (v) => {
          const i = Array.from(v.currentTarget.selectedOptions).map((m) => m.value);
          n(i);
        }), g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, web.insert(g, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
            var m = mt();
            return m.value = i, web.insert(m, i), m;
          })());
        }), g;
      }
    }), u), y.$$click = () => e.onAccept(r()), web.addEventListener(T, "click", e.onCancel, true), o;
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
  }), n = document.createElement("style");
  n.textContent = Wr, r.appendChild(n);
  const d = document.createElement("div");
  d.className = "rove-root", r.appendChild(d), t.tabIndex = -1, e.registry.setShadowHost(t);
  const o = window.matchMedia("(prefers-color-scheme: dark)"), a = e.state.meta.theme;
  t.setAttribute("data-theme", a === "system" ? o.matches ? "dark" : "light" : a);
  const u = web.render(() => web.createComponent(Yr, web.mergeProps(e, {
    shadowHost: t
  })), d);
  return {
    host: t,
    dispose: u
  };
}
function Yr(e) {
  const t = window.matchMedia("(prefers-color-scheme: dark)");
  function r() {
    const a = e.state.meta.theme;
    a === "system" ? e.shadowHost.setAttribute("data-theme", t.matches ? "dark" : "light") : e.shadowHost.setAttribute("data-theme", a);
  }
  solidJs.createEffect(r);
  const n = () => {
    e.state.meta.theme === "system" && r();
  };
  t.addEventListener("change", n), solidJs.onCleanup(() => t.removeEventListener("change", n));
  function d(a) {
    const u = e.state.palette.overlay;
    (u == null ? void 0 : u.type) === "input" && ($e(e.keyPrefix, "input", u.nodePath.join("."), a), u.item.onChange && u.item.onChange(a), e.set("palette", "overlay", null));
  }
  function o() {
    e.set("palette", "overlay", null);
  }
  return [web.createComponent(dr, {
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
      return web.createComponent(Kr, {
        get overlay() {
          return e.state.palette.overlay;
        },
        get keyPrefix() {
          return e.keyPrefix;
        },
        onAccept: d,
        onCancel: o
      });
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return Be();
    },
    get children() {
      var a = Gr(), u = a.firstChild, y = u.firstChild, T = y.nextSibling, g = T.nextSibling, v = g.nextSibling;
      v.nextSibling;
      var i = u.nextSibling, m = i.firstChild, h = m.nextSibling;
      h.nextSibling;
      var L = i.nextSibling, M = L.firstChild, x = M.nextSibling;
      return x.nextSibling, a.style.setProperty("position", "fixed"), a.style.setProperty("bottom", "4px"), a.style.setProperty("background", "#000"), a.style.setProperty("color", "#0f0"), a.style.setProperty("font-size", "10px"), a.style.setProperty("font-family", "monospace"), a.style.setProperty("padding", "3px 8px"), a.style.setProperty("z-index", "99999999"), a.style.setProperty("pointer-events", "none"), a.style.setProperty("border-radius", "3px"), a.style.setProperty("border", "1px solid #0f0"), a.style.setProperty("line-height", "1.8"), a.style.setProperty("opacity", "0.95"), web.insert(u, () => e.keyPrefix, T), web.insert(u, () => String(e.state.visible), v), web.insert(u, () => e.state.mode, null), web.insert(i, () => e.state.meta.theme, h), web.insert(i, () => e.state.nav.history.length - 1, null), web.insert(L, () => e.state.meta.palettePin, x), web.insert(L, () => {
        var H;
        return String(((H = e.state.palette.overlay) == null ? void 0 : H.type) ?? "null");
      }, null), web.effect((H) => {
        var P = e.keyPrefix.length <= 4 ? "4px" : "auto", $ = e.keyPrefix.length <= 4 ? "auto" : "4px";
        return P !== H.e && ((H.e = P) != null ? a.style.setProperty("left", P) : a.style.removeProperty("left")), $ !== H.t && ((H.t = $) != null ? a.style.setProperty("right", $) : a.style.removeProperty("right")), H;
      }, {
        e: void 0,
        t: void 0
      }), a;
    }
  })];
}
function Zr(e, t) {
  if (!["directory", "action", "input", "select"].includes(t.type))
    throw new Error(`Rove: Invalid node type '${t.type}' on node '${e}'.`);
  if (t.type === "select" && !t.options && !t.load)
    throw new Error(`Rove: SelectItem '${e}' requires either 'options' or 'load'.`);
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
  if (t.type === "directory") {
    if (!t.children && !t.load)
      throw new Error(`Rove: DirectoryNodeItem '${e}' requires either 'children' or 'load'.`);
    t.children && kt(t.children);
  }
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
  const t = Mt(e), [r, n] = Rt(t), d = new jt(), o = Ft(e.keyPrefix, n, d), a = { ...e.tree, meta: o };
  let u = Yt(a);
  function y() {
    return u;
  }
  function T(x) {
    u = x;
  }
  n("nav", {
    history: [{ key: "", label: "Root", node: a }],
    page: 1,
    totalPages: Math.max(1, Math.ceil(Object.keys(a).length / 9))
  });
  const { host: g, dispose: v } = Xr({
    state: r,
    set: n,
    registry: d,
    keyPrefix: e.keyPrefix,
    onDestroy: M,
    getIndex: y,
    setIndex: T,
    rootTree: a
  });
  d.registerGlobal(t.globalShortcut, "global-toggle", (x) => {
    var H, P;
    x.preventDefault(), r.mode === "palette" ? n("visible", !r.visible) : r.visible ? document.activeElement !== g && ((H = g.shadowRoot) == null ? void 0 : H.activeElement) == null ? (((P = g.shadowRoot) == null ? void 0 : P.querySelector(
      'input:not([type="hidden"]), textarea, [tabindex="0"]'
    )) ?? g).focus() : n("visible", false) : (n("visible", true), requestAnimationFrame(() => {
      var $;
      (($ = g.shadowRoot) == null ? void 0 : $.activeElement) == null && g.focus();
    }));
  });
  const i = (x) => {
    r.mode !== "palette" || !r.visible || x.composedPath().includes(g) || n("visible", false);
  };
  document.addEventListener("focusin", i, true), document.addEventListener("mousedown", i, true), d.registerScoped(t.modeSwapShortcut, "mode-swap", (x) => {
    x.preventDefault();
    const H = r.mode === "palette" ? "dir" : "palette";
    n("mode", H);
  });
  function m() {
    n("visible", true), requestAnimationFrame(() => {
      var x;
      ((x = g.shadowRoot) == null ? void 0 : x.activeElement) == null && g.focus();
    });
  }
  function h() {
    console.log(`[Rove:${e.keyPrefix}] hide() called — setting visible=false`), n("visible", false);
  }
  function L() {
    r.visible ? h() : m();
  }
  function M() {
    d.destroy(), document.removeEventListener("focusin", i, true), document.removeEventListener("mousedown", i, true), v(), g.remove(), At(e.keyPrefix);
  }
  return window[`__rove_state_${e.keyPrefix}`] = r, window[`__rove_set_${e.keyPrefix}`] = n, window[`__rove_host_${e.keyPrefix}`] = g, { show: m, hide: h, toggle: L, destroy: M };
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
