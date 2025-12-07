import { Badge } from '../ui/badge';
import { CheckCircle2Icon, Clock, LoaderIcon, XCircle, RotateCcw } from 'lucide-react';

export const getPaymentStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'completed')
    return (
      <Badge className="text-green-600 bg-green-600/10">
        <CheckCircle2Icon className="w-3 h-3 mr-1" /> Completed
      </Badge>
    );
  if (s === 'pending')
    return (
      <Badge className="text-yellow-600 bg-yellow-600/10">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </Badge>
    );
  if (s === 'processing')
    return (
      <Badge className="text-blue-600 bg-blue-600/10">
        <LoaderIcon className="w-3 h-3 mr-1" /> Processing
      </Badge>
    );
  if (s === 'failed')
    return (
      <Badge className="text-red-600 bg-red-600/10">
        <XCircle className="w-3 h-3 mr-1" /> Failed
      </Badge>
    );
  if (s === 'refunded')
    return (
      <Badge className="text-purple-600 bg-purple-600/10">
        <RotateCcw className="w-3 h-3 mr-1" /> Refunded
      </Badge>
    );
  return <Badge>{status}</Badge>;
};
