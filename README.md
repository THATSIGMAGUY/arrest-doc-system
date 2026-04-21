# ระบบจัดทำเอกสารหลังจับกุม/ควบคุมตัว (v2)

เว็บแอปพลิเคชันช่วยพนักงานสอบสวนจัดทำเอกสารหลังการจับกุม/ควบคุมตัว
สร้างด้วย HTML/CSS/JavaScript ล้วน (ไม่มี framework) พร้อมรองรับการทำงานแบบ PWA

## โครงสร้างโปรเจกต์

```
.
├── index.html              # หน้าหลักของแอป
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (รองรับใช้งานออฟไลน์)
│
├── css/
│   ├── style.css           # สไตล์หลัก (แก้ไขไฟล์นี้)
│   └── style.min.css       # เวอร์ชัน minified
│
├── js/                     # โมดูล JavaScript (โหลดตามลำดับใน index.html)
│   ├── config.js           #   1) ค่าคงที่ของระบบ
│   ├── state.js            #   2) จัดการสถานะแอป
│   ├── helpers.js          #   3) ฟังก์ชันช่วยเหลือทั่วไป
│   ├── auth.js             #   4) ระบบเข้าสู่ระบบ
│   ├── dashboard.js        #   5) หน้า Dashboard
│   ├── steps.js            #   6) ขั้นตอนกรอกเอกสาร
│   ├── modal.js            #   7) กล่องโต้ตอบ/ป็อปอัป
│   ├── documents.js        #   8) สร้าง/จัดการเอกสาร
│   ├── render.js           #   9) เรนเดอร์ UI
│   ├── api.js              #  10) เรียก Google Apps Script
│   └── app.js              #  11) จุดเริ่มต้นของแอป
│
├── assets/                 # รูปภาพ ไอคอน (ว่าง รอเพิ่ม)
│
├── prototypes/             # ต้นแบบ/หน้าทดสอบ
│   ├── prototype-arrest.html
│   ├── prototype-sec22.html
│   └── prototype-sec23.html
│
├── backend/
│   └── gas-backend.gs      # Google Apps Script (นำไปวางใน Apps Script)
│
├── scripts/
│   ├── start-server.ps1    # PowerShell local server
│   └── เปิดระบบ.bat          # Double-click เพื่อเปิดใช้งาน
│
├── docs/                   # เอกสารประกอบ
│   ├── สรุประบบจัดทำเอกสารหลังจับกุม.pptx
│   ├── แนวทางพัฒนาระบบ-Roadmap.md
│   ├── โพสต์แนะนำระบบ-Social-Media.md
│   └── โพสต์-Facebook-ปรับแก้.md
│
└── backups/                # ไฟล์สำรอง (เวอร์ชันก่อนแยกโมดูล)
    ├── index.original.html
    └── Index.html.txt
```

## วิธีใช้งาน

### เปิดระบบบน Windows (วิธีง่ายสุด)

ดับเบิลคลิกไฟล์ `scripts/เปิดระบบ.bat`
ระบบจะเปิด PowerShell local server ที่ `http://localhost:8080/` และเปิดเบราว์เซอร์ให้อัตโนมัติ

### รันด้วย PowerShell โดยตรง

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-server.ps1
```

### ทางเลือกอื่น (ใช้ Python)

```bash
# จากโฟลเดอร์ root ของโปรเจกต์
python -m http.server 8080
```
จากนั้นเปิด `http://localhost:8080/`

> ไม่แนะนำให้เปิด `index.html` ด้วยการดับเบิลคลิกตรง ๆ
> เพราะ Service Worker และการโหลด module บางส่วนต้องใช้โปรโตคอล `http://` ไม่ใช่ `file://`

## Backend (Google Apps Script)

ไฟล์ `backend/gas-backend.gs` ต้องนำไปวางใน Google Apps Script project
แล้ว deploy เป็น Web App เพื่อให้ `js/api.js` เรียกใช้งานได้
(ตั้งค่า URL ของ Web App ใน `js/config.js`)

## การพัฒนาต่อ

- ดู Roadmap: [`docs/แนวทางพัฒนาระบบ-Roadmap.md`](docs/แนวทางพัฒนาระบบ-Roadmap.md)
- เวอร์ชันก่อนแยกโมดูล: [`backups/index.original.html`](backups/index.original.html)
