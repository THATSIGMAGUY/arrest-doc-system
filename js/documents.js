// ============== HELPERS for official-format documents ==============
function _v(x, fallback) {
  // wrap value in dotted underline span
  const val = (x===null||x===undefined||x==='') ? '' : x;
  return `<span class="d">${val||'\u00a0'.repeat(6)}</span>`;
}
function _vlong(x) {
  const val = (x===null||x===undefined||x==='') ? '\u00a0'.repeat(20) : x;
  return `<span class="d lg">${val}</span>`;
}
function _vmd(x) {
  const val = (x===null||x===undefined||x==='') ? '\u00a0'.repeat(12) : x;
  return `<span class="d md">${val}</span>`;
}
function _photoCellTD(src, label) {
  if (src) {
    return `<td class="photo-td"><img src="${src}" alt="${label}"></td>`;
  }
  return `<td class="photo-td empty-td"><span class="ph-lb-empty">${label}</span><br><span class="ph-no">[ภาพถ่าย]</span></td>`;
}
function _photoGrid2x2(sus) {
  // Table-based 2x2 grid — works in both browser and Word
  return `<table class="photo-tbl" cellspacing="0" cellpadding="0">
    <tr>${_photoCellTD(sus.photoFront||sus.photo,'หน้าตรง')}${_photoCellTD(sus.photoBack,'หันหลัง')}</tr>
    <tr>${_photoCellTD(sus.photoLeft,'หันข้างซ้าย')}${_photoCellTD(sus.photoRight,'หันข้างขวา')}</tr>
  </table>`;
}
function _sigRow3(sigList) {
  // Table-based 3-column signature row — works in Word
  const cells = sigList.map(s => {
    const hasSig = S.signatures[s.key];
    const sigImg = (hasSig && S.sigMode==='electronic') ? `<img src="${S.signatures[s.key]}" style="height:35px">` : '';
    const rankAbbr = s.name ? s.name.split(' ')[0] : '';
    return `<td class="sig-td">
      <div>ลงชื่อ ${rankAbbr?rankAbbr+' ':''} ${sigImg}<span class="sig-dotline"></span></div>
      <div>( ${s.name ? '..'+s.name+'..' : '..........................................'} )</div>
      <div class="sig-role">${s.label}</div>
    </td>`;
  }).join('');
  return `<table class="sig-tbl" cellspacing="0" cellpadding="0"><tr>${cells}</tr></table>`;
}

