import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Về đầu trang"
      title="Về đầu trang"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-brand-700 text-white shadow-elevated flex items-center justify-center transition-all duration-200 ease-out hover:bg-brand-600 active:bg-brand-800 cursor-pointer ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}