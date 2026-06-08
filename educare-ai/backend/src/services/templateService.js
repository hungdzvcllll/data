import ExcelJS from 'exceljs';
import { getValidLabels } from '../config/featureEncoding.js';

const TEMPLATE_COLUMNS = [
  'StudentID',
  'Name',
  'Email',
  'Class',
  'StudyHours',
  'Attendance',
  'AssignmentCompletion',
  'OnlineCourses',
  'Discussions',
  'Extracurricular',
  'Resources',
  'Internet',
  'EduTech',
  'Gender',
  'Age',
  'LearningStyle',
  'Motivation',
  'StressLevel',
];

const SAMPLE_ROWS = [
  [
    'SV001', 'Nguyen Van A', 'nguyenvana@example.com', 'CS101-A',
    12, 65, 58, 5, 0, 'Yes', 'Medium', 'Yes', 'Yes', 'Male', 20,
    'Reading/Writing', 'Medium', 'High',
  ],
  [
    'SV002', 'Tran Thi B', 'tranthib@example.com', 'CS101-A',
    25, 92, 88, 15, 1, 'Yes', 'High', 'Yes', 'Yes', 'Female', 21,
    'Auditory', 'High', 'Low',
  ],
];

const GUIDE_ROWS = [
  ['Column', 'Meaning', 'Accepted values'],
  ['StudentID', 'Mã sinh viên (duy nhất)', 'Text'],
  ['Name', 'Họ và tên sinh viên', 'Text'],
  ['Email', 'Email sinh viên (tùy chọn)', 'Valid email'],
  ['Class', 'Mã lớp học', 'Text'],
  ['StudyHours', 'Số giờ học/tự học của sinh viên', 'Number >= 0'],
  ['Attendance', 'Tỷ lệ tham gia lớp học', '0–100'],
  ['AssignmentCompletion', 'Tỷ lệ hoàn thành bài tập', '0–100'],
  ['OnlineCourses', 'Số khóa học online đã tham gia', 'Number >= 0'],
  ['Discussions', 'Mức độ tham gia thảo luận', 'Number >= 0'],
  ['Extracurricular', 'Sinh viên có tham gia hoạt động ngoại khóa không', 'Yes / No'],
  ['Resources', 'Mức độ tiếp cận tài nguyên học tập', 'Low / Medium / High'],
  ['Internet', 'Có kết nối Internet ổn định không', 'Yes / No'],
  ['EduTech', 'Có sử dụng công nghệ giáo dục không', 'Yes / No'],
  ['Gender', 'Giới tính', 'Male / Female'],
  ['Age', 'Tuổi sinh viên', '15–80'],
  ['LearningStyle', 'Phong cách học tập chính', 'Visual / Auditory / Reading/Writing / Kinesthetic'],
  ['Motivation', 'Mức độ động lực học tập', 'Low / Medium / High'],
  ['StressLevel', 'Mức độ căng thẳng', 'Low / Medium / High'],
];

const DROPDOWN_COLUMNS = {
  Extracurricular: 'Extracurricular',
  Resources: 'Resources',
  Internet: 'Internet',
  EduTech: 'EduTech',
  Gender: 'Gender',
  LearningStyle: 'LearningStyle',
  Motivation: 'Motivation',
  StressLevel: 'StressLevel',
};

