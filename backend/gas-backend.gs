/**
 * Arrest Documentation System — Google Sheets Backend
 * Version: 1.1-security (2026-04-21)
 *
 * SETUP INSTRUCTIONS:
 * 1. สร้าง Google Spreadsheet ใหม่
 * 2. คัดลอกโค้ดนี้ไปที่ Extensions > Apps Script
 * 3. แก้ไข SHEET_ID ให้เป็น ID ของ Spreadsheet (จาก URL)
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. คัดลอก URL ที่ได้ไปใส่ในไฟล์ js/config.js (ค่า GAS_URL)
 * 6. เข้า Apps Script editor → รันฟังก์ชัน initSheets() หนึ่งครั้ง
 *    แล้วดู Logs (View > Logs) เพื่อคัดลอกรหัสผ่าน admin รอบแรก
 *    (รหัสนี้จะปรากฏครั้งเดียวเท่านั้น ให้เปลี่ยนหลัง login ผ่าน Admin Panel)
 *
 * SECURITY NOTES (v1.1):
 * - Passwords ถูกเก็บเป็น SHA-256 hash (ไม่ใช่ plaintext)
 * - Login ส่งผ่าน POST body (ไม่ใช่ URL query) เพื่อกัน leak
 * - มี Authorization check: user เห็น/แก้/ลบได้เฉพาะคดีของตัวเอง (ยกเว้น admin)
 * - มี AuditLog sheet บันทึกทุก action (login, read, write, delete)
 *
 * MIGRATION จาก v1.0:
 * ถ้าเคยใช้ v1.0 (password plaintext) ให้รัน migratePasswordsToHash() ใน
 * Apps Script editor หนึ่งครั้ง เพื่อแปลงรหัสผ่านเดิมเป็น hash
 */

// Configuration - User sets their Sheet ID here
const SHEET_ID = '13xieHsmINpK2tfg0w1qmR0h0IGXXtrvKhvxv5ha8arw';

// Sheet names and headers configuration
const SHEETS_CONFIG = {
  Users: {
    headers: ['username', 'password', 'displayName', 'rank', 'unit', 'role']
    // defaultData ถูกสร้าง dynamically ใน initSheets() ด้วย password แบบสุ่ม
  },
  Cases: {
    headers: ['caseId', 'createdBy', 'createdAt', 'updatedAt', 'status', 'suspectNames', 'accusation', 'location', 'caseData']
  },
  AuditLog: {
    headers: ['timestamp', 'username', 'action', 'target', 'result', 'detail']
  }
};

// ===================================================================
// API routing
// ===================================================================

/**
 * Universal API handler — เรียกโดย google.script.run เมื่อ host บน GAS
 */
function gasApi(action, params) {
  initSheets();
  params = params || {};
  return _dispatch(action, params);
}

/**
 * GET handler — serves HTML at root, handles read-only actions with ?action=
 * Write/credentialed actions (login, saveCase, deleteCase, addUser) ต้องใช้ POST
 */
function doGet(e) {
  if (!e.parameter || !e.parameter.action) {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('ระบบจัดทำเอกสารหลังจับกุม')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  try {
    initSheets();
    const action = e.parameter.action;

    // อนุญาต GET เฉพาะ action ที่ไม่มี credentials/การเปลี่ยน state
    const GET_ALLOWED = ['listCases', 'getCase', 'listUsers'];
    if (GET_ALLOWED.indexOf(action) === -1) {
      return _respond({ success: false, error: 'Action นี้ต้องเรียกผ่าน POST: ' + action });
    }

    return _respond(_dispatch(action, e.parameter));
  } catch(err) {
    return _respond({ success: false, error: 'Server error' });
  }
}

/**
 * POST handler — รับ JSON body (text/plain content-type เพื่อเลี่ยง CORS preflight)
 * Body format: { action: 'login', username: '...', password: '...', requester: '...' }
 */
function doPost(e) {
  try {
    initSheets();
    const data = JSON.parse(e.postData.contents);
    return _respond(_dispatch(data.action, data));
  } catch(err) {
    return _respond({ success: false, error: 'Server error' });
  }
}

/**
 * Internal dispatch — รวมทุก action ไว้ที่เดียว
 */
function _dispatch(action, params) {
  params = params || {};
  switch (action) {
    case 'login':       return handleLogin(params.username, params.password);
    case 'listCases':   return handleListCases(params.user || params.requester);
    case 'getCase':     return handleGetCase(params.caseId, params.requester);
    case 'saveCase':    return handleSaveCase(params);
    case 'deleteCase':  return handleDeleteCase(params.caseId, params.requester);
    case 'listUsers':   return handleListUsers(params.requester);
    case 'addUser':     return handleAddUser(params);
    default:            return { success: false, error: 'Unknown action: ' + action };
  }
}

function _respond(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================
// Sheet bootstrap
// ===================================================================

function initSheets() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

  // Users sheet — สร้างครั้งแรก + สุ่ม password admin
  if (!getSheet(spreadsheet, 'Users')) {
    const usersSheet = spreadsheet.insertSheet('Users');
    usersSheet.appendRow(SHEETS_CONFIG.Users.headers);

    const initialPassword = _generateRandomPassword(16);
    const hashed = hashPassword(initialPassword);
    usersSheet.appendRow(['admin', hashed, 'ผู้ดูแลระบบ', '', '', 'admin']);

    Logger.log('================================================');
    Logger.log('  INITIAL ADMIN PASSWORD (เก็บไว้ให้ดี!):');
    Logger.log('  username: admin');
    Logger.log('  password: ' + initialPassword);
    Logger.log('  รหัสนี้จะปรากฏครั้งเดียวเท่านั้น เปลี่ยนหลัง login');
    Logger.log('================================================');
  }

  if (!getSheet(spreadsheet, 'Cases')) {
    const casesSheet = spreadsheet.insertSheet('Cases');
    casesSheet.appendRow(SHEETS_CONFIG.Cases.headers);
  }

  if (!getSheet(spreadsheet, 'AuditLog')) {
    const logSheet = spreadsheet.insertSheet('AuditLog');
    logSheet.appendRow(SHEETS_CONFIG.AuditLog.headers);
  }
}

function getSheet(spreadsheet, name) {
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() === name) return sheets[i];
  }
  return null;
}

