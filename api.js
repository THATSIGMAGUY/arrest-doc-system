// ========== GAS CALL HELPER ==========

/* gasCall — เรียก Google Apps Script
   ถ้ารันใน GAS HtmlService → ใช้ google.script.run (ไม่มี CORS)
   ถ้ารันจาก file:// หรือ server อื่น → ใช้ fetch */
async function gasCall(url, opts = {}) {
  // --- Mode 1: google.script.run (เมื่อ host บน GAS) ---
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    // แยก action และ params จาก URL / body — body ชนะ URL ถ้ามี
    const u = new URL(url, 'https://x.com');
    let action = u.searchParams.get('action');
    const params = {};
    u.searchParams.forEach((v, k) => { if (k !== 'action') params[k] = v; });
    if (opts.body) {
      try {
        const bodyData = JSON.parse(opts.body);
        if (bodyData.action) action = bodyData.action;
        Object.assign(params, bodyData);
      } catch(e) {}
    }

    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(r => { console.log('[GAS] script.run OK:', r); resolve(r); })
        .withFailureHandler(e => reject(new Error(e.message || 'Server error')))
        .gasApi(action, params);
    });
  }

  // --- Mode 2: fetch (เมื่อ host บน server อื่นหรือ localhost) ---
  const res = await fetch(url, { redirect: 'follow', ...opts });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch(pe) { throw new Error('Response ไม่ใช่ JSON: ' + text.substring(0, 80)); }
}

// ขนาดเล็กๆ เรียกง่ายขึ้น — ทุก action ส่งเป็น POST + JSON body
function gasPost(action, payload = {}) {
  return gasCall(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload })
  });
}

// ========== GOOGLE SHEETS & DATA ==========