function applyRangeDropdown(sheet, colIndex, rangeRef, maxRow = 500) {
  const colLetter = sheet.getColumn(colIndex).letter;
  for (let row = 2; row <= maxRow; row += 1) {
    sheet.getCell(`${colLetter}${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [rangeRef],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select a value from the dropdown list.',
    };
  }
}

/**
 * Generate Excel template buffer (StudentData + Guide sheets).
 */
export async function generateUploadTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduCare AI';
  workbook.created = new Date();

  const listsSheet = workbook.addWorksheet('_Lists');
  listsSheet.state = 'veryHidden';

  const listColumnMap = {};
  let listCol = 1;
  for (const [field, listKey] of Object.entries(DROPDOWN_COLUMNS)) {
    const labels = getValidLabels(listKey);
    labels.forEach((label, rowIdx) => {
      listsSheet.getCell(rowIdx + 1, listCol).value = label;
    });
    const colLetter = listsSheet.getColumn(listCol).letter;
    listColumnMap[field] = `_Lists!$${colLetter}$1:$${colLetter}$${labels.length}`;
    listCol += 1;
  }

  const dataSheet = workbook.addWorksheet('StudentData');
  dataSheet.addRow(TEMPLATE_COLUMNS);
  dataSheet.getRow(1).font = { bold: true };
  SAMPLE_ROWS.forEach((row) => dataSheet.addRow(row));

  TEMPLATE_COLUMNS.forEach((col, idx) => {
    if (listColumnMap[col]) {
      applyRangeDropdown(dataSheet, idx + 1, listColumnMap[col]);
    }
  });

  dataSheet.columns.forEach((col) => {
    col.width = 18;
  });

  const guideSheet = workbook.addWorksheet('Guide');
  GUIDE_ROWS.forEach((row) => guideSheet.addRow(row));
  guideSheet.getRow(1).font = { bold: true };
  guideSheet.columns.forEach((col) => {
    col.width = 28;
  });

  return workbook.xlsx.writeBuffer();
}

const ROSTER_COLUMNS = [
  'StudentID', 'Name', 'Email', 'Class',
  'Gender', 'Age', 'Attendance', 'Internet', 'Extracurricular', 'StressLevel',
];
const ROSTER_SAMPLE = [
  ['SV001', 'Nguyen Van A', 'nguyenvana@example.com', 'CS101-A', 'Male', 20, 85, 'Yes', 'Yes', 'Medium'],
  ['SV002', 'Tran Thi B', '', 'CS101-A', 'Female', 21, 72, 'Yes', 'No', 'High'],
];

const ROSTER_GUIDE = [
  ['Column', 'Meaning', 'Notes'],
  ['StudentID', 'Mã sinh viên', 'Bắt buộc'],
  ['Name', 'Họ và tên', 'Bắt buộc'],
  ['Email', 'Email đăng nhập portal', 'Tùy chọn'],
  ['Class', 'Mã lớp', 'Bắt buộc'],
  ['Gender', 'Giới tính (ngoài LMS)', 'Tùy chọn — để trống dùng mặc định'],
  ['Age', 'Tuổi', 'Tùy chọn'],
  ['Attendance', 'Chuyên cần %', 'Tùy chọn'],
  ['Internet', 'Có Internet', 'Yes / No — tùy chọn'],
  ['Extracurricular', 'Hoạt động ngoại khóa', 'Yes / No — tùy chọn'],
  ['StressLevel', 'Mức căng thẳng', 'Low / Medium / High — tùy chọn'],
  ['—', '8 trường hành vi LMS', 'Tự thu khi sinh viên học trên hệ thống (không cần nhập Excel)'],
];

export async function generateRosterTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduCare AI';

  const listsSheet = workbook.addWorksheet('_Lists');
  listsSheet.state = 'veryHidden';
  const rosterDropdowns = {
    Gender: 'Gender',
    Internet: 'Internet',
    Extracurricular: 'Extracurricular',
    StressLevel: 'StressLevel',
  };
  const listColumnMap = {};
  let listCol = 1;
  for (const [field, listKey] of Object.entries(rosterDropdowns)) {
    const labels = getValidLabels(listKey);
    labels.forEach((label, rowIdx) => {
      listsSheet.getCell(rowIdx + 1, listCol).value = label;
    });
    const colLetter = listsSheet.getColumn(listCol).letter;
    listColumnMap[field] = `_Lists!$${colLetter}$1:$${colLetter}$${labels.length}`;
    listCol += 1;
  }

  const dataSheet = workbook.addWorksheet('StudentData');
  dataSheet.addRow(ROSTER_COLUMNS);
  dataSheet.getRow(1).font = { bold: true };
  ROSTER_SAMPLE.forEach((row) => dataSheet.addRow(row));

  ROSTER_COLUMNS.forEach((col, idx) => {
    if (listColumnMap[col]) {
      applyRangeDropdown(dataSheet, idx + 1, listColumnMap[col]);
    }
  });

  dataSheet.columns.forEach((col) => { col.width = 18; });

  const guideSheet = workbook.addWorksheet('Guide');
  ROSTER_GUIDE.forEach((row) => guideSheet.addRow(row));
  guideSheet.getRow(1).font = { bold: true };
  guideSheet.columns.forEach((col) => { col.width = 36; });

  return workbook.xlsx.writeBuffer();
}

/** @deprecated Use generateRosterTemplateBuffer — same 10-column merged template */
export async function generateExternalProfileTemplateBuffer() {
  return generateRosterTemplateBuffer();
}
