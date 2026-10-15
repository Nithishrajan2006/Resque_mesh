import React, { useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Radio, 
  Cpu, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Activity,
  Sparkles
} from 'lucide-react';
import { AIIntelligenceImage, AI_INTELLIGENCE_IMAGES } from '../lib/aiImagesData';

interface ImageLightboxModalProps {
  isOpen: boolean;
  activeImageId: string | null;
  onClose: () => void;
  onSelectImage: (id: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  activeImageId,
  onClose,
  onSelectImage,
}) => {
  const images = AI_INTELLIGENCE_IMAGES;
  const currentIndex = Math.max(0, images.findIndex((img) => img.id === activeImageId));
  const activeImage = images[currentIndex] || images[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const prev = (currentIndex - 1 + images.length) % images.length;
        onSelectImage(images[prev].id);
      }
      if (e.key === 'ArrowRight') {
        const next = (currentIndex + 1) % images.length;
        onSelectImage(images[next].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images, onClose, onSelectImage]);

  if (!isOpen || !activeImage) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = (currentIndex - 1 + images.length) % images.length;
    onSelectImage(images[prev].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (currentIndex + 1) % images.length;
    onSelectImage(images[next].id);
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'violet':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'cyan':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#030814]/90 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#071328] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#050e1d]">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider ${getBadgeStyle(activeImage.badgeColor)}`}>
              {activeImage.badge}
            </span>
            <div className="hidden sm:block">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {activeImage.title}
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                {activeImage.category} • Asset {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400/80 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/20 hidden md:inline-block">
              Use ← / → keys to navigate
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.08] hover:border-red-500/30 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Image + Sidebar Details */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Image Display Container */}
          <div className="lg:col-span-8 bg-[#030914] relative flex items-center justify-center p-2 sm:p-4 min-h-[300px] lg:min-h-[500px]">
            <img 
              src={activeImage.src} 
              alt={activeImage.title} 
              className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/[0.05]"
            />

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500 text-white hover:text-slate-950 border border-white/20 transition transform hover:scale-110 shadow-lg"
              title="Previous visual (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-cyan-500 text-white hover:text-slate-950 border border-white/20 transition transform hover:scale-110 shadow-lg"
              title="Next visual (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right Sidebar: Intelligence, Metrics, and Agent Context */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-[#071328] border-t lg:border-t-0 lg:border-l border-white/[0.08] space-y-5 overflow-y-auto">
            <div className="sm:hidden">
              <h2 className="text-base font-bold text-white tracking-wide">
                {activeImage.title}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {activeImage.category}
              </p>
            </div>

            {/* Associated AI Agent */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-cyan-500/20 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  Autonomous AI Engine
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                {activeImage.agentName}
              </p>
              <p className="text-xs text-slate-400">
                {activeImage.agentRole}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Operational Context
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activeImage.description}
              </p>
            </div>

            {/* Live Telemetry / Metrics Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Live Mission Telemetry
              </span>
              <div className="grid grid-cols-2 gap-2">
                {activeImage.metrics.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-0.5">
                    <p className="text-[10px] font-mono text-slate-400">{m.label}</p>
                    <p className="text-xs font-bold text-cyan-300 font-mono truncate">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Notes */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mission Assurance Guardrails
              </span>
              <ul className="space-y-1.5">
                {activeImage.tacticalNotes.map((note, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Thumbnail Carousel Bar */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Visual Roster
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => onSelectImage(img.id)}
                    className={`relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border transition-all ${
                      img.id === activeImage.id
                        ? 'border-cyan-400 ring-2 ring-cyan-500/40 scale-105'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
