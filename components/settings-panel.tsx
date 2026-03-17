"use client";

import { useSettings } from "@/hooks/use-settings";
import { MAX_PARALLEL_LIMIT } from "@/lib/constants";
import { IconX } from "@tabler/icons-react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { parallelLimit, setParallelLimit } = useSettings();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel-soft w-full max-w-sm rounded-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] p-4">
          <h3 className="text-[14px] font-semibold tracking-tight text-text">
            Settings
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <label className="mb-2 block text-[11px] font-medium text-text-tertiary">
            Parallel downloads
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={MAX_PARALLEL_LIMIT}
              value={parallelLimit}
              onChange={(e) =>
                setParallelLimit(parseInt(e.target.value, 10))
              }
              className="range-accent flex-1"
            />
            <span className="w-6 text-center font-mono text-[13px] font-medium text-text">
              {parallelLimit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
