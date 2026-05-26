// ========== HELPERS ==========
function esc(s) { return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function thDate(d) { if(!d) return ''; const x=new Date(d); const m=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']; return `${x.getDate()} ${m[x.getMonth()]} ${x.getFullYear()+543}`; }
function getOT(s) { const m={caught_in_act:'ความผิดซึ่งหน้า',warrant:`หมายจับ ${s.s23_warrantNo||'...'}`,order:`คำสั่ง ${s.s23_orderDetail||'...'}`,other:s.s23_otherDetail||'อื่นๆ'}; return m[s.s23_orderType]||'—'; }

function updS(path, val) {
  const p = path.split('.');
  let o = S;
  for (let i=0;i<p.length-1;i++) o = o[p[i]];
  o[p[p.length-1]] = val;
}

function bindInputs() {
  document.querySelectorAll('[data-f]').forEach(el => {
    el.addEventListener('input', e => updS(e.target.dataset.f, e.target.value));
    el.addEventListener('change', e => updS(e.target.dataset.f, e.target.value));
  });
}

function go(n) { saveAll(); S.step=n; R(); window.scrollTo({top:0,behavior:'smooth'}); }
function next() { saveAll(); if(S.step<STEPS.length-1){S.step++;R();window.scrollTo({top:0,behavior:'smooth'});} }
function prev() { saveAll(); if(S.step>0){S.step--;R();window.scrollTo({top:0,behavior:'smooth'});} }
function saveAll() { document.querySelectorAll('[data-f]').forEach(el => updS(el.dataset.f, el.value)); }

function addSuspect() { S.suspects.push(newSuspect()); S.activeSuspect=S.suspects.length-1; R(); }
function removeSuspect(i) { if(S.suspects.length<=1) return; S.suspects.splice(i,1); S.activeSuspect=Math.min(S.activeSuspect,S.suspects.length-1); R(); }

function addEvidence() { S.evidence.push({name:'',qty:'',unit:'ชิ้น',location:''}); R(); }
function removeEvidence(i) { if(S.evidence.length<=1) return; S.evidence.splice(i,1); R(); }

function editOfficer() {
  const fields = [['rank','ยศ'],['firstName','ชื่อ'],['lastName','นามสกุล'],['position','ตำแหน่ง'],['unit','สังกัด'],['phone','เบอร์โทร']];
  fields.forEach(([k,l]) => { const v=prompt(l+':', S.officer[k]); if(v!==null) S.officer[k]=v; });
  R();
}

// Image compression for photo optimization
function compressImage(dataUrl, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
        };
        img.src = dataUrl;
    });
}

// Photo
function upPhoto(input, idx, type) {
  const f = input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = async function(e) {
    const compressed = await compressImage(e.target.result, 1200, 0.7);
    if(type==='suspect') S.suspects[idx].photo=compressed;
    else if(type==='photoFront') { S.suspects[idx].photoFront=compressed; if(!S.suspects[idx].photo) S.suspects[idx].photo=compressed; }
    else if(type==='photoBack')  S.suspects[idx].photoBack=compressed;
    else if(type==='photoLeft')  S.suspects[idx].photoLeft=compressed;
    else if(type==='photoRight') S.suspects[idx].photoRight=compressed;
    else if(type==='scene') S.scenePhoto=compressed;
    else if(type==='evidence') S.evidencePhoto=compressed;
    R();
  };
  r.readAsDataURL(f);
}
function capCam(id) { const el=document.getElementById(id); el.setAttribute('capture','environment'); el.click(); setTimeout(()=>el.removeAttribute('capture'),100); }

// Signature — key-based (S.signatures[key])
let sigCv, sigCx, sigD=false;
function initSig() {
  sigCv=document.getElementById('sig-cv'); if(!sigCv) return;
  // Set canvas pixel width to match container for full-width drawing
  const container=sigCv.parentElement;
  if(container){sigCv.width=container.clientWidth||600;}
  sigCx=sigCv.getContext('2d');
  const key=S.sigActiveKey;
  if(S.signatures[key]){const img=new Image();img.onload=()=>sigCx.drawImage(img,0,0);img.src=S.signatures[key];}
  sigCv.onmousedown=e=>{sigD=true;sigCx.beginPath();sigCx.moveTo(e.offsetX,e.offsetY);sigCx.strokeStyle='#111';sigCx.lineWidth=2;sigCx.lineCap='round';};
  sigCv.onmousemove=e=>{if(!sigD)return;sigCx.lineTo(e.offsetX,e.offsetY);sigCx.stroke();};
  sigCv.onmouseup=()=>{sigD=false;S.signatures[S.sigActiveKey]=cropSig(sigCv);};
  sigCv.ontouchstart=e=>{e.preventDefault();const r=sigCv.getBoundingClientRect();const p={offsetX:e.touches[0].clientX-r.left,offsetY:e.touches[0].clientY-r.top};sigD=true;sigCx.beginPath();sigCx.moveTo(p.offsetX,p.offsetY);sigCx.strokeStyle='#111';sigCx.lineWidth=2;sigCx.lineCap='round';};
  sigCv.ontouchmove=e=>{e.preventDefault();if(!sigD)return;const r=sigCv.getBoundingClientRect();sigCx.lineTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);sigCx.stroke();};
  sigCv.ontouchend=()=>{sigD=false;S.signatures[S.sigActiveKey]=cropSig(sigCv);};
}
function cropSig(cv){try{const ctx=cv.getContext('2d');const w=cv.width,h=cv.height;if(!w||!h)return cv.toDataURL();const d=ctx.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=0,maxY=0,found=false;for(let y=0;y<h;y++){for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>10){found=true;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}}}if(!found)return cv.toDataURL();const pad=6;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);const cw=maxX-minX+1,ch=maxY-minY+1;const o=document.createElement('canvas');o.width=cw;o.height=ch;o.getContext('2d').drawImage(cv,minX,minY,cw,ch,0,0,cw,ch);return o.toDataURL();}catch(e){return cv.toDataURL();}}
function clearSig() { delete S.signatures[S.sigActiveKey]; R(); }

// Preview & Export
function showPv(type, idx) { S.showModal=type; S.modalSuspectIdx=idx||0; saveAll(); R(); }
