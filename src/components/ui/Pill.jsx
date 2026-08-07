export default function Pill({ text, map, fallback = "bg-slate-500/20 text-slate-300" }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border border-black/5 ${
        map[text] || fallback
      }`}
    >
      {text}
    </span>
  );
}
