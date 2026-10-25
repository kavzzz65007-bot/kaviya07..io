/* AcadID – static prototype.
 * Everything runs in the browser with synthetic demo data stored in localStorage.
 * There is no server: role checks happen in this script and are NOT production security.
 */
(function () {
  'use strict';

  /* ======================================================================
   * 1. Utilities
   * ==================================================================== */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const pad = (n, w) => String(n).padStart(w, '0');
  const now = () => Date.now();
  const DAY = 86400000;
  const fmtDT = (t) => (t ? new Date(t).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '–');
  const fmtD = (t) => (t ? new Date(t).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '–');
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  /* Small non-cryptographic hash, used only for the demo password check. */
  function cyrb53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomToken(bytes) {
    const arr = new Uint8Array(bytes);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
    else throw new Error('Secure random generator is not available in this browser.');
    let bin = '';
    arr.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /* ---------- icons ---------- */
  const ICONS = {
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3zM12 9v4M12 17h.01"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    chart: '<path d="M3 3v18h18M7 15v3M12 9v9M17 5v13"/>',
    scroll: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/>',
    chevron: '<path d="m15 18-6-6 6-6"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  const ic = (name, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  function hydrateIcons(root) {
    $$('[data-icon]', root).forEach((el) => {
      if (!el.dataset.iconDone) { el.innerHTML = ic(el.dataset.icon); el.dataset.iconDone = '1'; }
    });
  }

  /* ======================================================================
   * 2. Constants
   * ==================================================================== */
  const KEY = 'acadid.db.v1';
  const SKEY = 'acadid.session.v1';
  const SESSION_MS = 30 * 60 * 1000;
  const DEMO_PW = 'Demo@1234';
  const DEMO_PW_HASH = cyrb53('acadid-demo|' + DEMO_PW);

  const ENR_STATUS = ['Enrolled', 'Withdrawn', 'Graduated'];
  const CATEGORIES = ['General', 'NRI', 'OCI', 'Foreign National'];
  const REQ_STATUS = ['Submitted', 'Under Review', 'Action Required', 'Approved', 'Rejected', 'Resolved'];
  const OPEN_REQ = ['Submitted', 'Under Review', 'Action Required'];
  const NEXT_STATUS = {
    'Submitted': ['Under Review', 'Action Required', 'Approved', 'Rejected'],
    'Under Review': ['Action Required', 'Approved', 'Rejected'],
    'Action Required': ['Under Review', 'Rejected'],
    'Approved': ['Resolved'],
    'Rejected': ['Resolved'],
    'Resolved': []
  };
  const REASON_REQUIRED = ['Action Required', 'Approved', 'Rejected'];
  const ISSUE_TYPES = {
    missing_field: 'Missing required field',
    missing_apaar: 'Missing APAAR ID',
    invalid_apaar: 'Invalid APAAR format',
    duplicate_apaar: 'Duplicate APAAR ID',
    duplicate_record: 'Possible duplicate record',
    name_variation: 'Name spelling variation',
    dob_inconsistency: 'Date-of-birth inconsistency',
    cross_institution: 'Possible cross-institution enrolment',
    intake_exceeded: 'Enrolment exceeds approved intake'
  };
  const DUP_TYPES = ['duplicate_apaar', 'duplicate_record', 'cross_institution', 'name_variation'];
  const ISSUE_STATUS = ['Open', 'Reviewed', 'Dismissed', 'Needs correction'];
  const OPEN_ISSUE = ['Open', 'Needs correction'];
  const SEV_RANK = { High: 0, Medium: 1, Low: 2 };
  const FIELD_LABEL = { name: 'Student name', dob: 'Date of birth', progId: 'Programme', apaar: 'APAAR ID', year: 'Academic year', category: 'Admission category', status: 'Enrolment status' };
  const CLAIMS = { name: 'Student name', institution: 'Institution', programme: 'Programme', academicYear: 'Academic year', enrolmentStatus: 'Enrolment status' };
  const PURPOSES = ['Admission', 'Employment', 'Scholarship', 'Higher studies', 'Other'];
  const ROLE_LABEL = { student: 'Student', inst: 'Institutional Administrator', aicte: 'AICTE Administrator (demo role)', verifier: 'Academic Verifier' };

  const USERS = {
    'u-student': { id: 'u-student', email: 'student@acadid.demo', role: 'student' },
    'u-inst': { id: 'u-inst', email: 'institution@acadid.demo', role: 'inst' },
    'u-aicte': { id: 'u-aicte', email: 'aicte@acadid.demo', role: 'aicte' },
    'u-verifier': { id: 'u-verifier', email: 'verifier@acadid.demo', role: 'verifier' }
  };

  const NAV = {
    student: ['dashboard', 'myrecord', 'preflight', 'requests', 'verify', 'notifications', 'settings'],
    inst: ['dashboard', 'records', 'import', 'issues', 'preflight', 'requests', 'verify', 'analytics', 'reports', 'audit', 'notifications', 'settings'],
    aicte: ['dashboard', 'records', 'issues', 'requests', 'reports', 'audit', 'notifications', 'settings'],
    verifier: ['dashboard', 'notifications', 'settings']
  };
  const ACTIONS = {
    student: ['preflight', 'request.create', 'request.respond', 'link.create'],
    inst: ['record.create', 'record.edit', 'record.archive', 'import', 'issue.review', 'validate', 'request.manage', 'link.create', 'preflight', 'settings.thresholds', 'settings.intake'],
    aicte: ['issue.review', 'validate', 'settings.thresholds', 'settings.intake'],
    verifier: ['verify.use']
  };

  /* ======================================================================
   * 3. Store
   * ==================================================================== */
  let db = null;
  let cache = null;
  let persistOK = true;

  function loadDB() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { persistOK = false; return null; }
    if (!raw) return null;
    try {
      const d = JSON.parse(raw);
      if (d && d.v === 1 && Array.isArray(d.students)) return d;
    } catch (e) { /* corrupted data: fall through and reseed */ }
    return null;
  }
  function saveDB() {
    cache = null;
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { persistOK = false; return false; }
  }
  const nextId = (key, prefix, w) => { db.seq[key] = (db.seq[key] || 0) + 1; return prefix + pad(db.seq[key], w); };

  /* ======================================================================
   * 4. Text matching and validation engine
   * ==================================================================== */
  function normName(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  const ratio = (a, b) => { const m = Math.max(a.length, b.length); return m ? 1 - lev(a, b) / m : 1; };
  /* Similarity 0..1; also compares with words sorted so "Kumar Arun" ~ "Arun Kumar". */
  function similarity(a, b) {
    const x = normName(a), y = normName(b);
    const sortTok = (s) => s.split(' ').sort().join(' ');
    return Math.max(ratio(x, y), ratio(sortTok(x), sortTok(y)));
  }
  function apaarRe() {
    try { return new RegExp(db.settings.apaarPattern); } catch (e) { return /^\d{12}$/; }
  }
  const maskApaar = (a) => (a ? (a.length > 6 ? a.slice(0, 2) + '•'.repeat(a.length - 4) + a.slice(-2) : '•'.repeat(a.length)) : '');
  const validDate = (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  };
  const refOf = (s) => 'REC-' + s.id.slice(1);
  const instById = (id) => db.institutions.find((i) => i.id === id);
  const progById = (id) => db.programmes.find((p) => p.id === id);
  const studentById = (id) => db.students.find((s) => s.id === id);
  const instName = (id) => { const i = instById(id); return i ? i.name : '–'; };
  const progName = (id) => { const p = progById(id); return p ? p.code + ' – ' + p.name : '–'; };

  function analyze() {
    const th = db.settings.simThreshold / 100;
    const re = apaarRe();
    const S = db.students.filter((s) => !s.archived);
    const byId = new Map(db.students.map((s) => [s.id, s]));
    const issues = [];
    const add = (o) => {
      o.key = o.type + '|' + (o.ids.length ? o.ids.slice().sort().join(',') : o.progId);
      o.instIds = o.progId && !o.ids.length ? [progById(o.progId).instId] : Array.from(new Set(o.ids.map((id) => byId.get(id).instId)));
      issues.push(o);
    };

    S.forEach((s) => {
      [['name', s.name], ['dob', s.dob], ['progId', s.progId]].forEach(([f, v]) => {
        if (!String(v || '').trim()) {
          add({ type: 'missing_field', severity: 'Medium', ids: [s.id], field: FIELD_LABEL[f], a: { id: s.id, value: '(empty)' }, b: null, score: null,
            reason: 'Required field "' + FIELD_LABEL[f] + '" is empty.', action: 'Obtain the missing value from the student and update the record.' });
        }
      });
      if (!s.apaar) {
        add({ type: 'missing_apaar', severity: 'Medium', ids: [s.id], field: 'APAAR ID', a: { id: s.id, value: '(empty)' }, b: null, score: null,
          reason: 'No APAAR ID is recorded for this student.', action: 'Ask the student to provide the APAAR ID through the official channel.' });
      } else if (!re.test(s.apaar)) {
        add({ type: 'invalid_apaar', severity: 'Medium', ids: [s.id], field: 'APAAR ID', a: { id: s.id, value: maskApaar(s.apaar) }, b: null, score: null,
          reason: 'The APAAR ID does not match the configured format.', action: 'Check the identifier against the student’s documents and correct it.' });
      }
    });

    /* Same APAAR ID on more than one record. */
    const byApaar = new Map();
    S.forEach((s) => { if (s.apaar) { if (!byApaar.has(s.apaar)) byApaar.set(s.apaar, []); byApaar.get(s.apaar).push(s); } });
    byApaar.forEach((group) => {
      if (group.length < 2) return;
      add({ type: 'duplicate_apaar', severity: 'High', ids: group.map((g) => g.id), field: 'APAAR ID', a: { id: group[0].id, value: maskApaar(group[0].apaar) }, b: { id: group[1].id, value: maskApaar(group[1].apaar) }, score: null,
        reason: 'The same APAAR ID appears on ' + group.length + ' records.', action: 'Review both records and decide which is correct. Do not merge automatically.' });
      const dobs = Array.from(new Set(group.map((g) => g.dob).filter(Boolean)));
      if (dobs.length > 1) {
        const other = group.find((g) => g.dob && g.dob !== group[0].dob) || group[1];
        add({ type: 'dob_inconsistency', severity: 'High', ids: group.map((g) => g.id), field: 'Date of birth', a: { id: group[0].id, value: group[0].dob || '(empty)' }, b: { id: other.id, value: other.dob || '(empty)' }, score: null,
          reason: 'Records sharing one APAAR ID carry different dates of birth.', action: 'Verify the date of birth against the student’s certificate.' });
      }
    });

    /* Pairs that share a date of birth: compare names. */
    const byDob = new Map();
    S.forEach((s) => { if (s.dob) { if (!byDob.has(s.dob)) byDob.set(s.dob, []); byDob.get(s.dob).push(s); } });
    byDob.forEach((group) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j];
          if (a.apaar && a.apaar === b.apaar) {
            const sc = similarity(a.name, b.name);
            if (sc < 1 && sc >= th) {
              add({ type: 'name_variation', severity: 'Medium', ids: [a.id, b.id], field: 'Student name', a: { id: a.id, value: a.name }, b: { id: b.id, value: b.name }, score: sc,
                reason: 'Records with the same APAAR ID and date of birth have names that differ slightly.', action: 'Confirm the correct spelling from the student’s documents.' });
            }
            continue;
          }
          const na = normName(a.name), nb = normName(b.name);
          const sc = similarity(a.name, b.name);
          if (na && na === nb) {
            if (a.instId !== b.instId) {
              if (a.status === 'Enrolled' && b.status === 'Enrolled') {
                add({ type: 'cross_institution', severity: 'High', ids: [a.id, b.id], field: 'Enrolment', a: { id: a.id, value: a.name }, b: { id: b.id, value: b.name }, score: 1,
                  reason: 'Same name and date of birth are enrolled at two institutions at once. This may be a different person with identical details.', action: 'Refer to the institutions for a human check. Do not assume duplicate enrolment.' });
              }
            } else {
              add({ type: 'duplicate_record', severity: 'High', ids: [a.id, b.id], field: 'Student record', a: { id: a.id, value: a.name }, b: { id: b.id, value: b.name }, score: 1,
                reason: 'Two records at the same institution share a name and date of birth.', action: 'Review both records. Do not merge automatically.' });
            }
          } else if (sc >= th) {
            add({ type: 'name_variation', severity: 'Medium', ids: [a.id, b.id], field: 'Student name', a: { id: a.id, value: a.name }, b: { id: b.id, value: b.name }, score: sc,
              reason: 'Names are ' + Math.round(sc * 100) + '% similar and the date of birth matches. A similarity score is not proof of identity.', action: 'Compare the documents and mark the issue reviewed, dismissed or needing correction.' });
          }
        }
      }
    });

    /* Approved intake. */
    db.programmes.forEach((p) => {
      const n = S.filter((s) => s.progId === p.id && s.status === 'Enrolled').length;
      if (p.intake > 0 && n > p.intake) {
        add({ type: 'intake_exceeded', severity: 'Medium', ids: [], progId: p.id, field: 'Approved intake', a: { id: null, value: 'Approved intake ' + p.intake }, b: { id: null, value: 'Enrolled ' + n }, score: null,
          reason: instName(p.instId) + ', ' + p.code + ': ' + (n - p.intake) + ' more enrolled than approved.', action: 'Confirm the intake figure or review recent admissions.' });
      }
    });

    issues.sort((x, y) => SEV_RANK[x.severity] - SEV_RANK[y.severity] || x.key.localeCompare(y.key));

    const statusOf = (i) => (db.reviews[i.key] && db.reviews[i.key].status) || 'Open';
    const byStudent = new Map();
    issues.forEach((i) => i.ids.forEach((id) => { if (!byStudent.has(id)) byStudent.set(id, []); byStudent.get(id).push(i); }));
    const valMap = {};
    S.forEach((s) => {
      const incomplete = !s.name || !s.dob || !s.progId || !s.apaar;
      const open = (byStudent.get(s.id) || []).some((i) => i.type !== 'missing_apaar' && i.type !== 'missing_field' && OPEN_ISSUE.includes(statusOf(i)));
      valMap[s.id] = incomplete ? 'Incomplete' : open ? 'Needs review' : 'Valid';
    });
    return { issues, byStudent, valMap, statusOf };
  }
  function analysis() { if (!cache) cache = analyze(); return cache; }
  const issueStatus = (i) => analysis().statusOf(i);
  const valOf = (s) => (s.archived ? 'Archived' : analysis().valMap[s.id] || 'Valid');

  /* ======================================================================
   * 5. Seed data (synthetic)
   * ==================================================================== */
  function seedDB() {
    const r = rng(20261024);
    const t0 = now();
    db = {
      v: 1, institutions: [], programmes: [], students: [], requests: [], tokens: [], access: [], notifications: [], audit: [],
      imports: [], runs: [], reviews: {}, prefs: {}, contacts: [],
      seq: { rec: 0, req: 1000, evt: 0, tok: 0, imp: 0, run: 0, nt: 0, acc: 0 },
      settings: { simThreshold: 85, apaarPattern: '^\\d{12}$', slaDays: 7 }, meta: {}
    };
    const INST = [['DIT', 'Demo Institute of Technology', 'Coimbatore'], ['SCE', 'Sample College of Engineering', 'Chennai'], ['EUC', 'Example University College of Engineering', 'Madurai'], ['MPI', 'Mock Polytechnic Institute', 'Salem'], ['TSM', 'Test School of Management', 'Tiruchirappalli']];
    const PROG = {
      DIT: [['CSE', 'B.E. Computer Science and Engineering'], ['ECE', 'B.E. Electronics and Communication'], ['MEC', 'B.E. Mechanical Engineering']],
      SCE: [['CSE', 'B.E. Computer Science and Engineering'], ['ECE', 'B.E. Electronics and Communication'], ['MEC', 'B.E. Mechanical Engineering']],
      EUC: [['CSE', 'B.E. Computer Science and Engineering'], ['EEE', 'B.E. Electrical and Electronics'], ['CIV', 'B.E. Civil Engineering']],
      MPI: [['DCE', 'Diploma in Computer Engineering'], ['DEC', 'Diploma in Electronics'], ['DME', 'Diploma in Mechanical']],
      TSM: [['MBA', 'Master of Business Administration'], ['BBA', 'Bachelor of Business Administration'], ['MCA', 'Master of Computer Applications']]
    };
    INST.forEach((x, i) => {
      const inst = { id: 'I' + (i + 1), code: x[0], name: x[1], city: x[2] };
      db.institutions.push(inst);
      PROG[x[0]].forEach((p, j) => db.programmes.push({ id: 'P' + (i * 3 + j + 1), instId: inst.id, code: p[0], name: p[1], intake: 0 }));
    });

    const FIRST = ['Aarav', 'Vihaan', 'Arjun', 'Karthik', 'Surya', 'Dinesh', 'Harish', 'Naveen', 'Pranav', 'Rahul', 'Vignesh', 'Yuvan', 'Ananya', 'Divya', 'Kavya', 'Lakshmi', 'Meena', 'Nandhini', 'Priya', 'Revathi', 'Sandhya', 'Tharini', 'Uma', 'Varsha', 'Deepika', 'Harini', 'Janani', 'Keerthana'];
    const LAST = ['Krishnan', 'Subramanian', 'Ramesh', 'Natarajan', 'Venkatesh', 'Murugan', 'Selvam', 'Kannan', 'Raman', 'Iyer', 'Pillai', 'Nair', 'Sundaram', 'Balaji', 'Chandran', 'Devarajan', 'Elango', 'Gopal', 'Kumar', 'Mohan'];
    const YEARS = ['2024-25', '2025-26', '2026-27'];
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const mkDob = () => new Date(Date.UTC(2002, 0, 1) + Math.floor(r() * 2190) * DAY).toISOString().slice(0, 10);

    const addStudent = (o) => {
      const id = 'S' + pad(++db.seq.rec, 4);
      const created = o.createdAt || t0 - Math.floor(r() * 180) * DAY;
      const s = Object.assign({ id, name: '', dob: '', apaar: '', instId: '', progId: '', year: '2025-26', status: 'Enrolled', category: 'General', archived: false, createdAt: created, updatedAt: created,
        history: [{ at: created, by: 'System (demo seed)', change: 'Record created' }] }, o, { id, createdAt: created, updatedAt: created });
      db.students.push(s);
      return s;
    };

    for (let i = 0; i < 115; i++) {
      const inst = db.institutions[i % 5];
      const progs = db.programmes.filter((p) => p.instId === inst.id);
      const year = pick(YEARS);
      let status = 'Enrolled';
      const q = r();
      if (q > 0.93) status = 'Withdrawn';
      else if (q > 0.86 && year === '2024-25') status = 'Graduated';
      const c = r();
      addStudent({
        name: pick(FIRST) + ' ' + pick(LAST), dob: mkDob(), apaar: '99' + pad(700000000 + i * 104729, 10),
        instId: inst.id, progId: pick(progs).id, year, status,
        category: c < 0.9 ? 'General' : c < 0.94 ? 'NRI' : c < 0.97 ? 'OCI' : 'Foreign National'
      });
    }
    const S = db.students;
    S[0].name = 'Aarav Krishnan';                       /* demo student account */
    S[0].year = '2025-26'; S[0].status = 'Enrolled'; S[1].status = 'Enrolled'; S[4].status = 'Enrolled';
    const variant = (n) => { const p = n.split(' '); p[0] = p[0].slice(0, 1) + p[0].slice(2); return p.join(' '); };
    const otherInst = (s) => db.institutions.find((i) => i.id !== s.instId && i.id !== 'I1' ) || db.institutions[1];
    const firstProg = (instId) => db.programmes.find((p) => p.instId === instId).id;

    /* Planted data-quality cases */
    addStudent({ name: variant(S[0].name), dob: S[0].dob, apaar: '99' + pad(900000001, 10), instId: S[0].instId, progId: S[0].progId, year: S[0].year });   /* spelling variation, same institution */
    { const oi = otherInst(S[1]); addStudent({ name: S[1].name, dob: S[1].dob, apaar: '99' + pad(900000002, 10), instId: oi.id, progId: firstProg(oi.id), year: S[1].year }); } /* cross-institution */
    { const d = new Date(S[2].dob + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); addStudent({ name: S[2].name, dob: d.toISOString().slice(0, 10), apaar: S[2].apaar, instId: S[2].instId, progId: S[2].progId, year: S[2].year }); } /* same APAAR, DOB differs */
    addStudent({ name: S[3].name, dob: S[3].dob, apaar: S[3].apaar, instId: S[3].instId, progId: S[3].progId, year: S[3].year });   /* exact duplicate */
    { const oi = otherInst(S[4]); addStudent({ name: variant(S[4].name), dob: S[4].dob, apaar: '99' + pad(900000003, 10), instId: oi.id, progId: firstProg(oi.id), year: S[4].year }); }
    S[5].apaar = ''; S[6].apaar = ''; S[7].apaar = '';
    S[8].apaar = '12345'; S[9].apaar = '99AB12345678';
    S[10].dob = ''; S[11].dob = '';
    S[12].progId = '';

    /* Approved intake: slightly above enrolment, except two programmes. */
    db.programmes.forEach((p) => {
      const n = db.students.filter((s) => s.progId === p.id && s.status === 'Enrolled').length;
      p.intake = n + 2 + Math.floor(r() * 5);
    });
    [db.programmes[1], db.programmes[7]].forEach((p) => {
      const n = db.students.filter((s) => s.progId === p.id && s.status === 'Enrolled').length;
      p.intake = Math.max(1, n - 2);
    });

    db.meta.demoStudentId = S[0].id;
    db.meta.demoInstId = S[0].instId;

    /* Correction requests */
    const mkReq = (student, field, proposed, desc, status, daysAgo, reason, assignee) => {
      const created = t0 - daysAgo * DAY;
      const req = {
        id: nextId('req', 'ACR-' + new Date(t0).getFullYear() + '-', 6), studentId: student.id, instId: student.instId, field, proposed, description: desc, status,
        createdAt: created, updatedAt: created + DAY, dueAt: created + db.settings.slaDays * DAY, assignee: assignee || '', notes: [], messages: [], attachment: null,
        history: [{ at: created, by: 'Student (demo)', from: '', to: 'Submitted', reason: 'Request submitted' }]
      };
      if (status !== 'Submitted') req.history.push({ at: created + DAY, by: 'Institution admin (demo)', from: 'Submitted', to: status === 'Resolved' ? 'Approved' : status, reason: reason || 'Status updated' });
      if (status === 'Resolved') req.history.push({ at: created + 2 * DAY, by: 'Institution admin (demo)', from: 'Approved', to: 'Resolved', reason: 'Record updated by institution' });
      db.requests.push(req);
      return req;
    };
    mkReq(S[0], 'Student name', 'Aarav Krishnan', 'My name is spelled differently in another record. Please confirm the correct spelling from my SSLC certificate.', 'Under Review', 2, 'Documents received; verification started', 'Records Section (demo)');
    mkReq(S[13], 'Date of birth', '2004-03-12', 'Date of birth on the record does not match my birth certificate.', 'Action Required', 5, 'Please upload a clear copy of the birth certificate', 'Records Section (demo)');
    mkReq(S[14], 'APAAR ID', '', 'My APAAR ID is not showing on my record.', 'Resolved', 14, 'APAAR ID verified', '');
    mkReq(S[15], 'Programme', 'B.E. Computer Science and Engineering', 'Programme is shown incorrectly after branch change.', 'Submitted', 12, '', '');    /* overdue */
    mkReq(S[22], 'Student name', 'Meena Iyer', 'Spelling of my surname is incorrect.', 'Rejected', 9, 'Supporting document did not match the request', '');
    mkReq(S[30], 'Date of birth', '2003-08-02', 'Wrong date of birth.', 'Under Review', 11, 'Under review', 'Registrar Office (demo)');   /* overdue */
    mkReq(S[45], 'Date of birth', '2004-09-09', 'Date of birth does not match my certificate.', 'Action Required', 6, 'Please upload the birth certificate', 'Records Section (demo)');
    mkReq(S[41], 'APAAR ID', '', 'APAAR ID missing.', 'Submitted', 1, '', '');
    mkReq(S[52], 'Student name', 'Janani Nair', 'Name spelling mismatch.', 'Approved', 4, 'Approved. Institution to update its record.', 'Records Section (demo)');
    mkReq(S[63], 'Programme', 'MBA', 'Programme code incorrect.', 'Action Required', 8, 'Need admission letter', 'Records Section (demo)');    /* overdue */
    mkReq(S[74], 'Date of birth', '2005-01-19', 'Date of birth incorrect.', 'Submitted', 3, '', '');
    mkReq(S[85], 'Student name', 'Dinesh Raman', 'Initial missing.', 'Resolved', 20, 'Updated', '');
    mkReq(S[96], 'APAAR ID', '', 'APAAR ID missing on record.', 'Under Review', 6, 'Checking with student', '');
    db.requests[0].messages.push({ at: db.requests[0].createdAt, by: 'Student', role: 'student', text: 'Attached a copy of my SSLC certificate (demo).' });

    /* Proof links for the demo student */
    const mkTok = (label, createdOffset, expOffset, revoked, claims, purpose) => {
      const created = t0 + createdOffset;
      const tk = { id: nextId('tok', 'TK-', 4), token: randomToken(24), studentId: S[0].id, claims, purpose, createdBy: 'u-student', createdAt: created, expiresAt: t0 + expOffset, revokedAt: revoked ? created + DAY : null,
        label, consent: { by: 'u-student', at: created, statement: 'Student consented to share the selected claims for ' + purpose + '.' } };
      db.tokens.push(tk);
      return tk;
    };
    const tkA = mkTok('Active demo link', -DAY, 3 * DAY, false, ['institution', 'programme', 'enrolmentStatus'], 'Admission');
    mkTok('Expired demo link', -10 * DAY, -3 * DAY, false, ['institution', 'enrolmentStatus'], 'Scholarship');
    mkTok('Revoked demo link', -6 * DAY, 5 * DAY, true, ['name', 'institution'], 'Employment');
    db.access.push({ id: nextId('acc', 'ACC-', 5), tokenId: tkA.id, at: t0 - 6 * 3600000, actor: 'u-verifier', outcome: 'Granted' });

    /* Notifications */
    const nt = (userId, type, title, body, link, ago, read) => db.notifications.push({ id: nextId('nt', 'N', 5), userId, type, title, body, link, at: t0 - ago * 3600000, read: !!read, simulated: false });
    nt('u-student', 'Correction request', 'Your request is under review', 'Request ' + db.requests[0].id + ' moved to Under Review.', '#/app/requests', 40, false);
    nt('u-student', 'Validation alert', 'A possible name mismatch was found', 'Another record has a similar name and the same date of birth. Run the pre-flight check.', '#/app/preflight', 60, false);
    nt('u-student', 'Verification activity', 'Your proof link was opened', 'A verifier viewed the shared claims.', '#/app/verify', 6, true);
    nt('u-inst', 'Validation alert', 'Validation found records to review', 'Open the mismatch queue to review flagged records.', '#/app/issues', 30, false);
    nt('u-inst', 'Overdue grievance', 'Correction requests are overdue', 'Some requests have passed their response deadline.', '#/app/requests?f=overdue', 20, false);
    nt('u-inst', 'Administrative', 'Demo data loaded', 'Synthetic demo records are ready.', '#/app/records', 72, true);
    nt('u-aicte', 'Administrative', 'Demo institutions loaded', 'Five fictional institutions are available in analytics.', '#/app/dashboard', 72, true);
    nt('u-aicte', 'Mismatch review', 'Potential duplicates need review', 'Open the mismatch queue.', '#/app/issues', 24, false);
    nt('u-verifier', 'Verification activity', 'Demo proof links available', 'Use the demo links on your dashboard to test verification.', '#/app/dashboard', 10, false);

    /* Audit seed */
    const au = (actor, role, action, target, instId, ago) => db.audit.push({ id: nextId('evt', 'EVT-', 6), at: t0 - ago * 3600000, actor: { id: actor, role, name: ROLE_LABEL[role] }, action, target, instId: instId || null, meta: {} });
    au('system', 'aicte', 'seed.load', 'Demo dataset', null, 96);
    au('u-inst', 'inst', 'auth.login', 'Session', S[0].instId, 50);
    au('u-inst', 'inst', 'validation.run', 'Institution records', S[0].instId, 49);
    au('u-student', 'student', 'request.create', db.requests[0].id, S[0].instId, 48);
    au('u-inst', 'inst', 'request.status', db.requests[0].id, S[0].instId, 46);
    au('u-student', 'student', 'link.create', db.tokens[0].id, S[0].instId, 30);
    au('u-verifier', 'verifier', 'link.access', db.tokens[0].id, S[0].instId, 6);

    db.runs.push({ id: nextId('run', 'RUN-', 4), at: t0 - 49 * 3600000, by: 'u-inst', trigger: 'Initial seed', total: db.students.length, issues: 0, high: 0 });
    cache = null;
    const a = analysis();
    db.runs[0].issues = a.issues.length;
    db.runs[0].high = a.issues.filter((i) => i.severity === 'High').length;
    return db;
  }

  /* ======================================================================
   * 6. Session, users, permissions
   * ==================================================================== */
  let session = null;
  let me = null;
  const loginFails = { n: 0, until: 0 };

  function readSession() {
    let s = session;
    if (!s) { try { s = JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { s = null; } }
    if (s && s.exp > now() && USERS[s.uid]) { session = s; return s; }
    session = null;
    try { sessionStorage.removeItem(SKEY); } catch (e) { /* ignore */ }
    return null;
  }
  function writeSession(s) {
    session = s;
    try { sessionStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* in-memory only */ }
  }
  function buildUser(uid) {
    const u = USERS[uid];
    const out = { id: u.id, email: u.email, role: u.role, instId: null, studentId: null, name: '' };
    if (u.role === 'student') { out.studentId = db.meta.demoStudentId; const s = studentById(out.studentId); out.instId = s ? s.instId : null; out.name = s ? s.name : 'Student'; }
    else if (u.role === 'inst') { out.instId = db.meta.demoInstId; out.name = 'Institution Admin · ' + instName(out.instId); }
    else if (u.role === 'aicte') { out.name = 'AICTE Administrator (demo role)'; }
    else { out.name = 'Academic Verifier (demo)'; }
    return out;
  }
  const can = (action) => !!me && (ACTIONS[me.role] || []).includes(action);
  const canPage = (page) => !!me && !!PAGES[page] && PAGES[page].roles.includes(me.role);
  function requireAction(action) {
    if (!can(action)) { toast('You do not have permission to do that.', 'error'); return false; }
    return true;
  }
  function signIn(uid) {
    const old = readSession();
    if (old) writeSession(null);
    writeSession({ uid, exp: now() + SESSION_MS });
    me = buildUser(uid);
    audit('auth.login', 'Session');
    saveDB();
  }
  function signOut(reason) {
    if (me) { audit('auth.logout', 'Session'); saveDB(); }
    session = null; me = null;
    try { sessionStorage.removeItem(SKEY); } catch (e) { /* ignore */ }
    if (reason) toast(reason, 'info');
    location.hash = '#/login';
  }
  let lastTouch = 0;
  function touch() {
    const s = readSession();
    if (!s) return;
    if (now() - lastTouch > 15000) { lastTouch = now(); s.exp = now() + SESSION_MS; writeSession(s); }
  }
  function checkSession() {
    if (me && !readSession()) { me = null; toast('Your session expired. Please sign in again.', 'info'); location.hash = '#/login'; }
  }

  /* ---------- audit + notifications ---------- */
  function audit(action, target, meta, instId) {
    const actor = me ? { id: me.id, role: me.role, name: ROLE_LABEL[me.role] } : { id: 'anonymous', role: 'verifier', name: 'Verifier (anonymous)' };
    db.audit.unshift({ id: nextId('evt', 'EVT-', 6), at: now(), actor, action, target: target || '', instId: instId !== undefined ? instId : (me ? me.instId : null), meta: meta || {} });
    if (db.audit.length > 1000) db.audit.length = 1000;
  }
  function notify(userId, type, title, body, link, simulated) {
    if (!userId) return;
    db.notifications.unshift({ id: nextId('nt', 'N', 5), userId, type, title, body, link: link || '', at: now(), read: false, simulated: !!simulated });
    if (db.notifications.length > 500) db.notifications.length = 500;
  }
  const instAdminFor = (instId) => (instId === db.meta.demoInstId ? 'u-inst' : null);
  const studentUserFor = (studentId) => (studentId === db.meta.demoStudentId ? 'u-student' : null);

  /* ======================================================================
   * 7. Scope helpers and metrics
   * ==================================================================== */
  function scopedStudents(includeArchived) {
    let list = db.students;
    if (me.role === 'inst') list = list.filter((s) => s.instId === me.instId);
    else if (me.role === 'student') list = list.filter((s) => s.id === me.studentId);
    else if (me.role === 'verifier') list = [];
    return includeArchived ? list : list.filter((s) => !s.archived);
  }
  const scopedProgrammes = () => db.programmes.filter((p) => me.role !== 'inst' || p.instId === me.instId);
  const scopedInstitutions = () => db.institutions.filter((i) => me.role !== 'inst' || i.id === me.instId);
  const visibleParty = (id) => !id || me.role !== 'inst' || (studentById(id) && studentById(id).instId === me.instId);
  const partyVal = (p) => (!p ? '–' : visibleParty(p.id) ? esc(p.value) : '<span class="muted">Hidden (other institution)</span>');

  function issuesInScope() {
    const a = analysis();
    return a.issues.filter((i) => {
      if (me.role === 'aicte') return true;
      if (me.role === 'inst') return i.instIds.includes(me.instId);
      if (me.role === 'student') return i.ids.includes(me.studentId);
      return false;
    });
  }

  /* Shared by dashboards, analytics, reports so that numbers always agree. */
  function metrics(f) {
    f = f || {};
    let students = scopedStudents();
    if (me.role === 'aicte' && f.inst) students = students.filter((s) => s.instId === f.inst);
    if (f.prog) students = students.filter((s) => s.progId === f.prog);
    if (f.from) students = students.filter((s) => s.createdAt >= new Date(f.from + 'T00:00:00').getTime());
    if (f.to) students = students.filter((s) => s.createdAt <= new Date(f.to + 'T23:59:59').getTime());
    const ids = new Set(students.map((s) => s.id));
    let progs = scopedProgrammes();
    if (me.role === 'aicte' && f.inst) progs = progs.filter((p) => p.instId === f.inst);
    if (f.prog) progs = progs.filter((p) => p.id === f.prog);
    const a = analysis();
    const issues = issuesInScope().filter((i) => (i.ids.length ? i.ids.some((id) => ids.has(id)) : progs.some((p) => p.id === i.progId)));
    const open = issues.filter((i) => OPEN_ISSUE.includes(a.statusOf(i)));
    const dupIds = new Set();
    open.filter((i) => DUP_TYPES.includes(i.type)).forEach((i) => i.ids.forEach((id) => { if (ids.has(id)) dupIds.add(id); }));
    const reqs = db.requests.filter((r) => ids.has(r.studentId));
    const pending = reqs.filter((r) => OPEN_REQ.includes(r.status));
    const overdue = pending.filter((r) => r.dueAt < now());
    const fields = ['name', 'dob', 'apaar', 'instId', 'progId', 'year'];
    const filled = students.reduce((n, s) => n + fields.filter((k) => String(s[k] || '').trim()).length, 0);
    const enrolled = students.filter((s) => s.status === 'Enrolled').length;
    const val = { Valid: 0, 'Needs review': 0, Incomplete: 0 };
    students.forEach((s) => { val[a.valMap[s.id]] = (val[a.valMap[s.id]] || 0) + 1; });
    const byProg = progs.map((p) => ({ p, intake: p.intake, enrolled: students.filter((s) => s.progId === p.id && s.status === 'Enrolled').length }));
    const instIds = Array.from(new Set(progs.map((p) => p.instId)));
    const byInst = instIds.map((iid) => {
      const st = students.filter((s) => s.instId === iid);
      const sid = new Set(st.map((s) => s.id));
      const iss = open.filter((i) => i.instIds.includes(iid));
      const rq = pending.filter((r) => r.instId === iid);
      return {
        inst: instById(iid), records: st.length, enrolled: st.filter((s) => s.status === 'Enrolled').length,
        intake: progs.filter((p) => p.instId === iid).reduce((n, p) => n + p.intake, 0),
        missingApaar: st.filter((s) => !s.apaar).length, incomplete: st.filter((s) => a.valMap[s.id] === 'Incomplete').length,
        openIssues: iss.length, pending: rq.length, overdue: rq.filter((r) => r.dueAt < now()).length, sid
      };
    });
    const cats = {};
    CATEGORIES.forEach((c) => { cats[c] = students.filter((s) => s.category === c).length; });
    const months = {};
    students.forEach((s) => { const d = new Date(s.createdAt); const k = d.getFullYear() + '-' + pad(d.getMonth() + 1, 2); months[k] = (months[k] || 0) + 1; });
    const issueTypes = {};
    open.forEach((i) => { issueTypes[i.type] = (issueTypes[i.type] || 0) + 1; });
    const reqStatus = {};
    REQ_STATUS.forEach((st) => { reqStatus[st] = reqs.filter((r) => r.status === st).length; });
    return {
      students, ids, progs, issues, open, total: students.length, enrolled, intake: progs.reduce((n, p) => n + p.intake, 0),
      valid: val.Valid, needs: val['Needs review'], incomplete: val.Incomplete, missingApaar: students.filter((s) => !s.apaar).length,
      dupRecords: dupIds.size, pending: pending.length, overdue: overdue.length, completeness: pct(filled, students.length * fields.length),
      institutions: instIds.length, byProg, byInst, cats, months, issueTypes, reqStatus, val
    };
  }

  /* ======================================================================
   * 8. UI helpers
   * ==================================================================== */
  const view = () => $('#view');
  function toast(msg, kind) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast toast-' + (kind || 'info');
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, kind === 'error' ? 6000 : 3800);
  }
  function persist(okMsg) {
    const ok = saveDB();
    if (!ok) { toast('Could not save changes in this browser (storage unavailable). They will be lost when you close the page.', 'error'); return false; }
    if (okMsg) toast(okMsg, 'success');
    return true;
  }
  function openModal(title, html, wide) {
    const d = $('#modal');
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    d.classList.toggle('modal-wide', !!wide);
    hydrateIcons(d);
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  }
  function closeModal() { const d = $('#modal'); if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } $('#modalBody').innerHTML = ''; }
  let confirmResolve = null;
  function confirmDialog(title, msg, okLabel) {
    return new Promise((resolve) => {
      const d = $('#confirm');
      $('#confirmTitle').textContent = title;
      $('#confirmMsg').textContent = msg;
      $('#confirmYes').textContent = okLabel || 'Confirm';
      confirmResolve = resolve;
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    });
  }
  function resolveConfirm(v) {
    const d = $('#confirm');
    if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); }
    if (confirmResolve) { const f = confirmResolve; confirmResolve = null; f(v); }
  }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function toCSV(rows) {
    return rows.map((row) => row.map((c) => {
      let v = c == null ? '' : String(c);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;          /* neutralise spreadsheet formulas */
      return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')).join('\r\n');
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); f = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); if (row.length > 1 || row[0] !== '') rows.push(row); }
    return { rows, unterminated: q };
  }

  const badge = (cls, txt) => '<span class="badge badge-' + cls + '">' + esc(txt) + '</span>';
  const valBadge = (v) => badge(v === 'Valid' ? 'success' : v === 'Needs review' ? 'warning' : v === 'Incomplete' ? 'danger' : 'neutral', v);
  const sevBadge = (v) => badge(v === 'High' ? 'danger' : v === 'Medium' ? 'warning' : 'info', v);
  const reqBadge = (v) => badge(v === 'Approved' || v === 'Resolved' ? 'success' : v === 'Rejected' ? 'danger' : v === 'Action Required' ? 'warning' : 'info', v);
  const issBadge = (v) => badge(v === 'Open' ? 'info' : v === 'Needs correction' ? 'warning' : v === 'Reviewed' ? 'success' : 'neutral', v);
  const empty = (title, hint, action) => '<div class="empty"><h3>' + esc(title) + '</h3><p>' + esc(hint || '') + '</p>' + (action || '') + '</div>';
  const opt = (v, label, sel) => '<option value="' + esc(v) + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>';
  const themeBtn = () => '<button type="button" class="icon-btn theme-toggle" data-action="toggle-theme" aria-label="Switch to dark mode" aria-pressed="false"><span class="ico-moon" data-icon="moon"></span><span class="ico-sun" data-icon="sun"></span></button>';
  const brand = (href) => '<a class="brand" href="' + (href || '#/') + '" aria-label="AcadID home"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" class="bm-bg"/><path d="M16 6l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V9z" class="bm-shield"/><path d="M12.5 15.5l2.5 2.5 4.5-5" class="bm-check"/></svg><span class="brand-word">Acad<b>ID</b></span></a>';

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('acadid.theme', t); } catch (e) { /* ignore */ }
    syncThemeButtons();
  }
  function syncThemeButtons() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $$('.theme-toggle').forEach((b) => {
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      b.setAttribute('aria-pressed', dark ? 'true' : 'false');
      b.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }

  /* Field-level validation display */
  function clearErrors(form) {
    $$('.err-msg', form).forEach((e) => e.remove());
    $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
    const fe = $('.form-error', form); if (fe) { fe.hidden = true; fe.textContent = ''; }
  }
  function showErrors(form, errs) {
    clearErrors(form);
    let first = null;
    Object.keys(errs).forEach((name) => {
      const input = form.elements[name];
      if (input && input.nodeType === 1) {
        const m = document.createElement('small');
        m.className = 'err-msg'; m.id = 'err-' + name + '-' + Math.random().toString(36).slice(2, 7); m.textContent = errs[name];
        input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', m.id);
        const holder = input.closest('.field') || input.parentNode;
        holder.appendChild(m);
        if (!first) first = input;
      } else {
        const fe = $('.form-error', form);
        if (fe) { fe.hidden = false; fe.textContent = (fe.textContent ? fe.textContent + ' ' : '') + errs[name]; }
      }
    });
    if (first) first.focus();
  }
  const fv = (form, name) => (form.elements[name] ? String(form.elements[name].value).trim() : '');

  /* ======================================================================
   * 9. Page state
   * ==================================================================== */
  const UI0 = () => ({
    records: { q: '', inst: '', prog: '', year: '', val: '', status: '', apaar: '', archived: false, sort: 'name', dir: 1, page: 1 },
    issues: { q: '', sev: '', type: '', status: '', sort: 'sev', dir: 1, page: 1 },
    requests: { q: '', status: '', f: '', page: 1 },
    audit: { q: '', page: 1 },
    notifications: { unread: false },
    analytics: { inst: '', prog: '', from: '', to: '', q: '' },
    dashboard: { prog: '' },
    imp: null, pf: null
  });
  let ui = UI0();
  const PAGE_SIZE = 10;
  let pendingScroll = null;

  /* ======================================================================
   * 10. Charts (plain HTML/CSS – no external chart library)
   * ==================================================================== */
  function pairBars(rows, aLabel, bLabel, title) {
    if (!rows.length) return empty('No data for these filters', 'Change the filters to see results.');
    const max = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
    const summary = title + ': ' + rows.map((r) => r.label + ' ' + bLabel.toLowerCase() + ' ' + r.b + ' of ' + r.a).join('; ');
    return '<figure class="chart"><figcaption class="sr-only">' + esc(summary) + '</figcaption><div class="legend" aria-hidden="true"><span class="lg lg-a"></span>' + esc(aLabel) + '<span class="lg lg-b"></span>' + esc(bLabel) + '</div>' +
      rows.map((r) => '<div class="bar-row" aria-hidden="true"><div class="bar-label" title="' + esc(r.label) + '">' + esc(r.label) + '</div><div class="bar-tracks">' +
        '<div class="bar bar-a" style="width:' + (r.a / max * 100) + '%" title="' + esc(aLabel + ': ' + r.a) + '"></div>' +
        '<div class="bar bar-b' + (r.b > r.a ? ' over' : '') + '" style="width:' + (r.b / max * 100) + '%" title="' + esc(bLabel + ': ' + r.b) + '"></div></div>' +
        '<div class="bar-val">' + r.b + ' / ' + r.a + (r.b > r.a ? ' <span class="over-tag">over</span>' : '') + '</div></div>').join('') + '</figure>';
  }
  function singleBars(items, title) {
    const total = items.reduce((n, i) => n + i.value, 0);
    if (!total) return empty('Nothing to show', 'No items match the current filters.');
    const max = Math.max(1, ...items.map((i) => i.value));
    return '<figure class="chart"><figcaption class="sr-only">' + esc(title + ': ' + items.map((i) => i.label + ' ' + i.value).join('; ')) + '</figcaption>' +
      items.map((i) => '<div class="bar-row" aria-hidden="true"><div class="bar-label" title="' + esc(i.label) + '">' + esc(i.label) + '</div><div class="bar-tracks"><div class="bar bar-b" style="width:' + (i.value / max * 100) + '%" title="' + esc(i.label + ': ' + i.value) + '"></div></div><div class="bar-val">' + i.value + '</div></div>').join('') + '</figure>';
  }
  function stackBar(items, title) {
    const total = items.reduce((n, i) => n + i.value, 0);
    if (!total) return empty('Nothing to show', 'No records match the current filters.');
    return '<figure class="chart"><figcaption class="sr-only">' + esc(title + ': ' + items.map((i) => i.label + ' ' + i.value).join('; ')) + '</figcaption><div class="stack" aria-hidden="true">' +
      items.filter((i) => i.value).map((i) => '<div class="seg seg-' + i.cls + '" style="flex:' + i.value + '" title="' + esc(i.label + ': ' + i.value) + '">' + (i.value / total > 0.08 ? i.value : '') + '</div>').join('') + '</div><ul class="legend-list">' +
      items.map((i) => '<li><span class="lg lg-' + i.cls + '"></span>' + esc(i.label) + ' <b>' + i.value + '</b> <span class="muted">(' + pct(i.value, total) + '%)</span></li>').join('') + '</ul></figure>';
  }
  function columns(items, title) {
    if (!items.length) return empty('Nothing to show', 'No records match the current filters.');
    const max = Math.max(1, ...items.map((i) => i.value));
    return '<figure class="chart"><figcaption class="sr-only">' + esc(title + ': ' + items.map((i) => i.label + ' ' + i.value).join('; ')) + '</figcaption><div class="cols" aria-hidden="true">' +
      items.map((i) => '<div class="col"><span class="col-val">' + i.value + '</span><div class="col-bar" style="height:' + Math.max(4, i.value / max * 100) + '%" title="' + esc(i.label + ': ' + i.value) + '"></div><span class="col-label">' + esc(i.label) + '</span></div>').join('') + '</div></figure>';
  }

  /* ======================================================================
   * 11. Pages registry
   * ==================================================================== */
  const PAGES = {
    dashboard: { title: 'Dashboard', icon: 'home', roles: ['student', 'inst', 'aicte', 'verifier'] },
    myrecord: { title: 'My record', icon: 'file', roles: ['student'] },
    records: { title: 'Student records', icon: 'users', roles: ['inst', 'aicte'] },
    import: { title: 'CSV import', icon: 'upload', roles: ['inst'] },
    issues: { title: 'Mismatch detection', icon: 'alert', roles: ['inst', 'aicte'] },
    preflight: { title: 'Pre-flight checker', icon: 'clipboard', roles: ['student', 'inst'] },
    requests: { title: 'Correction requests', icon: 'ticket', roles: ['student', 'inst', 'aicte'] },
    verify: { title: 'Proof links', icon: 'link', roles: ['student', 'inst'] },
    analytics: { title: 'Analytics', icon: 'chart', roles: ['inst', 'aicte'] },
    reports: { title: 'Reports and exports', icon: 'download', roles: ['inst', 'aicte'] },
    audit: { title: 'Audit log', icon: 'scroll', roles: ['inst', 'aicte'] },
    notifications: { title: 'Notifications', icon: 'bell', roles: ['student', 'inst', 'aicte', 'verifier'] },
    settings: { title: 'Settings and profile', icon: 'gear', roles: ['student', 'inst', 'aicte', 'verifier'] }
  };
  const pageTitle = (p) => (p === 'dashboard' && me.role === 'aicte' ? 'National dashboard (demo)' : PAGES[p].title);
  const head = (title, actions, sub) => '<div class="page-head"><div><h1 id="pageTitle">' + esc(title) + '</h1>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div><div class="page-actions">' + (actions || '') + '</div></div>';
  const statCard = (href, label, value, hint, tone) => '<a class="stat-card' + (tone ? ' tone-' + tone : '') + '" href="' + href + '"><span class="stat-label">' + esc(label) + '</span><span class="stat-value">' + value + '</span>' + (hint ? '<span class="stat-hint">' + esc(hint) + '</span>' : '') + '</a>';
  const tokenState = (t) => (t.revokedAt ? 'Revoked' : t.expiresAt <= now() ? 'Expired' : 'Active');
  const tokBadge = (st) => badge(st === 'Active' ? 'success' : st === 'Revoked' ? 'danger' : 'neutral', st);
  const isOverdue = (r) => OPEN_REQ.includes(r.status) && r.dueAt < now();
  const th = (ns, key, label) => {
    const f = ui[ns];
    const on = f.sort === key;
    return '<th scope="col" aria-sort="' + (on ? (f.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="th-btn" data-action="sort" data-ns="' + ns + '" data-k="' + key + '">' + esc(label) + '<span class="sort-ind" aria-hidden="true">' + (on ? (f.dir > 0 ? ' ▲' : ' ▼') : '') + '</span></button></th>';
  };
  function pager(ns, total, page) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (total <= PAGE_SIZE) return '<p class="muted small" aria-live="polite">Showing ' + total + ' result' + (total === 1 ? '' : 's') + '</p>';
    const from = (page - 1) * PAGE_SIZE + 1, to = Math.min(total, page * PAGE_SIZE);
    return '<div class="pager"><span class="muted small" aria-live="polite">Showing ' + from + '–' + to + ' of ' + total + '</span><div><button type="button" class="btn btn-secondary btn-sm" data-action="page" data-ns="' + ns + '" data-p="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>Previous</button> <span class="small">Page ' + page + ' of ' + pages + '</span> <button type="button" class="btn btn-secondary btn-sm" data-action="page" data-ns="' + ns + '" data-p="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>Next</button></div></div>';
  }
  const sortBy = (arr, getter, dir) => arr.slice().sort((x, y) => {
    const a = getter(x), b = getter(y);
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * dir;
    return String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' }) * dir;
  });

  /* ======================================================================
   * 12. Dashboards
   * ==================================================================== */
  function pgDashboard() {
    if (me.role === 'student') return dashStudent();
    if (me.role === 'inst') return dashInst();
    if (me.role === 'aicte') return pgAnalytics();
    return dashVerifier();
  }

  function dashStudent() {
    const s = studentById(me.studentId);
    const a = analysis();
    const open = (a.byStudent.get(s.id) || []).filter((i) => OPEN_ISSUE.includes(a.statusOf(i)));
    const reqs = db.requests.filter((r) => r.studentId === s.id);
    const openReq = reqs.filter((r) => OPEN_REQ.includes(r.status));
    const toks = db.tokens.filter((t) => t.studentId === s.id);
    const active = toks.filter((t) => tokenState(t) === 'Active');
    const fields = ['name', 'dob', 'apaar', 'instId', 'progId', 'year'];
    const complete = pct(fields.filter((k) => String(s[k] || '').trim()).length, fields.length);
    const ids = new Set(reqs.map((r) => r.id).concat(toks.map((t) => t.id)));
    const acts = db.audit.filter((e) => ids.has(e.target) || (e.actor.id === me.id)).slice(0, 6);
    const notes = db.notifications.filter((n) => n.userId === me.id).slice(0, 4);
    const ready = open.length ? 'Run the pre-flight check before raising a correction, so you know which documents to bring.' : 'No open flags on your record. You can still raise a request if something looks wrong.';
    return head('Welcome, ' + s.name.split(' ')[0], '<a class="btn btn-primary" href="#/app/preflight">Run pre-flight check</a>', 'Synthetic demo student account') +
      '<div class="grid grid-4 stats">' +
        statCard('#/app/myrecord', 'Record completeness', complete + '%', 'View academic record') +
        statCard('#/app/myrecord', 'Validation status', esc(valOf(s)), 'APAAR: ' + (s.apaar ? maskApaar(s.apaar) : 'not on record'), valOf(s) === 'Valid' ? 'ok' : 'warn') +
        statCard('#/app/preflight', 'Potential mismatches', open.length, 'Open flags on your record', open.length ? 'warn' : 'ok') +
        statCard('#/app/requests', 'Open requests', openReq.length, 'Track a correction') +
      '</div>' +
      '<div class="grid grid-2">' +
        '<section class="card"><h2>Your record</h2><dl class="kv"><dt>Institution</dt><dd>' + esc(instName(s.instId)) + '</dd><dt>Programme</dt><dd>' + esc(progName(s.progId)) + '</dd><dt>Academic year</dt><dd>' + esc(s.year) + '</dd><dt>Enrolment status</dt><dd>' + esc(s.status) + '</dd><dt>APAAR ID</dt><dd>' + (s.apaar ? esc(maskApaar(s.apaar)) + ' (masked)' : 'Not on record') + '</dd></dl>' +
          '<h3>Correction readiness</h3><p>' + esc(ready) + '</p><div class="btn-row"><a class="btn btn-secondary" href="#/app/myrecord">View academic record</a><a class="btn btn-secondary" href="#/app/requests?new=1">Start a correction request</a></div></section>' +
        '<section class="card"><h2>Flags on your record</h2>' + (open.length ? '<ul class="plain-list">' + open.map((i) => '<li>' + sevBadge(i.severity) + ' <b>' + esc(ISSUE_TYPES[i.type]) + '</b> <span class="muted">· ' + esc(i.field) + '</span><br><span class="small">' + esc(i.type === 'intake_exceeded' ? '' : i.reason) + '</span></li>').join('') + '</ul><p class="small muted">Flags are prompts for human review, not conclusions.</p>' : empty('No open flags', 'Nothing needs your attention right now.')) + '</section>' +
        '<section class="card"><h2>Correction requests</h2>' + (reqs.length ? '<ul class="plain-list">' + reqs.slice(0, 4).map((r) => '<li><a href="#/app/requests?open=' + esc(r.id) + '"><b>' + esc(r.id) + '</b></a> · ' + esc(r.field) + ' ' + reqBadge(r.status) + (isOverdue(r) ? ' ' + badge('danger', 'Overdue') : '') + '</li>').join('') + '</ul>' : empty('No requests yet', 'Raise a request if any detail on your record is wrong.', '<a class="btn btn-secondary" href="#/app/requests?new=1">New request</a>')) + '</section>' +
        '<section class="card"><h2>Academic proof links</h2><p>' + (active.length ? active.length + ' active link' + (active.length === 1 ? '' : 's') + '.' : 'No active links.') + '</p>' +
          (active.length ? '<ul class="plain-list">' + active.map((t) => '<li>' + esc(t.id) + ' · ' + esc(t.purpose) + ' · expires ' + esc(fmtDT(t.expiresAt)) + ' <button type="button" class="btn btn-danger btn-sm" data-action="link-revoke" data-id="' + esc(t.id) + '">Revoke</button></li>').join('') + '</ul>' : '') +
          '<a class="btn btn-secondary" href="#/app/verify">Manage proof links</a></section>' +
        '<section class="card"><h2>Notifications</h2>' + (notes.length ? '<ul class="plain-list">' + notes.map((n) => '<li class="' + (n.read ? '' : 'unread') + '"><a href="' + esc(n.link || '#/app/notifications') + '"><b>' + esc(n.title) + '</b></a><br><span class="small muted">' + esc(fmtDT(n.at)) + '</span></li>').join('') + '</ul>' : empty('No notifications', 'Updates will appear here.')) + '<a class="btn btn-secondary" href="#/app/notifications">Open notification centre</a></section>' +
        '<section class="card"><h2>Recent activity</h2>' + (acts.length ? '<ul class="plain-list">' + acts.map((e) => '<li>' + esc(e.action) + ' <span class="muted">· ' + esc(fmtDT(e.at)) + '</span></li>').join('') + '</ul>' : empty('No activity yet', 'Your actions will be listed here.')) + '</section>' +
      '</div>';
  }

  function dashInst() {
    const f = ui.dashboard;
    const m = metrics({ prog: f.prog });
    const a = analysis();
    const progOpts = opt('', 'All programmes', f.prog) + scopedProgrammes().map((p) => opt(p.id, p.code + ' – ' + p.name, f.prog)).join('');
    const acts = db.audit.filter((e) => e.instId === me.instId).slice(0, 8);
    const pq = f.prog ? '&prog=' + encodeURIComponent(f.prog) : '';
    return head('Institution dashboard', '<a class="btn btn-primary" href="#/app/import">' + ic('upload') + ' Upload CSV</a><a class="btn btn-secondary" href="#/app/issues">Review flags</a>', esc(instName(me.instId)) + ' · synthetic data') +
      '<div class="card filters"><form class="inline-form" data-form="dash-search" role="search"><div class="field grow"><label for="ds-q">Search records</label><input id="ds-q" name="q" type="search" placeholder="Name, record reference or APAAR ID"></div><button class="btn btn-secondary" type="submit">' + ic('search') + ' Search</button></form>' +
        '<div class="field"><label for="ds-prog">Programme</label><select id="ds-prog" data-f="dashboard:prog" data-full="1">' + progOpts + '</select></div></div>' +
      '<div class="grid grid-5 stats">' +
        statCard('#/app/records?x=1' + pq, 'Total records', m.total, 'All active records') +
        statCard('#/app/records?val=Valid' + pq, 'Validated', m.valid, pct(m.valid, m.total) + '% of records', 'ok') +
        statCard('#/app/records?val=Incomplete' + pq, 'Incomplete', m.incomplete, 'Missing a required field', m.incomplete ? 'warn' : '') +
        statCard('#/app/records?apaar=missing' + pq, 'Missing APAAR IDs', m.missingApaar, 'No identifier on record', m.missingApaar ? 'warn' : '') +
        statCard('#/app/issues?type=dups', 'Potential duplicates', m.dupRecords, 'Records in open duplicate flags', m.dupRecords ? 'warn' : '') +
        statCard('#/app/records?val=Needs%20review' + pq, 'Need review', m.needs, 'Open flags to review', m.needs ? 'warn' : '') +
        statCard('#/app/analytics', 'Intake vs enrolment', m.enrolled + ' / ' + m.intake, 'Enrolled / approved intake', m.enrolled > m.intake ? 'bad' : '') +
        statCard('#/app/requests?f=open', 'Pending requests', m.pending, 'Awaiting action') +
        statCard('#/app/requests?f=overdue', 'Overdue requests', m.overdue, 'Past deadline', m.overdue ? 'bad' : 'ok') +
        statCard('#/app/audit', 'Open flags', m.open.length, 'Across all types') +
      '</div>' +
      '<div class="grid grid-2"><section class="card"><h2>Approved intake vs enrolment</h2>' + pairBars(m.byProg.map((r) => ({ label: r.p.code, a: r.intake, b: r.enrolled })), 'Approved intake', 'Enrolled', 'Approved intake versus enrolment by programme') + '</section>' +
        '<section class="card"><h2>Validation status</h2>' + stackBar([{ label: 'Valid', value: m.valid, cls: 'ok' }, { label: 'Needs review', value: m.needs, cls: 'warn' }, { label: 'Incomplete', value: m.incomplete, cls: 'bad' }], 'Validation status of records') + '</section></div>' +
      '<section class="card"><h2>Recent institutional activity</h2>' + (acts.length ? tbl(['<th scope="col">When</th>', '<th scope="col">Actor</th>', '<th scope="col">Action</th>', '<th scope="col">Target</th>'], acts.map((e) => '<tr><td>' + esc(fmtDT(e.at)) + '</td><td>' + esc(e.actor.name) + '</td><td>' + esc(e.action) + '</td><td>' + esc(e.target) + '</td></tr>')) : empty('No activity yet', 'Imports, edits and reviews will appear here.')) + '</section>';
  }
  function tbl(headCells, rows, cls) { return '<div class="table-wrap"><table class="' + (cls || '') + '"><thead><tr>' + headCells.join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }

  function dashVerifier() {
    const mine = db.access.filter((x) => x.actor === me.id).slice(0, 8);
    const demo = db.tokens.filter((t) => t.label);
    return head('Verifier dashboard', '', 'Open a proof link to see only the claims a student chose to share') +
      '<div class="grid grid-2"><section class="card"><h2>Open a proof link</h2><form class="form" data-form="open-token" novalidate><div class="field"><label for="ot">Proof link or token</label><input id="ot" name="token" autocomplete="off" placeholder="Paste the link you received" required></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Verify</button></form>' +
        '<p class="small muted">The page checks the token on every visit. Expired or revoked links reveal nothing. This is a simulated verification on demo data, not an official AICTE or APAAR result. Links work only in the browser where the demo data lives.</p></section>' +
      '<section class="card"><h2>Demo links for testing</h2><ul class="plain-list">' + demo.map((t) => '<li>' + tokBadge(tokenState(t)) + ' <b>' + esc(t.label) + '</b><br><a href="#/verify/' + esc(t.token) + '">Open this link</a></li>').join('') + '</ul></section></div>' +
      '<section class="card"><h2>Your recent verifications</h2>' + (mine.length ? tbl(['<th scope="col">When</th>', '<th scope="col">Link</th>', '<th scope="col">Outcome</th>'], mine.map((x) => '<tr><td>' + esc(fmtDT(x.at)) + '</td><td>' + esc(x.tokenId) + '</td><td>' + esc(x.outcome) + '</td></tr>')) : empty('Nothing yet', 'Open a link above to start.')) + '</section>';
  }

  /* ======================================================================
   * 13. Student records
   * ==================================================================== */
  function filteredRecords() {
    const f = ui.records;
    let list = scopedStudents(f.archived);
    if (me.role === 'aicte' && f.inst) list = list.filter((s) => s.instId === f.inst);
    if (f.prog) list = list.filter((s) => s.progId === f.prog);
    if (f.year) list = list.filter((s) => s.year === f.year);
    if (f.status) list = list.filter((s) => s.status === f.status);
    if (f.val) list = list.filter((s) => valOf(s) === f.val);
    if (f.apaar === 'missing') list = list.filter((s) => !s.apaar);
    const q = f.q.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || refOf(s).toLowerCase().includes(q) || (s.apaar && s.apaar.includes(q)) || instName(s.instId).toLowerCase().includes(q));
    const getters = { ref: (s) => s.id, name: (s) => s.name, inst: (s) => instName(s.instId), prog: (s) => (progById(s.progId) || { code: '' }).code, year: (s) => s.year, status: (s) => s.status, val: (s) => valOf(s), updated: (s) => s.updatedAt };
    return sortBy(list, getters[f.sort] || getters.name, f.dir);
  }
  function recordsTable() {
    const f = ui.records;
    const list = filteredRecords();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (f.page > pages) f.page = pages;
    const rows = list.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);
    if (!list.length) return empty('No records match', 'Try clearing a filter or changing the search text.', '<button type="button" class="btn btn-secondary" data-action="clear-filters" data-ns="records">Clear filters</button>');
    return tbl([th('records', 'ref', 'Reference'), th('records', 'name', 'Name'), '<th scope="col">APAAR ID</th>', th('records', 'inst', 'Institution'), th('records', 'prog', 'Programme'), th('records', 'year', 'Year'), th('records', 'status', 'Enrolment'), '<th scope="col">Category</th>', th('records', 'val', 'Validation'), th('records', 'updated', 'Updated'), '<th scope="col"><span class="sr-only">Actions</span></th>'],
      rows.map((s) => '<tr' + (s.archived ? ' class="row-muted"' : '') + '><td>' + esc(refOf(s)) + '</td><td>' + esc(s.name || '(empty)') + '</td><td>' + (s.apaar ? esc(maskApaar(s.apaar)) : '<span class="muted">Missing</span>') + '</td><td>' + esc(instName(s.instId)) + '</td><td>' + esc((progById(s.progId) || { code: '–' }).code) + '</td><td>' + esc(s.year) + '</td><td>' + esc(s.status) + '</td><td>' + esc(s.category) + '</td><td>' + valBadge(valOf(s)) + '</td><td>' + esc(fmtD(s.updatedAt)) + '</td>' +
        '<td class="actions"><button type="button" class="btn btn-secondary btn-sm" data-action="rec-view" data-id="' + esc(s.id) + '">View</button>' +
        (can('record.edit') && !s.archived ? ' <button type="button" class="btn btn-secondary btn-sm" data-action="rec-edit" data-id="' + esc(s.id) + '">Edit</button>' : '') +
        (can('record.archive') ? (s.archived ? ' <button type="button" class="btn btn-secondary btn-sm" data-action="rec-restore" data-id="' + esc(s.id) + '">Restore</button>' : ' <button type="button" class="btn btn-secondary btn-sm" data-action="rec-archive" data-id="' + esc(s.id) + '">Archive</button>') : '') + '</td></tr>')) + pager('records', list.length, f.page);
  }
  function pgRecords() {
    const f = ui.records;
    const insts = scopedInstitutions();
    let progs = scopedProgrammes();
    if (me.role === 'aicte' && f.inst) progs = progs.filter((p) => p.instId === f.inst);
    const years = Array.from(new Set(scopedStudents(true).map((s) => s.year))).sort();
    return head('Student records', (can('record.create') ? '<button type="button" class="btn btn-primary" data-action="rec-add">' + ic('plus') + ' Add student</button>' : '') + '<button type="button" class="btn btn-secondary" data-action="rec-export">' + ic('download') + ' Export CSV</button>',
        me.role === 'aicte' ? 'Read-only view. Dates of birth are not shown to this role.' : 'Showing ' + esc(instName(me.instId))) +
      '<div class="card filters">' +
        '<div class="field grow"><label for="r-q">Search</label><input id="r-q" type="search" data-f="records:q" value="' + esc(f.q) + '" placeholder="Name, reference, APAAR ID or institution"></div>' +
        (me.role === 'aicte' ? '<div class="field"><label for="r-inst">Institution</label><select id="r-inst" data-f="records:inst" data-full="1">' + opt('', 'All', f.inst) + insts.map((i) => opt(i.id, i.name, f.inst)).join('') + '</select></div>' : '') +
        '<div class="field"><label for="r-prog">Programme</label><select id="r-prog" data-f="records:prog">' + opt('', 'All', f.prog) + progs.map((p) => opt(p.id, (me.role === 'aicte' ? instById(p.instId).code + ' · ' : '') + p.code, f.prog)).join('') + '</select></div>' +
        '<div class="field"><label for="r-year">Academic year</label><select id="r-year" data-f="records:year">' + opt('', 'All', f.year) + years.map((y) => opt(y, y, f.year)).join('') + '</select></div>' +
        '<div class="field"><label for="r-val">Validation</label><select id="r-val" data-f="records:val">' + opt('', 'All', f.val) + ['Valid', 'Needs review', 'Incomplete'].map((v) => opt(v, v, f.val)).join('') + '</select></div>' +
        '<div class="field"><label for="r-st">Enrolment</label><select id="r-st" data-f="records:status">' + opt('', 'All', f.status) + ENR_STATUS.map((v) => opt(v, v, f.status)).join('') + '</select></div>' +
        '<div class="field"><label for="r-ap">APAAR ID</label><select id="r-ap" data-f="records:apaar">' + opt('', 'Any', f.apaar) + opt('missing', 'Missing', f.apaar) + '</select></div>' +
        '<div class="field check-field"><label><input type="checkbox" data-f="records:archived"' + (f.archived ? ' checked' : '') + '> Include archived</label></div>' +
      '</div><div id="listArea">' + recordsTable() + '</div>';
  }

  function canSeeDob(s) { return me.role === 'student' ? s.id === me.studentId : me.role === 'inst' && s.instId === me.instId; }
  function recordDetail(s) {
    const a = analysis();
    const iss = (a.byStudent.get(s.id) || []);
    const reqs = db.requests.filter((r) => r.studentId === s.id);
    return '<dl class="kv"><dt>Reference</dt><dd>' + esc(refOf(s)) + '</dd><dt>Name</dt><dd>' + esc(s.name || '(empty)') + '</dd><dt>Date of birth</dt><dd>' + (canSeeDob(s) ? esc(s.dob || '(empty)') : '<span class="muted">Not shown to this role</span>') + '</dd>' +
      '<dt>APAAR ID</dt><dd>' + (s.apaar ? esc(maskApaar(s.apaar)) + ' (masked)' : 'Missing') + '</dd><dt>Institution</dt><dd>' + esc(instName(s.instId)) + '</dd><dt>Programme</dt><dd>' + esc(progName(s.progId)) + '</dd><dt>Academic year</dt><dd>' + esc(s.year) + '</dd><dt>Enrolment status</dt><dd>' + esc(s.status) + '</dd><dt>Admission category</dt><dd>' + esc(s.category) + '</dd>' +
      '<dt>Validation</dt><dd>' + valBadge(valOf(s)) + '</dd><dt>Created</dt><dd>' + esc(fmtDT(s.createdAt)) + '</dd><dt>Last updated</dt><dd>' + esc(fmtDT(s.updatedAt)) + '</dd></dl>' +
      '<h3>Validation flags</h3>' + (iss.length && me.role !== 'student' ? '<ul class="plain-list">' + iss.map((i) => '<li>' + sevBadge(i.severity) + ' ' + esc(ISSUE_TYPES[i.type]) + ' ' + issBadge(a.statusOf(i)) + '<br><span class="small">' + esc(i.reason) + '</span></li>').join('') + '</ul>' :
        iss.length ? '<ul class="plain-list">' + iss.map((i) => '<li>' + sevBadge(i.severity) + ' ' + esc(ISSUE_TYPES[i.type]) + ' ' + issBadge(a.statusOf(i)) + '</li>').join('') + '</ul>' : '<p class="muted">No flags.</p>') +
      '<h3>Correction requests</h3>' + (reqs.length ? '<ul class="plain-list">' + reqs.map((r) => '<li>' + esc(r.id) + ' · ' + esc(r.field) + ' ' + reqBadge(r.status) + '</li>').join('') + '</ul>' : '<p class="muted">None.</p>') +
      '<h3>Record history</h3><ol class="timeline">' + s.history.slice().reverse().map((h) => '<li><b>' + esc(h.change) + '</b><br><span class="small muted">' + esc(fmtDT(h.at)) + ' · ' + esc(h.by) + '</span></li>').join('') + '</ol>';
  }
  function pgMyRecord() {
    const s = studentById(me.studentId);
    return head('My academic record', '<a class="btn btn-secondary" href="#/app/requests?new=1">Request a correction</a>') + '<section class="card">' + recordDetail(s) + '</section>';
  }

  function studentFormHTML(s) {
    const isEdit = !!s;
    const instId = isEdit ? s.instId : me.instId;
    const progs = db.programmes.filter((p) => p.instId === instId);
    const v = s || { name: '', dob: '', apaar: '', progId: progs[0] ? progs[0].id : '', year: '2026-27', status: 'Enrolled', category: 'General' };
    return '<form class="form" data-form="student" data-id="' + (isEdit ? esc(s.id) : '') + '" novalidate>' +
      '<div class="field"><label for="sf-name">Student name</label><input id="sf-name" name="name" value="' + esc(v.name) + '" required maxlength="80" autocomplete="off"></div>' +
      '<div class="field"><label for="sf-dob">Date of birth</label><input id="sf-dob" name="dob" type="date" value="' + esc(v.dob) + '" required></div>' +
      '<div class="field"><label for="sf-apaar">APAAR ID <span class="muted">(optional)</span></label><input id="sf-apaar" name="apaar" value="' + esc(v.apaar) + '" inputmode="numeric" autocomplete="off" maxlength="20"><small class="hint">Synthetic IDs only. Leave blank if not yet available.</small></div>' +
      '<div class="field"><label for="sf-prog">Programme</label><select id="sf-prog" name="progId">' + progs.map((p) => opt(p.id, p.code + ' – ' + p.name, v.progId)).join('') + '</select></div>' +
      '<div class="field"><label for="sf-year">Academic year</label><input id="sf-year" name="year" value="' + esc(v.year) + '" placeholder="2026-27" maxlength="7" required></div>' +
      '<div class="field"><label for="sf-status">Enrolment status</label><select id="sf-status" name="status">' + ENR_STATUS.map((x) => opt(x, x, v.status)).join('') + '</select></div>' +
      '<div class="field"><label for="sf-cat">Admission category</label><select id="sf-cat" name="category">' + CATEGORIES.map((x) => opt(x, x, v.category)).join('') + '</select></div>' +
      '<p class="form-error" role="alert" hidden></p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">' + (isEdit ? 'Save changes' : 'Add student') + '</button></div></form>';
  }
  function validateStudentForm(f, existingId) {
    const errs = {};
    const name = fv(f, 'name'), dob = fv(f, 'dob'), apaar = fv(f, 'apaar'), year = fv(f, 'year');
    if (!/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(name)) errs.name = 'Enter a name of 2–80 letters.';
    if (!validDate(dob)) errs.dob = 'Enter a valid date of birth.';
    else if (dob > new Date().toISOString().slice(0, 10) || dob < '1950-01-01') errs.dob = 'Date of birth is out of range.';
    if (apaar && !apaarRe().test(apaar)) errs.apaar = 'APAAR ID does not match the configured format.';
    const yy = year.match(/^(\d{4})-(\d{2})$/);
    if (!yy || (Number(yy[1]) + 1) % 100 !== Number(yy[2])) errs.year = 'Use the format 2026-27.';
    if (!progById(fv(f, 'progId'))) errs.progId = 'Choose a programme.';
    if (!ENR_STATUS.includes(fv(f, 'status'))) errs.status = 'Choose a status.';
    if (!CATEGORIES.includes(fv(f, 'category'))) errs.category = 'Choose a category.';
    if (apaar && !errs.apaar) {
      const dup = db.students.find((s) => !s.archived && s.apaar === apaar && s.id !== existingId);
      if (dup) errs.apaar = 'This APAAR ID already exists' + (dup.instId === me.instId ? ' on ' + refOf(dup) : ' in the system') + '. Existing records are never overwritten.';
    }
    return errs;
  }

  /* ======================================================================
   * 14. CSV import
   * ==================================================================== */
  const IMPORT_COLS = ['student_name', 'dob', 'apaar_id', 'institution_code', 'programme_code', 'academic_year', 'enrolment_status', 'admission_category'];
  const MAX_CSV = 1024 * 1024;

  function sampleCSV() {
    const inst = instById(me.instId);
    const progs = db.programmes.filter((p) => p.instId === me.instId);
    const p0 = progs[0].code, p1 = (progs[1] || progs[0]).code;
    const existing = db.students.find((s) => s.instId === me.instId && s.apaar && !s.archived);
    return toCSV([IMPORT_COLS,
      ['Ishaan Venkatesh', '2005-04-17', '990000000001', inst.code, p0, '2026-27', 'Enrolled', 'General'],
      ['Divya Lakshmi', '2006-01-09', '', inst.code, p1, '2026-27', 'Enrolled', 'NRI'],
      ['Karan Subramanian', '2005-11-30', '990000000003', inst.code, p0, '2026-27', 'Enrolled', 'OCI'],
      ['Karan Subramanian', '2005-11-30', '990000000003', inst.code, p0, '2026-27', 'Enrolled', 'OCI'],
      ['Meera Pillai', '2005-13-45', '990000000005', inst.code, p0, '2026-27', 'Enrolled', 'General'],
      ['Rohan Kannan', '2006-02-02', '12345', inst.code, p1, '2026-27', 'Enrolled', 'General'],
      ['Naveena Iyer', '2005-07-21', '990000000007', 'XXX', p0, '2026-27', 'Enrolled', 'General'],
      ['Existing Student', '2005-05-05', existing ? existing.apaar : '990000000008', inst.code, p0, '2026-27', 'Enrolled', 'Foreign National'],
      ['Arjun Nair', '2005-03-03', '990000000009', inst.code, p0, '2026-27', 'Enrolled', 'Foreign National'],
      ['Sample Missing Year', '2005-06-06', '990000000010', inst.code, p0, '', 'Enrolled', 'General']
    ]);
  }
  function templateCSV() {
    return toCSV([IMPORT_COLS, ['Example Student', '2005-01-31', '990000000000', instById(me.instId).code, db.programmes.find((p) => p.instId === me.instId).code, '2026-27', 'Enrolled', 'General']]);
  }

  function processImport(rows) {
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const missing = IMPORT_COLS.filter((c) => !header.includes(c));
    if (missing.length) return { fatal: 'Missing required column(s): ' + missing.join(', ') + '. Download the template to see the expected header.' };
    const idx = {}; IMPORT_COLS.forEach((c) => { idx[c] = header.indexOf(c); });
    const th = db.settings.simThreshold / 100;
    const re = apaarRe();
    const results = [];
    const seenApaar = new Map(), seenNameDob = new Map();
    const dbApaar = new Map(db.students.filter((s) => !s.archived && s.apaar).map((s) => [s.apaar, s]));
    const dbByDob = new Map();
    db.students.filter((s) => !s.archived && s.dob).forEach((s) => { if (!dbByDob.has(s.dob)) dbByDob.set(s.dob, []); dbByDob.get(s.dob).push(s); });
    const today = new Date().toISOString().slice(0, 10);

    rows.slice(1).forEach((cells, n) => {
      const line = n + 2;
      const res = { line, raw: cells, errors: [], warnings: [], rec: null, status: 'ok' };
      if (cells.length !== header.length) {
        res.errors.push('Malformed row: expected ' + header.length + ' columns but found ' + cells.length + '.');
        res.status = 'error'; results.push(res); return;
      }
      const g = (c) => String(cells[idx[c]] || '').trim();
      const name = g('student_name'), dob = g('dob'), apaar = g('apaar_id'), ic_ = g('institution_code').toUpperCase(), pc = g('programme_code').toUpperCase(), year = g('academic_year');
      const st = ENR_STATUS.find((x) => x.toLowerCase() === g('enrolment_status').toLowerCase());
      const cat = CATEGORIES.find((x) => x.toLowerCase() === g('admission_category').toLowerCase());
      if (!name) res.errors.push('student_name is empty.');
      else if (!/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(name)) res.errors.push('student_name contains invalid characters or is too short.');
      if (!dob) res.errors.push('dob is empty.');
      else if (!validDate(dob)) res.errors.push('dob "' + dob + '" is not a valid YYYY-MM-DD date.');
      else if (dob > today || dob < '1950-01-01') res.errors.push('dob is out of range.');
      if (!apaar) res.warnings.push('apaar_id is empty. The record will be imported and flagged as incomplete.');
      else if (!re.test(apaar)) res.errors.push('apaar_id does not match the configured format.');
      const inst = db.institutions.find((i) => i.code === ic_);
      if (!inst) res.errors.push('institution_code "' + g('institution_code') + '" is not recognised.');
      else if (inst.id !== me.instId) res.errors.push('You are not authorised to import records for institution ' + inst.code + '.');
      const prog = inst ? db.programmes.find((p) => p.instId === inst.id && p.code === pc) : null;
      if (inst && !prog) res.errors.push('programme_code "' + g('programme_code') + '" does not exist for ' + inst.code + '.');
      const yy = year.match(/^(\d{4})-(\d{2})$/);
      if (!year) res.errors.push('academic_year is empty.');
      else if (!yy || (Number(yy[1]) + 1) % 100 !== Number(yy[2])) res.errors.push('academic_year must look like 2026-27.');
      if (!st) res.errors.push('enrolment_status must be one of: ' + ENR_STATUS.join(', ') + '.');
      if (!cat) res.errors.push('admission_category must be one of: ' + CATEGORIES.join(', ') + '.');

      if (!res.errors.length) {
        if (apaar && seenApaar.has(apaar)) res.errors.push('Duplicate of line ' + seenApaar.get(apaar) + ' in this file (same APAAR ID).');
        const nd = normName(name) + '|' + dob;
        if (seenNameDob.has(nd)) res.errors.push('Duplicate of line ' + seenNameDob.get(nd) + ' in this file (same name and date of birth).');
        else seenNameDob.set(nd, line);
        if (apaar && !seenApaar.has(apaar)) seenApaar.set(apaar, line);
      }
      if (!res.errors.length) {
        const ex = apaar ? dbApaar.get(apaar) : null;
        if (ex) {
          res.status = 'skip';
          res.errors.push(ex.instId === me.instId ? 'APAAR ID already exists on ' + refOf(ex) + '. Existing records are never overwritten, so this row is skipped.' : 'This APAAR ID is already present in the system. The row is skipped.');
        } else {
          (dbByDob.get(dob) || []).forEach((o) => {
            const sc = similarity(name, o.name);
            if (sc >= th) res.warnings.push('Possible match with ' + (o.instId === me.instId ? refOf(o) : 'a record at another institution') + ' (similarity ' + Math.round(sc * 100) + '%). Imported for human review; not merged.');
          });
          res.rec = { name, dob, apaar, instId: inst.id, progId: prog.id, year, status: st, category: cat };
        }
      }
      if (res.status !== 'skip') res.status = res.errors.length ? 'error' : res.warnings.length ? 'warning' : 'ok';
      results.push(res);
    });
    const sum = { total: results.length, ok: 0, warning: 0, error: 0, skip: 0 };
    results.forEach((r) => { sum[r.status]++; });
    return { results, sum };
  }

  function importArea() {
    const s = ui.imp;
    if (!s) return '';
    if (s.fatal) return '<div class="alert alert-error" role="alert"><b>File rejected.</b> ' + esc(s.fatal) + '</div>';
    const importable = s.sum.ok + s.sum.warning;
    const shown = s.results.slice(0, 200);
    return '<section class="card"><h2>Preview: ' + esc(s.fileName) + '</h2>' +
      '<div class="grid grid-5 stats compact"><div class="stat-card static"><span class="stat-label">Rows</span><span class="stat-value">' + s.sum.total + '</span></div><div class="stat-card static tone-ok"><span class="stat-label">Ready</span><span class="stat-value">' + s.sum.ok + '</span></div><div class="stat-card static tone-warn"><span class="stat-label">Ready with warnings</span><span class="stat-value">' + s.sum.warning + '</span></div><div class="stat-card static tone-bad"><span class="stat-label">Errors</span><span class="stat-value">' + s.sum.error + '</span></div><div class="stat-card static"><span class="stat-label">Skipped (exists)</span><span class="stat-value">' + s.sum.skip + '</span></div></div>' +
      '<p class="small muted">Policy: rows with errors are not imported and are listed in the error report. Rows that already exist are skipped, never overwritten. Rows with warnings are imported and flagged for review.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="imp-confirm"' + (importable ? '' : ' disabled') + '>Import ' + importable + ' row' + (importable === 1 ? '' : 's') + '</button><button type="button" class="btn btn-secondary" data-action="imp-errors"' + (s.sum.error + s.sum.skip + s.sum.warning ? '' : ' disabled') + '>' + ic('download') + ' Download error report</button><button type="button" class="btn btn-secondary" data-action="imp-cancel">Discard</button></div>' +
      tbl(['<th scope="col">Line</th>', '<th scope="col">Name</th>', '<th scope="col">APAAR ID</th>', '<th scope="col">Result</th>', '<th scope="col">Details</th>'],
        shown.map((r) => '<tr><td>' + r.line + '</td><td>' + esc(r.raw[0] || '') + '</td><td>' + esc(r.raw[2] ? maskApaar(String(r.raw[2])) : '') + '</td><td>' + badge(r.status === 'ok' ? 'success' : r.status === 'warning' ? 'warning' : r.status === 'skip' ? 'neutral' : 'danger', r.status === 'ok' ? 'Ready' : r.status === 'warning' ? 'Warning' : r.status === 'skip' ? 'Skipped' : 'Error') + '</td><td>' + (r.errors.concat(r.warnings).map(esc).join('<br>') || '–') + '</td></tr>')) +
      (s.results.length > 200 ? '<p class="muted small">Showing the first 200 rows. The error report contains every row.</p>' : '') + '</section>';
  }
  function importHistory() {
    if (!db.imports.length) return empty('No imports yet', 'Download the sample file and upload it to see the workflow.');
    return tbl(['<th scope="col">Import</th>', '<th scope="col">When</th>', '<th scope="col">File</th>', '<th scope="col">Rows</th>', '<th scope="col">Imported</th>', '<th scope="col">Skipped</th>', '<th scope="col">Errors</th>', '<th scope="col"><span class="sr-only">Actions</span></th>'],
      db.imports.filter((i) => i.instId === me.instId).slice(0, 10).map((i) => '<tr><td>' + esc(i.id) + '</td><td>' + esc(fmtDT(i.at)) + '</td><td>' + esc(i.fileName) + '</td><td>' + i.total + '</td><td>' + i.imported + '</td><td>' + i.skipped + '</td><td>' + i.errors + '</td><td><button type="button" class="btn btn-secondary btn-sm" data-action="imp-hist-report" data-id="' + esc(i.id) + '">Error report</button></td></tr>'));
  }
  function pgImport() {
    return head('Bulk CSV import', '<button type="button" class="btn btn-secondary" data-action="imp-template">' + ic('download') + ' Template</button><button type="button" class="btn btn-secondary" data-action="imp-sample">' + ic('download') + ' Sample with problems</button>', 'Upload → validate → review → confirm. Nothing is saved until you confirm.') +
      '<section class="card"><h2>1. Choose a CSV file</h2><div class="field"><label for="imp-file">CSV file (max 1 MB, .csv only)</label><input id="imp-file" type="file" accept=".csv,text/csv" data-change="imp-file"></div><progress id="imp-prog" max="100" value="0" hidden aria-label="Upload progress"></progress><p class="small muted">Required columns: ' + IMPORT_COLS.map((c) => '<code>' + c + '</code>').join(', ') + '. The sample file contains deliberate problems so you can see how each is reported.</p></section>' +
      '<div id="impArea">' + importArea() + '</div><section class="card"><h2>Import history</h2><div id="impHist">' + importHistory() + '</div></section>';
  }
  function handleImportFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const prog = $('#imp-prog');
    const fail = (msg) => { ui.imp = { fatal: msg }; $('#impArea').innerHTML = importArea(); input.value = ''; prog.hidden = true; };
    if (!/\.csv$/i.test(file.name)) return fail('Only .csv files are accepted.');
    if (file.size === 0) return fail('The file is empty.');
    if (file.size > MAX_CSV) return fail('The file is larger than 1 MB.');
    const reader = new FileReader();
    prog.hidden = false; prog.value = 0;
    reader.onprogress = (e) => { if (e.lengthComputable) prog.value = Math.round(e.loaded / e.total * 100); };
    reader.onerror = () => fail('The file could not be read.');
    reader.onload = () => {
      prog.value = 100;
      try {
        const parsed = parseCSV(String(reader.result));
        if (parsed.unterminated) return fail('The file has an unterminated quote and cannot be parsed.');
        if (parsed.rows.length < 2) return fail('The file has a header but no data rows.');
        if (parsed.rows.length - 1 > 5000) return fail('The file has more than 5000 rows.');
        const out = processImport(parsed.rows);
        if (out.fatal) return fail(out.fatal);
        ui.imp = { fileName: file.name, results: out.results, sum: out.sum, header: parsed.rows[0] };
        $('#impArea').innerHTML = importArea();
        hydrateIcons($('#impArea'));
        setTimeout(() => { prog.hidden = true; }, 400);
      } catch (e) { fail('Unexpected error while reading the file: ' + e.message); }
    };
    reader.readAsText(file);
  }
  function importErrorRows(results, fileName) {
    const rows = [['line', 'result', 'details'].concat(IMPORT_COLS)];
    results.filter((r) => r.status !== 'ok').forEach((r) => rows.push([r.line, r.status, r.errors.concat(r.warnings).join(' | ')].concat(r.raw)));
    return rows;
  }
  async function confirmImport() {
    if (!requireAction('import') || !ui.imp || !ui.imp.results) return;
    const s = ui.imp;
    const todo = s.results.filter((r) => (r.status === 'ok' || r.status === 'warning') && r.rec);
    if (!todo.length) return toast('There are no importable rows.', 'error');
    const okc = await confirmDialog('Import ' + todo.length + ' record' + (todo.length === 1 ? '' : 's') + '?', s.sum.error + s.sum.skip + ' row(s) with errors or existing records will NOT be imported. Existing records are never overwritten. This adds new records to your institution.', 'Import');
    if (!okc) return;
    const snapshot = JSON.stringify(db);
    try {
      const created = [];
      todo.forEach((r) => {
        const id = 'S' + pad(++db.seq.rec, 4);
        const t = now();
        const rec = Object.assign({ id, archived: false, createdAt: t, updatedAt: t, history: [{ at: t, by: ROLE_LABEL[me.role], change: 'Created by CSV import ' + (db.seq.imp + 1) }] }, r.rec);
        created.push(rec);
      });
      created.forEach((c) => db.students.push(c));
      const imp = { id: nextId('imp', 'IMP-', 4), at: now(), by: me.id, instId: me.instId, fileName: s.fileName, total: s.sum.total, imported: created.length, skipped: s.sum.skip, errors: s.sum.error, warnings: s.sum.warning, errorRows: importErrorRows(s.results).slice(0, 201) };
      db.imports.unshift(imp);
      audit('import.confirm', imp.id, { imported: created.length, skipped: s.sum.skip, errors: s.sum.error });
      cache = null;
      const run = recordRun('After import ' + imp.id);
      notify(me.id, 'Import complete', 'Import ' + imp.id + ' complete', created.length + ' record(s) imported, ' + (s.sum.skip + s.sum.error) + ' not imported. Validation found ' + run.issues + ' open flag(s).', '#/app/issues');
      if (!persist()) throw new Error('storage');
      ui.imp = null;
      toast('Imported ' + created.length + ' record(s). Validation was re-run.', 'success');
      render();
    } catch (e) {
      db = JSON.parse(snapshot); cache = null;     /* roll back: no partial import */
      toast('Import failed and was rolled back. No records were saved.', 'error');
    }
  }
  function recordRun(trigger) {
    const a = analysis();
    const open = a.issues.filter((i) => OPEN_ISSUE.includes(a.statusOf(i)));
    const run = { id: nextId('run', 'RUN-', 4), at: now(), by: me ? me.id : 'system', trigger, total: db.students.filter((s) => !s.archived).length, issues: open.length, high: open.filter((i) => i.severity === 'High').length };
    db.runs.unshift(run);
    if (db.runs.length > 50) db.runs.length = 50;
    return run;
  }

  /* ======================================================================
   * 15. Mismatch detection
   * ==================================================================== */
  function filteredIssues() {
    const f = ui.issues;
    let list = issuesInScope();
    if (f.sev) list = list.filter((i) => i.severity === f.sev);
    if (f.type === 'dups') list = list.filter((i) => DUP_TYPES.includes(i.type));
    else if (f.type) list = list.filter((i) => i.type === f.type);
    if (f.status) list = list.filter((i) => issueStatus(i) === f.status);
    const q = f.q.trim().toLowerCase();
    if (q) list = list.filter((i) => i.ids.some((id) => refOf(studentById(id)).toLowerCase().includes(q) || (visibleParty(id) && studentById(id).name.toLowerCase().includes(q))) || ISSUE_TYPES[i.type].toLowerCase().includes(q) || i.reason.toLowerCase().includes(q));
    const g = { sev: (i) => SEV_RANK[i.severity], type: (i) => ISSUE_TYPES[i.type], status: (i) => issueStatus(i), score: (i) => (i.score == null ? -1 : i.score) };
    return sortBy(list, g[f.sort] || g.sev, f.dir);
  }
  function issuesTable() {
    const f = ui.issues;
    const list = filteredIssues();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (f.page > pages) f.page = pages;
    if (!list.length) return empty('No issues match', 'Change the filters, or run validation again after adding records.', '<button type="button" class="btn btn-secondary" data-action="clear-filters" data-ns="issues">Clear filters</button>');
    const rows = list.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);
    return tbl([th('issues', 'sev', 'Severity'), th('issues', 'type', 'Issue'), '<th scope="col">Record(s)</th>', '<th scope="col">Field</th>', '<th scope="col">Existing value</th>', '<th scope="col">Submitted value</th>', th('issues', 'score', 'Similarity'), '<th scope="col">Why flagged and next step</th>', th('issues', 'status', 'Review status'), '<th scope="col"><span class="sr-only">Review actions</span></th>'],
      rows.map((i) => {
        const st = issueStatus(i);
        const refs = i.ids.length ? i.ids.map((id) => esc(refOf(studentById(id)))).join('<br>') : esc(progName(i.progId));
        const act = !can('issue.review') ? '' : (st === 'Open' || st === 'Needs correction'
          ? (st === 'Open' ? '<button type="button" class="btn btn-secondary btn-sm" data-action="issue-set" data-key="' + esc(i.key) + '" data-st="Reviewed">Mark reviewed</button> <button type="button" class="btn btn-secondary btn-sm" data-action="issue-set" data-key="' + esc(i.key) + '" data-st="Needs correction">Needs correction</button> ' : '<button type="button" class="btn btn-secondary btn-sm" data-action="issue-set" data-key="' + esc(i.key) + '" data-st="Reviewed">Mark reviewed</button> ') + '<button type="button" class="btn btn-secondary btn-sm" data-action="issue-set" data-key="' + esc(i.key) + '" data-st="Dismissed">Dismiss</button>'
          : '<button type="button" class="btn btn-secondary btn-sm" data-action="issue-set" data-key="' + esc(i.key) + '" data-st="Open">Reopen</button>');
        return '<tr><td>' + sevBadge(i.severity) + '</td><td>' + esc(ISSUE_TYPES[i.type]) + '</td><td>' + refs + '</td><td>' + esc(i.field) + '</td><td>' + partyVal(i.a) + '</td><td>' + partyVal(i.b) + '</td><td>' + (i.score == null ? '–' : Math.round(i.score * 100) + '%') + '</td><td><span class="small">' + esc(i.reason) + '</span><br><span class="small muted">' + esc(i.action) + '</span></td><td>' + issBadge(st) + (db.reviews[i.key] ? '<br><span class="small muted">' + esc(fmtD(db.reviews[i.key].at)) + '</span>' : '') + '</td><td class="actions">' + act + '</td></tr>';
      })) + pager('issues', list.length, f.page);
  }
  function pgIssues() {
    const f = ui.issues;
    const last = db.runs[0];
    return head('Mismatch detection', can('validate') ? '<button type="button" class="btn btn-primary" data-action="run-validation">Run validation now</button>' : '', last ? 'Last run ' + esc(fmtDT(last.at)) + ' · ' + last.issues + ' open flag(s)' : '') +
      '<div class="alert alert-info"><b>Read this first.</b> A similarity score is not proof of identity, duplicate enrolment or fraud. Flags are prompts for human review. AcadID never merges or changes an official record on its own. Name matching ignores case, punctuation and extra spaces and uses a threshold of ' + db.settings.simThreshold + '% (change it in Settings).</div>' +
      '<div class="card filters"><div class="field grow"><label for="i-q">Search</label><input id="i-q" type="search" data-f="issues:q" value="' + esc(f.q) + '" placeholder="Record reference, name or issue"></div>' +
      '<div class="field"><label for="i-sev">Severity</label><select id="i-sev" data-f="issues:sev">' + opt('', 'All', f.sev) + ['High', 'Medium', 'Low'].map((v) => opt(v, v, f.sev)).join('') + '</select></div>' +
      '<div class="field"><label for="i-type">Issue type</label><select id="i-type" data-f="issues:type">' + opt('', 'All', f.type) + opt('dups', 'All duplicate-related', f.type) + Object.keys(ISSUE_TYPES).map((k) => opt(k, ISSUE_TYPES[k], f.type)).join('') + '</select></div>' +
      '<div class="field"><label for="i-st">Review status</label><select id="i-st" data-f="issues:status">' + opt('', 'All', f.status) + ISSUE_STATUS.map((v) => opt(v, v, f.status)).join('') + '</select></div></div>' +
      '<div id="listArea">' + issuesTable() + '</div>' +
      '<section class="card"><h2>Validation run history</h2>' + tbl(['<th scope="col">Run</th>', '<th scope="col">When</th>', '<th scope="col">Trigger</th>', '<th scope="col">Records checked</th>', '<th scope="col">Open flags</th>', '<th scope="col">High severity</th>'], db.runs.slice(0, 6).map((r) => '<tr><td>' + esc(r.id) + '</td><td>' + esc(fmtDT(r.at)) + '</td><td>' + esc(r.trigger) + '</td><td>' + r.total + '</td><td>' + r.issues + '</td><td>' + r.high + '</td></tr>')) + '<p class="small muted">Run totals cover all demo institutions.</p></section>';
  }

  /* ======================================================================
   * 16. Pre-flight checker
   * ==================================================================== */
  const T = {
    id: ['Bring a government-issued photo ID that shows your correct name.', 'சரியான பெயர் உள்ள அரசு வழங்கிய புகைப்பட அடையாள அட்டையை எடுத்து வாருங்கள்.'],
    dobDoc: ['Bring your 10th or 12th mark sheet or birth certificate showing your date of birth.', 'பிறந்த தேதி குறிப்பிடப்பட்ட 10 அல்லது 12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ் அல்லது பிறப்புச் சான்றிதழை எடுத்து வாருங்கள்.'],
    name: ['The name on your document differs from the record. Submit a correction request with a document that shows the correct spelling.', 'உங்கள் ஆவணத்தில் உள்ள பெயர் பதிவில் உள்ளதிலிருந்து வேறுபடுகிறது. சரியான எழுத்துப்பிழையுடன் உள்ள ஆவணத்துடன் திருத்தக் கோரிக்கையைச் சமர்ப்பிக்கவும்.'],
    dob: ['The date of birth on your document differs from the record. Attach a birth certificate or school certificate.', 'உங்கள் ஆவணத்தில் உள்ள பிறந்த தேதி பதிவில் உள்ளதிலிருந்து வேறுபடுகிறது. பிறப்புச் சான்றிதழ் அல்லது பள்ளிச் சான்றிதழை இணைக்கவும்.'],
    apaarMissing: ['Your APAAR ID is missing on the record. Ask your institution to confirm it, or obtain it through the official channel.', 'பதிவில் உங்கள் APAAR ஐடி இல்லை. உங்கள் கல்வி நிறுவனத்திடம் உறுதிப்படுத்தக் கேளுங்கள் அல்லது அதிகாரப்பூர்வ வழியில் பெறுங்கள்.'],
    apaarFmt: ['Check the APAAR ID format. It should match the format your institution uses (12 digits by default).', 'APAAR ஐடி வடிவத்தைச் சரிபார்க்கவும். உங்கள் நிறுவனம் பயன்படுத்தும் வடிவத்தில் (இயல்பாக 12 இலக்கங்கள்) இருக்க வேண்டும்.'],
    apaar: ['The APAAR ID on your document differs from the record. Bring the document that shows your APAAR ID.', 'உங்கள் ஆவணத்தில் உள்ள APAAR ஐடி பதிவில் உள்ளதிலிருந்து வேறுபடுகிறது. APAAR ஐடி உள்ள ஆவணத்தை எடுத்து வாருங்கள்.'],
    prog: ['The programme on your document differs from the record. Bring your admission letter or fee receipt.', 'உங்கள் ஆவணத்தில் உள்ள பாடப்பிரிவு பதிவில் உள்ளதிலிருந்து வேறுபடுகிறது. சேர்க்கைக் கடிதம் அல்லது கட்டண ரசீதை எடுத்து வாருங்கள்.'],
    copies: ['Keep clear, readable copies of every document.', 'ஒவ்வொரு ஆவணத்தின் தெளிவான, படிக்கக்கூடிய நகல்களை வைத்திருங்கள்.'],
    flags: ['Your record has an open flag. The institution will review it; you may be asked for more information.', 'உங்கள் பதிவில் ஒரு குறியீடு உள்ளது. நிறுவனம் அதை ஆய்வு செய்யும்; கூடுதல் தகவல் கேட்கப்படலாம்.'],
    ok: ['No differences were found in the fields you entered. You can still raise a request if something else looks wrong.', 'நீங்கள் உள்ளிட்ட புலங்களில் வேறுபாடு எதுவும் இல்லை. வேறு ஏதேனும் தவறாகத் தோன்றினால் கோரிக்கையைச் சமர்ப்பிக்கலாம்.'],
    disclaimer: ['This checklist is guidance only. It does not mean any document will be accepted or that a correction is guaranteed.', 'இந்தப் பட்டியல் வழிகாட்டுதல் மட்டுமே. எந்த ஆவணமும் ஏற்கப்படும் அல்லது திருத்தம் உறுதி என்று பொருள் அல்ல.']
  };
  function pgPreflight() {
    const recs = scopedStudents().slice().sort((a, b) => a.name.localeCompare(b.name));
    const sel = me.role === 'student'
      ? '<input type="hidden" name="studentId" value="' + esc(me.studentId) + '"><p><b>' + esc(studentById(me.studentId).name) + '</b> · ' + esc(refOf(studentById(me.studentId))) + '</p>'
      : '<div class="field"><label for="pf-rec">Student record</label><select id="pf-rec" name="studentId">' + recs.map((s) => opt(s.id, refOf(s) + ' · ' + s.name, '')).join('') + '</select></div>';
    return head('Pre-flight documentation checker', '', 'Find out what to bring before you raise a correction') +
      '<div class="alert alert-info"><b>OCR is not available in this build.</b> Reading text from images needs an OCR engine, which this static prototype does not include. Enter the values shown on your document by hand. No OCR confidence is shown because nothing is extracted automatically.</div>' +
      '<div class="grid grid-2"><section class="card"><h2>Document details</h2><form class="form" data-form="preflight" novalidate>' + sel +
        '<div class="field"><label for="pf-type">Document type</label><select id="pf-type" name="docType">' + ['Mark sheet (10th/12th)', 'Birth certificate', 'Government photo ID', 'Admission letter / fee receipt', 'Other'].map((x) => opt(x, x, '')).join('') + '</select></div>' +
        '<div class="field"><label for="pf-file">Document image <span class="muted">(optional, JPG/PNG/PDF up to 2 MB)</span></label><input id="pf-file" name="file" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"><small class="hint">The file is only checked for type and size. It is not uploaded or stored.</small></div>' +
        '<div class="field"><label for="pf-name">Name on document</label><input id="pf-name" name="name" maxlength="80" autocomplete="off"></div>' +
        '<div class="field"><label for="pf-dob">Date of birth on document</label><input id="pf-dob" name="dob" type="date"></div>' +
        '<div class="field"><label for="pf-apaar">APAAR ID on document</label><input id="pf-apaar" name="apaar" maxlength="20" inputmode="numeric" autocomplete="off"></div>' +
        '<div class="field"><label for="pf-prog">Programme on document</label><input id="pf-prog" name="prog" maxlength="80" autocomplete="off" placeholder="For example CSE"></div>' +
        '<p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Compare with record</button></form></section>' +
      '<section class="card" id="pfResult" aria-live="polite"><h2>Result</h2><p class="muted">Fill in at least one field and compare. Your checklist appears here in English and Tamil.</p></section></div>';
  }
  function runPreflight(form) {
    const errs = {};
    const sid = fv(form, 'studentId');
    const s = studentById(sid);
    if (!s || !scopedStudents().some((x) => x.id === sid)) { toast('You cannot check that record.', 'error'); return; }
    const file = form.elements.file.files && form.elements.file.files[0];
    if (file) {
      if (!/\.(jpe?g|png|pdf)$/i.test(file.name) || !/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) errs.file = 'Only JPG, PNG or PDF files are accepted.';
      else if (file.size > 2 * 1024 * 1024) errs.file = 'The file is larger than 2 MB.';
    }
    const name = fv(form, 'name'), dob = fv(form, 'dob'), apaar = fv(form, 'apaar'), prog = fv(form, 'prog');
    if (!name && !dob && !apaar && !prog) errs.name = 'Enter at least one value from your document.';
    if (dob && !validDate(dob)) errs.dob = 'Enter a valid date.';
    if (Object.keys(errs).length) return showErrors(form, errs);
    clearErrors(form);
    const rows = [];
    const pr = progById(s.progId) || { code: '', name: '' };
    const lang = (db.prefs[me.id] || {}).lang === 'ta' ? 1 : 0;
    const items = [];
    if (name) { const sc = similarity(name, s.name); rows.push(['Name', name, s.name, normName(name) === normName(s.name) ? 'Match' : 'Mismatch (' + Math.round(sc * 100) + '% similar)']); if (normName(name) !== normName(s.name)) items.push(T.name, T.id); }
    if (dob) { rows.push(['Date of birth', dob, canSeeDob(s) ? (s.dob || '(missing on record)') : 'hidden', !s.dob ? 'Missing on record' : dob === s.dob ? 'Match' : 'Mismatch']); if (dob !== s.dob) items.push(T.dob, T.dobDoc); }
    if (apaar) { rows.push(['APAAR ID', maskApaar(apaar), s.apaar ? maskApaar(s.apaar) : '(missing on record)', !s.apaar ? 'Missing on record' : apaar === s.apaar ? 'Match' : 'Mismatch']); if (!apaarRe().test(apaar)) items.push(T.apaarFmt); else if (s.apaar && apaar !== s.apaar) items.push(T.apaar); }
    if (prog) { const ok = prog.toLowerCase() === pr.code.toLowerCase() || similarity(prog, pr.name) >= 0.85; rows.push(['Programme', prog, pr.code + ' – ' + pr.name, ok ? 'Match' : 'Mismatch']); if (!ok) items.push(T.prog); }
    if (!s.apaar) items.push(T.apaarMissing);
    else if (!apaarRe().test(s.apaar)) items.push(T.apaarFmt);
    const a = analysis();
    if ((a.byStudent.get(s.id) || []).some((i) => OPEN_ISSUE.includes(a.statusOf(i)))) items.push(T.flags);
    if (!items.length) items.push(T.ok);
    items.push(T.copies, T.disclaimer);
    const uniq = Array.from(new Set(items));
    const lines = uniq.map((t) => ({ en: t[0], ta: t[1] }));
    const mismatch = rows.filter((r) => r[3] !== 'Match').map((r) => r[0]);
    ui.pf = { studentId: s.id, lines, rows, mismatch, name: s.name };
    audit('preflight.run', refOf(s), { mismatches: mismatch.length });
    persist();
    $('#pfResult').innerHTML = '<h2>Result</h2>' + (file ? '<p class="small muted">File "' + esc(file.name) + '" passed the type and size check. It was not uploaded or stored.</p>' : '') +
      tbl(['<th scope="col">Field</th>', '<th scope="col">On document</th>', '<th scope="col">On record</th>', '<th scope="col">Result</th>'], rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + badge(r[3] === 'Match' ? 'success' : 'warning', r[3]) + '</td></tr>')) +
      '<h3>Your checklist</h3><ul class="check-list">' + lines.map((l) => '<li>' + (lang ? '<span lang="ta">' + esc(l.ta) + '</span><br><span class="muted small">' + esc(l.en) + '</span>' : esc(l.en) + '<br><span class="muted small" lang="ta">' + esc(l.ta) + '</span>') + '</li>').join('') + '</ul>' +
      '<div class="btn-row"><button type="button" class="btn btn-secondary" data-action="pf-checklist">' + ic('download') + ' Download checklist</button><button type="button" class="btn btn-secondary" data-action="pf-letter">Draft correction letter</button>' +
      (mismatch.length ? '<a class="btn btn-primary" href="#/app/requests?new=1&sid=' + esc(s.id) + '">Start a correction request</a>' : '') + '</div><div id="pfLetter"></div>';
    hydrateIcons($('#pfResult'));
  }
  function letterText() {
    const p = ui.pf; const s = studentById(p.studentId);
    const fields = p.mismatch.length ? p.mismatch.join(', ').toLowerCase() : 'details';
    return 'Date: ' + new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }) + '\n\nTo\nThe Principal\n' + instName(s.instId) + '\n\nSubject: Request for correction of ' + fields + ' in my academic record\n\nRespected Sir/Madam,\n\nI, ' + s.name + ' (record reference ' + refOf(s) + '), a student of ' + progName(s.progId) + ' (' + s.year + '), request you to review and correct the ' + fields + ' shown in my academic record. The details shown on my supporting document(s) differ from the record.\n\nI have attached copies of the following document(s): ____________________.\n\nI request you to verify the documents and update the record if appropriate. I will provide any additional information that is needed.\n\nThanking you.\n\nYours faithfully,\n' + s.name + '\n\n(Draft generated by the AcadID demo. Review and edit before use. This letter does not guarantee that a correction will be made.)';
  }

  /* ======================================================================
   * 17. Correction requests
   * ==================================================================== */
  const reqVisible = (r) => (me.role === 'aicte' ? true : me.role === 'inst' ? r.instId === me.instId : me.role === 'student' ? r.studentId === me.studentId : false);
  function filteredRequests() {
    const f = ui.requests;
    let list = db.requests.filter(reqVisible);
    if (f.status) list = list.filter((r) => r.status === f.status);
    if (f.f === 'open') list = list.filter((r) => OPEN_REQ.includes(r.status));
    if (f.f === 'overdue') list = list.filter(isOverdue);
    const q = f.q.trim().toLowerCase();
    if (q) list = list.filter((r) => r.id.toLowerCase().includes(q) || refOf(studentById(r.studentId)).toLowerCase().includes(q) || r.field.toLowerCase().includes(q) || (me.role !== 'aicte' && studentById(r.studentId).name.toLowerCase().includes(q)));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }
  function requestsTable() {
    const f = ui.requests;
    const list = filteredRequests();
    if (!list.length) return empty('No requests found', me.role === 'student' ? 'If something on your record is wrong, start a correction request.' : 'Nothing matches these filters.', me.role === 'student' ? '<button type="button" class="btn btn-primary" data-action="req-new">New request</button>' : '');
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE)); if (f.page > pages) f.page = pages;
    const rows = list.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);
    return tbl(['<th scope="col">Ticket</th>', '<th scope="col">Record</th>', '<th scope="col">Field</th>', '<th scope="col">Status</th>', '<th scope="col">Assigned to</th>', '<th scope="col">Submitted</th>', '<th scope="col">Due</th>', '<th scope="col"><span class="sr-only">Actions</span></th>'],
      rows.map((r) => { const s = studentById(r.studentId); return '<tr><td><b>' + esc(r.id) + '</b></td><td>' + esc(refOf(s)) + (me.role === 'aicte' ? '<br><span class="small muted">' + esc(instById(r.instId).code) + '</span>' : '<br><span class="small muted">' + esc(s.name) + '</span>') + '</td><td>' + esc(r.field) + '</td><td>' + reqBadge(r.status) + (isOverdue(r) ? ' ' + badge('danger', 'Overdue') : '') + '</td><td>' + esc(r.assignee || '–') + '</td><td>' + esc(fmtD(r.createdAt)) + '</td><td>' + esc(fmtD(r.dueAt)) + '</td><td><button type="button" class="btn btn-secondary btn-sm" data-action="req-view" data-id="' + esc(r.id) + '">Open</button></td></tr>'; })) + pager('requests', list.length, f.page);
  }
  function pgRequests() {
    const f = ui.requests;
    return head('Correction requests', can('request.create') || can('request.manage') ? '<button type="button" class="btn btn-primary" data-action="req-new">' + ic('plus') + ' New request</button>' : '', 'Statuses: ' + REQ_STATUS.join(' · ') + '. Response deadline: ' + db.settings.slaDays + ' days.') +
      '<div class="card filters"><div class="field grow"><label for="q-q">Search</label><input id="q-q" type="search" data-f="requests:q" value="' + esc(f.q) + '" placeholder="Ticket, record or field"></div>' +
      '<div class="field"><label for="q-st">Status</label><select id="q-st" data-f="requests:status">' + opt('', 'All', f.status) + REQ_STATUS.map((v) => opt(v, v, f.status)).join('') + '</select></div>' +
      '<div class="field"><label for="q-f">Show</label><select id="q-f" data-f="requests:f">' + opt('', 'Everything', f.f) + opt('open', 'Pending only', f.f) + opt('overdue', 'Overdue only', f.f) + '</select></div></div>' +
      '<div id="listArea">' + requestsTable() + '</div>';
  }
  function newRequestForm(sid) {
    const recs = scopedStudents().slice().sort((a, b) => a.name.localeCompare(b.name));
    const sel = me.role === 'student' ? '<input type="hidden" name="studentId" value="' + esc(me.studentId) + '">' : '<div class="field"><label for="nr-rec">Student record</label><select id="nr-rec" name="studentId">' + recs.map((s) => opt(s.id, refOf(s) + ' · ' + s.name, sid)).join('') + '</select></div>';
    return '<form class="form" data-form="req-new" novalidate>' + sel +
      '<div class="field"><label for="nr-field">Field to correct</label><select id="nr-field" name="field">' + ['Student name', 'Date of birth', 'APAAR ID', 'Programme', 'Institution', 'Other'].map((x) => opt(x, x, '')).join('') + '</select></div>' +
      '<div class="field"><label for="nr-new">Correct value</label><input id="nr-new" name="proposed" maxlength="100" autocomplete="off"></div>' +
      '<div class="field"><label for="nr-desc">What is wrong? <span class="muted">(at least 20 characters)</span></label><textarea id="nr-desc" name="description" rows="4" maxlength="1000" required></textarea></div>' +
      '<div class="field"><label for="nr-file">Supporting document <span class="muted">(optional, JPG/PNG/PDF up to 2 MB)</span></label><input id="nr-file" name="file" type="file" accept=".jpg,.jpeg,.png,.pdf"><small class="hint">Only the file name is recorded in this demo. The file itself is not stored.</small></div>' +
      '<p class="form-error" role="alert" hidden></p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Submit request</button></div></form>';
  }
  function reqDetail(r) {
    const s = studentById(r.studentId);
    const isAdmin = can('request.manage');
    const staff = ['Records Section (demo)', 'Registrar Office (demo)', 'Institution admin (demo)'];
    const nextOpts = NEXT_STATUS[r.status];
    return '<dl class="kv"><dt>Ticket</dt><dd><b>' + esc(r.id) + '</b></dd><dt>Status</dt><dd>' + reqBadge(r.status) + (isOverdue(r) ? ' ' + badge('danger', 'Overdue') : '') + '</dd><dt>Record</dt><dd>' + esc(refOf(s)) + (me.role !== 'aicte' ? ' · ' + esc(s.name) : '') + '</dd><dt>Institution</dt><dd>' + esc(instName(r.instId)) + '</dd><dt>Field</dt><dd>' + esc(r.field) + '</dd><dt>Requested value</dt><dd>' + esc(r.proposed || '–') + '</dd><dt>Explanation</dt><dd>' + esc(r.description) + '</dd><dt>Attachment</dt><dd>' + (r.attachment ? esc(r.attachment.name) + ' (name only)' : 'None') + '</dd><dt>Submitted</dt><dd>' + esc(fmtDT(r.createdAt)) + '</dd><dt>Due</dt><dd>' + esc(fmtDT(r.dueAt)) + '</dd><dt>Assigned to</dt><dd>' + esc(r.assignee || 'Unassigned') + '</dd></dl>' +
      '<p class="small muted">Approval records a decision only. It does not change any official external record.</p>' +
      '<h3>Official updates</h3><ol class="timeline">' + r.history.slice().reverse().map((h) => '<li><b>' + esc(h.to) + '</b>' + (h.from ? ' <span class="muted">from ' + esc(h.from) + '</span>' : '') + '<br><span class="small">' + esc(h.reason) + '</span><br><span class="small muted">' + esc(fmtDT(h.at)) + ' · ' + esc(h.by) + '</span></li>').join('') + '</ol>' +
      (r.messages.length ? '<h3>Messages</h3><ul class="plain-list">' + r.messages.map((m) => '<li>' + esc(m.text) + '<br><span class="small muted">' + esc(fmtDT(m.at)) + ' · ' + esc(m.by) + '</span></li>').join('') + '</ul>' : '') +
      (isAdmin ? '<h3>Internal notes</h3>' + (r.notes.length ? '<ul class="plain-list">' + r.notes.map((n) => '<li>' + esc(n.text) + '<br><span class="small muted">' + esc(fmtDT(n.at)) + ' · ' + esc(n.by) + '</span></li>').join('') + '</ul>' : '<p class="muted">No notes.</p>') +
        '<form class="form" data-form="req-note" data-id="' + esc(r.id) + '" novalidate><div class="field"><label for="rn">Add internal note</label><textarea id="rn" name="text" rows="2" maxlength="500"></textarea></div><p class="form-error" role="alert" hidden></p><button class="btn btn-secondary" type="submit">Add note</button></form>' +
        '<form class="form" data-form="req-assign" data-id="' + esc(r.id) + '"><div class="field"><label for="ra">Assign to</label><select id="ra" name="assignee">' + opt('', 'Unassigned', r.assignee) + staff.map((x) => opt(x, x, r.assignee)).join('') + '</select></div><button class="btn btn-secondary" type="submit">Save assignment</button></form>' +
        (nextOpts.length ? '<form class="form" data-form="req-status" data-id="' + esc(r.id) + '" novalidate><div class="field"><label for="rs">Update status</label><select id="rs" name="status">' + nextOpts.map((x) => opt(x, x, '')).join('') + '</select></div><div class="field"><label for="rr">Reason <span class="muted">(required for Approved, Rejected, Action Required)</span></label><textarea id="rr" name="reason" rows="2" maxlength="500"></textarea></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Update status</button></form>' : '<p class="muted">This request is closed.</p>') +
        (isOverdue(r) ? '<button type="button" class="btn btn-secondary" data-action="req-remind" data-id="' + esc(r.id) + '">Send reminder (simulated)</button>' : '') : '') +
      (can('request.respond') && r.status === 'Action Required' && r.studentId === me.studentId ? '<h3>Respond</h3><form class="form" data-form="req-respond" data-id="' + esc(r.id) + '" novalidate><div class="field"><label for="rp">Your response</label><textarea id="rp" name="text" rows="3" maxlength="1000" required></textarea></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Send response</button></form>' : '');
  }

  /* ======================================================================
   * 18. Proof links (consent-based verification)
   * ==================================================================== */
  const linkUrl = (token) => location.href.split('#')[0] + '#/verify/' + token;
  const tokenInScope = (t) => { const s = studentById(t.studentId); return me.role === 'student' ? t.studentId === me.studentId : me.role === 'inst' && s && s.instId === me.instId; };
  function pgVerifyLinks() {
    const recs = scopedStudents().filter((s) => !s.archived).sort((a, b) => a.name.localeCompare(b.name));
    const list = db.tokens.filter(tokenInScope).sort((a, b) => b.createdAt - a.createdAt);
    const sel = me.role === 'student' ? '<input type="hidden" name="studentId" value="' + esc(me.studentId) + '">' : '<div class="field"><label for="lk-rec">Student record</label><select id="lk-rec" name="studentId">' + recs.map((s) => opt(s.id, refOf(s) + ' · ' + s.name, '')).join('') + '</select></div>';
    return head('Academic proof links', '', 'Share only the claims you choose, for a limited time. Revoke at any time.') +
      '<div class="grid grid-2"><section class="card"><h2>Create a proof link</h2><form class="form" data-form="link-new" novalidate>' + sel +
        '<fieldset class="field"><legend>Claims to share</legend>' + Object.keys(CLAIMS).map((k) => '<label class="check"><input type="checkbox" name="claim" value="' + k + '"' + (['institution', 'programme', 'enrolmentStatus'].includes(k) ? ' checked' : '') + '> ' + esc(CLAIMS[k]) + '</label>').join('') + '<small class="hint">Date of birth, APAAR ID, marks and identity numbers can never be shared through a link.</small></fieldset>' +
        '<div class="field"><label for="lk-purpose">Purpose of verification</label><select id="lk-purpose" name="purpose">' + PURPOSES.map((p) => opt(p, p, '')).join('') + '</select></div>' +
        '<div class="field"><label for="lk-valid">Valid for</label><select id="lk-valid" name="hours">' + opt('1', '1 hour', '24') + opt('24', '24 hours', '24') + opt('168', '7 days', '24') + '</select></div>' +
        '<label class="check"><input type="checkbox" name="consent"> ' + (me.role === 'student' ? 'I consent to sharing the selected claims for this purpose.' : 'I confirm the student has consented to sharing the selected claims for this purpose.') + '</label>' +
        '<p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Generate link and QR code</button></form></section>' +
      '<section class="card"><h2>How it works</h2><ol class="steps"><li>Choose the claims and purpose, and give consent.</li><li>AcadID creates a random token. The link and QR code contain only that token, never personal data.</li><li>A verifier opens the link. The token is checked on every visit for expiry and revocation.</li><li>Each visit is logged. You can revoke the link and it stops working immediately.</li></ol><p class="small muted">Simulated verification on synthetic data. Not an official AICTE, APAAR or DigiLocker result. In this static demo, links only work in the browser that holds the demo data.</p></section></div>' +
      '<section class="card"><h2>Your links</h2><div id="linkList">' + linkTable(list) + '</div></section>';
  }
  function linkTable(list) {
    if (!list.length) return empty('No links yet', 'Create a link to share verified claims.');
    return tbl(['<th scope="col">Link</th>', '<th scope="col">Record</th>', '<th scope="col">Claims</th>', '<th scope="col">Purpose</th>', '<th scope="col">Status</th>', '<th scope="col">Expires</th>', '<th scope="col">Visits</th>', '<th scope="col"><span class="sr-only">Actions</span></th>'],
      list.map((t) => { const st = tokenState(t); const visits = db.access.filter((x) => x.tokenId === t.id).length; return '<tr><td>' + esc(t.id) + '</td><td>' + esc(refOf(studentById(t.studentId))) + '</td><td>' + esc(t.claims.map((c) => CLAIMS[c]).join(', ')) + '</td><td>' + esc(t.purpose) + '</td><td>' + tokBadge(st) + '</td><td>' + esc(fmtDT(t.expiresAt)) + '</td><td>' + visits + '</td><td class="actions">' +
        (st === 'Active' ? '<button type="button" class="btn btn-secondary btn-sm" data-action="link-view" data-id="' + esc(t.id) + '">Show link</button> <button type="button" class="btn btn-danger btn-sm" data-action="link-revoke" data-id="' + esc(t.id) + '">Revoke</button> ' : '') + '<button type="button" class="btn btn-secondary btn-sm" data-action="link-log" data-id="' + esc(t.id) + '">Access log</button></td></tr>'; }));
  }
  function showLinkModal(t) {
    const url = linkUrl(t.token);
    openModal('Proof link ' + t.id, '<p>Share this link or QR code only with the intended verifier. It expires ' + esc(fmtDT(t.expiresAt)) + '.</p><div class="qr-row"><div id="qrBox" class="qr-box" aria-label="QR code for the proof link"></div><div class="grow"><label for="lk-url">Link</label><input id="lk-url" readonly value="' + esc(url) + '"><div class="btn-row"><button type="button" class="btn btn-primary" data-action="link-copy">Copy link</button><a class="btn btn-secondary" href="' + esc(url) + '" target="_blank" rel="noopener">Open as verifier</a></div></div></div><p class="small muted">The link holds a random token only. No name, APAAR ID or date of birth is embedded.</p>');
    const box = $('#qrBox');
    if (window.QRCode) { try { new window.QRCode(box, { text: url, width: 176, height: 176 }); } catch (e) { box.textContent = 'QR code could not be drawn. Use the link instead.'; } }
    else box.textContent = 'QR library could not be loaded (offline?). Use the link instead.';
  }

  function showVerify(tokenStr) {
    $('#landing').hidden = true; view().hidden = false;
    document.title = 'Verify academic claims – AcadID';
    let body = '';
    const t = db.tokens.find((x) => x.token === tokenStr);
    if (!t) {
      audit('link.access.invalid', 'Unknown token', {}, null); saveDB();
      body = '<div class="alert alert-error" role="alert"><h2>This link is not valid</h2><p>The link is unknown or has been mistyped. No information is shown.</p></div>';
    } else {
      const st = tokenState(t);
      const s = studentById(t.studentId);
      const log = (outcome) => { db.access.unshift({ id: nextId('acc', 'ACC-', 5), tokenId: t.id, at: now(), actor: me ? me.id : 'anonymous', outcome }); audit('link.access', t.id, { outcome }, s ? s.instId : null); };
      if (st !== 'Active') {
        log('Rejected (' + st.toLowerCase() + ')'); saveDB();
        body = '<div class="alert alert-error" role="alert"><h2>This link has ' + (st === 'Revoked' ? 'been revoked' : 'expired') + '</h2><p>The student or institution ' + (st === 'Revoked' ? 'withdrew consent' : 'set a time limit that has passed') + '. No information is shown. Ask the student for a new link.</p></div>';
      } else {
        log('Granted');
        notify(studentUserFor(t.studentId), 'Verification activity', 'Your proof link was opened', 'Link ' + t.id + ' was opened by a verifier.', '#/app/verify');
        saveDB();
        const vals = { name: s.name, institution: instName(s.instId), programme: progName(s.progId), academicYear: s.year, enrolmentStatus: s.status };
        body = '<div class="alert alert-success"><b>Link valid.</b> Expires ' + esc(fmtDT(t.expiresAt)) + '. Purpose: ' + esc(t.purpose) + '.</div><section class="card"><h2>Shared academic claims</h2><dl class="kv">' + t.claims.map((c) => '<dt>' + esc(CLAIMS[c]) + '</dt><dd>' + esc(vals[c]) + '</dd>').join('') + '</dl><p class="small muted">Only the claims selected with the student’s consent are shown. Date of birth, APAAR ID, marks and identity numbers are never included.</p></section>' +
          '<div class="alert alert-info"><b>Simulated verification.</b> This is a prototype using synthetic data. It is not an official AICTE, APAAR, Aadhaar or DigiLocker result and must not be relied on as proof.</div>';
      }
    }
    view().innerHTML = '<div class="plain-page"><header class="plain-head">' + brand('#/') + '<div class="lp-actions">' + themeBtn() + '<a class="btn btn-secondary btn-sm" href="#/">Home</a></div></header><main id="main" tabindex="-1" class="container narrow"><h1>Academic verification</h1>' + body + '</main></div>';
    hydrateIcons(view()); syncThemeButtons();
    const h = $('#main'); if (h) h.focus();
  }

  /* ======================================================================
   * 19. Analytics, reports, audit, notifications, settings
   * ==================================================================== */
  function analyticsTable(m) {
    const q = ui.analytics.q.trim().toLowerCase();
    const rows = m.byInst.filter((r) => !q || r.inst.name.toLowerCase().includes(q) || r.inst.code.toLowerCase().includes(q));
    if (!rows.length) return empty('No institutions match', 'Change the search text or filters.');
    return tbl(['<th scope="col">Institution</th>', '<th scope="col">Records</th>', '<th scope="col">Enrolled / intake</th>', '<th scope="col">Missing APAAR</th>', '<th scope="col">Incomplete</th>', '<th scope="col">Open flags</th>', '<th scope="col">Pending requests</th>', '<th scope="col">Overdue</th>'],
      rows.map((r) => '<tr><td>' + esc(r.inst.name) + '<br><span class="small muted">' + esc(r.inst.code) + ' · ' + esc(r.inst.city) + '</span></td><td>' + r.records + '</td><td>' + r.enrolled + ' / ' + r.intake + (r.enrolled > r.intake ? ' ' + badge('danger', 'Over intake') : '') + '</td><td>' + r.missingApaar + '</td><td>' + r.incomplete + '</td><td>' + r.openIssues + '</td><td>' + r.pending + '</td><td>' + r.overdue + '</td></tr>'));
  }
  function pgAnalytics() {
    const f = ui.analytics;
    const m = metrics(f);
    let progs = scopedProgrammes();
    if (me.role === 'aicte' && f.inst) progs = progs.filter((p) => p.instId === f.inst);
    const title = me.role === 'aicte' && currentPage === 'dashboard' ? 'National dashboard (demo)' : 'Analytics';
    const base = '#/app/';
    const instRows = m.byInst.map((r) => ({ label: r.inst.code, a: r.intake, b: r.enrolled }));
    const months = Object.keys(m.months).sort().map((k) => ({ label: k, value: m.months[k] }));
    return head(title, '<button type="button" class="btn btn-secondary" data-action="analytics-export">' + ic('download') + ' Download table (CSV)</button>', 'All figures are calculated from the demo records under the filters below. Cards, charts, table and export use the same numbers.') +
      '<div class="card filters">' + (me.role === 'aicte' ? '<div class="field"><label for="a-inst">Institution</label><select id="a-inst" data-f="analytics:inst" data-full="1">' + opt('', 'All institutions', f.inst) + db.institutions.map((i) => opt(i.id, i.name, f.inst)).join('') + '</select></div>' : '') +
        '<div class="field"><label for="a-prog">Programme</label><select id="a-prog" data-f="analytics:prog" data-full="1">' + opt('', 'All programmes', f.prog) + progs.map((p) => opt(p.id, (me.role === 'aicte' ? instById(p.instId).code + ' · ' : '') + p.code, f.prog)).join('') + '</select></div>' +
        '<div class="field"><label for="a-from">Records added from</label><input id="a-from" type="date" data-f="analytics:from" data-full="1" value="' + esc(f.from) + '"></div><div class="field"><label for="a-to">to</label><input id="a-to" type="date" data-f="analytics:to" data-full="1" value="' + esc(f.to) + '"></div>' +
        '<div class="field"><button type="button" class="btn btn-secondary" data-action="clear-filters" data-ns="analytics">Clear filters</button></div></div>' +
      '<div class="grid grid-5 stats">' +
        statCard(base + 'records', 'Institutions', m.institutions, 'In this view') + statCard(base + 'records', 'Student records', m.total, m.enrolled + ' enrolled') +
        statCard(base + 'records', 'Enrolled / approved intake', m.enrolled + ' / ' + m.intake, m.enrolled > m.intake ? 'Over approved intake overall' : 'Within intake overall', m.enrolled > m.intake ? 'bad' : '') +
        statCard(base + 'records?apaar=missing', 'Missing APAAR IDs', m.missingApaar, '', m.missingApaar ? 'warn' : 'ok') + statCard(base + 'records?val=Incomplete', 'Incomplete records', m.incomplete, '', m.incomplete ? 'warn' : 'ok') +
        statCard(base + 'issues?type=dups', 'Potential duplicate records', m.dupRecords, 'In open flags', m.dupRecords ? 'warn' : 'ok') + statCard(base + 'issues', 'Open flags', m.open.length, 'All types') +
        statCard(base + 'requests?f=open', 'Pending requests', m.pending, '') + statCard(base + 'requests?f=overdue', 'Overdue grievances', m.overdue, '', m.overdue ? 'bad' : 'ok') + statCard(base + 'records', 'Record completeness', m.completeness + '%', 'Required fields filled') +
      '</div>' +
      '<div class="grid grid-2"><section class="card"><h2>Approved intake vs enrolment by institution</h2>' + pairBars(instRows, 'Approved intake', 'Enrolled', 'Approved intake versus enrolment by institution') + '</section>' +
        '<section class="card"><h2>Approved intake vs enrolment by programme</h2>' + pairBars(m.byProg.map((r) => ({ label: (me.role === 'aicte' ? instById(r.p.instId).code + ' ' : '') + r.p.code, a: r.intake, b: r.enrolled })), 'Approved intake', 'Enrolled', 'Approved intake versus enrolment by programme') + '</section>' +
        '<section class="card"><h2>Validation outcomes</h2>' + stackBar([{ label: 'Valid', value: m.valid, cls: 'ok' }, { label: 'Needs review', value: m.needs, cls: 'warn' }, { label: 'Incomplete', value: m.incomplete, cls: 'bad' }], 'Validation outcomes') + '</section>' +
        '<section class="card"><h2>Open flags by type</h2>' + singleBars(Object.keys(m.issueTypes).map((k) => ({ label: ISSUE_TYPES[k], value: m.issueTypes[k] })), 'Open flags by type') + '</section>' +
        '<section class="card"><h2>Correction requests by status</h2>' + singleBars(REQ_STATUS.map((k) => ({ label: k, value: m.reqStatus[k] })), 'Correction requests by status') + '</section>' +
        '<section class="card"><h2>Admission categories</h2>' + singleBars(CATEGORIES.map((k) => ({ label: k, value: m.cats[k] })), 'Records by admission category') + '</section>' +
        '<section class="card wide"><h2>Records added per month</h2>' + columns(months, 'Records added per month') + '</section>' +
        '<section class="card wide"><h2>Validation runs</h2>' + tbl(['<th scope="col">Run</th>', '<th scope="col">When</th>', '<th scope="col">Trigger</th>', '<th scope="col">Records checked</th>', '<th scope="col">Open flags</th>', '<th scope="col">High severity</th>'], db.runs.slice(0, 6).map((r) => '<tr><td>' + esc(r.id) + '</td><td>' + esc(fmtDT(r.at)) + '</td><td>' + esc(r.trigger) + '</td><td>' + r.total + '</td><td>' + r.issues + '</td><td>' + r.high + '</td></tr>')) + '<p class="small muted">Each run covers all demo institutions and ignores the filters above.</p></section></div>' +
      '<section class="card"><div class="row-between"><h2>Institution-level exceptions</h2><div class="field inline"><label for="a-q" class="sr-only">Search institutions</label><input id="a-q" type="search" data-f="analytics:q" value="' + esc(f.q) + '" placeholder="Search institutions"></div></div><div id="listArea">' + analyticsTable(m) + '</div></section>';
  }

  function auditList() {
    let list = db.audit.filter((e) => me.role === 'aicte' || e.instId === me.instId || e.actor.id === me.id);
    const q = ui.audit.q.trim().toLowerCase();
    if (q) list = list.filter((e) => e.id.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || String(e.target).toLowerCase().includes(q) || e.actor.name.toLowerCase().includes(q));
    return list;
  }
  function auditTable() {
    const f = ui.audit; const list = auditList();
    if (!list.length) return empty('No events match', 'Try a different search.');
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE)); if (f.page > pages) f.page = pages;
    return tbl(['<th scope="col">Event ID</th>', '<th scope="col">When</th>', '<th scope="col">Actor</th>', '<th scope="col">Action</th>', '<th scope="col">Affected record</th>', '<th scope="col">Details</th>'],
      list.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE).map((e) => '<tr><td>' + esc(e.id) + '</td><td>' + esc(fmtDT(e.at)) + '</td><td>' + esc(e.actor.name) + '</td><td>' + esc(e.action) + '</td><td>' + esc(e.target) + '</td><td class="small">' + esc(Object.keys(e.meta || {}).map((k) => k + ': ' + e.meta[k]).join(', ') || '–') + '</td></tr>')) + pager('audit', list.length, f.page);
  }
  function pgAudit() {
    return head('Audit log', '', 'Append-only. Entries cannot be edited or deleted from this application. Passwords and tokens are never recorded.') +
      '<div class="card filters"><div class="field grow"><label for="au-q">Search</label><input id="au-q" type="search" data-f="audit:q" value="' + esc(ui.audit.q) + '" placeholder="Event ID, action, actor or record"></div></div><div id="listArea">' + auditTable() + '</div>';
  }

  function pgNotifications() {
    const mine = db.notifications.filter((n) => n.userId === me.id);
    const list = ui.notifications.unread ? mine.filter((n) => !n.read) : mine;
    return head('Notifications and activity', '<button type="button" class="btn btn-secondary" data-action="note-readall"' + (mine.some((n) => !n.read) ? '' : ' disabled') + '>Mark all as read</button>') +
      '<div class="card filters"><label class="check"><input type="checkbox" data-f="notifications:unread" data-full="1"' + (ui.notifications.unread ? ' checked' : '') + '> Show unread only</label></div>' +
      (list.length ? '<ul class="note-list">' + list.map((n) => '<li class="note' + (n.read ? '' : ' unread') + '"><div><span class="badge badge-info">' + esc(n.type) + '</span>' + (n.simulated ? ' <span class="badge badge-neutral">Simulated</span>' : '') + (n.read ? '' : ' <span class="badge badge-warning">Unread</span>') + '<h3>' + esc(n.title) + '</h3><p>' + esc(n.body) + '</p><span class="small muted">' + esc(fmtDT(n.at)) + '</span></div><div class="btn-row">' + (n.link ? '<a class="btn btn-secondary btn-sm" href="' + esc(n.link) + '" data-action="note-open" data-id="' + esc(n.id) + '">Open</a>' : '') + (n.read ? '' : '<button type="button" class="btn btn-secondary btn-sm" data-action="note-read" data-id="' + esc(n.id) + '">Mark as read</button>') + '</div></li>').join('') + '</ul>' : empty(ui.notifications.unread ? 'No unread notifications' : 'No notifications yet', 'Import results, validation alerts, request updates and verification activity will appear here.'));
  }

  function reportData(id) {
    const hideName = me.role === 'aicte';
    if (id === 'students') {
      const list = filteredRecords();
      return { title: 'Student records', head: ['Reference'].concat(hideName ? [] : ['Name']).concat(['APAAR ID (masked)', 'Institution', 'Programme', 'Academic year', 'Enrolment status', 'Category', 'Validation', 'Updated']),
        rows: list.map((s) => [refOf(s)].concat(hideName ? [] : [s.name]).concat([maskApaar(s.apaar), instName(s.instId), (progById(s.progId) || { code: '' }).code, s.year, s.status, s.category, valOf(s), new Date(s.updatedAt).toISOString().slice(0, 10)])) };
    }
    if (id === 'issues' || id === 'duplicates') {
      const list = id === 'issues' ? filteredIssues() : issuesInScope().filter((i) => DUP_TYPES.includes(i.type));
      return { title: id === 'issues' ? 'Validation issues' : 'Potential duplicates', head: ['Severity', 'Issue', 'Records', 'Field', 'Similarity', 'Reason', 'Review status'],
        rows: list.map((i) => [i.severity, ISSUE_TYPES[i.type], i.ids.length ? i.ids.map((x) => refOf(studentById(x))).join(' / ') : progName(i.progId), i.field, i.score == null ? '' : Math.round(i.score * 100) + '%', i.reason, issueStatus(i)]) };
    }
    if (id === 'imports') {
      const rows = [];
      db.imports.filter((i) => me.role === 'aicte' || i.instId === me.instId).forEach((i) => i.errorRows.slice(1).forEach((r) => rows.push([i.id, i.fileName, r[0], r[1], r[2]])));
      return { title: 'Import errors', head: ['Import', 'File', 'Line', 'Result', 'Details'], rows };
    }
    if (id === 'requests') {
      const list = filteredRequests();
      return { title: 'Correction request status', head: ['Ticket', 'Record', 'Institution', 'Field', 'Status', 'Overdue', 'Submitted', 'Due', 'Assigned to'],
        rows: list.map((r) => [r.id, refOf(studentById(r.studentId)), instName(r.instId), r.field, r.status, isOverdue(r) ? 'Yes' : 'No', new Date(r.createdAt).toISOString().slice(0, 10), new Date(r.dueAt).toISOString().slice(0, 10), r.assignee || '']) };
    }
    if (id === 'enrolment') {
      const m = metrics(ui.analytics);
      return { title: 'Enrolment summary', head: ['Institution', 'Programme', 'Approved intake', 'Enrolled', 'Difference'], rows: m.byProg.map((r) => [instName(r.p.instId), r.p.code + ' – ' + r.p.name, r.intake, r.enrolled, r.enrolled - r.intake]) };
    }
    if (id === 'quality') {
      const m = metrics(ui.analytics);
      return { title: 'Institution-level data quality', head: ['Institution', 'Records', 'Enrolled', 'Approved intake', 'Missing APAAR', 'Incomplete', 'Open flags', 'Pending requests', 'Overdue requests'], rows: m.byInst.map((r) => [r.inst.name, r.records, r.enrolled, r.intake, r.missingApaar, r.incomplete, r.openIssues, r.pending, r.overdue]) };
    }
    if (id === 'audit') {
      return { title: 'Audit events', head: ['Event ID', 'When', 'Actor', 'Action', 'Affected record'], rows: auditList().map((e) => [e.id, new Date(e.at).toISOString(), e.actor.name, e.action, e.target]) };
    }
    return null;
  }
  const REPORTS = [['students', 'Student records', 'Honours the filters on the Student records page. APAAR IDs are masked.'], ['issues', 'Validation issues', 'Honours the filters on the Mismatch detection page.'], ['duplicates', 'Potential duplicates', 'Open and reviewed duplicate-related flags.'], ['imports', 'Import errors', 'Rows that were rejected, skipped or warned during CSV imports.'], ['requests', 'Correction request status', 'Honours the filters on the Correction requests page.'], ['enrolment', 'Enrolment summary', 'Approved intake versus enrolment. Honours the Analytics filters.'], ['quality', 'Institution-level data quality', 'Honours the Analytics filters.'], ['audit', 'Audit events', 'Honours the search on the Audit log page.']];
  function pgReports() {
    const f = ui.analytics;
    return head('Reports and exports', '', 'Reports use the same permissions and filters as the pages they come from.') +
      '<div class="alert alert-info">Analytics filters now: ' + esc((me.role === 'aicte' && f.inst ? instName(f.inst) : 'all institutions') + ', ' + (f.prog ? progName(f.prog) : 'all programmes') + (f.from || f.to ? ', ' + (f.from || '…') + ' to ' + (f.to || '…') : '')) + '</div>' +
      '<div class="grid grid-2">' + REPORTS.map((r) => { const d = reportData(r[0]); return '<section class="card"><h2>' + esc(r[1]) + '</h2><p class="muted">' + esc(r[2]) + '</p><p><b>' + d.rows.length + '</b> row' + (d.rows.length === 1 ? '' : 's') + '</p><div class="btn-row"><button type="button" class="btn btn-primary" data-action="report-csv" data-r="' + r[0] + '">' + ic('download') + ' CSV</button><button type="button" class="btn btn-secondary" data-action="report-print" data-r="' + r[0] + '">Print / save as PDF</button></div></section>'; }).join('') + '</div>';
  }
  function exportReport(id, mode) {
    const d = reportData(id);
    if (!d) return;
    if (!d.rows.length) return toast('There are no rows to export for the current filters.', 'error');
    audit('report.export', id, { rows: d.rows.length, format: mode });
    persist();
    if (mode === 'csv') { download('acadid-' + id + '-' + new Date().toISOString().slice(0, 10) + '.csv', toCSV([d.head].concat(d.rows)), 'text/csv;charset=utf-8'); toast('Report downloaded.', 'success'); return; }
    $('#printArea').innerHTML = '<h1>' + esc(d.title) + '</h1><p>Generated ' + esc(fmtDT(now())) + ' · AcadID demo · synthetic data</p>' + tbl(d.head.map((h) => '<th>' + esc(h) + '</th>'), d.rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>'));
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); $('#printArea').innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }

  function pgSettings() {
    const pref = db.prefs[me.id] || { lang: 'en', email: false, sms: false };
    const s = db.settings;
    const sess = readSession();
    const pages = NAV[me.role].map((p) => PAGES[p].title);
    return head('Settings and profile', '') +
      '<div class="grid grid-2"><section class="card"><h2>Profile</h2><dl class="kv"><dt>Name</dt><dd>' + esc(me.name) + '</dd><dt>Sign-in</dt><dd>' + esc(me.email) + '</dd><dt>Role</dt><dd>' + esc(ROLE_LABEL[me.role]) + '</dd>' + (me.instId ? '<dt>Institution</dt><dd>' + esc(instName(me.instId)) + '</dd>' : '') + '</dl>' +
        '<h3>Role and permissions</h3><p class="small">Pages you can open: ' + esc(pages.join(', ')) + '.</p><p class="small muted">In this static demo, permissions are enforced by the page script. A production system must enforce them on a server.</p></section>' +
      '<section class="card"><h2>Preferences</h2><form class="form" data-form="prefs"><div class="field"><label for="pr-lang">Language for checklists and guidance</label><select id="pr-lang" name="lang">' + opt('en', 'English first (Tamil shown below)', pref.lang) + opt('ta', 'தமிழ் first (English shown below)', pref.lang) + '</select><small class="hint">The interface itself is in English. Tamil is provided for pre-flight guidance.</small></div>' +
        '<fieldset class="field"><legend>Notifications</legend><label class="check"><input type="checkbox" checked disabled> In-app notifications (always on)</label><label class="check"><input type="checkbox" name="email"' + (pref.email ? ' checked' : '') + '> Email (simulated, nothing is sent)</label><label class="check"><input type="checkbox" name="sms"' + (pref.sms ? ' checked' : '') + '> SMS (simulated, nothing is sent)</label></fieldset><button class="btn btn-primary" type="submit">Save preferences</button></form></section></div>' +
      (can('settings.thresholds') ? '<section class="card"><h2>Validation settings</h2><form class="form form-row" data-form="thresholds" novalidate><div class="field"><label for="th-sim">Name similarity threshold (%)</label><input id="th-sim" name="sim" type="number" min="70" max="100" step="1" value="' + s.simThreshold + '"><small class="hint">Pairs with the same date of birth at or above this score are flagged for review (70–100).</small></div><div class="field"><label for="th-re">APAAR ID pattern (regular expression)</label><input id="th-re" name="pattern" value="' + esc(s.apaarPattern) + '" maxlength="80"><small class="hint">Default is exactly 12 digits.</small></div><div class="field"><label for="th-sla">Response deadline for requests (days)</label><input id="th-sla" name="sla" type="number" min="1" max="60" value="' + s.slaDays + '"><small class="hint">Applies to new requests.</small></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Save validation settings</button></form></section>' : '') +
      (can('settings.intake') ? '<section class="card"><h2>Approved intake</h2><form class="form" data-form="intake" novalidate><div class="table-wrap"><table><thead><tr><th scope="col">Institution</th><th scope="col">Programme</th><th scope="col">Approved intake</th></tr></thead><tbody>' + scopedProgrammes().map((p) => '<tr><td>' + esc(instById(p.instId).code) + '</td><td>' + esc(p.code + ' – ' + p.name) + '</td><td><label class="sr-only" for="in-' + p.id + '">Approved intake for ' + esc(p.code) + '</label><input id="in-' + p.id + '" name="in-' + p.id + '" type="number" min="0" max="5000" value="' + p.intake + '"></td></tr>').join('') + '</tbody></table></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Save approved intake</button></form></section>' : '') +
      '<section class="card"><h2>Session and security</h2><p>Signed in as <b>' + esc(me.email) + '</b>. Session expires after 30 minutes of inactivity' + (sess ? ' (currently at ' + esc(fmtDT(sess.exp)) + ')' : '') + '.</p><div class="btn-row"><button type="button" class="btn btn-secondary" data-action="logout">' + ic('logout') + ' Sign out</button>' + (can('settings.thresholds') ? '<button type="button" class="btn btn-danger" data-action="reset-demo">Reset demo data</button>' : '') + '</div>' +
      '<p class="small muted">Demo sign-in only. Passwords are checked in the browser and are not secure. Data is stored in this browser (' + (persistOK ? 'storage available' : '<b>storage unavailable: changes will not persist</b>') + ').</p></section>';
  }

  /* ======================================================================
   * 20. Landing, login, router and application shell
   * ==================================================================== */
  let currentPage = 'dashboard';
  let internal = false;

  const PAGE_FN = { dashboard: pgDashboard, myrecord: pgMyRecord, records: pgRecords, import: pgImport, issues: pgIssues, preflight: pgPreflight, requests: pgRequests, verify: pgVerifyLinks, analytics: pgAnalytics, reports: pgReports, audit: pgAudit, notifications: pgNotifications, settings: pgSettings };

  function parseHash() {
    const h = location.hash.replace(/^#/, '');
    const i = h.indexOf('?');
    const path = i >= 0 ? h.slice(0, i) : h;
    const q = {};
    if (i >= 0) new URLSearchParams(h.slice(i + 1)).forEach((v, k) => { q[k] = v; });
    return { parts: path.split('/').filter(Boolean), q };
  }

  function fillLandingStats() {
    const a = analysis();
    const set = (k, v) => { const el = $('[data-stat="' + k + '"]'); if (el) el.textContent = v; };
    set('students', db.students.filter((s) => !s.archived).length);
    set('issues', a.issues.filter((i) => OPEN_ISSUE.includes(a.statusOf(i))).length);
    set('institutions', db.institutions.length);
    const signin = $('.lp-actions .btn-primary');
    if (signin) { signin.textContent = me ? 'Open dashboard' : 'Sign in'; signin.setAttribute('href', me ? '#/app/dashboard' : '#/login'); }
  }
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function showLanding() {
    $('#landing').hidden = false; view().hidden = true;
    document.title = 'AcadID – One Identity. Trusted Academics.';
    fillLandingStats();
    if (pendingScroll) { const id = pendingScroll; pendingScroll = null; setTimeout(() => scrollToId(id), 30); } else window.scrollTo(0, 0);
  }

  function showLogin(q) {
    if (readSession()) { location.hash = '#/app/dashboard'; return; }
    $('#landing').hidden = true; view().hidden = false;
    document.title = 'Sign in – AcadID';
    const demos = Object.keys(USERS).map((id) => {
      const u = USERS[id];
      return '<tr><td><b>' + esc(ROLE_LABEL[u.role]) + '</b></td><td><code>' + esc(u.email) + '</code></td><td><button type="button" class="btn btn-secondary btn-sm" data-action="demo-login" data-uid="' + esc(id) + '">Use this account</button></td></tr>';
    }).join('');
    view().innerHTML = '<div class="plain-page"><header class="plain-head">' + brand('#/') + '<div class="lp-actions">' + themeBtn() + '<a class="btn btn-secondary btn-sm" href="#/">Back to home</a></div></header>' +
      '<main id="main" tabindex="-1" class="container login-grid"><section class="card"><h1>Sign in</h1><p class="muted">Demo sign-in for evaluation. Not production authentication.</p>' +
      '<form class="form" data-form="login" novalidate><div class="field"><label for="lg-email">Email</label><input id="lg-email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="lg-pw">Password</label><input id="lg-pw" name="password" type="password" autocomplete="current-password" required></div><p class="form-error" role="alert" hidden></p><button class="btn btn-primary" type="submit">Sign in</button></form>' +
      '<p class="small muted">Demo password for every account below: <code>' + esc(DEMO_PW) + '</code></p></section>' +
      '<section class="card' + (q && q.demo ? ' highlight' : '') + '"><h2>Demo accounts</h2><p class="muted">Pick a role to explore. All data is synthetic. The AICTE Administrator role is a demo role; AcadID has no connection to AICTE.</p>' +
      '<div class="table-wrap"><table><thead><tr><th scope="col">Role</th><th scope="col">Email</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>' + demos + '</tbody></table></div></section></main></div>';
    hydrateIcons(view()); syncThemeButtons();
    const f = $('#lg-email'); if (f) f.focus();
  }

  function navLinks() {
    return NAV[me.role].map((p) => '<a class="nav-item' + (p === currentPage ? ' active' : '') + '" href="#/app/' + p + '"' + (p === currentPage ? ' aria-current="page"' : '') + '>' + ic(PAGES[p].icon) + '<span class="nav-label">' + esc(pageTitle(p)) + '</span>' + (p === 'notifications' && unreadCount() ? '<span class="count-pill" aria-label="' + unreadCount() + ' unread">' + unreadCount() + '</span>' : '') + '</a>').join('');
  }
  const unreadCount = () => db.notifications.filter((n) => n.userId === me.id && !n.read).length;

  function renderApp(page, q, isInternal) {
    if (!readSession() || !me) { me = null; location.hash = '#/login'; return; }
    $('#landing').hidden = true; view().hidden = false;
    currentPage = page;
    let content, title;
    if (!PAGES[page]) { title = 'Page not found'; content = head(title) + '<div class="card">' + empty('This page does not exist', 'Use the menu to continue.', '<a class="btn btn-primary" href="#/app/dashboard">Go to dashboard</a>') + '</div>'; }
    else if (!canPage(page)) { title = 'Access denied'; audit('access.denied', page); saveDB(); content = head(title) + '<div class="card">' + empty('You do not have access to this page', 'Your role (' + ROLE_LABEL[me.role] + ') cannot open it.', '<a class="btn btn-primary" href="#/app/dashboard">Go to dashboard</a>') + '</div>'; }
    else { if (!isInternal) applyQuery(page, q); title = pageTitle(page); content = PAGE_FN[page](); }
    document.title = title + ' – AcadID';
    const collapsed = (function () { try { return localStorage.getItem('acadid.sb') === '1'; } catch (e) { return false; } })();
    const unread = unreadCount();
    view().innerHTML = '<div class="shell' + (collapsed ? ' is-collapsed' : '') + '" id="shell">' +
      '<aside class="sidebar" id="sidebar" aria-label="Primary"><div class="sb-top">' + brand('#/app/dashboard') + '<button type="button" class="icon-btn sb-collapse" data-action="toggle-sidebar" aria-label="Collapse sidebar">' + ic('chevron') + '</button></div><nav class="nav" aria-label="Main menu">' + navLinks() + '</nav><div class="sb-foot"><a class="nav-item" href="#/">' + ic('home') + '<span class="nav-label">Public site</span></a></div></aside>' +
      '<div class="scrim" data-action="close-sidebar"></div>' +
      '<div class="main-col"><header class="topbar"><button type="button" class="icon-btn sb-open" data-action="open-sidebar" aria-label="Open menu">' + ic('menu') + '</button>' +
        '<nav aria-label="Breadcrumb" class="crumbs"><ol><li><a href="#/">Home</a></li><li><a href="#/app/dashboard">AcadID</a></li><li aria-current="page">' + esc(title) + '</li></ol></nav><div class="grow"></div>' +
        '<span class="chip-demo" title="All data is synthetic">Demo data</span>' + themeBtn() +
        '<a class="icon-btn bell" href="#/app/notifications" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' + ic('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '') + '</a>' +
        '<div class="usermenu"><button type="button" class="user-btn" data-action="toggle-usermenu" aria-expanded="false" aria-haspopup="true" aria-controls="userMenu">' + ic('user') + '<span class="user-name">' + esc(me.name.split(' · ')[0].split(' (')[0]) + '</span></button><div class="menu" id="userMenu" hidden><div class="menu-head"><b>' + esc(me.name) + '</b><span class="small muted">' + esc(ROLE_LABEL[me.role]) + '</span></div><a href="#/app/settings">Settings and profile</a><button type="button" data-action="logout">Sign out</button></div></div></header>' +
      (persistOK ? '' : '<div class="alert alert-error" role="alert">Browser storage is unavailable. Changes will not be saved after you close this page.</div>') +
      '<main id="pageContent" tabindex="-1">' + content + '</main></div></div>';
    hydrateIcons(view()); syncThemeButtons();
    if (!isInternal) {
      const h = $('#pageTitle') || $('#pageContent');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
      if (page === 'requests' && canPage('requests')) {
        if (q.new) openModal('New correction request', newRequestForm(q.sid || ''));
        else if (q.open) { const r = db.requests.find((x) => x.id === q.open && reqVisible(x)); if (r) openModal('Request ' + r.id, reqDetail(r), true); }
      }
    }
  }
  function applyQuery(page, q) {
    const d = UI0();
    if (d[page] && typeof d[page] === 'object') {
      ui[page] = d[page];
      Object.keys(q).forEach((k) => { if (typeof ui[page][k] === 'string') ui[page][k] = String(q[k]); });
    }
  }

  function route() {
    const isInternal = internal; internal = false;
    const { parts, q } = parseHash();
    if (!isInternal) { closeModal(); $('#userMenu') && ($('#userMenu').hidden = true); document.body.classList.remove('printing'); }
    if (!parts.length) return showLanding();
    if (parts[0] === 'login') return showLogin(q);
    if (parts[0] === 'verify') return showVerify(parts[1] || '');
    if (parts[0] === 'app') {
      if (!me && readSession()) me = buildUser(readSession().uid);
      if (!me) { location.hash = '#/login'; return; }
      return renderApp(parts[1] || 'dashboard', q, isInternal);
    }
    $('#landing').hidden = true; view().hidden = false;
    document.title = 'Page not found – AcadID';
    view().innerHTML = '<div class="plain-page"><header class="plain-head">' + brand('#/') + '<div class="lp-actions">' + themeBtn() + '</div></header><main id="main" class="container narrow" tabindex="-1"><h1>Page not found</h1><p>That address does not exist.</p><a class="btn btn-primary" href="#/">Back to home</a></main></div>';
    hydrateIcons(view()); syncThemeButtons();
  }
  function render() {
    const ae = document.activeElement; const id = ae && ae.id;
    internal = true; route();
    if (id) { const el = document.getElementById(id); if (el && el.focus) el.focus({ preventScroll: true }); }
  }

  /* ======================================================================
   * 21. List refresh
   * ==================================================================== */
  const LIST = { records: recordsTable, issues: issuesTable, requests: requestsTable, audit: auditTable, analytics: () => analyticsTable(metrics(ui.analytics)) };
  function refreshList(ns) {
    const area = $('#listArea');
    if (!area || !LIST[ns]) return render();
    area.innerHTML = LIST[ns]();
    hydrateIcons(area);
  }
  function onFilter(el) {
    const parts = el.dataset.f.split(':');
    const ns = parts[0], key = parts[1];
    ui[ns][key] = el.type === 'checkbox' ? el.checked : el.value;
    if (ui[ns].page !== undefined) ui[ns].page = 1;
    if (el.dataset.full) render(); else refreshList(ns);
  }

  /* ======================================================================
   * 22. Actions (clicks)
   * ==================================================================== */
  const PASS_THROUGH = new Set(['note-open']);
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    const i = $('#lk-url'); if (i) { i.select(); document.execCommand('copy'); }
    return Promise.resolve();
  }
  const reqById = (id) => db.requests.find((r) => r.id === id && reqVisible(r));
  const tokById = (id) => db.tokens.find((t) => t.id === id && tokenInScope(t));

  const ACT = {
    'toggle-theme': () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'),
    'toggle-lpnav': (el) => { const nav = $('#lpNav'); const open = nav.classList.toggle('open'); el.setAttribute('aria-expanded', open ? 'true' : 'false'); },
    skip: () => { const m = [$('#pageContent'), $('#main'), $('#landing-main')].find((x) => x && x.offsetParent !== null); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } },
    'close-modal': () => closeModal(),
    'confirm-yes': () => resolveConfirm(true),
    'confirm-no': () => resolveConfirm(false),
    logout: () => signOut('You have been signed out.'),
    'demo-login': (el) => { if (!USERS[el.dataset.uid]) return; signIn(el.dataset.uid); const n = parseHash().q.next; location.hash = n && /^\/app\//.test(n) ? '#' + n : '#/app/dashboard'; },
    'toggle-sidebar': () => { const sh = $('#shell'); const c = sh.classList.toggle('is-collapsed'); try { localStorage.setItem('acadid.sb', c ? '1' : '0'); } catch (e) { /* ignore */ } },
    'open-sidebar': () => $('#shell').classList.add('sb-open'),
    'close-sidebar': () => $('#shell') && $('#shell').classList.remove('sb-open'),
    'toggle-usermenu': (el) => { const m = $('#userMenu'); m.hidden = !m.hidden; el.setAttribute('aria-expanded', m.hidden ? 'false' : 'true'); },
    sort: (el) => { const f = ui[el.dataset.ns]; const k = el.dataset.k; if (f.sort === k) f.dir *= -1; else { f.sort = k; f.dir = 1; } f.page = 1; refreshList(el.dataset.ns); const b = document.querySelector('[data-action="sort"][data-k="' + k + '"]'); if (b) b.focus(); },
    page: (el) => { const f = ui[el.dataset.ns]; const p = parseInt(el.dataset.p, 10); if (p >= 1) { f.page = p; refreshList(el.dataset.ns); const a = $('#listArea'); if (a) a.scrollIntoView({ block: 'nearest' }); } },
    'clear-filters': (el) => { const ns = el.dataset.ns; ui[ns] = UI0()[ns]; render(); },

    'rec-view': (el) => { const s = scopedStudents(true).find((x) => x.id === el.dataset.id); if (!s) return toast('You cannot view that record.', 'error'); openModal('Record ' + refOf(s), recordDetail(s), true); },
    'rec-add': () => { if (requireAction('record.create')) openModal('Add student', studentFormHTML(null)); },
    'rec-edit': (el) => { const s = scopedStudents().find((x) => x.id === el.dataset.id); if (!s || !requireAction('record.edit')) return; openModal('Edit ' + refOf(s), studentFormHTML(s)); },
    'rec-archive': async (el) => {
      const s = scopedStudents().find((x) => x.id === el.dataset.id); if (!s || !requireAction('record.archive')) return;
      if (!(await confirmDialog('Archive ' + refOf(s) + '?', 'The record is hidden from lists and validation but kept for audit. You can restore it later.', 'Archive'))) return;
      s.archived = true; s.updatedAt = now(); s.history.push({ at: now(), by: ROLE_LABEL[me.role], change: 'Archived' });
      audit('record.archive', refOf(s)); if (persist('Record archived.')) refreshList('records');
    },
    'rec-restore': async (el) => {
      const s = scopedStudents(true).find((x) => x.id === el.dataset.id); if (!s || !requireAction('record.archive')) return;
      s.archived = false; s.updatedAt = now(); s.history.push({ at: now(), by: ROLE_LABEL[me.role], change: 'Restored from archive' });
      audit('record.restore', refOf(s)); if (persist('Record restored.')) refreshList('records');
    },
    'rec-export': () => exportReport('students', 'csv'),

    'imp-template': () => download('acadid-import-template.csv', templateCSV(), 'text/csv;charset=utf-8'),
    'imp-sample': () => download('acadid-import-sample-with-problems.csv', sampleCSV(), 'text/csv;charset=utf-8'),
    'imp-confirm': () => confirmImport(),
    'imp-cancel': () => { ui.imp = null; const i = $('#imp-file'); if (i) i.value = ''; $('#impArea').innerHTML = ''; toast('Import discarded. Nothing was saved.', 'info'); },
    'imp-errors': () => { if (!ui.imp || !ui.imp.results) return; audit('report.export', 'import-errors'); persist(); download('acadid-import-errors.csv', toCSV(importErrorRows(ui.imp.results)), 'text/csv;charset=utf-8'); },
    'imp-hist-report': (el) => { const i = db.imports.find((x) => x.id === el.dataset.id && x.instId === me.instId); if (!i) return; download('acadid-' + i.id + '-errors.csv', toCSV(i.errorRows), 'text/csv;charset=utf-8'); },

    'issue-set': async (el) => {
      if (!requireAction('issue.review')) return;
      const iss = issuesInScope().find((i) => i.key === el.dataset.key); if (!iss) return toast('That issue is no longer available.', 'error');
      const st = el.dataset.st; if (!ISSUE_STATUS.includes(st)) return;
      if (st === 'Dismissed' && !(await confirmDialog('Dismiss this flag?', 'It will no longer count as open. You can reopen it later. The similarity score is not proof either way.', 'Dismiss'))) return;
      if (st === 'Open') delete db.reviews[iss.key]; else db.reviews[iss.key] = { status: st, by: me.id, at: now() };
      audit('issue.review', iss.ids.length ? iss.ids.map((x) => refOf(studentById(x))).join('/') : progName(iss.progId), { type: iss.type, status: st });
      if (persist('Flag marked: ' + st + '.')) { if (currentPage === 'issues') refreshList('issues'); else render(); }
    },
    'run-validation': () => {
      if (!requireAction('validate')) return;
      cache = null; const run = recordRun('Manual run');
      audit('validation.run', run.id, { openFlags: run.issues, high: run.high });
      notify(me.id, 'Validation alert', 'Validation finished', run.issues + ' open flag(s), ' + run.high + ' high severity.', '#/app/issues');
      if (persist('Validation complete: ' + run.issues + ' open flag(s).')) render();
    },

    'pf-checklist': () => {
      const p = ui.pf; if (!p) return;
      const s = studentById(p.studentId);
      const txt = '﻿AcadID pre-flight checklist (demo)\r\nRecord: ' + refOf(s) + ' · ' + s.name + '\r\nDate: ' + new Date().toLocaleDateString('en-IN') + '\r\n\r\nComparison\r\n' + p.rows.map((r) => ' - ' + r[0] + ': document "' + r[1] + '" / record "' + r[2] + '" -> ' + r[3]).join('\r\n') + '\r\n\r\nChecklist\r\n' + p.lines.map((l, i) => (i + 1) + '. ' + l.en + '\r\n   ' + l.ta).join('\r\n') + '\r\n';
      download('acadid-checklist-' + refOf(s) + '.txt', txt, 'text/plain;charset=utf-8');
    },
    'pf-letter': () => { if (!ui.pf) return; $('#pfLetter').innerHTML = '<h3>Draft letter</h3><label class="sr-only" for="pfLetterText">Draft correction letter</label><textarea id="pfLetterText" rows="14" class="mono">' + esc(letterText()) + '</textarea><div class="btn-row"><button type="button" class="btn btn-secondary" data-action="pf-letter-dl">' + ic('download') + ' Download letter</button></div>'; hydrateIcons($('#pfLetter')); },
    'pf-letter-dl': () => { const t = $('#pfLetterText'); if (t) download('acadid-correction-letter.txt', '﻿' + t.value.replace(/\n/g, '\r\n'), 'text/plain;charset=utf-8'); },

    'req-new': () => { if (can('request.create') || can('request.manage')) openModal('New correction request', newRequestForm('')); else toast('You cannot create requests.', 'error'); },
    'req-view': (el) => { const r = reqById(el.dataset.id); if (r) openModal('Request ' + r.id, reqDetail(r), true); },
    'req-remind': (el) => {
      if (!requireAction('request.manage')) return;
      const r = reqById(el.dataset.id); if (!r) return;
      notify(studentUserFor(r.studentId), 'Correction request', 'Reminder about ' + r.id, 'This request is past its response deadline. (Simulated reminder)', '#/app/requests?open=' + r.id, true);
      audit('request.remind', r.id, { channel: 'simulated' }); persist('Reminder recorded. It is simulated: no email or SMS was sent.');
    },

    'link-view': (el) => { const t = tokById(el.dataset.id); if (t && tokenState(t) === 'Active') showLinkModal(t); },
    'link-copy': () => { const i = $('#lk-url'); if (i) copyText(i.value).then(() => toast('Link copied.', 'success'), () => toast('Copy failed. Select the link and copy it manually.', 'error')); },
    'link-log': (el) => {
      const t = tokById(el.dataset.id); if (!t) return;
      const log = db.access.filter((x) => x.tokenId === t.id);
      openModal('Access log for ' + t.id, (log.length ? tbl(['<th scope="col">When</th>', '<th scope="col">Visitor</th>', '<th scope="col">Outcome</th>'], log.map((x) => '<tr><td>' + esc(fmtDT(x.at)) + '</td><td>' + esc(x.actor === 'anonymous' ? 'Anonymous verifier' : ROLE_LABEL[(USERS[x.actor] || {}).role] || x.actor) + '</td><td>' + esc(x.outcome) + '</td></tr>')) : empty('No visits yet', 'Visits to this link will be listed here.')) + '<p class="small muted">Consent: ' + esc(t.consent.statement) + ' (' + esc(fmtDT(t.consent.at)) + ')</p>', true);
    },
    'link-revoke': async (el) => {
      const t = tokById(el.dataset.id); if (!t || tokenState(t) !== 'Active') return;
      if (!(await confirmDialog('Revoke link ' + t.id + '?', 'The link and QR code stop working immediately. Verifiers will see that it was revoked.', 'Revoke'))) return;
      t.revokedAt = now(); audit('link.revoke', t.id);
      notify(studentUserFor(t.studentId), 'Verification activity', 'Proof link revoked', 'Link ' + t.id + ' was revoked.', '#/app/verify');
      if (persist('Link revoked.')) render();
    },

    'note-read': (el) => { const n = db.notifications.find((x) => x.id === el.dataset.id && x.userId === me.id); if (n) { n.read = true; if (persist()) render(); } },
    'note-open': (el) => { const n = db.notifications.find((x) => x.id === el.dataset.id && x.userId === me.id); if (n) { n.read = true; saveDB(); } },
    'note-readall': () => { db.notifications.forEach((n) => { if (n.userId === me.id) n.read = true; }); if (persist('All notifications marked as read.')) render(); },

    'report-csv': (el) => { if (canPage('reports')) exportReport(el.dataset.r, 'csv'); },
    'report-print': (el) => { if (canPage('reports')) exportReport(el.dataset.r, 'print'); },
    'analytics-export': () => { if (canPage('analytics')) exportReport('quality', 'csv'); },
    'reset-demo': async () => {
      if (!can('settings.thresholds')) return;
      if (!(await confirmDialog('Reset all demo data?', 'This deletes every change you made in this browser and restores the original synthetic dataset.', 'Reset'))) return;
      const uid = me.id;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      ui = UI0(); seedDB(); me = buildUser(uid); audit('demo.reset', 'Demo dataset'); persist('Demo data reset.'); location.hash = '#/app/dashboard'; render();
    }
  };

  /* ======================================================================
   * 23. Forms
   * ==================================================================== */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const FORMS = {
    contact: (f) => {
      const errs = {};
      const name = fv(f, 'name'), email = fv(f, 'email'), msg = fv(f, 'message');
      if (name.length < 2) errs.name = 'Enter your name.';
      if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.';
      if (msg.length < 10) errs.message = 'Write at least 10 characters.';
      if (Object.keys(errs).length) return showErrors(f, errs);
      clearErrors(f);
      db.contacts.push({ at: now(), name, email, message: msg.slice(0, 1000) });
      if (persist('Thank you. Your message was saved in this browser only. Nothing was sent.')) f.reset();
    },
    login: (f) => {
      const errs = {}; const email = fv(f, 'email').toLowerCase(); const pw = f.elements.password.value;
      if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.';
      if (!pw) errs.password = 'Enter your password.';
      if (Object.keys(errs).length) return showErrors(f, errs);
      if (now() < loginFails.until) return showErrors(f, { form: 'Too many attempts. Wait ' + Math.ceil((loginFails.until - now()) / 1000) + ' seconds and try again.' });
      const u = Object.keys(USERS).map((k) => USERS[k]).find((x) => x.email === email);
      if (!u || cyrb53('acadid-demo|' + pw) !== DEMO_PW_HASH) {
        loginFails.n++; if (loginFails.n >= 5) { loginFails.until = now() + 30000; loginFails.n = 0; }
        return showErrors(f, { form: 'Incorrect email or password.' });
      }
      loginFails.n = 0; signIn(u.id);
      const n = parseHash().q.next; location.hash = n && /^\/app\//.test(n) ? '#' + n : '#/app/dashboard';
    },
    'dash-search': (f) => { const q = fv(f, 'q'); location.hash = '#/app/records' + (q ? '?q=' + encodeURIComponent(q) : ''); },
    'open-token': (f) => {
      if (!requireAction('verify.use')) return;
      const raw = fv(f, 'token'); const m = raw.match(/verify\/([A-Za-z0-9_-]{16,})/) || raw.match(/^([A-Za-z0-9_-]{16,})$/);
      if (!m) return showErrors(f, { token: 'Paste the full proof link or the token.' });
      location.hash = '#/verify/' + m[1];
    },
    student: (f) => {
      const id = f.dataset.id; const isEdit = !!id;
      if (!requireAction(isEdit ? 'record.edit' : 'record.create')) return;
      const errs = validateStudentForm(f, id);
      const prog = progById(fv(f, 'progId'));
      if (prog && prog.instId !== me.instId) errs.progId = 'Choose a programme at your institution.';
      if (Object.keys(errs).length) return showErrors(f, errs);
      const vals = { name: fv(f, 'name').replace(/\s+/g, ' '), dob: fv(f, 'dob'), apaar: fv(f, 'apaar'), progId: fv(f, 'progId'), year: fv(f, 'year'), status: fv(f, 'status'), category: fv(f, 'category') };
      if (isEdit) {
        const s = scopedStudents().find((x) => x.id === id); if (!s) return toast('You cannot edit that record.', 'error');
        const changed = Object.keys(vals).filter((k) => s[k] !== vals[k]);
        if (!changed.length) { closeModal(); return toast('No changes to save.', 'info'); }
        changed.forEach((k) => { s[k] = vals[k]; });
        s.updatedAt = now(); s.history.push({ at: now(), by: ROLE_LABEL[me.role], change: 'Updated: ' + changed.map((k) => FIELD_LABEL[k] || k).join(', ') });
        audit('record.update', refOf(s), { fields: changed.join(',') });
        if (persist('Record updated.')) { closeModal(); refreshList('records'); }
      } else {
        const t = now(); const sid = 'S' + pad(++db.seq.rec, 4);
        const s = Object.assign({ id: sid, instId: me.instId, archived: false, createdAt: t, updatedAt: t, history: [{ at: t, by: ROLE_LABEL[me.role], change: 'Record created' }] }, vals);
        db.students.push(s); audit('record.create', refOf(s));
        if (persist('Student added as ' + refOf(s) + '.')) { closeModal(); refreshList('records'); }
      }
    },
    preflight: (f) => runPreflight(f),
    'req-new': (f) => {
      if (!(can('request.create') || can('request.manage'))) return toast('You cannot create requests.', 'error');
      const errs = {}; const sid = fv(f, 'studentId'); const s = scopedStudents().find((x) => x.id === sid);
      if (!s) errs.studentId = 'Choose a record you are allowed to correct.';
      const field = fv(f, 'field'), proposed = fv(f, 'proposed'), desc = fv(f, 'description');
      if (!['Student name', 'Date of birth', 'APAAR ID', 'Programme', 'Institution', 'Other'].includes(field)) errs.field = 'Choose a field.';
      if (field !== 'Other' && !proposed) errs.proposed = 'Enter the correct value.';
      if (desc.length < 20) errs.description = 'Explain the issue in at least 20 characters.';
      const file = f.elements.file && f.elements.file.files && f.elements.file.files[0];
      if (file) { if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) errs.file = 'Only JPG, PNG or PDF files are accepted.'; else if (file.size > 2 * 1024 * 1024) errs.file = 'The file is larger than 2 MB.'; }
      if (Object.keys(errs).length) return showErrors(f, errs);
      const t = now();
      const r = { id: nextId('req', 'ACR-' + new Date().getFullYear() + '-', 6), studentId: s.id, instId: s.instId, field, proposed, description: desc, status: 'Submitted', createdAt: t, updatedAt: t, dueAt: t + db.settings.slaDays * DAY, assignee: '', notes: [], messages: [], attachment: file ? { name: file.name, size: file.size } : null,
        history: [{ at: t, by: ROLE_LABEL[me.role], from: '', to: 'Submitted', reason: 'Request submitted' }] };
      db.requests.push(r); audit('request.create', r.id, { field });
      notify(instAdminFor(s.instId), 'Correction request', 'New request ' + r.id, field + ' correction submitted for ' + refOf(s) + '.', '#/app/requests?open=' + r.id);
      if (me.role !== 'student') notify(studentUserFor(s.id), 'Correction request', 'A request was raised for you', 'Ticket ' + r.id + ' was created for your record.', '#/app/requests?open=' + r.id);
      if (persist('Request submitted. Your ticket ID is ' + r.id + '.')) { openModal('Request ' + r.id, reqDetail(r), true); if (currentPage === 'requests') refreshList('requests'); else if (currentPage === 'dashboard') render(); }
    },
    'req-status': (f) => {
      if (!requireAction('request.manage')) return;
      const r = reqById(f.dataset.id); if (!r) return;
      const to = fv(f, 'status'), reason = fv(f, 'reason');
      const errs = {};
      if (!NEXT_STATUS[r.status].includes(to)) errs.status = 'That status change is not allowed from ' + r.status + '.';
      if (REASON_REQUIRED.includes(to) && reason.length < 5) errs.reason = 'Give a reason of at least 5 characters.';
      if (Object.keys(errs).length) return showErrors(f, errs);
      const from = r.status;
      r.status = to; r.updatedAt = now(); r.history.push({ at: now(), by: ROLE_LABEL[me.role], from, to, reason: reason || 'Status updated' });
      audit('request.status', r.id, { from, to });
      notify(studentUserFor(r.studentId), 'Correction request', r.id + ' is now ' + to, reason || 'Status updated.', '#/app/requests?open=' + r.id);
      if (persist('Status updated to ' + to + '.')) { openModal('Request ' + r.id, reqDetail(r), true); if (currentPage === 'requests') refreshList('requests'); }
    },
    'req-assign': (f) => {
      if (!requireAction('request.manage')) return; const r = reqById(f.dataset.id); if (!r) return;
      const a = fv(f, 'assignee'); if (!['', 'Records Section (demo)', 'Registrar Office (demo)', 'Institution admin (demo)'].includes(a)) return;
      r.assignee = a; r.updatedAt = now(); audit('request.assign', r.id, { to: a || 'unassigned' });
      if (persist('Assignment saved.')) { openModal('Request ' + r.id, reqDetail(r), true); if (currentPage === 'requests') refreshList('requests'); }
    },
    'req-note': (f) => {
      if (!requireAction('request.manage')) return; const r = reqById(f.dataset.id); if (!r) return;
      const text = fv(f, 'text'); if (text.length < 3) return showErrors(f, { text: 'Write a short note.' });
      r.notes.push({ at: now(), by: ROLE_LABEL[me.role], text }); audit('request.note', r.id);
      if (persist('Note added.')) openModal('Request ' + r.id, reqDetail(r), true);
    },
    'req-respond': (f) => {
      if (!requireAction('request.respond')) return; const r = reqById(f.dataset.id);
      if (!r || r.studentId !== me.studentId || r.status !== 'Action Required') return;
      const text = fv(f, 'text'); if (text.length < 5) return showErrors(f, { text: 'Write your response.' });
      r.messages.push({ at: now(), by: 'Student', role: 'student', text });
      r.history.push({ at: now(), by: ROLE_LABEL[me.role], from: r.status, to: 'Under Review', reason: 'Student responded' }); r.status = 'Under Review'; r.updatedAt = now();
      audit('request.respond', r.id); notify(instAdminFor(r.instId), 'Additional information', 'Student responded to ' + r.id, text.slice(0, 80), '#/app/requests?open=' + r.id);
      if (persist('Response sent.')) { openModal('Request ' + r.id, reqDetail(r), true); if (currentPage === 'requests') refreshList('requests'); }
    },
    'link-new': (f) => {
      if (!requireAction('link.create')) return;
      const errs = {}; const s = scopedStudents().find((x) => x.id === fv(f, 'studentId'));
      if (!s || s.archived) errs.studentId = 'Choose an eligible record.';
      const claims = $$('input[name="claim"]:checked', f).map((c) => c.value).filter((c) => CLAIMS[c]);
      if (!claims.length) errs.claim = 'Select at least one claim to share.';
      const purpose = fv(f, 'purpose'); if (!PURPOSES.includes(purpose)) errs.purpose = 'Choose a purpose.';
      const hours = parseInt(fv(f, 'hours'), 10); if (![1, 24, 168].includes(hours)) errs.hours = 'Choose a validity period.';
      if (!f.elements.consent.checked) errs.consent = 'Consent is required to create a link.';
      if (Object.keys(errs).length) return showErrors(f, errs);
      let token; try { token = randomToken(24); } catch (e) { return toast(e.message, 'error'); }
      const t = now();
      const tk = { id: nextId('tok', 'TK-', 4), token, studentId: s.id, claims, purpose, createdBy: me.id, createdAt: t, expiresAt: t + hours * 3600000, revokedAt: null, label: '',
        consent: { by: me.id, at: t, statement: (me.role === 'student' ? 'Student consented' : 'Institution confirmed student consent') + ' to share ' + claims.map((c) => CLAIMS[c]).join(', ') + ' for ' + purpose + '.' } };
      db.tokens.push(tk); audit('link.create', tk.id, { purpose, claims: claims.length });
      if (me.role !== 'student') notify(studentUserFor(s.id), 'Verification activity', 'A proof link was created for you', 'Link ' + tk.id + ' was created for ' + purpose + '.', '#/app/verify');
      if (persist()) { showLinkModal(tk); render(); }
    },
    prefs: (f) => {
      db.prefs[me.id] = { lang: fv(f, 'lang') === 'ta' ? 'ta' : 'en', email: !!f.elements.email.checked, sms: !!f.elements.sms.checked };
      audit('settings.prefs', me.id); persist('Preferences saved.');
    },
    thresholds: (f) => {
      if (!requireAction('settings.thresholds')) return;
      const errs = {}; const sim = Number(fv(f, 'sim')); const sla = Number(fv(f, 'sla')); const pattern = fv(f, 'pattern');
      if (!Number.isInteger(sim) || sim < 70 || sim > 100) errs.sim = 'Enter a whole number from 70 to 100.';
      if (!Number.isInteger(sla) || sla < 1 || sla > 60) errs.sla = 'Enter a whole number of days from 1 to 60.';
      if (!pattern || pattern.length > 80) errs.pattern = 'Enter a pattern of up to 80 characters.';
      else { try { new RegExp(pattern); } catch (e) { errs.pattern = 'This is not a valid regular expression.'; } }
      if (Object.keys(errs).length) return showErrors(f, errs);
      db.settings.simThreshold = sim; db.settings.slaDays = sla; db.settings.apaarPattern = pattern;
      audit('settings.thresholds', 'Validation settings', { sim, sla });
      if (persist('Validation settings saved. Run validation to apply them to existing records.')) render();
    },
    intake: (f) => {
      if (!requireAction('settings.intake')) return;
      const errs = {}; const updates = [];
      scopedProgrammes().forEach((p) => { const v = Number(fv(f, 'in-' + p.id)); if (!Number.isInteger(v) || v < 0 || v > 5000) errs['in-' + p.id] = 'Enter a whole number from 0 to 5000.'; else updates.push([p, v]); });
      if (Object.keys(errs).length) return showErrors(f, errs);
      updates.forEach(([p, v]) => { p.intake = v; });
      audit('settings.intake', 'Approved intake', { programmes: updates.length });
      if (persist('Approved intake saved.')) render();
    }
  };

  /* ======================================================================
   * 24. Global event wiring and start-up
   * ==================================================================== */
  function initLogos() {
    const chain = ['aicte-logo.jpg', 'aicte-logo.png', 'aicte-logo.jpeg', 'aicte-logo.svg', 'aicte-logo.webp'];
    $$('.js-logo').forEach((img) => {
      let i = Math.max(0, chain.indexOf((img.getAttribute('src') || '').split('/').pop()));
      const next = () => {
        i++;
        if (i < chain.length) img.src = chain[i];
        else { const fb = document.createElement('div'); fb.className = 'logo-fallback'; fb.setAttribute('role', 'img'); fb.setAttribute('aria-label', 'AICTE logo (image file not found)'); fb.textContent = 'AICTE'; img.replaceWith(fb); }
      };
      img.addEventListener('error', next);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) next();
    });
  }

  function wire() {
    document.addEventListener('click', (e) => {
      touch();
      const sc = e.target.closest('[data-scroll]');
      if (sc) {
        e.preventDefault();
        const id = sc.dataset.scroll;
        const nav = $('#lpNav'); if (nav) { nav.classList.remove('open'); const b = $('.lp-burger'); if (b) b.setAttribute('aria-expanded', 'false'); }
        if (location.hash === '#/' || location.hash === '' || location.hash === '#') scrollToId(id);
        else { pendingScroll = id; location.hash = '#/'; }
        return;
      }
      const um = $('#userMenu');
      if (um && !um.hidden && !e.target.closest('.usermenu')) { um.hidden = true; const ub = $('[data-action="toggle-usermenu"]'); if (ub) ub.setAttribute('aria-expanded', 'false'); }
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const h = ACT[t.dataset.action];
      if (!h) return;
      if (t.tagName === 'A' && !PASS_THROUGH.has(t.dataset.action)) e.preventDefault();
      try {
        const r = h(t, e);
        if (r && typeof r.catch === 'function') r.catch((err) => { console.error(err); toast('Something went wrong. Please try again.', 'error'); });
      } catch (err) { console.error(err); toast('Something went wrong. Please try again.', 'error'); }
    });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('form[data-form]');
      if (!f) return;
      e.preventDefault();
      const h = FORMS[f.dataset.form];
      if (!h) return;
      try { h(f); } catch (err) { console.error(err); toast('Something went wrong. Nothing was saved.', 'error'); }
    });
    document.addEventListener('input', (e) => { const el = e.target.closest('[data-f]'); if (el) onFilter(el); });
    document.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.change === 'imp-file') handleImportFile(el);
    });
    document.addEventListener('keydown', (e) => {
      touch();
      if (e.key === 'Escape') { const um = $('#userMenu'); if (um && !um.hidden) { um.hidden = true; const b = $('[data-action="toggle-usermenu"]'); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); } } const sh = $('#shell'); if (sh) sh.classList.remove('sb-open'); }
    });
    $('#confirm').addEventListener('cancel', () => resolveConfirm(false));
    $('#modal').addEventListener('close', () => { $('#modalBody').innerHTML = ''; });
    window.addEventListener('hashchange', route);
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (ev) => { let saved = null; try { saved = localStorage.getItem('acadid.theme'); } catch (x) { /* ignore */ } if (!saved) setThemeNoSave(ev.matches ? 'dark' : 'light'); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }
  }
  function setThemeNoSave(t) { document.documentElement.setAttribute('data-theme', t); syncThemeButtons(); }

  function init() {
    db = loadDB();
    if (!db) { seedDB(); saveDB(); }
    const s = readSession();
    if (s) me = buildUser(s.uid);
    hydrateIcons(document);
    initLogos();
    syncThemeButtons();
    wire();
    setInterval(checkSession, 30000);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
