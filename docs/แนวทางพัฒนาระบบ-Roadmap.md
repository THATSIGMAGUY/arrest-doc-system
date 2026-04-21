# แนวทางพัฒนา Web App ให้เป็นระบบ & Optimize
## ระบบจัดทำเอกสารหลังจับกุม — Development Roadmap

---

## สถานะปัจจุบัน (v1.0)

| หัวข้อ | สถานะ |
|--------|-------|
| Frontend | Single HTML file (~2,250 บรรทัด / 140KB) รวม HTML + CSS + JS ไว้ในไฟล์เดียว |
| Backend | Google Apps Script (GAS) |
| Database | Google Sheets (2 ชีต: Users, Cases) |
| Hosting | GitHub Pages (static) + Local Server (.bat) |
| Auth | Username/Password เก็บใน Google Sheets (plaintext) |
| Framework | ไม่มี — Vanilla JS ล้วน |

**จุดแข็ง:** ง่าย deploy ง่าย ไม่มีค่าใช้จ่าย ใช้ได้เลย
**จุดที่ควรปรับ:** โค้ดรวมก้อนเดียว ยากต่อการ maintain, ไม่มี security จริงจัง, ไม่ scale

---

## Phase 1: จัดระเบียบโค้ด (ทำได้เลย ไม่เสียตัง)

### 1.1 แยกไฟล์ CSS / JS ออกจาก HTML

ตอนนี้ทุกอย่างอยู่ใน index.html เดียว 2,250 บรรทัด ถ้าจะแก้อะไรสักจุดต้องเลื่อนหานาน

```
โครงสร้างที่แนะนำ:
├── index.html          ← โครงสร้าง HTML อย่างเดียว
├── css/
│   └── style.css       ← CSS ทั้งหมด
├── js/
│   ├── app.js          ← Logic หลัก (stepper, navigation)
│   ├── api.js          ← gasCall(), การเชื่อมต่อ backend
│   ├── documents.js    ← สร้างเอกสาร (บันทึกจับกุม, ม.22, ม.23)
│   ├── camera.js       ← ถ่ายรูป, จัดการรูปภาพ
│   ├── signature.js    ← ลายเซ็นดิจิทัล
│   └── utils.js        ← ฟังก์ชันทั่วไป (format วันที่, แปลงข้อมูล)
├── assets/
│   └── logo.png
└── gas-backend.gs      ← สำเนา Backend
```

**ทำไมต้องทำ:** แก้ไขง่ายขึ้น 10 เท่า, หลายคนทำงานพร้อมกันได้, debug ง่าย

**ข้อควรระวัง:** GitHub Pages รองรับหลายไฟล์ปกติ แต่ถ้าใช้ เปิดระบบ.bat แบบ local server ก็ยังทำงานได้เหมือนเดิม เพราะ start-server.ps1 serve ทุกไฟล์ในโฟลเดอร์อยู่แล้ว

### 1.2 ใช้ Git อย่างเป็นระบบ

```
สิ่งที่ควรทำ:
- สร้าง .gitignore (ไม่ commit ไฟล์ส่วนตัว)
- ตั้ง branch strategy:
    main     → เวอร์ชันที่ใช้งานจริง (GitHub Pages deploy จากนี่)
    develop  → ตัวพัฒนา
    feature/ → แต่ละ feature ใหม่ เช่น feature/ocr-scan
- เขียน commit message เป็นภาษาไทยหรืออังกฤษก็ได้ แต่ให้สื่อความหมาย
```

### 1.3 เพิ่ม Environment Config

แยก config ออกจากโค้ด เช่น GAS_URL ไม่ควร hardcode ในไฟล์

```javascript
// config.js
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/xxx/exec',
    APP_VERSION: '1.0',
    MAX_SUSPECTS: 20,
    PHOTO_QUALITY: 0.7
};
```

---

## Phase 2: ปรับปรุง Backend & ความปลอดภัย (สำคัญมาก)

### 2.1 เข้ารหัส Password

ตอนนี้ password เก็บเป็น plaintext ใน Google Sheets ใครเปิดดูก็เห็นหมด

```
แนวทาง:
- ใช้ SHA-256 hash password ก่อนเก็บ
- เปลี่ยน handleLogin() ให้เปรียบเทียบ hash แทน plaintext
- ฝั่ง Frontend: hash password ก่อนส่งไป backend

ตัวอย่างโค้ด GAS:
function hashPassword(password) {
    var hash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256, 
        password
    );
    return hash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}
```

### 2.2 เพิ่ม Session / Token

