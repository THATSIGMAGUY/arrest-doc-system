// ===== MODAL PREVIEW =====
function rModal() {
  const t = S.showModal;
  const si = S.modalSuspectIdx;
  let title='', body='';
  const o = S.officer, inc = S.incident;
  const oName = `${o.rank} ${o.firstName} ${o.lastName}`;
  const ad = inc.arrestDate?thDate(inc.arrestDate):'..........';
  const at = inc.arrestTime||'..........';
  const loc = `${inc.location||'...'} ถ.${inc.road||'...'} แขวง/ต.${inc.subDistrict||'...'} เขต/อ.${inc.district||'...'} จ.${inc.province||'...'}`;
  const evList = S.evidence.filter(e=>e.name).map((e,i)=>`<div class="r"><span class="rl">${i+1}. ${e.name}</span> จำนวน ${e.qty||'...'} ${e.unit}</div>`).join('');

  if (t==='arrest') {
    title='บันทึกการจับกุม';
    body=`<div class="preview">
      <h3>บันทึกการจับกุม</h3>
      <div style="text-align:center;font-size:12px;color:var(--g)">สถานที่ทำการบันทึก: ${inc.recordPlace||o.unit}</div>
      <div class="r"><span class="rl">วันที่บันทึก:</span>${inc.recordDate?thDate(inc.recordDate):'...'} เวลา ${inc.recordTime||'...'} น.</div>
      <div class="r"><span class="rl">วันที่จับกุม:</span>${ad} เวลา ${at} น.</div>
      <div class="r"><span class="rl">สถานที่จับกุม:</span>${loc}</div>
      <div><strong>ภายใต้การอำนวยการของ:</strong></div>
      ${S.commanders.filter(c=>c.rankName).map((c,i)=>`<div class="r"><span class="rl">&nbsp;&nbsp;${i+1}.</span>${c.rankName}</div>`).join('')||'<div class="r" style="color:var(--g)">&nbsp;&nbsp;— ไม่ระบุ —</div>'}
      <div><strong>นำโดย:</strong></div>
      ${S.leaders.filter(l=>l.rankName).map((l,i)=>`<div class="r"><span class="rl">&nbsp;&nbsp;${i+1}.</span>${l.rankName}</div>`).join('')||`<div class="r"><span class="rl">&nbsp;&nbsp;1.</span>${oName}</div>`}
      ${S.jointUnits.some(u=>u.unitName||u.officers.some(o=>o.rankName))?`<div><strong>หน่วยงานร่วมจับกุม:</strong></div>${S.jointUnits.filter(u=>u.unitName||u.officers.some(o=>o.rankName)).map(u=>`<div style="margin-left:12px;margin-bottom:4px"><div style="font-weight:600;color:var(--dk)">🏢 ${u.unitName||'(ไม่ระบุหน่วย)'}</div>${u.officers.filter(o=>o.rankName).map((o,i)=>`<div class="r"><span class="rl">&nbsp;&nbsp;&nbsp;&nbsp;${i+1}.</span>${o.rankName}</div>`).join('')}</div>`).join('')}`:''}
      <hr>
      <strong>ได้ร่วมกันจับกุมตัว</strong>
      ${S.suspects.map((s,i)=>`<div class="r"><span class="rl">${i+1}. ${s.title}${s.firstName} ${s.lastName}</span>อายุ ${s.age||'...'} ปี เลข ปชช. ${s.idCard||'...'}</div>`).join('')}
      <hr>
      <strong>พร้อมด้วยของกลาง</strong>
      ${evList||'<div style="color:var(--g)">— ไม่มี —</div>'}
      <div class="r" style="margin-top:4px"><span class="rl">ตำแหน่งที่พบ:</span>${S.evidenceLocation||'...'}</div>
      <hr>
      <div><strong>โดยกล่าวหาว่า</strong> " ${inc.accusation||'...'} "</div>
      <hr>
      <div><strong>พฤติการณ์กล่าวคือ</strong></div>
      <div style="padding:6px;background:var(--gl);border-radius:6px;margin-top:4px">${inc.narrative||'...'}</div>
      <hr>
      <div><strong>การแจ้งสิทธิ์ตาม ป.วิอาญา มาตรา ๗/๑</strong></div>
      <ol class="rights-list" style="margin:6px 0">${RIGHTS.map(r=>`<li><span>${r}</span></li>`).join('')}</ol>
      <hr>
      <strong>การให้การของผู้ต้องหา</strong>
      ${S.suspects.map((s,i)=>`<div class="r"><span class="rl">${s.title}${s.firstName} ${s.lastName}:</span><strong style="color:${s.statement==='confess'?'var(--acc)':'var(--dng)'}">${s.statement==='confess'?'รับสารภาพ':'ปฏิเสธ'}</strong> ${s.statementDetail?'— '+s.statementDetail:''}</div>`).join('')}
      <hr>
      <div><strong>อนึ่ง</strong> ${S.anungText}</div>
      <hr>
      <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--g)">
        ลงชื่อ ผู้ต้องหา / เจ้าหน้าที่ผู้จับกุม / ผู้บันทึก
      </div>
    </div>`;
  } else {
    const sus = S.suspects[si];
    if (!sus) return '';
    const fn = `${sus.title}${sus.firstName} ${sus.lastName}`;

    if (t==='sec22') {
      title=`แบบ ม.22 — ${fn}`;
      body=`<div class="preview">
        <h3>แบบแจ้งข้อมูล เรื่อง การจับและควบคุมตามมาตรา ๒๒ วรรคสอง</h3>
        <hr>
        <div class="r"><span class="rl">(๑) ชื่อ/สกุล:</span>${fn}</div>
        <div class="r"><span class="rl">เลข ปชช.:</span>${sus.idCard||'...'}</div>
        <div class="r"><span class="rl">ที่อยู่:</span>${sus.addressId||'...'} ต.${sus.subDistrict||'...'} อ.${sus.district||'...'} จ.${sus.province||'...'}</div>
        <div class="r"><span class="rl">โทร:</span>${sus.phone||'...'} อายุ ${sus.age||'...'} ปี</div>
        <hr>
        <div class="r"><span class="rl">(๒) วันที่จับ:</span>${ad} เวลา ${at} น.</div>
        <div class="r"><span class="rl">สถานที่:</span>${loc}</div>
        <hr>
        <div><strong>(๓) พฤติการณ์:</strong></div>
        <div style="padding:6px;background:var(--gl);border-radius:6px">${inc.narrative||'...'}</div>
        <hr>
        <div class="r"><span class="rl">(๔) สถานที่ควบคุม:</span>${S.detentionPlace||'...'} อ.${S.detentionDistrict||'...'} จ.${S.detentionProvince||'...'}</div>
        <div class="r"><span class="rl">(๕) ภาพถ่าย:</span>${sus.photo?'✅ แนบท้าย':'❌ ยังไม่มี'}</div>
        <div class="r"><span class="rl">(๖) เจ้าหน้าที่:</span>${oName} ${o.position} ${o.unit} โทร ${o.phone}</div>
        <div class="r"><span class="rl">(๗) เหตุสุดวิสัย:</span>${sus.s23_forceReason||'—'}</div>
        ${sus.photo?`<hr><div style="text-align:center"><img src="${sus.photo}" style="max-height:120px;border-radius:6px"></div>`:''}
      </div>`;
    } else {
      title=`แบบ ม.23 (ปท.1) — ${fn}`;
      body=`<div class="preview">
        <h3 style="font-size:13px">ปท.๑</h3>
        <h3>แบบบันทึกข้อมูลผู้ถูกควบคุมตัวตามมาตรา ๒๓</h3>
        <hr>
        <div><strong>① อัตลักษณ์</strong></div>
        <div class="r"><span class="rl">ชื่อ-สกุล:</span>${fn}</div>
        <div class="r"><span class="rl">เลข ปชช.:</span>${sus.idCard||'...'}</div>
        <div class="r"><span class="rl">ที่อยู่:</span>${sus.addressId||'...'}</div>
        <div class="r"><span class="rl">ตำหนิ:</span>${sus.appearance||'—'}</div>
        <hr>
        <div><strong>② วัน/เวลา/สถานที่ควบคุม</strong></div>
        <div class="r"><span class="rl">วันที่:</span>${ad} เวลา ${at} น.</div>
        <div class="r"><span class="rl">สถานที่:</span>${loc}</div>
        <div class="r"><span class="rl">เจ้าหน้าที่:</span>${oName}</div>
        <div class="r"><span class="rl">ควบคุม ณ:</span>${S.detentionPlace||'...'}</div>
        <hr>
        <div><strong>③ คำสั่ง:</strong> ${getOT(sus)}</div>
        <div><strong>④ ผู้ออกคำสั่ง:</strong> ${sus.s23_orderOfficerName||'...'} ตำแหน่ง ${sus.s23_orderOfficerPosition||'...'}</div>
        <hr>
        <div><strong>⑤ ปล่อยตัว:</strong> ${sus.s23_releaseDate?thDate(sus.s23_releaseDate):'⏳ รอ'} ${sus.s23_releaseTime||''} ผู้รับ: ${sus.s23_receiverName||'—'}</div>
        <hr>
        <div><strong>⑥ สภาพร่างกาย-จิตใจ</strong></div>
        <div class="r"><span class="rl">ก่อนควบคุม:</span>${sus.s23_conditionBefore||'...'}</div>
        <div class="r"><span class="rl">ก่อนปล่อย:</span>${sus.s23_conditionAfter||'⏳'}</div>
        <hr>
        <div><strong>⑧ เหตุสุดวิสัย:</strong> ${sus.s23_forceReason||'—'}</div>
        <div><strong>⑨ เพิ่มเติม:</strong> ${sus.s23_additionalNotes||'—'}</div>
      </div>`;
    }
  }

  return `<div class="modal-ov" onclick="if(event.target===this){S.showModal=null;R()}"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <h3 style="font-size:15px">${title}</h3>
      <button class="btn btn-s btn-o" onclick="S.showModal=null;R()">✕ ปิด</button>
    </div>
    ${body}
    <div style="text-align:center;margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-p btn-l" onclick="exportPDF('${t}',${si})">📄 ดาวน์โหลด PDF</button>
      <button class="btn btn-a btn-l" onclick="exportDoc('${t}',${si})">📝 ดาวน์โหลด Word</button>
    </div>
  </div></div>`;
}
