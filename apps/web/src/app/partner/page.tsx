'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateRegisterForm from '@/components/request/register';

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-card p-4">
      {/* Top Left Back Button */}
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/')} className="gap-2 ">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <div className="container mx-auto">
        <CreateRegisterForm />
      </div>
    </div>
  );
}