ตอนนี้ระบบเก็บ user info ใน JavaScript memory ถ้า refresh หน้าก็ต้อง login ใหม่

```
แนวทาง:
- สร้าง Token (UUID) เมื่อ login สำเร็จ
- เก็บ token ใน sessionStorage (หายเมื่อปิด tab)
- ทุก API call ส่ง token ไปด้วย
- Backend ตรวจ token ก่อนทำงาน
```

### 2.3 หน้า Admin Panel

เพิ่มหน้าจัดการผู้ใช้ในระบบ แทนที่จะต้องไปแก้ Google Sheets เอง

```
ฟีเจอร์:
- ดูรายชื่อผู้ใช้ทั้งหมด
- เพิ่มผู้ใช้ใหม่
- แก้ไข / Reset password
- เปิด-ปิดสิทธิ์การใช้งาน
- ดู Log การเข้าใช้
```

### 2.4 Input Validation ทั้ง Frontend & Backend

```
ตอนนี้:  validate เฉพาะฝั่ง Frontend
ที่ควรทำ: validate ซ้ำที่ Backend ด้วยเสมอ

ตัวอย่าง:
- เลขบัตรประชาชน: ตรวจ 13 หลัก + check digit
- เบอร์โทร: ตรวจ format 0xx-xxx-xxxx
- วันที่: ตรวจว่าไม่ใช่อนาคต
- ชื่อ-สกุล: ไม่ว่าง, ไม่มีอักขระพิเศษ
```

---

## Phase 3: ยกระดับ Tech Stack (เมื่อพร้อม)

### 3.1 ทางเลือก Frontend Framework

| ตัวเลือก | เหมาะกับ | ข้อดี | ข้อเสีย |
|-----------|---------|-------|---------|
| **Vanilla JS (ปัจจุบัน)** | ทีมเล็ก, โปรเจกต์เล็ก | ง่าย ไม่ต้องเรียนเพิ่ม | โค้ดยุ่งเมื่อโตขึ้น |
| **Vue.js** (แนะนำ) | ผู้เริ่มต้น, โปรเจกต์ขนาดกลาง | เรียนง่ายที่สุด, เอกสารดี, ค่อยๆ adopt ได้ | community เล็กกว่า React |
| **React** | โปรเจกต์ใหญ่, ทีมใหญ่ | community ใหญ่, งานเยอะ | learning curve สูงกว่า |
| **SvelteKit** | ต้องการความเร็ว | เร็วมาก, โค้ดน้อย | community ยังเล็ก |

**คำแนะนำ:** ถ้าจะเริ่มเรียน framework แนะนำ **Vue.js** เพราะ syntax ใกล้เคียง HTML ปกติที่พี่เขียนอยู่แล้ว ค่อยๆ แปลงทีละส่วนได้ ไม่ต้อง rewrite ทั้งหมด

### 3.2 ทางเลือก Backend (แทน Google Apps Script)

| ตัวเลือก | ค่าใช้จ่าย | ข้อดี | ข้อเสีย |
|-----------|-----------|-------|---------|
| **Google Apps Script (ปัจจุบัน)** | ฟรี | ง่าย, เชื่อม Sheets ตรง | ช้า, มี quota จำกัด |
| **Supabase** (แนะนำ) | ฟรี (tier เริ่มต้น) | PostgreSQL จริง, Auth มาให้, API อัตโนมัติ | ต้องเรียน SQL |
| **Firebase** | ฟรี (tier เริ่มต้น) | Realtime, Auth ครบ, Google ecosystem | NoSQL ซับซ้อน |
| **Node.js + Railway/Render** | ฟรี (tier เริ่มต้น) | ยืดหยุ่นสุด | ต้องดูแล server เอง |

**คำแนะนำ:** ถ้าอยากอัพเกรดจาก Google Sheets แนะนำ **Supabase** เพราะ:
- ได้ Database จริง (PostgreSQL) ไม่จำกัด 10 ล้านเซลล์แบบ Sheets
- มีระบบ Auth (Login) มาให้เลย ไม่ต้องเขียนเอง
- มี Row Level Security (user เห็นเฉพาะข้อมูลตัวเอง) built-in
- มี free tier ใช้ได้สบายๆ สำหรับทีมเล็ก
- มี Dashboard จัดการข้อมูลสวยงาม

### 3.3 ทางเลือก Database