function buildDocHTML(type, idx) {
  saveAll();
  const o = S.officer, inc = S.incident;
  const oName = `${o.rank} ${o.firstName} ${o.lastName}`;
  const ad = inc.arrestDate ? thDate(inc.arrestDate) : '';
  const at = inc.arrestTime || '';
  const rd = inc.recordDate ? thDate(inc.recordDate) : '';
  const rt = inc.recordTime || '';

  const sigList = buildSigList();

  let title='', body='';

  if (type==='arrest') {
    title='บันทึกจับกุม';

    // Header right block — ชิดขวา เว้นว่างให้กรอกภายหลัง
    const headerRight = `
      <div class="header-fields">
        ลงวันที่${_vlong('')}<br>
        ปจว.ข้อ${_vmd('')}เวลา${_vmd('')}<br>
        คดีอาญาที่${_vlong('')}<br>
        บัญชีของกลางที่${_vmd('')}<br>
        พนักงานสอบสวน${_vmd('')}
      </div>
    `;

    // Thai date parts helper
    function _thDateParts(dateStr) {
      if (!dateStr) return {d:'',m:'',y:''};
      // dateStr could be "12 มกราคม 2569" from thDate()
      const parts = dateStr.split(' ');
      return {d: parts[0]||'', m: parts[1]||'', y: parts[2]||''};
    }
    const rdp = _thDateParts(rd), adp = _thDateParts(ad);

    // Suspects list
    const suspectsHTML = S.suspects.map((s,i)=>{
      const num = ['๑','๒','๓','๔','๕','๖','๗','๘','๙','๑๐'][i] || (i+1);
      const dobParts = s.dob ? thDate(s.dob).split(' ') : ['','',''];
      return `<div style="margin:2px 0">
        ${num}. ${_vlong(`${s.title}${s.firstName} ${s.lastName}`)}อายุ${_v(s.age)}ปี (เกิดเมื่อวันที่${_v(dobParts[0])}/${_v(dobParts[1])}/${_v(dobParts[2])})<br>
        เลขประจำตัวประชาชน${_vlong(s.idCard)}ที่อยู่ตามบัตรประชาชน เลขที่${_vmd(s.addressId)}แขวง/ตำบล${_vmd(s.subDistrict)}<br>
        เขต/อำเภอ${_vmd(s.district)}จังหวัด${_vmd(s.province)}
      </div>`;
    }).join('');

    // Evidence list
    const evidenceHTML = S.evidence.filter(e=>e.name).map((e,i)=>{
      const num = ['๑','๒','๓','๔','๕','๖','๗','๘','๙','๑๐'][i] || (i+1);
      return `<div class="ev-row">${num}. ${_vlong(e.name)}จำนวน${_v(e.qty)}${e.unit||'ชิ้น'}</div>`;
    }).join('');
    // Fill empty rows up to 6
    const emptyEvRows = Math.max(0, 6 - S.evidence.filter(e=>e.name).length);
    const emptyEvHTML = Array(emptyEvRows).fill(0).map((_,i)=>{
      const num = ['๑','๒','๓','๔','๕','๖','๗','๘','๙','๑๐'][S.evidence.filter(e=>e.name).length+i] || '';
      return `<div class="ev-row">${num}. ${_vlong('')}จำนวน${_v('')}ชิ้น</div>`;
    }).join('');

    const totalItems = S.evidence.filter(e=>e.name).length;
    const totalQty = S.evidence.reduce((a,e)=>a+(parseInt(e.qty)||0),0);

    // Commanders & leaders
    const commandersStr = S.commanders.filter(c=>c.rankName).map(c=>c.rankName).join(', ') || '';
    const leadersStr = S.leaders.filter(l=>l.rankName).map(l=>l.rankName).join(', ') || oName;

    // Per-suspect statement
    const statementsHTML = S.suspects.map(s=>{
      const fn = `${s.title}${s.firstName} ${s.lastName}`;
      const stm = s.statement==='confess'?'รับสารภาพ':'ปฏิเสธ';
      return `<div>${fn}: ${_vmd(stm)} ${s.statementDetail?_vlong(s.statementDetail):''}</div>`;
    }).join('');

    // Evidence location
    const evLocationStr = S.evidence.filter(e=>e.name&&e.location).map(e=>e.location).join(', ') || S.evidenceLocation || '';

    // Page 1
    const page1 = `
      <div class="page">
        ${headerRight}
        <div class="clearfix"></div>

        <h1>บันทึกจับกุม</h1>

        <div class="section">
          สถานที่ทำการบันทึก${_vlong(inc.recordPlace||o.unit)}<br>
          วัน / เดือน / ปี ที่บันทึก&emsp;วันที่${_v(rdp.d)}เดือน${_v(rdp.m)}พ.ศ.${_v(rdp.y)} เวลา${_v(rt)}น.<br>
          วัน / เดือน / ปี ที่ตรวจค้น/จับกุม&emsp;วันที่${_v(adp.d)}เดือน${_v(adp.m)}พ.ศ.${_v(adp.y)} เวลา${_v(at)}น.
        </div>

        <div class="section">
          <strong>สถานที่ที่จับกุม</strong> บ้านเลขที่${_vmd(inc.houseNo||inc.location)}ถนน${_vmd(inc.road)}แขวง/ตำบล${_vmd(inc.subDistrict)}<br>
          เขต/อำเภอ${_vmd(inc.district)}จังหวัด${_vmd(inc.province)}
        </div>

        <div class="section">
          <strong>เจ้าหน้าที่ตำรวจที่ทำการจับกุม</strong> ภายใต้การอำนวยการของ${_vlong(commandersStr)}<br>
          นำโดย${_vlong(leadersStr)}
          ${S.jointUnits.some(u=>u.unitName||u.officers.some(of=>of.rankName))?`<br>${_vlong(S.jointUnits.filter(u=>u.unitName).map(u=>u.unitName).join(', '))}`:''}
        </div>

        <div class="section">
          <strong>ได้ร่วมกันจับกุมตัว</strong><br>
          ${suspectsHTML}
        </div>

        <div class="section">
          <strong>พร้อมด้วยของกลาง</strong>
          <div class="ev-list">${evidenceHTML}${emptyEvHTML}</div>
          <div style="text-align:center;font-weight:700;margin-top:4px">
            รวม${_v(totalItems||'')}รายการ จำนวน${_v(totalQty||'')}ชิ้น
          </div>
        </div>

        <div class="section">
          <strong>ตำแหน่งที่พบของกลาง</strong>${_vlong(evLocationStr)}
        </div>

        <div class="section">
          <p class="indent"><strong>โดยกล่าวหาว่า</strong> "${_vlong(inc.accusation)}"</p>
        </div>

        <div class="section">
          <p class="indent"><strong>พฤติการณ์กล่าวคือ</strong></p>
          <p class="indent narrative">${(inc.narrative||'').replace(/\n/g,'<br>') || '<span style="color:#999">[ยังไม่ได้กรอกพฤติการณ์]</span>'}</p>
        </div>
      </div>
    `;

    // Page 2: rights, statement, anung, signatures
    const rightsList = RIGHTS.map((r,i)=>{
      const num = ['๑','๒','๓','๔','๕','๖'][i];
      return `<div>${num}. ${r}</div>`;
    }).join('');

    // Build signature lists
    const officerSigs = sigList.filter(s=>s.key.startsWith('officer')||s.key.startsWith('leader')||s.key.startsWith('joint'));
    const suspectSigs = sigList.filter(s=>s.key.startsWith('suspect'));

    // Suspect signatures — "(ลงชื่อ)...ผู้ต้องหา/ได้รับสำเนาบันทึกการจับไว้แล้ว"
    const suspectSigHTML = suspectSigs.map(s=>`
      <div style="text-align:center;margin:8px 0">
        (ลงชื่อ)${S.signatures[s.key]&&S.sigMode==='electronic'?`<img src="${S.signatures[s.key]}" style="height:30px">`:'<span class="d lg"></span>'}ผู้ต้องหา/ได้รับสำเนาบันทึกการจับไว้แล้ว<br>
        (${_vmd(s.name)})
      </div>
    `).join('');

    // Officer signatures — 2-column table like the example: "ร.ต.อ. ...ผู้จับกุม"
    const officerSigRows = [];
    for(let i=0; i<officerSigs.length; i+=2){
      const s1 = officerSigs[i];
      const s2 = officerSigs[i+1];
      const rank1 = s1.name ? s1.name.split(' ')[0] : '';
      const rank2 = s2 ? (s2.name ? s2.name.split(' ')[0] : '') : '';
      const hasSig1 = S.signatures[s1.key]&&S.sigMode==='electronic';
      const hasSig2 = s2 && S.signatures[s2.key]&&S.sigMode==='electronic';
      const label1 = s1.label||'ผู้จับกุม';
      const label2 = s2 ? (s2.label||'ผู้จับกุม') : '';
      officerSigRows.push(`<tr>
        <td style="text-align:left;padding:6px 0">${rank1} ${hasSig1?`<img src="${S.signatures[s1.key]}" style="height:28px">`:'<span class="d lg"></span>'}${label1}</td>
        ${s2?`<td style="text-align:left;padding:6px 0">${rank2} ${hasSig2?`<img src="${S.signatures[s2.key]}" style="height:28px">`:'<span class="d lg"></span>'}${label2}</td>`:'<td></td>'}
      </tr><tr>
        <td style="text-align:center;padding:0 0 8px">(${_vmd(s1.name)})</td>
        ${s2?`<td style="text-align:center;padding:0 0 8px">(${_vmd(s2.name)})</td>`:'<td></td>'}
      </tr>`);
    }
    const officerSigHTML = `<table style="width:100%;border-collapse:collapse;margin-top:8px">${officerSigRows.join('')}</table>`;

    const page2 = `
      <div class="page">
        <p class="indent">เจ้าหน้าที่ตำรวจชุดจับกุมได้เดินทางไปยังสถานที่ดังกล่าวข้างต้น เมื่อไปถึงได้พบ นาย/นางสาว${_vlong(S.suspects.map(s=>`${s.title}${s.firstName} ${s.lastName}`).join(', '))} อยู่ในที่เกิดเหตุ เจ้าหน้าที่ตำรวจจึงได้แสดงตัวและแสดงบัตรประจำตัวให้ นาย/นางสาว${_vlong(S.suspects.map(s=>`${s.title}${s.firstName} ${s.lastName}`).join(', '))} ทราบและเข้าใจดีแล้ว ผลการตรวจสอบพบของกลางตามรายการดังกล่าวข้างต้น เจ้าหน้าที่ตำรวจจึงได้แจ้งให้ นาย/นางสาว${_vlong(S.suspects.map(s=>`${s.title}${s.firstName} ${s.lastName}`).join(', '))} ทราบว่าการกระทำดังกล่าวเป็นการกระทำความผิดต่อกฎหมาย</p>

        <p class="indent">และแจ้งข้อกล่าวหาให้ทราบว่ากระทำความผิดฐาน "${_vlong(inc.accusation)}" และได้แจ้งสิทธิ์ของผู้ต้องหา ตาม ป.วิอาญา มาตรา ๗/๑ ให้ผู้ต้องหาทราบ ณ สถานที่ตรวจค้น/จับกุม ดังนี้</p>

        <div class="rights-list">${rightsList}</div>

        <div style="margin-top:8px">
          <p class="indent">ขณะจับกุม ผู้ถูกจับ ได้รับทราบข้อกล่าวหา และสิทธิ์ของผู้ถูกจับโดยเข้าใจดีตลอดแล้ว และให้การ ${statementsHTML}</p>
        </div>

        <p class="indent">เจ้าหน้าที่ตำรวจชุดจับกุมจึงได้ร่วมกันทำการจับกุม พร้อมตรวจยึดของกลางตามรายการดังกล่าวข้างต้นเป็นของกลาง นำส่งพนักงานสอบสวน${_vmd(S.detentionPlace||o.unit)}เพื่อดำเนินคดีตามกฎหมายต่อไป</p>

        <div style="margin-top:8px">
          <strong>เหตุเกิดที่</strong>${_vmd(inc.houseNo||inc.location)}แขวง/ตำบล${_vmd(inc.subDistrict)}เขต/อำเภอ${_vmd(inc.district)}จังหวัด${_vmd(inc.province)}<br>
          <strong>เมื่อวันที่</strong>${_vlong(ad)}เวลาประมาณ${_v(at)}น.
        </div>

        <p class="indent" style="margin-top:8px"><strong>อนึ่ง</strong> ${S.anungText}</p>

        <p class="indent">ได้อ่านบันทึกนี้ให้ผู้ต้องหาฟังและได้อ่านเองแล้ว รับว่าถูกต้อง จึงให้ลงลายมือชื่อไว้เป็นหลักฐาน</p>

        ${suspectSigHTML}

        ${officerSigHTML}
      </div>
    `;

    body = page1 + page2;
  }
  else if (type==='sec22') {
    const sus = S.suspects[idx];
    if (!sus) return {title:'',body:''};
    const fn = `${sus.title}${sus.firstName} ${sus.lastName}`;
    title = `แบบ ม.22 — ${fn}`;

    const page1 = `
      <div class="page">
        <h1>แบบแจ้งข้อมูล เรื่อง การจับและควบคุมตามมาตรา ๒๒ วรรคสอง</h1>
        <div class="stars">******************************************************</div>
        <p class="indent">รายการข้อมูลในการแจ้งการจับและควบคุมไปยังศูนย์รับแจ้งโดยทันทีที่มีข้อมูล ดังต่อไปนี้</p>

        <div class="section">
          <span class="section-num">(๑)</span> ชื่อ/สกุล${_vlong(fn)}หมายเลขประจำตัวประชาชนหรือ<br>
          หมายเลขเอกสารอื่นที่ใช้ระบุตัวตน${_vlong(sus.idCard||sus.passport)}<br>
          ที่อยู่${_vlong(sus.addressId)} แขวง/ต.${_vmd(sus.subDistrict)} เขต/อ.${_vmd(sus.district)} จ.${_vmd(sus.province)}<br>
          หมายเลขโทรศัพท์${_vmd(sus.phone)} และอายุ${_v(sus.age)}ปี
        </div>

        <div class="section">
          <span class="section-num">(๒)</span> วัน เวลา และสถานที่ที่ทำการจับและควบคุม<br>
          วันที่${_vmd(ad)}เวลา${_v(at)}น. สถานที่จับและควบคุม${_vlong(inc.location)}<br>
          ตำบล/แขวง${_vmd(inc.subDistrict)} อำเภอ/เขต${_vmd(inc.district)} จังหวัด${_vmd(inc.province)}
        </div>

        <div class="section">
          <span class="section-num">(๓)</span> พฤติการณ์ในการจับและควบคุมบุคคลดังกล่าวโดยย่อ<br>
          <p class="narrative">${(inc.narrative||'').replace(/\n/g,'<br>') || '<span style="color:#999">[ยังไม่ได้กรอกพฤติการณ์]</span>'}</p>
        </div>

        <div class="section">
          <span class="section-num">(๔)</span> สถานที่ที่จะนำตัวบุคคลดังกล่าวไปควบคุมไว้<br>
          สถานที่ควบคุมตัว(สน./สภ./กก.)${_vlong(S.detentionPlace)}<br>
          อำเภอ/เขต${_vmd(S.detentionDistrict)} จังหวัด${_vmd(S.detentionProvince)}
        </div>

        <div class="section">
          <span class="section-num">(๕)</span> ภาพถ่ายผู้ถูกจับและควบคุมตาม (๑) (เป็นภาพแนบท้าย)
        </div>

        <div class="section">
          <span class="section-num">(๖)</span> ชื่อ สกุล และตำแหน่งของเจ้าหน้าที่ของรัฐผู้รับผิดชอบที่ทำการจับและควบคุมตามมาตรา ๒๒ รวมทั้งหมายเลขโทรศัพท์ที่สามารถติดต่อได้<br>
          ยศ/ชื่อ/นามสกุล${_vlong(oName)}<br>
          ตำแหน่ง/สังกัด${_vlong(o.position+' '+o.unit)}<br>
          หมายเลขโทรศัพท์ที่สามารถติดต่อได้${_vmd(o.phone)}
        </div>

        <div class="section">
          <span class="section-num">(๗)</span> เหตุสุดวิสัยในกรณีที่ไม่สามารถบันทึกภาพและเสียงได้ในขณะจับและควบคุม (ถ้ามี)${_vlong(sus.s23_forceReason)}
        </div>

        <div style="text-align:center;margin:20px 0 10px">
          <div>ลงชื่อ <span class="d lg">${S.signatures['officer'] && S.sigMode==='electronic'?`<img src="${S.signatures['officer']}" style="height:35px">`:''}
          </span> ผู้แจ้งซึ่งทำการจับและควบคุม</div>
          <div>( ${_vmd(oName)} )</div>
          <div>${o.position?o.position+' ':''}${o.unit||''}</div>
          <div>(เจ้าหน้าที่ของรัฐผู้รับผิดชอบตามข้อ ๖)</div>
        </div>

        <div class="note">
          <strong>*****หมายเหตุ :</strong> ให้ใช้แบบแจ้งข้อมูลนี้ เฉพาะกรณีระบบรับแจ้งการควบคุมตัวเกิดข้อขัดข้อง/หรือแจ้งพนักงานอัยการเท่านั้น
        </div>
      </div>
    `;

    // Attachment page with photos
    const attachSigs = [
      sigList.find(s=>s.key==='officer'),
      sigList.find(s=>s.key===`suspect_${idx}`),
      {key:'witness',label:'พยาน(ถ้ามี)',name:''}
    ].filter(Boolean);

    const page2 = `
      <div class="page attach-page">
        <div class="attach-title">
          <div class="ext">(เพิ่มเติม)</div>
          <h2>แบบแจ้งเรื่องการควบคุมตัวตามมาตรา ๒๒ วรรคสอง</h2>
          <div class="sub">ตามข้อ (๕) ภาพถ่ายผู้ถูกจับและการควบคุม ตามข้อ (๑) (ภาพแนบท้าย)</div>
        </div>

        ${_photoGrid2x2(sus)}
        ${_sigRow3(attachSigs)}
      </div>
    `;

    body = page1 + page2;
  }
  else if (type==='sec23') {
    const sus = S.suspects[idx];
    if (!sus) return {title:'',body:''};
    const fn = `${sus.title}${sus.firstName} ${sus.lastName}`;
    title = `แบบ ม.23 (ปท.1) — ${fn}`;

    // Section 3 - order type checkboxes
    const ot = sus.s23_orderType;
    const cb = (v) => ot===v ? '<span class="cb checked"></span>' : '<span class="cb"></span>';

    const page1 = `
      <div class="page">
        <div class="page-header">ปท. ๑ หน้าที่ ๑</div>
        <h1 style="font-size:15px">แบบบันทึกข้อมูลเกี่ยวกับผู้ถูกควบคุมตัวตามมาตรา ๒๓ แห่งพระราชบัญญัติป้องกัน<br>และปราบปรามการทรมานและการกระทำให้บุคคลสูญหาย พ.ศ. ๒๕๖๕</h1>

        <table class="form-grid">
          <tr>
            <td>
              <div><span class="section-num">๑</span> ข้อมูลอัตลักษณ์เกี่ยวกับผู้ถูกควบคุมตัว</div>
              ชื่อ${_vmd(sus.title+sus.firstName)}นามสกุล${_vmd(sus.lastName)}<br>
              เลขบัตรประชาชน${_vlong(sus.idCard)}<br>
              หนังสือเดินทาง${_vlong(sus.passport)}<br>
              ที่อยู่${_vlong(sus.addressId)}<br>
              ${_vlong((sus.subDistrict||'')+' '+(sus.district||'')+' '+(sus.province||''))}<br>
              ตำหนิรูปพรรณที่เห็นเด่นชัด<br>
              ${_vlong(sus.appearance)}<br>
              รูปถ่ายของผู้ถูกควบคุม(ปรากฏตามที่แนบท้ายบันทึก หน้าที่ ๒)
            </td>
            <td>
              <div><span class="section-num">๓</span> คำสั่งที่ให้มีการควบคุมตัว และเหตุแห่งการออกคำสั่งนั้น</div>
              ${cb('caught_in_act')} ความผิดซึ่งหน้าฐาน${_vmd(inc.accusation)}<br><br>
              ${cb('warrant')} ตามหมายจับเลขที่${_vmd(sus.s23_warrantNo)}<br>
              ศาลผู้ออกหมาย${_vmd(sus.s23_courtName)}<br><br>
              ${cb('order')} ตามคำสั่ง${_vmd(sus.s23_orderDetail)}<br><br>
              ${cb('other')} กรณีอื่น ๆ${_vmd(sus.s23_otherDetail)}
            </td>
          </tr>
          <tr>
            <td>
              <div><span class="section-num">๒</span> ข้อมูลเกี่ยวกับวันเวลา สถานที่ควบคุมตัว และเจ้าหน้าที่ผู้ควบคุมตัว</div>
              วันที่ถูกควบคุมตัว${_vmd(ad)}เวลา${_v(at)}น.<br>
              สถานที่ที่ถูกควบคุมตัว${_vlong(inc.location)}<br>
              ตำบล/แขวง${_vmd(inc.subDistrict)} อำเภอ/เขต${_vmd(inc.district)}<br>
              จังหวัด${_vmd(inc.province)}<br><br>
              <u>เจ้าหน้าที่ผู้ทำการควบคุมตัว</u><br>
              ชื่อ${_vmd(o.firstName)}นามสกุล${_vmd(o.lastName)}<br>
              ตำแหน่ง${_vlong(o.position+' '+o.unit)}<br>
              หมายเลขติดต่อ${_vmd(o.phone)}<br><br>
              <u>สถานที่ปลายทางที่รับตัว</u><br>
              ${_vlong(S.detentionPlace)}<br>
              ตำบล/แขวง${_vmd(S.detentionDistrict)}<br>
              จังหวัด${_vmd(S.detentionProvince)}
            </td>
            <td>
              <div><span class="section-num">๔</span> เจ้าหน้าที่ของรัฐผู้ออกคำสั่งให้ควบคุมตัว</div>
              ชื่อ-นามสกุล${_vlong(sus.s23_orderOfficerName)}<br>
              ตำแหน่ง${_vlong(sus.s23_orderOfficerPosition)}

              <div style="margin-top:12px"><span class="section-num">๕</span> วัน/เวลา/สถานที่ของการปล่อยตัว และผู้มารับตัว/หรือส่งมอบตัว</div>
              วันที่${_vmd(sus.s23_releaseDate?thDate(sus.s23_releaseDate):'')}เวลา${_v(sus.s23_releaseTime)}<br>
              สถานที่${_vlong(sus.s23_releasePlace)}<br>
              ผู้มารับตัว ชื่อ${_vmd(sus.s23_receiverName)}<br>
              หมายเลขติดต่อ${_vmd(sus.s23_receiverPhone)}

              <div style="margin-top:12px"><span class="section-num">๖</span> ข้อมูลเกี่ยวกับสภาพร่างกายและจิตใจของผู้ถูกควบคุมตัว</div>
              ก่อนถูกควบคุมตัว${_vlong(sus.s23_conditionBefore)}<br>
              ก่อนปล่อย/ส่งตัว${_vlong(sus.s23_conditionAfter)}
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div><span class="section-num">๗</span> ข้อมูลอื่น ๆ ที่คณะกรรมการกำหนด</div>
              ${_vlong('')}
            </td>
          </tr>
        </table>
      </div>
    `;

    const attachSigs = [
      sigList.find(s=>s.key==='officer'),
      sigList.find(s=>s.key===`suspect_${idx}`),
      {key:'witness',label:'พยาน(ถ้ามี)',name:''}
    ].filter(Boolean);

    const page2 = `
      <div class="page">
        <div class="page-header">ปท.๑ หน้าที่ ๒</div>
        <div class="page2-title">บันทึกแนบท้ายเพิ่มเติม</div>

        <div class="section">
          <span class="section-num">๘.</span> เหตุสุดวิสัยที่ไม่สามารถบันทึกภาพและเสียงตามมาตรา ๒๒ วรรคหนึ่งได้ ${_vlong(sus.s23_forceReason)}
        </div>

        <div class="section">
          <span class="section-num">๙.</span> บันทึกอื่น ๆ เพิ่มเติม (ถ้ามี) ${_vlong(sus.s23_additionalNotes)}
        </div>

        ${_photoGrid2x2(sus)}
        ${_sigRow3(attachSigs)}

        <div class="note">
          <strong>***หมายเหตุ :</strong><br>
          ๑. ในกรณีข้อมูลตามรายการ ๑ – ๗ มีจำนวนมากให้ทำเป็นบันทึกแนบท้ายเพิ่มเติมในข้อ ๙<br>
          ๒. ให้เจ้าหน้าที่ของรัฐซึ่งทำการจับและควบคุม ส่งตัวผู้ถูกควบคุมตัวให้กับผู้รับมอบตัว พร้อมสำเนา ปท.๑ และเอกสารประกอบ (ถ้ามี) สำหรับนำบันทึกฉบับจริงเก็บในสารบบของหน่วยงาน<br>
          ๓. ให้ผู้รับมอบตัวจัดทำ ปท.๑ ในส่วนของตน โดยมีสำเนา ปท.๑ ของผู้ควบคุมคนก่อนเป็นเอกสารแนบท้าย<br>
          ๔. ภาพถ่ายของผู้ถูกควบคุมตามข้อ ๑ ให้ทำเป็นเอกสารภาพถ่ายแนบท้าย ปท.๑ อย่างน้อยต้องเห็นเนื้อตัวร่างกายตามสภาพภายนอกขณะถูกควบคุมหรือขณะรับมอบตัว โดยไม่ต้องถอดเสื้อผ้า
        </div>
      </div>
    `;

    body = page1 + page2;
  }

  return {title, body};
}

