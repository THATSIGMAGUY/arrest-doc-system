// ========== STATE ==========
function newSuspect(n) {
  return {
    id: Date.now() + Math.random(),
    title: 'นาย', firstName: '', lastName: '', age: '', dob: '',
    idCard: '', passport: '', phone: '', address: '', addressId: '',
    subDistrict: '', district: '', province: '',
    appearance: '', photo: null, photoName: '',
    photoFront: null, photoBack: null, photoLeft: null, photoRight: null,
    // per-suspect for arrest record
    statement: 'confess', // confess | deny
    statementDetail: '',
    // per-suspect for sec23
    s23_orderType: 'caught_in_act',
    s23_warrantNo: '', s23_courtName: '', s23_orderDetail: '', s23_otherDetail: '',
    s23_orderOfficerName: '', s23_orderOfficerPosition: '',
    s23_conditionBefore: '', s23_conditionAfter: '',
    s23_releaseDate: '', s23_releaseTime: '', s23_releasePlace: '',
    s23_receiverName: '', s23_receiverPhone: '',
    s23_forceReason: '', s23_additionalNotes: '',
  };
}

const S = {
  // App view control
  view: 'login', // 'login' | 'dashboard' | 'form'
  currentUser: null, // { username, displayName, rank, unit, role }
  cases: [], // array of case summaries from GSheets
  currentCaseId: null, // null = new case, string = editing existing
  dashSearch: '',
  dashFilter: 'all', // 'all' | 'draft' | 'completed'
  loginError: '',
  loading: false,

  step: 0,
  activeSuspect: 0,
  showModal: null,
  modalSuspectIdx: 0,
  officer: { rank:'', firstName:'', lastName:'', position:'', unit:'', phone:'' },
  // Team - 3 sections, each can have multiple officers
  commanders: [{ rankName:'' }],    // ภายใต้การอำนวยการของ
  leaders: [{ rankName:'' }],        // นำโดย
  jointUnits: [{ unitName:'', officers:[{ rankName:'' }] }], // หน่วยงานร่วมจับกุม
  suspects: [newSuspect(1)],
  incident: {
    recordPlace: '', recordDate: '', recordTime: '',
    arrestDate: '', arrestTime: '',
    location: '', houseNo: '', road: '', subDistrict: '', district: '', province: '',
    narrative: '',
    accusation: '', // โดยกล่าวหาว่า
    charges: '', // ข้อหา
  },
  evidence: [{ name:'', qty:'', unit:'ชิ้น', location:'' }],
  evidenceLocation: '', // ตำแหน่งที่พบของกลาง
  // Shared
  detentionPlace: '', detentionDistrict: '', detentionProvince: '',
  // Photos
  scenePhoto: null, scenePhotoName: '',
  evidencePhoto: null, evidencePhotoName: '',
  // Anung (อนึ่ง) - standard text, editable
  anungText: 'ในการจับครั้งนี้ เจ้าหน้าที่ตำรวจทุกนาย ได้ปฏิบัติตามอำนาจหน้าที่ มิได้ทำหรือจัดให้ทำการใดๆ ซึ่งเป็นการให้คำมั่น สัญญา ขู่เข็ญ หลอกลวง ทรมาน ใช้กำลังบังคับ หรือทำให้ผู้ใดได้รับอันตรายแก่กายหรือจิตใจ แต่อย่างใด มิได้ทำให้ทรัพย์สินของผู้ใดเสียหาย สูญหาย เสื่อมค่าหรือไร้ค่า และมิได้เบียดบังเอาทรัพย์สินของผู้ใด ไปเป็นประโยชน์ส่วนตนหรือบุคคลอื่น หรือกระทำการโดยมีชอบประการใดๆ เจ้าหน้าที่ผู้จับได้จัดทำบันทึกการจับขึ้น แล้วได้มอบสำเนาบันทึกการจับให้ผู้ถูกจับไว้ จำนวน ๑ ฉบับแล้ว',
  signatures: {}, // key: 'officer', 'leader_0', 'joint_0_1', 'suspect_0', etc.
  sigActiveKey: 'officer', // which signature pad is active
  sigMode: 'electronic', // 'electronic' = เซ็นบนจอ, 'blank' = เว้นช่องว่างไว้ลงนามบนกระดาษ
};

const RIGHTS = [
  'มีสิทธิ์แจ้งหรือขอให้เจ้าพนักงานให้ญาติหรือผู้ซึ่งตนไว้วางใจทราบถึงการจับกุมและสถานที่ที่ถูกควบคุมในโอกาสแรกที่สามารถดำเนินการได้โดยสะดวก',
  'มีสิทธิ์ที่จะพบและปรึกษาทนายความ หรือผู้ซึ่งจะเป็นทนายความเป็นการเฉพาะตัว',
  'มีสิทธิ์ให้ทนายความหรือผู้ที่ตนไว้วางใจเข้าฟังการสอบปากคำตนได้ในชั้นสอบสวน',
  'มีสิทธิ์ได้รับการเยี่ยมหรือติดต่อกับญาติได้ตามสมควร',
  'มีสิทธิ์ได้รับการรักษาพยาบาลโดยเร็วเมื่อเกิดการเจ็บป่วย',
  'มีสิทธิ์ที่จะให้การหรือไม่ให้การก็ได้ และถ้อยคำของผู้ถูกจับนั้น อาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้',
];

const STEPS = [
  { l:'ข้อมูลผู้ถูกจับ', i:'👤' },
  { l:'เหตุการณ์', i:'📍' },
  { l:'ของกลาง', i:'📦' },
  { l:'ข้อกล่าวหา & สิทธิ', i:'⚖️' },
  { l:'รูปภาพ', i:'📸' },
  { l:'ข้อมูล ม.23', i:'📝' },
  { l:'ลงนาม', i:'✍️' },
  { l:'Export', i:'✅' },
];
