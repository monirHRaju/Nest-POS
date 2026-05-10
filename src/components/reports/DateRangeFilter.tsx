"use client";

import { PRESET_OPTIONS, RangePreset, presetRange, toIsoDate } from "@/lib/utils/date-range";
import { useEffect, useState } from "react";

export interface RangeValue {
  preset: RangePreset;
  from: string;
  to: string;
}

interface Props {
  value: RangeValue;
  onChange: (val: RangeValue) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const [local, setLocal] = useState<RangeValue>(value);

  useEffect(() => setLocal(value), [value]);

  const apply = (next: RangeValue) => {
    setLocal(next);
    onChange(next);
  };

  const onPresetChange = (preset: RangePreset) => {
    if (preset === "custom") {
      apply({ ...local, preset });
      return;
    }
    const r = presetRange(preset);
    apply({ preset, from: toIsoDate(r.from), to: toIsoDate(r.to) });
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-base-content/60 mb-1">Range</label>
        <select
          className="select select-bordered select-sm"
          value={local.preset}
          onChange={(e) => onPresetChange(e.target.value as RangePreset)}
        >
          {PRESET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-base-content/60 mb-1">From</label>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={local.from}
          disabled={local.preset !== "custom"}
          onChange={(e) => apply({ ...local, preset: "custom", from: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-base-content/60 mb-1">To</label>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={local.to}
          disabled={local.preset !== "custom"}
          onChange={(e) => apply({ ...local, preset: "custom", to: e.target.value })}
        />
      </div>
    </div>
  );
}

export function defaultRange(preset: RangePreset = "last30"): RangeValue {
  const r = presetRange(preset);
  return { preset, from: toIsoDate(r.from), to: toIsoDate(r.to) };
}
