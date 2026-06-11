import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/lib/constants";

interface Props {
  status: BookingStatus;
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge className={`${BOOKING_STATUS_COLORS[status]} border-0 font-medium`}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