```
Google Sheets (ปัจจุบัน)
├── ข้อจำกัด: 10 ล้านเซลล์, ช้าเมื่อข้อมูลเยอะ, ไม่มี index
├── เหมาะกับ: < 1,000 คดี, ทีม < 10 คน
│
├── อัพเกรดเป็น →
│
├── Supabase (PostgreSQL)
│   ├── ข้อมูลไม่จำกัด, query เร็ว, มี index
│   ├── เหมาะกับ: ทุกขนาด
│   └── ฟรี: 500MB storage, 50,000 rows
│
└── Firebase Firestore
    ├── Realtime sync, offline support
    ├── เหมาะกับ: ต้องการ realtime
    └── ฟรี: 1GB storage, 50,000 reads/วัน
```

---

## Phase 4: ฟีเจอร์ใหม่ (Roadmap)

### 4.1 OCR สแกนบัตรประชาชน (Feature ถัดไปที่วางไว้)

```
เทคโนโลยีที่ใช้ได้:
1. Tesseract.js    — ฟรี, ทำงานใน Browser, รองรับภาษาไทย
2. Google Vision API — แม่นยำกว่า, มี free tier 1,000 ครั้ง/เดือน
3. LINE CLOVA OCR  — เก่งภาษาไทย, API ราคาถูก

แนวทางพัฒนา:
- ถ่ายรูปบัตรประชาชน → OCR อ่านข้อมูล
- ดึง: ชื่อ-สกุล, เลขบัตร 13 หลัก, ที่อยู่, วันเกิด
- เติมลงฟอร์มอัตโนมัติ → ผู้ใช้ตรวจสอบ → ยืนยัน
```

### 4.2 หน้า Admin Panel

```
- จัดการผู้ใช้ (CRUD)
- ดู Log การเข้าใช้งาน
- ตั้งค่าระบบ
```

### 4.3 Dashboard สถิติ

```
- จำนวนคดีรายวัน/เดือน/ปี
- แยกตามประเภทคดี, พื้นที่, เจ้าหน้าที่
- กราฟ trend
- Export รายงานสถิติ
- ใช้ Chart.js หรือ Recharts สร้างกราฟ
```

### 4.4 Offline Mode (PWA)

```
- ทำเอกสารได้แม้ไม่มีเน็ต (สำคัญมากตอนออกพื้นที่)
- เก็บข้อมูลใน IndexedDB บนเครื่อง
- Sync ขึ้น Cloud เมื่อมีเน็ต
- ติดตั้งเป็น App บนมือถือได้เลย (Add to Home Screen)
```

### 4.5 Template เอกสารเพิ่มเติม

```
- บันทึกตรวจค้น
- บันทึกการสอบสวน
- หมายเรียก / หมายจับ
- รายงานประจำวัน
```

---

## ลำดับความสำคัญที่แนะนำ

```
ทำเลย (ไม่เสียตัง, คุ้มค่าสุด)
│
├── 1. แยกไฟล์ CSS/JS (Phase 1.1)        — ลดปวดหัว maintain
├── 2. Hash password (Phase 2.1)          — ปิดช่องโหว่ความปลอดภัย
├── 3. Admin Panel (Phase 2.3)            — แจก user ง่ายขึ้น
├── 4. Input Validation (Phase 2.4)       — ลดข้อมูลผิดพลาด
│
ทำเร็วๆ นี้ (ตามที่วางแผนไว้)
│
├── 5. OCR สแกนบัตร (Phase 4.1)          — Feature ที่วางไว้แล้ว
├── 6. Environment Config (Phase 1.3)     — ง่ายต่อ deploy
│
เมื่อพร้อม (อัพเกรดใหญ่)
│
├── 7. ย้ายไป Supabase (Phase 3.2-3.3)   — Database จริง
├── 8. Dashboard สถิติ (Phase 4.3)        — ข้อมูลเชิงวิเคราะห์
├── 9. Offline / PWA (Phase 4.4)          — ใช้งานได้ทุกสถานการณ์
└── 10. Vue.js rewrite (Phase 3.1)        — เมื่อระบบซับซ้อนขึ้น
```

---

## เครื่องมือที่แนะนำให้เริ่มใช้

| เครื่องมือ | ทำอะไร | ราคา |
|-----------|--------|------|
| **VS Code** | เขียนโค้ด (ดีกว่า Notepad มาก) | ฟรี |
| **GitHub Desktop** | จัดการ Git แบบ GUI ไม่ต้องพิมพ์ command | ฟรี |
| **Chrome DevTools** | Debug, ดู Console, ทดสอบ mobile | ฟรี (มากับ Chrome) |
| **Postman** | ทดสอบ API (GAS endpoints) | ฟรี |
| **Claude / AI** | ช่วยเขียนโค้ด, debug, ออกแบบ | มี free tier |

