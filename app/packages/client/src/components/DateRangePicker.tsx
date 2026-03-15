type DateRangePickerProps = {
  startValue: string;
  endValue: string;
  min: string;
  max: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

const inputClasses =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60 focus:bg-white/10";

export function DateRangePicker({
  startValue,
  endValue,
  min,
  max,
  onStartChange,
  onEndChange
}: DateRangePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm font-medium text-slate-200">
        Start time (UTC)
        <input
          className={inputClasses}
          type="datetime-local"
          min={min}
          max={max}
          step={1800}
          value={startValue}
          onChange={(event) => onStartChange(event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-slate-200">
        End time (UTC)
        <input
          className={inputClasses}
          type="datetime-local"
          min={min}
          max={max}
          step={1800}
          value={endValue}
          onChange={(event) => onEndChange(event.target.value)}
        />
      </label>
    </div>
  );
}
