# คู่มือติดตั้งระบบ — Post-Arrest Documentation v1.1-security

อัปเดต: 2026-04-21
เวอร์ชัน: 1.1-security (บังคับใช้ hash password, POST login, authorization)

---

## ภาพรวมสถาปัตยกรรม

```
Browser (PWA) ──┬── http://localhost:8080  (dev, static files)
                └── https://script.google.com/...  (production, Google Apps Script)
                                │
                                └── Google Sheets (Users / Cases / AuditLog)
```

- **Frontend** — HTML/CSS/JS แบบ static ไม่มี build step
- **Backend** — Google Apps Script (GAS) deploy เป็น Web App
- **Database** — Google Spreadsheet 3 ชีท: `Users`, `Cases`, `AuditLog`

---

## 1. เตรียม Google Sheet + Apps Script

### 1.1 สร้าง Spreadsheet
1. เปิด https://sheets.google.com → สร้าง Spreadsheet ใหม่
2. คัดลอก **Spreadsheet ID** จาก URL (ส่วนระหว่าง `/d/` กับ `/edit`)

### 1.2 วาง backend code
1. ในไฟล์ Spreadsheet → เมนู **Extensions → Apps Script**
2. ลบโค้ดเริ่มต้นใน `Code.gs` ทิ้ง
3. คัดลอกเนื้อหาจาก `backend/gas-backend.gs` ทั้งไฟล์มาวาง
4. แก้บรรทัด `const SHEET_ID = '...'` ให้เป็น ID ที่ได้จากข้อ 1.1
5. บันทึก (Ctrl+S)

### 1.3 รัน `initSheets()` ครั้งแรก (สำคัญ!)
1. ใน Apps Script editor → เลือก function `initSheets` จาก dropdown บน toolbar
2. กด **Run** (ครั้งแรกจะขอ permission — กด Review permissions → อนุญาต)
3. เปิด **View → Logs** (หรือ Ctrl+Enter)
4. จะเห็นบรรทัดประมาณว่า:

   ```
   [INFO] Initial admin password: K4mD-8pQxR2-HnV9
   [INFO] กรุณา copy รหัสนี้ไว้ — หลังจากนี้จะไม่แสดงอีก
   ```

5. **คัดลอกรหัสนี้ทันที** (รหัสสุ่มความยาว 16 ตัว ไม่ได้เก็บไว้ที่ไหน plaintext)

> หากรันพลาดหรือปิด log ไปก่อน copy — สามารถรัน `_resetAdminPassword()` (ถ้ามี) หรือแก้ใน Users sheet ด้วยการลบทั้ง row ของ admin แล้วรัน `initSheets()` ใหม่

### 1.4 Deploy เป็น Web App
1. ที่มุมขวาบน → **Deploy → New deployment**
2. Type: **Web app**
3. ตั้งค่า:
   - Description: `v1.1-security`
   - Execute as: **Me** (เจ้าของบัญชี)
   - Who has access: **Anyone** (ถ้าต้องการให้ตำรวจทุกคนเข้าถึงได้โดยไม่ต้อง login Google) หรือ **Anyone within [องค์กร]**
4. กด **Deploy** → copy **Web app URL** (ขึ้นต้นด้วย `https://script.google.com/macros/s/.../exec`)

---

## 2. ตั้งค่าฝั่ง Frontend

### 2.1 ใส่ GAS URL
เปิดไฟล์ `js/config.js` แล้วแก้:

```js
const GAS_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```

> ปล่อยเป็น empty string (`''`) ถ้าต้องการรันแบบ **Offline** (ใช้ localStorage แทน — ข้อมูลจะอยู่เฉพาะเครื่องนั้น)

### 2.2 รันแบบ local
สองทางเลือก:

**ทางเลือก A — ดับเบิ้ลคลิก `.bat`** (แนะนำสำหรับ Windows)
```
scripts\เปิดระบบ.bat
```
จะเปิด PowerShell server ที่ port 8080 และเปิด browser ให้อัตโนมัติ

