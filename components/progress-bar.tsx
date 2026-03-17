"use client";

interface ProgressBarProps {
  progress: number; // 0-1
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div
      className={`overflow-hidden rounded-full bg-white/[0.05] ${className}`}
    >
      <div
        className="h-[3px] rounded-full bg-phantom/70 transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
