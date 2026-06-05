(function (store, web, solidJs, ui) {
'use strict';

var St = Object.defineProperty;
var Et = (e, t, r) => t in e ? St(e, t, { enumerable: true, configurable: true, writable: true, value: r }) : e[t] = r;
var Be = (e, t, r) => Et(e, typeof t != "symbol" ? t + "" : t, r);
function de(e, t, r) {
  try {
    const n = localStorage.getItem(`${e}.${t}.${r}`);
    return n !== null ? JSON.parse(n) : null;
  } catch {
    return null;
  }
}
function ke(e, t, r, n) {
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
const Te = {
  mode: "palette",
  palettePin: "top",
  globalShortcut: "Ctrl+`",
  modeSwapShortcut: "Ctrl+Shift+`",
  rememberLastMode: false,
  theme: "system"
};
function Mt(e) {
  const { keyPrefix: t, defaults: r = {} } = e, n = {
    mode: r.mode ?? Te.mode,
    palettePin: r.palettePin ?? Te.palettePin,
    globalShortcut: r.globalShortcut ?? Te.globalShortcut,
    modeSwapShortcut: r.modeSwapShortcut ?? Te.modeSwapShortcut,
    rememberLastMode: r.rememberLastMode ?? Te.rememberLastMode,
    theme: r.theme ?? Te.theme
  }, d = de(t, "meta", "mode");
  (d === "palette" || d === "dir") && (n.mode = d);
  const o = de(t, "meta", "palettePin");
  (o === "top" || o === "middle" || o === "bottom") && (n.palettePin = o);
  const a = de(t, "meta", "globalShortcut");
  a && (n.globalShortcut = a);
  const p = de(t, "meta", "modeSwapShortcut");
  p && (n.modeSwapShortcut = p);
  const f = de(t, "meta", "rememberLastMode");
  typeof f == "boolean" && (n.rememberLastMode = f);
  const I = de(t, "meta", "theme");
  return (I === "light" || I === "dark" || I === "system") && (n.theme = I), n;
}
function zt() {
  return {
    x: Math.round(window.innerWidth * 0.375),
    y: Math.round(window.innerHeight * 0.375),
    width: Math.round(window.innerWidth * 0.25),
    height: Math.round(window.innerHeight * 0.25)
  };
}
function Dt(e) {
  return {
    visible: false,
    mode: e.mode,
    window: zt(),
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
  return store.createStore(Dt(e));
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
  const r = t.split("+"), n = r[r.length - 1], d = r.includes("Ctrl"), o = r.includes("Shift"), a = r.includes("Alt"), p = r.includes("Meta");
  if (e.ctrlKey !== d || e.shiftKey !== o || e.altKey !== a || e.metaKey !== p)
    return false;
  if (n.length === 1 && /[a-z0-9]/i.test(n))
    return e.key.toLowerCase() === n.toLowerCase();
  const f = qt[n];
  return f ? e.code === f : e.key === n;
}
class jt {
  constructor() {
    Be(this, "entries", /* @__PURE__ */ new Map());
    Be(this, "shadowHost", null);
    Be(this, "globalHandler");
    Be(this, "scopedHandler");
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
      interLft2: p,
      interLft1: f,
      //	interRgt2,
      //	interRgt1,
      start: I,
      intraIns: g,
      interIns: v,
      cases: i
    } = e;
    return d.map((x, h) => h).sort((x, h) => (
      // most contig chars matched
      o[h] - o[x] || // least char intra-fuzz (most contiguous)
      g[x] - g[h] || // most prefix bounds, boosted by full term matches
      a[h] + p[h] + 0.5 * f[h] - (a[x] + p[x] + 0.5 * f[x]) || // highest density of match (least span)
      //	span[ia] - span[ib] ||
      // highest density of match (least term inter-fuzz)
      v[x] - v[h] || // earliest start of match
      I[x] - I[h] || // case match
      i[h] - i[x] || // alphabetic
      n(t[d[x]], t[d[h]])
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
    intraSub: p,
    intraTrn: f,
    intraDel: I,
    intraContr: g,
    intraSplit: v,
    interSplit: i,
    intraBound: x,
    interBound: h,
    intraChars: L,
    toUpper: z,
    toLower: b,
    compare: H
  } = e;
  a ?? (a = d), p ?? (p = d), f ?? (f = d), I ?? (I = d), H ?? (H = typeof Intl > "u" ? wt : new Intl.Collator(...Ot).compare);
  let k = e.letters ?? e.alpha;
  if (k != null) {
    let T = z(k), q = b(k);
    i = Ie(i, T, q), v = Ie(v, T, q), h = Ie(h, T, q), x = Ie(x, T, q), L = Ie(L, T, q), g = Ie(g, T, q);
  }
  let C = t ? "u" : "";
  const X = '".+?"', se = new RegExp(X, "gi" + C), K = new RegExp(`(?:\\s+|^)-(?:${L}+|${X})`, "gi" + C);
  let { intraRules: F } = e;
  F == null && (F = (T) => {
    let q = ft.intraSlice, B = 0, V = 0, l = 0, s = 0;
    if (/[^\d]/.test(T)) {
      let u = T.length;
      u <= 4 ? u >= 3 && (l = Math.min(f, 1), u == 4 && (B = Math.min(a, 1))) : (q = o, B = a, V = p, l = f, s = I);
    }
    return {
      intraSlice: q,
      intraIns: B,
      intraSub: V,
      intraTrn: l,
      intraDel: s
    };
  });
  let ae = !!v, ue = new RegExp(v, "g" + C), Oe = new RegExp(i, "g" + C), Je = new RegExp("^" + i + "|" + i + "$", "g" + C), Ke = new RegExp(g, "gi" + C);
  const ce = (T, q = false) => {
    let B = [];
    T = T.replace(se, (l) => (B.push(l), pt)), T = T.replace(Je, ""), q || (T = b(T)), ae && (T = T.replace(ue, (l) => l[0] + " " + l[1]));
    let V = 0;
    return T.split(Oe).filter((l) => l != "").map((l) => l === pt ? B[V++] : l);
  }, Ue = /[^\d]+|\d+/g, qe = (T, q = 0, B = false) => {
    let V = ce(T);
    if (V.length == 0)
      return [];
    let l = Array(V.length).fill("");
    V = V.map((S, m) => S.replace(Ke, (w) => (l[m] = w, "")));
    let s;
    if (d == 1)
      s = V.map((S, m) => {
        if (S[0] === '"')
          return rt(S.slice(1, -1));
        let w = "";
        for (let _ of S.matchAll(Ue)) {
          let $ = _[0], {
            intraSlice: E,
            intraIns: j,
            intraSub: D,
            intraTrn: R,
            intraDel: N
          } = F($);
          if (j + D + R + N == 0)
            w += $ + l[m];
          else {
            let [Z, Q] = E, ee = $.slice(0, Z), pe = $.slice(Q), J = $.slice(Z, Q);
            j == 1 && ee.length == 1 && ee != J[0] && (ee += "(?!" + ee + ")");
            let me = J.length, fe = [$];
            if (D)
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
            w += "(?:" + fe.join("|") + ")" + l[m];
          }
        }
        return w;
      });
    else {
      let S = lt(L, a);
      q == 2 && a > 0 && (S = ")(" + S + ")("), s = V.map((m, w) => m[0] === '"' ? rt(m.slice(1, -1)) : m.split("").map((_, $, E) => (a == 1 && $ == 0 && E.length > 1 && _ != E[$ + 1] && (_ += "(?!" + _ + ")"), _)).join(S) + l[w]);
    }
    let u = r == 2 ? ht : "", c = n == 2 ? ht : "", y = c + lt(e.interChars, e.interIns) + u;
    return q > 0 ? B ? s = u + "(" + s.join(")" + c + "|" + u + "(") + ")" + c : (s = "(" + s.join(")(" + y + ")(") + ")", s = "(.??" + u + ")" + s + "(" + c + ".*)") : (s = s.join(y), s = u + s + c), [new RegExp(s, "i" + C), V, l];
  }, ge = (T, q, B) => {
    let [V] = qe(q);
    if (V == null)
      return null;
    let l = [];
    if (B != null)
      for (let s = 0; s < B.length; s++) {
        let u = B[s];
        V.test(T[u]) && l.push(u);
      }
    else
      for (let s = 0; s < T.length; s++)
        V.test(T[s]) && l.push(s);
    return l;
  };
  let Ge = !!x, _e = new RegExp(h, C), Se = new RegExp(x, C);
  const We = (T, q, B) => {
    let [V, l, s] = qe(B, 1), u = ce(B, true), [c] = qe(B, 2), y = l.length, S = Array(y), m = Array(y);
    for (let D = 0; D < y; D++) {
      let R = l[D], N = u[D], Z = R[0] == '"' ? R.slice(1, -1) : R + s[D], Q = N[0] == '"' ? N.slice(1, -1) : N + s[D];
      S[D] = Z, m[D] = Q;
    }
    let w = T.length, _ = Array(w).fill(0), $ = {
      // idx in haystack
      idx: Array(w),
      // start of match
      start: _.slice(),
      // length of match
      //	span: field.slice(),
      // contiguous chars matched
      chars: _.slice(),
      // case matched in term (via term.includes(match))
      cases: _.slice(),
      // contiguous (no fuzz) and bounded terms (intra=0, lft2/1, rgt2/1)
      // excludes terms that are contiguous but have < 2 bounds (substrings)
      terms: _.slice(),
      // cumulative length of unmatched chars (fuzz) within span
      interIns: _.slice(),
      // between terms
      intraIns: _.slice(),
      // within terms
      // interLft/interRgt counters
      interLft2: _.slice(),
      interRgt2: _.slice(),
      interLft1: _.slice(),
      interRgt1: _.slice(),
      ranges: Array(w)
    }, E = r == 1 || n == 1, j = 0;
    for (let D = 0; D < T.length; D++) {
      let R = q[T[D]], N = R.match(V), Z = N.index + N[1].length, Q = Z, ee = false, pe = 0, J = 0, me = 0, fe = 0, U = 0, xe = 0, st = 0, it = 0, at = 0, be = [];
      for (let G = 0, Y = 2; G < y; G++, Y += 2) {
        let he = b(N[Y]), le = S[G], et = m[G], ne = le.length, oe = he.length, te = he == le;
        if (N[Y] == et && st++, !te && N[Y + 1].length >= ne) {
          let W = b(N[Y + 1]).indexOf(le);
          W > -1 && (be.push(Q, oe, W, ne), Q += je(N, Y, W, ne), he = le, oe = ne, te = true, G == 0 && (Z = Q));
        }
        if (E || te) {
          let W = Q - 1, ye = Q + oe, Pe = false, Ne = false;
          if (W == -1 || _e.test(R[W]))
            te && pe++, Pe = true;
          else {
            if (r == 2) {
              ee = true;
              break;
            }
            if (Ge && Se.test(R[W] + R[W + 1]))
              te && J++, Pe = true;
            else if (r == 1) {
              let Ye = N[Y + 1], Ee = Q + oe;
              if (Ye.length >= ne) {
                let we = 0, Ce = false, _t = new RegExp(le, "ig" + C), ct;
                for (; ct = _t.exec(Ye); ) {
                  we = ct.index;
                  let dt = Ee + we, tt = dt - 1;
                  if (tt == -1 || _e.test(R[tt])) {
                    pe++, Ce = true;
                    break;
                  } else if (Se.test(R[tt] + R[dt])) {
                    J++, Ce = true;
                    break;
                  }
                }
                Ce && (Pe = true, be.push(Q, oe, we, ne), Q += je(N, Y, we, ne), he = le, oe = ne, te = true, G == 0 && (Z = Q));
              }
              if (!Pe) {
                ee = true;
                break;
              }
            }
          }
          if (ye == R.length || _e.test(R[ye]))
            te && me++, Ne = true;
          else {
            if (n == 2) {
              ee = true;
              break;
            }
            if (Ge && Se.test(R[ye - 1] + R[ye]))
              te && fe++, Ne = true;
            else if (n == 1) {
              ee = true;
              break;
            }
          }
          te && (U += ne, Pe && Ne && xe++);
        }
        if (oe > ne && (at += oe - ne), G > 0 && (it += N[Y - 1].length), !e.intraFilt(le, he, Q)) {
          ee = true;
          break;
        }
        G < y - 1 && (Q += oe + N[Y + 1].length);
      }
      if (!ee) {
        $.idx[j] = T[D], $.interLft2[j] = pe, $.interLft1[j] = J, $.interRgt2[j] = me, $.interRgt1[j] = fe, $.chars[j] = U, $.terms[j] = xe, $.cases[j] = st, $.interIns[j] = it, $.intraIns[j] = at, $.start[j] = Z;
        let G = R.match(c), Y = G.index + G[1].length, he = be.length, le = he > 0 ? 0 : 1 / 0, et = he - 4;
        for (let W = 2; W < G.length; ) {
          let ye = G[W].length;
          if (le <= et && be[le] == Y) {
            let Pe = be[le + 1], Ne = be[le + 2], Ye = be[le + 3], Ee = W, we = "";
            for (let Ce = 0; Ce < Pe; Ee++)
              we += G[Ee], Ce += G[Ee].length;
            G.splice(W, Ee - W, we), Y += je(G, W, Ne, Ye), le += 4;
          } else
            Y += ye, W++;
        }
        Y = G.index + G[1].length;
        let ne = $.ranges[j] = [], oe = Y, te = Y;
        for (let W = 2; W < G.length; W++) {
          let ye = G[W].length;
          Y += ye, W % 2 == 0 ? te = Y : ye > 0 && (ne.push(oe, te), oe = te = Y);
        }
        te > oe && ne.push(oe, te), j++;
      }
    }
    if (j < T.length)
      for (let D in $)
        $[D] = $[D].slice(0, j);
    return $;
  }, je = (T, q, B, V) => {
    let l = T[q] + T[q + 1].slice(0, B);
    return T[q - 1] += l, T[q] = T[q + 1].slice(B, B + V), T[q + 1] = T[q + 1].slice(B + V), l.length;
  }, Qe = 5, Xe = (T, q, B, V = 1e3, l) => {
    B = B ? B === true ? Qe : B : 0;
    let s = null, u = null, c = [];
    q = q.replace(K, ($) => {
      let E = $.trim().slice(1);
      return E = E[0] === '"' ? rt(E.slice(1, -1)) : E.replace(Nt, ""), E != "" && c.push(E), "";
    });
    let y = ce(q), S;
    if (c.length > 0) {
      if (S = new RegExp(c.join("|"), "i" + C), y.length == 0) {
        let $ = [];
        for (let E = 0; E < T.length; E++)
          S.test(T[E]) || $.push(E);
        return [$, null, null];
      }
    } else if (y.length == 0)
      return [null, null, null];
    if (B > 0) {
      let $ = ce(q);
      if ($.length > 1) {
        let E = $.slice().sort((D, R) => R.length - D.length);
        for (let D = 0; D < E.length; D++) {
          if ((l == null ? void 0 : l.length) == 0)
            return [[], null, null];
          l = ge(T, E[D], l);
        }
        if ($.length > B)
          return [l, null, null];
        s = $t($).map((D) => D.join(" ")), u = [];
        let j = /* @__PURE__ */ new Set();
        for (let D = 0; D < s.length; D++)
          if (j.size < l.length) {
            let R = l.filter((Z) => !j.has(Z)), N = ge(T, s[D], R);
            for (let Z = 0; Z < N.length; Z++)
              j.add(N[Z]);
            u.push(N);
          } else
            u.push([]);
      }
    }
    s == null && (s = [q], u = [(l == null ? void 0 : l.length) > 0 ? l : ge(T, q)]);
    let m = null, w = null;
    if (c.length > 0 && (u = u.map(($) => $.filter((E) => !S.test(T[E])))), u.reduce(($, E) => $ + E.length, 0) <= V) {
      m = {}, w = [];
      for (let $ = 0; $ < u.length; $++) {
        let E = u[$];
        if (E == null || E.length == 0)
          continue;
        let j = s[$], D = We(E, T, j), R = e.sort(D, T, j, H);
        if ($ > 0)
          for (let N = 0; N < R.length; N++)
            R[N] += w.length;
        for (let N in D)
          m[N] = (m[N] ?? []).concat(D[N]);
        w = w.concat(R);
      }
    }
    return [
      [].concat(...u),
      m,
      w
    ];
  };
  return {
    search: (...T) => Xe(...T),
    split: ce,
    filter: ge,
    info: We,
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
    for (let p = 0; p < o.length; p++)
      a[p] = o[p].replace(n, d);
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
    let a = t[o], p = t[o + 1];
    n = d(n, r(e.substring(a, p), true)) ?? n, o < t.length - 3 && (n = d(n, r(e.substring(t[o + 1], t[o + 2]), false)) ?? n);
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
      const p = "label" in a ? a.label : o, f = r.length > 0 ? `${r.join(" > ")} > ${p}` : p;
      n.push(f), d.push({
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
    const a = r[o], p = e.items[a], f = n.ranges[o], I = [];
    for (let g = 0; g < f.length; g += 2)
      I.push([f[g], f[g + 1]]);
    return {
      ...p,
      score: n.idx[o],
      ranges: I
    };
  });
}
function vt(e, t, r, n) {
  const d = [...e.haystack], o = [...e.items];
  return Ze(t, r, n, d, o), { haystack: d, items: o };
}
function Ft(e, t, r) {
  function n(d, o, a, p) {
    return {
      type: "input",
      label: d,
      inputType: o,
      options: p == null ? void 0 : p.options,
      storageKey: `${e}.meta.${a}`,
      onChange: (f) => {
        ke(e, "meta", a, f), p != null && p.onChange && p.onChange(f), Ht(t, { [a]: f });
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
const [Ve, nl] = solidJs.createSignal(false);
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
        var p = Jt();
        return p.style.setProperty("font-size", "11px"), p.style.setProperty("color", "var(--rove-text-dim)"), p.style.setProperty("margin-bottom", "2px"), web.insert(p, n), p;
      }
    }), a), web.insert(a, web.createComponent(solidJs.For, {
      get each() {
        return d();
      },
      children: (p) => p.highlighted ? (() => {
        var f = er();
        return f.style.setProperty("background", "var(--rove-accent)"), f.style.setProperty("color", "var(--rove-bg)"), f.style.setProperty("border-radius", "2px"), f.style.setProperty("padding", "0 1px"), web.insert(f, () => p.text), f;
      })() : (() => {
        var f = tr();
        return web.insert(f, () => p.text), f;
      })()
    })), web.effect((p) => {
      var f = `palette-result${e.selected ? " palette-result--selected" : ""}`, I = e.selected, g = e.selected ? "var(--rove-selected)" : "transparent";
      return f !== p.e && web.className(o, p.e = f), I !== p.t && web.setAttribute(o, "aria-selected", p.t = I), g !== p.a && ((p.a = g) != null ? o.style.setProperty("background", g) : o.style.removeProperty("background")), p;
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
    const i = e.state.palette.query, x = i ? Zt(e.getIndex(), i) : [];
    e.set("palette", (h) => ({
      ...h,
      results: x,
      selectedIndex: 0
    }));
  });
  const o = solidJs.createMemo(() => {
    const i = n();
    if (!i) return [];
    const x = e.state.palette.query.toLowerCase();
    return x ? i.options.filter(({
      key: h,
      item: L
    }) => ("label" in L ? L.label : h).toLowerCase().includes(x)) : i.options;
  });
  function a(i) {
    const x = i.target.value;
    e.set("palette", "query", x), d((h) => h ? {
      ...h,
      selectedIndex: 0
    } : null);
  }
  function p(i) {
    const x = n();
    if (x) {
      const z = o();
      if (i.key === "ArrowDown")
        i.preventDefault(), d((b) => b ? {
          ...b,
          selectedIndex: Math.min(b.selectedIndex + 1, z.length - 1)
        } : null);
      else if (i.key === "ArrowUp")
        i.preventDefault(), d((b) => b ? {
          ...b,
          selectedIndex: Math.max(b.selectedIndex - 1, 0)
        } : null);
      else if (i.key === "Enter") {
        i.preventDefault();
        const b = z[x.selectedIndex];
        b && f(b);
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
      const z = h[L];
      z && I(z);
    } else i.key === "Escape" && (i.preventDefault(), e.state.palette.query ? e.set("palette", "query", "") : e.set("visible", false));
  }
  function f(i) {
    var h;
    const x = n();
    (h = x == null ? void 0 : x.onSelect) == null || h.call(x, i.key, i.item), d(null), e.set("palette", (L) => ({
      ...L,
      query: "",
      results: [],
      selectedIndex: 0
    }));
  }
  function I(i) {
    const x = i.item;
    if (x.type === "action")
      x.action(), e.set("palette", (h) => ({
        ...h,
        query: "",
        results: [],
        selectedIndex: 0
      })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
    else if (x.type === "input") {
      const h = de(e.keyPrefix, "input", i.path.join(".")), L = h !== null ? {
        ...x,
        defaultValue: h
      } : x;
      e.set("palette", (z) => ({
        ...z,
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
    } else if (x.type === "directory" && x.load) {
      const h = x;
      if (h.children) {
        const L = vt(e.getIndex(), h.children, i.path, i.pathLabels);
        e.setIndex(L);
        const z = Object.entries(h.children).map(([b, H]) => ({
          item: H,
          key: b,
          path: [...i.path, b],
          pathLabels: [...i.pathLabels, h.label],
          score: 0,
          ranges: []
        }));
        e.set("palette", (b) => ({
          ...b,
          query: "",
          results: z,
          selectedIndex: 0
        })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
      } else {
        const L = h.load;
        let z = false;
        e.set("palette", "overlay", {
          type: "loading",
          label: h.label,
          cancel: () => {
            z = true;
          }
        }), L().then((b) => {
          if (z) return;
          h.children = b, e.set("palette", "overlay", null);
          const H = vt(e.getIndex(), b, i.path, i.pathLabels);
          e.setIndex(H);
          const k = Object.entries(b).map(([C, X]) => ({
            item: X,
            key: C,
            path: [...i.path, C],
            pathLabels: [...i.pathLabels, h.label],
            score: 0,
            ranges: []
          }));
          e.set("palette", (C) => ({
            ...C,
            query: "",
            results: k,
            selectedIndex: 0
          })), requestAnimationFrame(() => t == null ? void 0 : t.focus());
        }).catch((b) => {
          e.set("palette", "overlay", {
            type: "error",
            message: b instanceof Error ? b.message : "Load failed."
          });
        });
      }
    } else if (x.type === "select") {
      const h = x, L = (z) => {
        const b = z.map((H) => ({
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
          options: b,
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
        let z = false;
        e.set("palette", "overlay", {
          type: "loading",
          label: h.label,
          cancel: () => {
            z = true;
          }
        }), h.load().then((b) => {
          z || (e.set("palette", "overlay", null), L(b));
        }).catch((b) => {
          e.set("palette", "overlay", {
            type: "error",
            message: b instanceof Error ? b.message : "Load failed."
          });
        });
      }
    }
  }
  const g = () => e.state.meta.palettePin, v = solidJs.createMemo(() => e.state.visible && e.state.mode === "palette");
  return solidJs.createEffect(() => {
    Ve() && console.log(`[Rove:Palette:${e.keyPrefix}] visible=${v()}`);
  }), [web.createComponent(solidJs.Show, {
    get when() {
      return Ve();
    },
    get children() {
      var i = nr(), x = i.firstChild, h = x.nextSibling, L = h.nextSibling, z = L.nextSibling;
      return z.nextSibling, i.style.setProperty("position", "fixed"), i.style.setProperty("top", "8px"), i.style.setProperty("color", "#fff"), i.style.setProperty("font-size", "10px"), i.style.setProperty("font-family", "monospace"), i.style.setProperty("padding", "3px 10px"), i.style.setProperty("border-radius", "20px"), i.style.setProperty("z-index", "99999999"), i.style.setProperty("pointer-events", "none"), i.style.setProperty("line-height", "1.6"), web.insert(i, () => e.keyPrefix, h), web.insert(i, () => String(v()), z), web.insert(i, (() => {
        var b = web.memo(() => !!n());
        return () => b() ? n().label : "none";
      })(), null), web.effect((b) => {
        var H = e.keyPrefix.length <= 4 ? "8px" : "auto", k = e.keyPrefix.length <= 4 ? "auto" : "8px", C = v() ? "#00c853" : "#c62828";
        return H !== b.e && ((b.e = H) != null ? i.style.setProperty("left", H) : i.style.removeProperty("left")), k !== b.t && ((b.t = k) != null ? i.style.setProperty("right", k) : i.style.removeProperty("right")), C !== b.a && ((b.a = C) != null ? i.style.setProperty("background", C) : i.style.removeProperty("background")), b;
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
      var i = ar(), x = i.firstChild, h = x.firstChild, L = h.nextSibling, z = x.nextSibling;
      i.style.setProperty("position", "fixed"), i.style.setProperty("left", "50%"), i.style.setProperty("width", "50vw"), i.style.setProperty("max-width", "700px"), i.style.setProperty("min-width", "300px"), i.style.setProperty("z-index", "var(--rove-z-index)"), i.style.setProperty("background", "var(--rove-bg)"), i.style.setProperty("border", "1px solid var(--rove-border)"), i.style.setProperty("border-radius", "var(--rove-border-radius)"), i.style.setProperty("box-shadow", "var(--rove-shadow)"), web.setAttribute(i, "aria-expanded", true), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return Ve();
        },
        get children() {
          var k = or(), C = k.firstChild, X = C.nextSibling;
          return X.nextSibling, k.style.setProperty("background", "red"), k.style.setProperty("color", "white"), k.style.setProperty("font-size", "10px"), k.style.setProperty("padding", "2px 6px"), k.style.setProperty("font-family", "monospace"), web.insert(k, () => e.keyPrefix, X), web.insert(k, g, null), k;
        }
      }), x), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() !== null;
        },
        get children() {
          var k = sr(), C = k.firstChild;
          C.firstChild;
          var X = C.nextSibling;
          return k.style.setProperty("padding", "6px 14px"), k.style.setProperty("font-size", "11px"), k.style.setProperty("color", "var(--rove-accent)"), k.style.setProperty("background", "var(--rove-selected)"), k.style.setProperty("display", "flex"), k.style.setProperty("align-items", "center"), k.style.setProperty("gap", "6px"), C.style.setProperty("font-weight", "600"), web.insert(C, () => n().label, null), X.style.setProperty("color", "var(--rove-text-dim)"), X.style.setProperty("margin-left", "auto"), k;
        }
      }), x), x.style.setProperty("display", "flex"), x.style.setProperty("align-items", "center"), h.$$keydown = p, h.$$input = a;
      var b = t;
      typeof b == "function" ? web.use(b, h) : t = h, h.style.setProperty("flex", "1"), h.style.setProperty("padding", "10px 14px"), h.style.setProperty("border", "none"), h.style.setProperty("background", "transparent"), h.style.setProperty("color", "var(--rove-text)"), h.style.setProperty("font-size", "16px"), h.style.setProperty("outline", "none"), h.style.setProperty("min-width", "0"), L.$$click = () => e.set("mode", "dir"), L.style.setProperty("background", "none"), L.style.setProperty("border", "none"), L.style.setProperty("border-left", "1px solid var(--rove-border)"), L.style.setProperty("cursor", "pointer"), L.style.setProperty("color", "var(--rove-text-dim)"), L.style.setProperty("padding", "0 14px"), L.style.setProperty("font-size", "15px"), L.style.setProperty("line-height", "1"), L.style.setProperty("align-self", "stretch"), L.style.setProperty("display", "flex"), L.style.setProperty("align-items", "center");
      var H = r;
      return typeof H == "function" ? web.use(H, z) : r = z, z.style.setProperty("position", "absolute"), z.style.setProperty("width", "1px"), z.style.setProperty("height", "1px"), z.style.setProperty("overflow", "hidden"), z.style.setProperty("clip", "rect(0,0,0,0)"), z.style.setProperty("white-space", "nowrap"), web.insert(z, (() => {
        var k = web.memo(() => !!n());
        return () => k() ? `${o().length} options` : e.state.palette.results.length > 0 ? `${e.state.palette.results.length} results` : e.state.palette.query ? "No results" : "";
      })()), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() !== null;
        },
        get children() {
          var k = gt();
          return k.style.setProperty("max-height", "50vh"), k.style.setProperty("overflow-y", "auto"), k.style.setProperty("border-top", "1px solid var(--rove-border)"), web.insert(k, web.createComponent(solidJs.For, {
            get each() {
              return o();
            },
            children: (C, X) => {
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
                }), K.$$click = () => f(C), K.style.setProperty("display", "flex"), K.style.setProperty("align-items", "center"), K.style.setProperty("padding", "8px 14px"), K.style.setProperty("cursor", "pointer"), K.style.setProperty("color", "var(--rove-text)"), K.style.setProperty("font-size", "14px"), web.insert(K, () => "label" in C.item ? C.item.label : C.key), web.effect((F) => {
                  var ae = se(), ue = se() ? "var(--rove-selected)" : "transparent";
                  return ae !== F.e && web.setAttribute(K, "aria-selected", F.e = ae), ue !== F.t && ((F.t = ue) != null ? K.style.setProperty("background", ue) : K.style.removeProperty("background")), F;
                }, {
                  e: void 0,
                  t: void 0
                }), K;
              })();
            }
          }), null), web.insert(k, web.createComponent(solidJs.Show, {
            get when() {
              return o().length === 0;
            },
            get children() {
              var C = ir();
              return C.style.setProperty("padding", "8px 14px"), C.style.setProperty("color", "var(--rove-text-dim)"), C.style.setProperty("font-size", "13px"), C;
            }
          }), null), k;
        }
      }), null), web.insert(i, web.createComponent(solidJs.Show, {
        get when() {
          return n() === null;
        },
        get children() {
          var k = gt();
          return k.style.setProperty("max-height", "50vh"), k.style.setProperty("overflow-y", "auto"), web.insert(k, web.createComponent(solidJs.For, {
            get each() {
              return e.state.palette.results;
            },
            children: (C, X) => web.createComponent(lr, {
              result: C,
              get selected() {
                return X() === e.state.palette.selectedIndex;
              },
              onActivate: () => I(C)
            })
          })), web.effect((C) => (C = e.state.palette.results.length > 0 ? "1px solid var(--rove-border)" : "none") != null ? k.style.setProperty("border-top", C) : k.style.removeProperty("border-top")), k;
        }
      }), null), web.effect((k) => {
        var C = g() === "top" ? "0" : g() === "middle" ? "50%" : "auto", X = g() === "bottom" ? "0" : "auto", se = g() === "middle" ? "translate(-50%, -50%)" : "translateX(-50%)", K = n() ? "Filter…" : "Search…";
        return C !== k.e && ((k.e = C) != null ? i.style.setProperty("top", C) : i.style.removeProperty("top")), X !== k.t && ((k.t = X) != null ? i.style.setProperty("bottom", X) : i.style.removeProperty("bottom")), se !== k.a && ((k.a = se) != null ? i.style.setProperty("transform", se) : i.style.removeProperty("transform")), K !== k.o && web.setAttribute(h, "placeholder", k.o = K), k;
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
    var t = yr(), r = t.firstChild, n = r.nextSibling, d = n.firstChild, o = n.nextSibling, a = o.nextSibling, p = a.nextSibling;
    return web.addEventListener(t, "mousedown", e.onDragStart, true), t.style.setProperty("display", "flex"), t.style.setProperty("align-items", "center"), t.style.setProperty("padding", "6px 8px"), t.style.setProperty("background", "var(--rove-surface)"), t.style.setProperty("border-bottom", "1px solid var(--rove-border)"), t.style.setProperty("cursor", "move"), t.style.setProperty("user-select", "none"), t.style.setProperty("gap", "6px"), r.$$mousedown = (f) => f.stopPropagation(), r.$$click = (f) => {
      f.stopPropagation(), e.onBack();
    }, r.style.setProperty("background", "none"), r.style.setProperty("border", "none"), r.style.setProperty("font-size", "14px"), r.style.setProperty("padding", "2px 6px"), n.style.setProperty("flex", "1"), n.style.setProperty("display", "flex"), n.style.setProperty("align-items", "center"), n.style.setProperty("justify-content", "center"), n.style.setProperty("gap", "6px"), n.style.setProperty("overflow", "hidden"), n.style.setProperty("font-weight", "500"), n.style.setProperty("font-size", "13px"), n.style.setProperty("color", "var(--rove-text)"), web.insert(n, web.createComponent(solidJs.Show, {
      get when() {
        return e.ephemeral;
      },
      get children() {
        var f = ur();
        return f.style.setProperty("font-size", "10px"), f.style.setProperty("font-weight", "600"), f.style.setProperty("color", "var(--rove-accent)"), f.style.setProperty("background", "var(--rove-selected)"), f.style.setProperty("padding", "1px 6px"), f.style.setProperty("border-radius", "10px"), f.style.setProperty("white-space", "nowrap"), f.style.setProperty("flex-shrink", "0"), f;
      }
    }), d), d.style.setProperty("overflow", "hidden"), d.style.setProperty("text-overflow", "ellipsis"), d.style.setProperty("white-space", "nowrap"), web.insert(d, () => e.title), o.$$mousedown = (f) => f.stopPropagation(), o.$$click = (f) => {
      f.stopPropagation(), e.onModeSwap();
    }, o.style.setProperty("background", "none"), o.style.setProperty("border", "none"), o.style.setProperty("cursor", "pointer"), o.style.setProperty("color", "var(--rove-text-dim)"), o.style.setProperty("font-size", "14px"), o.style.setProperty("padding", "2px 6px"), a.$$mousedown = (f) => f.stopPropagation(), a.$$click = (f) => {
      f.stopPropagation(), e.onReset();
    }, a.style.setProperty("background", "none"), a.style.setProperty("border", "none"), a.style.setProperty("cursor", "pointer"), a.style.setProperty("color", "var(--rove-text-dim)"), a.style.setProperty("font-size", "12px"), a.style.setProperty("padding", "2px 6px"), p.$$mousedown = (f) => f.stopPropagation(), p.$$click = (f) => {
      f.stopPropagation(), e.onClose();
    }, p.style.setProperty("background", "none"), p.style.setProperty("border", "none"), p.style.setProperty("cursor", "pointer"), p.style.setProperty("color", "var(--rove-text-dim)"), p.style.setProperty("font-size", "16px"), p.style.setProperty("padding", "2px 6px"), web.effect((f) => {
      var I = !e.canGoBack, g = e.canGoBack ? "pointer" : "default", v = e.canGoBack ? "var(--rove-text)" : "var(--rove-text-dim)";
      return I !== f.e && (r.disabled = f.e = I), g !== f.t && ((f.t = g) != null ? r.style.setProperty("cursor", g) : r.style.removeProperty("cursor")), v !== f.a && ((f.a = v) != null ? r.style.setProperty("color", v) : r.style.removeProperty("color")), f;
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
var xr = /* @__PURE__ */ web.template("<div role=listbox class=dirview-items>"), br = /* @__PURE__ */ web.template("<div>/"), Pr = /* @__PURE__ */ web.template('<div class=dirview-container role=navigation aria-label="Directory navigator"tabindex=0><div class=dirview-resize>'), wr = /* @__PURE__ */ web.template("<textarea class=dirview-inline-field>"), $r = /* @__PURE__ */ web.template("<input type=text class=dirview-inline-field>"), kr = /* @__PURE__ */ web.template("<div class=dirview-inline><label class=dirview-inline-label></label><span class=dirview-inline-hint>"), _r = /* @__PURE__ */ web.template("<div role=listbox>"), Sr = /* @__PURE__ */ web.template("<div class=dirview-multiselect-footer> selected · Enter to save · Esc to cancel"), Er = /* @__PURE__ */ web.template("<div role=option><span>.</span><span></span><span>"), Cr = /* @__PURE__ */ web.template('<div role=option aria-label="Previous page"><span>.</span><span>← Previous page'), Tr = /* @__PURE__ */ web.template('<div role=option aria-label="Next page"><span>.</span><span>Next page →'), Ir = /* @__PURE__ */ web.template("<span>"), Lr = /* @__PURE__ */ web.template("<span>✓"), Ar = /* @__PURE__ */ web.template("<span>→"), Mr = /* @__PURE__ */ web.template("<div class=dirview-item role=option><span>.</span><span>");
const $e = 9, zr = 200, Dr = 150;
function Rr(e) {
  let t, r, n = false, d = false, o = 0, a = 0;
  const [p, f] = solidJs.createSignal(null), [I, g] = solidJs.createSignal(null), [v, i] = solidJs.createSignal(""), [x, h] = solidJs.createSignal(null), [L, z] = solidJs.createSignal(0);
  solidJs.createEffect(() => {
    if (!I()) {
      r = void 0;
      return;
    }
    requestAnimationFrame(() => {
      var c;
      const s = r;
      if (!s) return;
      s.focus();
      const u = s.value.length;
      (c = s.setSelectionRange) == null || c.call(s, u, u);
    });
  });
  const b = () => e.state.nav.history, H = () => b()[b().length - 1], k = () => {
    var l;
    return ((l = H()) == null ? void 0 : l.node) ?? {};
  }, C = () => b().slice(1).map((l) => l.key), X = () => b().slice(1).map((l) => l.label), se = () => b().length > 1 || I() !== null || x() !== null, K = () => {
    var l, s, u;
    return ((l = I()) == null ? void 0 : l.item.label) ?? ((s = x()) == null ? void 0 : s.item.label) ?? ((u = H()) == null ? void 0 : u.label) ?? "Root";
  };
  function F(l) {
    return Math.max(1, Math.ceil(Object.keys(l).length / $e));
  }
  function ae(l, s, u) {
    const c = {
      key: l,
      label: u,
      node: s
    };
    e.set("nav", (y) => ({
      ...y,
      history: [...y.history, c],
      page: 1,
      totalPages: F(s)
    }));
  }
  function ue(l) {
    const s = b().slice(0, l.returnHistoryLength), u = s[s.length - 1];
    e.set("nav", (c) => ({
      ...c,
      history: s,
      page: 1,
      totalPages: F((u == null ? void 0 : u.node) ?? {})
    })), f(null), t == null || t.focus();
  }
  function Oe() {
    if (I()) {
      g(null), t == null || t.focus();
      return;
    }
    if (x()) {
      h(null), t == null || t.focus();
      return;
    }
    const l = b();
    if (l.length <= 1) return;
    const s = p();
    if (s && l.length <= s.returnHistoryLength + 1) {
      ue(s);
      return;
    }
    const u = l.slice(0, -1), c = u[u.length - 1];
    e.set("nav", (y) => ({
      ...y,
      history: u,
      page: 1,
      totalPages: F((c == null ? void 0 : c.node) ?? {})
    }));
  }
  function Je(l) {
    if (I()) {
      g(null);
      return;
    }
    if (x()) {
      h(null);
      return;
    }
    const s = b(), u = l === -1 ? [s[0]] : s.slice(0, l + 2), c = u[u.length - 1];
    e.set("nav", (S) => ({
      ...S,
      history: u,
      page: 1,
      totalPages: F((c == null ? void 0 : c.node) ?? {})
    }));
    const y = p();
    y && u.length <= y.returnHistoryLength && f(null);
  }
  solidJs.onMount(() => {
    const l = de(e.keyPrefix, "window", "state");
    l && e.set("window", l);
  }), solidJs.createEffect(() => {
    if (!V()) return;
    const l = t;
    l && (l.addEventListener("keydown", Xe), solidJs.onCleanup(() => l.removeEventListener("keydown", Xe)));
  }), solidJs.createEffect(() => ke(e.keyPrefix, "window", "state", e.state.window));
  const Ke = solidJs.createMemo(() => Object.entries(k()).map(([l, s]) => ({
    key: l,
    item: s
  }))), ce = solidJs.createMemo(() => {
    const l = Ke().length;
    return l <= $e ? 1 : 1 + Math.ceil((l - ($e - 1)) / ($e - 2));
  }), Ue = solidJs.createMemo(() => {
    const l = Ke(), s = ce(), u = e.state.nav.page;
    if (s === 1)
      return l.map((_) => ({
        kind: "item",
        key: _.key,
        item: _.item
      }));
    const c = u > 1, y = u < s, S = $e - (c ? 1 : 0) - (y ? 1 : 0), m = u === 1 ? 0 : $e - 1 + (u - 2) * ($e - 2), w = [];
    c && w.push({
      kind: "prev"
    });
    for (const _ of l.slice(m, m + S))
      w.push({
        kind: "item",
        key: _.key,
        item: _.item
      });
    return y && w.push({
      kind: "next"
    }), w;
  });
  solidJs.createEffect(() => {
    const l = ce();
    e.state.nav.totalPages !== l && e.set("nav", "totalPages", l);
  });
  function qe(l, s) {
    L();
    const u = de(e.keyPrefix, "input", [...C(), l].join(".")), c = u !== null ? u : s.defaultValue;
    return c == null ? "" : s.inputType === "checkbox" ? typeof c == "boolean" ? c ? "✓" : "○" : "" : s.inputType === "select-multiple" ? Array.isArray(c) && c.length > 0 ? `${c.join(", ")}` : "" : typeof c == "string" ? c : "";
  }
  function ge() {
    var u, c;
    const l = I();
    if (!l) return;
    const s = v();
    ke(e.keyPrefix, "input", l.nodePath.join("."), s), (c = (u = l.item).onChange) == null || c.call(u, s), g(null), z((y) => y + 1), t == null || t.focus();
  }
  function Ge() {
    var s, u;
    const l = x();
    l && (ke(e.keyPrefix, "input", l.nodePath.join("."), l.selected), (u = (s = l.item).onChange) == null || u.call(s, l.selected), h(null), z((c) => c + 1), t == null || t.focus());
  }
  function _e(l) {
    const s = x();
    if (!s) return;
    const u = s.item.options ?? [];
    if (l >= u.length) return;
    const c = u[l], y = s.selected.includes(c) ? s.selected.filter((S) => S !== c) : [...s.selected, c];
    h({
      ...s,
      selected: y
    });
  }
  function Se(l) {
    var y;
    const {
      key: s,
      item: u
    } = l, c = p();
    u.type === "directory" ? u.children ? ae(s, u.children, u.label) : u.load && je(s, u.label, u) : u.type === "action" ? (u.action(), c && ((y = c.onSelect) == null || y.call(c, s, u), ue(c))) : u.type === "input" ? We(s, u) : u.type === "select" && Qe(s, u);
  }
  function We(l, s) {
    var y;
    const u = [...C(), l], c = de(e.keyPrefix, "input", u.join("."));
    if (s.inputType === "checkbox") {
      const m = !(c !== null ? c : s.defaultValue ?? false);
      ke(e.keyPrefix, "input", u.join("."), m), (y = s.onChange) == null || y.call(s, m), z((w) => w + 1);
    } else if (s.inputType === "text" || s.inputType === "textarea") {
      const S = c !== null ? c : s.defaultValue ?? "";
      i(S), g({
        key: l,
        nodePath: u,
        item: s
      });
    } else if (s.inputType === "select") {
      const S = c !== null ? c : s.defaultValue ?? "", m = s.options ?? [], w = {};
      for (const $ of m) {
        const E = $;
        w[E] = {
          type: "action",
          label: E,
          action: () => {
            var j;
            ke(e.keyPrefix, "input", u.join("."), E), (j = s.onChange) == null || j.call(s, E), z((D) => D + 1);
          }
        };
      }
      const _ = b().length;
      ae(l, w, s.label), f({
        returnHistoryLength: _,
        selectedKey: S
      });
    } else if (s.inputType === "select-multiple") {
      const S = c !== null && Array.isArray(c) ? c : Array.isArray(s.defaultValue) ? s.defaultValue : [];
      h({
        key: l,
        nodePath: u,
        item: s,
        selected: [...S]
      });
    }
  }
  function je(l, s, u) {
    let c = false;
    e.set("palette", "overlay", {
      type: "loading",
      label: s,
      cancel: () => {
        c = true;
      }
    }), u.load().then((y) => {
      c || (u.children = y, e.set("palette", "overlay", null), ae(l, y, s));
    }).catch((y) => {
      e.set("palette", "overlay", {
        type: "error",
        message: y instanceof Error ? y.message : "Load failed."
      });
    });
  }
  function Qe(l, s) {
    const u = (c) => {
      const y = {};
      for (const S of c)
        y[S] = {
          type: "action",
          label: S,
          action: () => {
            s.onSelect(S);
          }
        };
      return y;
    };
    if (s.options) {
      const c = b().length;
      ae(l, u(s.options), s.label), f({
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
      }), s.load().then((y) => {
        if (c) return;
        e.set("palette", "overlay", null);
        const S = b().length;
        ae(l, u(y), s.label), f({
          returnHistoryLength: S
        });
      }).catch((y) => {
        e.set("palette", "overlay", {
          type: "error",
          message: y instanceof Error ? y.message : "Load failed."
        });
      });
    }
  }
  function Xe(l) {
    if (e.state.mode !== "dir" || !e.state.visible) return;
    const s = l.target;
    if (s.tagName === "INPUT" || s.tagName === "TEXTAREA") {
      l.key === "Escape" && (l.preventDefault(), g(null), t == null || t.focus());
      return;
    }
    if (x()) {
      if (l.key === "Enter") {
        l.preventDefault(), Ge();
        return;
      }
      if (l.key === "Escape") {
        l.preventDefault(), h(null), t == null || t.focus();
        return;
      }
      const y = l.code.match(/^(?:Digit|Numpad)([1-9])$/), S = y ? parseInt(y[1]) : NaN;
      isNaN(S) || (l.preventDefault(), _e(S - 1));
      return;
    }
    if (l.key === "Escape") {
      l.preventDefault();
      const y = p();
      y ? ue(y) : e.set("visible", false);
      return;
    }
    if (l.key === "Backspace") {
      l.preventDefault(), Oe();
      return;
    }
    const u = l.code.match(/^(?:Digit|Numpad)([1-9])$/), c = u ? parseInt(u[1]) : NaN;
    if (!isNaN(c)) {
      l.preventDefault();
      const y = Ue()[c - 1];
      if (!y) return;
      y.kind === "prev" ? e.set("nav", "page", e.state.nav.page - 1) : y.kind === "next" ? e.set("nav", "page", e.state.nav.page + 1) : Se(y);
    }
  }
  function T(l) {
    if (!t) return;
    n = true;
    const s = t.getBoundingClientRect();
    o = l.clientX - s.left, a = l.clientY - s.top;
    const u = (y) => {
      n && e.set("window", (S) => ({
        ...S,
        x: Math.max(-S.width + 50, Math.min(y.clientX - o, window.innerWidth - 50)),
        y: Math.max(0, Math.min(y.clientY - a, window.innerHeight - 50))
      }));
    }, c = () => {
      n = false, document.removeEventListener("mousemove", u), document.removeEventListener("mouseup", c);
    };
    document.addEventListener("mousemove", u), document.addEventListener("mouseup", c);
  }
  function q(l) {
    l.preventDefault(), l.stopPropagation(), d = true;
    const s = l.clientX, u = l.clientY, c = e.state.window.width, y = e.state.window.height, S = (w) => {
      d && e.set("window", (_) => ({
        ..._,
        width: Math.max(zr, c + (w.clientX - s)),
        height: Math.max(Dr, y + (w.clientY - u))
      }));
    }, m = () => {
      d = false, document.removeEventListener("mousemove", S), document.removeEventListener("mouseup", m);
    };
    document.addEventListener("mousemove", S), document.addEventListener("mouseup", m);
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
    V() && e.state.palette.overlay === null && !I() && (t == null || t.focus());
  }), solidJs.createEffect(() => {
    Ve() && console.log(`[Rove:DirView:${e.keyPrefix}] visible=${V()}`);
  }), web.createComponent(solidJs.Show, {
    get when() {
      return V();
    },
    get children() {
      var l = Pr(), s = l.firstChild, u = t;
      return typeof u == "function" ? web.use(u, l) : t = l, l.style.setProperty("position", "fixed"), l.style.setProperty("z-index", "var(--rove-z-index)"), l.style.setProperty("background", "var(--rove-bg)"), l.style.setProperty("border", "1px solid var(--rove-border)"), l.style.setProperty("border-radius", "var(--rove-border-radius)"), l.style.setProperty("box-shadow", "var(--rove-shadow)"), l.style.setProperty("display", "flex"), l.style.setProperty("flex-direction", "column"), l.style.setProperty("overflow", "hidden"), l.style.setProperty("min-width", "200px"), l.style.setProperty("min-height", "150px"), web.insert(l, web.createComponent(pr, {
        get title() {
          return K();
        },
        get canGoBack() {
          return se();
        },
        get ephemeral() {
          return p() !== null;
        },
        onBack: Oe,
        onModeSwap: () => e.set("mode", "palette"),
        onClose: () => e.set("visible", false),
        onReset: B,
        onDragStart: T
      }), s), web.insert(l, web.createComponent(mr, {
        get pathLabels() {
          return X();
        },
        onNavigateTo: Je
      }), s), web.insert(l, web.createComponent(solidJs.Switch, {
        get children() {
          return [web.createComponent(solidJs.Match, {
            get when() {
              return I();
            },
            children: (c) => (() => {
              var y = kr(), S = y.firstChild, m = S.nextSibling;
              return web.insert(S, () => c().item.label), web.insert(y, web.createComponent(solidJs.Show, {
                get when() {
                  return c().item.inputType === "textarea";
                },
                get children() {
                  var w = wr();
                  return w.$$keydown = (_) => {
                    _.key === "Enter" && (_.ctrlKey || _.metaKey) && (_.preventDefault(), ge());
                  }, w.$$input = (_) => i(_.currentTarget.value), web.use((_) => {
                    r = _;
                  }, w), web.effect(() => w.value = v()), w;
                }
              }), m), web.insert(y, web.createComponent(solidJs.Show, {
                get when() {
                  return c().item.inputType === "text";
                },
                get children() {
                  var w = $r();
                  return w.$$keydown = (_) => {
                    _.key === "Enter" && (_.preventDefault(), ge());
                  }, w.$$input = (_) => i(_.currentTarget.value), web.use((_) => {
                    r = _;
                  }, w), web.effect(() => w.value = v()), w;
                }
              }), m), web.insert(m, () => c().item.inputType === "textarea" ? "Ctrl+Enter to save · Esc to cancel" : "Enter to save · Esc to cancel"), y;
            })()
          }), web.createComponent(solidJs.Match, {
            get when() {
              return x();
            },
            children: (c) => [(() => {
              var y = _r();
              return y.style.setProperty("flex", "1"), y.style.setProperty("overflow-y", "auto"), y.style.setProperty("padding", "4px 0"), web.insert(y, web.createComponent(solidJs.For, {
                get each() {
                  return c().item.options ?? [];
                },
                children: (S, m) => {
                  const w = () => c().selected.includes(S);
                  return (() => {
                    var _ = Er(), $ = _.firstChild, E = $.firstChild, j = $.nextSibling, D = j.nextSibling;
                    return _.addEventListener("mouseleave", (R) => R.currentTarget.style.background = ""), _.addEventListener("mouseenter", (R) => R.currentTarget.style.background = "var(--rove-hover)"), _.$$click = () => _e(m()), _.style.setProperty("display", "flex"), _.style.setProperty("align-items", "center"), _.style.setProperty("gap", "8px"), _.style.setProperty("padding", "6px 12px"), _.style.setProperty("cursor", "pointer"), _.style.setProperty("color", "var(--rove-text)"), $.style.setProperty("color", "var(--rove-text-dim)"), $.style.setProperty("font-size", "11px"), $.style.setProperty("min-width", "14px"), web.insert($, () => m() + 1, E), j.style.setProperty("min-width", "14px"), j.style.setProperty("font-size", "13px"), web.insert(j, () => w() ? "☑" : "☐"), D.style.setProperty("flex", "1"), web.insert(D, S), web.effect((R) => {
                      var N = w(), Z = w() ? "var(--rove-accent)" : "var(--rove-text-dim)";
                      return N !== R.e && web.setAttribute(_, "aria-selected", R.e = N), Z !== R.t && ((R.t = Z) != null ? j.style.setProperty("color", Z) : j.style.removeProperty("color")), R;
                    }, {
                      e: void 0,
                      t: void 0
                    }), _;
                  })();
                }
              })), y;
            })(), (() => {
              var y = Sr(), S = y.firstChild;
              return web.insert(y, () => c().selected.length, S), y;
            })()]
          }), web.createComponent(solidJs.Match, {
            when: true,
            get children() {
              return [(() => {
                var c = xr();
                return c.style.setProperty("flex", "1"), c.style.setProperty("overflow-y", "auto"), c.style.setProperty("padding", "4px 0"), web.insert(c, web.createComponent(solidJs.For, {
                  get each() {
                    return Ue();
                  },
                  children: (y, S) => y.kind === "prev" ? (() => {
                    var m = Cr(), w = m.firstChild, _ = w.firstChild;
                    return m.addEventListener("mouseleave", ($) => $.currentTarget.style.background = ""), m.addEventListener("mouseenter", ($) => $.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => e.set("nav", "page", e.state.nav.page - 1), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text-dim)"), m.style.setProperty("font-size", "12px"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), web.insert(w, () => S() + 1, _), m;
                  })() : y.kind === "next" ? (() => {
                    var m = Tr(), w = m.firstChild, _ = w.firstChild;
                    return m.addEventListener("mouseleave", ($) => $.currentTarget.style.background = ""), m.addEventListener("mouseenter", ($) => $.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => e.set("nav", "page", e.state.nav.page + 1), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text-dim)"), m.style.setProperty("font-size", "12px"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), web.insert(w, () => S() + 1, _), m;
                  })() : (() => {
                    var m = Mr(), w = m.firstChild, _ = w.firstChild, $ = w.nextSibling;
                    return m.addEventListener("mouseleave", (E) => E.currentTarget.style.background = ""), m.addEventListener("mouseenter", (E) => E.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => Se(y), web.setAttribute(m, "aria-selected", false), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text)"), w.style.setProperty("color", "var(--rove-text-dim)"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), web.insert(w, () => S() + 1, _), $.style.setProperty("flex", "1"), web.insert($, () => "label" in y.item ? y.item.label : y.key), web.insert(m, web.createComponent(solidJs.Show, {
                      get when() {
                        return y.item.type === "input";
                      },
                      get children() {
                        var E = Ir();
                        return E.style.setProperty("font-size", "11px"), E.style.setProperty("color", "var(--rove-text-dim)"), E.style.setProperty("max-width", "80px"), E.style.setProperty("overflow", "hidden"), E.style.setProperty("text-overflow", "ellipsis"), E.style.setProperty("white-space", "nowrap"), web.insert(E, () => qe(y.key, y.item)), E;
                      }
                    }), null), web.insert(m, web.createComponent(solidJs.Show, {
                      get when() {
                        var E;
                        return ((E = p()) == null ? void 0 : E.selectedKey) === y.key;
                      },
                      get children() {
                        var E = Lr();
                        return E.style.setProperty("color", "var(--rove-accent)"), E.style.setProperty("font-size", "13px"), E;
                      }
                    }), null), web.insert(m, web.createComponent(solidJs.Show, {
                      get when() {
                        return y.item.type === "directory" || y.item.type === "select" || y.item.type === "input" && y.item.inputType === "select" || y.item.type === "input" && y.item.inputType === "select-multiple";
                      },
                      get children() {
                        var E = Ar();
                        return E.style.setProperty("color", "var(--rove-text-dim)"), E;
                      }
                    }), null), m;
                  })()
                })), c;
              })(), web.createComponent(solidJs.Show, {
                get when() {
                  return ce() > 1;
                },
                get children() {
                  var c = br(), y = c.firstChild;
                  return c.style.setProperty("padding", "4px 12px"), c.style.setProperty("font-size", "11px"), c.style.setProperty("color", "var(--rove-text-dim)"), c.style.setProperty("border-top", "1px solid var(--rove-border)"), c.style.setProperty("text-align", "center"), web.insert(c, () => e.state.nav.page, y), web.insert(c, ce, null), c;
                }
              })];
            }
          })];
        }
      }), s), s.$$mousedown = q, s.style.setProperty("position", "absolute"), s.style.setProperty("bottom", "0"), s.style.setProperty("right", "0"), s.style.setProperty("width", "12px"), s.style.setProperty("height", "12px"), s.style.setProperty("cursor", "se-resize"), s.style.setProperty("background", "var(--rove-text-dim)"), s.style.setProperty("clip-path", "polygon(100% 0, 100% 100%, 0 100%)"), s.style.setProperty("opacity", "0.4"), web.effect((c) => {
        var y = `${e.state.window.x}px`, S = `${e.state.window.y}px`, m = `${e.state.window.width}px`, w = `${e.state.window.height}px`;
        return y !== c.e && ((c.e = y) != null ? l.style.setProperty("left", y) : l.style.removeProperty("left")), S !== c.t && ((c.t = S) != null ? l.style.setProperty("top", S) : l.style.removeProperty("top")), m !== c.a && ((c.a = m) != null ? l.style.setProperty("width", m) : l.style.removeProperty("width")), w !== c.o && ((c.o = w) != null ? l.style.setProperty("height", w) : l.style.removeProperty("height")), c;
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
var Hr = /* @__PURE__ */ web.template("<div class=modal-loading><span>Loading <!>…</span><button>Dismiss"), qr = /* @__PURE__ */ web.template("<div class=modal-error><p></p><button>Close"), jr = /* @__PURE__ */ web.template("<div class=modal-backdrop><div class=modal-sheet role=dialog aria-modal=true>"), Nr = /* @__PURE__ */ web.template("<input type=text class=modal-input-field>"), Br = /* @__PURE__ */ web.template('<textarea class="modal-input-field modal-textarea">'), Vr = /* @__PURE__ */ web.template("<input type=checkbox class=modal-input-checkbox>"), Or = /* @__PURE__ */ web.template("<select class=modal-input-field>"), Kr = /* @__PURE__ */ web.template("<select multiple class=modal-input-field>"), Ur = /* @__PURE__ */ web.template('<div class=modal-input><label class=modal-label></label><div class=modal-actions><button class="modal-btn modal-btn--primary">Accept <kbd>Ctrl+Enter</kbd></button><button class=modal-btn>Cancel <kbd>Esc'), mt = /* @__PURE__ */ web.template("<option>");
function xt(e) {
  return Array.from(e.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((t) => !t.hasAttribute("disabled"));
}
function Gr(e) {
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
    const p = a[0], f = a[a.length - 1], I = (g = t.ownerDocument) == null ? void 0 : g.activeElement;
    o.shiftKey && I === p ? (o.preventDefault(), f.focus()) : !o.shiftKey && I === f && (o.preventDefault(), p.focus());
  }
  function d(o) {
    n(o), o.key === "Escape" && (o.preventDefault(), e.onCancel());
  }
  return (() => {
    var o = jr(), a = o.firstChild;
    web.addEventListener(o, "click", e.onCancel, true), o.style.setProperty("position", "fixed"), o.style.setProperty("inset", "0"), o.style.setProperty("background", "rgba(0,0,0,0.45)"), o.style.setProperty("z-index", "1000000"), o.style.setProperty("display", "flex"), o.style.setProperty("align-items", "center"), o.style.setProperty("justify-content", "center"), a.$$click = (f) => f.stopPropagation(), a.$$keydown = d;
    var p = t;
    return typeof p == "function" ? web.use(p, a) : t = a, a.style.setProperty("background", "var(--rove-bg)"), a.style.setProperty("border", "1px solid var(--rove-border)"), a.style.setProperty("border-radius", "var(--rove-border-radius)"), a.style.setProperty("box-shadow", "var(--rove-shadow)"), a.style.setProperty("width", "90%"), a.style.setProperty("max-width", "460px"), a.style.setProperty("padding", "20px 24px"), a.style.setProperty("max-height", "80vh"), a.style.setProperty("overflow-y", "auto"), web.insert(a, web.createComponent(solidJs.Switch, {
      get children() {
        return [web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "input";
          },
          get children() {
            return web.createComponent(Wr, {
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
            var f = Hr(), I = f.firstChild, g = I.firstChild, v = g.nextSibling;
            v.nextSibling;
            var i = I.nextSibling;
            return web.insert(I, () => e.overlay.label, v), web.addEventListener(i, "click", e.onCancel, true), f;
          }
        }), web.createComponent(solidJs.Match, {
          get when() {
            return e.overlay.type === "error";
          },
          get children() {
            var f = qr(), I = f.firstChild, g = I.nextSibling;
            return web.insert(I, () => e.overlay.message), web.addEventListener(g, "click", e.onCancel, true), f;
          }
        })];
      }
    })), o;
  })();
}
function Wr(e) {
  const t = () => {
    const o = e.item.defaultValue;
    return o !== void 0 ? o : e.item.inputType === "checkbox" ? false : e.item.inputType === "select-multiple" ? [] : "";
  }, [r, n] = solidJs.createSignal(t()), d = e.item.inputType;
  return (() => {
    var o = Ur(), a = o.firstChild, p = a.nextSibling, f = p.firstChild, I = f.nextSibling;
    return web.insert(a, () => e.item.label), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "text",
      get children() {
        var g = Nr();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, g.addEventListener("focus", (v) => {
          const i = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(i, i);
        }), g.$$input = (v) => n(v.currentTarget.value), web.effect(() => g.value = r()), g;
      }
    }), p), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "textarea",
      get children() {
        var g = Br();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
        }, g.addEventListener("focus", (v) => {
          const i = v.currentTarget.value.length;
          v.currentTarget.setSelectionRange(i, i);
        }), g.$$input = (v) => n(v.currentTarget.value), web.insert(g, () => r()), g;
      }
    }), p), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "checkbox",
      get children() {
        var g = Vr();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, g.addEventListener("change", (v) => n(v.currentTarget.checked)), web.effect(() => g.checked = r()), g;
      }
    }), p), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "select",
      get children() {
        var g = Or();
        return g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, g.addEventListener("change", (v) => n(v.currentTarget.value)), web.insert(g, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
            var x = mt();
            return x.value = i, web.insert(x, i), x;
          })());
        }), web.effect(() => g.value = r()), g;
      }
    }), p), web.insert(o, web.createComponent(solidJs.Show, {
      when: d === "select-multiple",
      get children() {
        var g = Kr();
        return g.addEventListener("change", (v) => {
          const i = Array.from(v.currentTarget.selectedOptions).map((x) => x.value);
          n(i);
        }), g.$$keydown = (v) => {
          v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
        }, web.insert(g, () => {
          var v;
          return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
            var x = mt();
            return x.value = i, web.insert(x, i), x;
          })());
        }), g;
      }
    }), p), f.$$click = () => e.onAccept(r()), web.addEventListener(I, "click", e.onCancel, true), o;
  })();
}
web.delegateEvents(["click", "keydown", "input"]);
var Xr = /* @__PURE__ */ web.template("<div><div>[<!>] visible=<!> mode=</div><div>theme=<!> navDepth=</div><div>palettePin=<!> overlay=");
const Yr = `
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
function Zr(e) {
  const t = document.createElement("div");
  t.setAttribute("id", `rove-host-${e.keyPrefix}`), document.body.appendChild(t);
  const r = t.attachShadow({
    mode: "open"
  }), n = document.createElement("style");
  n.textContent = Yr, r.appendChild(n);
  const d = document.createElement("div");
  d.className = "rove-root", r.appendChild(d), t.tabIndex = -1, e.registry.setShadowHost(t);
  const o = window.matchMedia("(prefers-color-scheme: dark)"), a = e.state.meta.theme;
  t.setAttribute("data-theme", a === "system" ? o.matches ? "dark" : "light" : a);
  const p = web.render(() => web.createComponent(Fr, web.mergeProps(e, {
    shadowHost: t
  })), d);
  return {
    host: t,
    dispose: p
  };
}
function Fr(e) {
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
    const p = e.state.palette.overlay;
    (p == null ? void 0 : p.type) === "input" && (ke(e.keyPrefix, "input", p.nodePath.join("."), a), p.item.onChange && p.item.onChange(a), e.set("palette", "overlay", null));
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
  }), web.createComponent(Rr, {
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
      return web.createComponent(Gr, {
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
      return Ve();
    },
    get children() {
      var a = Xr(), p = a.firstChild, f = p.firstChild, I = f.nextSibling, g = I.nextSibling, v = g.nextSibling;
      v.nextSibling;
      var i = p.nextSibling, x = i.firstChild, h = x.nextSibling;
      h.nextSibling;
      var L = i.nextSibling, z = L.firstChild, b = z.nextSibling;
      return b.nextSibling, a.style.setProperty("position", "fixed"), a.style.setProperty("bottom", "4px"), a.style.setProperty("background", "#000"), a.style.setProperty("color", "#0f0"), a.style.setProperty("font-size", "10px"), a.style.setProperty("font-family", "monospace"), a.style.setProperty("padding", "3px 8px"), a.style.setProperty("z-index", "99999999"), a.style.setProperty("pointer-events", "none"), a.style.setProperty("border-radius", "3px"), a.style.setProperty("border", "1px solid #0f0"), a.style.setProperty("line-height", "1.8"), a.style.setProperty("opacity", "0.95"), web.insert(p, () => e.keyPrefix, I), web.insert(p, () => String(e.state.visible), v), web.insert(p, () => e.state.mode, null), web.insert(i, () => e.state.meta.theme, h), web.insert(i, () => e.state.nav.history.length - 1, null), web.insert(L, () => e.state.meta.palettePin, b), web.insert(L, () => {
        var H;
        return String(((H = e.state.palette.overlay) == null ? void 0 : H.type) ?? "null");
      }, null), web.effect((H) => {
        var k = e.keyPrefix.length <= 4 ? "4px" : "auto", C = e.keyPrefix.length <= 4 ? "auto" : "4px";
        return k !== H.e && ((H.e = k) != null ? a.style.setProperty("left", k) : a.style.removeProperty("left")), C !== H.t && ((H.t = C) != null ? a.style.setProperty("right", C) : a.style.removeProperty("right")), H;
      }, {
        e: void 0,
        t: void 0
      }), a;
    }
  })];
}
function Jr(e, t) {
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
    Jr(t, r);
}
function Qr(e) {
  if (!e.keyPrefix)
    throw new Error("Rove: 'keyPrefix' is required.");
  kt(e.tree);
  const t = Mt(e), [r, n] = Rt(t), d = new jt(), o = Ft(e.keyPrefix, n, d), a = { ...e.tree, meta: o };
  let p = Yt(a);
  function f() {
    return p;
  }
  function I(b) {
    p = b;
  }
  n("nav", {
    history: [{ key: "", label: "Root", node: a }],
    page: 1,
    totalPages: Math.max(1, Math.ceil(Object.keys(a).length / 9))
  });
  const { host: g, dispose: v } = Zr({
    state: r,
    set: n,
    registry: d,
    keyPrefix: e.keyPrefix,
    onDestroy: z,
    getIndex: f,
    setIndex: I,
    rootTree: a
  });
  d.registerGlobal(t.globalShortcut, "global-toggle", (b) => {
    var H, k;
    b.preventDefault(), r.mode === "palette" ? n("visible", !r.visible) : r.visible ? document.activeElement !== g && ((H = g.shadowRoot) == null ? void 0 : H.activeElement) == null ? (((k = g.shadowRoot) == null ? void 0 : k.querySelector(
      'input:not([type="hidden"]), textarea, [tabindex="0"]'
    )) ?? g).focus() : n("visible", false) : (n("visible", true), requestAnimationFrame(() => {
      var C;
      ((C = g.shadowRoot) == null ? void 0 : C.activeElement) == null && g.focus();
    }));
  });
  const i = (b) => {
    r.mode !== "palette" || !r.visible || b.composedPath().includes(g) || n("visible", false);
  };
  document.addEventListener("focusin", i, true), document.addEventListener("mousedown", i, true), d.registerScoped(t.modeSwapShortcut, "mode-swap", (b) => {
    b.preventDefault();
    const H = r.mode === "palette" ? "dir" : "palette";
    n("mode", H);
  });
  function x() {
    n("visible", true), requestAnimationFrame(() => {
      var b;
      ((b = g.shadowRoot) == null ? void 0 : b.activeElement) == null && g.focus();
    });
  }
  function h() {
    console.log(`[Rove:${e.keyPrefix}] hide() called — setting visible=false`), n("visible", false);
  }
  function L() {
    r.visible ? h() : x();
  }
  function z() {
    d.destroy(), document.removeEventListener("focusin", i, true), document.removeEventListener("mousedown", i, true), v(), g.remove(), At(e.keyPrefix);
  }
  return window[`__rove_state_${e.keyPrefix}`] = r, window[`__rove_set_${e.keyPrefix}`] = n, window[`__rove_host_${e.keyPrefix}`] = g, { show: x, hide: h, toggle: L, destroy: z };
}
typeof window < "u" && typeof __USERSCRIPT_BUILD__ < "u" && __USERSCRIPT_BUILD__ && (window.__ROVE__ = { init: Qr });

// ── Step builders ─────────────────────────────────────────────────────────────

const step = {
  action: (label, fn) => ({
    type: 'action',
    label,
    action: fn
  }),
  input: (label, inputType, storageKey) => ({
    type: 'input',
    label,
    inputType,
    storageKey
  }),
  kb: (label, url) => ({
    type: 'action',
    label,
    action: () => window.open(url, '_blank')
  }),
  // Ephemeral pick list — options loaded async, onSelect fires with chosen string
  branch: (label, load, onSelect) => ({
    type: 'select',
    label,
    load,
    onSelect
  })
};

// ── DirectoryNode builder ─────────────────────────────────────────────────────

function buildSteps(steps) {
  return Object.fromEntries(steps);
}

// ── Error node ────────────────────────────────────────────────────────────────

function errorNode(message) {
  return {
    error: {
      type: 'action',
      label: `✗ ${message}`,
      action: () => {}
    }
  };
}

// ── Workflow type ─────────────────────────────────────────────────────────────

// Lazy directory — first activation calls load(), result cached, navigates in
function workflowNode(w) {
  return {
    type: 'directory',
    label: w.label,
    load: w.load
  };
}

/**
 * ROVE WORKFLOW ENGINE — INTERACTIVE DEMO & REFERENCE
 * =====================================================
 * Open this userscript on any page, press the rove hotkey (default: Ctrl+Shift+P),
 * and explore each demo live. Read the source alongside.
 *
 * QUICK MENTAL MODEL
 * ------------------
 * A Workflow is a lazy directory: rove calls load() on first activation,
 * caches the returned DirectoryNode, and navigates into it. Every key in
 * that node is a step the technician works through in order.
 *
 * Building blocks (step.*):
 *   step.action(label, fn)                          → runs fn() immediately on select
 *   step.input(label, inputType, storageKey)        → saves to localStorage on change
 *   step.kb(label, url)                             → opens URL in new tab
 *   step.branch(label, loadFn, onSelectFn)          → ephemeral pick list
 *
 * Workflow helpers:
 *   buildSteps([['key', item], ...])                → object from ordered pairs
 *   errorNode('message')                            → abort with visible error step
 *   workflowNode(workflow)                          → wraps Workflow as a lazy DirectoryNodeItem
 */


// ─────────────────────────────────────────────────────────────────────────────
// DEMO 1: Minimal — one action, no data
// The simplest possible workflow. Shows the skeleton every workflow shares.
// ─────────────────────────────────────────────────────────────────────────────

const minimalWorkflow = {
  label: 'Hello World',
  load: async () => buildSteps([['greet', step.action('Say Hello', () => ui.showToast('Hello from rove!', {
    theme: 'dark'
  }))]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 2: Ordered steps — the guided checklist pattern
//
// buildSteps() takes an ARRAY of [key, item] pairs, not an object literal.
// Order in the array = order displayed. Keys are identifiers (never shown
// to the user); labels are what appears in the UI.
//
// GOTCHA: If you pass a plain object { stepA: ..., stepB: ... }, JS does not
// guarantee insertion-order in all engines. Always use buildSteps([...]).
// ─────────────────────────────────────────────────────────────────────────────

const orderedStepsWorkflow = {
  label: 'Ordered Steps',
  load: async () => buildSteps([['step1', step.action('1. Do first thing', () => ui.showToast('Step 1 done', {
    theme: 'dark'
  }))], ['step2', step.action('2. Do second thing', () => ui.showToast('Step 2 done', {
    theme: 'dark'
  }))], ['step3', step.action('3. Do third thing', () => ui.showToast('All done!', {
    theme: 'dark'
  }))]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 3: Input → Action — the collect-then-use pattern
//
// step.input stores the value to localStorage[storageKey] on every keystroke.
// The subsequent step.action reads it from localStorage when the user fires it.
// This means the user can close the palette, come back, and the value persists.
//
// GOTCHA: storageKey must be GLOBALLY unique across all your workflows.
// 'trackingNumber' collides if two workflows both use that key — whichever
// workflow ran last wins. Prefix with workflow name: 'yubikey_tracking'.
//
// GOTCHA: localStorage persists across page loads and ticket navigations.
// If a tech forgets to clear an input, the next ticket inherits the old value.
// The rove InputItem shows the current stored value as the default — remind
// techs to verify inputs before firing the final action.
// ─────────────────────────────────────────────────────────────────────────────

const inputToActionWorkflow = {
  label: 'Input → Action',
  load: async () => buildSteps([['nameInput', step.input('Enter your name', 'text', 'demo_name')], ['greet', step.action('Greet by name', () => {
    var _localStorage$getItem;
    const name = (_localStorage$getItem = localStorage.getItem('demo_name')) != null ? _localStorage$getItem : '(empty)';
    ui.showToast(`Hello, ${name}!`, {
      theme: 'dark'
    });
  })]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 4: All InputType variants
//
// inputType options: 'text' | 'textarea' | 'checkbox' | 'select' | 'select-multiple'
// For 'select' and 'select-multiple', provide options: string[] on the InputItem.
// Use step.input for 'text'/'textarea'/'checkbox'; for select you need to
// build the InputItem directly since step.input doesn't accept options.
// ─────────────────────────────────────────────────────────────────────────────

const allInputTypesWorkflow = {
  label: 'All Input Types',
  load: async () => buildSteps([['textInput', step.input('Text field', 'text', 'demo_text')], ['textareaInput', step.input('Textarea field', 'textarea', 'demo_textarea')], ['checkboxInput', step.input('Checkbox', 'checkbox', 'demo_checkbox')],
  // 'select' and 'select-multiple' need options — build the InputItem directly:
  ['selectInput', {
    type: 'input',
    label: 'Select (single)',
    inputType: 'select',
    options: ['Option A', 'Option B', 'Option C'],
    storageKey: 'demo_select'
  }], ['multiInput', {
    type: 'input',
    label: 'Select (multi)',
    inputType: 'select-multiple',
    options: ['Red', 'Green', 'Blue'],
    storageKey: 'demo_multi'
  }], ['readAll', step.action('Read all values', () => {
    const vals = ['demo_text', 'demo_textarea', 'demo_checkbox', 'demo_select', 'demo_multi'].map(k => {
      var _localStorage$getItem2;
      return `${k}: ${(_localStorage$getItem2 = localStorage.getItem(k)) != null ? _localStorage$getItem2 : 'null'}`;
    }).join('\n');
    alert(vals);
  })]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 5: KB links
//
// step.kb is just step.action with window.open hardcoded.
// Put KB links at the TOP of buildSteps so techs see them immediately on load.
// Multiple KBs = multiple entries; they stack naturally.
//
// GOTCHA: window.open after a clipboard write (copyRichTextToClipboard) will
// steal focus and cause the write to fail silently. ALWAYS copy first, then open.
// ─────────────────────────────────────────────────────────────────────────────

const kbLinksWorkflow = {
  label: 'KB Links',
  load: async () => buildSteps([['kb1', step.kb('KB: Primary Reference', 'https://example.com/kb/primary')], ['kb2', step.kb('KB: Secondary Reference', 'https://example.com/kb/secondary')], ['doWork', step.action('Do the work', () => ui.showToast('Work done', {
    theme: 'dark'
  }))]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 6: Conditional steps — dynamic workflow based on runtime data
//
// load() is async and runs arbitrary code before returning the node.
// Build the steps array with push() to conditionally include steps.
// The user sees only the steps relevant to their situation.
//
// This is the core power of the engine: same menu entry, different steps
// depending on what the ticket data says.
// ─────────────────────────────────────────────────────────────────────────────

const conditionalStepsWorkflow = {
  label: 'Conditional Steps',
  load: async () => {
    // Simulate fetching data — in real workflows this is fetchTicketData()
    const simulatedUserType = Math.random() > 0.5 ? 'fte' : 'awf';
    const isException = simulatedUserType === 'awf' && Math.random() > 0.5;
    const steps = [
    // Always-present step shows detected context in label
    ['context', step.action(`Detected: ${simulatedUserType.toUpperCase()}${isException ? ' | EXCEPTION' : ''}`, () => ui.showToast(`User type: ${simulatedUserType}`, {
      theme: 'dark'
    }))], ['commonStep', step.action('Common step (always runs)', () => ui.showToast('Common', {
      theme: 'dark'
    }))]];

    // Conditionally push steps based on data
    if (simulatedUserType === 'awf') {
      if (isException) {
        steps.push(['legalException', step.action('Send Exception Email', () => ui.showToast('Exception email sent', {
          theme: 'dark'
        }))]);
      } else {
        steps.push(['legalApproval', step.action('Send Approval Email', () => ui.showToast('Approval email sent', {
          theme: 'dark'
        }))]);
      }
    }
    return buildSteps(steps);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 7: Async data fetch + closure capture
//
// load() fetches data once, then step actions close over it.
// The data is captured at load time — if the ticket changes after load,
// the captured data is STALE.
//
// GOTCHA (cache staleness): workflowNode caches the load() result permanently
// until the page reloads. If a tech navigates to a different ticket without
// reloading, the workflow still shows the first ticket's data.
// Solution: navigate away and back, or reload the page, to bust the cache.
// Alternatively, put data reads inside step.action instead of at load time
// for fields that might change — but then you lose the ability to make steps
// conditional on that data.
// ─────────────────────────────────────────────────────────────────────────────

const asyncDataWorkflow = {
  label: 'Async Data + Closure',
  load: async () => {
    // Simulates an API call — in real workflows: fetchTicketData()
    const data = await new Promise(resolve => setTimeout(() => resolve({
      ticketNumber: 'TASK0001234',
      userName: 'John Doe'
    }), 300));

    // data is now captured in closure — all steps below can use it
    return buildSteps([['showTicket', step.action(`Ticket: ${data.ticketNumber}`,
    // label baked in at load time
    () => ui.showToast(`Working on ${data.ticketNumber} for ${data.userName}`, {
      theme: 'dark'
    }))], ['copyUser', step.action('Copy user name', () => navigator.clipboard.writeText(data.userName))]]);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 8: Branch — ephemeral pick list (SelectItem)
//
// step.branch shows a one-shot pick list. load() returns string[] (option labels).
// onSelect fires with the chosen string. Nav returns to parent after selection.
//
// Use branch when:
//   - You need the user to pick a template/path
//   - Options are dynamic (built from fetched data)
//   - The choice is one-shot (not persisted)
//
// GOTCHA: branch.load() is called EVERY activation (not cached like workflowNode).
// Don't do expensive fetches inside branch.load — capture data in the outer
// workflow's load() closure and just return the labels from branch.load.
// ─────────────────────────────────────────────────────────────────────────────

const branchWorkflow = {
  label: 'Branch (Select)',
  load: async () => {
    // Outer load fetches data once
    const simulatedWorkerSource = 'PeopleX'; // would come from fetchTicketData()

    return buildSteps([['chooseTemplate', step.branch('Choose Email Template',
    // load() on SelectItem runs every time the branch is activated
    // Keep it cheap — just return labels, not new fetches
    async () => ['Workday Template', 'PeopleX Template', 'Fieldglass Template'], selected => {
      // onSelect receives the chosen label string
      ui.showToast(`Sending: ${selected} (auto-detected: ${simulatedWorkerSource})`, {
        theme: 'dark'
      });
    })], ['after', step.action('Step after branch', () => ui.showToast('Branch done, continuing', {
      theme: 'dark'
    }))]]);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 9: Nested workflow — workflowNode inside a workflow's steps
//
// workflowNode() wraps a Workflow as a lazy DirectoryNodeItem.
// You can embed it inside another workflow's buildSteps to create sub-flows.
// Each nested workflowNode has its own independent cache.
//
// GOTCHA: The nested workflow's load() runs when the user navigates INTO it,
// not when the parent loads. If you need both to share fetched data, fetch
// in the parent and pass it via closure rather than using workflowNode —
// workflowNode always runs its own load() independently.
// ─────────────────────────────────────────────────────────────────────────────

const subWorkflow = {
  label: 'Sub-Workflow',
  load: async () => buildSteps([['subStep1', step.action('Sub step 1', () => ui.showToast('Sub 1', {
    theme: 'dark'
  }))], ['subStep2', step.action('Sub step 2', () => ui.showToast('Sub 2', {
    theme: 'dark'
  }))]])
};
const nestedWorkflowDemo = {
  label: 'Nested Workflows',
  load: async () => buildSteps([['beforeSub', step.action('1. Do parent step', () => ui.showToast('Parent step', {
    theme: 'dark'
  }))], ['subFlow', workflowNode(subWorkflow)],
  // ← nested: navigates into subWorkflow on select
  ['afterSub', step.action('3. Parent resumes after sub', () => ui.showToast('Back in parent', {
    theme: 'dark'
  }))]])
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 10: errorNode — early exit with visible feedback
//
// Return errorNode() (don't throw) when the workflow can't run.
// The user sees a ✗ label and nothing else in the directory.
// Common uses: wrong page, wrong ticket type, missing data.
//
// GOTCHA: errorNode returns a DirectoryNode (an object), not a string or Error.
// Throwing instead of returning will crash the load() silently — rove will
// show an empty directory with no indication of what went wrong.
// ─────────────────────────────────────────────────────────────────────────────

const guardedWorkflow = {
  label: 'Guarded Workflow',
  load: async () => {
    const isCorrectPage = window.location.hostname === 'ebayinc.service-now.com';
    if (!isCorrectPage) {
      // CORRECT: return errorNode, don't throw
      return errorNode('Must be on ServiceNow — navigate there first');
    }
    return buildSteps([['doWork', step.action('Do work (only on SNOW)', () => ui.showToast('On SNOW!', {
      theme: 'dark'
    }))]]);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 11: Multi-step data collection (the full real-world pattern)
//
// Combines: async fetch → conditional steps → inputs → action reads inputs.
// This is the mobile order / yubikey pattern distilled.
// ─────────────────────────────────────────────────────────────────────────────

const fullPatternWorkflow = {
  label: 'Full Pattern',
  load: async () => {
    // 1. Fetch data once — everything below closes over it
    const data = await new Promise(r => setTimeout(() => r({
      ticketNumber: 'TASK0009999',
      isAwf: true
    }), 200));
    const steps = [
    // 2. KB links first so tech can reference docs at any time
    ['kb', step.kb('KB: Process Reference', 'https://example.com/kb')],
    // 3. Informational action (label doubles as status display)
    ['status', step.action(`Ticket ${data.ticketNumber} | ${data.isAwf ? 'AWF' : 'FTE'}`, () => {})],
    // 4. Collect external info (arrives later, e.g., from carrier response)
    ['orderNum', step.input('Order Number (from carrier)', 'text', 'fullPattern_orderNum')], ['shipDate', step.input('Ship Date (from carrier)', 'text', 'fullPattern_shipDate')],
    // 5. Action reads inputs + uses closure data
    ['confirm', step.action('Send Confirmation Email', () => {
      var _localStorage$getItem3, _localStorage$getItem4;
      const orderNum = (_localStorage$getItem3 = localStorage.getItem('fullPattern_orderNum')) != null ? _localStorage$getItem3 : '';
      const shipDate = (_localStorage$getItem4 = localStorage.getItem('fullPattern_shipDate')) != null ? _localStorage$getItem4 : '';
      ui.showToast(`Ticket ${data.ticketNumber}: order ${orderNum}, ships ${shipDate}`, {
        theme: 'dark'
      });
    })]];

    // 6. Conditional step — only for AWF
    if (data.isAwf) {
      steps.push(['legalEmail', step.action('Send Legal Approval', () => ui.showToast('Legal email sent', {
        theme: 'dark'
      }))]);
    }
    return buildSteps(steps);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// WIRE UP — build the rove tree and register menu command
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  keyPrefix: 'demo',
  defaults: {
    mode: 'dir',
    theme: 'dark'
  },
  tree: {
    // Each entry is a lazy directory — loads on first activation, then cached
    d1_helloWorld: workflowNode(minimalWorkflow),
    d2_orderedSteps: workflowNode(orderedStepsWorkflow),
    d3_inputToAction: workflowNode(inputToActionWorkflow),
    d4_allInputTypes: workflowNode(allInputTypesWorkflow),
    d5_kbLinks: workflowNode(kbLinksWorkflow),
    d6_conditional: workflowNode(conditionalStepsWorkflow),
    d7_asyncData: workflowNode(asyncDataWorkflow),
    d8_branch: workflowNode(branchWorkflow),
    d9_nested: workflowNode(nestedWorkflowDemo),
    d10_errorNode: workflowNode(guardedWorkflow),
    d11_fullPattern: workflowNode(fullPatternWorkflow)
  }
};
const rove = Qr(config);
GM_registerMenuCommand('Rove Demo', () => rove.toggle());

})(VM.solid.store, VM.solid.web, VM.solid, VM);