**ทางเลือก B — คำสั่งตรง**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-server.ps1
```

เปิดเบราว์เซอร์ที่ http://localhost:8080/

---

## 3. Login ครั้งแรก + เปลี่ยนรหัส admin

1. เปิดระบบ → หน้า login
2. ใส่:
   - Username: `admin`
   - Password: (รหัสสุ่มที่ copy จาก Logs ใน step 1.3)
3. เข้าหน้า Dashboard สำเร็จ
4. **เปลี่ยนรหัสทันที** ผ่าน Admin Panel (ถ้ามี UI) หรือแก้ใน `Users` sheet โดยตรง:
   - เปิด Apps Script editor → run `hashPassword('รหัสใหม่')` และ copy ผลลัพธ์ (string 64 ตัว hex)
   - วางทับในช่อง password ของ row admin

---

## 4. Migration จาก v1.0 (password plaintext)

ถ้าเคย deploy v1.0 มาก่อน (password เก็บเป็นข้อความธรรมดา) ให้รันครั้งเดียวเท่านั้น:

1. Apps Script editor → เลือก function `migratePasswordsToHash` → Run
2. ดู Logs — จะเห็นรายชื่อ user ที่ถูกแปลงเป็น hash (skip row ที่ hash แล้ว)
3. หลัง migrate เสร็จ — การ login ยังใช้รหัสเดิมได้ (backend hash ก่อน compare) แต่ Sheet จะไม่มี plaintext แล้ว

> `handleLogin` รองรับทั้ง 2 แบบชั่วคราว (ตรวจว่าค่าใน sheet มีความยาว 64 hex = hash หรือไม่) เพื่อกันระบบล่มระหว่าง migrate

---

## 5. ตรวจสอบว่าทุกอย่างทำงาน

- [ ] `initSheets()` สร้าง 3 ชีท: Users, Cases, AuditLog (ดูแถบแท็บด้านล่าง Spreadsheet)
- [ ] Login admin ด้วยรหัสสุ่มใหม่ได้
- [ ] เปิดหน้า Dashboard → ไม่มี error ใน Console (F12)
- [ ] สร้างคดีใหม่ → กดบันทึก → เห็นในชีท Cases (column `createdBy` = admin)
- [ ] ชีท AuditLog มี row ใหม่ทุกครั้งที่ login / saveCase / getCase / deleteCase
- [ ] ลอง login ผิด — AuditLog ต้องบันทึก action=`login` result=`fail`
- [ ] สร้าง user ทดลอง (เช่น user1) → login ด้วย user1 → ดูได้เฉพาะคดีของตัวเอง (ของ admin ไม่เห็น)

---

## 6. Troubleshooting

| อาการ | สาเหตุ / ทางแก้ |
|---|---|
| `Action นี้ต้องเรียกผ่าน POST` | Frontend เก่ายังเรียก `?action=login` ผ่าน URL — อัปเดต `js/auth.js` และ `js/api.js` เป็นเวอร์ชัน v1.1 |
| `ไม่มีสิทธิ์เข้าถึงคดีนี้` | User ที่ login ไม่ใช่เจ้าของคดีและไม่ใช่ admin — ถูกต้องแล้ว ไม่ใช่ bug |
| Login สำเร็จแต่ไม่เห็นคดีใดๆ | คดีใน sheet ไม่มี `createdBy` ตรงกับ username — เพิ่ม user เป็น admin หรือ migrate createdBy |
| `Server error` หลัง deploy | ดู Apps Script Executions log — ส่วนมากคือ `SHEET_ID` ผิด หรือ Sheet ถูกลบ |
| หลังแก้ backend แล้วยังไม่มีผล | ต้อง **Deploy → Manage deployments → Edit → New version** ทุกครั้ง (แก้ code อย่างเดียวไม่ update URL เดิม) |

---

## 7. ไฟล์ที่เกี่ยวข้อง

- `backend/gas-backend.gs` — backend ทั้งหมด (คัดลอกไปใส่ Apps Script)
- `js/config.js` — GAS_URL + flags
- `js/api.js` — wrapper `gasCall` / `gasPost`
- `js/auth.js` — login flow
- `docs/review-2026-04-21.md` — รายงาน audit เวอร์ชัน v1.0 → v1.1
- `scripts/init-git.ps1` — สคริปต์ git init (รันครั้งแรกบน Windows)

---

## 8. เกณฑ์ความปลอดภัย (v1.1)

- Password: SHA-256 hash (ไม่ plaintext) — ดู `hashPassword()` ใน backend
- Login: POST body ไม่ใช่ URL → ไม่ leak ลง server log / browser history
- Authorization: ทุก action ที่ state-changing เช็คว่า requester เป็นเจ้าของ หรือ admin
- Audit: ทุก login / read / write / delete log ไปที่ชีท AuditLog
- Initial password: สุ่ม 16 ตัว (charset ไม่มี `0/O/1/l/I` กัน typo) แสดงครั้งเดียวใน Logs

**เกณฑ์ที่ยัง _ไม่_ครอบคลุมในเวอร์ชันนี้** (ดู `docs/review-2026-04-21.md`)
- Rate limiting / lockout หลัง login fail หลายครั้ง
- CSRF token (ใช้ same-origin ของ Apps Script ป้องกันบางส่วน)
- Encryption at-rest ของ caseData (เก็บเป็น JSON ในชีท ยัง readable โดย Google account เจ้าของ)
- Session timeout (session อยู่ในหน่วยความจำ frontend เท่านั้น — refresh = logout)

เหล่านี้อยู่ใน Roadmap Phase 2.2+ ครับ
