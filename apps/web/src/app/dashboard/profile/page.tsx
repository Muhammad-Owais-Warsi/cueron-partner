'use client';

import { useState } from 'react';
import { useAuth, useUserProfile } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Shield, Calendar, Star, Building } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: user?.user_metadata?.phone || '',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating profile:', formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SECTION */}
      <div className="lg:col-span-1 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl font-semibold">
                  {getInitials(profile.name || 'U')}
                </AvatarFallback>
              </Avatar>

              <Badge variant="secondary" className="mt-2 capitalize">
                {profile.role}
              </Badge>
            </div>

            <Separator className="my-6" />

            {/* INFO SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.email}</span>
              </div>

              {formData.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formData.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Joined{' '}
                  {new Date(user.created_at).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* ENGINEER ONLY */}
              {profile.role === 'engineer' && (
                <div className="flex items-center gap-3 text-sm">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">4.8 Rating</span>
                </div>
              )}

              {/* MANAGER ONLY */}
              {profile.role === 'manager' && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Agency Manager</span>
                </div>
              )}

              {/* ADMIN ONLY */}
              {profile.role === 'admin' && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Platform Administrator</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECURITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">Password</div>
                <div className="text-xs text-muted-foreground">Last updated 2 months ago</div>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SECTION */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      maxLength={10}
                      placeholder="Enter your phone number"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email address cannot be changed
                  </p>
                </Field>

                <Separator />
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