---

---

## เส้นทางการเรียนรู้ (Learning Path)

สำหรับคนที่ไม่ได้มาสาย Dev โดยตรง แนะนำเรียนตามลำดับนี้ครับ แต่ละขั้นต่อยอดจากขั้นก่อนหน้า ไม่ต้องรีบ ค่อยๆ ไปได้

### ขั้นที่ 1: ปูพื้นฐานให้แน่น (1-2 เดือน)

พี่เขียน HTML/CSS/JS ได้แล้วในระดับหนึ่ง ขั้นนี้คือเสริมความเข้าใจให้ลึกขึ้น

**HTML & CSS**
- เรียนเรื่อง Flexbox และ CSS Grid ให้คล่อง (จัด layout ได้ทุกรูปแบบ)
- Responsive Design — ทำให้เว็บสวยทั้งบนมือถือและ Desktop
- แหล่งเรียน: "freeCodeCamp.org" (ฟรี, มีภาษาไทย บางส่วน)
- ฝึก: ลองจัด layout หน้า Login ใหม่ด้วย Flexbox แทน

**JavaScript ให้เข้าใจจริงๆ**
- ต้องเข้าใจ: let/const, Arrow Function, Template Literals
- Array methods: map(), filter(), find(), reduce() — ใช้จัดการข้อมูลได้ทุกรูปแบบ
- Async/Await & Promise — เข้าใจเรื่อง asynchronous (ที่ใช้ใน gasCall() อยู่แล้ว)
- DOM Manipulation — ที่ใช้อยู่ เช่น document.getElementById()
- แหล่งเรียน: "javascript.info" (ดีที่สุดสำหรับ JS, ฟรี, อ่านเป็นบทๆ)
- ฝึก: ลอง refactor ฟังก์ชันในระบบให้ใช้ Arrow Function และ Array methods

**Git & GitHub**
- พื้นฐาน: clone, add, commit, push, pull
- Branch & Merge — ทำงานหลาย feature พร้อมกันโดยไม่พัง
- Pull Request — review โค้ดก่อน merge
- แหล่งเรียน: "GitHub Skills" (learn.microsoft.com/training) — ฝึกใน browser ได้เลย
- ฝึก: สร้าง repo ให้โปรเจกต์นี้ ลอง commit ทุกครั้งที่แก้โค้ด

### ขั้นที่ 2: พัฒนา Backend ให้เข้มแข็ง (2-3 เดือน)

**Google Apps Script ให้ลึกขึ้น**
- เข้าใจ doGet() / doPost() / ContentService
- Triggers (onEdit, onOpen, time-based) — ทำงานอัตโนมัติ
- Libraries — ใช้โค้ดร่วมกันระหว่างโปรเจกต์
- แหล่งเรียน: "developers.google.com/apps-script" (official docs)
- ฝึก: เพิ่ม Trigger ให้ส่ง email แจ้งเตือนเมื่อมีคดีใหม่

**REST API Concepts**
- เข้าใจ HTTP Methods: GET, POST, PUT, DELETE
- Status Codes: 200, 400, 401, 404, 500
- JSON format — ที่ใช้ส่งข้อมูลระหว่าง Frontend กับ Backend
- CORS — เข้าใจว่าทำไม file:// ถึง fetch ไม่ได้ (เจอไปแล้ว!)
- แหล่งเรียน: "MDN Web Docs — HTTP" (developer.mozilla.org)
- ฝึก: ลองใช้ Postman ยิง API ไปที่ GAS endpoint ดูผลลัพธ์

**ความปลอดภัยเบื้องต้น (Web Security)**
- Password Hashing — ทำไมห้ามเก็บ plaintext
- HTTPS — ทำไม GitHub Pages ถึงปลอดภัยกว่า HTTP
- Input Sanitization — ป้องกัน XSS, SQL Injection
- Authentication vs Authorization — ต่างกันยังไง
- แหล่งเรียน: "OWASP Top 10" (owasp.org) — 10 ช่องโหว่ที่พบบ่อยที่สุด

### ขั้นที่ 3: เริ่มใช้ Framework (3-4 เดือน)

**Vue.js (แนะนำเป็นตัวแรก)**
- ทำไม Vue: syntax คล้าย HTML ที่พี่เขียนอยู่, เอกสารเป็นภาษาไทยมี, เรียนง่ายที่สุดในสาม framework หลัก
- เริ่มจาก: Vue 3 Composition API
- เรียนตามลำดับ:
  1. Template Syntax & Data Binding
  2. Components — แยกส่วน UI เป็นชิ้นๆ
  3. Props & Events — ส่งข้อมูลระหว่าง component
  4. Vue Router — จัดการหลายหน้า
  5. Pinia (State Management) — จัดการข้อมูลส่วนกลาง
