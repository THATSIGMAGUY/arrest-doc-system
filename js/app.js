// ===== TEAM PRESET =====
function getTeamPresets() {
  try { return JSON.parse(localStorage.getItem('teamPresets') || '[]'); }
  catch(e) { return []; }
}

function saveTeamPreset() {
  const name = prompt('ตั้งชื่อ Preset ชุดจับกุมนี้ เช่น "ชุด ปส.1", "ชุดประจำ"');
  if (!name || !name.trim()) return;
  const key = name.trim();
  const presets = getTeamPresets();
  const idx = presets.findIndex(function(p){ return p.name === key; });
  const entry = {
    name: key,
    commanders: JSON.parse(JSON.stringify(S.commanders)),
    leaders: JSON.parse(JSON.stringify(S.leaders)),
    jointUnits: JSON.parse(JSON.stringify(S.jointUnits))
  };
  if (idx >= 0) {
    if (!confirm('มี Preset ชื่อ "' + key + '" อยู่แล้ว — เขียนทับ?')) return;
    presets[idx] = entry;
  } else {
    presets.push(entry);
  }
  localStorage.setItem('teamPresets', JSON.stringify(presets));
  alert('✅ บันทึก Preset "' + key + '" เรียบร้อย');
  R();
}

function loadTeamPreset(idx) {
  const presets = getTeamPresets();
  const p = presets[idx];
  if (!p) return;
  if (!confirm('โหลด Preset "' + p.name + '"\nจะแทนที่ข้อมูลชุดจับกุมปัจจุบัน — ยืนยัน?')) return;
  S.commanders = JSON.parse(JSON.stringify(p.commanders));
  S.leaders = JSON.parse(JSON.stringify(p.leaders));
  S.jointUnits = JSON.parse(JSON.stringify(p.jointUnits));
  window._presetOpen = false;
  R();
}

function deleteTeamPreset(idx) {
  const presets = getTeamPresets();
  const p = presets[idx];
  if (!p) return;
  if (!confirm('ลบ Preset "' + p.name + '" — ยืนยัน?')) return;
  presets.splice(idx, 1);
  localStorage.setItem('teamPresets', JSON.stringify(presets));
  R();
}

function rPresetBar() {
  const ps = getTeamPresets();
  const open = !!window._presetOpen;
  let html = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">'
    + '<button class="btn btn-s btn-o" onclick="saveTeamPreset()" title="บันทึกชุดจับกุมปัจจุบันเป็น Preset">💾 บันทึก Preset</button>';
  if (ps.length > 0) {
    html += '<button class="btn btn-s btn-o" onclick="window._presetOpen=!window._presetOpen;R()" title="แสดง/ซ่อน Preset ที่บันทึกไว้">'
      + '📂 Preset (' + ps.length + ') ' + (open ? '▲' : '▼') + '</button>';
  } else {
    html += '<span style="font-size:12px;color:var(--g)">📂 ยังไม่มี Preset — กรอกชุดจับกุมแล้วกด บันทึก Preset</span>';
  }
  html += '</div>';
  if (open && ps.length > 0) {
    html += '<div style="background:var(--gl);border:1.5px solid var(--gb);border-radius:10px;padding:12px;margin-bottom:12px">'
      + '<div style="font-size:12px;font-weight:700;color:var(--dk);margin-bottom:8px">📂 เลือก Preset ที่บันทึกไว้</div>';
    ps.forEach(function(p, i) {
      const totalOfficers = p.commanders.filter(function(c){ return c.rankName; }).length
        + p.leaders.filter(function(l){ return l.rankName; }).length
        + (p.jointUnits || []).reduce(function(a, u){ return a + u.officers.filter(function(o){ return o.rankName; }).length; }, 0);
      html += '<div style="display:flex;gap:8px;align-items:center;padding:7px 10px;background:white;border-radius:8px;margin-bottom:6px;border:1px solid var(--gb)">'
        + '<span style="flex:1;font-size:13px;font-weight:600">👥 ' + p.name + '</span>'
        + '<span style="font-size:11px;color:var(--g)">' + totalOfficers + ' นาย</span>'
        + '<button class="btn btn-s btn-a" onclick="loadTeamPreset(' + i + ')">📥 โหลด</button>'
        + '<button class="btn btn-s btn-d" onclick="deleteTeamPreset(' + i + ')">🗑</button>'
        + '</div>';
    });
    html += '</div>';
  }
  return html;
}

// INIT
R();