function rowToObject(sheet, rowIndex) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const obj = {};
  for (let i = 0; i < headers.length; i++) obj[headers[i]] = values[i];
  return obj;
}

// ===================================================================
// Security helpers
// ===================================================================

/**
 * SHA-256 hash helper — คืนค่า hex string ความยาว 64
 */
function hashPassword(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password),
    Utilities.Charset.UTF_8
  );
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] & 0xFF;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

function _generateRandomPassword(length) {
  // ใช้อักขระที่อ่านง่าย (ไม่มี 0/O/1/l/I เพื่อลดความสับสน)
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

/**
 * หาผู้ใช้จาก username — คืน object (username, displayName, rank, unit, role, password) หรือ null
 */
function getUserByUsername(username) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = getSheet(spreadsheet, 'Users');
  if (!usersSheet) return null;
  const lastRow = usersSheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    const row = rowToObject(usersSheet, i);
    if (String(row.username) === String(username)) return row;
  }
  return null;
}

function isUserAdmin(username) {
  const user = getUserByUsername(username);
  return !!(user && String(user.role).toLowerCase() === 'admin');
}

/**
 * บันทึก action ทุกครั้งที่มีการอ่าน/เขียน/ลบข้อมูล (PDPA accountability)
 */
function logAction(username, action, target, result, detail) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = getSheet(spreadsheet, 'AuditLog');
    if (!logSheet) return;
    logSheet.appendRow([
      new Date().toISOString(),
      username || '(anonymous)',
      action || '',
      target || '',
      result || '',
      detail || ''
    ]);
  } catch(e) {
    // Log ไม่ควร throw ให้กระทบ main flow
  }
}

// ===================================================================
// Authentication
// ===================================================================

/**
 * Handler: Login — เปรียบเทียบ password hash
 * หมายเหตุ: รองรับ backward-compat — ถ้า password ใน sheet ยังเป็น plaintext
 * (ความยาวไม่ใช่ 64 chars ของ hex) ให้เปรียบเทียบแบบเดิมและบอกให้รัน migrate
 */
function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, error: 'กรุณากรอก username และ password' };
  }

  const user = getUserByUsername(username);
  if (!user) {
    logAction(username, 'login', 'auth', 'fail', 'user not found');
    return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  const stored = String(user.password);
  const hashed = hashPassword(password);

  let ok = false;
  if (stored.length === 64 && /^[0-9a-f]{64}$/.test(stored)) {
    // Hashed
    ok = (stored === hashed);
  } else {
    // Plaintext (v1.0 data) — ยอมรับแบบชั่วคราว แต่เตือน
    ok = (stored === String(password));
    if (ok) {
      logAction(username, 'login', 'auth', 'success-legacy',
                'password ยังเป็น plaintext — รัน migratePasswordsToHash()');
    }
  }

  if (!ok) {
    logAction(username, 'login', 'auth', 'fail', 'wrong password');
    return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  logAction(username, 'login', 'auth', 'success', '');
  return {
    success: true,
    user: {
      username: user.username,
      displayName: user.displayName,
      rank: user.rank,
      unit: user.unit,
      role: user.role
    }
  };
}

// ===================================================================
// Case handlers (ทุกฟังก์ชันรับ requester เพื่อตรวจสิทธิ์)
// ===================================================================

function handleListCases(username) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const casesSheet = getSheet(spreadsheet, 'Cases');
  if (!casesSheet) return { success: false, error: 'ไม่พบแผ่นข้อมูล' };

  const isAdmin = isUserAdmin(username);
  const casesList = [];
  const lastRow = casesSheet.getLastRow();

  for (let i = 2; i <= lastRow; i++) {
    const caseRow = rowToObject(casesSheet, i);
    if (!isAdmin && caseRow.createdBy !== username) continue;
    casesList.push({
      caseId: caseRow.caseId,
      createdBy: caseRow.createdBy,
      createdAt: caseRow.createdAt,
      updatedAt: caseRow.updatedAt,
      status: caseRow.status,
      suspectNames: caseRow.suspectNames,
      accusation: caseRow.accusation,
      location: caseRow.location
    });
  }

  logAction(username, 'listCases', '', 'success', 'returned ' + casesList.length);
  return { success: true, cases: casesList };
}

