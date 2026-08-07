export default function Avatar({ name, initials, size = 32 }) {
  const colors = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={`${colors[idx]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