function getDocCSS(type) {
  // CSS derived from approved prototypes — matches Thai government document standards
  // type = 'arrest' | 'sec22' | 'sec23' — sec23 uses smaller font/tighter padding
  const isSec23 = (type === 'sec23');
  const fontSize = '16px'; // TH SarabunIT๙ ขนาด 16 ทุกเอกสาร
  const lineHeight = isSec23 ? '1.6' : '1.65';
  const padScreen = isSec23 ? '12mm 15mm 10mm 15mm' : '18mm 22mm 15mm 22mm';
  const padPrint = isSec23 ? '10mm 12mm 8mm 12mm' : '15mm 18mm 12mm 18mm';
  const h1Size = isSec23 ? '15px' : '18px';
  const dFontSize = isSec23 ? '13.5px' : fontSize;
  const dMin = isSec23 ? '60px' : '60px';
  const dMd = isSec23 ? '120px' : '130px';
  const dLg = isSec23 ? '180px' : '200px';
  const dXl = isSec23 ? '260px' : '300px';
  const gridFontSize = isSec23 ? '13.5px' : '14px';
  const gridLineHeight = isSec23 ? '1.55' : '1.6';
  const photoHeight = isSec23 ? '165mm' : '195mm';
  const photoMaxWidth = isSec23 ? 'max-width:165mm;margin:10px auto' : 'margin:10px 0';

  return `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
      @font-face{font-family:'TH SarabunIT9';src:local('TH SarabunIT๙'),local('TH SarabunIT9'),local('TH Sarabun New'),local('TH SarabunPSK'),local('Sarabun')}
      *{margin:0;padding:0;box-sizing:border-box}
      body{
        font-family:'TH SarabunIT9','TH SarabunIT๙','TH Sarabun New','TH SarabunPSK','Sarabun',sans-serif;
        font-size:${fontSize}; line-height:${lineHeight}; color:#111; background:#e0e0e0;
      }
      .page{
        width:210mm; min-height:297mm;
        margin:20px auto; padding:${padScreen};
        background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.15);
        position:relative; page-break-after:always;
      }
      .page:last-child{page-break-after:auto}
      .page-break{page-break-before:always;height:0;margin:0;padding:0}
      @media print{
        body{background:#fff}
        .page{margin:0;padding:${padPrint};box-shadow:none;width:100%}
        @page{margin:0;size:A4}
      }

      h1{font-size:${h1Size};font-weight:700;text-align:center;margin-bottom:10px;line-height:1.4}
      h2{font-size:18px;font-weight:700;text-align:center;margin-bottom:4px}
      h3{font-size:15px;font-weight:700;margin-bottom:4px}
      strong{font-weight:700}
      img{max-width:100%}

      .stars{text-align:center;font-size:14px;letter-spacing:1px;margin-bottom:6px}
      .indent{text-indent:3em;margin-bottom:4px}
      .narrative{text-indent:3em;white-space:pre-wrap;line-height:1.7}
      .section{margin-bottom:6px}
      .section-num{font-weight:700}
      .section-title{font-weight:700;margin-bottom:2px}
      .clearfix::after{content:'';display:block;clear:both}
      .empty{color:#999}

      /* Dotted underline value field — from prototype */
      .d{
        border-bottom:1px dotted #555;
        display:inline-block;
        min-width:${dMin}; padding:0 3px;
        text-align:center;
        color:#0000cc; font-weight:600;
        font-size:${dFontSize};
      }
      .d:empty::after{content:'\\00a0'}
      .d.md{min-width:${dMd}}
      .d.lg{min-width:${dLg}}
      .d.xlg{min-width:${dXl}}
      .d.full{min-width:calc(100% - 2em);text-align:left;padding-left:6px}

      /* Header right block (arrest record) */
      .header-fields{
        float:right; text-align:right;
        margin-bottom:10px; font-size:14.5px; line-height:1.8;
      }
      .header-fields::after{content:'';display:block;clear:both}

      /* Rights list */
      .rights-list{margin-left:3em}
      .rights-list>div{text-indent:-1.5em;margin-left:1.5em;margin-bottom:2px}

      /* Evidence list */
      .ev-list{margin:4px 0;margin-left:2em}
      .ev-row{margin-bottom:2px}

      /* Signature grid (officer signatures) */
      .sig-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px 20px;
        margin-top:16px;
      }
      .sig-item{text-align:center;font-size:14px}
      .sig-line-2{
        display:inline-block; width:200px;
        border-bottom:1px dotted #555;
        margin-bottom:2px; height:24px;
      }
      .sig-img-inline{height:30px;display:block;margin:0 auto 2px}
      .sig-role{font-size:12px}

      /* Bottom signature area */
      .sig-area{margin-top:30px;text-align:center}
      .sig-area .sig-line{
        display:inline-block; width:250px;
        border-bottom:1px dotted #555; margin-bottom:2px;
      }
      .sig-line{
        display:inline-block; width:200px;
        border-bottom:1px dotted #555; margin-bottom:2px;
      }
      .sig-img{max-height:35px;vertical-align:middle}

      /* Note (footer) */
      .note{
        margin-top:20px; font-size:13px;
        border-top:1px solid #999; padding-top:6px;
      }

      /* Checkbox for sec23 */
      .cb{
        display:inline-block; width:14px; height:14px;
        border:1px solid #333; vertical-align:middle;
        margin-right:4px; text-align:center;
        font-size:11px; line-height:14px;
      }
      .cb.checked::after{
        content:'\\2713'; font-weight:700;
      }

      /* Section 23 form-grid table */
      .form-grid{
        width:100%; border-collapse:collapse;
        margin-top:6px; table-layout:fixed;
      }
      .form-grid td{
        border:1px solid #333; padding:6px 8px;
        vertical-align:top; width:50%;
        font-size:${gridFontSize}; line-height:${gridLineHeight};
      }
      .form-grid .section-title{font-weight:700;margin-bottom:3px}

      /* Page header (sec23) */
      .page-header{
        text-align:right; font-size:13px; margin-bottom:4px;
      }
      .page2-title{
        text-align:center; font-weight:700;
        font-size:16px; margin:8px 0 10px;
      }

      /* Attachment page (photos) */
      .attach-page{page-break-before:always}
      .attach-title{text-align:center;margin-bottom:8px}
      .attach-title .ext{font-size:16px;font-weight:700}
      .attach-title h2{font-size:18px;font-weight:700;margin-top:4px}
      .attach-title .sub{font-size:14px;margin-top:4px}

      /* Photo 2x2 table — Word compatible */
      .photo-tbl{
        width:100%; border-collapse:collapse;
        margin:6px auto;
        ${photoMaxWidth};
      }
      .photo-td{
        width:50%; height:${isSec23?'78mm':'95mm'}; border:1px solid #333;
        text-align:center; vertical-align:middle;
        padding:2px; overflow:hidden;
        background:#f5f5f5;
      }
      .photo-td img{
        max-width:100%; max-height:${isSec23?'76mm':'93mm'}; object-fit:contain;
        display:block; margin:0 auto;
      }
      .empty-td{color:#777;font-size:14px;padding:10px}
      .ph-lb-empty{font-weight:700;color:#333;font-size:16px}
      .ph-no{font-size:12px;color:#888}

      /* 3-column signature table — Word compatible */
      .sig-tbl{
        width:100%; border-collapse:collapse;
        margin-top:12px;
      }
      .sig-td{
        width:33.3%; border:1.5px solid #333;
        text-align:center; padding:10px 8px 8px;
        font-size:14px; line-height:1.7;
        vertical-align:top; min-height:80px;
      }
      .sig-dotline{
        display:inline-block; width:50%;
        border-bottom:1px dotted #555;
        height:20px; margin:0 0 2px;
      }
      .sig-role{font-size:13px;margin-top:2px}
  `;
}