/**
 * getCase — แก้ response shape เป็น flat (แก้บั๊ก api.js:124)
 * ตอนนี้คืน { success, caseId, createdBy, ..., caseData } ตรง ๆ
 * (ก่อนหน้านี้คืน { success, case: {...} } ทำให้ frontend อ่านไม่เจอ)
 */
function handleGetCase(caseId, requester) {
  if (!caseId) return { success: false, error: 'caseId ว่าง' };

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const casesSheet = getSheet(spreadsheet, 'Cases');
  if (!casesSheet) return { success: false, error: 'ไม่พบแผ่นข้อมูล' };

  const lastRow = casesSheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    const caseRow = rowToObject(casesSheet, i);
    if (caseRow.caseId !== caseId) continue;

    // Authorization: เจ้าของคดีหรือ admin เท่านั้น
    const isAdmin = isUserAdmin(requester);
    if (!isAdmin && caseRow.createdBy !== requester) {
      logAction(requester, 'getCase', caseId, 'denied', 'not owner');
      return { success: false, error: 'ไม่มีสิทธิ์เข้าถึงคดีนี้' };
    }

    let caseData = {};
    try { caseData = JSON.parse(caseRow.caseData); }
    catch(e) { caseData = caseRow.caseData; }

    logAction(requester, 'getCase', caseId, 'success', '');
    return {
      success: true,
      caseId: caseRow.caseId,
      createdBy: caseRow.createdBy,
      createdAt: caseRow.createdAt,
      updatedAt: caseRow.updatedAt,
      status: caseRow.status,
      suspectNames: caseRow.suspectNames,
      accusation: caseRow.accusation,
      location: caseRow.location,
      caseData: caseData
    };
  }

  logAction(requester, 'getCase', caseId, 'fail', 'not found');
  return { success: false, error: 'ไม่พบคดี' };
}

function handleSaveCase(data) {
  const requester = data.user || data.requester || '';
  if (!requester) return { success: false, error: 'ต้องระบุ user' };

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const casesSheet = getSheet(spreadsheet, 'Cases');
  if (!casesSheet) return { success: false, error: 'ไม่พบแผ่นข้อมูล' };

  const now = new Date().toISOString();
  const caseDataJson = JSON.stringify(data.caseData);

  // Update existing case
  if (data.caseId) {
    const lastRow = casesSheet.getLastRow();
    for (let i = 2; i <= lastRow; i++) {
      const caseRow = rowToObject(casesSheet, i);
      if (caseRow.caseId !== data.caseId) continue;

      // Authorization: เจ้าของเดิมหรือ admin
      const isAdmin = isUserAdmin(requester);
      if (!isAdmin && caseRow.createdBy !== requester) {
        logAction(requester, 'saveCase', data.caseId, 'denied', 'not owner');
        return { success: false, error: 'ไม่มีสิทธิ์แก้ไขคดีนี้' };
      }

      const range = casesSheet.getRange(i, 1, 1, 9);
      range.setValues([[
        data.caseId,
        caseRow.createdBy, // keep original creator
        caseRow.createdAt,
        now,
        data.status,
        data.suspectNames,
        data.accusation,
        data.location,
        caseDataJson
      ]]);

      logAction(requester, 'saveCase', data.caseId, 'success', 'update');
      return { success: true, caseId: data.caseId };
    }

    logAction(requester, 'saveCase', data.caseId, 'fail', 'not found');
    return { success: false, error: 'ไม่พบคดีที่ต้องการแก้ไข' };
  }

  // Create new case
  const newCaseId = 'CASE_' + Date.now();
  casesSheet.appendRow([
    newCaseId,
    requester,
    now,
    now,
    data.status,
    data.suspectNames,
    data.accusation,
    data.location,
    caseDataJson
  ]);

  logAction(requester, 'saveCase', newCaseId, 'success', 'create');
  return { success: true, caseId: newCaseId };
}

