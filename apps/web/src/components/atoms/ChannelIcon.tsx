import { Globe, MessageCircle } from "lucide-react";

type ChannelIconProps = {
  channel: "web" | "whatsapp";
};

export function ChannelIcon({ channel }: ChannelIconProps) {
  if (channel === "whatsapp") {
    return (
      <span title="WhatsApp">
        <MessageCircle className="size-4 text-emerald-600" aria-label="WhatsApp" />
      </span>
    );
  }
  return (
    <span title="Web">
      <Globe className="size-4 text-blue-600" aria-label="Web" />
    </span>
  );
}