async function loadCases() {
  if (!GAS_URL) { S.cases = loadLocalCases(); R(); return; }
  S.loading = true; R();
  try {
    // Day 4: ส่ง requester เพื่อให้ backend filter ตามเจ้าของ (admin เห็นทั้งหมด)
    const data = await gasPost('listCases', { requester: S.currentUser?.username || '' });
    if (data.success) S.cases = data.cases || [];
    else showToast(data.error || 'โหลดข้อมูลล้มเหลว', 'error');
  } catch(e) { showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ' + e.message, 'error'); }
  S.loading = false; R();
}

async function saveCurrentCase() {
  saveAll(); // sync form inputs to S

  const suspectNames = S.suspects.map(s => `${s.title}${s.firstName} ${s.lastName}`.trim()).filter(n=>n).join(', ');
  const accusation = S.incident.accusation || '';
  const location = `${S.incident.subDistrict||''} ${S.incident.district||''} ${S.incident.province||''}`.trim();
  const status = S.step >= 7 ? 'completed' : 'draft';

  // Build caseData — the full S object minus UI fields
  const caseData = {};
  const skipKeys = ['view','currentUser','cases','currentCaseId','dashSearch','dashFilter','loginError','loading','showModal','modalSuspectIdx'];
  for (const k of Object.keys(S)) {
    if (!skipKeys.includes(k)) caseData[k] = S[k];
  }

  if (!GAS_URL) {
    // Offline mode — save to localStorage
    if (!S.currentCaseId) S.currentCaseId = 'CASE_' + Date.now();
    const localCases = JSON.parse(localStorage.getItem('arrestCases') || '[]');
    const idx = localCases.findIndex(c => c.caseId === S.currentCaseId);
    const entry = {
      caseId: S.currentCaseId,
      createdBy: S.currentUser?.username || 'offline',
      createdAt: idx >= 0 ? localCases[idx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status, suspectNames, accusation, location,
      caseData: JSON.stringify(caseData)
    };
    if (idx >= 0) localCases[idx] = entry;
    else localCases.push(entry);
    localStorage.setItem('arrestCases', JSON.stringify(localCases));
    S.cases = localCases.map(c => ({...c, caseData: undefined}));
    showToast('💾 บันทึกสำเร็จ (Offline)', 'success');
    R();
    return;
  }

  S.loading = true;
  showToast('💾 กำลังบันทึก...', 'success');
  try {
    // Day 4: ส่ง requester (backend เช็ค ownership) + ส่ง caseData เป็น object (backend stringify เอง)
    const data = await gasPost('saveCase', {
      caseId: S.currentCaseId,
      requester: S.currentUser?.username || '',
      caseData,
      suspectNames, accusation, location, status
    });
    if (data.success) {
      S.currentCaseId = data.caseId;
      showToast('✅ บันทึกสำเร็จ', 'success');
      await loadCases();
    } else {
      showToast(data.error || 'บันทึกล้มเหลว', 'error');
    }
  } catch(e) { showToast('บันทึกไม่ได้: ' + e.message, 'error'); }
  S.loading = false; R();
}

async function openCase(caseId) {
  if (!GAS_URL) {
    // Offline mode
    const localCases = JSON.parse(localStorage.getItem('arrestCases') || '[]');
    const c = localCases.find(x => x.caseId === caseId);
    if (c && c.caseData) {
      const cd = JSON.parse(c.caseData);
      Object.assign(S, cd);
      S.currentCaseId = caseId;
      S.view = 'form';
      R();
    }
    return;
  }

  S.loading = true; R();
  try {
    // Day 4: getCase ต้องส่ง requester + backend return shape ใหม่เป็น flat (caseData อยู่ top-level)
    const data = await gasPost('getCase', {
      caseId,
      requester: S.currentUser?.username || ''
    });
    if (data.success && data.caseData) {
      const cd = typeof data.caseData === 'string' ? JSON.parse(data.caseData) : data.caseData;
      Object.assign(S, cd);
      S.currentCaseId = caseId;
      S.view = 'form';
    } else {
      showToast(data.error || 'โหลดข้อมูลคดีล้มเหลว', 'error');
    }
  } catch(e) { showToast('โหลดคดีไม่ได้: ' + e.message, 'error'); }
  S.loading = false; R();
}

async function confirmDeleteCase(caseId) {
  if (!confirm('ยืนยันการลบรายการคดีนี้?')) return;

  if (!GAS_URL) {
    let localCases = JSON.parse(localStorage.getItem('arrestCases') || '[]');
    localCases = localCases.filter(c => c.caseId !== caseId);
    localStorage.setItem('arrestCases', JSON.stringify(localCases));
    S.cases = localCases.map(c => ({...c, caseData: undefined}));
    showToast('🗑 ลบสำเร็จ', 'success');
    R();
    return;
  }

  try {
    // Day 4: deleteCase ต้องส่ง requester (backend เช็คว่าเป็นเจ้าของหรือ admin)
    const data = await gasPost('deleteCase', {
      caseId,
      requester: S.currentUser?.username || ''
    });
    if (data.success) {
      showToast('🗑 ลบสำเร็จ', 'success');
      await loadCases();
    } else { showToast(data.error || 'ลบล้มเหลว', 'error'); }
  } catch(e) { showToast('ลบไม่ได้: ' + e.message, 'error'); }
}

function newCase() {
  // Reset form state to defaults
  const defaults = {
    step: 0,
    activeSuspect: 0,
    showModal: null,
    modalSuspectIdx: 0,
    officer: { rank:'', firstName:'', lastName:'', position:'', unit:'', phone:'' },
    commanders: [{ rankName:'' }],
    leaders: [{ rankName:'' }],
    jointUnits: [{ unitName:'', officers:[{ rankName:'' }] }],
    suspects: [newSuspect(1)],
    incident: { recordPlace:'', recordDate:'', recordTime:'', arrestDate:'', arrestTime:'', location:'', houseNo:'', road:'', subDistrict:'', district:'', province:'', narrative:'', accusation:'', charges:'' },
    evidence: [{ name:'', qty:'', unit:'ชิ้น', location:'' }],
    evidenceLocation: '',
    detentionPlace: '', detentionDistrict: '', detentionProvince: '',
    scenePhoto: null, scenePhotoName: '',
    evidencePhoto: null, evidencePhotoName: '',
    anungText: 'ในการจับครั้งนี้ เจ้าหน้าที่ตำรวจทุกนาย ได้ปฏิบัติตามอำนาจหน้าที่ มิได้ทำหรือจัดให้ทำการใดๆ ซึ่งเป็นการให้คำมั่น สัญญา ขู่เข็ญ หลอกลวง ทรมาน ใช้กำลังบังคับ หรือทำให้ผู้ใดได้รับอันตรายแก่กายหรือจิตใจ แต่อย่างใด มิได้ทำให้ทรัพย์สินของผู้ใดเสียหาย สูญหาย เสื่อมค่าหรือไร้ค่า และมิได้เบียดบังเอาทรัพย์สินของผู้ใด ไปเป็นประโยชน์ส่วนตนหรือบุคคลอื่น หรือกระทำการโดยมีชอบประการใดๆ เจ้าหน้าที่ผู้จับได้จัดทำบันทึกการจับขึ้น แล้วได้มอบสำเนาบันทึกการจับให้ผู้ถูกจับไว้ จำนวน ๑ ฉบับแล้ว',
    signatures: {},
    sigActiveKey: 'officer',
    sigMode: 'electronic',
  };

  Object.assign(S, defaults);
  S.currentCaseId = null;
  S.view = 'form';
  R();
}

function backToDashboard() {
  if (confirm('กลับไปหน้า Dashboard?\n(ข้อมูลที่ยังไม่ได้บันทึกจะหายไป — กดบันทึกก่อนหากต้องการเก็บข้อมูล)')) {
    S.view = 'dashboard';
    R();
  }
}

function loadLocalCases() {
  try {
    const cases = JSON.parse(localStorage.getItem('arrestCases') || '[]');
    return cases.map(c => ({ caseId: c.caseId, createdBy: c.createdBy, createdAt: c.createdAt, updatedAt: c.updatedAt, status: c.status, suspectNames: c.suspectNames, accusation: c.accusation, location: c.location }));
  } catch(e) { return []; }
}

function showToast(msg, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast ${type||'success'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
