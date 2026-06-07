import Intervention from '../models/Intervention.js';

export async function listByStudent(studentId) {
  return Intervention.find({ studentId })
    .populate('advisorId', 'fullName email')
    .populate('predictionId')
    .sort({ createdAt: -1 });
}

export async function getById(id) {
  return Intervention.findById(id)
    .populate('advisorId', 'fullName email')
    .populate('studentId', 'studentCode fullName')
    .populate('predictionId');
}

export async function create(data) {
  return Intervention.create(data);
}

export async function update(id, data) {
  return Intervention.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export async function remove(id) {
  return Intervention.findByIdAndDelete(id);
}
