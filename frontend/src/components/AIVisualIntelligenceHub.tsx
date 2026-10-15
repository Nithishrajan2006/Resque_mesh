import React, { useState } from 'react';
import { 
  Eye, 
  Maximize2, 
  Sparkles, 
  Plane, 
  Radio, 
  LifeBuoy, 
  ShieldCheck, 
  Layers, 
  Activity,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { AI_INTELLIGENCE_IMAGES, AIIntelligenceImage } from '../lib/aiImagesData';

interface AIVisualIntelligenceHubProps {
  onInspectImage: (id: string) => void;
}

export const AIVisualIntelligenceHub: React.FC<AIVisualIntelligenceHubProps> = ({
  onInspectImage,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filterOptions = [
    { id: 'all', label: 'All Visual Feeds' },
    { id: 'drone-recon', label: 'Drone Recon' },
    { id: 'mesh-p2p', label: 'P2P Mesh' },
    { id: 'rescue-boat', label: 'Water Rescue' },
    { id: 'tactical-hub', label: 'Command Hub' },
    { id: 'problem-solution', label: 'Blueprint' },
  ];

  const filteredImages = selectedFilter === 'all'
    ? AI_INTELLIGENCE_IMAGES
    : AI_INTELLIGENCE_IMAGES.filter((img) => img.id === selectedFilter);

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
    <div className="rounded-3xl bg-gradient-to-br from-[#071328] via-[#0b1c38] to-[#050c18] border border-cyan-500/25 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              AI FIELD INTELLIGENCE & VISUAL RECON
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs font-mono text-cyan-300 hidden sm:inline">
              5 High-Resolution Feeds
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mt-1">
            Tactical Operations & Mesh Visual Gallery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5">
            Photorealistic AI-generated mission telemetry and concept operational visualizations illustrating ResQMesh's zero-cloud mesh architecture in active disaster zones.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                selectedFilter === opt.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Visual Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            onClick={() => onInspectImage(img.id)}
            className="group relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#040b17] hover:border-cyan-400/80 hover:shadow-2xl hover:shadow-cyan-500/15 transition-all duration-300 flex flex-col cursor-pointer"
          >
            {/* Image Thumbnail Container */}
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-black/50">
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Top Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider backdrop-blur-md ${getBadgeStyle(img.badgeColor)}`}>
                  {img.badge}
                </span>
                <span className="p-1 rounded-lg bg-black/60 text-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                </span>
              </div>

              {/* Bottom Quick Metric Overlay */}
              <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 truncate">{img.metrics[0]?.label}: <strong className="text-cyan-300">{img.metrics[0]?.value}</strong></span>
                <span className="text-amber-300 shrink-0">{img.metrics[1]?.value}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#071328]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-semibold">
                  <Cpu className="w-3 h-3" />
                  <span>{img.agentName}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                  {img.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {img.description}
                </p>
              </div>

              {/* Footer Inspect Button */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {img.category}
                </span>
                <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Inspect Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
