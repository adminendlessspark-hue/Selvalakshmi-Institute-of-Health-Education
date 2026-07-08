export type Course = {
  id: string;
  title: string;
  duration: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  fee?: string;
  launchDate?: string;
  isWebinar?: boolean;
  meetLink?: string;
};

export type Question = {
  id: string;
  text: string;
  type: "mcq" | "boolean";
  options?: string[]; // Used for mcq
  correctAnswer: string;
};

export type Quiz = {
  questions: Question[];
};

export type QuizResult = {
  videoId: string;
  score: number;
  total: number;
  grade: string;
  completedAt: string;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseId: string;
  address: string;
  place?: string;
  country?: string;
  registrationDate: string;
  status: "pending" | "approved" | "rejected";
  paymentReference?: string;
  quizResults?: Record<string, QuizResult>;
};

export type Video = {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  thumbnail: string;
  url?: string;
  materialUrl?: string; // Worksheet or training material
  quiz?: Quiz;
};

export type TestimonialVideo = {
  id: string;
  title: string;
  url: string;
};

export type Appointment = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  problem?: string;
  status: "pending" | "confirmed" | "completed";
  meetLink?: string;
  createdAt: string;
};

export type AppointmentSlot = {
  date: string;
  time: string;
};

export type AppointmentSettings = {
  fee: number;
  slots: AppointmentSlot[];
  defaultMeetLink?: string;
  razorpayKeyId?: string;
};
