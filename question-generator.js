/* PhysicsLearn question generator.
   Each template rebuilds one numerical question from the question bank with new numbers (and, where it makes
   sense, new names and objects). The answer, the options and the worked steps are all recomputed by code, and
   the layout is kept exactly like the original: same wording, same number of parts, same marks, same answer format.
   Questions without a template (graphs, concept questions, figures that contain numbers) are never changed.
   Every template can also be run with its original numbers (orig = true) so tests can confirm it reproduces
   the answers printed in the book. */
(function (root) {
  "use strict";
  const G = 9.81, D = "–", LET = "ABCD";

  // ---------- random numbers ----------
  function makeR(seed, orig) {
    let a = seed >>> 0;
    const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const R = { orig: !!orig, next };
    R.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    R.pick = (arr) => arr[Math.floor(next() * arr.length)];
    R.shuffle = (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    R.dec = (lo, hi, step) => lo + step * Math.floor(next() * (Math.round((hi - lo) / step) + 1));
    return R;
  }

  // ---------- formatting ----------
  const trim = (x, d) => String(Number(x.toFixed(d))).replace(/^-/, D);
  const fix = (x, d) => x.toFixed(d).replace(/^-/, D);
  function sg(x, n) { if (x === 0) return "0"; let p = Number(x).toPrecision(n); if (/e/.test(p)) p = String(Number(p)); return p.replace(/^-/, D); }
  const ord = (n) => n + ((n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));
  function sci(x, sig) { // e.g. –4 × 10^{5}
    const s = x < 0 ? D : ""; x = Math.abs(x); const e = Math.floor(Math.log10(x)); let m = Number((x / Math.pow(10, e)).toPrecision(sig || 3));
    return s + String(m) + " × 10^{" + e + "}";
  }
  const P = (x) => ({ t: "p", x }), M = (x) => ({ t: "m", x }), H = (x) => ({ t: "h", x });
  const parseOpt = (s) => { const m = String(s).replace(/–/g, "-").match(/(-?\d+(?:\.\d+)?)(?:\s*×\s*10\^\{(-?\d+)\})?/); return m ? Number(m[1]) * Math.pow(10, m[2] ? Number(m[2]) : 0) : NaN; };
  const imgs = (q) => (q.question || []).filter((b) => b.t === "img");

  // Build 4 options (ascending by size) with the correct value hidden among plausible wrong ones.
  function mcq(R, q, value, wrong, fmt, o) {
    o = o || {};
    if (R.orig && q.options) { // reproduce the book's own options and find the correct letter
      const vals = q.options.map(parseOpt); let idx = -1, best = 1e9;
      vals.forEach((v, i) => { if (isFinite(v)) { const d = Math.abs(v - value) / (Math.abs(value) || 1); if (d < best) { best = d; idx = i; } } });
      return { options: q.options.slice(), answer: LET[idx], gap: best };
    }
    const seen = new Set([fmt(value)]), w = [];
    const ok = (x) => isFinite(x) && (o.allowNeg || x > 0);
    for (const x of R.shuffle(wrong)) { if (!ok(x)) continue; const k = fmt(x); if (!seen.has(k)) { seen.add(k); w.push(x); } if (w.length === (o.last ? 2 : 3)) break; }
    const fill = [1.25, 0.8, 1.5, 0.5, 2, 0.6, 1.8, 0.4, 3];
    for (let i = 0; w.length < (o.last ? 2 : 3) && i < fill.length; i++) { const x = value * fill[i]; const k = fmt(x); if (ok(x) && !seen.has(k)) { seen.add(k); w.push(x); } }
    const all = [value].concat(w), key = o.byAbs ? (v) => Math.abs(v) : (v) => v;
    all.sort((a, b) => key(a) - key(b));
    const options = all.map(fmt);
    if (o.last) options.push(o.last);
    return { options, answer: LET[all.indexOf(value)] };
  }
  const NAMES = ["Teresa", "Ian", "Wendy", "Tommy", "Susan", "Kevin", "Mary", "Peter", "Amy", "Jason"];

  const T = {};
  const reg = (id, expect, gen) => { T[id] = { expect, gen }; };

  // =====================================================================================
  // CONSOLIDATION - MULTIPLE CHOICE
  // =====================================================================================
  reg("pm-cons-mc-5", { v: [14.5, 0.005] }, (R, q) => {
    const noun = R.orig ? "bicycle" : R.pick(["bicycle", "scooter", "skateboard", "go-kart", "tricycle"]);
    const u = R.orig ? 2 : R.int(1, 6), a = R.orig ? 2.5 : R.pick([0.5, 1, 1.5, 2, 2.5, 3, 3.5]), t = R.orig ? 5 : R.int(3, 12);
    const v = u + a * t, fmt = (x) => trim(x, 2) + " m s^{–1}";
    const m = mcq(R, q, v, [a * t, a * t - u, v + a * t / 2, u + a], fmt);
    return { question: [P(`A ${noun} with speed ${trim(u, 2)} m s^{–1} is accelerated uniformly at ${trim(a, 2)} m s^{–2}. What is its speed after ${t} s?`)],
      options: m.options, answer: m.answer, checks: { v },
      steps: [M("*v* = *u* + *at*"), M(`*v* = ${trim(u, 2)} + (${trim(a, 2)})(${t})`), M(`= ${trim(v, 2)} m s^{–1}`)] };
  });

  reg("pm-cons-mc-6", { a: [0.5, 0.001] }, (R, q) => {
    let u, a, t, s, noun = R.orig ? "block" : R.pick(["block", "trolley", "toy car", "crate"]);
    if (R.orig) { u = 2; a = 0.5; t = 2; s = 5; }
    else for (;;) { u = R.int(1, 5); t = R.int(2, 5); a = R.pick([0.25, 0.5, 1, 1.5, 2, 2.5]); s = u * t + 0.5 * a * t * t; if (Math.abs(s - Math.round(s * 2) / 2) < 1e-9) break; }
    const fmt = (x) => trim(x, 2) + " m s^{–2}";
    const m = mcq(R, q, a, [a / 2, a * 2, a * 4, a / 4, s / t / t], fmt);
    return { question: [P(`A ${noun} is projected with an initial velocity of ${u} m s^{–1} down an inclined plane. It is found that the ${noun} travelled a distance of ${trim(s, 2)} m in ${t} s. What is the acceleration of the ${noun} on this inclined plane?`)],
      options: m.options, answer: m.answer, checks: { a },
      steps: [M("*s* = *ut* + [[1||2]]*at*²"), M(`${trim(s, 2)} = (${u})(${t}) + [[1||2]]*a*(${t})²`), M(`*a* = ${trim(a, 2)} m s^{–2}`)] };
  });

  reg("pm-cons-mc-7", { s: [500, 0.5] }, (R, q) => {
    const noun = R.orig ? "car" : R.pick(["car", "train", "motorcycle", "lorry", "bus"]);
    let u, v, a;
    if (R.orig) { u = 20; v = 30; a = 0.5; } else { u = R.pick([10, 15, 20, 25, 30]); v = u + R.pick([5, 10]); a = R.pick([0.5, 1, 1.5, 2, 2.5, 4]); }
    const s = (v * v - u * u) / (2 * a), fmt = (x) => trim(x, 1) + " m";
    const m = mcq(R, q, s, [s / 2, s / 10, s / 20, s * 2, s / 5], fmt);
    return { question: [P(`A ${noun} travelling at ${u} m s^{–1} accelerates at ${trim(a, 2)} m s^{–2} till it is travelling at ${v} m s^{–1}. What is the distance that the ${noun} has travelled during the period of acceleration?`)],
      options: m.options, answer: m.answer, checks: { s },
      steps: [M("*v*² = *u*² + 2*as*"), M(`${v}² = ${u}² + (2)(${trim(a, 2)})*s*`), M(`*s* = ${trim(s, 1)} m`)] };
  });

  reg("pm-cons-mc-8", { X: [20, 0.01] }, (R, q) => {
    const who = R.orig ? ["man", "his", "he", "He"] : R.pick([["man", "his", "he", "He"], ["woman", "her", "she", "She"]]);
    const u1 = R.orig ? 25 : R.pick([10, 15, 20, 25, 30]), r = R.orig ? 2 : R.pick([2, 3]), s1 = R.orig ? 5 : R.pick([2, 4, 5, 6, 8, 10]);
    const u2 = u1 * r, X = s1 * r * r, a = -(u1 * u1) / (2 * s1), fmt = (x) => trim(x, 1) + " m";
    const m = mcq(R, q, X, [s1 / r, s1 * r, s1 * r * r * r, s1 * (r * r - 1)], fmt);
    return { question: [P(`A ${who[0]} drives ${who[1]} car on a road and applies the brake to come to a stop. On another occasion, ${who[2]} drives at a higher speed along the same road and stops ${who[1]} car similarly. ${who[3]} recorded the two driving experiences as shown below.`),
        { t: "table", head: ["Occasion", "Initial speed", "Stopping distance"], rows: [["I", `${u1} m s^{–1}`, `${s1} m`], ["II", `${u2} m s^{–1}`, "*X*"]] },
        P("If all other forces can be neglected, what is the value of *X*?")],
      options: m.options, answer: m.answer, checks: { X },
      steps: [M("*v*² = *u*² + 2*as*"), P("For occasion I,"), M(`0 = ${u1}² + 2*a*(${s1})`), M(`${u1}² = –2*a*(${s1})`), M(`*a* = ${fix(a, 1).replace(/\.0$/, "")} m s^{–2}`.replace("–62.5", "–62.5")),
        P("For occasion II,"), M(`0 = ${u2}² + 2(${trim(a, 2)})*X*`), M(`*X* = ${trim(X, 1)} m`)] };
  });

  // =====================================================================================
  // CONSOLIDATION - STRUCTURED
  // =====================================================================================
  reg("pm-cons-st-2", { disp: [56.9, 0.05], theta: [18.4, 0.05], v: [14.6, 0.05] }, (R, q) => {
    const noun = R.orig ? "car" : R.pick(["car", "truck", "bus", "van"]);
    let d1, v1, t1, d2, v2, t2;
    if (R.orig) { d1 = "north"; v1 = 20; t1 = 45; d2 = "west"; v2 = 15; t2 = 20; }
    else { const pairs = [["north", "west"], ["north", "east"], ["south", "west"], ["south", "east"], ["west", "north"], ["west", "south"], ["east", "north"], ["east", "south"]]; [d1, d2] = R.pick(pairs); v1 = R.pick([10, 12, 15, 18, 20, 25]); v2 = R.pick([8, 10, 12, 15, 18, 20]); t1 = R.pick([30, 40, 45, 50, 60]); t2 = R.pick([15, 20, 25, 30, 40]); }
    const L1 = v1 * t1 * 60, L2 = v2 * t2 * 60, disp = Math.sqrt(L1 * L1 + L2 * L2) / 1000, dispS = sg(disp, 3);
    const isNS = (d) => d === "north" || d === "south";
    const [ns, ew, LNS, LEW, exNS, exEW] = isNS(d1) ? [d1, d2, L1, L2, `${v1} × ${t1} × 60`, `${v2} × ${t2} × 60`] : [d2, d1, L2, L1, `${v2} × ${t2} × 60`, `${v1} × ${t1} × 60`];
    const theta = Math.atan(LEW / LNS) * 180 / Math.PI, th = fix(theta, 1);
    const bearing = `${ns === "north" ? "N" : "S"}${th}°${ew === "east" ? "E" : "W"}`;
    const tot = t1 + t2, vavg = Number(dispS) * 1000 / (tot * 60);
    return { question: [P(`A ${noun} travels with a velocity of ${v1} m s^{–1} for ${t1} minutes due ${d1} and then with a velocity of ${v2} m s^{–1} for ${t2} minutes due ${d2}.`),
        P("(a) Find the total displacement of the " + noun + ". {{(2 marks)}}"), P("(b) Find the average velocity of the " + noun + ". {{(3 marks)}}")],
      checks: { disp, theta, v: vavg },
      steps: [P(`(a) Displacement = √((${v1} × ${t1} × 60)² + (${v2} × ${t2} × 60)²)`), M(`= ${dispS} km {{1}}`),
        M(`tan *θ* = [[${exEW}||${exNS}]]`), M(`*θ* = ${th}° {{1}}`),
        P(`Hence the total displacement is ${dispS} km in the direction of ${bearing}.`),
        P("(b) Average velocity *v* = [[*s*||*t*]] {{1}}"), M(`= [[${Math.round(Number(dispS) * 1000)}||(${t2} + ${t1})(60)]]`), M(`= ${sg(vavg, 3)} m s^{–1} {{1}}`),
        P(`Hence the average velocity is ${sg(vavg, 3)} m s^{–1} in the direction of ${bearing}. {{1}}`)] };
  });

  reg("pm-cons-st-3", { a: [6.78, 0.005], s: [57.0, 0.05], t: [5.56, 0.005], s2: [77.3, 0.05] }, (R, q) => {
    const V = R.orig ? 100 : R.pick([80, 90, 100, 110, 120, 130]), Tm = R.orig ? 4.1 : R.dec(3, 6.5, 0.1), B = R.orig ? 5 : R.pick([4, 5, 6, 7, 8]);
    const v = Number((V / 3.6).toFixed(1)), a = v / Tm, s = v * Tm / 2, tb = v / B, sb = v * v / (2 * B);
    return { question: [P(`A sports car can accelerate from rest to ${V} km h^{–1} in ${trim(Tm, 1)} s.`), imgs(q)[0],
        P("(a) Find the average acceleration. {{(2 marks)}}"), P("(b) Calculate the distance travelled by the car in this period of time. {{(2 marks)}}"),
        P(`(c) The driver applies the brake when the car reaches the speed of ${V} km h^{–1}. If the deceleration of the car is ${B} m s^{–2}, find how long and how far the car will travel before it comes to rest. {{(4 marks)}}`)],
      checks: { a, s, t: tb, s2: sb },
      steps: [P(`(a) ${V} km h^{–1} = ${trim(v, 1)} m s^{–1}`), M("*a* = [[*v* – *u*||*t*]] {{1}}"), M(`= [[${trim(v, 1)} – 0||${trim(Tm, 1)}]]`), M(`= ${sg(a, 3)} m s^{–2} {{1}}`),
        P("(b) *s* = [[(*u* + *v*)*t*||2]] {{1}}"), M(`= [[(0 + ${trim(v, 1)})(${trim(Tm, 1)})||2]]`), M(`= ${sg(s, 3)} m {{1}}`),
        P("(c) *a* = [[*v* – *u*||*t*]] {{1}}"), M(`–${B} = [[0 – ${trim(v, 1)}||*t*]]`), M(`*t* = ${sg(tb, 3)} s {{1}}`), M("*v*² – *u*² = 2*as* {{1}}"),
        M(`0² – ${trim(v, 1)}² = (2)(–${B})*s*`), M(`*s* = ${sg(sb, 3)} m {{1}}`)] };
  });

  reg("pm-cons-st-4", { v: [23.7, 0.05], vk: [85.2, 0.05], smin: [278, 0.5], t: [16.7, 0.05] }, (R, q) => {
    let V, a, L;
    if (R.orig) { V = 120; a = 2; L = 140; }
    else for (;;) { V = R.pick([90, 100, 108, 120, 126, 144]); a = R.pick([1.5, 2, 2.5, 3, 4]); const need = Math.pow(V / 3.6, 2) / (2 * a); L = Math.round(need * R.pick([0.4, 0.5, 0.6, 0.7, 0.8]) / 10) * 10; if (L >= 50 && L < need * 0.9) break; }
    const vr = Math.sqrt(2 * a * L), vk = vr * 3.6, vm = V / 3.6, smin = vm * vm / (2 * a), t = vm / a;
    const name = R.orig ? "Ian" : R.pick(NAMES), kind = R.orig ? "small planes" : "small planes";
    return { question: [P(`${name} has designed an airport for ${kind}. One kind of airplane that may use this airport must reach a speed of ${V} km h^{–1} before takeoff. The acceleration of this plane is ${trim(a, 2)} m s^{–2}.`), imgs(q)[0],
        P(`(a) If the runway is ${L} m long, can this airplane reach the proper speed to take off? Explain your answer. {{(3 marks)}}`),
        P("(b) If not, what is the minimum length of the runway required? {{(2 marks)}}"), P("(c) Find the time required for the takeoff. {{(2 marks)}}")],
      checks: { v: vr, vk, smin, t },
      steps: [P("(a) *v*² – *u*² = 2*as* {{1}}"), M(`*v*² – 0² = (2)(${trim(a, 2)})(${L})`), M(`*v* = ${sg(vr, 3)} m s^{–1} or ${sg(vk, 3)} km h^{–1} {{1}}`),
        P("Hence this airplane cannot reach the proper speed to take off. {{1}}"),
        P("(b) *v*_{min}² – *u*² = 2*as*_{min} {{1}}"), M(`( [[${V}||3.6]] )² – 0² = (2)(${trim(a, 2)})*s*_{min}`), M(`*s*_{min} = ${sg(smin, 3)} m {{1}}`),
        P(`The minimum length of the runway should be ${sg(smin, 3)} m.`),
        P("(c) *a* = [[*v* – *u*||*t*]] {{1}}"), M(`${trim(a, 2)} = [[ [[${V}||3.6]] – 0||*t*]]`), M(`*t* = ${sg(t, 3)} s {{1}}`)] };
  });

  reg("pm-cons-st-6", { s: [108, 0.5] }, (R, q) => {
    const Tt = R.orig ? 5 : R.int(3, 9), vs = R.orig ? 340 : R.pick([330, 340, 343]), noun = R.orig ? "rock" : R.pick(["rock", "stone", "pebble"]);
    const c = 1 / vs, b = 1 / Math.sqrt(G / 2), x = (-b + Math.sqrt(b * b + 4 * c * Tt)) / (2 * c), s = x * x;
    return { question: [P(`A ${noun} is dropped from a cliff and the sound of it hitting the ground is heard ${Tt} s later. If the speed of sound is ${vs} m s^{–1}, find the height of the cliff. {{(5 marks)}}`)],
      checks: { s },
      steps: [P("Let *t*₁ be the time for the stone to reach the ground, and *t*₂ be the time for the sound to travel from the ground back to the top of the cliff."), P("Take the downward direction as positive."),
        M("*s* = *ut* + [[1||2]]*at*² {{1}}"), M("= 0 + [[1||2]](9.81)*t*₁²"), M("*t*₁ = √( [[*s*||4.905]] ) {{1}}"),
        P(`Assume the sound travels at constant speed, *t*₂ = [[*s*||${vs}]] {{1}}`), M(`*t*₁ + *t*₂ = ${Tt} {{1}}`), M(`√( [[*s*||4.905]] ) + [[*s*||${vs}]] = ${Tt}`), M(`*s* = ${sg(s, 3)} m`),
        P(`Hence the height of the cliff is ${sg(s, 3)} m. {{1}}`)] };
  });

  reg("pm-cons-st-7", { t: [4.37, 0.005], v: [32.9, 0.05], up: [5.10, 0.005], tot: [60.2, 0.05] }, (R, q) => {
    const u = R.orig ? 10 : R.pick([4, 5, 6, 8, 10, 12, 15]), H = R.orig ? 50 : R.pick([20, 30, 40, 45, 50, 60, 80]), ob = R.orig ? "stone" : R.pick(["stone", "ball"]);
    const k = G / 2, disc = Math.sqrt(u * u + 4 * k * H), t = (u + disc) / (2 * k), tneg = (u - disc) / (2 * k), v = Math.sqrt(u * u + 2 * G * H), up = u * u / (2 * G), tot = 2 * up + H;
    return { question: [P(`A ${ob} is thrown vertically upwards with an initial speed of ${u} m s^{–1} from the edge of a cliff which is ${H} m high.`),
        P(`(a) Find the time taken for the ${ob} to reach the bottom of the cliff. {{(2 marks)}}`), P(`(b) What is the speed of the ${ob} before hitting the ground? {{(2 marks)}}`), P(`(c) Find the total distance travelled by the ${ob}. {{(3 marks)}}`)],
      checks: { t, v, up, tot },
      steps: [P("(a) Take the upward direction as positive."), M("*s* = *ut* + [[1||2]]*at*² {{1}}"), M(`–${H} = (${u})*t* + [[1||2]](–9.81)*t*²`), M(`*t* = ${fix(t, 2)} s or ${fix(tneg, 2)} s (rejected) {{1}}`),
        P("(b) *v*² – *u*² = 2*as* {{1}}"), M(`*v*² – ${u * u} = 2(–9.81)(–${H})`), M(`*v* = ${sg(v, 3)} m s^{–1} (downwards) {{1}}`),
        P(`(c) Let *s* be the distance travelled in the upward journey.`), M("*v*² – *u*² = 2*as* {{1}}"), M(`0² – ${u}² = 2(–9.81)*s*`), M(`*s* = ${sg(up, 3)} m {{1}}`),
        P(`Hence the total distance travelled by the ${ob} = 2 × ${sg(up, 3)} + ${H}`), M(`= ${sg(tot, 3)} m {{1}}`)] };
  });

  // =====================================================================================
  // EXAM PRACTICE - MULTIPLE CHOICE
  // =====================================================================================
  reg("pm-exam-mc-4", { v2: [14, 0.01] }, (R, q) => {
    const a0 = R.orig ? 3 : R.pick([2, 3, 4, 5]), k = R.orig ? 0.25 : R.pick([0.25, 0.5, 1]), t1 = R.orig ? 2 : R.pick([2, 3]), t2 = R.orig ? 4 : R.pick([4, 5, 6]);
    const v1 = a0 * t1 + k * t1 * t1 / 2, v2 = a0 * t2 + k * t2 * t2 / 2, fmt = (x) => trim(x, 2) + " m s^{–1}", a1 = a0 + k * t1;
    const m = mcq(R, q, v2, [v1 * t2 / t1, a0 * t2, a1 * t2, v2 + a0, v2 - k * t2], fmt);
    return { question: [P(`A car accelerates from rest with an initial acceleration of ${a0} m s^{–2}. The rate of change in acceleration is a constant. After ${t1 === 2 ? "two" : "three"} seconds, its velocity is ${trim(v1, 2)} m s^{–1}. What is the velocity of the car at *t* = ${t2} s?`)],
      options: m.options, answer: m.answer, checks: { v2 },
      steps: [H("Problem solving by drawing"), P(`Since the rate of change in acceleration is a constant, the *a–t* graph of the car is a straight line with an initial value of ${a0} m s^{–2}.`),
        P(`Let *a*₂ be its acceleration at *t* = ${t1} s. As the area under the *a–t* graph is the change in velocity,`), M(`[[${t1}(${a0} + *a*₂)||2]] = ${trim(v1, 2)} – 0`), M(`*a*₂ = ${trim(a1, 2)} m s^{–2}`),
        P(`The slope of the graph = [[${trim(a1, 2)} – ${a0}||${t1} – 0]] = ${trim(k, 3)} m s^{–3}`), P(`Hence, its velocity at *t* = ${t2} s`), M(`= [[${t2}[${a0} + ${a0} + (${trim(k, 3)})(${t2})]||2]] = ${trim(v2, 2)} m s^{–1}`)] };
  });

  function filming(R, n1, n2, s1, s2, N) { // shared maths for MC 8 and 9
    const a = (s2 - s1) / (n2 - n1), u = s1 - a * (n1 - 0.5), dist = u * N + 0.5 * a * N * N, sN = u + a * (N - 0.5);
    return { a, u, dist, sN };
  }
  function filmParams(R) {
    if (R.orig) return { n1: 4, n2: 6, N: 8, u: 7, a: 6 };
    for (;;) { const n1 = R.pick([2, 3, 4, 5]), n2 = n1 + R.pick([2, 2, 3]), u = R.pick([2, 3, 4, 5, 6, 7, 8, 10]), a = R.pick([2, 3, 4, 5, 6, 8]), N = R.pick([6, 8, 10, 12]); if (N > n2) return { n1, n2, N, u, a }; }
  }
  const filmCtx = (n1, n2, s1, s2) => ({ label: "Questions 8 – 9", blocks: [P(`A car travelling with uniform acceleration is filmed by a photographer. The car travels ${s1} m during the ${ord(n1)} second of the filming and ${s2} m during the ${ord(n2)} second.`)] });
  reg("pm-exam-mc-8", { a: [6, 0.001] }, (R, q) => {
    const { n1, n2, N, u, a } = filmParams(R), s1 = u + a * (n1 - 0.5), s2 = u + a * (n2 - 0.5), fmt = (x) => trim(x, 2) + " m s^{–2}", d = n2 - n1;
    const m = mcq(R, q, a, [a / 3, a * 2 / 3, a * 2, s2 - s1, a / 2, a * 4 / 3], fmt);
    return { context: filmCtx(n1, n2, s1, s2), question: [P("What is the acceleration of the car?")], options: m.options, answer: m.answer, checks: { a },
      steps: [M(`*a* = [[Δ*v*||Δ*t*]] = [[ [[${s2}||1]] – [[${s1}||1]] ||${n2 - 0.5} – ${n1 - 0.5}]] = ${trim(a, 2)} m s^{–2}`)] };
  });
  reg("pm-exam-mc-9", { dist: [248, 0.5] }, (R, q) => {
    const { n1, n2, N, u, a } = filmParams(R), s1 = u + a * (n1 - 0.5), s2 = u + a * (n2 - 0.5), f = filming(R, n1, n2, s1, s2, N), fmt = (x) => trim(x, 1) + " m";
    const m = mcq(R, q, f.dist, [f.sN, 2 * f.sN, 3 * f.sN, u * N, 0.5 * a * N * N, f.dist / 2], fmt);
    return { context: filmCtx(n1, n2, s1, s2), question: [P(`What distance does the car cover during the first ${N} seconds of filming?`)], options: m.options, answer: m.answer, checks: { dist: f.dist },
      steps: [P(`During the ${ord(n1)} second,`), M(`${s1} = [*u*(${n1}) + [[1||2]](${trim(a, 2)})(${n1}²)] – [*u*(${n1 - 1}) + [[1||2]](${trim(a, 2)})(${n1 - 1}²)]`), M(`*u* = ${trim(u, 2)} m s^{–1}`),
        P(`The distance travelled by the car in the first ${N} s`), M(`= (${trim(u, 2)})(${N}) + [[1||2]](${trim(a, 2)})(${N}²)`), M(`= ${trim(f.dist, 1)} m`)] };
  });

  reg("pm-exam-mc-10", { a: [-4e5, 1] }, (R, q) => {
    const v = R.orig ? 200 : R.pick([100, 150, 200, 250, 300, 400]), dcm = R.orig ? 5 : R.pick([2, 2.5, 4, 5, 8, 10]), thing = R.orig ? "tree" : R.pick(["tree", "wooden block", "sandbag"]);
    const a = -(v * v) / (2 * dcm / 100), fmt = (x) => Math.abs(x) >= 1e5 ? sci(x, 3) + " m s^{–2}" : trim(x, 0) + " m s^{–2}";
    const m = mcq(R, q, a, [a / 100, a / 200, a / 2, a * 2, a / 10], fmt, { allowNeg: true, byAbs: true });
    return { question: [P(`A bullet is fired towards a ${thing === "tree" ? "tree" : "" + thing} with a speed of ${v} m s^{–1}. The bullet is later found at a depth of ${trim(dcm, 1)} cm. Find the average deceleration of the bullet inside the ${thing}.`)],
      options: m.options, answer: m.answer, checks: { a },
      steps: [M("*v*² = *u*² + 2*as*"), M(`0 = ${v}² + 2(*a*)( [[${trim(dcm, 1)}||100]] )`), M(`*a* = ${fmt(a)}`)] };
  });

  reg("pm-exam-mc-11", { X: [40, 0.01] }, (R, q) => {
    const u1 = R.orig ? 30 : R.pick([20, 30, 40, 50]), r = R.orig ? 2 : R.pick([2, 3]), d1 = R.orig ? 10 : R.pick([5, 8, 10, 12, 15, 20]), u2 = u1 * r, X = d1 * r * r, fmt = (x) => trim(x, 1) + " m";
    const m = mcq(R, q, X, [d1, d1 * r, d1 * (r * r - 1), d1 * r * r * r], fmt);
    return { question: [P(`The shortest stopping distance of a car when it is travelling at ${u1} km h^{–1} is ${d1} m. What is the shortest stopping distance of the same car when it is travelling at ${u2} km h^{–1}?`)],
      options: m.options, answer: m.answer, checks: { X },
      steps: [P("The shortest stopping distance implies that the braking force is the highest and the same in both cases. This also applies to decelerations of the cars."),
        M("As *a* = [[*v*₂² – *u*₂²||2*s*]] = [[*v*₁² – *u*₁²||2*s*]]"), M(`[[( [[${u2 * 1000}||60 × 60]] )² – 0||2*s*]] = [[( [[${u1 * 1000}||60 × 60]] )² – 0||2 × ${d1}]]`), M(`*s* = ${trim(X, 1)} m`)] };
  });

  reg("pm-exam-mc-13", { a: [0.3, 0.001] }, (R, q) => {
    const mass = R.orig ? 0.4 : R.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]), th = R.orig ? 25 : R.pick([15, 20, 25, 30, 35, 40]), t = R.orig ? 2 : R.pick([2, 3, 4]), s = R.orig ? 0.6 : R.dec(0.4, 3.2, 0.2);
    const a = 2 * s / (t * t), gs = G * Math.sin(th * Math.PI / 180), fmt = (x) => fix(x, 2) + " m s^{–2}", noun = R.orig ? "block" : R.pick(["block", "box", "trolley"]);
    const m = mcq(R, q, a, [gs, mass * gs, G * Math.cos(th * Math.PI / 180) * 0.2, gs / 2], fmt, { last: "Cannot be determined as the friction between the " + noun + " and the plane is unknown" });
    const ta = { 2: "two", 3: "three", 4: "four" }[t];
    return { question: [P(`A ${noun} of mass ${mass} kg is released from rest on a plane inclined at ${th}°. The ${noun} accelerates uniformly and travels a distance of ${fix(s, 1)} m in the first ${ta} seconds. Find the acceleration of the ${noun}.`)],
      options: m.options, answer: m.answer, checks: { a },
      steps: [M("*s* = *ut* + [[1||2]]*at*²"), M(`${fix(s, 1)} = (0)(${t}) + [[1||2]]*a*(${t})²`), M(`*a* = ${fix(a, 2)} m s^{–2}`)] };
  });

  reg("pm-exam-mc-14", { h: [0.9, 0.005] }, (R, q) => {
    let u, th, t, a, s;
    if (R.orig) { u = 2; th = 30; t = 3; s = 1; a = 2 * (u * t - s) / (t * t); }
    else for (;;) { u = R.pick([2, 3, 4]); th = R.pick([20, 25, 30, 35, 40]); t = R.pick([2, 3, 4]); a = R.pick([0.5, 1, 2, 2.5, 4]); s = u * t - 0.5 * a * t * t; if (s > 0.2 && Math.abs(s * 100 - Math.round(s * 100)) < 1e-6) break; }
    const S = u * u / (2 * a), h = S * Math.sin(th * Math.PI / 180), fmt = (x) => fix(x, 1) + " m", noun = R.orig ? "block" : R.pick(["block", "box", "toy car"]);
    const m = mcq(R, q, h, [S, S * Math.cos(th * Math.PI / 180), S * Math.tan(th * Math.PI / 180), S / 2], fmt, { last: "Cannot be determined as the friction between the " + noun + " and the plane is unknown" });
    const w = { 2: "two", 3: "three", 4: "four" }[t];
    return { question: [P(`A ${noun} is projected up an inclined plane at an initial speed of ${u} m s^{–1}. The angle of inclination is ${th}°. The ${noun} travels a distance of ${trim(s, 2)} m in the first ${w} seconds. Find the maximum vertical height it can reach.`)],
      options: m.options, answer: m.answer, checks: { h },
      steps: [P("Take the upward direction as positive."), M("*s* = *ut* + [[1||2]]*at*²"), M(`${trim(s, 2)} = (${u})(${t}) – [[1||2]]*a*(${t})²`), M(`*a* = ${sg(a, 3)} m s^{–2}`),
        P("By *v*² – *u*² = 2*as*, the total distance the " + noun + " can travel up is:"), M(`*s* = [[(${u})² – (0)²||2*a*]]`), M(`= ${fix(S, 1)} m`), P("The maximum height the " + noun + " can reach is:"), M(`${fix(S, 1)} sin ${th}° = ${fix(h, 1)} m`)] };
  });

  reg("pm-exam-mc-15", { u: [46, 0.01] }, (R, q) => {
    let L, tX, tY, d, uX, aX;
    if (R.orig) { L = 200; tX = 4; tY = 5; d = 16; uX = 46; aX = 2; }
    else for (;;) { tX = R.pick([3, 4, 5]); tY = tX + R.pick([1, 2]); uX = R.int(20, 60); aX = R.pick([1, 1.5, 2, 2.5, 3, 4]); L = uX * tX + 0.5 * aX * tX * tX; d = uX + aX * tY - L / tY;
      if (Math.abs(L - Math.round(L)) < 1e-9 && L % 10 === 0 && Math.abs(d - Math.round(d)) < 1e-9 && d >= 5 && d <= 25) break; }
    const w = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" }, fmt = (x) => trim(x, 0) + " m s^{–1}", noun = R.orig ? "tunnel" : R.pick(["tunnel", "tunnel"]);
    const m = mcq(R, q, uX, [uX - 7, uX - 2, uX + 6, uX + 3, uX - 4], fmt);
    return { question: [P(`Two cars *X* and *Y* race on a straight road. They both undergo uniformly accelerated motion when they pass through a ${L} m long ${noun}. *X* takes ${tX} seconds to go through the ${noun}. *Y* enters the ${noun} with a speed which is ${d} m s^{–1} slower than that of *X*, but it accelerates at a double rate compared to *X*. *Y* takes ${tY} seconds to go through the ${noun}. What is the speed of *X* when it enters the ${noun}?`)],
      options: m.options, answer: m.answer, checks: { u: uX },
      steps: [P("Let *u* and *a* be the velocity and acceleration of *X* when it enters the tunnel,"), M("*s* = *ut* + [[1||2]]*at*²"), M(`${L} = ${tX}*u* + [[1||2]](${tX})²*a*   ......(1)`),
        P("For *Y*,"), M(`${L} = ${tY}(*u* – ${d}) + [[1||2]](${tY})²(2*a*)   ......(2)`), P(`Solving (1) and (2), *u* = ${trim(uX, 0)} m s^{–1}`)] };
  });

  reg("pm-exam-mc-16", { u: [6.07, 0.005] }, (R, q) => {
    let nP, nQ, sp;
    if (R.orig) { nP = 10; nQ = 15; sp = 3; } else { nP = R.int(6, 12); nQ = nP + R.pick([3, 4, 5, 6]); sp = R.pick([3, 3, 3.5]); }
    const hP = sp * nP, hQ = sp * nQ, dh = hQ - hP, T0 = Math.sqrt(2 * hP / G), u = dh / T0, fmt = (x) => fix(x, 2) + " m s^{–1}";
    const m = mcq(R, q, u, [dh / Math.sqrt(2 * hQ / G), dh / Math.sqrt(2 * dh / G), hP / T0, u * 1.24, u * 0.89, Math.sqrt(2 * G * dh) / 3], fmt);
    return { question: [P(`Two balls *P* and *Q* are dropped at different levels of a building simultaneously. *P* is dropped at rest on the ${ord(nP)} floor which is ${trim(hP, 1)} m above the ground. *Q* is dropped vertically downwards at speed *u* on the ${ord(nQ)} floor which is ${trim(hQ, 1)} m above the ground. Find the minimum value of *u* such that *Q* catches up *P* before they hit the ground.`)],
      options: m.options, answer: m.answer, checks: { u },
      steps: [P(`Take the downward direction as positive. At time *t*, the distance *Q* has dropped is *ut* + [[1||2]]*gt*², while the distance *P* has dropped is [[1||2]]*gt*². Hence, their separation decreases by *ut*. Their original separation is ${trim(hQ, 1)} – ${trim(hP, 1)} = ${trim(dh, 1)} m. The time *T* *P* takes to reach the ground is:`),
        M(`*T* = √( [[(2)(${trim(hP, 1)})||*g*]] )`), P("Therefore, the minimum value of *u* is:"), M(`*u* = [[${trim(dh, 1)}||*T*]]`), M(`= ${fix(u, 2)} m s^{–1}`)] };
  });

  reg("pm-exam-mc-18", { t: [43, 0.5] }, (R, q) => {
    let Dk, a, V;
    if (R.orig) { Dk = 0.6; a = 5; V = 54; } else for (;;) { Dk = R.pick([0.4, 0.5, 0.6, 0.8, 1]); a = R.pick([2, 2.5, 4, 5]); V = R.pick([36, 54, 72]); const v = V / 3.6; if (v * v / a < Dk * 1000 * 0.8) break; }
    const v = V / 3.6, ta = v / a, sa = 0.5 * a * ta * ta, cruise = (Dk * 1000 - 2 * sa) / v, t = cruise + 2 * ta, fmt = (x) => sg(x, 3) + " s", Dm = Dk * 1000;
    const m = mcq(R, q, t, [2 * Math.sqrt(Dm / a), Dm / v, Dm / (v / 2), 2 * Dm / v, t * 1.9, t / 2], fmt);
    const noun = R.orig ? "bus" : R.pick(["bus", "train", "tram"]);
    return { question: [P(`A ${noun} travels from station *P* to station *Q* along a straight line. The two stations are ${trim(Dk, 1)} km apart. The maximum magnitude of acceleration and deceleration are both ${trim(a, 2)} m s^{–2}. The upper limit of speed is ${V} km h^{–1}. Find the minimum time required to travel from *P* to *Q*.`)],
      options: m.options, answer: m.answer, checks: { t },
      steps: [P(`The maximum speed of the ${noun}`), M(`= [[(${V})(1000)||(3600)]]`), M(`= ${trim(v, 2)} m s^{–1}`), P("The minimum time required to accelerate from rest to the maximum speed"), M(`= [[${trim(v, 2)}||${trim(a, 2)}]]`), M(`= ${trim(ta, 2)} s`),
        P("The distance traveled in this interval"), M(`= (0)(${trim(ta, 2)}) + [[1||2]](${trim(a, 2)})(${trim(ta, 2)})²`), M(`= ${trim(sa, 2)} m`), P("The minimum time required to decelerate from the maximum speed to rest"), M(`= [[${trim(v, 2)}||${trim(a, 2)}]]`), M(`= ${trim(ta, 2)} s`),
        P("The distance traveled in this interval"), M(`= (${trim(v, 2)})(${trim(ta, 2)}) – [[1||2]](${trim(a, 2)})(${trim(ta, 2)})²`), M(`= ${trim(sa, 2)} m`), P(`The time the ${noun} travels at the maximum speed`), M(`= [[${Dm} – ${trim(sa, 2)} – ${trim(sa, 2)}||${trim(v, 2)}]]`), M(`= ${sg(cruise, 2)} s`),
        P("The minimum time required"), M(`= ${sg(cruise, 2)} + ${trim(ta, 2)} + ${trim(ta, 2)}`), M(`= ${trim(Number(sg(cruise, 2)) + 2 * ta, 1)} s`)] };
  });

  reg("pm-exam-mc-21", { a: [25000, 500] }, (R, q) => {
    const d = R.orig ? 16.3 : R.dec(10, 30, 0.1), H = 415, u2 = 2 * G * H, a = u2 / (2 * d / 100), shown = Number((a / 1e4).toFixed(1)), va = shown * 1e4;
    const fmt = (x) => fix(x / 1e4, 1) + " × 10^{4} m s^{–2}";
    const m = mcq(R, q, va, [va - 5000, va + 5000, va - 10000, va + 10000, va * 1.2, va * 0.8], fmt);
    return { question: [P(`The International Finance Centre in Hong Kong is 415 m tall. During its construction, a small debris falls from the roof and penetrates ${trim(d, 1)} cm into the soft ground below it. What is the average deceleration of it on stopping?`), imgs(q)[0]],
      options: m.options, answer: m.answer, checks: { a },
      steps: [P("Let *u* be the speed of the debris just before it hits the ground."), M(`*u*² = 2*gs* = 2 × 9.81 × 415 = ${trim(u2, 1)} m² s^{–2}`), P("Let *a* be the average acceleration of the debris on stopping."), M("*a* = [[*u*²||2*d*]]"),
        M(`= [[${trim(u2, 1)}||2 × ${trim(d / 100, 3)}]]`), M(`= ${fix(a / 1e4, 1)} × 10^{4} m s^{–2}`)] };
  });

  reg("pm-exam-mc-23", { k: [3, 0.001] }, (R, q) => {
    const n = R.orig ? 2 : R.pick([2, 3, 4, 5]), thing = R.orig ? "ball" : R.pick(["ball", "stone", "marble", "apple"]), k = 2 * n - 1, fmt = (x) => trim(x, 0) + "*x*";
    const m = mcq(R, q, k, [n, n * n, 2 * n, n + 1, k + 2, k - 2], fmt);
    const lines = n === 2 ? [P("Distance travelled in the 1st second, *x* = [[1||2]]*g*"), P("Distance travelled in the 2nd second"), P("= Distance travelled in two seconds – Distance travelled in the 1st second"), M("= [[1||2]]*g*(2)² – [[1||2]]*g*")]
      : [P("Distance travelled in the 1st second, *x* = [[1||2]]*g*"), P(`Distance travelled in the ${ord(n)} second`), P(`= Distance travelled in ${n} seconds – Distance travelled in ${n - 1} seconds`), M(`= [[1||2]]*g*(${n})² – [[1||2]]*g*(${n - 1})²`)];
    return { question: [P(`${thing === "apple" ? "An" : "A"} ${thing} is released from rest and falls vertically under gravity. If the distance travelled by it in the 1st second is *x*, what is the distance travelled in the ${ord(n)} second?`)],
      options: m.options, answer: m.answer, checks: { k }, steps: lines.concat([M(`= [[${k}||2]]*g*`), M(`= ${k}*x*`)]) };
  });

  reg("pm-exam-mc-24", { t: [0.55, 0.005] }, (R, q) => {
    let s, Tt;
    if (R.orig) { s = 100; Tt = 4; } else for (;;) { s = R.pick([50, 60, 70, 80, 90, 100, 120, 150, 200]); Tt = R.pick([2, 3, 4, 5]); if ((2 * s / G - Tt * Tt) / (2 * Tt) > 0.2) break; }
    const t = (2 * s / G - Tt * Tt) / (2 * Tt), fmt = (x) => fix(x, 2) + " s", ob = R.orig ? "ball" : R.pick(["ball", "marble", "pebble"]);
    const m = mcq(R, q, Number(fix(t, 2)), [Tt, Tt / 2, Tt / 4, 2 * Tt, t * 2, t * 4, Math.sqrt(2 * s / G)], fmt);
    return { question: [P(`A small ${ob} released from rest at *O* falls freely under gravity and passes *X* and *Y* as shown in Fig. 9.33.`), imgs(q)[0], P(`If the small ${ob} takes ${Tt} s to move from *X* to *Y*, where *XY* = ${s} m, how long does it take to fall from *O* to *X*?`)],
      options: m.options, answer: m.answer, checks: { t },
      steps: [M(`*OX* = –[[1||2]]*gt*² and *OY* = –[[1||2]]*g*(*t* + ${Tt})²`), M("*XY* = *OY* – *OX*"), M(`${s} = [[1||2]](9.81)(${2 * Tt}*t* + ${Tt * Tt})`), M(`*t* = ${fix(t, 2)} s`)] };
  });

  reg("pm-exam-mc-29", { g: [9.8, 0.05] }, (R, q) => {
    let f, N, s, gt;
    if (R.orig) { f = 100; N = 50; s = 1.18; gt = 9.8; }
    else for (let i = 0; i < 400; i++) { f = R.pick([50, 100, 200]); N = R.pick([20, 30, 40, 50, 60, 70].filter((n) => n <= 0.6 * f + 1)); gt = R.pick([9.6, 9.8, 10, 10.2]); const dt = (N - 1) / f; s = Math.round(0.5 * gt * dt * dt * 100) / 100; if (Math.abs(2 * s / (dt * dt) - gt) < 0.04 && s > 0.3) break; }
    const ORDW = { 20: "twentieth", 30: "thirtieth", 40: "fortieth", 50: "fiftieth", 60: "sixtieth", 70: "seventieth" };
    const dt = (N - 1) / f, g = 2 * s / (dt * dt), fixedOpts = ["9.6 m s^{–2}", "9.8 m s^{–2}", "10 m s^{–2}", "10.2 m s^{–2}"], vals = [9.6, 9.8, 10, 10.2];
    const idx = R.orig ? 1 : vals.indexOf(gt), dts = fix(dt, 2);
    return { question: [P("A photographic film attached to a heavy bar is dropped from rest and falls down as shown in the diagram."), imgs(q)[0],
        P(`The light, flashing at a rate of ${f} flashes per second, illuminates the film so that fine timing marks appear after development. The first flash occurs at the moment the bar is released. The separation of the first and the ${ORDW[N]} timing marks is ${fix(s, 2)} m. What is the value of acceleration due to gravity found in the experiment?`)],
      options: fixedOpts, answer: LET[idx], checks: { g },
      steps: [P(`The time interval = [[${N} – 1||${f}]] × 1`), M(`= ${dts} s`), M("*s* = [[1||2]]*at*²"), M(`${fix(s, 2)} = [[1||2]]*a*(${dts})²`), M(`*a* = ${sg(g, 2)} m s^{–2}`)] };
  });

  // =====================================================================================
  // EXAM PRACTICE - STRUCTURED
  // =====================================================================================
  reg("pm-exam-st-1", { t: [15, 0.01], v: [30, 0.01], gap: [44, 0.01] }, (R, q) => {
    let vj, a, t;
    if (R.orig) { vj = 10; a = 2; t = 15; }
    else {
      const nice = [];
      for (let v = 4; v <= 20; v++) for (let a2 = 2; a2 <= 12; a2++) { const A = a2 / 2, k2 = v * v + 150 * A, k = Math.round(Math.sqrt(k2)); if (k * k === k2) { const tt = (v + k) / A; if (tt >= 5 && tt <= 30 && Math.abs(tt * 100 - Math.round(tt * 100)) < 1e-6) nice.push([v, A, tt]); } }
      if (nice.length && R.next() < 0.5) [vj, a, t] = R.pick(nice);
      else for (;;) { vj = R.int(4, 20); a = R.pick([1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6]); const tt = (vj + Math.sqrt(vj * vj + 150 * a)) / a; if (tt >= 5 && tt <= 25) { t = Math.round(tt * 100) / 100; break; } }
    }
    const c = a / 2, v = a * t, jeep = vj * 2, car = v * 2 + 0.5 * a * 4, gap = car - jeep;
    return { question: [P(`A jeep is moving with a constant velocity of ${vj} m s^{–1}. A sports car, which is initially 75 m behind the jeep, starts its motion from rest with a constant acceleration of ${trim(a, 2)} m s^{–2}.`), imgs(q)[0],
        P("(a) When will the sports car overtake the jeep? {{(4 marks)}}"), P("(b) How fast is the sports car travelling when it overtakes the jeep? {{(2 marks)}}"), P("(c) How far is the sports car from the jeep 2 seconds after the overtaking? {{(3 marks)}}")],
      checks: { t, v, gap },
      steps: [P("(a) Let *s*_{J} be the displacement of the jeep and *s*_{C} be the displacement of the sports car. {{1}}"), M(`*s*_{J} = ${vj}*t*`),
        M(`*s*_{C} = *ut* + [[1||2]]*at*² = 0 + [[1||2]](${trim(a, 2)})*t*² = ${c === 1 ? "" : trim(c, 2)}*t*² {{1}}`), P("For the sports car to overtake the jeep, we have *s*_{C} = *s*_{J} + 75 {{1}}"),
        M(`${c === 1 ? "" : trim(c, 2)}*t*² – ${vj}*t* = 75`), M(`*t* = ${t} s {{1}}`),
        P("(b) *v* = *u* + *at* {{1}}"), M(`= 0 + (${trim(a, 2)})(${t}) = ${trim(v, 2)} m s^{–1} {{1}}`),
        P("(c) After two further seconds,"), P(`the jeep further moves ${vj} × 2 = ${jeep} m {{1}}`), P(`the sports car further moves *ut* + [[1||2]]*at*² = (${trim(v, 2)})(2) + [[1||2]](${trim(a, 2)})(2)² = ${trim(car, 2)} m {{1}}`),
        P(`∴ Two seconds after overtaking, the sports car is ${trim(car, 2)} – ${jeep} = ${trim(gap, 2)} m in front of the jeep. {{1}}`)] };
  });

  reg("pm-exam-st-7", { u: [9.9, 0.005], t: [2.02, 0.005], v: [9.91, 0.005] }, (R, q) => {
    const h = R.orig ? 5 : R.pick([3, 4, 5, 6, 8, 10, 12, 15, 20]), name = R.orig ? "Teresa" : R.pick(NAMES), ob = R.orig ? "ball" : R.pick(["ball", "stone", "coin"]);
    const u = Math.sqrt(2 * G * h), us = fix(u, 2), t = 2 * u / G, ts = fix(t, 2), v = G * Number(ts) / 2;
    return { question: [P(`${name} throws a ${ob} vertically upwards from the ground. The ${ob} reaches the maximum height of ${h} m.`), P(`(a) Find the acceleration of the ${ob} when`), P("(i) it is on the way up, {{(1 mark)}}"),
        P("(ii) it reaches the maximum height, and {{(1 mark)}}"), P("(iii) it is on the way down. {{(1 mark)}}"), P(`(b) Calculate the initial upwards velocity of the ${ob}. {{(2 marks)}}`), P("(c) Calculate"),
        P("(i) the total time elapsed, and {{(2 marks)}}"), P(`(ii) the velocity of the ${ob} {{(2 marks)}}`), P("when it returns to the starting point.")],
      checks: { u, t, v },
      steps: [P("(a) (i) 9.81 m s^{–2} downwards {{1}}"), P("(ii) 9.81 m s^{–2} downwards {{1}}"), P("(iii) 9.81 m s^{–2} downwards {{1}}"), P("(b) Take the upward direction as positive."), M("*v*² – *u*² = 2*as* {{1}}"),
        M(`0² – *u*² = 2(–9.81)(${h})`), M(`*u* = ${(+us).toFixed(2)} m s^{–1} {{1}}`.replace(/(\d)\.(\d)0 /, "$1.$20 ")), P("(c) (i) *s* = *ut* + [[1||2]]*at*² {{1}}"), M(`0 = (${us})*t* + [[1||2]](–9.81)*t*²`), M(`*t* = ${ts} s or *t* = 0 (rejected) {{1}}`),
        P("(ii) *v* = *u* + *at* {{1}}"), M(`= 0 + (–9.81)( [[${ts}||2]] )`), M(`= –${fix(v, 2)} m s^{–1}`), P(`The velocity of the ${ob} is ${fix(v, 2)} m s^{–1} downwards. {{1}}`)] };
  });

  reg("pm-exam-st-8", { h: [53.4, 0.05] }, (R, q) => {
    const t = R.orig ? 3.3 : R.pick([2.5, 2.8, 3, 3.2, 3.3, 3.5, 3.8, 4]), hh = R.orig ? 20 : R.pick([10, 15, 20, 25, 30]), pair = R.orig ? ["shuttlecock", "tennis ball"] : R.pick([["shuttlecock", "tennis ball"], ["feather", "coin"], ["ping-pong ball", "steel ball"]]);
    const H = 0.5 * G * t * t, out = [];
    q.question.forEach((b) => {
      if (b.t === "p" && b.x.startsWith("(c)")) out.push(P(`(c) If the 10 kg ball reached the ground in ${trim(t, 1)} s, calculate the height of the tower. {{(2 marks)}}`));
      else if (b.t === "p" && b.x.startsWith("(e)")) out.push(P(`(e) A student performed a similar experiment. He dropped a ${pair[0]} and a ${pair[1]} ${hh} m above the ground. Did the ${pair[0]} and the ${pair[1]} hit the ground at the same time? Explain your answer. {{(2 marks)}}`));
      else out.push(b);
    });
    const steps = [];
    let skip = 0;
    q.steps.forEach((b, i) => {
      if (b.t === "p" && b.x.startsWith("(c)")) { steps.push(P("(c) *s* = *ut* + [[1||2]]*at*² {{1}}"), M(`= 0 + [[1||2]](9.81)(${trim(t, 1)})²`), M(`= ${sg(H, 3)} m {{1}}`), P(`Hence the height of the tower is ${sg(H, 3)} m.`)); skip = 3; return; }
      if (skip > 0 && b.t !== "p" || (skip > 0 && b.x.startsWith("Hence the height"))) { skip--; return; }
      if (b.t === "p" && b.x.startsWith("(e)")) { steps.push(P(`(e) The ${pair[1]} will hit the ground before the ${pair[0]}, {{1}}`)); return; }
      if (b.t === "p" && b.x.startsWith("for the air resistance")) { steps.push(P(`for the air resistance acting on the ${pair[0]} is significant. {{1}}`)); return; }
      steps.push(b);
    });
    return { question: out, checks: { h: H }, steps };
  });

  // ---------- public API ----------
  const API = {
    has: (id) => !!T[id],
    ids: () => Object.keys(T),
    /* Returns a new question object (same shape as the bank) with new numbers, or null if there is no template. */
    generate(q, seed) {
      const tpl = T[q.id]; if (!tpl) return null;
      for (let tries = 0; tries < 30; tries++) {
        const R = makeR(seed == null ? (Math.random() * 4294967296) >>> 0 : (seed + tries * 7919) >>> 0, false);
        let r; try { r = tpl.gen(R, q); } catch (e) { continue; }
        const text = JSON.stringify(r);
        if (/NaN|undefined|Infinity/.test(text)) continue;
        const out = { id: q.id, type: q.type, generated: true, question: r.question, steps: r.steps };
        if (r.options) { out.options = r.options; out.answer = r.answer; }
        if (q.context && !r.context) out.context = q.context; else if (r.context) out.context = r.context;
        return out;
      }
      return null;
    },
    /* For tests: run a template with the book's own numbers. */
    _orig(q) { const tpl = T[q.id]; return tpl.gen(makeR(1, true), q); },
    _expect(id) { return T[id].expect; },
    _random(q, seed) { return T[q.id].gen(makeR(seed, false), q); },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.QuestionGenerator = API;
})(typeof window !== "undefined" ? window : globalThis);
