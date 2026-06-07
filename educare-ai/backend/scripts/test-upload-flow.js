import { validateAndMapUploadRows, parseUploadFile } from '../src/services/uploadService.js';
import { generateUploadTemplateBuffer } from '../src/services/templateService.js';
import { mapRowToEncodedFeatures } from '../src/utils/featureMapper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sampleCsv = path.join(__dirname, '../../sample_data/student_upload_template.csv');
const rows = parseUploadFile(sampleCsv);
const textRows = rows.length ? undefined : null;

// Use inline text sample if CSV still has legacy numeric encoding
const testRows = [
  {
    StudentID: 'SV001',
    Name: 'Nguyen Van A',
    Email: 'nguyenvana@example.com',
    Class: 'CS101-A',
    StudyHours: 12,
    Attendance: 65,
    AssignmentCompletion: 58,
    OnlineCourses: 5,
    Discussions: 0,
    Extracurricular: 'Yes',
    Resources: 'Medium',
    Internet: 'Yes',
    EduTech: 'Yes',
    Gender: 'Male',
    Age: 20,
    LearningStyle: 'Reading/Writing',
    Motivation: 'Medium',
    StressLevel: 'High',
  },
];

const result = validateAndMapUploadRows(testRows);

console.log('Valid:', result.valid);
if (!result.valid) {
  console.log('Errors:', JSON.stringify(result.errors, null, 2));
}
console.log('Preview:', JSON.stringify(result.preview?.[0], null, 2));
console.log('Encoded:', JSON.stringify(result.validRows?.[0]?.encodedFeatures, null, 2));

const expected = mapRowToEncodedFeatures({
  StudentID: 'SV001',
  Name: 'Test',
  Class: 'CS101-A',
  StudyHours: 12,
  Attendance: 65,
  AssignmentCompletion: 58,
  OnlineCourses: 5,
  Discussions: 0,
  Extracurricular: 'Yes',
  Resources: 'Medium',
  Internet: 'Yes',
  EduTech: 'Yes',
  Gender: 'Male',
  Age: 20,
  LearningStyle: 'Reading/Writing',
  Motivation: 'Medium',
  StressLevel: 'High',
});

console.log('Expected encoding:', JSON.stringify(expected, null, 2));

const badRows = [{ ...rows[0], Gender: 'Unknown' }];
const bad = validateAndMapUploadRows(badRows);
console.log('Bad validation errors:', JSON.stringify(bad.errors, null, 2));

const buffer = await generateUploadTemplateBuffer();
const outPath = path.join(__dirname, '../tmp/test_template.xlsx');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(buffer));
console.log('Template written:', outPath);
