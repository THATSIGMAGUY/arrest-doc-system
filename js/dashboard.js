// ========== DASHBOARD ==========
function rDashboard() {
  const cases = getFilteredCases();
  const total = S.cases.length;
  const drafts = S.cases.filter(c => c.status === 'draft').length;
  const completed = S.cases.filter(c => c.status === 'completed').length;
  const thisMonth = S.cases.filter(c => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return `
    <div style="margin:16px">
      <div class="dash-header">
        <div>
          <div class="st" style="font-size:20px">📊 Dashboard</div>
          <div class="ss">จัดการรายการคดี — ${S.currentUser?.displayName || S.currentUser?.username || ''}</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-p btn-l" onclick="newCase()">➕ สร้างคดีใหม่</button>
          <button class="btn btn-o btn-s" onclick="doLogout()">🚪 ออกจากระบบ</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="border-color:var(--pri)"><div class="num" style="color:var(--pri)">${total}</div><div class="lbl">คดีทั้งหมด</div></div>
        <div class="stat-card" style="border-color:var(--wrn)"><div class="num" style="color:var(--wrn)">${drafts}</div><div class="lbl">แบบร่าง</div></div>
        <div class="stat-card" style="border-color:var(--acc)"><div class="num" style="color:var(--acc)">${completed}</div><div class="lbl">เสร็จสมบูรณ์</div></div>
        <div class="stat-card" style="border-color:#8b5cf6"><div class="num" style="color:#8b5cf6">${thisMonth}</div><div class="lbl">เดือนนี้</div></div>
      </div>

      <div class="ct">
        <div class="ci">
          <div class="dash-toolbar">
            <input type="text" placeholder="🔍 ค้นหา ชื่อผู้ต้องหา / ข้อกล่าวหา / สถานที่..." value="${esc(S.dashSearch)}" oninput="S.dashSearch=this.value;R()" style="flex:1;min-width:200px">
            <select onchange="S.dashFilter=this.value;R()">
              <option value="all" ${S.dashFilter==='all'?'selected':''}>ทั้งหมด</option>
              <option value="draft" ${S.dashFilter==='draft'?'selected':''}>แบบร่าง</option>
              <option value="completed" ${S.dashFilter==='completed'?'selected':''}>เสร็จสมบูรณ์</option>
            </select>
            ${GAS_URL ? `<button class="btn btn-o btn-s" onclick="loadCases()" ${S.loading?'disabled':''}>${S.loading?'⏳':'🔄'} รีเฟรช</button>` : ''}
          </div>

          ${cases.length === 0 ? `
            <div class="empty-state">
              <div class="icon">📭</div>
              <div style="font-size:16px;font-weight:700;margin-bottom:6px">${S.cases.length===0 ? 'ยังไม่มีรายการคดี' : 'ไม่พบรายการที่ค้นหา'}</div>
              <div style="font-size:13px">กด "สร้างคดีใหม่" เพื่อเริ่มจัดทำเอกสาร</div>
            </div>
          ` : `
            <table class="case-table">
              <thead><tr>
                <th style="width:40px">#</th>
                <th>ผู้ต้องหา</th>
                <th>ข้อกล่าวหา</th>
                <th>สถานที่</th>
                <th>วันที่สร้าง</th>
                <th>สถานะ</th>
                <th style="width:160px">จัดการ</th>
              </tr></thead>
              <tbody>
                ${cases.map((c, i) => `
                  <tr>
                    <td style="font-weight:700;color:var(--g)">${i+1}</td>
                    <td style="font-weight:600">${esc(c.suspectNames || '—')}</td>
                    <td>${esc(c.accusation || '—')}</td>
                    <td style="font-size:12px;color:var(--g)">${esc(c.location || '—')}</td>
                    <td style="font-size:12px">${c.createdAt ? formatDateTime(c.createdAt) : '—'}</td>
                    <td><span class="status ${c.status||'draft'}">${c.status==='completed'?'✅ เสร็จสมบูรณ์':'📝 แบบร่าง'}</span></td>
                    <td class="actions">
                      <button class="btn btn-s btn-p" onclick="openCase('${c.caseId}')">📂 เปิด</button>
                      <button class="btn btn-s btn-d" onclick="confirmDeleteCase('${c.caseId}')">🗑</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    </div>
  `;
}

function getFilteredCases() {
  let cases = [...S.cases];
  if (S.dashFilter !== 'all') cases = cases.filter(c => c.status === S.dashFilter);
  if (S.dashSearch) {
    const q = S.dashSearch.toLowerCase();
    cases = cases.filter(c =>
      (c.suspectNames||'').toLowerCase().includes(q) ||
      (c.accusation||'').toLowerCase().includes(q) ||
      (c.location||'').toLowerCase().includes(q)
    );
  }
  // Sort by date descending
  cases.sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  return cases;
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()+543} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch(e) { return iso; }
}

function rCreditFooter() {
  return `<div class="credit-footer">⚖️ ระบบจัดทำเอกสารหลังจับกุม/ควบคุมตัว — จัดทำโดย ร.ต.อ.มาตรา จิตรธนภัทร์</div>`;
}
