/* Baseball Manager engine: league, pitch-by-pitch game sim, seasons, offseason. */
var BSM = (function () {
'use strict';

/* ---------------- rng ---------------- */
let R = 1;
function rnd() {
  R = (R + 0x6D2B79F5) | 0;
  let t = R;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function gauss(m, s) {
  let u = 0; while (!u) u = rnd();
  return (m || 0) + (s === undefined ? 1 : s) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function wpick(a, wf) {
  let tot = 0;
  for (let i = 0; i < a.length; i++) tot += wf(a[i]);
  let x = rnd() * tot;
  for (let i = 0; i < a.length; i++) { x -= wf(a[i]); if (x <= 0) return a[i]; }
  return a[a.length - 1];
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
function round50(x) { return Math.round(x / 50) * 50; }

/* ---------------- constants ---------------- */
const MINC = 750, MAXC = 36000;
const ROSTER_MAX = 26, ROSTER_MIN = 24, FARM_MAX = 12, DRAFT_ROUNDS = 3;
const BPOS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const FPOS = BPOS.slice(0, 8);
const BK = ['con', 'pow', 'eye', 'spd', 'fld'];
const PK = ['vel', 'ctl', 'mov', 'sta'];
const RLABEL = { con: 'Contact', pow: 'Power', eye: 'Eye', spd: 'Speed', fld: 'Fielding', vel: 'Velocity', ctl: 'Control', mov: 'Movement', sta: 'Stamina' };
const RSHORT = { con: 'Con', pow: 'Pow', eye: 'Eye', spd: 'Spd', fld: 'Fld', vel: 'Vel', ctl: 'Ctl', mov: 'Mov', sta: 'Sta' };
const POSNAME = { C: 'catcher', '1B': 'first', '2B': 'second', '3B': 'third', SS: 'short', LF: 'left', CF: 'center', RF: 'right', P: 'the mound' };

const BOFF = {
  C: { con: -3, pow: 0, eye: 0, spd: -12, fld: 6 },
  '1B': { con: 2, pow: 9, eye: 3, spd: -8, fld: -6 },
  '2B': { con: 3, pow: -5, eye: 0, spd: 5, fld: 6 },
  '3B': { con: 0, pow: 4, eye: 0, spd: -2, fld: 3 },
  SS: { con: 0, pow: -6, eye: -1, spd: 6, fld: 10 },
  LF: { con: 2, pow: 4, eye: 1, spd: 0, fld: -4 },
  CF: { con: 1, pow: -2, eye: 0, spd: 10, fld: 6 },
  RF: { con: 0, pow: 5, eye: 0, spd: 0, fld: 0 },
  DH: { con: 3, pow: 9, eye: 3, spd: -10, fld: -14 },
};
const DW = { C: 0.30, '1B': 0.10, '2B': 0.24, '3B': 0.20, SS: 0.30, LF: 0.14, CF: 0.27, RF: 0.16, DH: 0 };
const OW = { con: 0.37, pow: 0.33, eye: 0.17, spd: 0.13 };
function bW(pos) { const w = DW[pos]; return { con: OW.con * (1 - w), pow: OW.pow * (1 - w), eye: OW.eye * (1 - w), spd: OW.spd * (1 - w), fld: w }; }
const PW = { SP: { vel: 0.30, ctl: 0.30, mov: 0.28, sta: 0.12 }, RP: { vel: 0.36, ctl: 0.30, mov: 0.34, sta: 0 } };
const POFF = { SP: { vel: 0, ctl: 1, mov: 0, sta: 6 }, RP: { vel: 3, ctl: -1, mov: 1, sta: -28 } };
const ADJ = {};
BPOS.forEach((p) => { const w = bW(p); let s = 0; BK.forEach((k) => { s += w[k] * BOFF[p][k]; }); ADJ[p] = s; });
['SP', 'RP'].forEach((p) => { let s = 0; PK.forEach((k) => { s += PW[p][k] * POFF[p][k]; }); ADJ[p] = s; });
const DIFF = { C: 9, SS: 7, CF: 6, '2B': 5, '3B': 4, RF: 3, LF: 2, '1B': 1, DH: 0 };
const INF = { '1B': 1, '2B': 1, '3B': 1, SS: 1 };
function posPen(prim, pos) {
  if (pos === 'DH' || prim === pos) return 0;
  if (pos === 'C') return 28;
  if (prim === 'DH') return 6 + DIFF[pos] * 3;
  if (prim === 'SP' || prim === 'RP') return 40;
  const dp = prim === 'C' ? 4 : DIFF[prim], dt = DIFF[pos];
  const cross = prim !== 'C' && !!INF[prim] !== !!INF[pos] ? 4 : 0;
  return (dt > dp ? (dt - dp) * 5 : (dp - dt) * 1.2) + cross;
}
const DEFW = { C: 0.8, '1B': 0.5, '2B': 1.1, '3B': 1.0, SS: 1.3, LF: 0.7, CF: 1.2, RF: 0.8 };
const DEFWS = Object.values(DEFW).reduce((a, b) => a + b, 0);
const DEV = { 18: 5.0, 19: 4.6, 20: 4.1, 21: 3.6, 22: 3.0, 23: 2.4, 24: 1.8, 25: 1.2, 26: 0.7, 27: 0.25, 28: -0.1, 29: -0.5, 30: -0.9, 31: -1.4, 32: -1.9, 33: -2.5, 34: -3.1, 35: -3.7, 36: -4.3 };
function devBase(a) { return a < 18 ? 5 : a > 36 ? -4.8 : DEV[a]; }
function growthLeft(a) { let s = 0; for (let x = a; x <= 27; x++) s += Math.max(0, devBase(x)); return s; }

const PITCH = { F: 'Fastball', I: 'Sinker', T: 'Cutter', L: 'Slider', C: 'Changeup', U: 'Curveball', P: 'Splitter' };
const PSPD = { F: 0, I: -1, T: -4, L: -8, C: -8, U: -12, P: -7 };

const TEAMS = [
  ['Boston', 'Lanterns', 'BOS', 0, 4.9], ['New York', 'Skyliners', 'NYS', 0, 20], ['Philadelphia', 'Quills', 'PHI', 0, 6.2],
  ['Washington', 'Ambassadors', 'WAS', 0, 6.3], ['Pittsburgh', 'Forge', 'PIT', 0, 2.4], ['Montreal', 'Voyagers', 'MTL', 0, 4.3],
  ['Charlotte', 'Foxes', 'CHA', 0, 2.7], ['Atlanta', 'Firebirds', 'ATL', 0, 6.1],
  ['Chicago', 'Gales', 'CHI', 1, 9.5], ['Denver', 'Peaks', 'DEN', 1, 3.0], ['Dallas', 'Wranglers', 'DAL', 1, 7.6],
  ['Phoenix', 'Scorchers', 'PHX', 1, 4.9], ['Los Angeles', 'Comets', 'LAX', 1, 13], ['San Francisco', 'Fog', 'SFO', 1, 4.7],
  ['Seattle', 'Squall', 'SEA', 1, 4.0], ['Portland', 'Loggers', 'POR', 1, 2.5],
];
const DIVS = ['East', 'West'];
const NT = TEAMS.length;

const FIRST = ('Aaron Adrian Alejandro Alex Andres Andrew Angel Anthony Antonio Austin Beau Ben Blake Brady Brandon Brett Brian Bryce Caleb Calvin Cameron Carlos Carter Casey Chase Christian Clay Cody Colby Cole Colin Connor Corey Craig Dalton Damian Daniel Dante Darius David Dean Derek Devin Diego Dominic Drew Dustin Dylan Eddie Eduardo Eli Elias Emilio Enrique Eric Esteban Ethan Evan Felix Fernando Francisco Gabe Garrett Gavin Grant Gregory Hector Hunter Ian Isaac Ivan Jack Jace Jake Jalen Jared Jason Javier Jesse Joaquin Joel Jonah Jordan Jorge Josh Julian Justin Kaden Keaton Kenji Kevin Kyle Landon Lane Logan Lucas Luke Malik Manuel Marco Mario Mason Mateo Matt Max Miguel Miles Nate Nathan Nick Noah Nolan Omar Oscar Owen Pablo Parker Patrick Pedro Preston Rafael Ramon Reid Rhys Ricky Riley Robert Roberto Rodrigo Ryan Ryota Sam Santiago Sean Sergio Seth Shane Spencer Taylor Teo Tomas Trent Trevor Tristan Troy Tyler Victor Vince Wade Walker Wes Will Wyatt Xavier Yoshi Zach Zane Hiro Daichi Kai Min Jae Sung Tae Andre Marcus Darnell Quincy Terrance Rashad Desmond Jerome Kendall Lamar Rowan Silas Ezra Beckett Brooks Cade Cash Davis Emmett Finn Graham Hayes Jensen Knox Maddox Reese Sawyer Tucker').split(' ');
const LAST = ('Abbott Acosta Aguilar Alvarado Alvarez Andrews Arias Armstrong Avila Baker Banks Barnes Barrett Bauer Beck Becker Bell Bennett Benson Blair Blake Boone Bowen Boyd Bradley Brennan Briggs Brock Brooks Bryant Burke Burns Bush Cabrera Calderon Callahan Campos Cannon Carr Carson Castillo Castro Chambers Chandler Chavez Cisneros Clarke Cobb Cole Coleman Collier Colon Conley Conner Contreras Cordero Cortez Crane Crawford Cross Cruz Cunningham Dalton Daniels Dawson Delgado Diaz Dillon Dominguez Dorsey Doyle Drake Duarte Duffy Duncan Dunn Durant Easton Ellis Escobar Espinoza Estrada Farrell Faulkner Fields Figueroa Fischer Fleming Flores Flynn Foley Ford Foster Fowler Franco Frye Fuentes Gallagher Galvan Garner Garrison Gentry Gibbs Gilbert Glover Gomez Graves Grayson Greer Griffin Guerra Guzman Hale Hammond Hancock Hardy Harmon Harper Hartley Hawkins Hayden Heath Hendrix Herrera Hicks Hines Holland Holt Horton Houston Howell Huff Hughes Ibarra Ingram Jacobs Jaramillo Jennings Juarez Kane Keller Kemp Kerr Kim Kirby Knapp Knox Koch Lambert Landry Lara Lawson Leal Lennon Lin Lloyd Logan Lopez Lowe Lucero Lynch Mack Maddox Maldonado Mann Marsh Mata Maxwell Mays Medina Mejia Mendez Mercado Meyer Miranda Molina Monroe Montoya Mora Morales Moran Moreno Morrow Mosley Munoz Murillo Nash Navarro Nelson Nguyen Nichols Noble Norris Nunez Ochoa Okafor Oliver Olsen Orozco Ortega Osborne Owens Pacheco Padilla Palmer Park Parks Pena Pennington Perez Pierce Pittman Ponce Porter Pratt Quinn Ramsey Randall Rangel Reyes Rhodes Rios Rivas Rivera Robles Rocha Rojas Romero Rosales Rowe Russo Salazar Salinas Sandoval Santana Santos Sato Saunders Schultz Serrano Sharp Shelton Short Sierra Silva Sloan Snyder Solis Sosa Spencer Stanton Stark Steele Stokes Strickland Sullivan Sutton Tanaka Tate Terrell Torres Townsend Trujillo Tucker Valdez Valencia Vance Vargas Vaughn Vega Velasquez Villa Wade Walsh Ward Waters Watts Webb Weber Wells Wheeler Whitaker Wilcox Wiley Wolfe Wong Yates Yoon York Zamora Zavala Zimmerman Ishida Mori Nakano Hayashi Kwon Choi Cho Han Petrov Novak Kowalski Lindgren Dahl Moreau Brandt Costa Ferreira Nakashima Okamoto').split(' ');
const BLOCK = new Set(['Pedro Martinez', 'Carlos Santana', 'Miguel Cabrera', 'Jose Ramirez', 'David Ortiz', 'Kyle Tucker', 'Bryce Harper', 'Austin Riley', 'Matt Olson', 'Pablo Sandoval', 'Corey Seager', 'Will Smith', 'Mookie Betts', 'Pete Alonso', 'Juan Soto', 'Max Scherzer', 'Carlos Correa', 'Marcus Stroman', 'Tyler Glass', 'Hunter Pence', 'Hunter Greene', 'Dylan Cease', 'Logan Webb', 'Eduardo Rodriguez', 'Ramon Laureano', 'Javier Baez', 'Mason Miller', 'Chase Utley', 'Justin Turner', 'Ryan Howard', 'Josh Hader', 'Andrew Benintendi', 'Eric Hosmer', 'Wade Boggs', 'Sean Doolittle', 'Christian Yelich', 'Nolan Arenado', 'Nolan Ryan', 'Ryan Braun', 'Lucas Giolito', 'Blake Snell', 'Blake Treinen', 'Matt Chapman', 'Trevor Story', 'Trevor Bauer', 'Kevin Gausman', 'Zach Wheeler', 'Shane Bieber', 'Walker Buehler', 'Wade Miley', 'Cody Bellinger', 'Gavin Lux', 'Jake Burger', 'Riley Greene', 'Spencer Torkelson', 'Spencer Strider', 'Jose Abreu', 'Luis Castillo', 'Andres Gimenez', 'Rafael Devers', 'Francisco Lindor', 'Jordan Walker', 'Will Benson', 'Wyatt Langford', 'Jack Leiter', 'Jackson Holliday', 'Gunnar Henderson', 'Colton Cowser', 'Bobby Witt', 'Mateo Fuentes', 'Brandon Lowe', 'Jake Fraley', 'Isaac Paredes', 'Tyler Rogers', 'Daniel Vogelbach', 'Pablo Lopez', 'Max Muncy', 'Kenji Johjima', 'Victor Robles', 'Victor Martinez', 'Felix Hernandez', 'Felix Bautista', 'Jorge Soler', 'Jorge Posada', 'Derek Jeter', 'Ivan Rodriguez', 'Pedro Alvarez', 'Robert Suarez', 'Carlos Estevez', 'Ryan Pressly', 'Hector Neris', 'Hector Santiago', 'Miguel Rojas', 'Miguel Andujar', 'Andres Munoz', 'Josh Naylor', 'Owen Miller', 'Patrick Corbin', 'Wade Davis', 'Shane Baz', 'Joel Peguero', 'Diego Castillo', 'Rafael Montero', 'Santiago Espinal', 'Jake Cronenworth', 'Austin Hays', 'Ryan Mountcastle', 'Dean Kremer', 'Sam Hilliard', 'Kyle Schwarber', 'Kyle Hendricks', 'Cole Hamels', 'Cole Ragans', 'Seth Lugo', 'Brady Singer', 'Logan Gilbert', 'Luis Robert', 'Andrew Vaughn', 'Dylan Carlson', 'Eli White', 'Nick Castellanos', 'Brandon Nimmo', 'Brandon Marsh', 'Alex Bregman', 'Jesse Winker', 'Tyler Wells', 'Ryan Weathers', 'Ethan Roberts', 'Caleb Ferguson', 'Josh Bell', 'Kyle Wright', 'Ian Kennedy', 'Ian Anderson', 'Evan Longoria', 'Evan Phillips', 'Grant Holmes', 'Jesse Chavez', 'Cody Ross', 'Justin Lawrence', 'Ivan Herrera', 'Lane Thomas', 'Mason Englert', 'Riley Adams', 'Drew Smyly', 'Drew Rasmussen', 'Ezra Hart']);

const BINJ = [
  ['Hamstring strain', 22, 8, 25], ['Sprained ankle', 18, 5, 18], ['Back tightness', 16, 3, 12], ['Oblique strain', 12, 14, 35],
  ['Wrist sprain', 10, 7, 21], ['Calf strain', 10, 7, 21], ['Concussion', 5, 7, 14], ['Broken finger', 5, 21, 40],
  ['Knee sprain', 6, 10, 30], ['Shoulder strain', 5, 15, 40], ['Broken hand', 2.5, 30, 55], ['Torn ACL', 0.6, 140, 220],
];
const PINJ = [
  ['Elbow inflammation', 20, 10, 25], ['Shoulder fatigue', 16, 10, 30], ['Forearm tightness', 14, 10, 25], ['Oblique strain', 12, 14, 35],
  ['Blister', 12, 5, 12], ['Back tightness', 8, 3, 12], ['Hamstring strain', 6, 10, 25], ['Rotator cuff strain', 4, 30, 70], ['Torn elbow ligament', 1.6, 200, 380],
];
const AWARDS = { mvp: 'MVP', cy: 'Best pitcher', roy: 'Rookie of the Year', rel: 'Reliever of the Year', fmvp: 'Championship MVP', champ: 'Champion' };
const ROUNDS = ['Wild card', 'Division series', 'Championship series'];
const RWINS = [2, 4, 4];

// season stat fields
const SFB = ['g', 'pa', 'ab', 'r', 'h', 'd', 'tr', 'hr', 'rbi', 'bb', 'so', 'sb', 'cs', 'hbp', 'sf'];
const SFP = ['g', 'gs', 'w', 'l', 'sv', 'hld', 'bs', 'outs', 'h', 'r', 'er', 'bb', 'so', 'hr', 'bf', 'pc', 'cg', 'sho'];
// box line indexes (after id, pos)
const BX = { ab: 0, r: 1, h: 2, d: 3, t: 4, hr: 5, rbi: 6, bb: 7, so: 8, sb: 9, cs: 10, hbp: 11, sf: 12 };
const PX = { outs: 0, h: 1, r: 2, er: 3, bb: 4, so: 5, hr: 6, bf: 7, pc: 8, dec: 9 };
const DEC = { W: 1, L: 2, S: 4, H: 8, BS: 16 };

/* sim tuning */
const K = {
  zone: 0.485, zsw: 0.655, chase: 0.30, zct: 0.892, oct: 0.63, zfoul: 0.50, ofoul: 0.62,
  hbp: 0.0072, frame: 0.055, wp: 0.0042,
  fb: 0.355, ld: 0.205, hrfb: 0.112, ifp: 0.18,
  gbH: 0.257, ldH: 0.68, fbH: 0.132, err: 0.016,
  dp: 0.44, stA: 0.2, stS: 0.70, plC: 4, plP: 5, tto: 2.2,
};

/* ---------------- state ---------------- */
let S = null;
let PM = new Map();
function idx() { PM = new Map(); for (const p of S.players) PM.set(p.id, p); }
function P(id) { return PM.get(id); }
function T(tid) { return S.teams[tid]; }
function isP(p) { return p.pos === 'SP' || p.pos === 'RP'; }
function age(p) { return S.season - p.born; }
function nm(p) { return p.fn + ' ' + p.ln; }

/* ---------------- players ---------------- */
function calcOvr(p) {
  if (isP(p)) { const w = PW[p.pos]; let s = 0; for (const k of PK) s += w[k] * p.r[k]; return Math.round(s); }
  const w = bW(p.pos); let s = 0;
  for (const k of BK) s += w[k] * p.r[k];
  return Math.round(s);
}
function offVal(p) { const r = p.r; return OW.con * (r.con || 20) + OW.pow * (r.pow || 15) + OW.eye * (r.eye || 20) + OW.spd * (r.spd || 25); }
const DV = { C: 0.4, SS: 0.4, CF: 0.35, '2B': 0.32, '3B': 0.28, RF: 0.2, LF: 0.18, '1B': 0.1 };
function fitVal(p, pos) {
  if (pos === 'DH') return offVal(p) - 3;
  return offVal(p) + DV[pos] * ((p.r.fld || 20) - posPen(p.pos, pos) - 50);
}
function hungarian(cost) {
  const n = cost.length;
  const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity), used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity, j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      if (!j1) return new Array(n).fill(-1);
      for (let j = 0; j <= n; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const ans = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j]) ans[p[j] - 1] = j - 1;
  return ans;
}
function genName() {
  for (let i = 0; i < 60; i++) {
    const f = pick(FIRST), l = pick(LAST);
    if (!BLOCK.has(f + ' ' + l)) return [f, l];
  }
  return [pick(FIRST), 'Whitaker'];
}
const BPOSW = { C: 1.25, '1B': 0.9, '2B': 1, '3B': 1, SS: 1, LF: 0.9, CF: 1, RF: 0.95, DH: 0.4 };
function genPlayer(talent, a, pos) {
  pos = pos || (rnd() < 0.5 ? (rnd() < 0.55 ? 'SP' : 'RP') : wpick(BPOS, (x) => BPOSW[x]));
  const [fn, ln] = genName();
  const p = {
    id: S.nextPid++, fn, ln, pos, born: S.season - a, tid: -1, fm: 0, r: {}, ovr: 0, pot: 0,
    gf: Math.round(clamp(gauss(1, 0.3), 0.3, 1.8) * 100) / 100, c: { amt: MINC, exp: S.season }, inj: null, dr: null,
    s: [], aw: [], h: [], fz: 0, fat: 0,
  };
  if (isP(p)) {
    p.thr = rnd() < 0.28 ? 'L' : 'R';
    p.bats = p.thr;
    const sty = gauss(0, 4); // power arm vs finesse
    for (const k of PK) {
      let v = talent + POFF[pos][k] - ADJ[pos] + gauss(0, 7);
      if (k === 'vel') v += sty; if (k === 'ctl') v -= sty * 0.8;
      if (k === 'sta') v = pos === 'SP' ? 60 + (talent - 50) * 0.35 + gauss(0, 8) : 26 + gauss(0, 9);
      p.r[k] = Math.round(clamp(v, 15, 99));
    }
    const pool = ['L', 'C', 'U', 'I', 'T', 'P'];
    const n = pos === 'SP' ? ri(3, 4) : ri(2, 3);
    p.rep = 'F' + shuffle(pool).slice(0, n - 1).join('');
  } else {
    const x = rnd();
    p.bats = x < 0.58 ? 'R' : x < 0.9 ? 'L' : 'S';
    p.thr = (pos === 'C' || pos === '2B' || pos === '3B' || pos === 'SS') ? 'R' : (p.bats === 'L' && rnd() < 0.6 ? 'L' : 'R');
    const sty = gauss(0, 5); // contact vs power
    for (const k of BK) {
      let v = talent + BOFF[pos][k] - ADJ[pos] + gauss(0, 7);
      if (k === 'con') v += sty * 0.7; if (k === 'pow') v -= sty;
      p.r[k] = Math.round(clamp(v, 15, 99));
    }
  }
  p.ovr = calcOvr(p);
  p.pot = calcPot(p);
  return p;
}
function calcPot(p) {
  const a = age(p);
  if (a >= 28) return p.ovr;
  return Math.max(p.ovr, Math.round(p.ovr + growthLeft(a) * (0.55 + 0.45 * p.gf) * 0.9));
}
function develop(p, ageNow, scale) {
  const b0 = devBase(ageNow);
  const base = b0 * (b0 > 0 ? p.gf : 1);
  const yr = gauss(0, 2.4);
  const keys = isP(p) ? PK : BK;
  for (const k of keys) {
    let m;
    if (base < 0) m = ({ spd: 1.6, vel: 1.35, sta: 1.15, con: 1, pow: 0.85, eye: 0.45, ctl: 0.6, fld: 1.1, mov: 0.9 })[k];
    else m = ({ spd: 0.5, vel: 0.85, sta: 0.7, con: 1, pow: 1.1, eye: 0.9, ctl: 1, fld: 0.8, mov: 1 })[k];
    if (k === 'sta' && p.pos === 'RP') m *= 0.4;
    const d = (base * m + yr) * scale + gauss(0, 1.1) * scale;
    p.r[k] = Math.round(clamp(p.r[k] + d, 10, 99));
  }
  p.ovr = calcOvr(p);
}

/* ---------------- contracts & value ---------------- */
function valOvr(p) { return p.ovr - (p.pos === 'RP' ? 6 : 0); }
function valRating(p, mode) {
  const a = age(p);
  let v = valOvr(p);
  if (a <= 26) v += (p.pot - p.ovr) * (mode === 'rebuild' ? 0.55 : mode === 'contend' ? 0.2 : 0.38) * clamp((27 - a) / 6, 0, 1);
  if (a >= 31) v -= (a - 30) * (mode === 'rebuild' ? 1.6 : mode === 'contend' ? 0.5 : 0.9);
  return v;
}
function salaryFor(v) {
  const x = clamp((v - 40) / (80 - 40), 0, 1);
  return round50(MINC + (MAXC - MINC) * Math.pow(x, 2.0));
}
function marketValue(p) { return salaryFor(valRating(p)); }
function prefYears(p) { const a = age(p); return a < 26 ? 5 : a < 29 ? 4 : a < 32 ? 3 : a < 34 ? 2 : 1; }
function appeal(tid) {
  const t = T(tid);
  const g = t.rec.w + t.rec.l;
  const w = g > 20 ? t.rec.w / g : (t.lastWp != null ? t.lastWp : 0.5);
  return clamp(0.45 * t.hype + 0.4 * w + 0.15 * Math.min(1, t.pop / 10), 0, 1);
}
function askFor(p, tid, years) {
  let base = p.ask || marketValue(p);
  if (tid != null) base *= 1.12 - 0.24 * appeal(tid) + (p.tid === tid ? -0.05 : 0);
  base *= 1 + 0.05 * Math.abs(years - prefYears(p));
  if (S.phase === 'regular' || S.phase === 'playoffs') base *= 1 - 0.5 * (S.day / Math.max(1, S.lastDay));
  return clamp(round50(base), MINC, MAXC);
}

/* ---------------- payroll ---------------- */
function inOff() { return S.phase === 'draft' || S.phase === 'resign' || S.phase === 'fa'; }
function payYear() { return inOff() ? S.season + 1 : S.season; }
function teamPlayers(tid) { return S.players.filter((p) => p.tid === tid); }
function active(tid) { return S.players.filter((p) => p.tid === tid && !p.fm); }
function farm(tid) { return S.players.filter((p) => p.tid === tid && p.fm); }
function counts(p) { return !(p.fm && p.c.amt <= MINC); }
function payroll(tid, yr) {
  yr = yr || payYear();
  let s = 0;
  for (const p of S.players) if (p.tid === tid && p.c.exp >= yr && counts(p)) s += p.c.amt;
  for (const d of S.dead) if (d.tid === tid && d.exp >= yr) s += d.amt;
  return s;
}
function rosterCount(tid) {
  const yr = payYear();
  let n = 0;
  for (const p of S.players) if (p.tid === tid && !p.fm && p.c.exp >= yr) n++;
  return n;
}
function farmCount(tid) {
  const yr = payYear();
  let n = 0;
  for (const p of S.players) if (p.tid === tid && p.fm && p.c.exp >= yr) n++;
  return n;
}
function calcBudget(t) {
  return round50(clamp(60000 + t.pop * 4600 + t.hype * 38000 + clamp(t.cash, -40000, 80000) * 0.1, 80000, 240000));
}

/* ---------------- league creation ---------------- */
function newLeague(userTid, seed) {
  R = (seed >>> 0) || 1;
  S = {
    v: 1, rs: 0, season: 2026, phase: 'regular', day: 0, lastDay: 0, user: userTid, nextPid: 1, nextGid: 1,
    teams: [], players: [], sched: [], games: [], series: [], draft: null, dead: [], news: [], hist: [],
    owner: { w: 0, p: 0, m: 0, seasons: 0, last: null },
    career: { seasons: 0, w: 0, l: 0, pw: 0, pl: 0, titles: 0, teams: [userTid], start: 2026 },
    fired: false, faDay: 0, deadline: 0, prep: -1, pend: null,
  };
  idx();
  TEAMS.forEach((d, tid) => {
    S.teams.push({
      tid, city: d[0], name: d[1], abbr: d[2], div: d[3], pop: d[4],
      hype: clamp(0.35 + rnd() * 0.3, 0, 1), cash: 40000 + Math.round(rnd() * 40000), ticket: 40, budget: 0,
      strat: 'mid', auto: true, autoP: true, lu: [], lp: [], rot: [], pen: [], rotI: 0,
      rec: blankRec(), lastWp: 0.5, seasons: [], fin: blankFin(),
    });
  });
  const BT = [64, 60, 58, 56, 55, 53, 52, 50, 48];
  const BB = [46, 44, 42, 41];
  const SPT = [66, 60, 56, 52, 49];
  const RPT = [62, 57, 54, 51, 49, 47, 45, 43];
  const stars = shuffle(S.teams.map((t) => t.tid)).slice(0, 6);
  const aces = shuffle(S.teams.map((t) => t.tid)).slice(0, 5);
  const add = (p, tid) => { p.tid = tid; S.players.push(p); PM.set(p.id, p); return p; };
  const vet = (p, tid) => {
    const a = age(p);
    if (a >= 24) p.vet = 1;
    const dy = S.season - 1 - Math.max(0, a - ri(19, 22));
    if (rnd() < 0.8) p.dr = { y: dy, r: ri(1, 3), p: 0, t: tid };
    const yrs = a <= 24 ? ri(2, 5) : ri(1, 6);
    p.c = { amt: round50(clamp(marketValue(p) * gauss(1, 0.18), MINC, MAXC)), exp: S.season + yrs - 1 };
    if (a <= 24 && rnd() < 0.6) p.c.amt = MINC;
  };
  for (const t of S.teams) {
    const q = gauss(0, 2);
    const posBat = shuffle(BPOS.slice());
    const tal = shuffle(BT.slice());
    posBat.forEach((pos, i) => {
      let tv = tal[i] + q + gauss(0, 2.4);
      if (i === 0 && stars.includes(t.tid)) tv += 3 + rnd() * 5;
      const a = clamp(Math.round(gauss(28, 3.6)), 21, 37);
      const p = add(genPlayer(tv - (a < 25 ? (25 - a) * 0.8 : 0), a, pos), t.tid);
      vet(p, t.tid);
    });
    ['C', 'SS', 'CF', pick(['3B', '2B', '1B', 'LF', 'RF'])].forEach((pos, i) => {
      const a = clamp(Math.round(gauss(28, 4)), 22, 36);
      const p = add(genPlayer(BB[i] + q * 0.6 + gauss(0, 2.2), a, pos), t.tid);
      vet(p, t.tid);
    });
    SPT.forEach((b, i) => {
      let tv = b + q + gauss(0, 2.4);
      if (i === 0 && aces.includes(t.tid)) tv += 3 + rnd() * 5;
      const a = clamp(Math.round(gauss(28.5, 3.6)), 21, 38);
      vet(add(genPlayer(tv - (a < 25 ? (25 - a) * 0.8 : 0), a, 'SP'), t.tid), t.tid);
    });
    RPT.forEach((b) => {
      const a = clamp(Math.round(gauss(29, 3.8)), 22, 38);
      vet(add(genPlayer(b + q * 0.6 + gauss(0, 2.4), a, 'RP'), t.tid), t.tid);
    });
    for (let i = 0; i < 7; i++) {
      const a = ri(18, 23);
      const p = add(genPlayer(36 + rnd() * 9 + (a - 18) * 1.2, a), t.tid);
      p.fm = 1; p.gf = Math.round(clamp(gauss(1.05, 0.35), 0.3, 2) * 100) / 100; p.pot = calcPot(p);
      p.dr = { y: S.season - 1 - (a > 21 ? a - 21 : 0), r: ri(1, 3), p: 0, t: t.tid };
      p.c = { amt: MINC, exp: S.season + ri(2, 5) };
    }
  }
  for (let i = 0; i < 45; i++) {
    const p = add(genPlayer(clamp(gauss(45, 4), 36, 54), ri(22, 34)), -1);
    p.c = { amt: MINC, exp: S.season };
  }
  for (const p of S.players) p.h.push([S.season, p.ovr, p.pot]);
  S.norm = ratingMeans();
  for (const t of S.teams) t.budget = Math.max(calcBudget(t), round50(payroll(t.tid, S.season) * 1.06));
  genDraftClass(S.season);
  setupSeason();
  return S;
}
function ratingMeans() {
  const m = {};
  const ps = S.players.filter((p) => p.tid >= 0 && !p.fm);
  const bat = ps.filter((p) => !isP(p)).sort((a, b) => b.ovr - a.ovr).slice(0, 200);
  const pit = ps.filter((p) => isP(p)).sort((a, b) => b.ovr - a.ovr).slice(0, 200);
  const stat = (arr, k) => {
    const n = Math.max(1, arr.length);
    const mu = arr.reduce((s, p) => s + p.r[k], 0) / n;
    const sd = Math.sqrt(arr.reduce((s, p) => s + (p.r[k] - mu) * (p.r[k] - mu), 0) / n) || 1;
    return [mu, sd];
  };
  for (const k of BK) m[k] = stat(bat, k);
  for (const k of ['vel', 'ctl', 'mov']) m[k] = stat(pit, k);
  return m;
}
function normalize() {
  if (!S.norm) return;
  const now = ratingMeans();
  for (const k of Object.keys(S.norm)) {
    const [mu, sd] = now[k], [tm, ts] = S.norm[k];
    const scale = 1 + (ts / sd - 1) * 0.7;
    const shift = (tm - mu) * 0.7;
    if (Math.abs(shift) < 0.3 && Math.abs(scale - 1) < 0.01) continue;
    const pit = PK.includes(k);
    for (const p of S.players) if (p.tid !== -2 && isP(p) === pit) p.r[k] = Math.round(clamp(mu + shift + (p.r[k] - mu) * scale, 10, 99));
  }
  for (const p of S.players) if (p.tid !== -2) p.ovr = calcOvr(p);
}
function blankRec() { return { w: 0, l: 0, hw: 0, hl: 0, dw: 0, dl: 0, rs: 0, ra: 0, str: 0, l10: [] }; }
function blankFin() { return { gate: 0, merch: 0, tv: 0, po: 0, sal: 0, ops: 0, att: 0, hg: 0 }; }

function genDraftClass(y) {
  const n = 64;
  for (let i = 0; i < n; i++) {
    const a = wpick([18, 19, 20, 21, 22], (x) => ({ 18: 30, 19: 10, 20: 12, 21: 30, 22: 18 })[x]);
    let tal = 33 + 17 * Math.pow(rnd(), 2.3) + gauss(0, 2.4) + (a - 18) * 1.6;
    if (i < 5) tal += 4 + rnd() * 7;
    const p = genPlayer(tal, a);
    p.tid = -3; p.dy = y;
    p.gf = Math.round(clamp(gauss(1.05, 0.38), 0.3, 2) * 100) / 100;
    p.pot = calcPot(p);
    p.fz = Math.round(gauss(0, 3.4));
    p.c = { amt: MINC, exp: y };
    S.players.push(p); PM.set(p.id, p);
  }
}

/* ---------------- schedule ---------------- */
function makeSchedule() {
  const D = [0, 1].map((d) => S.teams.filter((t) => t.div === d).map((t) => t.tid));
  const rr = (arr) => {
    const n = arr.length, a = arr.slice(), out = [];
    for (let r = 0; r < n - 1; r++) {
      const pr = [];
      for (let i = 0; i < n / 2; i++) pr.push([a[i], a[n - 1 - i]]);
      out.push(pr);
      a.splice(1, 0, a.pop());
    }
    return out;
  };
  const r0 = rr(D[0]), r1 = rr(D[1]);
  const rounds = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < 7; i++) rounds.push({ pairs: r0[i].concat(r1[i]), c, div: 1 });
  for (let c = 0; c < 3; c++) for (let k = 0; k < 8; k++) {
    const pr = [];
    for (let i = 0; i < 8; i++) pr.push([D[0][i], D[1][(i + k) % 8]]);
    rounds.push({ pairs: pr, c, div: 0 });
  }
  shuffle(rounds);
  const four = new Set(shuffle(rounds.map((_, i) => i)).slice(0, 6));
  const sched = [];
  let d = 0;
  rounds.forEach((rd, i) => {
    const n = four.has(i) ? 4 : 3;
    for (const [a, b] of rd.pairs) {
      let home;
      if (rd.div) home = rd.c % 2 ? b : a;
      else home = rd.c === 0 ? a : rd.c === 1 ? b : ((a + b) % 2 ? a : b);
      const away = home === a ? b : a;
      for (let g = 0; g < n; g++) sched.push({ d: d + g, h: home, a: away, g: 0 });
    }
    d += n;
    if (i % 2 === 1) d++;
  });
  return sched;
}

function setupSeason() {
  S.phase = 'regular';
  S.day = 0;
  S.prep = -1;
  S.sched = makeSchedule();
  S.lastDay = S.sched[S.sched.length - 1].d;
  S.deadline = Math.round(S.lastDay * 0.6);
  S.games = [];
  S.series = [];
  for (const t of S.teams) { t.rec = blankRec(); t.fin = blankFin(); t.rotI = 0; }
  updateStrategies();
  for (const t of S.teams) { trimAndFill(t.tid); applyAuto(t.tid); }
  for (const p of S.players) p.fat = 0;
}

/* ---------------- lineups ---------------- */
function healthyBat(tid) { return S.players.filter((p) => p.tid === tid && !p.fm && !isP(p) && !p.inj); }
function healthyPit(tid) { return S.players.filter((p) => p.tid === tid && !p.fm && isP(p) && !p.inj); }
function autoLineup(tid, pool) {
  let bats = pool || healthyBat(tid);
  if (bats.length < 9) {
    const hurt = S.players.filter((p) => p.tid === tid && !p.fm && !isP(p) && p.inj).sort((a, b) => a.inj.d - b.inj.d);
    bats = bats.concat(hurt.slice(0, 9 - bats.length));
  }
  if (bats.length < 9) {
    const extra = S.players.filter((p) => p.tid === tid && !p.fm && isP(p)).sort((a, b) => (a.pos === 'RP' ? 0 : 1) - (b.pos === 'RP' ? 0 : 1));
    bats = bats.concat(extra.slice(0, 9 - bats.length));
  }
  const lp = {};
  const n = Math.max(bats.length, 9);
  const cost = [];
  for (let i = 0; i < n; i++) {
    const p = bats[i];
    const row = [];
    for (let j = 0; j < n; j++) {
      if (!p) row.push(j < 9 ? 1e6 : 0);
      else if (j < 9) row.push(-((fitVal(p, BPOS[j]) || 0) + (p.pos === BPOS[j] ? 1.5 : 0)) + (isP(p) ? 200 : 0) + (p.inj ? 100 : 0));
      else row.push(0);
    }
    cost.push(row);
  }
  const asg = hungarian(cost);
  asg.forEach((j, i) => { if (bats[i] && j >= 0 && j < 9) lp[BPOS[j]] = bats[i]; });
  const usedP = new Set(Object.values(lp));
  for (const pos of BPOS) {
    if (lp[pos]) continue;
    let best = null, bv = -1e9;
    for (const p of bats) { if (usedP.has(p)) continue; const v = fitVal(p, pos) || 0; if (v > bv) { bv = v; best = p; } }
    if (best) { lp[pos] = best; usedP.add(best); }
  }
  const nine = BPOS.filter((pos) => lp[pos]).map((pos) => ({ p: lp[pos], pos }));
  return orderLineup(nine);
}
function obpScore(p) { return p.r.con * 0.5 + p.r.eye * 0.4 + p.r.spd * 0.1; }
function orderLineup(nine) {
  const rest = nine.slice().sort((a, b) => offVal(b.p) - offVal(a.p));
  const out = new Array(nine.length).fill(null);
  const take = (f) => { if (!rest.length) return null; let bi = 0; for (let i = 1; i < rest.length; i++) if (f(rest[i]) > f(rest[bi])) bi = i; return rest.splice(bi, 1)[0]; };
  out[1] = take((x) => offVal(x.p));
  out[0] = take((x) => obpScore(x.p) + x.p.r.spd * 0.15);
  out[3] = take((x) => x.p.r.pow);
  out[2] = take((x) => offVal(x.p));
  for (let i = 4; i < out.length; i++) out[i] = take((x) => offVal(x.p));
  const fin = out.filter(Boolean);
  return { lu: fin.map((x) => x.p.id), lp: fin.map((x) => x.pos) };
}
function spScore(p) { return p.ovr + (p.r.sta - 50) * 0.35 + (p.pos === 'SP' ? 4 : -6); }
function autoStaff(tid) {
  const ps = healthyPit(tid);
  const sp = ps.slice().sort((a, b) => spScore(b) - spScore(a));
  const rot = sp.slice(0, 5);
  const rest = ps.filter((p) => !rot.includes(p)).sort((a, b) => (b.ovr + (b.pos === 'RP' ? 3 : 0)) - (a.ovr + (a.pos === 'RP' ? 3 : 0)));
  const hurt = S.players.filter((p) => p.tid === tid && !p.fm && isP(p) && p.inj).map((p) => p.id);
  return { rot: rot.map((p) => p.id), pen: rest.map((p) => p.id).concat(hurt) };
}
function applyAuto(tid) {
  const t = T(tid);
  if (tid !== S.user || t.auto) { const a = autoLineup(tid); t.lu = a.lu; t.lp = a.lp; }
  else fixLineup(tid);
  if (tid !== S.user || t.autoP) { const s = autoStaff(tid); t.rot = s.rot; t.pen = s.pen; }
  else fixStaff(tid);
}
function onActive(id, tid) { const p = P(id); return p && p.tid === tid && !p.fm; }
function fixLineup(tid) {
  const t = T(tid);
  const keep = [], kp = [];
  t.lu.forEach((id, i) => { if (onActive(id, tid) && !isP(P(id))) { keep.push(id); kp.push(t.lp[i]); } });
  if (keep.length === 9 && new Set(kp).size === 9) { t.lu = keep; t.lp = kp; return; }
  // fill the open positions with the best available
  const used = new Set(keep);
  const pool = S.players.filter((p) => p.tid === tid && !p.fm && !isP(p) && !used.has(p.id)).sort((a, b) => (a.inj ? 1 : 0) - (b.inj ? 1 : 0));
  const lu = keep.slice(), lp = kp.slice();
  // drop duplicate positions
  const seen = new Set();
  for (let i = lp.length - 1; i >= 0; i--) { if (seen.has(lp[i])) { lu.splice(i, 1); lp.splice(i, 1); } else seen.add(lp[i]); }
  for (const pos of BPOS) {
    if (lp.includes(pos) || lu.length >= 9) continue;
    let best = null, bv = -1e9;
    for (const p of pool) { if (lu.includes(p.id)) continue; const v = fitVal(p, pos) - (p.inj ? 30 : 0); if (v > bv) { bv = v; best = p; } }
    if (!best) break;
    lu.push(best.id); lp.push(pos);
  }
  t.lu = lu; t.lp = lp;
}
function fixStaff(tid) {
  const t = T(tid);
  const ids = S.players.filter((p) => p.tid === tid && !p.fm && isP(p)).map((p) => p.id);
  t.rot = t.rot.filter((id) => ids.includes(id));
  t.pen = t.pen.filter((id) => ids.includes(id) && !t.rot.includes(id));
  for (const id of ids) if (!t.rot.includes(id) && !t.pen.includes(id)) t.pen.push(id);
  while (t.rot.length < 5 && t.pen.length) {
    const best = t.pen.map((id) => P(id)).filter((p) => !p.inj).sort((a, b) => spScore(b) - spScore(a))[0];
    if (!best) break;
    t.pen.splice(t.pen.indexOf(best.id), 1); t.rot.push(best.id);
  }
}
// lineup actually used in a game (fills injured spots)
function gameLineup(tid) {
  const t = T(tid);
  if (tid !== S.user || t.auto) return autoLineup(tid);
  fixLineup(tid);
  const healthy = healthyBat(tid);
  const lu = [], lp = [];
  const used = new Set(t.lu.filter((id) => !P(id).inj));
  t.lu.forEach((id, i) => {
    const p = P(id);
    if (p && !p.inj) { lu.push(id); lp.push(t.lp[i]); return; }
    let best = null, bv = -1e9;
    for (const q of healthy) { if (used.has(q.id)) continue; const v = fitVal(q, t.lp[i]); if (v > bv) { bv = v; best = q; } }
    if (best) { used.add(best.id); lu.push(best.id); lp.push(t.lp[i]); }
    else { lu.push(id); lp.push(t.lp[i]); }
  });
  return { lu, lp };
}
function staffOf(tid) {
  const t = T(tid);
  if (tid !== S.user || t.autoP) return autoStaff(tid);
  fixStaff(tid);
  return { rot: t.rot, pen: t.pen };
}
function canStart(p) { return p && !p.inj && p.fat <= 22; }
function pickStarter(tid) {
  const t = T(tid);
  const st = staffOf(tid);
  const n = st.rot.length;
  for (let k = 0; k < n; k++) {
    const i = (t.rotI + k) % n;
    const p = P(st.rot[i]);
    if (p && p.tid === tid && canStart(p)) return { p, i };
  }
  // bullpen game: most rested arm
  const all = S.players.filter((p) => p.tid === tid && !p.fm && isP(p) && !p.inj).sort((a, b) => a.fat - b.fat || b.r.sta - a.r.sta);
  if (all.length) return { p: all[0], i: -1 };
  const any = S.players.filter((p) => p.tid === tid && !p.fm && isP(p))[0] || S.players.filter((p) => p.tid === tid && !p.fm)[0];
  return { p: any, i: -1 };
}

function teamOvr(tid) {
  const lu = autoLineup(tid);
  let off = 0, n = 0;
  lu.lu.forEach((id, i) => { off += fitVal(P(id), lu.lp[i]); n++; });
  off = n ? off / n : 35;
  const st = autoStaff(tid);
  const rot = st.rot.map((id) => P(id).ovr).sort((a, b) => b - a);
  const pen = st.pen.map((id) => P(id)).filter((p) => !p.inj).map((p) => p.ovr).sort((a, b) => b - a);
  let sp = 0; for (let i = 0; i < 5; i++) sp += rot[i] || 35; sp /= 5;
  let rp = 0; for (let i = 0; i < 5; i++) rp += pen[i] || 35; rp /= 5;
  return Math.round(off * 0.5 + sp * 0.33 + rp * 0.17 + 4);
}

/* ---------------- game sim ---------------- */
function mkBat(p, pos, seq) {
  return {
    p, id: p.id, pos, seq, con: p.r.con || 25, pow: p.r.pow || 20, eye: p.r.eye || 25, spd: p.r.spd || 30,
    fld: (p.r.fld || 20) - posPen(p.pos, pos), bats: p.bats || 'R', s: new Array(13).fill(0), out: false,
  };
}
function mkPit(p, sp, G, side) {
  const fat0 = p.fat || 0;
  const sta = p.r.sta || 20;
  const maxP = sp ? (55 + sta * 0.62) * (1 - fat0 / 160) : (14 + sta * 0.42) * (1 - fat0 / 110);
  const lead = G ? G.sc[side] - G.sc[1 - side] : 0;
  const runners = G ? G.bases.filter(Boolean).length : 0;
  return {
    p, id: p.id, sp, vel: p.r.vel || 25, ctl: p.r.ctl || 25, mov: p.r.mov || 25, sta, thr: p.thr || 'R', rep: p.rep || 'FL',
    fat0, maxP: Math.max(sp ? 40 : 10, maxP), pc: 0, s: new Array(10).fill(0), R: 0,
    save: lead >= 1 && (lead <= 3 || lead <= runners + 2), eLead: lead, eRun: runners, bs: false, long: false,
  };
}
function setupSide(G, tid, side, st) {
  const lu = gameLineup(tid);
  const staff = staffOf(tid);
  const tm = { tid, side, lu: [], bl: [], bi: 0, pit: null, pl: [], used: new Set(), def: {}, H: 0, E: 0, LOB: 0, pendP: 0, pendH: 0, si: st.i };
  lu.lu.forEach((id, i) => { const b = mkBat(P(id), lu.lp[i], i); tm.lu.push(b); tm.bl.push(b); tm.def[lu.lp[i]] = b; });
  const inLu = new Set(lu.lu);
  tm.bench = S.players.filter((p) => p.tid === tid && !p.fm && !isP(p) && !p.inj && !inLu.has(p.id)).map((p) => p.id);
  tm.pen = staff.pen.filter((id) => id !== st.p.id);
  tm.rotIds = new Set(staff.rot);
  for (const id of staff.rot) if (id !== st.p.id && !tm.pen.includes(id)) tm.pen.push(id);
  tm.closer = staff.pen[0] || 0; tm.setup = staff.pen[1] || 0;
  tm.pit = mkPit(st.p, true, null, side);
  tm.pl.push(tm.pit); tm.used.add(st.p.id);
  calcDef(tm);
  return tm;
}
function calcDef(tm) {
  let z = 0;
  for (const pos of FPOS) { const b = tm.def[pos]; z += DEFW[pos] * (((b ? b.fld : 20) - 50) / 15); }
  tm.zdef = z / DEFWS;
  tm.zc = tm.def.C ? (tm.def.C.fld - 50) / 15 : -1.5;
}
function newGame(h, a, po, log) {
  const G = {
    h, a, po: po ? 1 : 0, inn: 1, top: 1, outs: 0, b: 0, s: 0, bases: [null, null, null], sc: [0, 0], ln: [[0], []],
    tm: [], log: log ? [] : null, done: false, inPA: false, newHalf: true, wc: [null, null], lc: [null, null],
    pitches: [], steal: 0, bat: null, pit: null, last: null, ev: 0,
  };
  G.tm[0] = setupSide(G, a, 0, pickStarter(a));
  G.tm[1] = setupSide(G, h, 1, pickStarter(h));
  addLog(G, 'i', 'Top 1st');
  return G;
}
function addLog(G, k, t) {
  G.ev++;
  if (!G.log) return;
  G.log.push({ k, t, inn: G.inn, top: G.top, sc: [G.sc[0], G.sc[1]] });
  if (G.log.length > 400) G.log.shift();
}
function ordn(n) { return n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'); }
function fatigue(pt) { return Math.max(0, (pt.pc - 0.68 * pt.maxP) / (0.45 * pt.maxP)); }

function availPen(G, tm, loose) {
  const out = [];
  for (const id of tm.pen) {
    if (tm.used.has(id)) continue;
    const p = P(id);
    if (!p || p.tid !== tm.tid || p.inj || p.fm) continue;
    if (!loose && (!restOK(p) || tm.rotIds.has(id))) continue;
    if (loose && p.fat > 70) continue;
    out.push(p);
  }
  return out;
}
function streak(p) { return p.ld === S.day - 1 ? (p.cd || 0) : 0; }
function restOK(p) { return p.fat <= 26 && streak(p) < 2; }
function choosePen(G, tm, lead) {
  let av = availPen(G, tm, false);
  if (!av.length) av = availPen(G, tm, true);
  if (!av.length) return null;
  const inn = G.inn;
  const has = (id) => av.find((p) => p.id === id);
  const mid = av.filter((p) => p.id !== tm.closer && p.id !== tm.setup);
  if (inn >= 9 && lead >= 1 && lead <= 3 && has(tm.closer)) return has(tm.closer);
  if (inn >= 9 && lead === 0 && !tm.side && has(tm.closer)) return has(tm.closer);
  if (inn >= 10 && Math.abs(lead) <= 1) return has(tm.closer) || has(tm.setup) || bestOf(mid) || av[0];
  if (inn >= 8 && lead >= 0 && lead <= 3) return has(tm.setup) || bestOf(mid) || av[0];
  if (inn <= 5) {
    const lg = (mid.length ? mid : av).slice().sort((a, b) => (b.r.sta * 0.7 + b.ovr * 0.3) - (a.r.sta * 0.7 + a.ovr * 0.3))[0];
    if (lg) lg._long = 1;
    return lg;
  }
  if (Math.abs(lead) >= 5) return (mid.length ? mid : av).slice().sort((a, b) => a.ovr - b.ovr)[0];
  return (mid.length ? wpick(mid, (p) => Math.pow(Math.max(1, p.ovr - 30), 2) * (p.ld === S.day - 1 ? 0.35 : 1)) : av[0]);
}
function bestOf(arr) { return arr.length ? arr.slice().sort((a, b) => b.ovr - a.ovr)[0] : null; }
function changePitcher(G, tm, p, why) {
  const old = tm.pit;
  const lead = G.sc[tm.side] - G.sc[1 - tm.side];
  if (!old.sp && old.save && !old.bs && lead > 0 && old.s[PX.outs] > 0) old.hold = true;
  const np = mkPit(p, false, G, tm.side);
  if (p._long) { np.long = true; delete p._long; }
  tm.pit = np; tm.pl.push(np); tm.used.add(p.id);
  addLog(G, 's', `Pitching change: ${p.fn[0]}. ${p.ln} replaces ${old.p.fn[0]}. ${old.p.ln}` + (why ? '' : ''));
}
function aiPitch(G, def) {
  const pt = def.pit;
  const side = def.side;
  const lead = G.sc[side] - G.sc[1 - side];
  if (def.pendP) {
    const id = def.pendP; def.pendP = 0;
    const p = P(id);
    if (p && !def.used.has(id) && p.tid === def.tid && !p.inj) { changePitcher(G, def, p); return; }
  }
  const f = fatigue(pt), inn = G.inn;
  const risp = !!(G.bases[1] || G.bases[2]);
  const nh = G.newHalf && G.outs === 0;
  let pull = false;
  if (pt.sp) {
    if (pt.pc >= pt.maxP) pull = true;
    else if (f > 0.55) pull = true;
    else if (pt.R >= 7 || (pt.R >= 5 && inn <= 4) || (pt.R >= 6 && inn <= 6)) pull = true;
    else if (inn >= 6 && f > 0.25 && risp && Math.abs(lead) <= 2) pull = true;
    else if (nh && inn >= 8 && f > 0.12 && !(pt.R <= 1 && pt.pc < pt.maxP * 0.92)) pull = true;
    else if (nh && inn >= 9 && lead >= 1 && lead <= 3 && !(pt.R <= 1 && pt.pc < pt.maxP * 0.88)) pull = true;
  } else {
    const ro = pt.s[PX.outs];
    if (pt.pc >= pt.maxP) pull = true;
    else if (nh && ro >= 3 && !(pt.long && pt.pc < pt.maxP * 0.7) && !(ro < 6 && pt.pc <= 15 && pt.maxP - pt.pc > 14 && (Math.abs(lead) >= 3 || inn <= 6))) pull = true;
    else if (pt.R >= 3 && pt.pc > 18) pull = true;
    else if (f > 0.6) pull = true;
  }
  if (!pull && nh && inn >= 9 && lead >= 1 && lead <= 3 && pt.id !== def.closer && def.closer && !def.used.has(def.closer) && !(pt.sp && pt.R <= 1 && pt.pc < pt.maxP * 0.88)) {
    const c = P(def.closer); if (c && !c.inj && restOK(c) && c.tid === def.tid) pull = true;
  }
  if (!pull && nh && inn === 8 && lead >= 1 && lead <= 3 && pt.sp && f > 0.05) pull = true;
  if (!pull) return;
  const np = choosePen(G, def, lead);
  if (!np) return;
  changePitcher(G, def, np);
}
function beginPA(G, off, def) {
  if (off.pendH) {
    const id = off.pendH; off.pendH = 0;
    const p = P(id);
    const cur = off.lu[off.bi];
    if (p && off.bench.includes(id)) {
      const b = mkBat(p, cur.pos, cur.seq);
      off.bench = off.bench.filter((x) => x !== id);
      cur.out = true;
      off.lu[off.bi] = b; off.bl.splice(off.bl.indexOf(cur) + 1, 0, b);
      if (cur.pos !== 'DH') { off.def[cur.pos] = b; calcDef(off); }
      addLog(G, 's', `Pinch hitter: ${p.fn[0]}. ${p.ln} for ${cur.p.fn[0]}. ${cur.p.ln}`);
    }
  }
  aiPitch(G, def);
  G.newHalf = false;
  G.bat = off.lu[off.bi];
  G.pit = def.pit;
  G.b = 0; G.s = 0; G.inPA = true; G.pitches = [];
  G.pit.s[PX.bf]++;
  G.steal = 0;
  const diff = Math.abs(G.sc[0] - G.sc[1]);
  const r1 = G.bases[0], r2 = G.bases[1];
  if (r1 && !r2 && G.outs < 2 && r1.b.spd >= 55 && diff <= 4) {
    const z = (r1.b.spd - 50) / 15;
    if (rnd() < clamp(K.stA * z, 0, 0.3)) G.steal = ri(1, 3) * 10 + 1;
  } else if (r2 && !G.bases[2] && G.outs < 2 && r2.b.spd >= 65 && diff <= 3) {
    const z = (r2.b.spd - 50) / 15;
    if (rnd() < clamp(K.stA * 0.22 * z, 0, 0.1)) G.steal = ri(1, 2) * 10 + 2;
  }
}
function step(G) {
  if (G.done) return;
  const off = G.tm[G.top ? 0 : 1], def = G.tm[G.top ? 1 : 0];
  if (!G.inPA) beginPA(G, off, def);
  // steal attempt before this pitch
  if (G.steal && Math.floor(G.steal / 10) === G.pitches.length + 1) {
    const from = (G.steal % 10) - 1;
    G.steal = 0;
    const r = G.bases[from];
    if (r) {
      const z = (r.b.spd - 50) / 15;
      const succ = clamp(K.stS + 0.07 * z - 0.06 * def.zc - (from ? 0.05 : 0), 0.4, 0.95);
      if (rnd() < succ) {
        G.bases[from + 1] = r; G.bases[from] = null; r.b.s[BX.sb]++;
        addLog(G, 'r', `${r.b.p.ln} steals ${from ? 'third' : 'second'}`);
      } else {
        G.bases[from] = null; r.b.s[BX.cs]++;
        G.outs++; G.pit.s[PX.outs]++;
        addLog(G, 'r', `${r.b.p.ln} caught stealing ${from ? 'third' : 'second'}`);
        if (G.outs >= 3) { G.pit.s[PX.bf]--; G.inPA = false; endHalf(G); return; }
      }
    }
  }
  pitch(G, off, def);
}
const ZA = [[0, -0.02, -0.12], [0.02, 0, -0.08], [0.06, 0.03, -0.03], [0.18, 0.08, 0.05]];
const SA = [[-0.18, 0, 0.2], [-0.04, 0.02, 0.2], [-0.05, 0.03, 0.2], [-0.55, -0.06, 0.18]];
const CA = [[-0.08, 0, 0.12], [-0.03, 0.02, 0.12], [-0.05, 0.01, 0.12], [-0.25, -0.08, 0.1]];
function pitch(G, off, def) {
  const pt = G.pit, bt = G.bat;
  const f = fatigue(pt);
  const vel = pt.vel - 8 * f, ctl = pt.ctl - 10 * f, mov = pt.mov - 8 * f;
  let con = bt.con, pow = bt.pow;
  const eye = bt.eye;
  if (bt.bats !== 'S' && bt.bats === pt.thr) { con -= K.plC; pow -= K.plP; } else { con += 1; pow += 1; }
  if (pt.sp) { const tto = Math.floor((pt.s[PX.bf] - 1) / 9); if (tto >= 2) { con += K.tto * (tto - 1); pow += K.tto * (tto - 1); } }
  const zc = sz(ctl), zv = sz(vel), zm = sz(mov);
  const zcon = sz(con), zpow = sz(pow), zeye = sz(eye);
  const b = G.b, s = G.s;
  pt.pc++;
  pt.s[PX.pc]++;
  const inZ = rnd() < clamp(K.zone + 0.045 * zc + ZA[b][s], 0.22, 0.85);
  let res;
  const swing = rnd() < (inZ ? clamp(K.zsw + 0.03 * zeye + SA[b][s], 0.04, 0.98) : clamp(K.chase - 0.05 * zeye + 0.03 * zm + CA[b][s], 0.02, 0.9));
  if (swing) {
    const ct = inZ ? clamp(K.zct + 0.045 * zcon - 0.035 * zv - 0.02 * zm, 0.5, 0.98) : clamp(K.oct + 0.07 * zcon - 0.045 * zv - 0.035 * zm, 0.25, 0.92);
    if (rnd() < ct) res = rnd() < (inZ ? K.zfoul : K.ofoul) ? 'F' : 'X';
    else res = 'W';
  } else if (inZ) res = rnd() < 0.02 ? 'B' : 'K';
  else {
    if (rnd() < K.hbp) res = 'H';
    else res = rnd() < K.frame + 0.012 * def.zc ? 'K' : 'B';
  }
  // pitch display info
  const pk = pickPitchType(pt);
  const mph = Math.round(88.5 + (pt.vel - 50) * 0.2 + PSPD[pk] - 2 * f + gauss(0, 0.8));
  let x, y;
  if (inZ || res === 'K') { x = gauss(0, 0.45); y = gauss(0, 0.45); x = clamp(x, -0.95, 0.95); y = clamp(y, -0.95, 0.95); }
  else { const a = rnd() * Math.PI * 2; const rr = 1.15 + rnd() * 0.6; x = Math.cos(a) * rr; y = Math.sin(a) * rr; }
  G.pitches.push({ x, y, r: res, v: mph, t: pk });
  const pName = PITCH[pk];
  const lt = (txt) => addLog(G, 'p', `${mph} ${pName}, ${txt}`);
  if (res === 'B') {
    G.b++;
    if (G.b >= 4) { if (G.log) lt('ball four'); walk(G, off, def, false); return; }
    if (G.log) lt('ball');
    if (G.bases.some(Boolean) && rnd() < K.wp - 0.0015 * zc) wildPitch(G, off);
    return;
  }
  if (res === 'H') { if (G.log) lt('hit by pitch'); walk(G, off, def, true); return; }
  if (res === 'K' || res === 'W') {
    G.s++;
    if (G.s >= 3) {
      if (G.log) lt(res === 'K' ? 'called strike three' : 'swinging strike three');
      bt.s[BX.ab]++; bt.s[BX.so]++; pt.s[PX.so]++;
      outRec(G, 1);
      endPA(G, off, def, `${bt.p.ln} strikes out ${res === 'K' ? 'looking' : 'swinging'}`, 'K');
      return;
    }
    if (G.log) lt(res === 'K' ? 'called strike' : 'swinging strike');
    return;
  }
  if (res === 'F') { if (G.s < 2) G.s++; if (G.log) lt('foul'); return; }
  if (G.log) lt('in play');
  inPlay(G, off, def, zcon, zpow, zv, zm);
}
function sz(r) { const z = (r - 50) / 15; return z > 1.4 ? 1.4 + (z - 1.4) * 0.45 : z < -1.8 ? -1.8 + (z + 1.8) * 0.5 : z; }
function pickPitchType(pt) {
  const rep = pt.rep;
  if (rnd() < 0.52) return rep[0];
  return rep[1 + Math.floor(rnd() * (rep.length - 1))] || rep[0];
}
function outRec(G, n) { G.outs += n; G.pit.s[PX.outs] += n; }
function walk(G, off, def, hbp) {
  const bt = G.bat, pt = G.pit;
  if (hbp) bt.s[BX.hbp]++; else { bt.s[BX.bb]++; pt.s[PX.bb]++; }
  const runner = { b: bt, rp: pt, ue: false };
  const notes = [];
  // forced advances
  if (G.bases[0]) {
    if (G.bases[1]) {
      if (G.bases[2]) { const r = G.bases[2]; scoreRun(G, r, bt); notes.push(`${r.b.p.ln} scores`); }
      G.bases[2] = G.bases[1];
    }
    G.bases[1] = G.bases[0];
  }
  G.bases[0] = runner;
  endPA(G, off, def, `${bt.p.ln} ${hbp ? 'is hit by a pitch' : 'walks'}` + (notes.length ? '. ' + notes.join('. ') : ''), hbp ? 'HBP' : 'BB');
}
function wildPitch(G, off) {
  const notes = [];
  if (G.bases[2]) { const r = G.bases[2]; scoreRun(G, r, null); notes.push(`${r.b.p.ln} scores`); G.bases[2] = null; }
  if (G.bases[1]) { G.bases[2] = G.bases[1]; G.bases[1] = null; }
  if (G.bases[0]) { G.bases[1] = G.bases[0]; G.bases[0] = null; }
  addLog(G, 'r', 'Wild pitch' + (notes.length ? '. ' + notes.join('. ') : '. Runners advance'));
  checkWalkoff(G);
  void off;
}
function scoreRun(G, r, rbiB) {
  const side = G.top ? 0 : 1;
  const before = G.sc[side] - G.sc[1 - side];
  G.sc[side]++;
  const ln = G.ln[side]; ln[ln.length - 1]++;
  r.b.s[BX.r]++;
  r.rp.s[PX.r]++; r.rp.R++;
  if (!r.ue) r.rp.s[PX.er]++;
  if (rbiB) rbiB.s[BX.rbi]++;
  const after = before + 1;
  if (before === 0 && after === 1) { G.wc[side] = G.tm[side].pit; G.lc[1 - side] = r.rp; }
  if (before === -1 && after === 0) {
    const dp = G.tm[1 - side].pit;
    if (dp.save && !dp.sp) dp.bs = true;
  }
}
function checkWalkoff(G) {
  if (!G.top && G.inn >= 9 && G.sc[1] > G.sc[0]) { G.inPA = false; endGame(G); return true; }
  return false;
}
const GBF = [['SS', 30], ['2B', 27], ['3B', 25], ['1B', 13], ['P', 5]];
const FBF = [['LF', 30], ['CF', 38], ['RF', 32]];
const IFP = [['SS', 25], ['2B', 22], ['3B', 22], ['1B', 16], ['C', 15]];
const DIR = { LF: 'left', CF: 'center', RF: 'right' };
function inPlay(G, off, def, zcon, zpow, zv, zm) {
  const bt = G.bat, pt = G.pit;
  const fb = K.fb + 0.045 * zpow - 0.035 * zm, ld = K.ld + 0.015 * zcon;
  const x = rnd();
  const type = x < 1 - fb - ld ? 'G' : x < 1 - fb ? 'L' : 'F';
  const zd = def.zdef, zs = (bt.spd - 50) / 15;
  let hit = 0;
  if (type === 'F') {
    const hr = K.hrfb * Math.exp(0.4 * zpow - 0.15 * zv - 0.2 * zm);
    if (rnd() < hr) { homeRun(G, off, def); return; }
    if (rnd() < K.ifp) { // infield fly
      const fp = wpick(IFP, (q) => q[1])[0];
      bt.s[BX.ab]++; outRec(G, 1);
      endPA(G, off, def, `${bt.p.ln} pops out to ${POSNAME[fp]}`, 'PO');
      return;
    }
    if (rnd() < K.fbH + 0.02 * zpow + 0.01 * zcon - 0.03 * zd) hit = rnd() < 0.42 ? 2 : rnd() < 0.14 + 0.04 * zs ? 3 : 1;
  } else if (type === 'L') {
    if (rnd() < K.ldH + 0.03 * zcon - 0.025 * zd) { const y = rnd(); hit = y < 0.015 + 0.01 * zs ? 3 : y < 0.27 + 0.03 * zpow ? 2 : 1; }
  } else if (rnd() < K.gbH + 0.02 * zcon + 0.03 * zs - 0.035 * zd) hit = rnd() < 0.06 + 0.01 * zs ? 2 : 1;
  if (hit) { safeHit(G, off, def, hit, type); return; }
  // out (or error)
  const fpos = type === 'G' ? wpick(GBF, (q) => q[1])[0] : type === 'F' ? wpick(FBF, (q) => q[1])[0] : wpick(GBF.concat(FBF), (q) => q[1])[0];
  const fl = def.def[fpos];
  const zf = fl ? (fl.fld - 50) / 15 : 0;
  if (rnd() < K.err - 0.006 * zf) { reachOnError(G, off, def, fpos, type); return; }
  bt.s[BX.ab]++;
  const notes = [];
  const where = POSNAME[fpos];
  if (type === 'G') {
    if (G.bases[0] && G.outs < 2) {
      const dpP = clamp(K.dp - 0.06 * zs + 0.05 * zd, 0.1, 0.8);
      if (rnd() < dpP) {
        G.bases[0] = null;
        outRec(G, 2);
        bt.s[BX.ab] += 0;
        if (G.outs < 3) {
          if (G.bases[2]) { const r = G.bases[2]; scoreRun(G, r, null); notes.push(`${r.b.p.ln} scores`); G.bases[2] = null; }
          if (G.bases[1]) { G.bases[2] = G.bases[1]; G.bases[1] = null; }
        }
        endPA(G, off, def, `${bt.p.ln} grounds into a double play` + (notes.length ? '. ' + notes.join('. ') : ''), 'DP');
        return;
      }
      if (rnd() < 0.32) { // fielder's choice, lead runner out
        const lead = G.bases[0];
        outRec(G, 1);
        if (G.outs < 3) {
          if (G.bases[2] && G.bases[1]) { const r = G.bases[2]; scoreRun(G, r, bt); notes.push(`${r.b.p.ln} scores`); G.bases[2] = G.bases[1]; G.bases[1] = null; }
          else if (G.bases[1]) { G.bases[2] = G.bases[1]; G.bases[1] = null; }
        }
        G.bases[0] = { b: bt, rp: pt, ue: false };
        endPA(G, off, def, `${bt.p.ln} reaches on a fielder's choice, ${lead.b.p.ln} out at second` + (notes.length ? '. ' + notes.join('. ') : ''), 'FC');
        return;
      }
    }
    outRec(G, 1);
    if (G.outs < 3) {
      if (G.bases[2] && rnd() < (G.bases[1] && G.bases[0] ? 0.9 : 0.5)) { const r = G.bases[2]; scoreRun(G, r, bt); notes.push(`${r.b.p.ln} scores`); G.bases[2] = null; }
      if (G.bases[1] && !G.bases[2] && (G.bases[0] || rnd() < 0.55)) { G.bases[2] = G.bases[1]; G.bases[1] = null; notes.push(`${G.bases[2].b.p.ln} to third`); }
      if (G.bases[0] && !G.bases[1]) { G.bases[1] = G.bases[0]; G.bases[0] = null; }
    }
    endPA(G, off, def, `${bt.p.ln} grounds out to ${where}` + (notes.length ? '. ' + notes.join('. ') : ''), 'GO');
    return;
  }
  if (type === 'F') {
    outRec(G, 1);
    let sf = false;
    if (G.outs < 3) {
      if (G.bases[2]) {
        const r = G.bases[2];
        if (rnd() < clamp(0.55 + 0.1 * (r.b.spd - 50) / 15, 0.2, 0.9)) { scoreRun(G, r, bt); G.bases[2] = null; sf = true; notes.push(`${r.b.p.ln} scores`); }
      }
      if (G.bases[1] && !G.bases[2] && rnd() < 0.25) { G.bases[2] = G.bases[1]; G.bases[1] = null; notes.push(`${G.bases[2].b.p.ln} to third`); }
    }
    if (sf) { bt.s[BX.ab]--; bt.s[BX.sf]++; }
    endPA(G, off, def, `${bt.p.ln} ${sf ? 'hits a sacrifice fly to' : 'flies out to'} ${where}` + (notes.length ? '. ' + notes.join('. ') : ''), sf ? 'SF' : 'FO');
    return;
  }
  outRec(G, 1);
  if (G.outs < 3 && G.bases[0] && rnd() < 0.06) {
    const r = G.bases[0]; G.bases[0] = null; outRec(G, 1);
    endPA(G, off, def, `${bt.p.ln} lines out to ${where}. ${r.b.p.ln} doubled off first`, 'DP');
    return;
  }
  endPA(G, off, def, `${bt.p.ln} lines out to ${where}`, 'LO');
}
function reachOnError(G, off, def, fpos, type) {
  const bt = G.bat, pt = G.pit;
  bt.s[BX.ab]++;
  def.E++;
  const notes = [];
  if (G.bases[2]) { const r = G.bases[2]; scoreRun(G, r, null); notes.push(`${r.b.p.ln} scores`); }
  G.bases[2] = G.bases[1]; G.bases[1] = G.bases[0];
  G.bases[0] = { b: bt, rp: pt, ue: true };
  endPA(G, off, def, `${bt.p.ln} reaches on an error by the ${POSNAME[fpos] === 'short' ? 'shortstop' : fposName(fpos)}` + (notes.length ? '. ' + notes.join('. ') : ''), 'E');
  void type;
}
function fposName(f) { return ({ C: 'catcher', '1B': 'first baseman', '2B': 'second baseman', '3B': 'third baseman', SS: 'shortstop', LF: 'left fielder', CF: 'center fielder', RF: 'right fielder', P: 'pitcher' })[f]; }
function homeRun(G, off, def) {
  const bt = G.bat, pt = G.pit;
  bt.s[BX.ab]++; bt.s[BX.h]++; bt.s[BX.hr]++;
  pt.s[PX.h]++; pt.s[PX.hr]++;
  off.H++;
  let n = 0;
  for (let i = 2; i >= 0; i--) if (G.bases[i]) { scoreRun(G, G.bases[i], bt); G.bases[i] = null; n++; }
  scoreRun(G, { b: bt, rp: pt, ue: false }, bt);
  const dir = pick(['left', 'left-center', 'center', 'right-center', 'right']);
  const kind = n === 3 ? 'a grand slam' : n === 2 ? 'a three-run homer' : n === 1 ? 'a two-run homer' : 'a solo homer';
  endPA(G, off, def, `${bt.p.ln} hits ${kind} to ${dir}`, 'HR');
}
function safeHit(G, off, def, n, type) {
  const bt = G.bat, pt = G.pit;
  bt.s[BX.ab]++; bt.s[BX.h]++;
  if (n === 2) bt.s[BX.d]++;
  if (n === 3) bt.s[BX.t]++;
  pt.s[PX.h]++;
  off.H++;
  const notes = [];
  const two = G.outs === 2;
  const nb = [null, null, null];
  const sc = (r) => { scoreRun(G, r, bt); notes.push(`${r.b.p.ln} scores`); };
  const zs = (r) => (r.b.spd - 50) / 15;
  if (n === 3) {
    for (let i = 2; i >= 0; i--) if (G.bases[i]) sc(G.bases[i]);
    nb[2] = { b: bt, rp: pt, ue: false };
  } else if (n === 2) {
    if (G.bases[2]) sc(G.bases[2]);
    if (G.bases[1]) sc(G.bases[1]);
    if (G.bases[0]) {
      const r = G.bases[0];
      if (rnd() < clamp(0.42 + 0.1 * zs(r) + (two ? 0.2 : 0), 0.1, 0.92)) sc(r); else { nb[2] = r; notes.push(`${r.b.p.ln} to third`); }
    }
    nb[1] = { b: bt, rp: pt, ue: false };
  } else {
    if (G.bases[2]) sc(G.bases[2]);
    if (G.bases[1]) {
      const r = G.bases[1];
      if (rnd() < clamp(0.6 + 0.1 * zs(r) + (two ? 0.2 : 0) - (type === 'G' ? 0.2 : 0), 0.1, 0.95)) sc(r); else nb[2] = r;
    }
    if (G.bases[0]) {
      const r = G.bases[0];
      if (!nb[2] && rnd() < clamp(0.27 + 0.08 * zs(r) - (type === 'G' ? 0.1 : 0), 0.03, 0.6)) { nb[2] = r; notes.push(`${r.b.p.ln} to third`); } else nb[1] = r;
    }
    nb[0] = { b: bt, rp: pt, ue: false };
  }
  G.bases = nb;
  let dir;
  if (type === 'G') dir = n === 1 ? pick(['to left', 'to center', 'to right', 'through the left side', 'up the middle', 'through the right side', 'on an infield hit']) : pick(['down the left-field line', 'down the right-field line']);
  else dir = 'to ' + pick(['left', 'left-center', 'center', 'right-center', 'right']);
  const verb = n === 3 ? 'triples' : n === 2 ? 'doubles' : 'singles';
  endPA(G, off, def, `${bt.p.ln} ${verb} ${dir}` + (notes.length ? '. ' + notes.join('. ') : ''), n === 3 ? '3B' : n === 2 ? '2B' : '1B');
}
function endPA(G, off, def, text, kind) {
  G.last = kind;
  addLog(G, 'r', text + (G.outs >= 3 ? '' : G.outs && /out|strikes|double play|fielder|caught|pops|flies|lines|sacrifice/.test(text) ? `. ${G.outs} out` : ''));
  G.inPA = false;
  off.bi = (off.bi + 1) % off.lu.length;
  if (G.done) return;
  if (checkWalkoff(G)) return;
  if (G.outs >= 3) endHalf(G);
  void def;
}
function endHalf(G) {
  const off = G.tm[G.top ? 0 : 1];
  off.LOB += G.bases.filter(Boolean).length;
  G.bases = [null, null, null]; G.outs = 0; G.inPA = false; G.b = 0; G.s = 0; G.steal = 0;
  if (G.top) {
    if (G.inn >= 9 && G.sc[1] > G.sc[0]) { endGame(G); return; }
    G.top = 0; G.ln[1].push(0);
  } else {
    if (G.inn >= 9 && G.sc[0] !== G.sc[1]) { endGame(G); return; }
    G.top = 1; G.inn++; G.ln[0].push(0);
  }
  G.newHalf = true;
  addLog(G, 'i', (G.top ? 'Top ' : 'Bottom ') + ordn(G.inn));
  if (G.inn >= 10) {
    const o = G.tm[G.top ? 0 : 1], d = G.tm[G.top ? 1 : 0];
    const b = o.lu[(o.bi + o.lu.length - 1) % o.lu.length];
    G.bases[1] = { b, rp: d.pit, ue: true };
    addLog(G, 'r', `${b.p.ln} starts the inning on second`);
  }
}
function endGame(G) {
  G.done = true;
  const w = G.sc[1] > G.sc[0] ? 1 : 0, l = 1 - w;
  const wt = G.tm[w], lt = G.tm[l];
  let wp = G.wc[w] || wt.pl[0];
  if (wp === wt.pl[0] && wp.s[PX.outs] < 15 && wt.pl.length > 1) {
    const rel = wt.pl.slice(1).sort((a, b) => (b.s[PX.outs] - b.s[PX.r] * 3) - (a.s[PX.outs] - a.s[PX.r] * 3))[0];
    wp = rel;
  }
  wp.s[PX.dec] |= DEC.W;
  const lp = G.lc[l] || lt.pl[0];
  lp.s[PX.dec] |= DEC.L;
  const fin = wt.pit;
  if (fin !== wp && !fin.sp && !fin.bs && ((fin.save && (fin.s[PX.outs] >= 3 || fin.eLead <= fin.eRun + 1)) || (fin.eLead >= 1 && fin.s[PX.outs] >= 9))) fin.s[PX.dec] |= DEC.S;
  for (const tm of G.tm) for (const pt of tm.pl) {
    if (pt.hold && !(pt.s[PX.dec] & (DEC.W | DEC.S))) pt.s[PX.dec] |= DEC.H;
    if (pt.bs) pt.s[PX.dec] |= DEC.BS;
  }
  addLog(G, 'i', 'Final');
}
function playToEnd(G) { let n = 0; while (!G.done && n < 5000) { step(G); n++; } }
function result(G) {
  const box = G.tm.map((tm) => ({
    b: tm.bl.map((b) => [b.id, BPOS.indexOf(b.pos)].concat(b.s)),
    p: tm.pl.map((pt) => [pt.id].concat(pt.s)),
    lob: tm.LOB,
  }));
  return { hs: G.sc[1], as: G.sc[0], ln: [G.ln[0].slice(), G.ln[1].slice()], hits: [G.tm[0].H, G.tm[1].H], err: [G.tm[0].E, G.tm[1].E], box, inn: G.inn, si: [G.tm[0].si, G.tm[1].si] };
}
function simGame(h, a, po) {
  const G = newGame(h, a, po, false);
  playToEnd(G);
  return result(G);
}

/* ---------------- season stats ---------------- */
function statRow(p, tid, po) {
  let r = p.s.length ? p.s[p.s.length - 1] : null;
  if (!r || r.y !== S.season || r.t !== tid || r.po !== po) {
    r = p.s.find((x) => x.y === S.season && x.t === tid && x.po === po);
    if (!r) { r = { y: S.season, t: tid, po }; for (const k of (isP(p) ? SFP : SFB)) r[k] = 0; p.s.push(r); }
  }
  return r;
}
function applyBox(res, h, a, po) {
  [a, h].forEach((tid, side) => {
    const bx = res.box[side];
    const opp = side ? res.as : res.hs;
    const seen = new Set();
    for (const l of bx.b) {
      const p = P(l[0]); if (!p || isP(p)) continue;
      const r = statRow(p, tid, po);
      if (!seen.has(p.id)) { r.g++; seen.add(p.id); }
      const s = l.slice(2);
      r.ab += s[BX.ab]; r.r += s[BX.r]; r.h += s[BX.h]; r.d += s[BX.d]; r.tr += s[BX.t]; r.hr += s[BX.hr]; r.rbi += s[BX.rbi];
      r.bb += s[BX.bb]; r.so += s[BX.so]; r.sb += s[BX.sb]; r.cs += s[BX.cs]; r.hbp += s[BX.hbp]; r.sf += s[BX.sf];
      r.pa += s[BX.ab] + s[BX.bb] + s[BX.hbp] + s[BX.sf];
      if (tid === S.user) p.ut = 1;
    }
    bx.p.forEach((l, i) => {
      const p = P(l[0]); if (!p) return;
      if (!isP(p)) return;
      const r = statRow(p, tid, po);
      const s = l.slice(1);
      r.g++;
      if (i === 0) { r.gs++; if (bx.p.length === 1) { r.cg++; if (opp === 0) r.sho++; } }
      const d = s[PX.dec];
      if (d & DEC.W) r.w++; if (d & DEC.L) r.l++; if (d & DEC.S) r.sv++; if (d & DEC.H) r.hld++; if (d & DEC.BS) r.bs++;
      r.outs += s[PX.outs]; r.h += s[PX.h]; r.r += s[PX.r]; r.er += s[PX.er]; r.bb += s[PX.bb]; r.so += s[PX.so]; r.hr += s[PX.hr]; r.bf += s[PX.bf]; r.pc += s[PX.pc];
      if (tid === S.user) p.ut = 1;
    });
  });
}

/* ---------------- fatigue & injuries ---------------- */
function postGame(res, h, a) {
  [a, h].forEach((tid, side) => {
    const bx = res.box[side];
    for (const l of bx.p) {
      const p = P(l[0]); if (!p) continue;
      const pc = l[1 + PX.pc];
      const f0 = p.fat || 0;
      p.fat = Math.min(100, f0 + pc * 0.85);
      p.cd = p.ld === S.day - 1 ? (p.cd || 0) + 1 : 1;
      p.ld = S.day;
      if (!p.inj && rnd() < (pc / 100) * 0.0055 * (1 + f0 / 40) * (1 + Math.max(0, age(p) - 31) * 0.06)) injure(p, tid, PINJ);
    }
    for (const l of bx.b) {
      const p = P(l[0]); if (!p || p.inj) continue;
      if (rnd() < 0.0017 * (1 + Math.max(0, age(p) - 31) * 0.06)) injure(p, tid, BINJ);
    }
  });
}
function injure(p, tid, list) {
  const it = wpick(list, (x) => x[1]);
  const d = ri(it[2], it[3]);
  p.inj = { t: it[0], d };
  if (d > 100) {
    const k = isP(p) ? 'vel' : 'spd';
    p.r[k] = Math.max(10, p.r[k] - ri(1, 4)); p.ovr = calcOvr(p);
  }
  if (tid === S.user || d >= 40) news('inj', `${T(tid).abbr} ${nm(p)}: ${it[0]}, ${d} days`, tid);
  if (tid === S.user && !T(tid).auto) fixLineup(tid);
}
function dayStart() {
  if (S.prep === S.day + (S.phase === 'playoffs' ? 1000 : 0)) return;
  S.prep = S.day + (S.phase === 'playoffs' ? 1000 : 0);
  for (const p of S.players) {
    if (p.tid < -1) continue;
    if (p.fat) p.fat = Math.max(0, p.fat - (12 + (p.r.sta || 30) * 0.1));
    if (p.inj) { p.inj.d--; if (p.inj.d <= 0) { p.inj = null; if (p.tid === S.user) news('inj', `${nm(p)} returns from injury`, S.user); } }
  }
}
function news(type, text, tid) {
  S.news.unshift({ y: S.season, d: S.day, ph: S.phase, type, text, tid: tid == null ? -1 : tid });
  if (S.news.length > 160) S.news.length = 160;
}

/* ---------------- finances ---------------- */
function homeGameFinance(tid, po) {
  const t = T(tid);
  const demand = 17000 + 15000 * t.hype + 1600 * Math.sqrt(t.pop) + (po ? 9000 : 0);
  const priceF = Math.pow(40 / t.ticket, 1.2);
  const att = Math.round(clamp(demand * priceF, 5000, 45000));
  const gate = att * t.ticket / 1000;
  const merch = (0.5 + 0.6 * t.hype) * (150 + 60 * Math.sqrt(t.pop)) * (po ? 1.5 : 1);
  t.fin.att += att; t.fin.hg++;
  if (po) t.fin.po += gate + merch; else { t.fin.gate += gate; t.fin.merch += merch; }
}
function gameFinance(tid) {
  const t = T(tid);
  t.fin.tv += (62000 + 2600 * t.pop) / 162;
  t.fin.sal += payroll(tid, S.season) / 162;
  t.fin.ops += 30000 / 162;
}

/* ---------------- day loop ---------------- */
function recordGame(g, res, po) {
  const gid = S.nextGid++;
  g.g = gid;
  const mine = g.h === S.user || g.a === S.user;
  const rec = { id: gid, d: S.day, h: g.h, a: g.a, hs: res.hs, as: res.as, po: po ? 1 : 0, x: res.inn > 9 ? res.inn : 0, he: [res.hits[1], res.err[1]], ae: [res.hits[0], res.err[0]] };
  if (mine || po) { rec.ln = res.ln; rec.b = res.box; }
  S.games.push(rec);
  applyBox(res, g.h, g.a, po ? 1 : 0);
  postGame(res, g.h, g.a);
  [[g.a, 0], [g.h, 1]].forEach(([tid, side]) => { if (res.si[side] >= 0) T(tid).rotI = res.si[side] + 1; });
  homeGameFinance(g.h, po);
  if (!po) {
    gameFinance(g.h); gameFinance(g.a);
    const hw = res.hs > res.as;
    const H = T(g.h).rec, A = T(g.a).rec;
    const dv = T(g.h).div === T(g.a).div;
    if (hw) { H.w++; H.hw++; A.l++; if (dv) { H.dw++; A.dl++; } }
    else { A.w++; H.l++; H.hl++; if (dv) { A.dw++; H.dl++; } }
    H.rs += res.hs; H.ra += res.as; A.rs += res.as; A.ra += res.hs;
    for (const [rr, w] of [[H, hw], [A, !hw]]) {
      rr.l10.push(w ? 1 : 0); if (rr.l10.length > 10) rr.l10.shift();
      rr.str = w ? (rr.str > 0 ? rr.str + 1 : 1) : (rr.str < 0 ? rr.str - 1 : -1);
    }
    T(g.h).hype = clamp(T(g.h).hype + (hw ? 0.003 : -0.003), 0, 1);
    T(g.a).hype = clamp(T(g.a).hype + (hw ? -0.003 : 0.003), 0, 1);
  } else if (mine) {
    const uw = (g.h === S.user) === (res.hs > res.as);
    if (uw) S.career.pw++; else S.career.pl++;
  }
  return rec;
}
function userGameToday() {
  if (S.phase === 'regular') return S.sched.find((g) => g.d === S.day && !g.g && (g.h === S.user || g.a === S.user)) || null;
  if (S.phase === 'playoffs') {
    const r = curRound();
    if (r < 0) return null;
    const s = S.series.find((x) => x.r === r && x.win < 0 && (x.hi === S.user || x.lo === S.user));
    if (!s) return null;
    const gn = s.g.length;
    const hiHome = RWINS[s.r] === 2 ? true : [0, 1, 5, 6].includes(gn);
    return { h: hiHome ? s.hi : s.lo, a: hiHome ? s.lo : s.hi, po: 1, s: S.series.indexOf(s), gn: gn + 1 };
  }
  return null;
}
function liveStart() {
  const g = userGameToday();
  if (!g) return null;
  dayStart();
  const G = newGame(g.h, g.a, S.phase === 'playoffs', true);
  G.us = g.h === S.user ? 1 : 0;
  G.desc = g;
  return G;
}
function liveFinish(G) {
  playToEnd(G);
  S.pend = { h: G.h, a: G.a, res: result(G) };
  return simDay();
}
function takePend(h, a) {
  if (S.pend && S.pend.h === h && S.pend.a === a) { const r = S.pend.res; S.pend = null; return r; }
  return null;
}
function simDay() {
  if (S.phase === 'regular') {
    dayStart();
    const games = S.sched.filter((g) => g.d === S.day && !g.g);
    for (const g of games) { const res = takePend(g.h, g.a) || simGame(g.h, g.a, false); recordGame(g, res, false); }
    S.pend = null;
    dailyAI();
    S.day++;
    if (S.sched.every((g) => g.g)) endRegular();
    return games.length;
  }
  if (S.phase === 'playoffs') return playoffDay();
  return 0;
}

function dailyAI() {
  for (const t of S.teams) {
    if (t.tid === S.user) continue;
    aiRoster(t.tid);
  }
  if (S.phase === 'regular' && S.day < S.deadline && S.day % 4 === 2 && rnd() < 0.45) aiTrade();
}
function aiRoster(tid) {
  const t = T(tid);
  const act = active(tid);
  const hb = act.filter((p) => !isP(p) && !p.inj).length;
  const hp = act.filter((p) => isP(p) && !p.inj).length;
  const fill = (wantP) => aiFill(tid, wantP);
  let n = act.length;
  if (hb < 11 && n < ROSTER_MAX) { if (fill(false)) n++; }
  if (hp < 11 && n < ROSTER_MAX) { if (fill(true)) n++; }
  while (n < ROSTER_MIN) { if (!fill(hb < 12)) break; n++; }
  // too many: send the weakest healthy young player down or release
  let ps = active(tid);
  while (ps.length > ROSTER_MAX) {
    const w = ps.slice().sort((a, b) => valRating(a, t.strat) - valRating(b, t.strat))[0];
    if (age(w) <= 25 && farmCount(tid) < FARM_MAX) w.fm = 1; else releaseAI(w, tid);
    ps = active(tid);
  }
  // promote a farm player who is clearly better than the worst healthy regular of his kind
  if (S.day % 7 === 3) {
    for (const wantP of [false, true]) {
      const fm = farm(tid).filter((p) => isP(p) === wantP && !p.inj).sort((a, b) => b.ovr - a.ovr)[0];
      if (!fm) continue;
      const worst = active(tid).filter((p) => isP(p) === wantP && !p.inj).sort((a, b) => a.ovr - b.ovr)[0];
      if (worst && fm.ovr >= worst.ovr + 4) {
        fm.fm = 0;
        if (age(worst) <= 26 && farmCount(tid) < FARM_MAX) worst.fm = 1; else releaseAI(worst, tid);
        if (fm.ovr >= 55) news('promote', `${T(tid).abbr} call up ${nm(fm)}`, tid);
      }
    }
  }
}
function aiFill(tid, wantP) {
  const t = T(tid);
  const space = Math.max(0, t.budget - payroll(tid));
  const fm = farm(tid).filter((p) => isP(p) === wantP && !p.inj).sort((a, b) => b.ovr - a.ovr)[0];
  const fa = S.players.filter((p) => p.tid === -1 && !p.inj && isP(p) === wantP && askFor(p, tid, 1) <= Math.max(MINC * 2, space)).sort((a, b) => b.ovr - a.ovr)[0];
  if (fm && (!fa || fm.ovr >= fa.ovr - 3)) { fm.fm = 0; return true; }
  if (fa) { sign(fa, tid, askFor(fa, tid, 1), 1, true); return true; }
  return false;
}
function releaseAI(p, tid) {
  if (p.c.amt > MINC && p.c.exp >= payYear()) S.dead.push({ tid, amt: p.c.amt, exp: p.c.exp, name: nm(p) });
  p.tid = -1; p.fm = 0; p.ask = round50(marketValue(p));
}

/* ---------------- standings ---------------- */
function wp(r) { const g = r.w + r.l; return g ? r.w / g : 0; }
function standings(div) {
  const ts = S.teams.filter((t) => div == null || t.div === div);
  return ts.slice().sort((a, b) => {
    const d = wp(b.rec) - wp(a.rec); if (Math.abs(d) > 1e-9) return d;
    const h2 = headToHead(a.tid, b.tid); if (h2) return -h2;
    return (b.rec.rs - b.rec.ra) - (a.rec.rs - a.rec.ra);
  });
}
function headToHead(a, b) {
  let wa = 0, wb = 0;
  for (const g of S.games) {
    if (g.po) continue;
    if ((g.h === a && g.a === b) || (g.h === b && g.a === a)) {
      const winner = g.hs > g.as ? g.h : g.a;
      if (winner === a) wa++; else wb++;
    }
  }
  return wa - wb;
}

/* ---------------- awards ---------------- */
function seasonLine(p, po, y) {
  y = y == null ? S.season : y;
  const rows = p.s.filter((r) => r.y === y && r.po === (po ? 1 : 0));
  if (!rows.length) return null;
  const keys = isP(p) ? SFP : SFB;
  const o = {};
  for (const k of keys) o[k] = 0;
  for (const r of rows) for (const k of keys) o[k] += r[k];
  o.t = rows[rows.length - 1].t;
  return o;
}
function bVal(o) {
  // runs above average style batting value
  const pa = o.pa || 0;
  if (!pa) return 0;
  const tb = o.h + o.d + 2 * o.tr + 3 * o.hr;
  const obp = (o.h + o.bb + o.hbp) / Math.max(1, o.ab + o.bb + o.hbp + o.sf);
  const slg = tb / Math.max(1, o.ab);
  return ((obp * 1.8 + slg) - 1.0) * pa / 6 + o.sb * 0.2 - o.cs * 0.4;
}
function pVal(o) {
  const ip = o.outs / 3;
  if (!ip) return 0;
  const era = o.er * 9 / ip;
  return (4.4 - era) * ip / 9 + o.so * 0.012;
}
function isRookie(p) { return !p.vet && !p.s.some((r) => r.y < S.season && !r.po && (r.pa >= 130 || r.outs >= 150)); }
function doAwards() {
  const out = {};
  const games = Math.max(1, ...S.teams.map((t) => t.rec.w + t.rec.l));
  const twp = (tid) => (tid >= 0 ? wp(T(tid).rec) : 0.5);
  const bats = [], pits = [];
  for (const p of S.players) {
    if (p.tid === -3) continue;
    const o = seasonLine(p, false);
    if (!o) continue;
    if (isP(p)) { if (o.outs > 0) pits.push({ p, o }); }
    else if (o.pa > 0) bats.push({ p, o });
  }
  const best = (arr, f) => arr.slice().sort((a, b) => f(b) - f(a))[0];
  const fieldBonus = (p) => (p.r.fld - 50) * DW[p.pos] * 0.4;
  const mvp = best(bats.filter((x) => x.o.pa >= games * 3.1), (x) => bVal(x.o) + fieldBonus(x.p) + 12 * twp(x.o.t));
  const cy = best(pits.filter((x) => x.o.outs >= games * 3 * 0.9), (x) => pVal(x.o) + x.o.w * 0.25);
  const roy = best(bats.filter((x) => isRookie(x.p) && x.o.pa >= 250).map((x) => ({ p: x.p, o: x.o, v: bVal(x.o) + fieldBonus(x.p) })).concat(pits.filter((x) => isRookie(x.p) && x.o.outs >= 150).map((x) => ({ p: x.p, o: x.o, v: pVal(x.o) * 1.1 }))), (x) => x.v);
  const rel = best(pits.filter((x) => x.o.gs <= 3 && x.o.g >= 35), (x) => pVal(x.o) + x.o.sv * 0.12 + x.o.hld * 0.05);
  for (const [k, l] of [['mvp', mvp], ['cy', cy], ['roy', roy], ['rel', rel]]) {
    if (!l) continue;
    l.p.aw.push({ y: S.season, a: k });
    out[k] = { pid: l.p.id, name: nm(l.p), tid: l.o.t };
  }
  return out;
}

/* ---------------- playoffs ---------------- */
function endRegular() {
  const aw = doAwards();
  S.awards = aw;
  S.phase = 'playoffs';
  S.day = 0;
  S.series = [];
  S.seeds = [];
  for (let d = 0; d < 2; d++) {
    const st = standings(d).slice(0, 3).map((t) => t.tid);
    S.seeds[d] = st;
    S.series.push({ r: 0, c: d, hi: st[1], lo: st[2], hs: 2, ls: 3, w: [0, 0], g: [], win: -1 });
  }
  for (const t of S.teams) t.lastWp = wp(t.rec);
  for (const p of S.players) { p.ld = -9; p.cd = 0; }
  const up = S.seeds.some((s) => s.includes(S.user));
  news('po', up ? `${T(S.user).abbr} clinch a playoff spot` : `${T(S.user).abbr} miss the playoffs`, S.user);
  if (aw.mvp) news('award', `MVP: ${aw.mvp.name} (${T(aw.mvp.tid).abbr})`, aw.mvp.tid);
  if (aw.cy) news('award', `Best pitcher: ${aw.cy.name} (${T(aw.cy.tid).abbr})`, aw.cy.tid);
  for (const t of S.teams) applyAuto(t.tid);
}
function curRound() {
  const open = S.series.filter((s) => s.win < 0);
  return open.length ? Math.min(...open.map((s) => s.r)) : -1;
}
function playoffDay() {
  const r = curRound();
  if (r < 0) return 0;
  dayStart();
  let n = 0;
  for (const s of S.series.filter((x) => x.r === r && x.win < 0)) {
    const gn = s.g.length;
    const hiHome = RWINS[s.r] === 2 ? true : [0, 1, 5, 6].includes(gn);
    const g = { d: S.day, h: hiHome ? s.hi : s.lo, a: hiHome ? s.lo : s.hi, g: 0 };
    const res = takePend(g.h, g.a) || simGame(g.h, g.a, true);
    const rec = recordGame(g, res, true);
    rec.sr = S.series.indexOf(s); rec.gn = gn + 1;
    s.g.push(rec.id);
    const hiWon = (rec.h === s.hi) === (rec.hs > rec.as);
    s.w[hiWon ? 0 : 1]++;
    const need = RWINS[s.r];
    if (s.w[0] === need || s.w[1] === need) {
      s.win = s.w[0] === need ? s.hi : s.lo;
      const loser = s.win === s.hi ? s.lo : s.hi;
      news('po', `${T(s.win).abbr} beat ${T(loser).abbr} ${Math.max(...s.w)}-${Math.min(...s.w)} in the ${ROUNDS[s.r].toLowerCase()}`, s.hi === S.user || s.lo === S.user ? S.user : -1);
    }
    n++;
  }
  S.pend = null;
  S.day++;
  if (S.series.filter((x) => x.r === r).every((x) => x.win >= 0)) advanceBracket(r);
  return n;
}
function advanceBracket(r) {
  if (r === 2) { endPlayoffs(); return; }
  if (r === 0) {
    for (let d = 0; d < 2; d++) {
      const wc = S.series.find((s) => s.r === 0 && s.c === d);
      const top = S.seeds[d][0];
      S.series.push({ r: 1, c: d, hi: top, lo: wc.win, hs: 1, ls: wc.win === wc.hi ? wc.hs : wc.ls, w: [0, 0], g: [], win: -1 });
    }
  } else {
    const a = S.series.find((s) => s.r === 1 && s.c === 0).win, b = S.series.find((s) => s.r === 1 && s.c === 1).win;
    const [hi, lo] = wp(T(a).rec) >= wp(T(b).rec) ? [a, b] : [b, a];
    S.series.push({ r: 2, c: -1, hi, lo, hs: 0, ls: 0, w: [0, 0], g: [], win: -1 });
  }
}
function playoffResult(tid) {
  let best = -1;
  if (S.seeds && S.seeds.some((s) => s.includes(tid))) best = S.seeds.some((s) => s[0] === tid) ? 1 : 0;
  for (const s of S.series) {
    if (s.hi !== tid && s.lo !== tid) continue;
    if (s.win === tid && s.r === 2) return 3;
    best = Math.max(best, s.r);
  }
  return best;
}
function endPlayoffs() {
  const fin = S.series.find((s) => s.r === 2);
  const champ = fin.win, runner = fin.win === fin.hi ? fin.lo : fin.hi;
  const fm = {};
  for (const gid of fin.g) {
    const g = S.games.find((x) => x.id === gid);
    if (!g || !g.b) continue;
    const side = g.h === champ ? 1 : 0;
    for (const l of g.b[side].b) { const s = l.slice(2); fm[l[0]] = (fm[l[0]] || 0) + s[BX.h] + s[BX.hr] * 1.5 + s[BX.rbi] * 0.6 + s[BX.bb] * 0.4 + s[BX.d] * 0.5; }
    for (const l of g.b[side].p) { const s = l.slice(1); fm[l[0]] = (fm[l[0]] || 0) + s[PX.outs] / 3 * 0.55 - s[PX.er] * 0.7 + s[PX.so] * 0.15 + (s[PX.dec] & DEC.W ? 1 : 0) + (s[PX.dec] & DEC.S ? 0.7 : 0); }
  }
  let fmvp = 0, fv = -1e9;
  for (const k of Object.keys(fm)) if (fm[k] > fv) { fv = fm[k]; fmvp = +k; }
  const aw = S.awards || {};
  if (fmvp && P(fmvp)) { const p = P(fmvp); p.aw.push({ y: S.season, a: 'fmvp' }); aw.fmvp = { pid: p.id, name: nm(p), tid: champ }; }
  for (const p of active(champ)) p.aw.push({ y: S.season, a: 'champ' });
  news('champ', `${T(champ).city} ${T(champ).name} win the ${S.season} championship`, champ);
  for (const t of S.teams) {
    const pay = payroll(t.tid, S.season);
    const rev = t.fin.gate + t.fin.merch + t.fin.tv + t.fin.po;
    const exp = t.fin.sal + t.fin.ops;
    t.cash += rev - exp;
    const res = playoffResult(t.tid);
    t.hype = clamp(t.hype + [-0.04, 0.03, 0.06, 0.09, 0.15][res + 1], 0, 1);
    t.seasons.push({ y: S.season, w: t.rec.w, l: t.rec.l, po: res, rev: Math.round(rev), exp: Math.round(exp), pay: Math.round(pay), att: t.fin.hg ? Math.round(t.fin.att / t.fin.hg) : 0 });
    if (t.seasons.length > 40) t.seasons.shift();
  }
  const ut = T(S.user);
  const uRes = playoffResult(S.user);
  S.hist.push({ y: S.season, champ, runner, aw, st: S.teams.map((t) => [t.rec.w, t.rec.l]), user: { tid: S.user, w: ut.rec.w, l: ut.rec.l, po: uRes } });
  const c = S.career;
  c.seasons++; c.w += ut.rec.w; c.l += ut.rec.l;
  if (uRes === 3) c.titles++;
  ownerReview();
  S.phase = 'draft';
  S.lastScore = careerScore();
  retirements();
  startDraft();
}
function careerScore() {
  const c = S.career;
  const inSeason = S.phase === 'regular' || S.phase === 'playoffs';
  return c.w + c.pw + (inSeason ? T(S.user).rec.w : 0);
}
function ownerReview() {
  const ut = T(S.user), o = S.owner;
  const last = ut.seasons[ut.seasons.length - 1];
  const dw = 0.5 * (wp(ut.rec) - 0.5) / 0.08;
  const dp = [-0.2, 0.15, 0.35, 0.6, 1.0][last.po + 1];
  const profit = last.rev - last.exp;
  const dm = clamp((profit - 5000) / 30000, -1, 1) * 0.5;
  o.w = clamp(o.w * 0.75 + clamp(dw, -1.2, 1.2), -2, 3); o.p = clamp(o.p * 0.75 + dp, -2, 3); o.m = clamp(o.m * 0.75 + dm, -2, 3);
  o.seasons++;
  o.last = { w: dw, p: dp, m: dm, y: S.season };
  if (o.seasons >= 3 && o.w + o.p + o.m < -1) { S.fired = true; news('fired', `Fired by ${ut.city} ${ut.name}`, S.user); }
}
function ownerTotal() { const o = S.owner; return o.w + o.p + o.m; }

/* ---------------- retirements ---------------- */
function retirements() {
  for (const p of S.players) {
    if (p.tid === -2 || p.tid === -3) continue;
    const a = age(p);
    const expiring = p.tid === -1 || p.c.exp <= S.season;
    let pr = 0;
    if (a >= 42) pr = 1;
    else if (a >= 35) pr = 0.25 + (a - 35) * 0.14 - (p.ovr - 55) * 0.02;
    else if (a >= 31 && p.ovr < 44) pr = 0.35;
    else if (p.tid === -1 && a >= 28 && p.ovr < 41) pr = 0.5;
    else if (p.fm && a >= 27 && p.pot < 48) pr = 0.4;
    if (!expiring && a < 40) pr *= 0.15;
    if (rnd() < pr) {
      if (p.tid >= 0 && (p.ut || p.ovr >= 62)) news('retire', `${nm(p)} retires`, p.tid);
      p.rt = S.season; p.tid = -2; p.inj = null; p.fm = 0;
    }
  }
  const keep = (p) => p.tid !== -2 || p.ut || p.aw.length || careerHits(p) >= 1500 || careerOuts(p) >= 4500;
  const before = S.players.length;
  S.players = S.players.filter(keep);
  if (S.players.length !== before) idx();
}
function careerHits(p) { let s = 0; for (const r of p.s) if (!r.po && r.h && !isP(p)) s += r.h; return s; }
function careerOuts(p) { let s = 0; for (const r of p.s) if (!r.po && isP(p)) s += r.outs; return s; }

/* ---------------- draft ---------------- */
function startDraft() {
  const y = S.season;
  const order1 = S.teams.slice().sort((a, b) => wp(a.rec) - wp(b.rec) || (a.rec.rs - a.rec.ra) - (b.rec.rs - b.rec.ra)).map((t) => t.tid);
  const order = [];
  for (let r = 0; r < DRAFT_ROUNDS; r++) order.push(...order1);
  S.draft = { y, order, idx: 0, made: [] };
  const first = order1.indexOf(S.user) + 1;
  news('draft', `${T(S.user).abbr} pick ${ordn(first)} in each round`, S.user);
}
function prospects() { return S.players.filter((p) => p.tid === -3 && p.dy === (S.draft ? S.draft.y : S.season)); }
function onClock() {
  if (!S.draft || S.draft.idx >= S.draft.order.length) return null;
  return { tid: S.draft.order[S.draft.idx], n: S.draft.idx + 1, rd: Math.floor(S.draft.idx / NT) + 1 };
}
function aiDraftChoice() {
  let best = null, bv = -1e9;
  for (const p of prospects()) {
    const v = 0.62 * p.pot + 0.38 * p.ovr + gauss(0, 1.8) - Math.max(0, age(p) - 21) * 0.5 - (p.pos === 'RP' ? 3 : 0);
    if (v > bv) { bv = v; best = p; }
  }
  return best;
}
function draftPick(pid) {
  const pk = onClock();
  if (!pk) return false;
  const p = P(pid);
  if (!p || p.tid !== -3) return false;
  p.tid = pk.tid; p.fm = 1;
  p.dr = { y: S.draft.y, r: pk.rd, p: pk.n, t: pk.tid };
  p.c = { amt: MINC, exp: S.season + 6 };
  p.fz = 0;
  S.draft.made.push({ n: pk.n, pid, tid: pk.tid });
  S.draft.idx++;
  if (pk.tid === S.user) news('draft', `${T(S.user).abbr} draft ${nm(p)} at ${pk.n}`, S.user);
  if (S.draft.idx >= S.draft.order.length) finishDraft();
  return true;
}
function draftUntilUser(includeUser) {
  while (S.phase === 'draft') {
    const pk = onClock();
    if (!pk) break;
    if (pk.tid === S.user && !includeUser) break;
    const c = aiDraftChoice();
    if (!c) { S.draft.idx = S.draft.order.length; finishDraft(); break; }
    draftPick(c.id);
  }
}
function finishDraft() {
  for (const p of prospects()) {
    if (p.pot >= 52) { p.tid = -1; p.fz = 0; p.c = { amt: MINC, exp: S.season }; p.ask = MINC; }
    else p.tid = -9;
  }
  S.players = S.players.filter((p) => p.tid !== -9);
  idx();
  for (const t of S.teams) if (t.tid !== S.user) trimFarm(t.tid);
  S.phase = 'resign';
}
function trimFarm(tid) {
  const t = T(tid);
  let fm = farm(tid);
  while (fm.length > FARM_MAX) {
    const w = fm.slice().sort((a, b) => valRating(a, t.strat) - valRating(b, t.strat))[0];
    w.tid = -1; w.fm = 0; w.ask = MINC;
    fm = farm(tid);
  }
}

/* ---------------- re-sign ---------------- */
function expiring(tid) { return S.players.filter((p) => p.tid === tid && p.c.exp <= S.season); }
function resign(pid, years) {
  const p = P(pid);
  if (!p || p.tid !== S.user || p.c.exp > S.season || S.phase !== 'resign') return { ok: false };
  const amt = askFor(p, S.user, years);
  if (!p.fm && rosterCount(S.user) >= ROSTER_MAX) return { ok: false, msg: 'Active roster full' };
  if (p.fm && farmCount(S.user) >= FARM_MAX) return { ok: false, msg: 'Farm full' };
  p.c = { amt, exp: S.season + years };
  news('sign', `${T(S.user).abbr} re-sign ${nm(p)}: $${(amt / 1000).toFixed(1)}M, ${years} yrs`, S.user);
  return { ok: true };
}
function endResign() {
  for (const t of S.teams) {
    if (t.tid === S.user) continue;
    const exp = expiring(t.tid).sort((a, b) => valRating(b, t.strat) - valRating(a, t.strat));
    for (const p of exp) {
      const yrs = prefYears(p);
      const amt = askFor(p, t.tid, yrs);
      const v = valRating(p, t.strat);
      const fair = salaryFor(v);
      const pay = payroll(t.tid);
      const ok = amt <= fair * 1.2 && age(p) < 36 && (pay + amt <= t.budget || amt <= MINC) && (v >= 62 || rnd() < 0.75) && (v >= 50 || p.fm);
      if (ok) p.c = { amt, exp: S.season + yrs };
    }
  }
  for (const p of S.players) {
    if (p.tid >= 0 && p.c.exp <= S.season) {
      p.ex = p.tid;
      if (p.tid === S.user && !p.fm) news('fa', `${nm(p)} leaves in free agency`, S.user);
      p.tid = -1; p.fm = 0;
    }
  }
  for (const p of S.players) if (p.tid === -1) p.ask = round50(marketValue(p) * clamp(gauss(1.05, 0.12), 0.8, 1.35));
  for (const t of S.teams) t.budget = round50(t.budget * 0.6 + calcBudget(t) * 0.4);
  S.phase = 'fa';
  S.faDay = 0;
}

/* ---------------- free agency ---------------- */
function canSign(tid, amt) {
  if (rosterCount(tid) >= ROSTER_MAX) return 'Active roster full';
  if (amt <= MINC) return '';
  if (payroll(tid) + amt > T(tid).budget) return 'Over budget';
  return '';
}
function sign(p, tid, amt, years, quiet) {
  const inSeason = S.phase === 'regular' || S.phase === 'playoffs';
  p.tid = tid; p.fm = 0;
  p.c = { amt, exp: S.season + years - (inSeason ? 1 : 0) };
  p.ask = 0;
  if (!quiet || amt >= 8000 || tid === S.user) news('sign', `${T(tid).abbr} sign ${nm(p)}: $${(amt / 1000).toFixed(1)}M, ${years} yr${years > 1 ? 's' : ''}`, tid);
  if (tid === S.user) { p.ut = 1; if (!T(tid).auto) fixLineup(tid); if (!T(tid).autoP) fixStaff(tid); }
}
function offer(pid, amt, years) {
  const p = P(pid);
  if (!p || p.tid !== -1) return { ok: false, msg: 'Unavailable' };
  if (S.phase === 'draft' || S.phase === 'resign') return { ok: false, msg: 'Free agency not open' };
  if (S.phase === 'playoffs') return { ok: false, msg: 'Playoffs' };
  amt = round50(clamp(amt, MINC, MAXC));
  const why = canSign(S.user, amt);
  if (why) return { ok: false, msg: why };
  const need = askFor(p, S.user, years);
  if (amt < need) return { ok: false, msg: 'Rejected', need };
  sign(p, S.user, amt, years);
  return { ok: true, msg: 'Signed' };
}
function needs(tid) {
  // weakest lineup spot and rotation spot
  const lu = autoLineup(tid);
  let worstB = 1e9;
  lu.lu.forEach((id, i) => { worstB = Math.min(worstB, fitVal(P(id), lu.lp[i])); });
  const st = autoStaff(tid);
  const rot = st.rot.map((id) => P(id).ovr);
  const pen = st.pen.map((id) => P(id)).filter((p) => !p.inj).map((p) => p.ovr).sort((a, b) => b - a);
  return { b: worstB, sp: rot.length >= 5 ? Math.min(...rot) : 0, rp: pen[5] || 0 };
}
function helps(p, nd) {
  if (!isP(p)) { let b = -1e9; for (const pos of BPOS) b = Math.max(b, fitVal(p, pos)); return b > nd.b + 1; }
  if (p.pos === 'SP' || p.r.sta >= 55) return p.ovr > nd.sp + 1 || p.ovr > nd.rp + 4;
  return p.ovr > nd.rp + 2;
}
function faAI(intensity) {
  const fas = S.players.filter((p) => p.tid === -1).sort((a, b) => b.ovr - a.ovr);
  const teams = shuffle(S.teams.filter((t) => t.tid !== S.user));
  for (const t of teams) {
    let n = rosterCount(t.tid);
    if (n >= ROSTER_MAX && !makeRoom(t, fas)) continue;
    n = rosterCount(t.tid);
    const space = t.budget - payroll(t.tid);
    const nd = needs(t.tid);
    for (const p of fas) {
      if (p.tid !== -1) continue;
      const yrs = prefYears(p);
      const amt = askFor(p, t.tid, yrs);
      if (!(amt <= space || amt <= MINC)) continue;
      const v = valRating(p, t.strat);
      const worth = salaryFor(v) >= amt * 0.9;
      const ok = helps(p, nd) || n < ROSTER_MIN;
      if (worth && ok && rnd() < intensity * (amt > 15000 ? 0.6 : 1)) { sign(p, t.tid, amt, yrs, true); break; }
    }
  }
}
function makeRoom(t, fas) {
  // a full roster cuts its weakest cheap player when a clearly better free agent fits the budget
  const yr = payYear();
  const ps = active(t.tid).filter((p) => p.c.exp >= yr);
  const w = ps.slice().sort((a, b) => valRating(a, t.strat) - valRating(b, t.strat))[0];
  if (!w || w.c.amt > 3000) return false;
  const space = t.budget - payroll(t.tid) + (w.c.amt > MINC ? 0 : 0);
  const up = fas.find((p) => p.tid === -1 && isP(p) === isP(w) && valRating(p, t.strat) > valRating(w, t.strat) + 5 && askFor(p, t.tid, prefYears(p)) <= Math.max(MINC, space));
  if (!up) return false;
  if (age(w) <= 25 && farmCount(t.tid) < FARM_MAX) w.fm = 1; else releaseAI(w, t.tid);
  return true;
}
function faNextDay() {
  if (S.phase !== 'fa') return;
  faAI(S.faDay < 3 ? 0.55 : 0.32);
  S.faDay++;
  for (const p of S.players) if (p.tid === -1 && p.ask) p.ask = Math.max(MINC, round50(p.ask * (S.faDay > 10 ? 0.97 : 0.99)));
}
function startSeason() {
  if (S.phase !== 'fa') return;
  while (S.faDay < 30) faNextDay();
  S.season++;
  for (const p of S.players) {
    if (p.tid === -2) continue;
    const a = age(p) - 1;
    if (p.tid !== -3) develop(p, a, 1);
    p.pot = calcPot(p);
    if (p.inj) { p.inj.d -= 150; if (p.inj.d <= 0) p.inj = null; }
    p.fat = 0; p.cd = 0; p.ld = -9;
    if (p.tid !== -3) { p.h.push([S.season, p.ovr, p.pot]); if (p.h.length > 25) p.h.shift(); }
    p.ex = undefined;
    if (p.tid === -1) p.ask = round50(marketValue(p));
  }
  normalize();
  for (const p of S.players) if (p.tid !== -2 && p.tid !== -3) { p.pot = calcPot(p); p.h[p.h.length - 1] = [S.season, p.ovr, p.pot]; }
  for (const p of S.players) if (p.tid === -3) { develop(p, age(p) - 1, 0.5); p.pot = calcPot(p); }
  S.dead = S.dead.filter((d) => d.exp >= S.season);
  genDraftClass(S.season);
  for (const t of S.teams) t.hype = clamp(t.hype * 0.9 + 0.05, 0, 1);
  const fas = S.players.filter((p) => p.tid === -1).sort((a, b) => valRating(b) - valRating(a));
  const cut = fas.slice(70).filter((p) => !p.ut && !p.aw.length);
  if (cut.length) { const gone = new Set(cut.map((p) => p.id)); S.players = S.players.filter((p) => !gone.has(p.id)); idx(); }
  S.draft = null;
  S.awards = null;
  S.seeds = null;
  setupSeason();
}
function canStartSeason() {
  const n = rosterCount(S.user);
  if (n > ROSTER_MAX) return 'Active roster above ' + ROSTER_MAX;
  if (n < ROSTER_MIN) return 'Active roster below ' + ROSTER_MIN;
  if (farmCount(S.user) > FARM_MAX) return 'Farm above ' + FARM_MAX;
  return rosterShape(S.user);
}
function rosterShape(tid) {
  const a = active(tid);
  if (a.filter((p) => !isP(p)).length < 10) return 'Need 10 position players';
  if (a.filter((p) => isP(p)).length < 10) return 'Need 10 pitchers';
  return '';
}
function canSim() {
  if (S.fired) return 'Fired';
  if (S.phase !== 'regular' && S.phase !== 'playoffs') return '';
  const n = active(S.user).length;
  if (n > ROSTER_MAX) return 'Active roster above ' + ROSTER_MAX;
  if (n < ROSTER_MIN) return 'Active roster below ' + ROSTER_MIN;
  if (farm(S.user).length > FARM_MAX) return 'Farm above ' + FARM_MAX;
  return rosterShape(S.user);
}

/* ---------------- roster moves ---------------- */
function release(pid) {
  const p = P(pid);
  if (!p || p.tid !== S.user) return false;
  const yr = payYear();
  if (p.c.exp >= yr && counts(p) && p.c.amt > MINC) S.dead.push({ tid: p.tid, amt: p.c.amt, exp: p.c.exp, name: nm(p) });
  news('release', `${T(p.tid).abbr} release ${nm(p)}`, p.tid);
  p.tid = -1; p.fm = 0; p.ask = round50(marketValue(p));
  afterUserRoster();
  return true;
}
function demote(pid) {
  const p = P(pid);
  if (!p || p.tid !== S.user || p.fm) return 'Unavailable';
  if (farm(S.user).length >= FARM_MAX) return 'Farm full';
  p.fm = 1;
  afterUserRoster();
  return '';
}
function promote(pid) {
  const p = P(pid);
  if (!p || p.tid !== S.user || !p.fm) return 'Unavailable';
  if (active(S.user).length >= ROSTER_MAX) return 'Active roster full';
  p.fm = 0;
  afterUserRoster();
  return '';
}
function fillRoster() {
  const tid = S.user;
  let n = 0;
  for (let guard = 0; guard < 30; guard++) {
    const a = active(tid);
    const nb = a.filter((p) => !isP(p)).length, np = a.length - nb;
    let want = null;
    if (nb < 10) want = false;
    else if (np < 10) want = true;
    else if (a.length < ROSTER_MIN) want = np <= nb;
    if (want === null || a.length >= ROSTER_MAX) break;
    if (!aiFill(tid, want)) {
      const p = genPlayer(42, ri(24, 30), want ? 'RP' : pick(['C', 'SS', '2B', 'CF', '1B', 'LF']));
      S.players.push(p); PM.set(p.id, p); p.h.push([S.season, p.ovr, p.pot]);
      sign(p, tid, MINC, 1, true);
    }
    n++;
  }
  afterUserRoster();
  return n;
}
function afterUserRoster() {
  const t = T(S.user);
  if (t.auto) { const a = autoLineup(S.user); t.lu = a.lu; t.lp = a.lp; } else fixLineup(S.user);
  if (t.autoP) { const s = autoStaff(S.user); t.rot = s.rot; t.pen = s.pen; } else fixStaff(S.user);
}
function trimAndFill(tid, force) {
  if (tid === S.user && !force) return;
  const t = T(tid);
  const yr = payYear();
  const cur = () => active(tid).filter((p) => p.c.exp >= yr);
  let ps = cur();
  while (ps.length > ROSTER_MAX) {
    const w = ps.slice().sort((a, b) => valRating(a, t.strat) - valRating(b, t.strat))[0];
    if (age(w) <= 25 && farmCount(tid) < FARM_MAX) w.fm = 1;
    else { releaseAI(w, tid); news('release', `${t.abbr} release ${nm(w)}`, tid); }
    ps = cur();
  }
  const fill = (wantP) => {
    if (aiFill(tid, wantP)) return;
    const p = genPlayer(43, ri(23, 29), wantP ? 'RP' : pick(['C', 'SS', '2B', 'CF', '1B', 'LF']));
    S.players.push(p); PM.set(p.id, p); p.h.push([S.season, p.ovr, p.pot]); sign(p, tid, MINC, 1, true);
  };
  let guard = 0;
  while (guard++ < 30) {
    ps = cur();
    const nb = ps.filter((p) => !isP(p)).length, np = ps.length - nb;
    if (nb < 12) { fill(false); continue; }
    if (np < 12) { fill(true); continue; }
    if (ps.length < ROSTER_MIN + 1) { fill(np <= nb); continue; }
    if (ps.filter((p) => p.pos === 'SP' || p.r.sta >= 55).length < 5) { fill(true); continue; }
    break;
  }
  ps = cur();
  while (ps.length > ROSTER_MAX) {
    const w = ps.slice().sort((a, b) => valRating(a, t.strat) - valRating(b, t.strat))[0];
    releaseAI(w, tid); ps = cur();
  }
  trimFarm(tid);
}
function updateStrategies() {
  const ranked = S.teams.slice().sort((a, b) => teamOvr(b.tid) - teamOvr(a.tid)).map((t) => t.tid);
  for (const t of S.teams) {
    const rk = ranked.indexOf(t.tid);
    t.strat = rk < 6 ? 'contend' : rk >= 10 ? 'rebuild' : 'mid';
  }
}

/* ---------------- trades ---------------- */
function playerTradeValue(p, tid, incoming) {
  const t = T(tid);
  const ve = valRating(p, t.strat);
  let v = Math.pow(Math.max(0, ve - 38) / 10, 3.2);
  const yr = payYear();
  const yrs = Math.max(0, p.c.exp - yr + 1);
  const fair = salaryFor(ve);
  v += ((fair - p.c.amt) / 1000) * Math.min(yrs, 4) * 0.35 * (t.strat === 'rebuild' ? 1.2 : 0.8);
  if (p.inj && p.inj.d > 40) v *= t.strat === 'contend' ? 0.55 : 0.85;
  if (incoming) {
    if (!p.fm && !helps(p, needs(tid))) v *= 0.7;
    if (t.strat === 'contend' && p.fm && p.ovr < 50) v *= 0.8;
  }
  return Math.max(0, v);
}
function tradeAssets(tid) {
  const off = inOff();
  return { players: teamPlayers(tid).filter((p) => !(off && p.c.exp <= S.season)) };
}
function tradeOpen() {
  if (S.fired) return 'Fired';
  if (S.phase === 'playoffs') return 'Playoffs';
  if (S.phase === 'regular' && S.day >= S.deadline) return 'Trade deadline passed';
  return '';
}
function evalTrade(tid, give, get) {
  const res = { ok: false, reason: '', dv: 0 };
  const closed = tradeOpen(); if (closed) { res.reason = closed; return res; }
  if (tid === S.user) { res.reason = 'Pick a team'; return res; }
  if (!give.length && !get.length) { res.reason = 'Empty'; return res; }
  const yr = payYear();
  const sal = (ids) => ids.reduce((s, id) => s + (P(id).c.exp >= yr && counts(P(id)) ? P(id).c.amt : 0), 0);
  const outU = sal(give), inU = sal(get);
  const afterU = payroll(S.user) - outU + inU, afterA = payroll(tid) - inU + outU;
  if (inU > outU && afterU > T(S.user).budget) { res.reason = 'Over your budget'; return res; }
  if (outU > inU && afterA > T(tid).budget + 2000) { res.reason = 'Over their budget'; return res; }
  const actIn = (ids) => ids.filter((id) => !P(id).fm).length;
  const rU = rosterCount(S.user) - actIn(give) + actIn(get);
  if (rU > ROSTER_MAX) { res.reason = 'Your active roster above ' + ROSTER_MAX; return res; }
  const fU = farmCount(S.user) - (give.length - actIn(give)) + (get.length - actIn(get));
  if (fU > FARM_MAX) { res.reason = 'Your farm above ' + FARM_MAX; return res; }
  let vin = 0, vout = 0;
  for (const id of give) vin += playerTradeValue(P(id), tid, true);
  for (const id of get) vout += playerTradeValue(P(id), tid, false);
  const rA = rosterCount(tid) - actIn(get) + actIn(give);
  if (rA > ROSTER_MAX) {
    const keep = active(tid).filter((p) => !get.includes(p.id)).map((p) => playerTradeValue(p, tid, false)).sort((a, b) => a - b);
    for (let i = 0; i < rA - ROSTER_MAX && i < keep.length; i++) vin -= keep[i] * 0.5 + 0.3;
  }
  // a team gutting its pitching or lineup wants a body back
  const kinds = (ids) => ids.reduce((a, id) => { a[isP(P(id)) ? 1 : 0]++; return a; }, [0, 0]);
  const kg = kinds(give), kt = kinds(get);
  if (active(tid).filter((p) => isP(p)).length - kt[1] + kg[1] < 11) { res.reason = 'They need pitchers back'; return res; }
  if (active(tid).filter((p) => !isP(p)).length - kt[0] + kg[0] < 11) { res.reason = 'They need position players back'; return res; }
  const margin = Math.max(1.2, vout * 0.06);
  res.dv = vin - vout - margin;
  res.vin = vin; res.vout = vout + margin;
  res.ok = res.dv >= 0;
  res.reason = res.ok ? '' : 'Not enough value';
  return res;
}
function doTrade(tid, give, get) {
  const ev = evalTrade(tid, give, get);
  if (!ev.ok) return ev;
  execTrade(S.user, tid, give, get);
  return ev;
}
function execTrade(a, b, give, get) {
  for (const id of give) P(id).tid = b;
  for (const id of get) { const p = P(id); p.tid = a; if (a === S.user) p.ut = 1; }
  const names = (ids) => ids.map((id) => { const p = P(id); return p.fn[0] + '. ' + p.ln; }).join(', ') || 'nothing';
  news('trade', `${T(a).abbr} trade ${names(give)} to ${T(b).abbr} for ${names(get)}`, a === S.user || b === S.user ? S.user : a);
  for (const t of [a, b]) {
    if (t === S.user) afterUserRoster();
    else { trimAndFill(t); applyAuto(t); }
  }
}
function balanceTrade(tid, give, get) {
  const g = give.slice();
  for (let k = 0; k < 6; k++) {
    const ev = evalTrade(tid, g, get);
    if (ev.ok) return { give: g, ok: true };
    if (ev.reason === 'Over your budget') {
      const yr = payYear();
      const salOf = (id) => { const p = P(id); return p.c.exp >= yr && counts(p) ? p.c.amt : 0; };
      const inU = get.reduce((x, id) => x + salOf(id), 0), outU = g.reduce((x, id) => x + salOf(id), 0);
      const gap = payroll(S.user) - outU + inU - T(S.user).budget;
      const pool = tradeAssets(S.user).players.filter((p) => !g.includes(p.id) && salOf(p.id) > MINC);
      if (!pool.length) return { give: g, ok: false, reason: ev.reason };
      const fit = pool.filter((p) => salOf(p.id) >= gap).sort((x, y) => playerTradeValue(x, S.user) - playerTradeValue(y, S.user))[0];
      g.push((fit || pool.sort((x, y) => salOf(y.id) - salOf(x.id))[0]).id);
      continue;
    }
    if (ev.reason !== 'Not enough value') return { give: g, ok: false, reason: ev.reason };
    const need = -ev.dv;
    const cands = tradeAssets(S.user).players.filter((p) => !g.includes(p.id)).map((p) => ({ id: p.id, v: playerTradeValue(p, tid, true) })).filter((c) => c.v > 0.3).sort((a, b) => a.v - b.v);
    if (!cands.length) return { give: g, ok: false, reason: 'Nothing they want' };
    const order = cands.filter((x) => x.v >= need).concat(cands.filter((x) => x.v < need).reverse());
    let done = false, last = ev.reason;
    for (const c of order) {
      const trial = g.concat([c.id]);
      const e2 = evalTrade(tid, trial, get);
      if (e2.ok || e2.reason === 'Not enough value') { g.push(c.id); done = true; break; }
      last = e2.reason;
    }
    if (!done) return { give: g, ok: false, reason: last };
  }
  const ev = evalTrade(tid, g, get);
  return { give: g, ok: ev.ok, reason: ev.reason };
}
function aiTrade() {
  const ts = shuffle(S.teams.filter((t) => t.tid !== S.user)).slice(0, 2);
  const [A, B2] = ts;
  if (!A || !B2 || A.strat === B2.strat) return;
  const con = A.strat === 'contend' ? A : B2.strat === 'contend' ? B2 : null;
  if (!con) return;
  const reb = con === A ? B2 : A;
  const vet = active(reb.tid).filter((p) => age(p) >= 28 && p.ovr >= 58 && !p.inj).sort((a, b) => b.ovr - a.ovr)[0];
  if (!vet) return;
  const kids = farm(con.tid).concat(active(con.tid).filter((p) => age(p) <= 25)).filter((p) => isP(p) === isP(vet) || p.fm).map((p) => ({ p, v: playerTradeValue(p, reb.tid, true) })).sort((a, b) => b.v - a.v);
  const need = playerTradeValue(vet, reb.tid, false) * 1.05 + 1;
  const pkg = [];
  let got = 0;
  for (const k of kids) { if (got >= need || pkg.length >= 3) break; if (k.v < 0.5) continue; pkg.push(k.p.id); got += k.v; }
  if (got < need) return;
  const conGain = playerTradeValue(vet, con.tid, true) - pkg.reduce((s, id) => s + playerTradeValue(P(id), con.tid, false), 0);
  if (conGain < 0) return;
  const yr = payYear();
  const sal = (ids) => ids.reduce((s, id) => s + (P(id).c.exp >= yr && counts(P(id)) ? P(id).c.amt : 0), 0);
  if (payroll(con.tid) + vet.c.amt - sal(pkg) > con.budget + 4000) return;
  execTrade(con.tid, reb.tid, pkg, [vet.id]);
}

/* ---------------- user staff edits ---------------- */
function setAuto(on) { const t = T(S.user); t.auto = on; if (on) { const a = autoLineup(S.user); t.lu = a.lu; t.lp = a.lp; } else fixLineup(S.user); }
function setAutoP(on) { const t = T(S.user); t.autoP = on; if (on) { const s = autoStaff(S.user); t.rot = s.rot; t.pen = s.pen; } else fixStaff(S.user); }
function manualLineup() { const t = T(S.user); if (t.auto) { t.auto = false; } fixLineup(S.user); return t; }
function moveOrder(i, dir) {
  const t = manualLineup();
  const j = i + dir;
  if (j < 0 || j >= t.lu.length) return;
  [t.lu[i], t.lu[j]] = [t.lu[j], t.lu[i]];
  [t.lp[i], t.lp[j]] = [t.lp[j], t.lp[i]];
}
function setPos(i, pos) {
  const t = manualLineup();
  const j = t.lp.indexOf(pos);
  if (j < 0 || j === i) return;
  [t.lp[i], t.lp[j]] = [t.lp[j], t.lp[i]];
}
function subIn(i, pid) {
  const t = manualLineup();
  const p = P(pid);
  if (!p || p.tid !== S.user || p.fm || isP(p)) return;
  const j = t.lu.indexOf(pid);
  if (j >= 0) { [t.lu[i], t.lu[j]] = [t.lu[j], t.lu[i]]; return; }
  t.lu[i] = pid;
}
function manualStaff() { const t = T(S.user); if (t.autoP) t.autoP = false; fixStaff(S.user); return t; }
function moveStaff(pid, dir) {
  const t = manualStaff();
  for (const arr of [t.rot, t.pen]) {
    const i = arr.indexOf(pid);
    if (i < 0) continue;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return;
  }
}
function toRotation(pid) {
  const t = manualStaff();
  const i = t.pen.indexOf(pid);
  if (i < 0) return;
  t.pen.splice(i, 1);
  if (t.rot.length >= 5) { const out = t.rot.pop(); t.pen.splice(Math.min(2, t.pen.length), 0, out); }
  t.rot.push(pid);
}
function toPen(pid) {
  const t = manualStaff();
  const i = t.rot.indexOf(pid);
  if (i < 0) return;
  t.rot.splice(i, 1);
  t.pen.push(pid);
  const best = t.pen.map((id) => P(id)).filter((p) => !p.inj && p.id !== pid).sort((a, b) => spScore(b) - spScore(a))[0];
  if (best && t.rot.length < 5) { t.pen.splice(t.pen.indexOf(best.id), 1); t.rot.push(best.id); }
}

/* ---------------- live helpers ---------------- */
function livePen(G) { const tm = G.tm[G.us]; return availPen(G, tm, true).filter((p) => p.id !== tm.pit.id); }
function liveBench(G) { const tm = G.tm[G.us]; return tm.bench.map((id) => P(id)).filter(Boolean); }
function liveQueue(G, kind, pid) { const tm = G.tm[G.us]; if (kind === 'pit') tm.pendP = pid; else tm.pendH = pid; }

/* ---------------- career ---------------- */
function newJob(tid) {
  S.fired = false;
  T(S.user).auto = true; T(S.user).autoP = true;
  S.user = tid;
  T(tid).auto = true; T(tid).autoP = true;
  S.owner = { w: 0, p: 0, m: 0, seasons: 0, last: null };
  S.career.teams.push(tid);
  applyAuto(tid);
  news('job', `Hired by ${T(tid).city} ${T(tid).name}`, tid);
}
function jobOffers() {
  return S.teams.filter((t) => t.tid !== S.user).sort((a, b) => wp(a.rec) - wp(b.rec)).slice(0, 4).map((t) => t.tid);
}
function advancePhase() {
  if (S.phase === 'draft') { draftUntilUser(true); return; }
  if (S.phase === 'resign') { endResign(); return; }
  if (S.phase === 'fa') startSeason();
}

/* ---------------- state io ---------------- */
function getState() { S.rs = R; return S; }
function setState(s) { S = s; R = s.rs || 1; idx(); }
function pack() {
  S.rs = R;
  const players = S.players.map((p) => {
    const keys = isP(p) ? SFP : SFB;
    const o = Object.assign({}, p, { s: p.s.map((r) => [r.y, r.t, r.po].concat(keys.map((k) => r[k]))) });
    for (const k of ['fat', 'fz', 'fm', 'cd', 'ask', 'ut', 'vet']) if (!o[k]) delete o[k];
    if (o.inj == null) delete o.inj;
    if (o.ld == null || o.ld < 0) delete o.ld;
    if (o.tid === -2) delete o.h;
    return o;
  });
  return JSON.stringify(Object.assign({}, S, { players }));
}
function unpack(str) {
  const s = JSON.parse(str);
  for (const p of s.players) {
    const keys = (p.pos === 'SP' || p.pos === 'RP') ? SFP : SFB;
    p.s = p.s.map((a) => { const r = { y: a[0], t: a[1], po: a[2] }; keys.forEach((k, i) => { r[k] = a[3 + i]; }); return r; });
    p.fat = p.fat || 0; p.fz = p.fz || 0; p.fm = p.fm || 0; p.inj = p.inj || null; p.h = p.h || []; if (p.ld == null) p.ld = -9;
  }
  setState(s);
  return s;
}
function bitLen(n) { let b = 0; while (n > 0) { b++; n >>>= 1; } return b; }
function compress(str) {
  str = str.replace(/[Ā-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const out = [];
  let acc = 0, nb = 0;
  const emit = (v, w) => {
    for (let i = w - 1; i >= 0; i--) {
      acc = (acc << 1) | ((v >>> i) & 1); nb++;
      if (nb === 15) { out.push(String.fromCharCode(acc + 32)); acc = 0; nb = 0; }
    }
  };
  if (!str.length) return '';
  const dict = new Map();
  let next = 256, k = 0;
  let w = str.charCodeAt(0);
  for (let i = 1; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const key = w * 256 + c;
    const hit = dict.get(key);
    if (hit !== undefined) { w = hit; continue; }
    emit(w, bitLen(Math.min(255 + k, 65535))); k++;
    if (next < 65536) dict.set(key, next++);
    w = c;
  }
  emit(w, bitLen(Math.min(255 + k, 65535))); k++;
  if (nb) out.push(String.fromCharCode((acc << (15 - nb)) + 32));
  const chunks = [];
  for (let i = 0; i < out.length; i += 8192) chunks.push(out.slice(i, i + 8192).join(''));
  return k + ':' + chunks.join('');
}
function decompress(data) {
  if (!data) return '';
  const colon = data.indexOf(':');
  const count = +data.slice(0, colon);
  let pos = colon + 1, acc = 0, nb = 0;
  const read = (w) => {
    let v = 0;
    for (let i = 0; i < w; i++) {
      if (!nb) { acc = data.charCodeAt(pos++) - 32; nb = 15; }
      nb--; v = (v << 1) | ((acc >>> nb) & 1);
    }
    return v;
  };
  const dict = [];
  for (let i = 0; i < 256; i++) dict.push(String.fromCharCode(i));
  const parts = [];
  let prev = dict[read(bitLen(255))];
  parts.push(prev);
  for (let k = 1; k < count; k++) {
    const code = read(bitLen(Math.min(255 + k, 65535)));
    let cur;
    if (code < dict.length) cur = dict[code];
    else cur = prev + prev[0];
    if (dict.length < 65536) dict.push(prev + cur[0]);
    parts.push(cur);
    prev = cur;
  }
  return parts.join('');
}
function seed(n) { R = n >>> 0 || 1; }

return {
  MINC, MAXC, ROSTER_MAX, ROSTER_MIN, FARM_MAX, BPOS, FPOS, BK, PK, RLABEL, RSHORT, DIVS, AWARDS, ROUNDS, RWINS, SFB, SFP, BX, PX, DEC, K, TEAMS, PITCH, NT,
  newLeague, getState, setState, seed, pack, unpack, compress, decompress, P, T, age, isP, teamPlayers, active, farm, payroll, rosterCount, farmCount, payYear, inOff,
  simDay, userGameToday, liveStart, liveFinish, step, playToEnd, result, simGame, standings, wp, seasonLine, teamOvr, autoLineup, autoStaff, applyAuto, staffOf,
  setAuto, setAutoP, moveOrder, setPos, subIn, moveStaff, toRotation, toPen, fitVal, offVal, posPen, fatigue,
  curRound, playoffResult, prospects, onClock, draftPick, draftUntilUser, expiring, resign, endResign, offer, askFor, prefYears,
  canSign, faNextDay, startSeason, canStartSeason, canSim, release, demote, promote, tradeAssets, tradeOpen, evalTrade, doTrade, balanceTrade,
  playerTradeValue, marketValue, valRating, ownerTotal, advancePhase, newJob, jobOffers, appeal, isRookie, careerScore, bVal, pVal,
  salaryFor, livePen, liveBench, liveQueue, calcBudget, needs, fillRoster,
};
})();
if (typeof module !== 'undefined') module.exports = BSM;