function handleDeleteCase(caseId, requester) {
  if (!caseId) return { success: false, error: 'caseId ว่าง' };
  if (!requester) return { success: false, error: 'ต้องระบุ requester' };

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const casesSheet = getSheet(spreadsheet, 'Cases');
  if (!casesSheet) return { success: false, error: 'ไม่พบแผ่นข้อมูล' };

  const lastRow = casesSheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    const caseRow = rowToObject(casesSheet, i);
    if (caseRow.caseId !== caseId) continue;

    const isAdmin = isUserAdmin(requester);
    if (!isAdmin && caseRow.createdBy !== requester) {
      logAction(requester, 'deleteCase', caseId, 'denied', 'not owner');
      return { success: false, error: 'ไม่มีสิทธิ์ลบคดีนี้' };
    }

    casesSheet.deleteRow(i);
    logAction(requester, 'deleteCase', caseId, 'success', '');
    return { success: true };
  }

  logAction(requester, 'deleteCase', caseId, 'fail', 'not found');
  return { success: false, error: 'ไม่พบคดี' };
}

// ===================================================================
// User management (admin only)
// ===================================================================

function handleListUsers(requester) {
  if (!isUserAdmin(requester)) {
    logAction(requester, 'listUsers', '', 'denied', 'not admin');
    return { success: false, error: 'ต้องเป็น admin เท่านั้น' };
  }

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = getSheet(spreadsheet, 'Users');
  if (!usersSheet) return { success: false, error: 'ไม่พบแผ่นผู้ใช้' };

  const usersList = [];
  const lastRow = usersSheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    const row = rowToObject(usersSheet, i);
    // ไม่ส่ง password hash ออกไป
    usersList.push({
      username: row.username,
      displayName: row.displayName,
      rank: row.rank,
      unit: row.unit,
      role: row.role
    });
  }

  logAction(requester, 'listUsers', '', 'success', 'returned ' + usersList.length);
  return { success: true, users: usersList };
}

function handleAddUser(data) {
  const requester = data.requester || '';
  if (!isUserAdmin(requester)) {
    logAction(requester, 'addUser', data.username, 'denied', 'not admin');
    return { success: false, error: 'ต้องเป็น admin เท่านั้น' };
  }
  if (!data.username || !data.password) {
    return { success: false, error: 'ต้องระบุ username และ password' };
  }

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = getSheet(spreadsheet, 'Users');
  if (!usersSheet) return { success: false, error: 'ไม่พบแผ่นผู้ใช้' };

  // Check duplicate
  const existing = getUserByUsername(data.username);
  if (existing) {
    return { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
  }

  usersSheet.appendRow([
    data.username,
    hashPassword(data.password), // Hash ก่อนเก็บเสมอ
    data.displayName || '',
    data.rank || '',
    data.unit || '',
    data.role || 'user'
  ]);

  logAction(requester, 'addUser', data.username, 'success', 'role=' + (data.role || 'user'));
  return { success: true, username: data.username };
}

// ===================================================================
// Migration utility — รันครั้งเดียวจาก Apps Script editor
// ===================================================================

/**
 * แปลง password ทุกแถวใน Users sheet จาก plaintext เป็น SHA-256 hash
 * ตรวจก่อนว่า row ไหน hashed แล้ว (ความยาว 64 hex) จะข้าม
 *
 * วิธีใช้:
 * 1. เปิด Apps Script editor (script.google.com)
 * 2. เลือกฟังก์ชัน migratePasswordsToHash จาก dropdown
 * 3. กด Run
 * 4. ดู Logs — จะเห็นว่า migrate กี่แถว
 */
function migratePasswordsToHash() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = getSheet(spreadsheet, 'Users');
  if (!usersSheet) { Logger.log('ไม่พบ Users sheet'); return; }

  const lastRow = usersSheet.getLastRow();
  let migrated = 0, alreadyHashed = 0;

  for (let i = 2; i <= lastRow; i++) {
    const row = rowToObject(usersSheet, i);
    const stored = String(row.password);
    if (stored.length === 64 && /^[0-9a-f]{64}$/.test(stored)) {
      alreadyHashed++;
      continue;
    }
    const hashed = hashPassword(stored);
    usersSheet.getRange(i, 2).setValue(hashed); // column 2 = password
    migrated++;
    Logger.log('Migrated user: ' + row.username);
  }

  Logger.log('================================================');
  Logger.log('Migration สำเร็จ');
  Logger.log('  แปลง (plaintext → hash): ' + migrated);
  Logger.log('  ข้าม (hashed แล้ว): ' + alreadyHashed);
  Logger.log('================================================');
  logAction('_system', 'migrate', 'passwords', 'success',
            'migrated=' + migrated + ' skipped=' + alreadyHashed);
}