function openPrintWindow(title, body, docType) {
  const w = window.open('','_blank','width=900,height=1000');
  if(!w){alert('กรุณาอนุญาต popup เพื่อ export PDF');return;}
  w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
    <title>${title}</title>
    <style>${getDocCSS(docType)}</style>
  </head><body>${body}
    <script>
    // Wait for fonts and images to load before printing
    window.onload=function(){
      if(document.fonts&&document.fonts.ready){
        document.fonts.ready.then(function(){setTimeout(function(){window.print();},300);});
      } else {
        setTimeout(function(){window.print();},800);
      }
    };
    <\/script>
  </body></html>`);
  w.document.close();
}

function exportPDF(type, idx) {
  const doc = buildDocHTML(type, idx);
  openPrintWindow(doc.title, doc.body, type);
}

// === Word (.doc) export ===
// Generates an HTML file with Word XML headers, downloaded with .doc extension.
// Microsoft Word opens these natively, preserving most styling and pagination.
function exportDoc(type, idx) {
  const doc = buildDocHTML(type, idx);
  downloadDoc(doc.title, doc.body, type);
}

function downloadDoc(title, body, docType) {
  // Word HTML format with Office namespaces & WordSection page setup
  const wordCSS = getDocCSS(docType) + `
    /* Word-specific page setup */
    @page WordSection1 {
      size: 21cm 29.7cm;
      margin: 1.8cm 2cm 1.6cm 2.2cm;
      mso-page-orientation: portrait;
    }
    div.WordSection1 { page: WordSection1; }
    .page { box-shadow: none; margin: 0; padding: 0; width: auto; min-height: auto; background: #fff; page-break-after: auto !important; page-break-before: auto !important; }
    body { background: #fff; font-family: 'TH SarabunIT9','TH SarabunIT๙','TH Sarabun New','Sarabun',sans-serif; font-size: 16px; }
    .photo-tbl { width: 100%; }
    .photo-td { width: 50%; height: 250px; }
    .photo-td img { width: 100%; height: 250px; }
  `;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument>
</xml><![endif]-->
<style>${wordCSS}</style>
</head>
<body><div class="WordSection1">${body}</div></body>
</html>`;
  // BOM ensures Word reads UTF-8 (Thai chars) correctly
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (title || 'document').replace(/[\\/:*?"<>|]/g,'_') + '.doc';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

function exportAll() {
  // Open all docs as PDF print windows — stagger to avoid popup blocking
  let delay = 0;
  const gap = 1000;

  setTimeout(() => {
    const arrestDoc = buildDocHTML('arrest', 0);
    openPrintWindow(arrestDoc.title, arrestDoc.body, 'arrest');
  }, delay);
  delay += gap;

  S.suspects.forEach((s, i) => {
    setTimeout(() => {
      const s22 = buildDocHTML('sec22', i);
      openPrintWindow(s22.title, s22.body, 'sec22');
    }, delay);
    delay += gap;
    setTimeout(() => {
      const s23 = buildDocHTML('sec23', i);
      openPrintWindow(s23.title, s23.body, 'sec23');
    }, delay);
    delay += gap;
  });
}

function exportAllDoc() {
  // Stagger all downloads with delays to prevent browser blocking
  let delay = 0;
  const gap = 800;

  setTimeout(() => {
    const arrestDoc = buildDocHTML('arrest', 0);
    downloadDoc(arrestDoc.title, arrestDoc.body, 'arrest');
  }, delay);
  delay += gap;

  S.suspects.forEach((s, i) => {
    setTimeout(() => {
      const s22 = buildDocHTML('sec22', i);
      downloadDoc(s22.title, s22.body, 'sec22');
    }, delay);
    delay += gap;
    setTimeout(() => {
      const s23 = buildDocHTML('sec23', i);
      downloadDoc(s23.title, s23.body, 'sec23');
    }, delay);
    delay += gap;
  });
}