- แหล่งเรียน: "vuejs.org/tutorial" (official, interactive, ทำใน browser ได้เลย)
- ฝึก: ลอง rewrite หน้า Login ด้วย Vue ก่อน แล้วค่อยขยายไปส่วนอื่น

**Tailwind CSS**
- ทำไม: เขียน CSS เร็วขึ้น 5 เท่า ไม่ต้องตั้งชื่อ class เอง
- ใช้คู่กับ Vue ได้เลย
- แหล่งเรียน: "tailwindcss.com/docs" — ดู class ที่ต้องการแล้วใช้ได้เลย

**Build Tools**
- Vite — tool สร้างโปรเจกต์ Vue (เร็วมาก)
- npm — จัดการ library/package
- แหล่งเรียน: "vitejs.dev/guide" — เรียนคู่ไปกับ Vue

### ขั้นที่ 4: Database จริง & Deploy มืออาชีพ (4-6 เดือน)

**SQL & Supabase**
- SQL พื้นฐาน: SELECT, INSERT, UPDATE, DELETE, JOIN
- Supabase: สร้างตาราง, ตั้ง Row Level Security, ใช้ API
- แหล่งเรียน: "sqlbolt.com" (interactive SQL tutorial, ฟรี) แล้วต่อด้วย "supabase.com/docs"
- ฝึก: ลองสร้างตาราง Cases ใน Supabase แล้ว query ดู

**Deployment & DevOps เบื้องต้น**
- Vercel / Netlify — deploy frontend (ฟรี, ง่ายกว่า GitHub Pages)
- CI/CD — push โค้ดแล้ว deploy อัตโนมัติ
- Custom Domain — ใช้โดเมนของตัวเอง เช่น arrest-doc.police.go.th
- แหล่งเรียน: "vercel.com/docs" — deploy Vue app ได้ใน 5 นาที

**PWA (Progressive Web App)**
- Service Worker — ทำงาน offline ได้
- Cache Strategy — เก็บข้อมูลบนเครื่อง
- Manifest — ติดตั้งเป็น App บนมือถือ
- แหล่งเรียน: "web.dev/learn/pwa" (by Google, ฟรี)

### ขั้นที่ 5: ทักษะเสริมที่มีประโยชน์มาก

**AI / Machine Learning for OCR**
- Tesseract.js — OCR ใน Browser
- Google Cloud Vision API — OCR แม่นยำสูง
- TensorFlow.js — รัน AI model ใน Browser
- แหล่งเรียน: "github.com/naptha/tesseract.js" — เริ่มจากตัวอย่าง

**UX/UI Design**
- หลักการออกแบบ UI ให้ใช้ง่าย
- สี, Typography, Layout
- แหล่งเรียน: "lawsofux.com" — กฎ UX ที่ควรรู้ อ่านจบภายใน 1 ชั่วโมง
- เครื่องมือ: Figma (ฟรี) — ออกแบบ mockup ก่อนเขียนโค้ด

**Testing**
- ทำไมต้อง test: เพิ่ม feature ใหม่โดยไม่พังของเก่า
- Unit Test, Integration Test
- แหล่งเรียน: เริ่มจาก Vitest (ใช้คู่กับ Vue/Vite)

---

## สรุป Timeline รวม

```
เดือน 1-2:   ปูพื้น JS + Git
              → แยกไฟล์โปรเจกต์ + จัดการด้วย Git
                                                    
เดือน 2-3:   Backend + Security
              → Hash password + Admin Panel + Validation
                                                    
เดือน 3-4:   เรียน Vue.js + Tailwind
              → เริ่ม rewrite ทีละส่วน
                                                    
เดือน 4-5:   OCR Feature + SQL
              → สแกนบัตร ปชช. + ทดลอง Supabase
                                                    
เดือน 5-6:   Deploy + PWA
              → ระบบครบวงจร ใช้ offline ได้
```

**สิ่งสำคัญที่สุด:** ไม่ต้องเรียนให้ครบทุกอย่างก่อนแล้วค่อยทำ ให้เรียนไป ทำไป สลับกัน เรียน concept แล้วลองกับโปรเจกต์จริงของพี่เลย จะเข้าใจเร็วกว่าเรียนอย่างเดียวเยอะมากครับ

---

*จัดทำสำหรับ ร.ต.อ.มาตรา จิตรธนภัทร์ — เมษายน 2568*
