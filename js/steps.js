// ========== STEP 0: SUSPECTS ==========
function rStep() {
  switch(S.step) {
    case 0: return rStep0();
    case 1: return rStep1();
    case 2: return rStep2();
    case 3: return rStep3();
    case 4: return rStep4();
    case 5: return rStep5();
    case 6: return rStep6();
    case 7: return rStep7();
  }
}

function rStep0() {
  const sus = S.suspects[S.activeSuspect];
  if (!sus) { S.activeSuspect = 0; return rStep0(); }
  return `
    <div class="st">ข้อมูลเจ้าหน้าที่ผู้จับกุม / บันทึก</div>
    <div class="ss">กรอกข้อมูลเจ้าหน้าที่ตำรวจผู้จับกุมและผู้บันทึก</div>
    <div class="fg c3" style="margin-bottom:16px">
      <div class="fgroup"><label class="fl">ยศ</label><input type="text" data-f="officer.rank" value="${esc(S.officer.rank)}" placeholder="เช่น ร.ต.อ."></div>
      <div class="fgroup"><label class="fl">ชื่อ</label><input type="text" data-f="officer.firstName" value="${esc(S.officer.firstName)}" placeholder="ชื่อ"></div>
      <div class="fgroup"><label class="fl">นามสกุล</label><input type="text" data-f="officer.lastName" value="${esc(S.officer.lastName)}" placeholder="นามสกุล"></div>
      <div class="fgroup"><label class="fl">ตำแหน่ง</label><input type="text" data-f="officer.position" value="${esc(S.officer.position)}" placeholder="เช่น รอง สว.(สอบสวน)"></div>
      <div class="fgroup"><label class="fl">สังกัด</label><input type="text" data-f="officer.unit" value="${esc(S.officer.unit)}" placeholder="เช่น สภ.บางบัวทอง"></div>
      <div class="fgroup"><label class="fl">เบอร์โทร</label><input type="tel" data-f="officer.phone" value="${esc(S.officer.phone)}" placeholder="08x-xxx-xxxx"></div>
    </div>

    <div class="st" style="margin-top:16px">ข้อมูลผู้ถูกจับกุม / ควบคุมตัว</div>
    <div class="ss">เพิ่มผู้ต้องหาได้หลายราย — ม.22 และ ม.23 จะสร้างเอกสาร 1 ชุดต่อ 1 ราย</div>
    ${rSuspectTabs()}

    ${S.suspects.length > 1 ? `<div style="text-align:right;margin-bottom:8px"><button class="btn btn-s btn-d" onclick="removeSuspect(${S.activeSuspect})">🗑 ลบผู้ต้องหาที่ ${S.activeSuspect+1}</button></div>` : ''}

    <div class="fg c2">
      <div class="fgroup">
        <label class="fl">คำนำหน้า</label>
        <select data-f="suspects.${S.activeSuspect}.title" style="padding:9px 12px">
          ${['นาย','นาง','นางสาว','ด.ช.','ด.ญ.','อื่นๆ'].map(t => `<option ${sus.title===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div></div>
      <div class="fgroup"><label class="fl">ชื่อ <span class="req">*</span></label><input type="text" data-f="suspects.${S.activeSuspect}.firstName" value="${esc(sus.firstName)}" placeholder="ชื่อ"></div>
      <div class="fgroup"><label class="fl">นามสกุล <span class="req">*</span></label><input type="text" data-f="suspects.${S.activeSuspect}.lastName" value="${esc(sus.lastName)}" placeholder="นามสกุล"></div>
      <div class="fgroup"><label class="fl">อายุ</label><input type="number" data-f="suspects.${S.activeSuspect}.age" value="${sus.age}" placeholder="ปี"></div>
      <div class="fgroup"><label class="fl">วันเกิด</label><input type="date" data-f="suspects.${S.activeSuspect}.dob" value="${sus.dob}"></div>
      <div class="fgroup"><label class="fl">เลขบัตรประชาชน</label><input type="text" data-f="suspects.${S.activeSuspect}.idCard" value="${esc(sus.idCard)}" placeholder="x-xxxx-xxxxx-xx-x"></div>
      <div class="fgroup"><label class="fl">หนังสือเดินทาง</label><input type="text" data-f="suspects.${S.activeSuspect}.passport" value="${esc(sus.passport)}" placeholder="(ถ้ามี)"></div>
      <div class="fgroup"><label class="fl">โทรศัพท์</label><input type="tel" data-f="suspects.${S.activeSuspect}.phone" value="${esc(sus.phone)}"></div>
      <div class="fgroup"><label class="fl">ที่อยู่ตามบัตร ปชช.</label><input type="text" data-f="suspects.${S.activeSuspect}.addressId" value="${esc(sus.addressId)}" placeholder="เลขที่..."></div>
      <div class="fgroup full"><label class="fl">ที่อยู่ (ตำบล/อำเภอ/จังหวัด)</label>
        <div class="fg c3" style="margin-top:4px">
          <input type="text" data-f="suspects.${S.activeSuspect}.subDistrict" value="${esc(sus.subDistrict)}" placeholder="แขวง/ตำบล">
          <input type="text" data-f="suspects.${S.activeSuspect}.district" value="${esc(sus.district)}" placeholder="เขต/อำเภอ">
          <input type="text" data-f="suspects.${S.activeSuspect}.province" value="${esc(sus.province)}" placeholder="จังหวัด">
        </div>
      </div>
      <div class="fgroup full"><label class="fl">ตำหนิรูปพรรณ (ม.23)</label><textarea data-f="suspects.${S.activeSuspect}.appearance" rows="2" placeholder="สามารถเห็นได้ด้วยตาเปล่า เช่น รอยสัก, แผลเป็น">${esc(sus.appearance)}</textarea></div>
    </div>
  `;
}

// ===== STEP 1: INCIDENT =====
function rStep1() {
  const inc = S.incident;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0,5);
  return `
    <div class="st">ข้อมูลเหตุการณ์</div>
    <div class="ss">วัน เวลา สถานที่จับกุม — ใช้ร่วมในทุกเอกสาร</div>
    <div class="fg c3">
      <div class="fgroup"><label class="fl">วัน/เดือน/ปี ที่บันทึก</label><input type="date" data-f="incident.recordDate" value="${inc.recordDate||today}"></div>
      <div class="fgroup"><label class="fl">เวลาบันทึก</label><input type="time" data-f="incident.recordTime" value="${inc.recordTime||now}"></div>
      <div class="fgroup"><label class="fl">สถานที่ทำการบันทึก</label><input type="text" data-f="incident.recordPlace" value="${esc(inc.recordPlace)}" placeholder="เช่น ที่ทำการ สภ.บางบัวทอง"></div>
    </div>
    <div class="fg c2" style="margin-top:10px">
      <div class="fgroup"><label class="fl">วัน/เดือน/ปี ที่จับกุม <span class="req">*</span></label><input type="date" data-f="incident.arrestDate" value="${inc.arrestDate||today}"></div>
      <div class="fgroup"><label class="fl">เวลาจับกุม <span class="req">*</span></label><input type="time" data-f="incident.arrestTime" value="${inc.arrestTime||now}"></div>
    </div>

    <div class="st" style="margin-top:16px">สถานที่ที่จับกุม</div>
    <div class="fg c2" style="margin-top:6px">
      <div class="fgroup full"><label class="fl">สถานที่จับกุม <span class="req">*</span></label><input type="text" data-f="incident.location" value="${esc(inc.location)}" placeholder="บ้านเลขที่ / สถานที่"></div>
      <div class="fgroup"><label class="fl">ถนน</label><input type="text" data-f="incident.road" value="${esc(inc.road)}" placeholder="ถนน"></div>
      <div class="fgroup"><label class="fl">แขวง/ตำบล</label><input type="text" data-f="incident.subDistrict" value="${esc(inc.subDistrict)}"></div>
      <div class="fgroup"><label class="fl">เขต/อำเภอ</label><input type="text" data-f="incident.district" value="${esc(inc.district)}"></div>
      <div class="fgroup"><label class="fl">จังหวัด</label><input type="text" data-f="incident.province" value="${esc(inc.province)}"></div>
    </div>

    <div class="st" style="margin-top:16px">เจ้าหน้าที่ชุดจับกุม</div>
    <div class="ss">แบ่ง 3 ส่วน — เพิ่มรายชื่อได้หลายนายในแต่ละส่วน</div>

    ${rPresetBar()}

    <!-- 1. ภายใต้การอำนวยการของ -->
    <div class="card" style="border-left:4px solid var(--pri)">
      <div class="card-h">
        <strong style="color:var(--pri);font-size:14px">① ภายใต้การอำนวยการของ</strong>
        <button class="btn btn-s btn-o" onclick="S.commanders.push({rankName:''});R()">➕ เพิ่ม</button>
      </div>
      ${S.commanders.map((c,i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;color:var(--g);min-width:20px">${i+1}.</span>
          <input type="text" data-f="commanders.${i}.rankName" value="${esc(c.rankName)}" placeholder="ยศ ชื่อ นามสกุล ตำแหน่ง" style="flex:1">
          ${S.commanders.length>1?`<button class="btn btn-s btn-d" onclick="S.commanders.splice(${i},1);R()">✕</button>`:''}
        </div>
      `).join('')}
    </div>

    <!-- 2. นำโดย -->
    <div class="card" style="border-left:4px solid var(--acc)">
      <div class="card-h">
        <strong style="color:var(--acc);font-size:14px">② นำโดย</strong>
        <button class="btn btn-s btn-o" onclick="S.leaders.push({rankName:''});R()">➕ เพิ่ม</button>
      </div>
      ${S.leaders.map((l,i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;color:var(--g);min-width:20px">${i+1}.</span>
          <input type="text" data-f="leaders.${i}.rankName" value="${esc(l.rankName)}" placeholder="ยศ ชื่อ นามสกุล" style="flex:1">
          ${S.leaders.length>1?`<button class="btn btn-s btn-d" onclick="S.leaders.splice(${i},1);R()">✕</button>`:''}
        </div>
      `).join('')}
    </div>

    <!-- 3. หน่วยงานร่วมจับกุม -->
    <div class="card" style="border-left:4px solid var(--wrn)">
      <div class="card-h">
        <strong style="color:#92400e;font-size:14px">③ หน่วยงานร่วมจับกุม</strong>
        <button class="btn btn-s btn-o" onclick="S.jointUnits.push({unitName:'',officers:[{rankName:''}]});R()">➕ เพิ่มหน่วยงาน</button>
      </div>
      ${S.jointUnits.map((u,ui) => `
        <div style="border:1.5px solid var(--gb);border-radius:10px;padding:12px;margin-bottom:10px;background:var(--gl)">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
            <span style="font-size:14px">🏢</span>
            <input type="text" data-f="jointUnits.${ui}.unitName" value="${esc(u.unitName)}" placeholder="ชื่อหน่วยงาน เช่น ชุด สส.สภ.เมืองนนท์, กก.สส.บช.ภ.1" style="flex:1;font-weight:600">
            ${S.jointUnits.length>1?`<button class="btn btn-s btn-d" onclick="S.jointUnits.splice(${ui},1);R()">🗑 ลบหน่วย</button>`:''}
          </div>
          <div style="padding-left:24px">
            <div style="font-size:11px;color:var(--g);font-weight:600;margin-bottom:4px">รายชื่อเจ้าหน้าที่ในหน่วยงาน:</div>
            ${u.officers.map((of,oi) => `
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
                <span style="font-size:11px;color:var(--g);min-width:18px">${oi+1}.</span>
                <input type="text" data-f="jointUnits.${ui}.officers.${oi}.rankName" value="${esc(of.rankName)}" placeholder="ยศ ชื่อ นามสกุล" style="flex:1;font-size:13px;padding:7px 10px">
                ${u.officers.length>1?`<button class="btn btn-s btn-d" onclick="S.jointUnits[${ui}].officers.splice(${oi},1);R()" style="padding:4px 8px">✕</button>`:''}
              </div>
            `).join('')}
            <button class="btn btn-s btn-o" onclick="S.jointUnits[${ui}].officers.push({rankName:''});R()" style="margin-top:4px;font-size:11px">➕ เพิ่มเจ้าหน้าที่</button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="st" style="margin-top:16px">สถานที่ควบคุมตัว</div>
    <div class="fg c3" style="margin-top:6px">
      <div class="fgroup"><label class="fl">สถานที่ (สน./สภ./กก.)</label><input type="text" data-f="detentionPlace" value="${esc(S.detentionPlace)}" placeholder="สภ.บางบัวทอง"></div>
      <div class="fgroup"><label class="fl">อำเภอ/เขต</label><input type="text" data-f="detentionDistrict" value="${esc(S.detentionDistrict)}"></div>
      <div class="fgroup"><label class="fl">จังหวัด</label><input type="text" data-f="detentionProvince" value="${esc(S.detentionProvince)}"></div>
    </div>
  `;
}

// ===== STEP 2: EVIDENCE =====
function rStep2() {
  return `
    <div class="st">ของกลาง</div>
    <div class="ss">รายการสิ่งของที่ตรวจยึดได้</div>
    ${S.evidence.map((e,i) => `
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:10px;margin-bottom:10px;background:#fafafa">
        <div style="display:grid;grid-template-columns:32px 1fr 100px 100px 36px;gap:8px;align-items:center">
          <span style="font-weight:600;color:var(--g);text-align:center">${i+1}.</span>
          <input type="text" data-f="evidence.${i}.name" value="${esc(e.name)}" placeholder="รายละเอียดของกลาง">
          <input type="text" data-f="evidence.${i}.qty" value="${esc(e.qty)}" placeholder="จำนวน">
          <input type="text" data-f="evidence.${i}.unit" value="${esc(e.unit)}" placeholder="หน่วย">
          <button class="btn btn-s btn-d" onclick="removeEvidence(${i})" ${S.evidence.length<=1?'disabled style="opacity:.3"':''}>✕</button>
        </div>
        <div style="margin-top:8px;display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:center">
          <span style="font-size:12px;color:var(--g);text-align:center">📍</span>
          <input type="text" data-f="evidence.${i}.location" value="${esc(e.location||'')}" placeholder="ตำแหน่งที่พบ เช่น กระเป๋ากางเกงด้านขวา">
        </div>
      </div>
    `).join('')}
    <button class="btn btn-s btn-o" onclick="addEvidence()" style="margin-top:4px">➕ เพิ่มรายการ</button>

    <div class="fgroup" style="margin-top:10px">
      <label class="fl">รวม</label>
      <div style="font-size:14px;font-weight:600;color:var(--dk)">${S.evidence.filter(e=>e.name).length} รายการ จำนวน ${S.evidence.reduce((a,e)=>a+(parseInt(e.qty)||0),0)} ชิ้น</div>
    </div>
  `;
}

// ===== STEP 3: CHARGES & RIGHTS =====
function rStep3() {
  const inc = S.incident;
  return `
    <div class="st">ข้อกล่าวหา</div>
    <div class="ss">ส่วน "โดยกล่าวหาว่า..." และพฤติการณ์</div>

    <div class="fgroup">
      <label class="fl">โดยกล่าวหาว่า <span class="req">*</span></label>
      <textarea data-f="incident.accusation" rows="3" placeholder='เช่น "มียาเสพติดให้โทษประเภท ๑ (เมทแอมเฟตามีน) ไว้ในครอบครองเพื่อจำหน่าย"'>${esc(inc.accusation)}</textarea>
    </div>
    <div class="fgroup" style="margin-top:10px">
      <label class="fl">พฤติการณ์กล่าวคือ <span class="req">*</span></label>
      <textarea data-f="incident.narrative" rows="5" placeholder="ก่อนเกิดเหตุ เจ้าหน้าที่ตำรวจ สังกัด...ได้รับคำสั่งจากผู้บังคับบัญชาให้ทำการสืบสวนจับกุม... เจ้าหน้าที่ตำรวจได้ทำการสืบสวน ต่อมาตามวันเวลาที่เกิดเหตุ...">${esc(inc.narrative)}</textarea>
    </div>

    <div class="st" style="margin-top:20px">📜 การแจ้งสิทธิของผู้ถูกจับ</div>
    <div class="ib bl">ข้อความมาตรฐานตาม ป.วิอาญา มาตรา ๗/๑ — ระบบจะใส่ให้อัตโนมัติในทุกเอกสาร</div>
    <div class="card">
      <div style="font-size:13px;line-height:1.7;margin-bottom:8px">
        และได้แจ้งสิทธิ์ของผู้ต้องหา ตาม ป.วิอาญา มาตรา ๗/๑ ให้ผู้ต้องทราบ ณ สถานที่ตรวจค้น/จับกุม ดังนี้
      </div>
      <ol class="rights-list">
        ${RIGHTS.map(r => `<li><span>${r}</span></li>`).join('')}
      </ol>
    </div>

    <div class="st" style="margin-top:20px">การให้การของผู้ต้องหา (แต่ละราย)</div>
    <div class="ss">ม.22 + ม.23 สร้างเอกสารแยกรายบุคคล</div>
    ${rSuspectTabs()}
    ${(() => {
      const sus = S.suspects[S.activeSuspect];
      if (!sus) return '';
      const fn = sus.firstName||'ผู้ต้องหาที่ '+(S.activeSuspect+1);
      return `
        <div class="card" style="border-left:4px solid var(--pri)">
          <div style="font-weight:700;margin-bottom:8px;color:var(--dk)">👤 ${sus.title}${fn} ${sus.lastName}</div>
          <div style="font-size:13px;line-height:1.7;margin-bottom:10px;color:var(--g)">
            ขณะจับกุม ${sus.title} ${fn} ${sus.lastName} ผู้ถูกจับ ได้รับทราบข้อกล่าวหา และสิทธิ์ของผู้ถูกจับโดยเข้าใจดีตลอดแล้ว และให้การว่า...
          </div>
          <div style="display:flex;gap:12px;margin-bottom:10px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 14px;border-radius:8px;border:2px solid ${sus.statement==='confess'?'var(--acc)':'var(--gb)'};background:${sus.statement==='confess'?'var(--acc-bg)':'var(--w)'}">
              <input type="radio" name="stmt_${S.activeSuspect}" value="confess" ${sus.statement==='confess'?'checked':''} onchange="updS('suspects.${S.activeSuspect}.statement','confess');R()">
              <span style="font-weight:600;color:${sus.statement==='confess'?'var(--acc)':'var(--g)'}">✅ รับสารภาพ</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 14px;border-radius:8px;border:2px solid ${sus.statement==='deny'?'var(--dng)':'var(--gb)'};background:${sus.statement==='deny'?'var(--dng-bg)':'var(--w)'}">
              <input type="radio" name="stmt_${S.activeSuspect}" value="deny" ${sus.statement==='deny'?'checked':''} onchange="updS('suspects.${S.activeSuspect}.statement','deny');R()">
              <span style="font-weight:600;color:${sus.statement==='deny'?'var(--dng)':'var(--g)'}">❌ ปฏิเสธ</span>
            </label>
          </div>
          <div class="fgroup">
            <label class="fl">รายละเอียดคำให้การ (ถ้ามี)</label>
            <textarea data-f="suspects.${S.activeSuspect}.statementDetail" rows="2" placeholder="รายละเอียดเพิ่มเติม เช่น ปฏิเสธว่าไม่ได้เป็นเจ้าของ...">${esc(sus.statementDetail)}</textarea>
          </div>
        </div>
      `;
    })()}

    <div class="st" style="margin-top:20px">อนึ่ง ในการจับครั้งนี้...</div>
    <div class="ib yl">⚠️ ข้อความมาตรฐาน — แก้ไขได้หากจำเป็น</div>
    <div class="fgroup">
      <label class="fl">ข้อความท่อนท้าย "อนึ่ง"</label>
      <textarea data-f="anungText" rows="5" style="font-size:13px">${esc(S.anungText)}</textarea>
    </div>
  `;
}

// ===== STEP 4: PHOTOS =====
function rStep4() {
  return `
    <div class="st">อัปโหลด / ถ่ายรูปภาพ</div>
    <div class="ss">ภาพถ่ายผู้ต้องหาแต่ละราย + สถานที่ + ของกลาง</div>
    <div class="ib yl">⚠️ ม.23: ภาพถ่ายต้องเห็นเนื้อตัวร่างกายตามสภาพภายนอก โดยไม่ต้องถอดเสื้อผ้า</div>

    <div class="st" style="font-size:15px">ภาพถ่ายผู้ต้องหา (4 ด้าน)</div>
    <div class="ss">หน้าตรง / หันหลัง / หันข้างซ้าย / หันข้างขวา — เห็นเนื้อตัวเต็มตัว</div>
    ${S.suspects.map((sus,si) => `
      <div style="border:1px solid #e0e0e0;border-radius:10px;padding:12px;margin-bottom:12px;background:#fafafa">
        <div style="font-weight:700;color:var(--dk);margin-bottom:8px">👤 ${sus.title}${sus.firstName||'ผู้ต้องหา '+(si+1)} ${sus.lastName}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">
          ${[['photoFront','หน้าตรง','📷'],['photoBack','หันหลัง','🔄'],['photoLeft','หันข้างซ้าย','◀️'],['photoRight','หันข้างขวา','▶️']].map(([key,label,icon]) => `
            <div class="pbox ${sus[key]?'has':''}" style="aspect-ratio:3/4;padding:6px" onclick="document.getElementById('pf-${si}-${key}').click()">
              ${sus[key]
                ? `<img src="${sus[key]}" style="object-fit:cover;height:80%"><div style="font-size:11px;color:var(--acc);font-weight:600">✅ ${label}</div><button class="btn btn-s btn-d" style="font-size:10px;padding:2px 6px" onclick="event.stopPropagation();S.suspects[${si}].${key}=null;R()">🗑</button>`
                : `<div style="font-size:24px">${icon}</div><div style="font-weight:600;font-size:12px">${label}</div>
                   <div style="display:flex;gap:4px;margin-top:6px">
                     <button class="btn btn-s btn-p" style="font-size:10px;padding:3px 6px" onclick="event.stopPropagation();capCam('pf-${si}-${key}')">📷</button>
                     <button class="btn btn-s btn-o" style="font-size:10px;padding:3px 6px" onclick="event.stopPropagation();document.getElementById('pf-${si}-${key}').click()">📁</button>
                   </div>`
              }
              <input type="file" id="pf-${si}-${key}" accept="image/*" style="display:none" onchange="upPhoto(this,${si},'${key}')">
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div class="st" style="font-size:15px">ภาพสถานที่ & ของกลาง</div>
    <div class="pgrid">
      <div class="pbox ${S.scenePhoto?'has':''}" onclick="document.getElementById('pf-scene').click()">
        ${S.scenePhoto
          ? `<img src="${S.scenePhoto}"><div style="font-size:12px;color:var(--acc)">✅ สถานที่จับกุม</div><button class="btn btn-s btn-d" onclick="event.stopPropagation();S.scenePhoto=null;R()">🗑</button>`
          : `<div style="font-size:36px">🏠</div><div style="font-weight:600;font-size:13px">สถานที่จับกุม</div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-s btn-p" onclick="event.stopPropagation();capCam('pf-scene')">📷</button><button class="btn btn-s btn-o" onclick="event.stopPropagation();document.getElementById('pf-scene').click()">📁</button></div>`
        }
        <input type="file" id="pf-scene" accept="image/*" style="display:none" onchange="upPhoto(this,-1,'scene')">
      </div>
      <div class="pbox ${S.evidencePhoto?'has':''}" onclick="document.getElementById('pf-ev').click()">
        ${S.evidencePhoto
          ? `<img src="${S.evidencePhoto}"><div style="font-size:12px;color:var(--acc)">✅ ของกลาง</div><button class="btn btn-s btn-d" onclick="event.stopPropagation();S.evidencePhoto=null;R()">🗑</button>`
          : `<div style="font-size:36px">📦</div><div style="font-weight:600;font-size:13px">ของกลาง</div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-s btn-p" onclick="event.stopPropagation();capCam('pf-ev')">📷</button><button class="btn btn-s btn-o" onclick="event.stopPropagation();document.getElementById('pf-ev').click()">📁</button></div>`
        }
        <input type="file" id="pf-ev" accept="image/*" style="display:none" onchange="upPhoto(this,-1,'evidence')">
      </div>
    </div>
  `;
}

// ===== STEP 5: SEC 23 =====
function rStep5() {
  const sus = S.suspects[S.activeSuspect];
  if (!sus) { S.activeSuspect=0; return rStep5(); }
  const fn = sus.firstName||'ผู้ต้องหาที่ '+(S.activeSuspect+1);
  const ai = S.activeSuspect;
  return `
    <div class="st">ข้อมูลเพิ่มเติม แบบ ม.23 (ปท.1)</div>
    <div class="ss">ข้อมูลแยกรายบุคคล — เอกสาร 1 ชุดต่อ 1 ราย</div>
    ${rSuspectTabs()}

    <div class="ib bl">📝 ข้อมูลสำหรับ <strong>${sus.title}${fn} ${sus.lastName}</strong></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="fl" style="font-size:14px;font-weight:700;color:var(--dk);margin-bottom:8px">③ คำสั่งควบคุมตัว</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${[['caught_in_act','ความผิดซึ่งหน้า'],['warrant','ตามหมายจับ'],['order','ตามคำสั่ง'],['other','กรณีอื่นๆ']].map(([v,l]) => `
            <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;cursor:pointer;${sus.s23_orderType===v?'background:var(--pri-bg)':''}">
              <input type="radio" name="ot_${ai}" value="${v}" ${sus.s23_orderType===v?'checked':''} onchange="updS('suspects.${ai}.s23_orderType','${v}');R()" style="accent-color:var(--pri)">
              <span style="font-size:13px">${l}</span>
            </label>
            ${v==='warrant'&&sus.s23_orderType==='warrant'?`<div style="padding-left:28px;display:grid;grid-template-columns:1fr 1fr;gap:6px"><input type="text" data-f="suspects.${ai}.s23_warrantNo" value="${esc(sus.s23_warrantNo)}" placeholder="เลขที่หมายจับ" style="font-size:13px"><input type="text" data-f="suspects.${ai}.s23_courtName" value="${esc(sus.s23_courtName)}" placeholder="ศาลผู้ออกหมาย" style="font-size:13px"></div>`:''}
            ${v==='order'&&sus.s23_orderType==='order'?`<div style="padding-left:28px"><input type="text" data-f="suspects.${ai}.s23_orderDetail" value="${esc(sus.s23_orderDetail)}" placeholder="รายละเอียดคำสั่ง" style="width:100%;font-size:13px"></div>`:''}
            ${v==='other'&&sus.s23_orderType==='other'?`<div style="padding-left:28px"><input type="text" data-f="suspects.${ai}.s23_otherDetail" value="${esc(sus.s23_otherDetail)}" placeholder="ระบุ" style="width:100%;font-size:13px"></div>`:''}
          `).join('')}
        </div>
      </div>
      <div>
        <div class="fl" style="font-size:14px;font-weight:700;color:var(--dk);margin-bottom:8px">④ เจ้าหน้าที่ผู้ออกคำสั่ง</div>
        <div class="fgroup" style="margin-bottom:8px"><label class="fl">ชื่อ-นามสกุล</label><input type="text" data-f="suspects.${ai}.s23_orderOfficerName" value="${esc(sus.s23_orderOfficerName)}"></div>
        <div class="fgroup"><label class="fl">ตำแหน่ง</label><input type="text" data-f="suspects.${ai}.s23_orderOfficerPosition" value="${esc(sus.s23_orderOfficerPosition)}"></div>
      </div>
    </div>

    <div class="st" style="margin-top:16px">⑥ สภาพร่างกายและจิตใจ</div>
    <div class="fg c2" style="margin-top:8px">
      <div class="fgroup"><label class="fl">ก่อนถูกควบคุมตัว</label><textarea data-f="suspects.${ai}.s23_conditionBefore" rows="2" placeholder="ร่างกายปกติ สภาพจิตใจปกติ ไม่มีบาดแผล">${esc(sus.s23_conditionBefore)}</textarea></div>
      <div class="fgroup"><label class="fl">ก่อนปล่อยตัว/ส่งมอบ</label><textarea data-f="suspects.${ai}.s23_conditionAfter" rows="2" placeholder="(กรอกเมื่อปล่อยตัว)">${esc(sus.s23_conditionAfter)}</textarea></div>
    </div>

    <div class="st" style="margin-top:16px">⑤ การปล่อยตัว (กรอกภายหลังได้)</div>
    <div class="fg c3" style="margin-top:8px">
      <div class="fgroup"><label class="fl">วันที่</label><input type="date" data-f="suspects.${ai}.s23_releaseDate" value="${sus.s23_releaseDate}"></div>
      <div class="fgroup"><label class="fl">เวลา</label><input type="time" data-f="suspects.${ai}.s23_releaseTime" value="${sus.s23_releaseTime}"></div>
      <div class="fgroup"><label class="fl">สถานที่</label><input type="text" data-f="suspects.${ai}.s23_releasePlace" value="${esc(sus.s23_releasePlace)}"></div>
      <div class="fgroup"><label class="fl">ผู้รับตัว</label><input type="text" data-f="suspects.${ai}.s23_receiverName" value="${esc(sus.s23_receiverName)}"></div>
      <div class="fgroup"><label class="fl">เบอร์ติดต่อ</label><input type="tel" data-f="suspects.${ai}.s23_receiverPhone" value="${esc(sus.s23_receiverPhone)}"></div>
    </div>

    <div class="fg" style="margin-top:12px">
      <div class="fgroup"><label class="fl">⑧ เหตุสุดวิสัยฯ (ถ้ามี)</label><textarea data-f="suspects.${ai}.s23_forceReason" rows="2">${esc(sus.s23_forceReason)}</textarea></div>
      <div class="fgroup"><label class="fl">⑨ บันทึกเพิ่มเติม</label><textarea data-f="suspects.${ai}.s23_additionalNotes" rows="2">${esc(sus.s23_additionalNotes)}</textarea></div>
    </div>
  `;
}

// ===== STEP 6: SIGNATURE =====
function buildSigList() {
  const o = S.officer;
  const oName = `${o.rank} ${o.firstName} ${o.lastName}`;
  const list = [];
  // 1. Officer (ผู้จับกุม/บันทึก) — ไม่รวมผู้อำนวยการ
  list.push({ key:'officer', label:'ผู้จับกุม/บันทึก/อ่าน', name:oName, group:'เจ้าหน้าที่ผู้จับกุม', icon:'👮' });
  // 2. Leaders (นำโดย)
  S.leaders.forEach((l,i) => {
    if(l.rankName) list.push({ key:`leader_${i}`, label:'ผู้นำจับกุม', name:l.rankName, group:'นำโดย', icon:'🎖️' });
  });
  // 3. Joint team
  S.jointUnits.forEach((u,ui) => {
    u.officers.forEach((of,oi) => {
      if(of.rankName) list.push({ key:`joint_${ui}_${oi}`, label:'ผู้ร่วมจับกุม', name:of.rankName, group:u.unitName||'หน่วยร่วม', icon:'🤝' });
    });
  });
  // 4. Suspects
  S.suspects.forEach((sus,i) => {
    const fn = `${sus.title}${sus.firstName||'ผู้ต้องหา '+(i+1)} ${sus.lastName}`;
    list.push({ key:`suspect_${i}`, label:'ผู้ต้องหา', name:fn, group:'ผู้ต้องหา', icon:'👤' });
  });
  return list;
}

function rStep6() {
  const sigList = buildSigList();
  const signed = sigList.filter(s => S.signatures[s.key]).length;
  const total = sigList.length;
  const isElec = S.sigMode === 'electronic';

  return `
    <div class="st">ลงลายมือชื่อ</div>
    <div class="ss">เจ้าหน้าที่ทุกนาย + ผู้ต้องหาทุกราย (ไม่รวมผู้อำนวยการ) — ทั้งหมด ${total} ราย</div>

    <!-- Mode toggle -->
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <div onclick="S.sigMode='electronic';R()" style="flex:1;padding:14px;border-radius:12px;border:2.5px solid ${isElec?'var(--pri)':'var(--gb)'};background:${isElec?'var(--pri-bg)':'var(--w)'};cursor:pointer;text-align:center;transition:.15s">
        <div style="font-size:28px;margin-bottom:4px">✍️</div>
        <div style="font-weight:700;font-size:14px;color:${isElec?'var(--pri)':'var(--dk)'}">เซ็นอิเล็กทรอนิกส์</div>
        <div style="font-size:11px;color:var(--g)">เซ็นชื่อบนหน้าจอ ลงใน PDF โดยตรง</div>
      </div>
      <div onclick="S.sigMode='blank';R()" style="flex:1;padding:14px;border-radius:12px;border:2.5px solid ${!isElec?'var(--wrn)':'var(--gb)'};background:${!isElec?'var(--wrn-bg)':'var(--w)'};cursor:pointer;text-align:center;transition:.15s">
        <div style="font-size:28px;margin-bottom:4px">📄</div>
        <div style="font-weight:700;font-size:14px;color:${!isElec?'#92400e':'var(--dk)'}">เว้นช่องลายเซ็น</div>
        <div style="font-size:11px;color:var(--g)">สร้างช่องว่างใน PDF สำหรับเซ็นบนกระดาษ</div>
      </div>
    </div>

    ${isElec ? rSigElectronic(sigList, signed, total) : rSigBlank(sigList)}
  `;
}

function rSigElectronic(sigList, signed, total) {
  return `
    <!-- Progress -->
    <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">
      <div style="flex:1;height:8px;background:var(--gl);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${total?Math.round(signed/total*100):0}%;background:var(--acc);border-radius:4px;transition:.3s"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${signed===total?'var(--acc)':'var(--wrn)'}">${signed}/${total} (${total?Math.round(signed/total*100):0}%)</span>
    </div>

    <!-- Signature list -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      ${sigList.map(s => `
        <div onclick="S.sigActiveKey='${s.key}';R()" style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;border:2px solid ${S.sigActiveKey===s.key?'var(--pri)':S.signatures[s.key]?'var(--acc)':'var(--gb)'};background:${S.sigActiveKey===s.key?'var(--pri-bg)':S.signatures[s.key]?'var(--acc-bg)':'var(--w)'};cursor:pointer;transition:.15s">
          <span style="font-size:18px">${s.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:${S.sigActiveKey===s.key?'var(--pri)':S.signatures[s.key]?'var(--acc)':'var(--dk)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
            <div style="font-size:10px;color:var(--g)">${s.label} — ${s.group}</div>
          </div>
          <span style="font-size:16px">${S.signatures[s.key]?'✅':'⬜'}</span>
        </div>
      `).join('')}
    </div>

    <!-- Active signature pad -->
    ${(() => {
      const active = sigList.find(s => s.key === S.sigActiveKey);
      if(!active) return '<div class="ib yl">เลือกรายชื่อด้านบนเพื่อลงลายเซ็น</div>';
      return `
        <div class="card" style="border-top:4px solid var(--pri)">
          <div style="text-align:center;margin-bottom:8px">
            <span style="font-size:22px">${active.icon}</span>
            <div style="font-weight:700;font-size:15px;color:var(--dk)">${active.name}</div>
            <div style="font-size:12px;color:var(--g)">${active.label} — ${active.group}</div>
          </div>
          <div class="sig-area" id="sig-c">
            <canvas id="sig-cv" height="120" style="width:100%;display:block"></canvas>
            ${!S.signatures[S.sigActiveKey]?'<div style="color:var(--g);font-size:14px;pointer-events:none;position:relative;z-index:1">✍️ เซ็นชื่อที่นี่</div>':''}
          </div>
          <div style="text-align:center;margin-top:4px;font-size:12px;color:var(--g)">(${active.name})</div>
          <div style="text-align:center;margin-top:8px">
            <button class="btn btn-o btn-s" onclick="clearSig()">🗑 ล้างลายเซ็น</button>
          </div>
        </div>
      `;
    })()}

    ${signed===total&&total>0?'<div class="ib gn" style="margin-top:12px">✅ ลงลายมือชื่อครบทุกรายแล้ว — กดถัดไปเพื่อ Export เอกสาร</div>':''}
  `;
}

function rSigBlank(sigList) {
  // Group by type
  const officers = sigList.filter(s => !s.key.startsWith('suspect'));
  const suspects = sigList.filter(s => s.key.startsWith('suspect'));

  return `
    <div class="ib yl">📄 ระบบจะสร้าง <strong>ช่องลายเซ็นว่าง</strong> ใน PDF ตามจำนวนคนด้านล่าง — พิมพ์แล้วลงนามบนกระดาษ</div>

    <!-- Officers -->
    <div class="card" style="border-left:4px solid var(--pri)">
      <div style="font-weight:700;font-size:14px;color:var(--pri);margin-bottom:10px">👮 เจ้าหน้าที่ผู้จับกุม (${officers.length} ช่อง)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${officers.map(s => `
          <div style="border:1.5px dashed var(--gb);border-radius:10px;padding:12px;text-align:center">
            <div style="height:50px;border-bottom:2px solid var(--dk);margin-bottom:6px;display:flex;align-items:flex-end;justify-content:center;color:var(--g);font-size:11px;font-style:italic">ลงชื่อ..................................</div>
            <div style="font-size:12px;font-weight:600;color:var(--dk);margin-top:4px">(${s.name})</div>
            <div style="font-size:10px;color:var(--g)">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Suspects -->
    <div class="card" style="border-left:4px solid var(--wrn)">
      <div style="font-weight:700;font-size:14px;color:#92400e;margin-bottom:10px">👤 ผู้ต้องหา (${suspects.length} ช่อง)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${suspects.map(s => `
          <div style="border:1.5px dashed var(--gb);border-radius:10px;padding:12px;text-align:center">
            <div style="height:50px;border-bottom:2px solid var(--dk);margin-bottom:6px;display:flex;align-items:flex-end;justify-content:center;color:var(--g);font-size:11px;font-style:italic">ลงชื่อ..................................</div>
            <div style="font-size:12px;font-weight:600;color:var(--dk);margin-top:4px">(${s.name})</div>
            <div style="font-size:10px;color:var(--g)">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="ib gn" style="margin-top:8px">✅ ช่องลายเซ็นทั้งหมด ${sigList.length} ช่อง จะถูกสร้างใน PDF — กดถัดไปเพื่อ Export</div>
  `;
}

// ===== STEP 7: EXPORT =====
function rStep7() {
  const o = S.officer;
  const oName = `${o.rank} ${o.firstName} ${o.lastName}`;
  const inc = S.incident;
  const n = S.suspects.length;

  return `
    <div class="st">ตรวจสอบ & Export เอกสาร</div>
    <div class="ss">ผู้ต้องหา ${n} ราย → บันทึกจับกุม 1 ฉบับ + ม.22 ${n} ฉบับ + ม.23 ${n} ฉบับ = <strong>รวม ${1+n*2} ฉบับ</strong></div>

    <div class="ib gn">✅ ระบบจะสร้าง ม.22 และ ม.23 แยก <strong>1 ชุดต่อ 1 ผู้ต้องหา</strong> โดยอัตโนมัติ</div>

    <!-- Arrest Record -->
    <div class="card" style="border-left:4px solid var(--pri)">
      <div class="card-h"><strong style="color:var(--pri)">📋 บันทึกจับกุม (1 ฉบับรวม)</strong><span class="badge badge-g">พร้อม</span></div>
      <div style="font-size:12px;color:var(--g);line-height:1.7">
        ผู้ต้องหา ${n} ราย: ${S.suspects.map(s=>`${s.title}${s.firstName} ${s.lastName}`).join(', ')}<br>
        ชุดจับกุม: อำนวยการ ${S.commanders.filter(c=>c.rankName).length} นาย | นำโดย ${S.leaders.filter(l=>l.rankName).length} นาย | หน่วยร่วม ${S.jointUnits.filter(u=>u.unitName).length} หน่วยงาน (${S.jointUnits.reduce((a,u)=>a+u.officers.filter(o=>o.rankName).length,0)} นาย)<br>
        ข้อกล่าวหา: ${inc.accusation||'—'}<br>
        สิทธิ์ผู้ต้องหา: ✅ แจ้งแล้ว 6 ข้อ | ให้การ: ${S.suspects.map((s,i)=>`ผู้ต้องหาที่${i+1} ${s.statement==='confess'?'✅รับสารภาพ':'❌ปฏิเสธ'}`).join(', ')}<br>
        อนึ่ง: ✅ มีข้อความ
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-s btn-o" onclick="showPv('arrest')">👁 Preview</button>
        <button class="btn btn-s btn-p" onclick="exportPDF('arrest')">📄 PDF</button>
        <button class="btn btn-s btn-a" onclick="exportDoc('arrest')">📝 Word</button>
      </div>
    </div>

    <!-- Per-suspect docs -->
    <div class="st" style="margin-top:16px;font-size:15px">เอกสารรายบุคคล (ม.22 + ม.23)</div>
    ${S.suspects.map((sus,i) => {
      const fn = `${sus.title}${sus.firstName||'ผู้ต้องหา '+(i+1)} ${sus.lastName}`;
      return `
        <div class="card" style="border-left:4px solid ${i%2===0?'var(--acc)':'var(--wrn)'}">
          <div class="card-h"><strong>👤 ผู้ต้องหาที่ ${i+1}: ${fn}</strong></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="padding:10px;border:1px solid var(--gb);border-radius:8px">
              <div style="font-weight:700;font-size:13px;color:var(--acc);margin-bottom:4px">📑 แบบ ม.22</div>
              <div style="font-size:11px;color:var(--g);line-height:1.6">ภาพถ่าย: ${sus.photo?'✅':'❌'} | ควบคุม ณ: ${S.detentionPlace||'—'}</div>
              <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                <button class="btn btn-s btn-o" onclick="showPv('sec22',${i})">👁</button>
                <button class="btn btn-s btn-a" onclick="exportPDF('sec22',${i})">📄 PDF</button>
                <button class="btn btn-s btn-p" onclick="exportDoc('sec22',${i})">📝 Word</button>
              </div>
            </div>
            <div style="padding:10px;border:1px solid var(--gb);border-radius:8px">
              <div style="font-weight:700;font-size:13px;color:var(--wrn);margin-bottom:4px">📝 แบบ ม.23 (ปท.1)</div>
              <div style="font-size:11px;color:var(--g);line-height:1.6">คำสั่ง: ${getOT(sus)} | สภาพ: ${sus.s23_conditionBefore?'✅':'❌'}</div>
              <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                <button class="btn btn-s btn-o" onclick="showPv('sec23',${i})">👁</button>
                <button class="btn btn-s btn-p" onclick="exportPDF('sec23',${i})" style="background:var(--wrn)">📄 PDF</button>
                <button class="btn btn-s btn-a" onclick="exportDoc('sec23',${i})">📝 Word</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('')}

    <button class="btn btn-a btn-l" style="margin-bottom:10px;width:100%" onclick="S.step>=7;saveCurrentCase()">💾 บันทึกคดีนี้ลง${GAS_URL?'ฐานข้อมูล':'เครื่อง'}</button>

    <div class="export-sec">
      <div style="font-size:36px;margin-bottom:6px">📦</div>
      <div style="font-weight:700;font-size:16px;color:var(--acc)">ดาวน์โหลดเอกสารทั้งชุด</div>
      <div style="font-size:13px;color:var(--g);margin-bottom:14px">
        บันทึกจับกุม 1 ฉบับ + ม.22 ${n} ฉบับ + ม.23 ${n} ฉบับ = <strong>${1+n*2} ไฟล์</strong>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-p btn-l" onclick="exportAll()">📄 Export PDF ทั้งหมด (${1+n*2} ฉบับ)</button>
        <button class="btn btn-a btn-l" onclick="exportAllDoc()">📝 Export Word ทั้งหมด (${1+n*2} ฉบับ)</button>
      </div>
    </div>
  `;
}
