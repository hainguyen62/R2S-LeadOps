import { Facebook, Globe, FileText, Megaphone, MessageCircle, Share2, Sprout, MoreHorizontal } from "lucide-react";
import { TikTokIcon, ZaloIcon } from "./SocialIcons.jsx";
import { sourceMeta } from "../../data/mockData.js";

const iconComponents = {
  Facebook,
  TikTok: TikTokIcon,
  Megaphone,
  FileText,
  Globe,
  MessageCircle,
  Zalo: ZaloIcon,
  Share2,
  Sprout,
  MoreHorizontal,
};

export default function SourceBadge({ source }) {
  const meta = sourceMeta[source] || sourceMeta["Other"];
  const Icon = iconComponents[meta.icon] || MoreHorizontal;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600">
      <Icon size={14} className={`${meta.className} shrink-0`} />
      {source}
    </span>
  );
}