async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!username || !password) { S.loginError = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'; R(); return; }

  if (!GAS_URL) {
    // Offline mode — accept any login
    S.currentUser = { username, displayName: username, rank: '', unit: '', role: 'admin' };
    S.view = 'dashboard';
    S.loginError = '';
    S.cases = loadLocalCases();
    R();
    return;
  }

  S.loading = true; S.loginError = ''; R();
  try {
    // Day 3: ส่ง credentials ผ่าน POST body (ไม่ใส่ใน URL เพื่อกัน leak ใน server log/history)
    const data = await gasPost('login', { username, password });
    if (data.success) {
      S.currentUser = data.user;
      S.view = 'dashboard';
      S.loginError = '';
      await loadCases();
    } else {
      S.loginError = data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    }
  } catch(e) {
    console.error('[Login Error]', e);
    S.loginError = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + e.message;
  }
  S.loading = false; R();
}

function doLogout() {
  S.currentUser = null;
  S.view = 'login';
  S.loginError = '';
  S.currentCaseId = null;
  R();
}
