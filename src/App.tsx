/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Heart, Music, Pause, Play, Camera, Mail, Sparkles, 
  Infinity as InfinityIcon, Flower2, Clock, Sun, Moon, 
  Star, RefreshCcw, Lock, Unlock, Gift, Shield, Trash2, Plus, X, Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- UTILS ---
const DB_NAME = 'BirthdayAppDB';
const STORE_NAME = 'memories';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveMemoriesToDB = async (memories: any[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(memories, 'current_memories');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("DB Save Error", e);
  }
};

const loadMemoriesFromDB = async (): Promise<any[] | null> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_memories');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("DB Load Error", e);
    return null;
  }
};

// --- ADMIN PANEL ---
const AdminPanel = ({ 
  memories, 
  onUpdateImage, 
  onUpdateTitle, 
  onAddMemory, 
  onDeleteMemory,
  onClose 
}: { 
  memories: any[], 
  onUpdateImage: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void,
  onUpdateTitle: (id: number, title: string) => void,
  onAddMemory: () => void,
  onDeleteMemory: (id: number) => void,
  onClose: () => void
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === 'queen' || password.toLowerCase() === 'love') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect Password');
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[1000] bg-celebration-cream flex items-center justify-center p-6"
      >
        <div className="glass p-8 rounded-3xl max-w-sm w-full text-center">
          <Shield className="mx-auto mb-4 text-celebration-pink" size={48} />
          <h2 className="text-2xl font-serif font-bold text-celebration-pink mb-6">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-celebration-pink/20 focus:outline-none focus:border-celebration-pink text-center"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-celebration-pink/20 text-celebration-pink font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 rounded-xl bg-celebration-pink text-white font-bold"
              >
                Enter
              </button>
            </div>
          </form>
          <p className="mt-6 text-[10px] text-celebration-pink/30 uppercase tracking-widest">Hint: What do I call you?</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[1000] bg-celebration-cream overflow-y-auto p-6 md:p-12"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-celebration-pink">Memory Manager</h2>
            <p className="text-celebration-pink/60">Add, edit, or remove our special moments.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 glass rounded-full text-celebration-pink hover:bg-celebration-pink hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid gap-6">
          {memories.map((photo) => (
            <div key={photo.id} className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-celebration-pink/10">
                <img src={photo.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <input 
                  type="text" 
                  value={photo.title}
                  onChange={(e) => onUpdateTitle(photo.id, e.target.value)}
                  className="w-full bg-transparent border-b border-celebration-pink/20 text-xl font-serif italic text-celebration-pink focus:outline-none focus:border-celebration-pink"
                />
                <div className="flex flex-wrap gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-celebration-pink/10 text-celebration-pink text-sm font-bold cursor-pointer hover:bg-celebration-pink/20 transition-all">
                    <Camera size={16} /> Change Image
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpdateImage(photo.id, e)} />
                  </label>
                  <button 
                    onClick={() => onDeleteMemory(photo.id)}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={onAddMemory}
            className="w-full py-8 border-2 border-dashed border-celebration-pink/20 rounded-2xl text-celebration-pink/40 hover:text-celebration-pink hover:border-celebration-pink/40 transition-all flex flex-col items-center gap-2"
          >
            <Plus size={32} />
            <span className="font-bold uppercase tracking-widest text-xs">Add New Memory</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- GIFT BOX ---
const GiftBox = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    
    // Confetti Explosion
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = Math.max(0, 50 * (timeLeft / duration));
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className="flex flex-col items-center gap-12 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-rose-gold mb-4">A Special Gift for You</h2>
        <p className="text-rose-gold-light/60 italic">Click the box to open your final surprise.</p>
      </motion.div>

      <div className="gift-container cursor-pointer" onClick={handleOpen}>
        <div className={`gift-box ${isOpen ? 'open' : ''} animate-bounce-slow`}>
          <div className="gift-face face-front"></div>
          <div className="gift-face face-back"></div>
          <div className="gift-face face-right"></div>
          <div className="gift-face face-left"></div>
          <div className="gift-face face-top"></div>
          <div className="gift-face face-bottom"></div>
          <div className="gift-lid">
             <div className="absolute inset-0 border-2 border-white/20"></div>
             <div className="absolute w-full h-8 bg-rose-gold-light/20 top-1/2 -translate-y-1/2"></div>
             <div className="absolute h-full w-8 bg-rose-gold-light/20 left-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center z-50"
          >
            <motion.h3 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl md:text-8xl font-serif font-bold text-rose-gold glow-text mb-4"
            >
              I Love You Forever
            </motion.h3>
            <p className="text-xl text-rose-gold-light/80 italic font-serif">You are my today and all of my tomorrows.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CURSOR TRAIL ---
const CursorTrail = () => {
  const [points, setPoints] = useState<{ x: number; y: number; id: number; type: 'heart' | 'star' }[]>([]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x, y;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      
      setPoints(prev => [
        ...prev.slice(-15),
        { x, y, id: Date.now() + Math.random(), type: Math.random() > 0.5 ? 'heart' : 'star' }
      ]);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {points.map(point => (
          <motion.div
            key={point.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0, y: point.y - 50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'fixed', left: point.x, top: point.y }}
            className="text-celebration-pink pointer-events-none"
          >
            {point.type === 'heart' ? <Heart size={12} fill="currentColor" /> : <Star size={12} fill="currentColor" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- BALLOONS ---
const Balloons = () => {
  const [balloons, setBalloons] = useState<{ id: number; left: string; color: string; delay: number }[]>([]);

  useEffect(() => {
    const colors = ['#ff6b81', '#ffd700', '#ffb3ba', '#7bed9f', '#70a1ff'];
    const interval = setInterval(() => {
      setBalloons(prev => [
        ...prev.slice(-15),
        {
          id: Date.now(),
          left: `${Math.random() * 100}%`,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 2
        }
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <AnimatePresence>
        {balloons.map(balloon => (
          <motion.div
            key={balloon.id}
            initial={{ y: '110vh', opacity: 0 }}
            animate={{ y: '-10vh', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 15, ease: 'linear', delay: balloon.delay }}
            className="absolute"
            style={{ left: balloon.left }}
          >
            <div 
              className="w-12 h-16 rounded-full relative"
              style={{ backgroundColor: balloon.color, boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.1)` }}
            >
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-400/30" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- MUSIC VISUALIZER ---
const MusicVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="flex items-end gap-1 h-8">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={isPlaying ? { height: [8, 24, 12, 32, 8] } : { height: 4 }}
          transition={{
            repeat: Infinity,
            duration: 0.8 + Math.random() * 0.5,
            ease: "easeInOut",
            delay: i * 0.1
          }}
          className="w-1 bg-celebration-pink rounded-full"
        />
      ))}
    </div>
  );
};

// --- BLOOMING FLOWER ---
const BloomingFlower = () => {
  const [isBloomed, setIsBloomed] = useState(false);
  
  return (
    <div 
      className="relative w-48 h-48 cursor-pointer flex items-center justify-center"
      onClick={() => setIsBloomed(!isBloomed)}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        {/* Stem */}
        <path d="M50 90 Q50 60 50 40" stroke="#4a6741" strokeWidth="3" fill="none" />
        
        {/* Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <motion.path
            key={i}
            d="M50 40 Q70 10 50 10 Q30 10 50 40"
            fill="#ff6b81"
            initial={{ scale: 0, rotate: angle, originX: "50px", originY: "40px" }}
            animate={{ 
              scale: isBloomed ? 1 : 0.2,
              rotate: angle,
              opacity: isBloomed ? 1 : 0.5
            }}
            transition={{ type: "spring", stiffness: 100, delay: i * 0.05 }}
          />
        ))}
        
        {/* Center */}
        <motion.circle
          cx="50" cy="40" r="5"
          fill="#ffd700"
          animate={{ scale: isBloomed ? 1.2 : 0.8 }}
        />
      </motion.svg>
      <div className="absolute bottom-0 text-xs font-serif italic text-celebration-pink/60">
        {isBloomed ? "Fully Bloomed Love" : "Click to Bloom"}
      </div>
    </div>
  );
};

// --- SCRATCH CARD ---
const ScratchCard = ({ message }: { message: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with "scratchable" layer
    ctx.fillStyle = '#ffb3ba';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some texture/pattern
    ctx.strokeStyle = 'rgba(255, 107, 129, 0.2)';
    for(let i=0; i<canvas.width; i+=10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
  }, []);

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check if enough is scratched (simplified)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    if (transparent > pixels.length / 4 * 0.5) {
      setIsRevealed(true);
    }
  };

  return (
    <div className="relative w-full max-w-md aspect-video glass rounded-2xl overflow-hidden flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-2xl font-serif italic text-celebration-pink glow-text">{message}</p>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={225}
        className={`absolute inset-0 w-full h-full scratch-canvas transition-opacity duration-1000 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseMove={scratch}
        onTouchStart={() => setIsDrawing(true)}
        onTouchEnd={() => setIsDrawing(false)}
        onTouchMove={scratch}
      />
      {!isRevealed && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-celebration-pink/40 pointer-events-none">
          <RefreshCcw size={10} /> Scratch to reveal
        </div>
      )}
    </div>
  );
};

// --- SLOT MACHINE ---
const SlotMachine = () => {
  const reasons = [
    "Your Radiant Smile",
    "Your Endless Kindness",
    "How You Support My Dreams",
    "Your Beautiful Soul",
    "The Way You Laugh",
    "Your Incredible Strength",
    "Your Gentle Heart",
    "How You Make Me Better"
  ];
  const [currentReason, setCurrentReason] = useState(reasons[0]);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setCurrentReason(reasons[Math.floor(Math.random() * reasons.length)]);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="glass p-8 rounded-3xl text-center max-w-sm mx-auto shadow-2xl border-celebration-pink/20">
      <h3 className="text-celebration-pink/60 uppercase tracking-widest text-xs mb-6">Reason I Love You</h3>
      <div className="h-24 flex items-center justify-center glass-dark rounded-xl mb-8 overflow-hidden border border-celebration-pink/10">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentReason}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="text-xl md:text-2xl font-serif font-bold text-celebration-pink px-4"
          >
            {currentReason}
          </motion.p>
        </AnimatePresence>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={spin}
        disabled={isSpinning}
        className="w-full py-4 bg-celebration-pink text-white font-bold rounded-xl shadow-lg hover:bg-celebration-pink-light transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCcw className={isSpinning ? "animate-spin" : ""} size={20} />
        {isSpinning ? "Spinning..." : "Spin for a Reason"}
      </motion.button>
    </div>
  );
};

// --- TIME GREETING ---
const TimeGreeting = () => {
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  
  return (
    <div className="flex items-center gap-3 text-celebration-pink/80 font-serif italic text-xl">
      {isNight ? (
        <><Moon className="text-celebration-pink" /> Good Night, My Moon</>
      ) : (
        <><Sun className="text-celebration-pink" /> Good Morning, My Sunshine</>
      )}
    </div>
  );
};

export default function App() {
  const [loveLevel, setLoveLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [petalTrigger, setPetalTrigger] = useState(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [memories, setMemories] = useState<any[]>([
    { id: 1, url: 'https://picsum.photos/seed/love1/600/600', title: 'Our First Date' },
    { id: 2, url: 'https://picsum.photos/seed/love2/600/600', title: 'Summer Trip' },
    { id: 3, url: 'https://picsum.photos/seed/love3/600/600', title: 'Beautiful Moments' },
    { id: 4, url: 'https://picsum.photos/seed/love4/600/600', title: 'Together Forever' },
    { id: 5, url: 'https://picsum.photos/seed/love5/600/600', title: 'Laughs & Joy' },
    { id: 6, url: 'https://picsum.photos/seed/love6/600/600', title: 'My Everything' },
  ]);

  useEffect(() => {
    const initMemories = async () => {
      const saved = await loadMemoriesFromDB();
      if (saved) {
        setMemories(saved);
      } else {
        // Fallback to localStorage if DB is empty (migration)
        try {
          const legacy = localStorage.getItem('birthday_memories');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            setMemories(parsed);
            await saveMemoriesToDB(parsed);
          }
        } catch (e) {
          console.warn("Legacy load failed", e);
        }
      }
    };
    initMemories();
  }, []);

  useEffect(() => {
    saveMemoriesToDB(memories);
  }, [memories]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => console.log("Autoplay blocked"));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoveMeter = () => {
    setLoveLevel(0);
    const target = 1000;
    const duration = 2000;
    const start = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setLoveLevel(Math.floor(easeOutQuart * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const handleImageUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB for better performance, though IndexedDB can handle more)
      if (file.size > 5 * 1024 * 1024) {
        alert("This image is too large. Please choose an image smaller than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setMemories(prev => prev.map(m => 
          m.id === id ? { ...m, url: reader.result as string } : m
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (id: number, newTitle: string) => {
    setMemories(prev => prev.map(m => 
      m.id === id ? { ...m, title: newTitle } : m
    ));
  };

  const resetMemories = () => {
    if (window.confirm("Are you sure you want to reset all memories to default? This will delete your uploaded pictures.")) {
      const defaults = [
        { id: 1, url: 'https://picsum.photos/seed/love1/600/600', title: 'Our First Date' },
        { id: 2, url: 'https://picsum.photos/seed/love2/600/600', title: 'Summer Trip' },
        { id: 3, url: 'https://picsum.photos/seed/love3/600/600', title: 'Beautiful Moments' },
        { id: 4, url: 'https://picsum.photos/seed/love4/600/600', title: 'Together Forever' },
        { id: 5, url: 'https://picsum.photos/seed/love5/600/600', title: 'Laughs & Joy' },
        { id: 6, url: 'https://picsum.photos/seed/love6/600/600', title: 'My Everything' },
      ];
      setMemories(defaults);
      localStorage.removeItem('birthday_memories');
    }
  };

  const addMemory = () => {
    const newId = memories.length > 0 ? Math.max(...memories.map(m => m.id)) + 1 : 1;
    setMemories(prev => [...prev, {
      id: newId,
      url: `https://picsum.photos/seed/love${newId}/600/600`,
      title: 'New Memory'
    }]);
  };

  const deleteMemory = (id: number) => {
    if (window.confirm("Delete this memory?")) {
      setMemories(prev => prev.filter(m => m.id !== id));
    }
  };

  const loveLetter = `My Dearest,

On this beautiful day, I want to celebrate the most incredible person I know—you. You are my queen, my partner, and my best friend. 

Every moment with you feels like a dream I never want to wake up from. Your smile lights up my world, and your love is the greatest gift I've ever received.

Happy Birthday, my love. Here's to many more years of making memories together.

Forever Yours,
Me`;

  return (
    <div className="relative min-h-screen bg-celebration-cream selection:bg-celebration-pink/30">
      <CursorTrail />
      <Balloons />
      <RosePetals trigger={petalTrigger} />
      
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            memories={memories}
            onUpdateImage={handleImageUpload}
            onUpdateTitle={handleTitleChange}
            onAddMemory={addMemory}
            onDeleteMemory={deleteMemory}
            onClose={() => setIsAdminOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <audio ref={audioRef} loop src="https://archive.org/download/MaherZainNasheeds/Maher%20Zain%20-%20Mawlaya.mp3" />

      {/* Floating Controls */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass p-3 rounded-2xl"
            >
              <MusicVisualizer isPlaying={isPlaying} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleMusic}
          className="p-4 glass rounded-full shadow-2xl text-celebration-pink hover:scale-110 transition-transform"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={() => setIsAdminOpen(true)}
          className="p-4 glass rounded-full shadow-2xl text-celebration-pink/40 hover:text-celebration-pink hover:scale-110 transition-transform"
          title="Admin Panel"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,249,240,1)_0%,rgba(255,235,238,1)_100%)]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="z-10"
        >
          <div className="mb-8 flex justify-center">
            <TimeGreeting />
          </div>
          
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="mb-6 inline-block"
          >
            <Heart className="text-celebration-pink fill-celebration-pink w-20 h-20 drop-shadow-[0_0_15px_rgba(255,107,129,0.3)]" />
          </motion.div>
          
          <h1 className="text-6xl md:text-9xl font-serif font-bold text-celebration-pink mb-6 glow-text leading-tight">
            Happy Birthday <br />
            <span className="text-celebration-gold italic">My Queen</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-celebration-text/60 max-w-2xl mx-auto font-light tracking-widest uppercase mb-12">
            Celebrating the light of my life
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="px-10 py-4 bg-celebration-pink text-white rounded-full font-bold shadow-2xl flex items-center gap-2"
            >
              Explore Our Love <Sparkles size={20} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPetalTrigger(prev => prev + 1)}
              className="px-10 py-4 glass text-celebration-pink rounded-full font-bold shadow-xl flex items-center gap-2"
            >
              Shower with Roses <Flower2 size={20} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Live Counter Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-16"
          >
            <Clock className="w-16 h-16 text-celebration-pink mx-auto mb-6 opacity-50" />
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-celebration-pink mb-6">Our Journey Together</h2>
            <p className="text-celebration-text/40 italic font-serif text-xl mb-12">Every second is a new chapter of our story.</p>
            <div className="glass p-8 md:p-12 rounded-[3rem]">
              <WeddingCounter />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Magic Section */}
      <section className="py-32 px-6 relative z-10 bg-celebration-pink/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="glass p-8 rounded-3xl">
              <h3 className="text-2xl font-serif font-bold text-celebration-pink mb-4 flex items-center gap-2">
                <Flower2 className="text-celebration-pink" /> The Bloom of Love
              </h3>
              <p className="text-celebration-text/60 mb-8">Our love grows stronger and more beautiful with every passing day, just like a flower in spring.</p>
              <div className="flex justify-center">
                <BloomingFlower />
              </div>
            </div>
            
            <div className="glass p-8 rounded-3xl">
              <h3 className="text-2xl font-serif font-bold text-celebration-pink mb-4 flex items-center gap-2">
                <Lock className="text-celebration-pink" /> Secret Message
              </h3>
              <p className="text-celebration-text/60 mb-8">I have a secret for you... scratch the card below to reveal what's hidden in my heart.</p>
              <div className="flex justify-center">
                <ScratchCard message="You are my forever and always." />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <SlotMachine />
          </div>
        </div>
      </section>

      {/* Love Meter Section */}
      <section className="py-32 bg-celebration-cream relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-celebration-pink mb-16">The Love Meter</h2>
          
          <div className="relative mb-16">
            <div className="relative h-20 w-full glass-dark rounded-full overflow-hidden border-2 border-celebration-pink/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(loveLevel / 10, 100)}%`,
                  backgroundColor: loveLevel >= 1000 ? '#ffd700' : '#ff6b81'
                }}
                className="h-full relative"
              >
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"
                />
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {loveLevel >= 1000 ? (
                    <motion.div
                      key="infinity"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-4 text-celebration-pink font-black text-3xl"
                    >
                      <span className="tracking-[0.2em]">INFINITY</span>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
                        <InfinityIcon size={40} />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.span key="percent" className="text-3xl font-bold text-celebration-text">
                      {loveLevel}%
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoveMeter}
            className="px-16 py-6 bg-celebration-pink text-white font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(255,107,129,0.3)]"
          >
            {loveLevel >= 1000 ? 'RE-MEASURE MY LOVE' : 'MEASURE MY LOVE'}
          </motion.button>
        </div>
      </section>

      {/* Memories Gallery */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-serif font-bold text-celebration-pink mb-6">Our Eternal Memories</h2>
            <p className="text-celebration-text/40 italic font-serif text-xl mb-8">Captured moments, frozen in time.</p>
            <button 
              onClick={resetMemories}
              className="text-xs text-celebration-pink/40 hover:text-celebration-pink transition-colors underline"
            >
              Reset to Default Memories
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {memories.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -15 }}
                className="group relative aspect-square rounded-[2.5rem] overflow-hidden glass border-2 border-celebration-pink/10"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-celebration-cream via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      value={photo.title}
                      onChange={(e) => handleTitleChange(photo.id, e.target.value)}
                      className="bg-transparent border-b border-celebration-pink/20 text-celebration-pink font-serif text-2xl italic focus:outline-none focus:border-celebration-pink"
                      placeholder="Enter memory title..."
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-celebration-pink/40">Click title to edit</span>
                      <label className="cursor-pointer p-3 glass-dark rounded-full hover:bg-celebration-pink hover:text-white transition-all">
                        <Camera size={24} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(photo.id, e)} />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Love Letter Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {!showLetter ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLetter(true)}
              className="group flex flex-col items-center gap-6 mx-auto"
            >
              <div className="p-12 glass rounded-full shadow-[0_0_50px_rgba(255,107,129,0.2)] text-celebration-pink group-hover:bg-celebration-pink group-hover:text-white transition-all duration-500">
                <Mail size={64} />
              </div>
              <span className="text-2xl font-serif italic text-celebration-pink tracking-widest">Read My Heart</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="parchment p-10 md:p-20 rounded-[3rem] text-left relative border border-celebration-pink/20"
            >
              <div className="absolute top-8 right-8 text-celebration-pink/10">
                <Heart size={80} fill="currentColor" />
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-relaxed text-celebration-text/90 whitespace-pre-wrap">
                {loveLetter}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Gift Box Section */}
      <section className="py-32 px-6 relative z-10 bg-celebration-pink/5">
        <GiftBox />
      </section>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-celebration-pink/10 relative z-10">
        <div className="flex justify-center gap-4 mb-8">
          <Heart className="text-celebration-pink/40" size={20} />
          <Star className="text-celebration-pink/40" size={20} />
          <Heart className="text-celebration-pink/40" size={20} />
        </div>
        <p className="text-celebration-pink/60 font-serif italic text-lg">Created with infinite love for my Queen.</p>
        <p className="mt-4 text-celebration-pink/30 text-sm tracking-widest uppercase">Forever Yours • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

// --- ROSE PETALS COMPONENT (Updated for new theme) ---
const RosePetals = ({ trigger }: { trigger: number }) => {
  const [petals, setPetals] = useState<{ id: number; left: string; delay: number; duration: number; rotation: number }[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newPetals = Array.from({ length: 40 }).map((_, i) => ({
        id: Date.now() + i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: Math.random() * 5 + 5,
        rotation: Math.random() * 360,
      }));
      setPetals(prev => [...prev, ...newPetals]);
      setTimeout(() => setPetals(prev => prev.filter(p => !newPetals.find(np => np.id === p.id))), 10000);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      <AnimatePresence>
        {petals.map(petal => (
          <motion.div
            key={petal.id}
            initial={{ y: -100, opacity: 0, rotate: petal.rotation }}
            animate={{ 
              y: '110vh', 
              x: (Math.random() - 0.5) * 300,
              opacity: [0, 1, 1, 0],
              rotate: petal.rotation + 720
            }}
            transition={{ duration: petal.duration, delay: petal.delay, ease: "linear" }}
            className="absolute text-celebration-pink"
            style={{ left: petal.left }}
          >
            <Flower2 size={28} fill="currentColor" className="opacity-40" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- WEDDING COUNTER COMPONENT (Updated for new theme) ---
const WeddingCounter = () => {
  const weddingDate = new Date('2024-06-07T00:00:00');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - weddingDate.getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((item) => (
        <motion.div key={item.label} whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
          <div className="text-5xl md:text-7xl font-serif font-bold text-celebration-pink mb-2 glow-text">{item.value}</div>
          <div className="text-xs uppercase tracking-[0.3em] text-celebration-pink/40 font-bold">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
};
