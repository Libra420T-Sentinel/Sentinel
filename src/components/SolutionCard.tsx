import React from 'react';
import { 
  Heart, 
  Anchor, 
  Droplets, 
  Zap, 
  ShieldCheck, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { HumanitarianSolution } from '../types';
import { cn } from '../utils';

const iconMap: Record<string, any> = {
  Heart,
  Anchor,
  Droplets,
  Zap,
  ShieldCheck,
  Users
};

interface SolutionCardProps {
  solution: HumanitarianSolution;
  className?: string;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({ solution, className }) => {
  const Icon = iconMap[solution.icon] || CheckCircle2;
  
  return (
    <div className={cn(
      "border-2 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60",
      solution.color,
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg bg-current/10")}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-black uppercase tracking-widest text-xs">{solution.title}</h4>
      </div>
      
      <p className="text-white/80 text-xs leading-relaxed mb-4 italic">
        {solution.description}
      </p>
      
      <div className="space-y-2">
        {solution.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="mt-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 opacity-40" />
            </div>
            <span className="text-[10px] text-white/60 leading-tight">{step}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Sovereign-Resilience Module</span>
      </div>
    </div>
  );
};
