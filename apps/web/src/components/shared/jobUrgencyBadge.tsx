import { Badge } from '../ui/badge';
import { AlertCircle, Timer, CheckCircle, Calendar } from 'lucide-react';

export const getJobUrgencyBadge = (urgency: string) => {
  const u = urgency.toLowerCase();

  if (u === 'emergency')
    return (
      <Badge className="text-red-600 bg-red-600/10">
        <AlertCircle className="w-3 h-3 mr-1" /> Emergency
      </Badge>
    );

  if (u === 'urgent')
    return (
      <Badge className="text-orange-600 bg-orange-600/10">
        <Timer className="w-3 h-3 mr-1" /> Urgent
      </Badge>
    );

  if (u === 'normal')
    return (
      <Badge className="text-green-600 bg-green-600/10">
        <CheckCircle className="w-3 h-3 mr-1" /> Normal
      </Badge>
    );

  if (u === 'scheduled')
    return (
      <Badge className="text-blue-600 bg-blue-600/10">
        <Calendar className="w-3 h-3 mr-1" /> Scheduled
      </Badge>
    );

  return <Badge>{urgency}</Badge>;
};
