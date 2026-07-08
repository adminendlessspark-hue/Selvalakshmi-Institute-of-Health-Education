import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Course, Student, Video, TestimonialVideo, Appointment, AppointmentSettings } from "../types";
import { db, auth } from "../lib/firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, runTransaction } from "firebase/firestore";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_COURSES: Course[] = []; // handled by firestore
const INITIAL_VIDEOS: Video[] = [];

type StoreContextType = {
  courses: Course[];
  students: Student[];
  appointments: Appointment[];
  videos: Video[];
  logoUrl: string | null;
  heroImages: string[];
  heroOverlayColor: string;
  heroOverlayOpacity: number;
  gpayQrUrl: string | null;
  founderVideoUrl: string | null;
  aboutVideoUrl: string | null;
  testimonialVideos: TestimonialVideo[];
  whatsappNumber: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  muthraIconUrl: string | null;
  acupressureIconUrl: string | null;
  foodIconUrl: string | null;
  webinarVisible: boolean;
  addCourse: (course: Course) => Promise<void>;
  addStudent: (student: Omit<Student, "id" | "registrationDate" | "status">) => Promise<string | null>;
  addAppointment: (appointment: Omit<Appointment, "id" | "createdAt">) => Promise<string | null>;
  updateAppointmentStatus: (id: string, status: "pending" | "confirmed" | "completed", meetLink?: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addVideo: (video: Omit<Video, "id">) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateVideo: (video: Video) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  updateLogo: (url: string) => Promise<void>;
  updateFounderVideo: (url: string) => Promise<void>;
  updateAboutVideo: (url: string) => Promise<void>;
  updateHeroOverlay: (color: string, opacity: number) => Promise<void>;
  addHeroImage: (url: string) => Promise<void>;
  removeHeroImage: (index: number) => Promise<void>;
  updateGpayQr: (url: string) => Promise<void>;
  addTestimonialVideo: (title: string, url: string) => Promise<void>;
  removeTestimonialVideo: (id: string) => Promise<void>;
  updateSocialLinks: (whatsapp: string, youtube: string, instagram: string, facebook: string) => Promise<void>;
  updateFeatureIcons: (muthra: string | null, acupressure: string | null, food: string | null) => Promise<void>;
  updateWebinarVisible: (v: boolean) => Promise<void>;
  appointmentSettings: AppointmentSettings | null;
  updateAppointmentSettings: (settings: AppointmentSettings) => Promise<void>;
  isAdmin: boolean;
  loggedStudentId: string | null;
  loginAdmin: () => void;
  logoutAdmin: () => void;
  loginStudent: (id: string) => void;
  logoutStudent: () => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('cachedLogoUrl'));
  const [founderVideoUrl, setFounderVideoUrl] = useState<string | null>(localStorage.getItem('cachedFounderVideo'));
  const [aboutVideoUrl, setAboutVideoUrl] = useState<string | null>(localStorage.getItem('cachedAboutVideo'));
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null);
  const [facebookUrl, setFacebookUrl] = useState<string | null>(null);
  const [muthraIconUrl, setMuthraIconUrl] = useState<string | null>(null);
  const [acupressureIconUrl, setAcupressureIconUrl] = useState<string | null>(null);
  const [foodIconUrl, setFoodIconUrl] = useState<string | null>(null);
  const [webinarVisible, setWebinarVisible] = useState<boolean>(false);
  
  const cachedHero = localStorage.getItem('cachedHeroImages');
  const [heroImages, setHeroImages] = useState<string[]>(cachedHero ? JSON.parse(cachedHero) : []);
  const [heroOverlayColor, setHeroOverlayColor] = useState<string>("#1A2F23"); // default sage-900 like
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState<number>(70); // default 70
  const [gpayQrUrl, setGpayQrUrl] = useState<string | null>(null);
  const [testimonialVideos, setTestimonialVideos] = useState<TestimonialVideo[]>([]);
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings | null>(null);

  // Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(localStorage.getItem('isAdmin') === 'true');
  const [loggedStudentId, setLoggedStudentId] = useState<string | null>(localStorage.getItem('loggedStudentId'));

  // Load from Firestore on mount
  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, "courses"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(data);
    }, (error) => console.error(error));

    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
    }, (error) => console.error(error));

    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    }, (error) => console.error(error));

    const unsubVideos = onSnapshot(collection(db, "videos"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      setVideos(data);
    }, (error) => console.error(error));

    const unsubTestimonial = onSnapshot(collection(db, "testimonialVideos"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestimonialVideo));
      setTestimonialVideos(data);
    }, (error) => console.error(error));

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLogoUrl(data.logoUrl || null);
        if(data.logoUrl) localStorage.setItem('cachedLogoUrl', data.logoUrl);
        
        setFounderVideoUrl(data.founderVideoUrl || null);
        if(data.founderVideoUrl) localStorage.setItem('cachedFounderVideo', data.founderVideoUrl);
        
        setAboutVideoUrl(data.aboutVideoUrl || null);
        if(data.aboutVideoUrl) localStorage.setItem('cachedAboutVideo', data.aboutVideoUrl);
        
        setWhatsappNumber(data.whatsappNumber || null);
        setYoutubeUrl(data.youtubeUrl || null);
        setInstagramUrl(data.instagramUrl || null);
        setFacebookUrl(data.facebookUrl || null);
        
        setMuthraIconUrl(data.muthraIconUrl || null);
        setAcupressureIconUrl(data.acupressureIconUrl || null);
        setFoodIconUrl(data.foodIconUrl || null);
        setWebinarVisible(data.webinarVisible || false);

        setHeroImages(data.heroImages || []);
        if(data.heroImages) localStorage.setItem('cachedHeroImages', JSON.stringify(data.heroImages));
        
        setHeroOverlayColor(data.heroOverlayColor || "#1A2F23");
        setHeroOverlayOpacity(data.heroOverlayOpacity ?? 70);
        
        setGpayQrUrl(data.gpayQrUrl || null);
        setAppointmentSettings(data.appointmentSettings || null);
      }
    }, (error) => console.error(error));

    return () => {
      unsubCourses();
      unsubStudents();
      unsubAppointments();
      unsubVideos();
      unsubTestimonial();
      unsubSettings();
    };
  }, []);

  const loginAdmin = () => { setIsAdmin(true); localStorage.setItem('isAdmin', 'true'); };
  const logoutAdmin = () => { setIsAdmin(false); localStorage.removeItem('isAdmin'); };
  const loginStudent = (id: string) => { setLoggedStudentId(id); localStorage.setItem('loggedStudentId', id); };
  const logoutStudent = () => { setLoggedStudentId(null); localStorage.removeItem('loggedStudentId'); };

  const addCourse = async (course: Course) => {
    try {
      await setDoc(doc(collection(db, "courses"), course.id), course);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${course.id}`);
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
    try {
      await setDoc(doc(db, "courses", updatedCourse.id), updatedCourse);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${updatedCourse.id}`);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, "courses", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `courses/${id}`);
    }
  };

  const addStudent = async (studentData: Omit<Student, "id" | "registrationDate" | "status">) => {
    const newStudent: Student = {
      ...studentData,
      id: `STU-${Date.now().toString().slice(-6)}`,
      registrationDate: new Date().toISOString(),
      status: "pending",
    };
    try {
      await setDoc(doc(collection(db, "students"), newStudent.id), newStudent);
      return newStudent.id;
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, `students/${newStudent.id}`);
      return null;
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      await setDoc(doc(db, "students", updatedStudent.id), updatedStudent);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `students/${updatedStudent.id}`);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "students", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, "id" | "createdAt">) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `APT-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "appointments", newAppointment.id), newAppointment);
      return newAppointment.id;
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, `appointments/${newAppointment.id}`);
      return null;
    }
  };

  const updateAppointmentStatus = async (id: string, status: "pending" | "confirmed" | "completed", meetLink?: string) => {
    try {
      const updateData: any = { status };
      if (meetLink) updateData.meetLink = meetLink;
      await setDoc(doc(db, "appointments", id), updateData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `appointments/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "appointments", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
    }
  };

  const addVideo = async (videoData: Omit<Video, "id">) => {
    const newVideo: Video = {
      ...videoData,
      id: `vid-${Date.now()}`,
    };
    try {
      await setDoc(doc(collection(db, "videos"), newVideo.id), newVideo);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `videos/${newVideo.id}`);
    }
  };

  const updateVideo = async (updatedVideo: Video) => {
    try {
      await setDoc(doc(db, "videos", updatedVideo.id), updatedVideo);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `videos/${updatedVideo.id}`);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
    }
  };

  const updateLogo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { logoUrl: url }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateFounderVideo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { founderVideoUrl: url || null }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateAboutVideo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { aboutVideoUrl: url || null }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateHeroOverlay = async (color: string, opacity: number) => {
    try {
      await setDoc(doc(db, "settings", "global"), { heroOverlayColor: color, heroOverlayOpacity: opacity }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const addHeroImage = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { heroImages: [...heroImages, url] }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const removeHeroImage = async (index: number) => {
    const newImages = heroImages.filter((_, i) => i !== index);
    try {
      await setDoc(doc(db, "settings", "global"), { heroImages: newImages }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateGpayQr = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { gpayQrUrl: url || null }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const addTestimonialVideo = async (title: string, url: string) => {
    const newVid = { id: `vid-${Date.now()}`, title, url };
    try {
      await setDoc(doc(collection(db, "testimonialVideos"), newVid.id), newVid);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonialVideos/${newVid.id}`);
    }
  };

  const removeTestimonialVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "testimonialVideos", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonialVideos/${id}`);
    }
  };

  const updateSocialLinks = async (whatsapp: string, youtube: string, instagram: string, facebook: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { 
        whatsappNumber: whatsapp || null,
        youtubeUrl: youtube || null,
        instagramUrl: instagram || null,
        facebookUrl: facebook || null
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateFeatureIcons = async (muthra: string | null, acupressure: string | null, food: string | null) => {
    try {
      await setDoc(doc(db, "settings", "global"), { 
        muthraIconUrl: muthra || null,
        acupressureIconUrl: acupressure || null,
        foodIconUrl: food || null
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateWebinarVisible = async (v: boolean) => {
    try {
      await setDoc(doc(db, "settings", "global"), { webinarVisible: v }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const updateAppointmentSettings = async (settings: AppointmentSettings) => {
    try {
      await setDoc(doc(db, "settings", "global"), { appointmentSettings: settings }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  return (
    <StoreContext.Provider value={{ 
      courses, students, appointments, videos, logoUrl, heroImages, heroOverlayColor, heroOverlayOpacity, gpayQrUrl, testimonialVideos,
      founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl, facebookUrl,
      muthraIconUrl, acupressureIconUrl, foodIconUrl, webinarVisible,
      appointmentSettings, updateAppointmentSettings,
      addCourse, updateCourse, deleteCourse, 
      addStudent, updateStudent, deleteStudent, 
      addAppointment, updateAppointmentStatus, deleteAppointment,
      addVideo, updateVideo, deleteVideo,
      updateLogo, updateFounderVideo, updateAboutVideo, updateHeroOverlay, addHeroImage, removeHeroImage, updateGpayQr, addTestimonialVideo, removeTestimonialVideo, updateSocialLinks, updateFeatureIcons, updateWebinarVisible,
      isAdmin, loggedStudentId, loginAdmin, logoutAdmin, loginStudent, logoutStudent
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

