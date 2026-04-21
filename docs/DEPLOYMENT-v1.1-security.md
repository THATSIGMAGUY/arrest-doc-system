# Deployment Guide — v1.1-security

วันที่: 2026-04-21
จาก: v1.0 (plaintext password, ไม่มี authz) → v1.1-security

---

## ภาพรวมการเปลี่ยนแปลง

| เรื่อง | v1.0 | v1.1 |
|---|---|---|
| Password storage | plaintext ใน Users sheet | SHA-256 hash (64 hex) |
| Login transport | `GET ?action=login&password=...` | `POST` body |
| Authorization | ทุกคนเห็น/แก้/ลบคดีทั้งหมด | เจ้าของ + admin เท่านั้น |
| Audit logging | ไม่มี | ชีท AuditLog บันทึกทุก action |
| Admin password | hardcode `admin/admin123` | สุ่มครั้งเดียวใน `initSheets()` |

---

## ลำดับการ deploy (สำคัญ — ทำตามนี้)

### ก่อนเริ่ม — backup
```
1. เปิด Google Spreadsheet ปัจจุบัน
2. File → Make a copy → ตั้งชื่อ "...-backup-v1.0-YYYYMMDD"
3. ดาวน์โหลด index.html เก่า + js/*.js เก่าเก็บไว้ (repo มี backups/index.original.html แล้ว)
```

### ขั้นตอน (ทำทีละขั้น)

**ขั้นที่ 1 — deploy backend ก่อน (ยังไม่แตะ frontend)**
1. Apps Script editor → แทนที่โค้ดทั้งไฟล์ด้วย `backend/gas-backend.gs` (v1.1)
2. แก้ `SHEET_ID` ให้ตรงกับ Sheet ที่ใช้งานอยู่
3. รัน `initSheets()` → จะเพิ่มชีท `AuditLog` ถ้ายังไม่มี (ไม่ลบข้อมูลเดิม)
   - ⚠️ ถ้ามี admin row อยู่แล้ว `initSheets()` จะ **ไม่** สร้างใหม่ → รหัสเดิมยังใช้ได้
   - ถ้าอยาก reset admin: ลบ row admin ใน Users sheet ก่อนค่อยรัน `initSheets()`
4. รัน `migratePasswordsToHash()` **ครั้งเดียว** — จะแปลง password ทุก user เป็น hash
5. Deploy → **Manage deployments → Edit (ไอคอนดินสอ)** → **New version** → description `v1.1-security`
   - ⚠️ อย่ากด "New deployment" ใหม่ เพราะจะเปลี่ยน URL และ frontend ที่ตั้ง GAS_URL ไว้จะพัง

**ขั้นที่ 2 — ทดสอบ backend ก่อน deploy frontend**
ใน Apps Script editor → run function เหล่านี้ดู log:
- `handleLogin('admin', 'รหัสเดิม')` → ต้อง return `{ success: true, user: {...} }`
- `handleListCases('admin')` → ต้อง return `{ success: true, cases: [...] }`
- `handleGetCase('CASE_xxx', 'ชื่อ_ไม่_ใช่_เจ้าของ')` → ต้อง return `{ success: false, error: 'ไม่มีสิทธิ์...' }`

**ขั้นที่ 3 — deploy frontend**
ไฟล์ที่เปลี่ยน (v1.1):
- `js/api.js` — เพิ่ม `gasPost()`, ทุก call ส่ง `requester`
- `js/auth.js` — login ใช้ POST

วิธี deploy ขึ้นอยู่กับ hosting:
- **ถ้า host บน GAS** (HtmlService) — copy 3 ไฟล์นี้ไปทับใน Apps Script editor (ลาก เพิ่ม HTML file ใหม่) แล้ว Deploy → Edit → New version อีกครั้ง
- **ถ้า host บน server อื่น** (เช่น nginx, GitHub Pages) — upload ไฟล์ใน `js/` ทับของเดิม
- **ถ้า run local** (localhost:8080) — ไม่ต้อง deploy อะไร รันใหม่ก็เจอ

**ขั้นที่ 4 — smoke test บน production URL**
- Login admin ด้วยรหัสเดิม → สำเร็จ
- Dashboard → เห็นรายการคดีปกติ
- เปิดคดีเก่า → โหลดข้อมูลได้ครบ (ถ้า case ไม่โหลด = คดีเก่า createdBy ไม่ match admin → แก้ sheet)
- บันทึกคดีใหม่ → success
- ลอง login user อื่น → ไม่เห็นคดีของ admin
- ดู AuditLog sheet → มี rows เพิ่มทุก action

---

## Verification checklist

