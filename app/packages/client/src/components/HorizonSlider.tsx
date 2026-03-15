type HorizonSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function HorizonSlider({
  value,
  min,
  max,
  onChange
}: HorizonSliderProps) {
  return (
    <label className="block rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-200">
          Forecast horizon
        </span>
        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
          {value} hour{value === 1 ? "" : "s"}
        </span>
      </div>

      <input
        className="mt-4 w-full accent-amber-300"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
