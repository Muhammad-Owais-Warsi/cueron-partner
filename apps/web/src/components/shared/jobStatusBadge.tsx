import { Badge } from '../ui/badge';
import {
  Clock,
  UserCheck,
  ThumbsUp,
  Navigation,
  MapPin,
  CheckCircle2Icon,
  XCircle,
} from 'lucide-react';

export const getJobStatusBadge = (status: string) => {
  const s = status.toLowerCase();

  if (s === 'pending')
    return (
      <Badge className="text-yellow-600 bg-yellow-600/10">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </Badge>
    );

  if (s === 'assigned')
    return (
      <Badge className="text-blue-600 bg-blue-600/10">
        <UserCheck className="w-3 h-3 mr-1" /> Assigned
      </Badge>
    );

  if (s === 'accepted')
    return (
      <Badge className="text-indigo-600 bg-indigo-600/10">
        <ThumbsUp className="w-3 h-3 mr-1" /> Accepted
      </Badge>
    );

  if (s === 'travelling')
    return (
      <Badge className="text-sky-600 bg-sky-600/10">
        <Navigation className="w-3 h-3 mr-1" /> Travelling
      </Badge>
    );

  if (s === 'onsite')
    return (
      <Badge className="text-purple-600 bg-purple-600/10">
        <MapPin className="w-3 h-3 mr-1" /> Onsite
      </Badge>
    );

  if (s === 'completed')
    return (
      <Badge className="text-green-600 bg-green-600/10">
        <CheckCircle2Icon className="w-3 h-3 mr-1" /> Completed
      </Badge>
    );

  if (s === 'cancelled')
    return (
      <Badge className="text-red-600 bg-red-600/10">
        <XCircle className="w-3 h-3 mr-1" /> Cancelled
      </Badge>
    );

  return <Badge>{status}</Badge>;
};
