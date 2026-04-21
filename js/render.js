// ========== RENDER ==========
function R() {
  const app = document.getElementById('app');
  if (S.view === 'login') {
    app.innerHTML = rLogin();
  } else if (S.view === 'dashboard') {
    app.innerHTML = `${rTopbar()}${rDashboard()}${rCreditFooter()}`;
  } else {
    app.innerHTML = `
      ${rTopbar()}${rStepper()}
      <div class="ct"><div class="ci">${rStep()}</div>${rNav()}</div>
      ${S.showModal ? rModal() : ''}
      ${rCreditFooter()}
    `;
    bindInputs();
    if (S.step === 6) initSig();
  }
}

function rTopbar() {
  const o = S.officer;
  const user = S.currentUser;
  const name = user ? (user.displayName || user.username) : `${o.rank} ${o.firstName} ${o.lastName}`;
  const showBack = S.view === 'form';
  return `<div class="topbar">
    <div style="display:flex;align-items:center;gap:12px">
      ${showBack ? `<button class="btn btn-s" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="backToDashboard()">← กลับ</button>` : ''}
      <h1>⚖️ ระบบจัดทำเอกสารหลังจับกุม/ควบคุมตัว</h1>
    </div>
    <div class="ui">
      <span>${esc(name)}</span>
      ${showBack ? `<button class="btn btn-s" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="saveCurrentCase()">💾 บันทึก</button>` : ''}
      <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:14px" onclick="${S.view==='dashboard'?'doLogout()':''}">👤</div>
    </div>
  </div>`;
}

function rLogin() {
  return `
    <div class="login-bg">
      <div class="login-box">
        <div class="logo">⚖️</div>
        <h2>ระบบจัดทำเอกสารหลังจับกุม</h2>
        <div class="sub">Post-Arrest Documentation System</div>
        <div class="err">${S.loginError}</div>
        <input type="text" id="login-user" placeholder="ชื่อผู้ใช้ (Username)" value="" onkeydown="if(event.key==='Enter')doLogin()">
        <input type="password" id="login-pass" placeholder="รหัสผ่าน (Password)" value="" onkeydown="if(event.key==='Enter')doLogin()">
        <button class="btn btn-p btn-l" onclick="doLogin()" ${S.loading?'disabled':''}>
          ${S.loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
        </button>
        <div class="credit">จัดทำโดย ร.ต.อ.มาตรา จิตรธนภัทร์</div>
      </div>
    </div>
  `;
}

function rStepper() {
  return `<div class="stepper">${STEPS.map((s,i) => `<button class="sbtn ${i===S.step?'active':''} ${i<S.step?'done':''}" onclick="go(${i})"><span class="sn">${i<S.step?'✓':i+1}</span><span>${s.i} ${s.l}</span></button>`).join('')}</div>`;
}

function rNav() {
  return `<div class="bnav"><button class="btn btn-o" onclick="prev()" ${S.step===0?'disabled style="opacity:.4;pointer-events:none"':''}>← ย้อนกลับ</button><span style="font-size:12px;color:var(--g)">ขั้นตอน ${S.step+1}/${STEPS.length}</span><button class="btn btn-p" onclick="next()">${S.step===STEPS.length-1?'✅ เสร็จสิ้น':'ถัดไป →'}</button></div>`;
}

// ===== SUSPECT TABS =====
function rSuspectTabs() {
  return `<div class="suspect-tabs">${S.suspects.map((s,i) => `<button class="suspect-tab ${i===S.activeSuspect?'active':''}" onclick="S.activeSuspect=${i};R()">👤 ผู้ต้องหาที่ ${i+1}${s.firstName?' — '+s.firstName:''}</button>`).join('')}<button class="suspect-tab add" onclick="addSuspect()">➕ เพิ่มผู้ต้องหา</button></div>`;
}
