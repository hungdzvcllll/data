import mongoose from 'mongoose';

const discussionPostSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    content: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionPost', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('DiscussionPost', discussionPostSchema);
