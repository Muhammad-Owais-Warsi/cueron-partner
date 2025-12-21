'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface NewEngineerRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function NewEngineersList({ agencyId }: { agencyId: string }) {
  const [engineers, setEngineers] = useState<NewEngineerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<NewEngineerRequest | null>(null);

  console.log(agencyId);

  const loadEngineers = async () => {
    try {
      setLoading(true);
      if (!agencyId) {
        return;
      }
      const res = await fetch('/api/new/engineers', {
        method: 'POST', // Must be POST to send a body
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure variable name matches: agencyId
        body: JSON.stringify({ agencyId: agencyId }),
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      console.log('dfdsvdv', data);
      setEngineers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load engineer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, [agencyId]);

  const handleSuspend = async () => {
    if (!selectedEngineer) return;

    try {
      setActionLoading(selectedEngineer.id);
      const res = await fetch(`/api/new/engineers/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedEngineer.user_id }),
      });

      if (!res.ok) throw new Error();

      toast.success(`${selectedEngineer.name} has been suspended`);
      setSelectedEngineer(null); // Close dialog
      loadEngineers();
    } catch {
      toast.error('Failed to suspend engineer');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {engineers.length === 0 && (
        <p className="text-center text-muted-foreground">No pending engineer requests</p>
      )}

      {engineers.map((engineer) => (
        <Card key={engineer.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{engineer.name}</p>
              <p className="text-sm text-muted-foreground">{engineer.email}</p>
            </div>

            {/* Dialog for Suspension Confirmation */}
            <Dialog
              open={selectedEngineer?.id === engineer.id}
              onOpenChange={(open) => !open && setSelectedEngineer(null)}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedEngineer(engineer)}>
                  Suspend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Suspension</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to suspend <strong>{engineer.name}</strong>? This will
                    prevent them from accessing the platform until further notice.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setSelectedEngineer(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSuspend}
                    disabled={actionLoading === engineer.id}
                  >
                    {actionLoading === engineer.id ? 'Suspending...' : 'Confirm Suspension'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
