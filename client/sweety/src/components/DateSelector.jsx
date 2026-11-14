export default function DateSelector({ value, onChange }) {
  return (
    <label className="block rounded-lg border border-[#32322F] bg-[#242422] p-3 text-sm font-medium text-[#E4E4E2]">
      Report date
      <input
        className="mt-1 block w-full select-text rounded-md border border-[#32322F] bg-[#1A1A19] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="mt-1 block text-xs font-normal text-[#8E8E8A]">
        Reports update for this date.
      </span>
    </label>
  );
}