### Backend (ผ่าน Apps Script Executions log)
- [ ] `initSheets()` รัน success ไม่ error
- [ ] `migratePasswordsToHash()` log `migrated N users`
- [ ] Users sheet — ทุก row มี password ความยาว 64 ตัว (hex)
- [ ] AuditLog sheet มีอยู่จริงและ headers ถูกต้อง

### Frontend (บน browser devtools)
- [ ] Network tab → request login เป็น `POST` method, payload อยู่ใน body (ไม่ใช่ URL)
- [ ] Console ไม่มี error สีแดง
- [ ] กด F12 → Application → Local Storage — ถ้าเก่าเคย cache `password` อะไรไว้ ให้ clear

### Authorization (ใช้ 2 account)
- [ ] Login ด้วย admin → เห็นคดีทั้งหมด
- [ ] Login ด้วย user ธรรมดา → เห็นเฉพาะคดีที่ตัวเองสร้าง
- [ ] user ธรรมดาลองเปิดคดีของ admin ผ่าน URL `?caseId=...` — ต้องโดนปฏิเสธ (`ไม่มีสิทธิ์เข้าถึงคดีนี้`)
- [ ] user ธรรมดาลองลบคดีของ admin — ต้องโดนปฏิเสธเหมือนกัน

### AuditLog ครอบคลุม
- [ ] Login success / fail — log ครบ
- [ ] getCase / saveCase / deleteCase — log ครบ (success + denied)
- [ ] `result` column แยก `success` / `fail` / `denied` ชัดเจน

---

## Git tag (หลัง verify ผ่านครบ)

บน Windows PowerShell (ในโฟลเดอร์ project):

```powershell
# ครั้งแรกที่ยังไม่มี repo
powershell -ExecutionPolicy Bypass -File scripts\init-git.ps1

# หลัง verify ผ่าน — commit + tag
git add .
git commit -m "Security sprint v1.1: hash passwords, POST login, authz, audit log"
git tag -a v1.1-security -m "Security hardening per docs/review-2026-04-21.md"
git log --oneline
git tag -l -n1
```

ถ้าจะ push ขึ้น remote (optional):
```powershell
git remote add origin <URL>
git push -u origin main
git push origin v1.1-security
```

---

## Rollback plan (ถ้าพัง)

**Backend rollback**:
1. Apps Script → **Manage deployments → Edit → Version → เลือก version ก่อนหน้า**
2. Save — URL เดิมจะกลับไปชี้ v1.0

**Frontend rollback**:
- ใช้ `backups/index.original.html` (single-file pre-migration) + deploy แทน
- หรือ `git checkout v1.0-tag -- js/` ถ้า tag ไว้

**Database rollback**:
- Spreadsheet ที่ copy ไว้ตอน "ก่อนเริ่ม" — เปลี่ยน SHEET_ID กลับ (ต้อง deploy backend ใหม่อีกครั้ง)

---

## Known incompatibilities

- **v1.0 clients (ยังไม่อัปเดต)** จะเรียก `GET ?action=login` แล้ว backend v1.1 จะ reject ด้วย `Action นี้ต้องเรียกผ่าน POST` — ต้อง hard refresh (Ctrl+Shift+R) เพื่อโหลด js ใหม่
- **v1.0 password ที่ยังไม่ hash** — หลัง `migratePasswordsToHash()` แล้ว user เดิม login ด้วยรหัสเดิมได้ปกติ แต่ถ้าลืม run migrate → login จะเทียบ hash กับ plaintext → fail ทุกคน
- **คดีเก่าที่ createdBy เป็น null / ว่าง** — user ธรรมดาจะมองไม่เห็น (filter ตัดทิ้ง) — ต้องเป็น admin ถึงจะเห็น หรือแก้ sheet เติม createdBy

---

## ถ้าต้องการ deploy แบบ zero-downtime

1. Deploy backend version ใหม่ในสถานะ **Test deployment** (ไม่ใช่ production URL)
2. Test ทุก endpoint ด้วย test URL
3. ถ้าผ่าน — กลับไป Edit production deployment → เลือก version ที่ test ผ่าน → Save
4. Frontend: push ไฟล์ใหม่ขึ้น CDN/server (user ที่มี browser cache อาจต้องรอ 1-24 ชม. หรือ hard refresh)

---

## ขั้นถัดไป (หลัง v1.1-security ขึ้น production)

อ้างอิง `docs/แนวทางพัฒนาระบบ-Roadmap.md` + `docs/review-2026-04-21.md`:

- **Phase 2.2** — Rate limiting login (block หลัง fail 5 ครั้งต่อ 15 นาที)
- **Phase 2.3** — Admin UI: เปลี่ยนรหัสในแอป, จัดการ user, ดู AuditLog
- **Phase 2.4** — Session timeout (ออกอัตโนมัติหลัง idle 30 นาที)
- **Phase 3** — Migrate frontend เป็น Vue/React + build step ที่เหมาะกับการ bundle
