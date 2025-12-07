import { Badge } from '../ui/badge';
import { Wrench, Hammer, Cog, AlertTriangle } from 'lucide-react';

export const getJobTypeBadge = (type: string) => {
  const t = type.toLowerCase();

  if (t === 'amc')
    return (
      <Badge className="text-blue-600 bg-blue-600/10">
        <Cog className="w-3 h-3 mr-1" /> AMC
      </Badge>
    );

  if (t === 'repair')
    return (
      <Badge className="text-orange-600 bg-orange-600/10">
        <Hammer className="w-3 h-3 mr-1" /> Repair
      </Badge>
    );

  if (t === 'installation')
    return (
      <Badge className="text-green-600 bg-green-600/10">
        <Wrench className="w-3 h-3 mr-1" /> Installation
      </Badge>
    );

  if (t === 'emergency')
    return (
      <Badge className="text-red-600 bg-red-600/10">
        <AlertTriangle className="w-3 h-3 mr-1" /> Emergency
      </Badge>
    );

  return <Badge>{type}</Badge>;
};
