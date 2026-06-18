import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Course, Student, Video, TestimonialVideo } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, runTransaction } from "firebase/firestore";

const INITIAL_COURSES: Course[] = []; // handled by firestore
const INITIAL_VIDEOS: Video[] = [];

type StoreContextType = {
  courses: Course[];
  students: Student[];
  videos: Video[];
  logoUrl: string | null;
  heroImages: string[];
  gpayQrUrl: string | null;
  founderVideoUrl: string | null;
  aboutVideoUrl: string | null;
  testimonialVideos: TestimonialVideo[];
  whatsappNumber: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  muthraIconUrl: string | null;
  acupressureIconUrl: string | null;
  foodIconUrl: string | null;
  webinarVisible: boolean;
  addCourse: (course: Course) => void;
  addStudent: (student: Omit<Student, "id" | "registrationDate" | "status">) => Promise<string | null>;
  addVideo: (video: Omit<Video, "id">) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  updateVideo: (video: Video) => void;
  deleteVideo: (id: string) => void;
  updateLogo: (url: string) => void;
  updateFounderVideo: (url: string) => void;
  updateAboutVideo: (url: string) => void;
  addHeroImage: (url: string) => void;
  removeHeroImage: (index: number) => void;
  updateGpayQr: (url: string) => void;
  addTestimonialVideo: (title: string, url: string) => void;
  removeTestimonialVideo: (id: string) => void;
  updateSocialLinks: (whatsapp: string, youtube: string, instagram: string) => void;
  updateFeatureIcons: (muthra: string | null, acupressure: string | null, food: string | null) => void;
  updateWebinarVisible: (v: boolean) => void;
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
  const [videos, setVideos] = useState<Video[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('cachedLogoUrl'));
  const [founderVideoUrl, setFounderVideoUrl] = useState<string | null>(localStorage.getItem('cachedFounderVideo'));
  const [aboutVideoUrl, setAboutVideoUrl] = useState<string | null>(localStorage.getItem('cachedAboutVideo'));
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null);
  const [muthraIconUrl, setMuthraIconUrl] = useState<string | null>(null);
  const [acupressureIconUrl, setAcupressureIconUrl] = useState<string | null>(null);
  const [foodIconUrl, setFoodIconUrl] = useState<string | null>(null);
  const [webinarVisible, setWebinarVisible] = useState<boolean>(false);
  
  const cachedHero = localStorage.getItem('cachedHeroImages');
  const [heroImages, setHeroImages] = useState<string[]>(cachedHero ? JSON.parse(cachedHero) : []);
  const [gpayQrUrl, setGpayQrUrl] = useState<string | null>(null);
  const [testimonialVideos, setTestimonialVideos] = useState<TestimonialVideo[]>([]);

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
        
        setMuthraIconUrl(data.muthraIconUrl || null);
        setAcupressureIconUrl(data.acupressureIconUrl || null);
        setFoodIconUrl(data.foodIconUrl || null);
        setWebinarVisible(data.webinarVisible || false);

        setHeroImages(data.heroImages || []);
        if(data.heroImages) localStorage.setItem('cachedHeroImages', JSON.stringify(data.heroImages));
        
        setGpayQrUrl(data.gpayQrUrl || null);
      }
    }, (error) => console.error(error));

    return () => {
      unsubCourses();
      unsubStudents();
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
    } catch (err) { console.error(err); }
  };

  const updateCourse = async (updatedCourse: Course) => {
    try {
      await setDoc(doc(db, "courses", updatedCourse.id), updatedCourse);
    } catch (err) { console.error(err); }
  };

  const deleteCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, "courses", id));
    } catch (err) { console.error(err); }
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
      console.error(err); 
      return null;
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      await setDoc(doc(db, "students", updatedStudent.id), updatedStudent);
    } catch (err) { console.error(err); }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "students", id));
    } catch (err) { console.error(err); }
  };

  const addVideo = async (videoData: Omit<Video, "id">) => {
    const newVideo: Video = {
      ...videoData,
      id: `vid-${Date.now()}`,
    };
    try {
      await setDoc(doc(collection(db, "videos"), newVideo.id), newVideo);
    } catch (err) { console.error(err); }
  };

  const updateVideo = async (updatedVideo: Video) => {
    try {
      await setDoc(doc(db, "videos", updatedVideo.id), updatedVideo);
    } catch (err) { console.error(err); }
  };

  const deleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
    } catch (err) { console.error(err); }
  };

  const updateLogo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { logoUrl: url }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const updateFounderVideo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { founderVideoUrl: url || null }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const updateAboutVideo = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { aboutVideoUrl: url || null }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const addHeroImage = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { heroImages: [...heroImages, url] }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const removeHeroImage = async (index: number) => {
    const newImages = heroImages.filter((_, i) => i !== index);
    try {
      await setDoc(doc(db, "settings", "global"), { heroImages: newImages }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const updateGpayQr = async (url: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { gpayQrUrl: url || null }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const addTestimonialVideo = async (title: string, url: string) => {
    const newVid = { id: `vid-${Date.now()}`, title, url };
    try {
      await setDoc(doc(collection(db, "testimonialVideos"), newVid.id), newVid);
    } catch (err) { console.error(err); }
  };

  const removeTestimonialVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "testimonialVideos", id));
    } catch (err) { console.error(err); }
  };

  const updateSocialLinks = async (whatsapp: string, youtube: string, instagram: string) => {
    try {
      await setDoc(doc(db, "settings", "global"), { 
        whatsappNumber: whatsapp || null,
        youtubeUrl: youtube || null,
        instagramUrl: instagram || null
      }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const updateFeatureIcons = async (muthra: string | null, acupressure: string | null, food: string | null) => {
    try {
      await setDoc(doc(db, "settings", "global"), { 
        muthraIconUrl: muthra || null,
        acupressureIconUrl: acupressure || null,
        foodIconUrl: food || null
      }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const updateWebinarVisible = async (v: boolean) => {
    try {
      await setDoc(doc(db, "settings", "global"), { webinarVisible: v }, { merge: true });
    } catch (err) { console.error(err); }
  };

  return (
    <StoreContext.Provider value={{ 
      courses, students, videos, logoUrl, heroImages, gpayQrUrl, testimonialVideos,
      founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl,
      muthraIconUrl, acupressureIconUrl, foodIconUrl, webinarVisible,
      addCourse, updateCourse, deleteCourse, 
      addStudent, updateStudent, deleteStudent, 
      addVideo, updateVideo, deleteVideo,
      updateLogo, updateFounderVideo, updateAboutVideo, addHeroImage, removeHeroImage, updateGpayQr, addTestimonialVideo, removeTestimonialVideo, updateSocialLinks, updateFeatureIcons, updateWebinarVisible,
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

