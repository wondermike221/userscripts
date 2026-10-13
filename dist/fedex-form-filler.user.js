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
(function(solid_js_store, solid_js_web, solid_js) {
	//#region node_modules/rove/dist/index.js
	var St = Object.defineProperty;
	var Et = (e, t, r) => t in e ? St(e, t, {
		enumerable: !0,
		configurable: !0,
		writable: !0,
		value: r
	}) : e[t] = r;
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
		} catch {}
	}
	function At(e) {
		try {
			const t = [];
			for (let r = 0; r < localStorage.length; r++) {
				const n = localStorage.key(r);
				n && n.startsWith(`${e}.`) && t.push(n);
			}
			t.forEach((r) => localStorage.removeItem(r));
		} catch {}
	}
	var Te = {
		mode: "palette",
		palettePin: "top",
		globalShortcut: "Ctrl+`",
		modeSwapShortcut: "Ctrl+Shift+`",
		rememberLastMode: !1,
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
			x: Math.round(window.innerWidth * .375),
			y: Math.round(window.innerHeight * .375),
			width: Math.round(window.innerWidth * .25),
			height: Math.round(window.innerHeight * .25)
		};
	}
	function Dt(e) {
		return {
			visible: !1,
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
		return (0, solid_js_store.createStore)(Dt(e));
	}
	function Ht(e, t) {
		e("meta", (r) => ({
			...r,
			...t
		}));
	}
	var qt = {
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
		if (e.ctrlKey !== d || e.shiftKey !== o || e.altKey !== a || e.metaKey !== p) return !1;
		if (n.length === 1 && /[a-z0-9]/i.test(n)) return e.key.toLowerCase() === n.toLowerCase();
		const f = qt[n];
		return f ? e.code === f : e.key === n;
	}
	var jt = class {
		constructor() {
			Be(this, "entries", /* @__PURE__ */ new Map());
			Be(this, "shadowHost", null);
			Be(this, "globalHandler");
			Be(this, "scopedHandler");
			this.globalHandler = (t) => {
				for (const r of this.entries.values()) r.scope === "global" && yt(t, r.shortcut) && r.handler(t);
			}, this.scopedHandler = (t) => {
				var d;
				if (!(!this.shadowHost || !(document.activeElement === this.shadowHost || ((d = this.shadowHost.shadowRoot) == null ? void 0 : d.activeElement) != null))) for (const o of this.entries.values()) o.scope === "scoped" && yt(t, o.shortcut) && o.handler(t);
			}, document.addEventListener("keydown", this.globalHandler, { capture: !0 }), document.addEventListener("keydown", this.scopedHandler, { capture: !0 });
		}
		setShadowHost(t) {
			this.shadowHost = t;
		}
		registerGlobal(t, r, n) {
			this.entries.set(r, {
				shortcut: t,
				handler: n,
				scope: "global"
			});
		}
		registerScoped(t, r, n) {
			this.entries.set(r, {
				shortcut: t,
				handler: n,
				scope: "scoped"
			});
		}
		updateShortcut(t, r) {
			const n = this.entries.get(t);
			n && (n.shortcut = r);
		}
		unregister(t) {
			this.entries.delete(t);
		}
		destroy() {
			document.removeEventListener("keydown", this.globalHandler, { capture: !0 }), document.removeEventListener("keydown", this.scopedHandler, { capture: !0 }), this.entries.clear();
		}
	};
	var wt = (e, t) => e > t ? 1 : e < t ? -1 : 0;
	var nt = 1 / 0;
	var rt = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	var pt = "eexxaacctt";
	var Nt = /* @__PURE__ */ new RegExp("\\p{P}", "gu");
	var Bt = "A-Z";
	var Vt = "a-z";
	var Ot = ["en", {
		numeric: !0,
		sensitivity: "base"
	}];
	var Ie = (e, t, r) => e.replace(Bt, t).replace(Vt, r);
	var ft = {
		unicode: !1,
		alpha: null,
		interSplit: "[^A-Za-z\\d']+",
		intraSplit: "[a-z][A-Z]",
		interBound: "[^A-Za-z\\d]",
		intraBound: "[A-Za-z]\\d|\\d[A-Za-z]|[a-z][A-Z]",
		interLft: 0,
		interRgt: 0,
		interChars: ".",
		interIns: nt,
		intraChars: "[a-z\\d']",
		intraIns: null,
		intraContr: "'[a-z]{1,2}\\b",
		intraMode: 0,
		intraSlice: [1, nt],
		intraSub: null,
		intraTrn: null,
		intraDel: null,
		intraFilt: (e, t, r) => !0,
		toUpper: (e) => e.toLocaleUpperCase(),
		toLower: (e) => e.toLocaleLowerCase(),
		compare: null,
		sort: (e, t, r, n = wt) => {
			let { idx: d, chars: o, terms: a, interLft2: p, interLft1: f, start: I, intraIns: g, interIns: v, cases: i } = e;
			return d.map((x, h) => h).sort((x, h) => o[h] - o[x] || g[x] - g[h] || a[h] + p[h] + .5 * f[h] - (a[x] + p[x] + .5 * f[x]) || v[x] - v[h] || I[x] - I[h] || i[h] - i[x] || n(t[d[x]], t[d[h]]));
		}
	};
	var lt = (e, t) => t == 0 ? "" : t == 1 ? e + "??" : t == nt ? e + "*?" : e + `{0,${t}}?`;
	var ht = "(?:\\b|_)";
	function Fe(e) {
		e = Object.assign({}, ft, e);
		let { unicode: t, interLft: r, interRgt: n, intraMode: d, intraSlice: o, intraIns: a, intraSub: p, intraTrn: f, intraDel: I, intraContr: g, intraSplit: v, interSplit: i, intraBound: x, interBound: h, intraChars: L, toUpper: z, toLower: b, compare: H } = e;
		a ?? (a = d), p ?? (p = d), f ?? (f = d), I ?? (I = d), H ?? (H = typeof Intl > "u" ? wt : new Intl.Collator(...Ot).compare);
		let k = e.letters ?? e.alpha;
		if (k != null) {
			let T = z(k), q = b(k);
			i = Ie(i, T, q), v = Ie(v, T, q), h = Ie(h, T, q), x = Ie(x, T, q), L = Ie(L, T, q), g = Ie(g, T, q);
		}
		let C = t ? "u" : "";
		const X = "\".+?\"", se = new RegExp(X, "gi" + C), K = new RegExp(`(?:\\s+|^)-(?:${L}+|${X})`, "gi" + C);
		let { intraRules: F } = e;
		F ??= (T) => {
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
		};
		let ae = !!v, ue = new RegExp(v, "g" + C), Oe = new RegExp(i, "g" + C), Je = new RegExp("^" + i + "|" + i + "$", "g" + C), Ke = new RegExp(g, "gi" + C);
		const ce = (T, q = !1) => {
			let B = [];
			T = T.replace(se, (l) => (B.push(l), pt)), T = T.replace(Je, ""), q || (T = b(T)), ae && (T = T.replace(ue, (l) => l[0] + " " + l[1]));
			let V = 0;
			return T.split(Oe).filter((l) => l != "").map((l) => l === pt ? B[V++] : l);
		}, Ue = /[^\d]+|\d+/g, qe = (T, q = 0, B = !1) => {
			let V = ce(T);
			if (V.length == 0) return [];
			let l = Array(V.length).fill("");
			V = V.map((S, m) => S.replace(Ke, (w) => (l[m] = w, "")));
			let s;
			if (d == 1) s = V.map((S, m) => {
				if (S[0] === "\"") return rt(S.slice(1, -1));
				let w = "";
				for (let _ of S.matchAll(Ue)) {
					let $ = _[0], { intraSlice: E, intraIns: j, intraSub: D, intraTrn: R, intraDel: N } = F($);
					if (j + D + R + N == 0) w += $ + l[m];
					else {
						let [Z, Q] = E, ee = $.slice(0, Z), pe = $.slice(Q), J = $.slice(Z, Q);
						j == 1 && ee.length == 1 && ee != J[0] && (ee += "(?!" + ee + ")");
						let me = J.length, fe = [$];
						if (D) for (let U = 0; U < me; U++) fe.push(ee + J.slice(0, U) + L + J.slice(U + 1) + pe);
						if (R) for (let U = 0; U < me - 1; U++) J[U] != J[U + 1] && fe.push(ee + J.slice(0, U) + J[U + 1] + J[U] + J.slice(U + 2) + pe);
						if (N) for (let U = 0; U < me; U++) fe.push(ee + J.slice(0, U + 1) + "?" + J.slice(U + 1) + pe);
						if (j) {
							let U = lt(L, 1);
							for (let xe = 0; xe < me; xe++) fe.push(ee + J.slice(0, xe) + U + J.slice(xe) + pe);
						}
						w += "(?:" + fe.join("|") + ")" + l[m];
					}
				}
				return w;
			});
			else {
				let S = lt(L, a);
				q == 2 && a > 0 && (S = ")(" + S + ")("), s = V.map((m, w) => m[0] === "\"" ? rt(m.slice(1, -1)) : m.split("").map((_, $, E) => (a == 1 && $ == 0 && E.length > 1 && _ != E[$ + 1] && (_ += "(?!" + _ + ")"), _)).join(S) + l[w]);
			}
			let u = r == 2 ? ht : "", c = n == 2 ? ht : "", y = c + lt(e.interChars, e.interIns) + u;
			return q > 0 ? B ? s = u + "(" + s.join(")" + c + "|" + u + "(") + ")" + c : (s = "(" + s.join(")(" + y + ")(") + ")", s = "(.??" + u + ")" + s + "(" + c + ".*)") : (s = s.join(y), s = u + s + c), [
				new RegExp(s, "i" + C),
				V,
				l
			];
		}, ge = (T, q, B) => {
			let [V] = qe(q);
			if (V == null) return null;
			let l = [];
			if (B != null) for (let s = 0; s < B.length; s++) {
				let u = B[s];
				V.test(T[u]) && l.push(u);
			}
			else for (let s = 0; s < T.length; s++) V.test(T[s]) && l.push(s);
			return l;
		};
		let Ge = !!x, _e = new RegExp(h, C), Se = new RegExp(x, C);
		const We = (T, q, B) => {
			let [V, l, s] = qe(B, 1), u = ce(B, !0), [c] = qe(B, 2), y = l.length, S = Array(y), m = Array(y);
			for (let D = 0; D < y; D++) {
				let R = l[D], N = u[D], Z = R[0] == "\"" ? R.slice(1, -1) : R + s[D], Q = N[0] == "\"" ? N.slice(1, -1) : N + s[D];
				S[D] = Z, m[D] = Q;
			}
			let w = T.length, _ = Array(w).fill(0), $ = {
				idx: Array(w),
				start: _.slice(),
				chars: _.slice(),
				cases: _.slice(),
				terms: _.slice(),
				interIns: _.slice(),
				intraIns: _.slice(),
				interLft2: _.slice(),
				interRgt2: _.slice(),
				interLft1: _.slice(),
				interRgt1: _.slice(),
				ranges: Array(w)
			}, E = r == 1 || n == 1, j = 0;
			for (let D = 0; D < T.length; D++) {
				let R = q[T[D]], N = R.match(V), Z = N.index + N[1].length, Q = Z, ee = !1, pe = 0, J = 0, me = 0, fe = 0, U = 0, xe = 0, st = 0, it = 0, at = 0, be = [];
				for (let G = 0, Y = 2; G < y; G++, Y += 2) {
					let he = b(N[Y]), le = S[G], et = m[G], ne = le.length, oe = he.length, te = he == le;
					if (N[Y] == et && st++, !te && N[Y + 1].length >= ne) {
						let W = b(N[Y + 1]).indexOf(le);
						W > -1 && (be.push(Q, oe, W, ne), Q += je(N, Y, W, ne), he = le, oe = ne, te = !0, G == 0 && (Z = Q));
					}
					if (E || te) {
						let W = Q - 1, ye = Q + oe, Pe = !1, Ne = !1;
						if (W == -1 || _e.test(R[W])) te && pe++, Pe = !0;
						else {
							if (r == 2) {
								ee = !0;
								break;
							}
							if (Ge && Se.test(R[W] + R[W + 1])) te && J++, Pe = !0;
							else if (r == 1) {
								let Ye = N[Y + 1], Ee = Q + oe;
								if (Ye.length >= ne) {
									let we = 0, Ce = !1, _t = new RegExp(le, "ig" + C), ct;
									for (; ct = _t.exec(Ye);) {
										we = ct.index;
										let dt = Ee + we, tt = dt - 1;
										if (tt == -1 || _e.test(R[tt])) {
											pe++, Ce = !0;
											break;
										} else if (Se.test(R[tt] + R[dt])) {
											J++, Ce = !0;
											break;
										}
									}
									Ce && (Pe = !0, be.push(Q, oe, we, ne), Q += je(N, Y, we, ne), he = le, oe = ne, te = !0, G == 0 && (Z = Q));
								}
								if (!Pe) {
									ee = !0;
									break;
								}
							}
						}
						if (ye == R.length || _e.test(R[ye])) te && me++, Ne = !0;
						else {
							if (n == 2) {
								ee = !0;
								break;
							}
							if (Ge && Se.test(R[ye - 1] + R[ye])) te && fe++, Ne = !0;
							else if (n == 1) {
								ee = !0;
								break;
							}
						}
						te && (U += ne, Pe && Ne && xe++);
					}
					if (oe > ne && (at += oe - ne), G > 0 && (it += N[Y - 1].length), !e.intraFilt(le, he, Q)) {
						ee = !0;
						break;
					}
					G < y - 1 && (Q += oe + N[Y + 1].length);
				}
				if (!ee) {
					$.idx[j] = T[D], $.interLft2[j] = pe, $.interLft1[j] = J, $.interRgt2[j] = me, $.interRgt1[j] = fe, $.chars[j] = U, $.terms[j] = xe, $.cases[j] = st, $.interIns[j] = it, $.intraIns[j] = at, $.start[j] = Z;
					let G = R.match(c), Y = G.index + G[1].length, he = be.length, le = he > 0 ? 0 : 1 / 0, et = he - 4;
					for (let W = 2; W < G.length;) {
						let ye = G[W].length;
						if (le <= et && be[le] == Y) {
							let Pe = be[le + 1], Ne = be[le + 2], Ye = be[le + 3], Ee = W, we = "";
							for (let Ce = 0; Ce < Pe; Ee++) we += G[Ee], Ce += G[Ee].length;
							G.splice(W, Ee - W, we), Y += je(G, W, Ne, Ye), le += 4;
						} else Y += ye, W++;
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
			if (j < T.length) for (let D in $) $[D] = $[D].slice(0, j);
			return $;
		}, je = (T, q, B, V) => {
			let l = T[q] + T[q + 1].slice(0, B);
			return T[q - 1] += l, T[q] = T[q + 1].slice(B, B + V), T[q + 1] = T[q + 1].slice(B + V), l.length;
		}, Qe = 5, Xe = (T, q, B, V = 1e3, l) => {
			B = B ? B === !0 ? Qe : B : 0;
			let s = null, u = null, c = [];
			q = q.replace(K, ($) => {
				let E = $.trim().slice(1);
				return E = E[0] === "\"" ? rt(E.slice(1, -1)) : E.replace(Nt, ""), E != "" && c.push(E), "";
			});
			let y = ce(q), S;
			if (c.length > 0) {
				if (S = new RegExp(c.join("|"), "i" + C), y.length == 0) {
					let $ = [];
					for (let E = 0; E < T.length; E++) S.test(T[E]) || $.push(E);
					return [
						$,
						null,
						null
					];
				}
			} else if (y.length == 0) return [
				null,
				null,
				null
			];
			if (B > 0) {
				let $ = ce(q);
				if ($.length > 1) {
					let E = $.slice().sort((D, R) => R.length - D.length);
					for (let D = 0; D < E.length; D++) {
						if ((l == null ? void 0 : l.length) == 0) return [
							[],
							null,
							null
						];
						l = ge(T, E[D], l);
					}
					if ($.length > B) return [
						l,
						null,
						null
					];
					s = $t($).map((D) => D.join(" ")), u = [];
					let j = /* @__PURE__ */ new Set();
					for (let D = 0; D < s.length; D++) if (j.size < l.length) {
						let R = l.filter((Z) => !j.has(Z)), N = ge(T, s[D], R);
						for (let Z = 0; Z < N.length; Z++) j.add(N[Z]);
						u.push(N);
					} else u.push([]);
				}
			}
			s ?? (s = [q], u = [(l == null ? void 0 : l.length) > 0 ? l : ge(T, q)]);
			let m = null, w = null;
			if (c.length > 0 && (u = u.map(($) => $.filter((E) => !S.test(T[E])))), u.reduce(($, E) => $ + E.length, 0) <= V) {
				m = {}, w = [];
				for (let $ = 0; $ < u.length; $++) {
					let E = u[$];
					if (E == null || E.length == 0) continue;
					let j = s[$], D = We(E, T, j), R = e.sort(D, T, j, H);
					if ($ > 0) for (let N = 0; N < R.length; N++) R[N] += w.length;
					for (let N in D) m[N] = (m[N] ?? []).concat(D[N]);
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
	var Kt = (() => {
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
		for (let o in e) e[o].split("").forEach((a) => {
			r += a, t[a] = o;
		});
		let n = new RegExp(`[${r}]`, "g"), d = (o) => t[o];
		return (o) => {
			if (typeof o == "string") return o.replace(n, d);
			let a = Array(o.length);
			for (let p = 0; p < o.length; p++) a[p] = o[p].replace(n, d);
			return a;
		};
	})();
	function $t(e) {
		e = e.slice();
		let t = e.length, r = [e.slice()], n = new Array(t).fill(0), d = 1, o, a;
		for (; d < t;) n[d] < d ? (o = d % 2 && n[d], a = e[d], e[d] = e[o], e[o] = a, ++n[d], d = 1, r.push(e.slice())) : (n[d] = 0, ++d);
		return r;
	}
	var Ut = (e, t) => t ? `<mark>${e}</mark>` : e;
	var Gt = (e, t) => e + t;
	function Wt(e, t, r = Ut, n = "", d = Gt) {
		n = d(n, r(e.substring(0, t[0]), !1)) ?? n;
		for (let o = 0; o < t.length; o += 2) {
			let a = t[o], p = t[o + 1];
			n = d(n, r(e.substring(a, p), !0)) ?? n, o < t.length - 3 && (n = d(n, r(e.substring(t[o + 1], t[o + 2]), !1)) ?? n);
		}
		return n = d(n, r(e.substring(t[t.length - 1]), !1)) ?? n, n;
	}
	Fe.latinize = Kt;
	Fe.permute = (e) => $t([...Array(e.length).keys()]).sort((r, n) => {
		for (let d = 0; d < r.length; d++) if (r[d] != n[d]) return r[d] - n[d];
		return 0;
	}).map((r) => r.map((n) => e[n]));
	Fe.highlight = Wt;
	var Xt = new Fe({ intraMode: 1 });
	function Ze(e, t, r, n, d) {
		for (const [o, a] of Object.entries(e)) if (a.type === "directory" && a.children && !a.load) Ze(a.children, [...t, o], [...r, a.label], n, d);
		else if (a.type === "directory" && a.load && a.children) Ze(a.children, [...t, o], [...r, a.label], n, d);
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
		return Ze(e, [], [], t, r), {
			haystack: t,
			items: r
		};
	}
	function Zt(e, t) {
		if (!t.trim()) return [];
		const [r, n, d] = Xt.search(e.haystack, t);
		return !r || !n || !d ? [] : d.map((o) => {
			const a = r[o], p = e.items[a], f = n.ranges[o], I = [];
			for (let g = 0; g < f.length; g += 2) I.push([f[g], f[g + 1]]);
			return {
				...p,
				score: n.idx[o],
				ranges: I
			};
		});
	}
	function vt(e, t, r, n) {
		const d = [...e.haystack], o = [...e.items];
		return Ze(t, r, n, d, o), {
			haystack: d,
			items: o
		};
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
				theme: n("Theme", "select", "theme", { options: [
					"system",
					"light",
					"dark"
				] }),
				mode: n("Default Mode", "select", "mode", { options: ["palette", "dir"] }),
				"palette-pin": n("Palette Pin", "select", "palettePin", { options: [
					"top",
					"middle",
					"bottom"
				] }),
				"remember-mode": n("Remember Last Mode", "checkbox", "rememberLastMode"),
				"global-key": n("Global Shortcut", "text", "globalShortcut", { onChange: (d) => {
					r.updateShortcut("global-toggle", d);
				} }),
				"swap-key": n("Mode Swap Shortcut", "text", "modeSwapShortcut", { onChange: (d) => {
					r.updateShortcut("mode-swap", d);
				} })
			}
		};
	}
	var [Ve, nl] = (0, solid_js.createSignal)(!1);
	var Jt = /* @__PURE__ */ (0, solid_js_web.template)("<div class=result-path>");
	var Qt = /* @__PURE__ */ (0, solid_js_web.template)("<div role=option><span class=result-label>");
	var er = /* @__PURE__ */ (0, solid_js_web.template)("<mark class=result-highlight>");
	var tr = /* @__PURE__ */ (0, solid_js_web.template)("<span>");
	function rr(e, t) {
		const r = [];
		let n = 0;
		for (const [d, o] of t) d > n && r.push({
			text: e.slice(n, d),
			highlighted: !1
		}), r.push({
			text: e.slice(d, o),
			highlighted: !0
		}), n = o;
		return n < e.length && r.push({
			text: e.slice(n),
			highlighted: !1
		}), r;
	}
	function lr(e) {
		const t = () => e.result.item, r = () => "label" in t() ? t().label : "", n = () => e.result.pathLabels.length > 0 ? e.result.pathLabels.join(" › ") : null, d = () => e.result.ranges.length > 0 ? rr(r(), e.result.ranges) : [{
			text: r(),
			highlighted: !1
		}];
		return (() => {
			var o = Qt(), a = o.firstChild;
			return (0, solid_js_web.addEventListener)(o, "click", e.onActivate, !0), o.style.setProperty("padding", "8px 14px"), o.style.setProperty("cursor", "pointer"), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				get when() {
					return n();
				},
				get children() {
					var p = Jt();
					return p.style.setProperty("font-size", "11px"), p.style.setProperty("color", "var(--rove-text-dim)"), p.style.setProperty("margin-bottom", "2px"), (0, solid_js_web.insert)(p, n), p;
				}
			}), a), (0, solid_js_web.insert)(a, (0, solid_js_web.createComponent)(solid_js.For, {
				get each() {
					return d();
				},
				children: (p) => p.highlighted ? (() => {
					var f = er();
					return f.style.setProperty("background", "var(--rove-accent)"), f.style.setProperty("color", "var(--rove-bg)"), f.style.setProperty("border-radius", "2px"), f.style.setProperty("padding", "0 1px"), (0, solid_js_web.insert)(f, () => p.text), f;
				})() : (() => {
					var f = tr();
					return (0, solid_js_web.insert)(f, () => p.text), f;
				})()
			})), (0, solid_js_web.effect)((p) => {
				var f = `palette-result${e.selected ? " palette-result--selected" : ""}`, I = e.selected, g = e.selected ? "var(--rove-selected)" : "transparent";
				return f !== p.e && (0, solid_js_web.className)(o, p.e = f), I !== p.t && (0, solid_js_web.setAttribute)(o, "aria-selected", p.t = I), g !== p.a && ((p.a = g) != null ? o.style.setProperty("background", g) : o.style.removeProperty("background")), p;
			}, {
				e: void 0,
				t: void 0,
				a: void 0
			}), o;
		})();
	}
	(0, solid_js_web.delegateEvents)(["click"]);
	var nr = /* @__PURE__ */ (0, solid_js_web.template)("<div>P[<!>] vis=<!> eph=");
	var or = /* @__PURE__ */ (0, solid_js_web.template)("<div>DEBUG: palette mounted [<!>] pin=");
	var sr = /* @__PURE__ */ (0, solid_js_web.template)("<div><span>Select: </span><span>Esc to cancel");
	var ir = /* @__PURE__ */ (0, solid_js_web.template)("<div>No options match");
	var gt = /* @__PURE__ */ (0, solid_js_web.template)("<div id=palette-results role=listbox>");
	var ar = /* @__PURE__ */ (0, solid_js_web.template)("<div class=palette-container role=combobox aria-haspopup=listbox><div class=palette-input-row><input type=text class=palette-input aria-autocomplete=list aria-controls=palette-results><button class=palette-mode-btn aria-label=\"Switch to directory view\"title=\"Switch to directory view\">☰</button></div><div role=status aria-live=polite aria-atomic=true>");
	var cr = /* @__PURE__ */ (0, solid_js_web.template)("<div role=option>");
	function dr(e) {
		let t, r;
		const [n, d] = (0, solid_js.createSignal)(null);
		(0, solid_js.createEffect)(() => {
			v() || d(null);
		}), (0, solid_js.createEffect)(() => {
			v() && e.state.palette.overlay === null && t?.focus();
		}), (0, solid_js.createEffect)(() => {
			if (n()) return;
			const i = e.state.palette.query, x = i ? Zt(e.getIndex(), i) : [];
			e.set("palette", (h) => ({
				...h,
				results: x,
				selectedIndex: 0
			}));
		});
		const o = (0, solid_js.createMemo)(() => {
			const i = n();
			if (!i) return [];
			const x = e.state.palette.query.toLowerCase();
			return x ? i.options.filter(({ key: h, item: L }) => ("label" in L ? L.label : h).toLowerCase().includes(x)) : i.options;
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
				if (i.key === "ArrowDown") i.preventDefault(), d((b) => b ? {
					...b,
					selectedIndex: Math.min(b.selectedIndex + 1, z.length - 1)
				} : null);
				else if (i.key === "ArrowUp") i.preventDefault(), d((b) => b ? {
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
			const { results: h, selectedIndex: L } = e.state.palette;
			if (i.key === "ArrowDown") i.preventDefault(), e.set("palette", "selectedIndex", Math.min(L + 1, h.length - 1));
			else if (i.key === "ArrowUp") i.preventDefault(), e.set("palette", "selectedIndex", Math.max(L - 1, 0));
			else if (i.key === "Enter") {
				i.preventDefault();
				const z = h[L];
				z && I(z);
			} else i.key === "Escape" && (i.preventDefault(), e.state.palette.query ? e.set("palette", "query", "") : e.set("visible", !1));
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
			if (x.type === "action") x.action(), e.set("palette", (h) => ({
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
					let z = !1;
					e.set("palette", "overlay", {
						type: "loading",
						label: h.label,
						cancel: () => {
							z = !0;
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
				if (h.options) L(h.options);
				else if (h.load) {
					let z = !1;
					e.set("palette", "overlay", {
						type: "loading",
						label: h.label,
						cancel: () => {
							z = !0;
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
		const g = () => e.state.meta.palettePin, v = (0, solid_js.createMemo)(() => e.state.visible && e.state.mode === "palette");
		return (0, solid_js.createEffect)(() => {
			Ve() && console.log(`[Rove:Palette:${e.keyPrefix}] visible=${v()}`);
		}), [(0, solid_js_web.createComponent)(solid_js.Show, {
			get when() {
				return Ve();
			},
			get children() {
				var i = nr(), h = i.firstChild.nextSibling, z = h.nextSibling.nextSibling;
				return z.nextSibling, i.style.setProperty("position", "fixed"), i.style.setProperty("top", "8px"), i.style.setProperty("color", "#fff"), i.style.setProperty("font-size", "10px"), i.style.setProperty("font-family", "monospace"), i.style.setProperty("padding", "3px 10px"), i.style.setProperty("border-radius", "20px"), i.style.setProperty("z-index", "99999999"), i.style.setProperty("pointer-events", "none"), i.style.setProperty("line-height", "1.6"), (0, solid_js_web.insert)(i, () => e.keyPrefix, h), (0, solid_js_web.insert)(i, () => String(v()), z), (0, solid_js_web.insert)(i, (() => {
					var b = (0, solid_js_web.memo)(() => !!n());
					return () => b() ? n().label : "none";
				})(), null), (0, solid_js_web.effect)((b) => {
					var H = e.keyPrefix.length <= 4 ? "8px" : "auto", k = e.keyPrefix.length <= 4 ? "auto" : "8px", C = v() ? "#00c853" : "#c62828";
					return H !== b.e && ((b.e = H) != null ? i.style.setProperty("left", H) : i.style.removeProperty("left")), k !== b.t && ((b.t = k) != null ? i.style.setProperty("right", k) : i.style.removeProperty("right")), C !== b.a && ((b.a = C) != null ? i.style.setProperty("background", C) : i.style.removeProperty("background")), b;
				}, {
					e: void 0,
					t: void 0,
					a: void 0
				}), i;
			}
		}), (0, solid_js_web.createComponent)(solid_js.Show, {
			get when() {
				return v();
			},
			get children() {
				var i = ar(), x = i.firstChild, h = x.firstChild, L = h.nextSibling, z = x.nextSibling;
				i.style.setProperty("position", "fixed"), i.style.setProperty("left", "50%"), i.style.setProperty("width", "50vw"), i.style.setProperty("max-width", "700px"), i.style.setProperty("min-width", "300px"), i.style.setProperty("z-index", "var(--rove-z-index)"), i.style.setProperty("background", "var(--rove-bg)"), i.style.setProperty("border", "1px solid var(--rove-border)"), i.style.setProperty("border-radius", "var(--rove-border-radius)"), i.style.setProperty("box-shadow", "var(--rove-shadow)"), (0, solid_js_web.setAttribute)(i, "aria-expanded", !0), (0, solid_js_web.insert)(i, (0, solid_js_web.createComponent)(solid_js.Show, {
					get when() {
						return Ve();
					},
					get children() {
						var k = or(), X = k.firstChild.nextSibling;
						return X.nextSibling, k.style.setProperty("background", "red"), k.style.setProperty("color", "white"), k.style.setProperty("font-size", "10px"), k.style.setProperty("padding", "2px 6px"), k.style.setProperty("font-family", "monospace"), (0, solid_js_web.insert)(k, () => e.keyPrefix, X), (0, solid_js_web.insert)(k, g, null), k;
					}
				}), x), (0, solid_js_web.insert)(i, (0, solid_js_web.createComponent)(solid_js.Show, {
					get when() {
						return n() !== null;
					},
					get children() {
						var k = sr(), C = k.firstChild;
						C.firstChild;
						var X = C.nextSibling;
						return k.style.setProperty("padding", "6px 14px"), k.style.setProperty("font-size", "11px"), k.style.setProperty("color", "var(--rove-accent)"), k.style.setProperty("background", "var(--rove-selected)"), k.style.setProperty("display", "flex"), k.style.setProperty("align-items", "center"), k.style.setProperty("gap", "6px"), C.style.setProperty("font-weight", "600"), (0, solid_js_web.insert)(C, () => n().label, null), X.style.setProperty("color", "var(--rove-text-dim)"), X.style.setProperty("margin-left", "auto"), k;
					}
				}), x), x.style.setProperty("display", "flex"), x.style.setProperty("align-items", "center"), h.$$keydown = p, h.$$input = a;
				var b = t;
				typeof b == "function" ? (0, solid_js_web.use)(b, h) : t = h, h.style.setProperty("flex", "1"), h.style.setProperty("padding", "10px 14px"), h.style.setProperty("border", "none"), h.style.setProperty("background", "transparent"), h.style.setProperty("color", "var(--rove-text)"), h.style.setProperty("font-size", "16px"), h.style.setProperty("outline", "none"), h.style.setProperty("min-width", "0"), L.$$click = () => e.set("mode", "dir"), L.style.setProperty("background", "none"), L.style.setProperty("border", "none"), L.style.setProperty("border-left", "1px solid var(--rove-border)"), L.style.setProperty("cursor", "pointer"), L.style.setProperty("color", "var(--rove-text-dim)"), L.style.setProperty("padding", "0 14px"), L.style.setProperty("font-size", "15px"), L.style.setProperty("line-height", "1"), L.style.setProperty("align-self", "stretch"), L.style.setProperty("display", "flex"), L.style.setProperty("align-items", "center");
				var H = r;
				return typeof H == "function" ? (0, solid_js_web.use)(H, z) : r = z, z.style.setProperty("position", "absolute"), z.style.setProperty("width", "1px"), z.style.setProperty("height", "1px"), z.style.setProperty("overflow", "hidden"), z.style.setProperty("clip", "rect(0,0,0,0)"), z.style.setProperty("white-space", "nowrap"), (0, solid_js_web.insert)(z, (() => {
					var k = (0, solid_js_web.memo)(() => !!n());
					return () => k() ? `${o().length} options` : e.state.palette.results.length > 0 ? `${e.state.palette.results.length} results` : e.state.palette.query ? "No results" : "";
				})()), (0, solid_js_web.insert)(i, (0, solid_js_web.createComponent)(solid_js.Show, {
					get when() {
						return n() !== null;
					},
					get children() {
						var k = gt();
						return k.style.setProperty("max-height", "50vh"), k.style.setProperty("overflow-y", "auto"), k.style.setProperty("border-top", "1px solid var(--rove-border)"), (0, solid_js_web.insert)(k, (0, solid_js_web.createComponent)(solid_js.For, {
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
									}), K.$$click = () => f(C), K.style.setProperty("display", "flex"), K.style.setProperty("align-items", "center"), K.style.setProperty("padding", "8px 14px"), K.style.setProperty("cursor", "pointer"), K.style.setProperty("color", "var(--rove-text)"), K.style.setProperty("font-size", "14px"), (0, solid_js_web.insert)(K, () => "label" in C.item ? C.item.label : C.key), (0, solid_js_web.effect)((F) => {
										var ae = se(), ue = se() ? "var(--rove-selected)" : "transparent";
										return ae !== F.e && (0, solid_js_web.setAttribute)(K, "aria-selected", F.e = ae), ue !== F.t && ((F.t = ue) != null ? K.style.setProperty("background", ue) : K.style.removeProperty("background")), F;
									}, {
										e: void 0,
										t: void 0
									}), K;
								})();
							}
						}), null), (0, solid_js_web.insert)(k, (0, solid_js_web.createComponent)(solid_js.Show, {
							get when() {
								return o().length === 0;
							},
							get children() {
								var C = ir();
								return C.style.setProperty("padding", "8px 14px"), C.style.setProperty("color", "var(--rove-text-dim)"), C.style.setProperty("font-size", "13px"), C;
							}
						}), null), k;
					}
				}), null), (0, solid_js_web.insert)(i, (0, solid_js_web.createComponent)(solid_js.Show, {
					get when() {
						return n() === null;
					},
					get children() {
						var k = gt();
						return k.style.setProperty("max-height", "50vh"), k.style.setProperty("overflow-y", "auto"), (0, solid_js_web.insert)(k, (0, solid_js_web.createComponent)(solid_js.For, {
							get each() {
								return e.state.palette.results;
							},
							children: (C, X) => (0, solid_js_web.createComponent)(lr, {
								result: C,
								get selected() {
									return X() === e.state.palette.selectedIndex;
								},
								onActivate: () => I(C)
							})
						})), (0, solid_js_web.effect)((C) => (C = e.state.palette.results.length > 0 ? "1px solid var(--rove-border)" : "none") != null ? k.style.setProperty("border-top", C) : k.style.removeProperty("border-top")), k;
					}
				}), null), (0, solid_js_web.effect)((k) => {
					var C = g() === "top" ? "0" : g() === "middle" ? "50%" : "auto", X = g() === "bottom" ? "0" : "auto", se = g() === "middle" ? "translate(-50%, -50%)" : "translateX(-50%)", K = n() ? "Filter…" : "Search…";
					return C !== k.e && ((k.e = C) != null ? i.style.setProperty("top", C) : i.style.removeProperty("top")), X !== k.t && ((k.t = X) != null ? i.style.setProperty("bottom", X) : i.style.removeProperty("bottom")), se !== k.a && ((k.a = se) != null ? i.style.setProperty("transform", se) : i.style.removeProperty("transform")), K !== k.o && (0, solid_js_web.setAttribute)(h, "placeholder", k.o = K), k;
				}, {
					e: void 0,
					t: void 0,
					a: void 0,
					o: void 0
				}), (0, solid_js_web.effect)(() => h.value = e.state.palette.query), i;
			}
		})];
	}
	(0, solid_js_web.delegateEvents)([
		"input",
		"keydown",
		"click"
	]);
	var ur = /* @__PURE__ */ (0, solid_js_web.template)("<span>Select");
	var yr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=titlebar role=toolbar><button class=titlebar-btn aria-label=\"Go back\">←</button><span class=titlebar-title><span></span></span><button class=titlebar-btn aria-label=\"Switch to palette view\"title=\"Switch to palette view\">⌕</button><button class=titlebar-btn aria-label=\"Reset window position\"title=\"Reset position\">□</button><button class=titlebar-btn aria-label=Close>×");
	function pr(e) {
		return (() => {
			var t = yr(), r = t.firstChild, n = r.nextSibling, d = n.firstChild, o = n.nextSibling, a = o.nextSibling, p = a.nextSibling;
			return (0, solid_js_web.addEventListener)(t, "mousedown", e.onDragStart, !0), t.style.setProperty("display", "flex"), t.style.setProperty("align-items", "center"), t.style.setProperty("padding", "6px 8px"), t.style.setProperty("background", "var(--rove-surface)"), t.style.setProperty("border-bottom", "1px solid var(--rove-border)"), t.style.setProperty("cursor", "move"), t.style.setProperty("user-select", "none"), t.style.setProperty("gap", "6px"), r.$$mousedown = (f) => f.stopPropagation(), r.$$click = (f) => {
				f.stopPropagation(), e.onBack();
			}, r.style.setProperty("background", "none"), r.style.setProperty("border", "none"), r.style.setProperty("font-size", "14px"), r.style.setProperty("padding", "2px 6px"), n.style.setProperty("flex", "1"), n.style.setProperty("display", "flex"), n.style.setProperty("align-items", "center"), n.style.setProperty("justify-content", "center"), n.style.setProperty("gap", "6px"), n.style.setProperty("overflow", "hidden"), n.style.setProperty("font-weight", "500"), n.style.setProperty("font-size", "13px"), n.style.setProperty("color", "var(--rove-text)"), (0, solid_js_web.insert)(n, (0, solid_js_web.createComponent)(solid_js.Show, {
				get when() {
					return e.ephemeral;
				},
				get children() {
					var f = ur();
					return f.style.setProperty("font-size", "10px"), f.style.setProperty("font-weight", "600"), f.style.setProperty("color", "var(--rove-accent)"), f.style.setProperty("background", "var(--rove-selected)"), f.style.setProperty("padding", "1px 6px"), f.style.setProperty("border-radius", "10px"), f.style.setProperty("white-space", "nowrap"), f.style.setProperty("flex-shrink", "0"), f;
				}
			}), d), d.style.setProperty("overflow", "hidden"), d.style.setProperty("text-overflow", "ellipsis"), d.style.setProperty("white-space", "nowrap"), (0, solid_js_web.insert)(d, () => e.title), o.$$mousedown = (f) => f.stopPropagation(), o.$$click = (f) => {
				f.stopPropagation(), e.onModeSwap();
			}, o.style.setProperty("background", "none"), o.style.setProperty("border", "none"), o.style.setProperty("cursor", "pointer"), o.style.setProperty("color", "var(--rove-text-dim)"), o.style.setProperty("font-size", "14px"), o.style.setProperty("padding", "2px 6px"), a.$$mousedown = (f) => f.stopPropagation(), a.$$click = (f) => {
				f.stopPropagation(), e.onReset();
			}, a.style.setProperty("background", "none"), a.style.setProperty("border", "none"), a.style.setProperty("cursor", "pointer"), a.style.setProperty("color", "var(--rove-text-dim)"), a.style.setProperty("font-size", "12px"), a.style.setProperty("padding", "2px 6px"), p.$$mousedown = (f) => f.stopPropagation(), p.$$click = (f) => {
				f.stopPropagation(), e.onClose();
			}, p.style.setProperty("background", "none"), p.style.setProperty("border", "none"), p.style.setProperty("cursor", "pointer"), p.style.setProperty("color", "var(--rove-text-dim)"), p.style.setProperty("font-size", "16px"), p.style.setProperty("padding", "2px 6px"), (0, solid_js_web.effect)((f) => {
				var I = !e.canGoBack, g = e.canGoBack ? "pointer" : "default", v = e.canGoBack ? "var(--rove-text)" : "var(--rove-text-dim)";
				return I !== f.e && (r.disabled = f.e = I), g !== f.t && ((f.t = g) != null ? r.style.setProperty("cursor", g) : r.style.removeProperty("cursor")), v !== f.a && ((f.a = v) != null ? r.style.setProperty("color", v) : r.style.removeProperty("color")), f;
			}, {
				e: void 0,
				t: void 0,
				a: void 0
			}), t;
		})();
	}
	(0, solid_js_web.delegateEvents)(["mousedown", "click"]);
	var fr = /* @__PURE__ */ (0, solid_js_web.template)("<nav class=breadcrumbs aria-label=\"Directory path\">");
	var hr = /* @__PURE__ */ (0, solid_js_web.template)("<span>/");
	var vr = /* @__PURE__ */ (0, solid_js_web.template)("<button>");
	var gr = /* @__PURE__ */ (0, solid_js_web.template)("<span>…");
	function mr(e) {
		const t = () => {
			const r = ["🏠", ...e.pathLabels];
			return r.length > 3 ? [
				{
					label: "🏠",
					index: -1
				},
				{
					label: "…",
					index: -2
				},
				{
					label: r[r.length - 2],
					index: e.pathLabels.length - 2
				},
				{
					label: r[r.length - 1],
					index: e.pathLabels.length - 1
				}
			] : r.map((n, d) => ({
				label: n,
				index: d - 1
			}));
		};
		return (() => {
			var r = fr();
			return r.style.setProperty("display", "flex"), r.style.setProperty("align-items", "center"), r.style.setProperty("gap", "2px"), r.style.setProperty("padding", "4px 8px"), r.style.setProperty("font-size", "11px"), r.style.setProperty("color", "var(--rove-text-dim)"), r.style.setProperty("border-bottom", "1px solid var(--rove-border)"), r.style.setProperty("flex-wrap", "wrap"), (0, solid_js_web.insert)(r, (0, solid_js_web.createComponent)(solid_js.For, {
				get each() {
					return t();
				},
				children: (n, d) => [(0, solid_js_web.createComponent)(solid_js.Show, {
					get when() {
						return d() > 0;
					},
					get children() {
						var o = hr();
						return o.style.setProperty("color", "var(--rove-text-dim)"), o;
					}
				}), (0, solid_js_web.createComponent)(solid_js.Show, {
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
						return o.$$click = () => e.onNavigateTo(n.index), o.style.setProperty("background", "none"), o.style.setProperty("border", "none"), o.style.setProperty("cursor", "pointer"), o.style.setProperty("color", "var(--rove-accent)"), o.style.setProperty("font-size", "inherit"), o.style.setProperty("padding", "0 2px"), o.style.setProperty("text-decoration", "underline"), (0, solid_js_web.insert)(o, () => n.label), o;
					}
				})]
			})), r;
		})();
	}
	(0, solid_js_web.delegateEvents)(["click"]);
	var xr = /* @__PURE__ */ (0, solid_js_web.template)("<div role=listbox class=dirview-items>");
	var br = /* @__PURE__ */ (0, solid_js_web.template)("<div>/");
	var Pr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=dirview-container role=navigation aria-label=\"Directory navigator\"tabindex=0><div class=dirview-resize>");
	var wr = /* @__PURE__ */ (0, solid_js_web.template)("<textarea class=dirview-inline-field>");
	var $r = /* @__PURE__ */ (0, solid_js_web.template)("<input type=text class=dirview-inline-field>");
	var kr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=dirview-inline><label class=dirview-inline-label></label><span class=dirview-inline-hint>");
	var _r = /* @__PURE__ */ (0, solid_js_web.template)("<div role=listbox>");
	var Sr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=dirview-multiselect-footer> selected · Enter to save · Esc to cancel");
	var Er = /* @__PURE__ */ (0, solid_js_web.template)("<div role=option><span>.</span><span></span><span>");
	var Cr = /* @__PURE__ */ (0, solid_js_web.template)("<div role=option aria-label=\"Previous page\"><span>.</span><span>← Previous page");
	var Tr = /* @__PURE__ */ (0, solid_js_web.template)("<div role=option aria-label=\"Next page\"><span>.</span><span>Next page →");
	var Ir = /* @__PURE__ */ (0, solid_js_web.template)("<span>");
	var Lr = /* @__PURE__ */ (0, solid_js_web.template)("<span>✓");
	var Ar = /* @__PURE__ */ (0, solid_js_web.template)("<span>→");
	var Mr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=dirview-item role=option><span>.</span><span>");
	var $e = 9;
	var zr = 200;
	var Dr = 150;
	function Rr(e) {
		let t, r, n = !1, d = !1, o = 0, a = 0;
		const [p, f] = (0, solid_js.createSignal)(null), [I, g] = (0, solid_js.createSignal)(null), [v, i] = (0, solid_js.createSignal)(""), [x, h] = (0, solid_js.createSignal)(null), [L, z] = (0, solid_js.createSignal)(0);
		(0, solid_js.createEffect)(() => {
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
			})), f(null), t?.focus();
		}
		function Oe() {
			if (I()) {
				g(null), t?.focus();
				return;
			}
			if (x()) {
				h(null), t?.focus();
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
		(0, solid_js.onMount)(() => {
			const l = de(e.keyPrefix, "window", "state");
			l && e.set("window", l);
		}), (0, solid_js.createEffect)(() => {
			if (!V()) return;
			const l = t;
			l && (l.addEventListener("keydown", Xe), (0, solid_js.onCleanup)(() => l.removeEventListener("keydown", Xe)));
		}), (0, solid_js.createEffect)(() => ke(e.keyPrefix, "window", "state", e.state.window));
		const Ke = (0, solid_js.createMemo)(() => Object.entries(k()).map(([l, s]) => ({
			key: l,
			item: s
		}))), ce = (0, solid_js.createMemo)(() => {
			const l = Ke().length;
			return l <= $e ? 1 : 1 + Math.ceil((l - 8) / 7);
		}), Ue = (0, solid_js.createMemo)(() => {
			const l = Ke(), s = ce(), u = e.state.nav.page;
			if (s === 1) return l.map((_) => ({
				kind: "item",
				key: _.key,
				item: _.item
			}));
			const c = u > 1, y = u < s, S = $e - (c ? 1 : 0) - (y ? 1 : 0), m = u === 1 ? 0 : 8 + (u - 2) * 7, w = [];
			c && w.push({ kind: "prev" });
			for (const _ of l.slice(m, m + S)) w.push({
				kind: "item",
				key: _.key,
				item: _.item
			});
			return y && w.push({ kind: "next" }), w;
		});
		(0, solid_js.createEffect)(() => {
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
			ke(e.keyPrefix, "input", l.nodePath.join("."), s), (c = (u = l.item).onChange) == null || c.call(u, s), g(null), z((y) => y + 1), t?.focus();
		}
		function Ge() {
			var s, u;
			const l = x();
			l && (ke(e.keyPrefix, "input", l.nodePath.join("."), l.selected), (u = (s = l.item).onChange) == null || u.call(s, l.selected), h(null), z((c) => c + 1), t?.focus());
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
			const { key: s, item: u } = l, c = p();
			u.type === "directory" ? u.children ? ae(s, u.children, u.label) : u.load && je(s, u.label, u) : u.type === "action" ? (u.action(), c && ((y = c.onSelect) == null || y.call(c, s, u), ue(c))) : u.type === "input" ? We(s, u) : u.type === "select" && Qe(s, u);
		}
		function We(l, s) {
			var y;
			const u = [...C(), l], c = de(e.keyPrefix, "input", u.join("."));
			if (s.inputType === "checkbox") {
				const m = !(c !== null ? c : s.defaultValue ?? !1);
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
			let c = !1;
			e.set("palette", "overlay", {
				type: "loading",
				label: s,
				cancel: () => {
					c = !0;
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
				for (const S of c) y[S] = {
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
				ae(l, u(s.options), s.label), f({ returnHistoryLength: c });
			} else if (s.load) {
				let c = !1;
				e.set("palette", "overlay", {
					type: "loading",
					label: s.label,
					cancel: () => {
						c = !0;
					}
				}), s.load().then((y) => {
					if (c) return;
					e.set("palette", "overlay", null);
					const S = b().length;
					ae(l, u(y), s.label), f({ returnHistoryLength: S });
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
				l.key === "Escape" && (l.preventDefault(), g(null), t?.focus());
				return;
			}
			if (x()) {
				if (l.key === "Enter") {
					l.preventDefault(), Ge();
					return;
				}
				if (l.key === "Escape") {
					l.preventDefault(), h(null), t?.focus();
					return;
				}
				const y = l.code.match(/^(?:Digit|Numpad)([1-9])$/), S = y ? parseInt(y[1]) : NaN;
				isNaN(S) || (l.preventDefault(), _e(S - 1));
				return;
			}
			if (l.key === "Escape") {
				l.preventDefault();
				const y = p();
				y ? ue(y) : e.set("visible", !1);
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
			n = !0;
			const s = t.getBoundingClientRect();
			o = l.clientX - s.left, a = l.clientY - s.top;
			const u = (y) => {
				n && e.set("window", (S) => ({
					...S,
					x: Math.max(-S.width + 50, Math.min(y.clientX - o, window.innerWidth - 50)),
					y: Math.max(0, Math.min(y.clientY - a, window.innerHeight - 50))
				}));
			}, c = () => {
				n = !1, document.removeEventListener("mousemove", u), document.removeEventListener("mouseup", c);
			};
			document.addEventListener("mousemove", u), document.addEventListener("mouseup", c);
		}
		function q(l) {
			l.preventDefault(), l.stopPropagation(), d = !0;
			const s = l.clientX, u = l.clientY, c = e.state.window.width, y = e.state.window.height, S = (w) => {
				d && e.set("window", (_) => ({
					..._,
					width: Math.max(zr, c + (w.clientX - s)),
					height: Math.max(Dr, y + (w.clientY - u))
				}));
			}, m = () => {
				d = !1, document.removeEventListener("mousemove", S), document.removeEventListener("mouseup", m);
			};
			document.addEventListener("mousemove", S), document.addEventListener("mouseup", m);
		}
		function B() {
			e.set("window", {
				x: Math.round(window.innerWidth * .375),
				y: Math.round(window.innerHeight * .375),
				width: Math.round(window.innerWidth * .25),
				height: Math.round(window.innerHeight * .25)
			});
		}
		const V = (0, solid_js.createMemo)(() => e.state.visible && e.state.mode === "dir");
		return (0, solid_js.createEffect)(() => {
			V() && e.state.palette.overlay === null && !I() && t?.focus();
		}), (0, solid_js.createEffect)(() => {
			Ve() && console.log(`[Rove:DirView:${e.keyPrefix}] visible=${V()}`);
		}), (0, solid_js_web.createComponent)(solid_js.Show, {
			get when() {
				return V();
			},
			get children() {
				var l = Pr(), s = l.firstChild, u = t;
				return typeof u == "function" ? (0, solid_js_web.use)(u, l) : t = l, l.style.setProperty("position", "fixed"), l.style.setProperty("z-index", "var(--rove-z-index)"), l.style.setProperty("background", "var(--rove-bg)"), l.style.setProperty("border", "1px solid var(--rove-border)"), l.style.setProperty("border-radius", "var(--rove-border-radius)"), l.style.setProperty("box-shadow", "var(--rove-shadow)"), l.style.setProperty("display", "flex"), l.style.setProperty("flex-direction", "column"), l.style.setProperty("overflow", "hidden"), l.style.setProperty("min-width", "200px"), l.style.setProperty("min-height", "150px"), (0, solid_js_web.insert)(l, (0, solid_js_web.createComponent)(pr, {
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
					onClose: () => e.set("visible", !1),
					onReset: B,
					onDragStart: T
				}), s), (0, solid_js_web.insert)(l, (0, solid_js_web.createComponent)(mr, {
					get pathLabels() {
						return X();
					},
					onNavigateTo: Je
				}), s), (0, solid_js_web.insert)(l, (0, solid_js_web.createComponent)(solid_js.Switch, { get children() {
					return [
						(0, solid_js_web.createComponent)(solid_js.Match, {
							get when() {
								return I();
							},
							children: (c) => (() => {
								var y = kr(), S = y.firstChild, m = S.nextSibling;
								return (0, solid_js_web.insert)(S, () => c().item.label), (0, solid_js_web.insert)(y, (0, solid_js_web.createComponent)(solid_js.Show, {
									get when() {
										return c().item.inputType === "textarea";
									},
									get children() {
										var w = wr();
										return w.$$keydown = (_) => {
											_.key === "Enter" && (_.ctrlKey || _.metaKey) && (_.preventDefault(), ge());
										}, w.$$input = (_) => i(_.currentTarget.value), (0, solid_js_web.use)((_) => {
											r = _;
										}, w), (0, solid_js_web.effect)(() => w.value = v()), w;
									}
								}), m), (0, solid_js_web.insert)(y, (0, solid_js_web.createComponent)(solid_js.Show, {
									get when() {
										return c().item.inputType === "text";
									},
									get children() {
										var w = $r();
										return w.$$keydown = (_) => {
											_.key === "Enter" && (_.preventDefault(), ge());
										}, w.$$input = (_) => i(_.currentTarget.value), (0, solid_js_web.use)((_) => {
											r = _;
										}, w), (0, solid_js_web.effect)(() => w.value = v()), w;
									}
								}), m), (0, solid_js_web.insert)(m, () => c().item.inputType === "textarea" ? "Ctrl+Enter to save · Esc to cancel" : "Enter to save · Esc to cancel"), y;
							})()
						}),
						(0, solid_js_web.createComponent)(solid_js.Match, {
							get when() {
								return x();
							},
							children: (c) => [(() => {
								var y = _r();
								return y.style.setProperty("flex", "1"), y.style.setProperty("overflow-y", "auto"), y.style.setProperty("padding", "4px 0"), (0, solid_js_web.insert)(y, (0, solid_js_web.createComponent)(solid_js.For, {
									get each() {
										return c().item.options ?? [];
									},
									children: (S, m) => {
										const w = () => c().selected.includes(S);
										return (() => {
											var _ = Er(), $ = _.firstChild, E = $.firstChild, j = $.nextSibling, D = j.nextSibling;
											return _.addEventListener("mouseleave", (R) => R.currentTarget.style.background = ""), _.addEventListener("mouseenter", (R) => R.currentTarget.style.background = "var(--rove-hover)"), _.$$click = () => _e(m()), _.style.setProperty("display", "flex"), _.style.setProperty("align-items", "center"), _.style.setProperty("gap", "8px"), _.style.setProperty("padding", "6px 12px"), _.style.setProperty("cursor", "pointer"), _.style.setProperty("color", "var(--rove-text)"), $.style.setProperty("color", "var(--rove-text-dim)"), $.style.setProperty("font-size", "11px"), $.style.setProperty("min-width", "14px"), (0, solid_js_web.insert)($, () => m() + 1, E), j.style.setProperty("min-width", "14px"), j.style.setProperty("font-size", "13px"), (0, solid_js_web.insert)(j, () => w() ? "☑" : "☐"), D.style.setProperty("flex", "1"), (0, solid_js_web.insert)(D, S), (0, solid_js_web.effect)((R) => {
												var N = w(), Z = w() ? "var(--rove-accent)" : "var(--rove-text-dim)";
												return N !== R.e && (0, solid_js_web.setAttribute)(_, "aria-selected", R.e = N), Z !== R.t && ((R.t = Z) != null ? j.style.setProperty("color", Z) : j.style.removeProperty("color")), R;
											}, {
												e: void 0,
												t: void 0
											}), _;
										})();
									}
								})), y;
							})(), (() => {
								var y = Sr(), S = y.firstChild;
								return (0, solid_js_web.insert)(y, () => c().selected.length, S), y;
							})()]
						}),
						(0, solid_js_web.createComponent)(solid_js.Match, {
							when: !0,
							get children() {
								return [(() => {
									var c = xr();
									return c.style.setProperty("flex", "1"), c.style.setProperty("overflow-y", "auto"), c.style.setProperty("padding", "4px 0"), (0, solid_js_web.insert)(c, (0, solid_js_web.createComponent)(solid_js.For, {
										get each() {
											return Ue();
										},
										children: (y, S) => y.kind === "prev" ? (() => {
											var m = Cr(), w = m.firstChild, _ = w.firstChild;
											return m.addEventListener("mouseleave", ($) => $.currentTarget.style.background = ""), m.addEventListener("mouseenter", ($) => $.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => e.set("nav", "page", e.state.nav.page - 1), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text-dim)"), m.style.setProperty("font-size", "12px"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), (0, solid_js_web.insert)(w, () => S() + 1, _), m;
										})() : y.kind === "next" ? (() => {
											var m = Tr(), w = m.firstChild, _ = w.firstChild;
											return m.addEventListener("mouseleave", ($) => $.currentTarget.style.background = ""), m.addEventListener("mouseenter", ($) => $.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => e.set("nav", "page", e.state.nav.page + 1), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text-dim)"), m.style.setProperty("font-size", "12px"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), (0, solid_js_web.insert)(w, () => S() + 1, _), m;
										})() : (() => {
											var m = Mr(), w = m.firstChild, _ = w.firstChild, $ = w.nextSibling;
											return m.addEventListener("mouseleave", (E) => E.currentTarget.style.background = ""), m.addEventListener("mouseenter", (E) => E.currentTarget.style.background = "var(--rove-hover)"), m.$$click = () => Se(y), (0, solid_js_web.setAttribute)(m, "aria-selected", !1), m.style.setProperty("display", "flex"), m.style.setProperty("align-items", "center"), m.style.setProperty("gap", "8px"), m.style.setProperty("padding", "6px 12px"), m.style.setProperty("cursor", "pointer"), m.style.setProperty("color", "var(--rove-text)"), w.style.setProperty("color", "var(--rove-text-dim)"), w.style.setProperty("font-size", "11px"), w.style.setProperty("min-width", "14px"), (0, solid_js_web.insert)(w, () => S() + 1, _), $.style.setProperty("flex", "1"), (0, solid_js_web.insert)($, () => "label" in y.item ? y.item.label : y.key), (0, solid_js_web.insert)(m, (0, solid_js_web.createComponent)(solid_js.Show, {
												get when() {
													return y.item.type === "input";
												},
												get children() {
													var E = Ir();
													return E.style.setProperty("font-size", "11px"), E.style.setProperty("color", "var(--rove-text-dim)"), E.style.setProperty("max-width", "80px"), E.style.setProperty("overflow", "hidden"), E.style.setProperty("text-overflow", "ellipsis"), E.style.setProperty("white-space", "nowrap"), (0, solid_js_web.insert)(E, () => qe(y.key, y.item)), E;
												}
											}), null), (0, solid_js_web.insert)(m, (0, solid_js_web.createComponent)(solid_js.Show, {
												get when() {
													var E;
													return ((E = p()) == null ? void 0 : E.selectedKey) === y.key;
												},
												get children() {
													var E = Lr();
													return E.style.setProperty("color", "var(--rove-accent)"), E.style.setProperty("font-size", "13px"), E;
												}
											}), null), (0, solid_js_web.insert)(m, (0, solid_js_web.createComponent)(solid_js.Show, {
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
								})(), (0, solid_js_web.createComponent)(solid_js.Show, {
									get when() {
										return ce() > 1;
									},
									get children() {
										var c = br(), y = c.firstChild;
										return c.style.setProperty("padding", "4px 12px"), c.style.setProperty("font-size", "11px"), c.style.setProperty("color", "var(--rove-text-dim)"), c.style.setProperty("border-top", "1px solid var(--rove-border)"), c.style.setProperty("text-align", "center"), (0, solid_js_web.insert)(c, () => e.state.nav.page, y), (0, solid_js_web.insert)(c, ce, null), c;
									}
								})];
							}
						})
					];
				} }), s), s.$$mousedown = q, s.style.setProperty("position", "absolute"), s.style.setProperty("bottom", "0"), s.style.setProperty("right", "0"), s.style.setProperty("width", "12px"), s.style.setProperty("height", "12px"), s.style.setProperty("cursor", "se-resize"), s.style.setProperty("background", "var(--rove-text-dim)"), s.style.setProperty("clip-path", "polygon(100% 0, 100% 100%, 0 100%)"), s.style.setProperty("opacity", "0.4"), (0, solid_js_web.effect)((c) => {
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
	(0, solid_js_web.delegateEvents)([
		"mousedown",
		"input",
		"keydown",
		"click"
	]);
	var Hr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=modal-loading><span>Loading <!>…</span><button>Dismiss");
	var qr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=modal-error><p></p><button>Close");
	var jr = /* @__PURE__ */ (0, solid_js_web.template)("<div class=modal-backdrop><div class=modal-sheet role=dialog aria-modal=true>");
	var Nr = /* @__PURE__ */ (0, solid_js_web.template)("<input type=text class=modal-input-field>");
	var Br = /* @__PURE__ */ (0, solid_js_web.template)("<textarea class=\"modal-input-field modal-textarea\">");
	var Vr = /* @__PURE__ */ (0, solid_js_web.template)("<input type=checkbox class=modal-input-checkbox>");
	var Or = /* @__PURE__ */ (0, solid_js_web.template)("<select class=modal-input-field>");
	var Kr = /* @__PURE__ */ (0, solid_js_web.template)("<select multiple class=modal-input-field>");
	var Ur = /* @__PURE__ */ (0, solid_js_web.template)("<div class=modal-input><label class=modal-label></label><div class=modal-actions><button class=\"modal-btn modal-btn--primary\">Accept <kbd>Ctrl+Enter</kbd></button><button class=modal-btn>Cancel <kbd>Esc");
	var mt = /* @__PURE__ */ (0, solid_js_web.template)("<option>");
	function xt(e) {
		return Array.from(e.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")).filter((t) => !t.hasAttribute("disabled"));
	}
	function Gr(e) {
		let t, r = null;
		(0, solid_js.onMount)(() => {
			r = document.activeElement;
			const o = xt(t);
			o[0] && o[0].focus();
		}), (0, solid_js.onCleanup)(() => {
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
			(0, solid_js_web.addEventListener)(o, "click", e.onCancel, !0), o.style.setProperty("position", "fixed"), o.style.setProperty("inset", "0"), o.style.setProperty("background", "rgba(0,0,0,0.45)"), o.style.setProperty("z-index", "1000000"), o.style.setProperty("display", "flex"), o.style.setProperty("align-items", "center"), o.style.setProperty("justify-content", "center"), a.$$click = (f) => f.stopPropagation(), a.$$keydown = d;
			var p = t;
			return typeof p == "function" ? (0, solid_js_web.use)(p, a) : t = a, a.style.setProperty("background", "var(--rove-bg)"), a.style.setProperty("border", "1px solid var(--rove-border)"), a.style.setProperty("border-radius", "var(--rove-border-radius)"), a.style.setProperty("box-shadow", "var(--rove-shadow)"), a.style.setProperty("width", "90%"), a.style.setProperty("max-width", "460px"), a.style.setProperty("padding", "20px 24px"), a.style.setProperty("max-height", "80vh"), a.style.setProperty("overflow-y", "auto"), (0, solid_js_web.insert)(a, (0, solid_js_web.createComponent)(solid_js.Switch, { get children() {
				return [
					(0, solid_js_web.createComponent)(solid_js.Match, {
						get when() {
							return e.overlay.type === "input";
						},
						get children() {
							return (0, solid_js_web.createComponent)(Wr, {
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
					}),
					(0, solid_js_web.createComponent)(solid_js.Match, {
						get when() {
							return e.overlay.type === "loading";
						},
						get children() {
							var f = Hr(), I = f.firstChild, v = I.firstChild.nextSibling;
							v.nextSibling;
							var i = I.nextSibling;
							return (0, solid_js_web.insert)(I, () => e.overlay.label, v), (0, solid_js_web.addEventListener)(i, "click", e.onCancel, !0), f;
						}
					}),
					(0, solid_js_web.createComponent)(solid_js.Match, {
						get when() {
							return e.overlay.type === "error";
						},
						get children() {
							var f = qr(), I = f.firstChild, g = I.nextSibling;
							return (0, solid_js_web.insert)(I, () => e.overlay.message), (0, solid_js_web.addEventListener)(g, "click", e.onCancel, !0), f;
						}
					})
				];
			} })), o;
		})();
	}
	function Wr(e) {
		const t = () => {
			const o = e.item.defaultValue;
			return o !== void 0 ? o : e.item.inputType === "checkbox" ? !1 : e.item.inputType === "select-multiple" ? [] : "";
		}, [r, n] = (0, solid_js.createSignal)(t()), d = e.item.inputType;
		return (() => {
			var o = Ur(), a = o.firstChild, p = a.nextSibling, f = p.firstChild, I = f.nextSibling;
			return (0, solid_js_web.insert)(a, () => e.item.label), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				when: d === "text",
				get children() {
					var g = Nr();
					return g.$$keydown = (v) => {
						v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
					}, g.addEventListener("focus", (v) => {
						const i = v.currentTarget.value.length;
						v.currentTarget.setSelectionRange(i, i);
					}), g.$$input = (v) => n(v.currentTarget.value), (0, solid_js_web.effect)(() => g.value = r()), g;
				}
			}), p), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				when: d === "textarea",
				get children() {
					var g = Br();
					return g.$$keydown = (v) => {
						v.key === "Enter" && (v.ctrlKey || v.metaKey) ? (v.preventDefault(), e.onAccept(r())) : v.key === "Escape" && (v.preventDefault(), e.onCancel());
					}, g.addEventListener("focus", (v) => {
						const i = v.currentTarget.value.length;
						v.currentTarget.setSelectionRange(i, i);
					}), g.$$input = (v) => n(v.currentTarget.value), (0, solid_js_web.insert)(g, () => r()), g;
				}
			}), p), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				when: d === "checkbox",
				get children() {
					var g = Vr();
					return g.$$keydown = (v) => {
						v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
					}, g.addEventListener("change", (v) => n(v.currentTarget.checked)), (0, solid_js_web.effect)(() => g.checked = r()), g;
				}
			}), p), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				when: d === "select",
				get children() {
					var g = Or();
					return g.$$keydown = (v) => {
						v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
					}, g.addEventListener("change", (v) => n(v.currentTarget.value)), (0, solid_js_web.insert)(g, () => {
						var v;
						return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
							var x = mt();
							return x.value = i, (0, solid_js_web.insert)(x, i), x;
						})());
					}), (0, solid_js_web.effect)(() => g.value = r()), g;
				}
			}), p), (0, solid_js_web.insert)(o, (0, solid_js_web.createComponent)(solid_js.Show, {
				when: d === "select-multiple",
				get children() {
					var g = Kr();
					return g.addEventListener("change", (v) => {
						const i = Array.from(v.currentTarget.selectedOptions).map((x) => x.value);
						n(i);
					}), g.$$keydown = (v) => {
						v.key === "Enter" && (v.ctrlKey || v.metaKey) && (v.preventDefault(), e.onAccept(r()));
					}, (0, solid_js_web.insert)(g, () => {
						var v;
						return (v = e.item.options) == null ? void 0 : v.map((i) => (() => {
							var x = mt();
							return x.value = i, (0, solid_js_web.insert)(x, i), x;
						})());
					}), g;
				}
			}), p), f.$$click = () => e.onAccept(r()), (0, solid_js_web.addEventListener)(I, "click", e.onCancel, !0), o;
		})();
	}
	(0, solid_js_web.delegateEvents)([
		"click",
		"keydown",
		"input"
	]);
	var Xr = /* @__PURE__ */ (0, solid_js_web.template)("<div><div>[<!>] visible=<!> mode=</div><div>theme=<!> navDepth=</div><div>palettePin=<!> overlay=");
	var Yr = `
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
		const r = t.attachShadow({ mode: "open" }), n = document.createElement("style");
		n.textContent = Yr, r.appendChild(n);
		const d = document.createElement("div");
		d.className = "rove-root", r.appendChild(d), t.tabIndex = -1, e.registry.setShadowHost(t);
		const o = window.matchMedia("(prefers-color-scheme: dark)"), a = e.state.meta.theme;
		t.setAttribute("data-theme", a === "system" ? o.matches ? "dark" : "light" : a);
		return {
			host: t,
			dispose: (0, solid_js_web.render)(() => (0, solid_js_web.createComponent)(Fr, (0, solid_js_web.mergeProps)(e, { shadowHost: t })), d)
		};
	}
	function Fr(e) {
		const t = window.matchMedia("(prefers-color-scheme: dark)");
		function r() {
			const a = e.state.meta.theme;
			a === "system" ? e.shadowHost.setAttribute("data-theme", t.matches ? "dark" : "light") : e.shadowHost.setAttribute("data-theme", a);
		}
		(0, solid_js.createEffect)(r);
		const n = () => {
			e.state.meta.theme === "system" && r();
		};
		t.addEventListener("change", n), (0, solid_js.onCleanup)(() => t.removeEventListener("change", n));
		function d(a) {
			const p = e.state.palette.overlay;
			(p == null ? void 0 : p.type) === "input" && (ke(e.keyPrefix, "input", p.nodePath.join("."), a), p.item.onChange && p.item.onChange(a), e.set("palette", "overlay", null));
		}
		function o() {
			e.set("palette", "overlay", null);
		}
		return [
			(0, solid_js_web.createComponent)(dr, {
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
			}),
			(0, solid_js_web.createComponent)(Rr, {
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
			}),
			(0, solid_js_web.createComponent)(solid_js.Show, {
				get when() {
					return e.state.palette.overlay !== null;
				},
				get children() {
					return (0, solid_js_web.createComponent)(Gr, {
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
			}),
			(0, solid_js_web.createComponent)(solid_js.Show, {
				get when() {
					return Ve();
				},
				get children() {
					var a = Xr(), p = a.firstChild, I = p.firstChild.nextSibling, v = I.nextSibling.nextSibling;
					v.nextSibling;
					var i = p.nextSibling, h = i.firstChild.nextSibling;
					h.nextSibling;
					var L = i.nextSibling, b = L.firstChild.nextSibling;
					return b.nextSibling, a.style.setProperty("position", "fixed"), a.style.setProperty("bottom", "4px"), a.style.setProperty("background", "#000"), a.style.setProperty("color", "#0f0"), a.style.setProperty("font-size", "10px"), a.style.setProperty("font-family", "monospace"), a.style.setProperty("padding", "3px 8px"), a.style.setProperty("z-index", "99999999"), a.style.setProperty("pointer-events", "none"), a.style.setProperty("border-radius", "3px"), a.style.setProperty("border", "1px solid #0f0"), a.style.setProperty("line-height", "1.8"), a.style.setProperty("opacity", "0.95"), (0, solid_js_web.insert)(p, () => e.keyPrefix, I), (0, solid_js_web.insert)(p, () => String(e.state.visible), v), (0, solid_js_web.insert)(p, () => e.state.mode, null), (0, solid_js_web.insert)(i, () => e.state.meta.theme, h), (0, solid_js_web.insert)(i, () => e.state.nav.history.length - 1, null), (0, solid_js_web.insert)(L, () => e.state.meta.palettePin, b), (0, solid_js_web.insert)(L, () => {
						var H;
						return String(((H = e.state.palette.overlay) == null ? void 0 : H.type) ?? "null");
					}, null), (0, solid_js_web.effect)((H) => {
						var k = e.keyPrefix.length <= 4 ? "4px" : "auto", C = e.keyPrefix.length <= 4 ? "auto" : "4px";
						return k !== H.e && ((H.e = k) != null ? a.style.setProperty("left", k) : a.style.removeProperty("left")), C !== H.t && ((H.t = C) != null ? a.style.setProperty("right", C) : a.style.removeProperty("right")), H;
					}, {
						e: void 0,
						t: void 0
					}), a;
				}
			})
		];
	}
	function Jr(e, t) {
		if (![
			"directory",
			"action",
			"input",
			"select"
		].includes(t.type)) throw new Error(`Rove: Invalid node type '${t.type}' on node '${e}'.`);
		if (t.type === "select" && !t.options && !t.load) throw new Error(`Rove: SelectItem '${e}' requires either 'options' or 'load'.`);
		if (t.type === "input") {
			if ((t.inputType === "select" || t.inputType === "select-multiple") && (!t.options || t.options.length === 0)) throw new Error(`Rove: InputItem '${e}' with inputType '${t.inputType}' requires a non-empty 'options' array.`);
			if (t.defaultValue !== void 0) {
				if (t.inputType === "checkbox" && typeof t.defaultValue != "boolean") throw new Error(`Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`);
				if (t.inputType === "select-multiple" && !Array.isArray(t.defaultValue)) throw new Error(`Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`);
				if ((t.inputType === "text" || t.inputType === "textarea" || t.inputType === "select") && typeof t.defaultValue != "string") throw new Error(`Rove: InputItem '${e}' defaultValue type does not match inputType '${t.inputType}'.`);
			}
		}
		if (t.type === "directory") {
			if (!t.children && !t.load) throw new Error(`Rove: DirectoryNodeItem '${e}' requires either 'children' or 'load'.`);
			t.children && kt(t.children);
		}
	}
	function kt(e) {
		if ("meta" in e) throw new Error("Rove: 'meta' is a reserved node key.");
		for (const [t, r] of Object.entries(e)) Jr(t, r);
	}
	function Qr(e) {
		if (!e.keyPrefix) throw new Error("Rove: 'keyPrefix' is required.");
		kt(e.tree);
		const t = Mt(e), [r, n] = Rt(t), d = new jt(), o = Ft(e.keyPrefix, n, d), a = {
			...e.tree,
			meta: o
		};
		let p = Yt(a);
		function f() {
			return p;
		}
		function I(b) {
			p = b;
		}
		n("nav", {
			history: [{
				key: "",
				label: "Root",
				node: a
			}],
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
			b.preventDefault(), r.mode === "palette" ? n("visible", !r.visible) : r.visible ? document.activeElement !== g && ((H = g.shadowRoot) == null ? void 0 : H.activeElement) == null ? (((k = g.shadowRoot) == null ? void 0 : k.querySelector("input:not([type=\"hidden\"]), textarea, [tabindex=\"0\"]")) ?? g).focus() : n("visible", !1) : (n("visible", !0), requestAnimationFrame(() => {
				var C;
				((C = g.shadowRoot) == null ? void 0 : C.activeElement) ?? g.focus();
			}));
		});
		const i = (b) => {
			r.mode !== "palette" || !r.visible || b.composedPath().includes(g) || n("visible", !1);
		};
		document.addEventListener("focusin", i, !0), document.addEventListener("mousedown", i, !0), d.registerScoped(t.modeSwapShortcut, "mode-swap", (b) => {
			b.preventDefault();
			const H = r.mode === "palette" ? "dir" : "palette";
			n("mode", H);
		});
		function x() {
			n("visible", !0), requestAnimationFrame(() => {
				var b;
				((b = g.shadowRoot) == null ? void 0 : b.activeElement) ?? g.focus();
			});
		}
		function h() {
			console.log(`[Rove:${e.keyPrefix}] hide() called — setting visible=false`), n("visible", !1);
		}
		function L() {
			r.visible ? h() : x();
		}
		function z() {
			d.destroy(), document.removeEventListener("focusin", i, !0), document.removeEventListener("mousedown", i, !0), v(), g.remove(), At(e.keyPrefix);
		}
		return window[`__rove_state_${e.keyPrefix}`] = r, window[`__rove_set_${e.keyPrefix}`] = n, window[`__rove_host_${e.keyPrefix}`] = g, {
			show: x,
			hide: h,
			toggle: L,
			destroy: z
		};
	}
	typeof window < "u" && typeof __USERSCRIPT_BUILD__ < "u" && __USERSCRIPT_BUILD__ && (window.__ROVE__ = { init: Qr });
	//#endregion
	//#region src/fedex-form-filler/legacy.ts
	var Shipment = class {
		name = "";
		email = "";
		what = "";
		address1 = "";
		address2 = "";
		zip = "";
		city = "";
		state = "";
		phone = "";
		work_order = "";
		cost_center = "";
		qty = "";
		constructor(row) {
			const cols = row.split("	");
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
	};
	var FORM_FIELDS$1 = {
		name: {
			selector: "#toData\\.contactName",
			value: null,
			type: "text"
		},
		email: {
			selector: "#notificationData\\.recipientNotifications\\.email",
			value: null,
			type: "text"
		},
		address1: {
			selector: "#toData\\.addressLine1",
			value: null,
			type: "text"
		},
		address2: {
			selector: "#toData\\.addressLine2",
			value: null,
			type: "text"
		},
		city: {
			selector: "#toData\\.city",
			value: null,
			type: "text"
		},
		state: {
			selector: "#toData\\.stateProvinceCode",
			value: null,
			type: "dropdown"
		},
		zip: {
			selector: "#toData\\.zipPostalCode",
			value: null,
			type: "text"
		},
		phone: {
			selector: "#toData\\.phoneNumber",
			value: null,
			type: "text"
		},
		personalMessage: {
			selector: "[name=\"notificationData.emailMessage\"]",
			value: null,
			type: "text"
		},
		cost_center: {
			selector: "#billingData\\.yourReference",
			value: null,
			type: "text"
		},
		signature: {
			selector: "#ss\\.signature\\.sel",
			value: 3,
			type: "dropdown"
		},
		"delivery notification": {
			selector: "#notificationData\\.senderNotifications\\.deliveryNotificationFlag",
			value: true,
			type: "checkbox"
		},
		"exceptions notification": {
			selector: "#notificationData\\.recipientNotifications\\.exceptionNotificationFlag",
			value: true,
			type: "checkbox"
		},
		"estimated delivery notification": {
			selector: "#notificationData\\.recipientNotifications\\.estimatedDeliveryNotificationFlag",
			value: true,
			type: "checkbox"
		}
	};
	function addFedExAutofillTextArea() {
		const colLeft = document.getElementById("columnLeft");
		const textArea = document.createElement("textarea");
		textArea.placeholder = "Paste excel row here to autofill";
		textArea.addEventListener("input", function(e) {
			autofillAction(FORM_FIELDS$1, e);
		});
		const TEXTAREA_STYLES = {
			marginBottom: "5px",
			paddingBottom: "10px",
			width: "calc(100% - 5px)",
			borderBottom: "solid 2px #660099",
			fontWeight: "bold",
			resize: "vertical"
		};
		for (const property in TEXTAREA_STYLES) textArea.style[property] = TEXTAREA_STYLES[property];
		colLeft.prepend(textArea);
		textArea.focus();
	}
	function autofillAction(FORM_FIELDS, e) {
		const ship = new Shipment(e.target.value);
		document.querySelector("#module\\.emailNotifications\\._headerEdit > a").click();
		FORM_FIELDS.personalMessage.value = `${ship.work_order} | ${ship.what}`;
		for (const field in FORM_FIELDS) {
			const fieldItem = document.querySelector(FORM_FIELDS[field].selector);
			switch (FORM_FIELDS[field].type) {
				case "text":
					fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
					break;
				case "dropdown":
					fieldItem.value = FORM_FIELDS[field].value === null ? ship[field] : FORM_FIELDS[field].value;
					break;
				case "checkbox":
					fieldItem.checked = FORM_FIELDS[field].value;
					break;
				default: console.log("you shouldn't be here");
			}
		}
	}
	//#endregion
	//#region src/fedex-form-filler/simulate.ts
	function isInputOrTextAreaElement(element) {
		return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
	}
	function setValue(inputElement, value) {
		if (!isInputOrTextAreaElement(inputElement)) throw new Error("The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.");
		inputElement.value = value;
		const inputEvent = new Event("input", { bubbles: true });
		inputElement.dispatchEvent(inputEvent);
	}
	function triggerChange(inputElement) {
		if (!isInputOrTextAreaElement(inputElement)) throw new Error("The inputElement must be an instance of HTMLInputElement or HTMLTextAreaElement.");
		const changeEvent = new Event("change", { bubbles: true });
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
		if (!(selectElement instanceof HTMLSelectElement)) throw new Error("The element must be an instance of HTMLSelectElement.");
		const matchingOption = Array.from(selectElement.options).find((option) => option.textContent?.trim().includes(textToMatch));
		if (matchingOption) {
			selectElement.value = matchingOption.value;
			const changeEvent = new Event("change", { bubbles: true });
			selectElement.dispatchEvent(changeEvent);
		} else console.warn(`Could not find option containing "${textToMatch}" in dropdown`);
	}
	//#endregion
	//#region src/utils/index.ts
	function waitForElm(selector) {
		return new Promise((resolve) => {
			if (document.querySelector(selector)) return resolve(document.querySelector(selector));
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
	//#endregion
	//#region src/fedex-form-filler/app.tsx
	var FORM_FIELDS = {
		country: {
			selector: "receiver-country-code",
			value: "190: US",
			type: "dropdown",
			elementType: "select"
		},
		zip: {
			selector: "receiver-postal-code",
			value: null,
			type: "text",
			elementType: "input"
		},
		name: {
			selector: "receiver-name",
			value: null,
			type: "text",
			elementType: "input"
		},
		address1: {
			selector: "receiver-address-line1",
			value: null,
			type: "text",
			elementType: "input"
		},
		address2: {
			selector: "receiver-address-line2",
			value: null,
			type: "text",
			elementType: "input"
		},
		city: {
			selector: "receiver-city",
			value: null,
			type: "text",
			elementType: "input"
		},
		phone: {
			selector: "receiver-telephone-number",
			value: null,
			type: "text",
			elementType: "input"
		},
		cost_center: {
			selector: "references-input-control",
			value: null,
			type: "text",
			elementType: "input"
		},
		signature: {
			selector: "signature-option",
			value: "4: DIRECT",
			type: "dropdown",
			elementType: "select"
		},
		billing: {
			selector: "bill-to",
			value: "Draper Mailroom",
			type: "dropdown-text",
			elementType: "select"
		},
		weight: {
			selector: "weight-0",
			value: "1",
			type: "text",
			elementType: "input"
		},
		state: {
			selector: "receiver-state-or-province",
			value: null,
			type: "dropdown",
			elementType: "select"
		},
		service: {
			selector: "service",
			value: "5: PRIORITY_OVERNIGHT",
			type: "dropdown",
			elementType: "select"
		}
	};
	function fillForm(ship) {
		const data = ship;
		for (const field in FORM_FIELDS) {
			const { selector, elementType, type, value } = FORM_FIELDS[field];
			const el = document.querySelector(`[data-test-id="${selector}"] ${elementType}`);
			if (!el) continue;
			if (type === "dropdown-text") selectByText(el, value ?? data[field] ?? "");
			else simulateUserInteraction(el, value ?? data[field] ?? "");
		}
	}
	function autoFillFromRow() {
		const row = prompt("Paste spreadsheet row:");
		if (!row) return;
		fillForm(new Shipment(row));
	}
	function autoFillFromJSON() {
		const jsonStr = prompt("Paste JSON (from SNOW script):");
		if (!jsonStr) return;
		try {
			const d = JSON.parse(jsonStr);
			fillForm({
				name: d.name ?? "",
				address1: d.streetAddress ?? "",
				address2: d.address2 ?? "",
				city: d.city ?? "",
				state: d.state ?? "",
				zip: d.postalCode ?? "",
				phone: d.phone ?? "",
				cost_center: d.costCenter ?? "",
				email: d.email ?? ""
			});
		} catch {
			console.error("[fedex-form-filler] Invalid JSON");
		}
	}
	function initializeStaticFields() {
		const signatureCheckboxSel = `ui-checkbox[data-test-id="signature-options-checkbox"] input[type="checkbox"]`;
		waitForElm(signatureCheckboxSel).then(() => {
			const el = document.querySelector(signatureCheckboxSel);
			el?.click();
			el?.dispatchEvent(new Event("change"));
		});
		const signatureOptionSel = `signature-options[data-test-id="signature-options"] select`;
		waitForElm(signatureOptionSel).then(() => {
			const el = document.querySelector(signatureOptionSel);
			el.value = "4: DIRECT";
			el.dispatchEvent(new Event("change"));
		});
		const accountSwitcherSel = `account-switcher [data-test-id="account-switcher"] select`;
		waitForElm(accountSwitcherSel).then(() => {
			selectByText(document.querySelector(accountSwitcherSel), "Draper Mailroom");
		});
	}
	window.addEventListener("load", () => {
		if (window.location.href.includes("shipping/shipEntryAction")) addFedExAutofillTextArea();
		if (window.location.href.includes("shippingplus")) waitForElm("address-to-form").then(() => {
			initializeStaticFields();
			const rove = Qr({
				keyPrefix: "fedex",
				defaults: {
					mode: "dir",
					theme: "dark"
				},
				tree: { autofill: {
					type: "directory",
					label: "Autofill",
					children: {
						pasteRow: {
							type: "action",
							label: "Paste Row",
							action: autoFillFromRow
						},
						pasteJson: {
							type: "action",
							label: "Paste JSON",
							action: autoFillFromJSON
						}
					}
				} }
			});
			GM_registerMenuCommand("FedEx Autofill", () => rove.toggle());
		});
	});
	//#endregion
})(VM.solid.store, VM.solid.web, VM.solid);
