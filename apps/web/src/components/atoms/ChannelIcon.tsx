import { GlobeIcon, MessageCircleIcon } from "lucide-react";

import type { SubmissionChannel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CHANNEL_CONFIG: Record<
  SubmissionChannel,
  { label: string; Icon: typeof GlobeIcon }
> = {
  web: { label: "Submitted via web", Icon: GlobeIcon },
  whatsapp: { label: "Submitted via WhatsApp", Icon: MessageCircleIcon },
};

type ChannelIconProps = {
  channel: SubmissionChannel;
  className?: string;
  showTooltip?: boolean;
};

export function ChannelIcon({
  channel,
  className,
  showTooltip = true,
}: ChannelIconProps) {
  const { label, Icon } = CHANNEL_CONFIG[channel];

  const icon = (
    <Icon
      className={cn("size-3.5 shrink-0 text-muted-foreground", className)}
      aria-hidden={showTooltip}
      aria-label={showTooltip ? undefined : label}
    />
  );

  if (!showTooltip) {
    return icon;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" aria-label={label}>
          {icon}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
