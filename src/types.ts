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
  isOffline?: boolean;
  trackerPdfUrl?: string;
  meetLink?: string;
  dietWorksheetUrl?: string;
  isChunked?: boolean;
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

export type DailyDietTracker = {
  morningDrink: boolean;
  breakfast: boolean;
  lunch: boolean;
  eveningDrink: boolean;
  dinner: boolean;
};

export type BloodTestRecord = {
  fastingSugar: string;
  postPrandialSugar: string;
};

export type HealthTracker = {
  diseaseTitle?: string;
  dailyDiet: Record<string, DailyDietTracker>; // Day 1 to Day 7, e.g., "1": {...}
  bloodTestDay1?: BloodTestRecord;
  bloodTestDay8?: BloodTestRecord;
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
  healthTracker?: HealthTracker;
  assignmentVideoUrl?: string; // To handle "offline course record video need to upload" by student
  bloodReportUrl?: string;
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
  isChunked?: boolean;
};

export type TestimonialVideo = {
  id: string;
  title: string;
  url: string;
  isChunked?: boolean;
  type?: "audio" | "video" | "link";
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
