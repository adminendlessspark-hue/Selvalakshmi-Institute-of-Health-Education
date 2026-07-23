import { Course, TestimonialVideo } from "./types";

export const COURSES: Course[] = [
  {
    id: "muthra-12-days",
    title: "Muthra Acupressure Basics",
    duration: "12 Days",
    fee: "Free",
    description: "An intensive introductory course covering the foundational principles of Muthra Acupressure and Naturopathy.",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "muthra-8-weeks",
    title: "Advanced Natural Healing",
    duration: "8 Weeks",
    fee: "₹2,500",
    description: "A comprehensive program diving deeper into natural foods, energy channels, and advanced acupressure techniques.",
    imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "naturopathy-12-weeks",
    title: "Master Certification in Naturopathy",
    duration: "12 Weeks",
    fee: "₹5,000",
    description: "Our flagship program designed for prospective practitioners. Covers holistic nutrition, advanced Muthra, and patient care.",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-41c46b66442f?auto=format&fit=crop&q=80&w=800",
  }
];

export const DEFAULT_TESTIMONIALS: TestimonialVideo[] = [
  {
    id: "testimonial-video-1",
    title: "Smt. Kamala - Life Transformation with Muthra Acupressure",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    type: "video"
  },
  {
    id: "testimonial-video-2",
    title: "Shri. Ananth - Natural Healing & Acupressure Experience",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    type: "video"
  },
  {
    id: "testimonial-audio-1",
    title: "Audio Feedback: Healing Chronic Pain through Naturopathy",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    type: "audio"
  },
  {
    id: "testimonial-audio-2",
    title: "Audio Feedback: 12-Day Basic Muthra Course Journey",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    type: "audio"
  }
];

