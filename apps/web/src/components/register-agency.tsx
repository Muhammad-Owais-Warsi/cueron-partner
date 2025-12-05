'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function RegisterAgency() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);

      // Here you would typically send the data to your backend
      console.log('Agency registration submitted:', formData);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground">
              Thank you for your interest in joining Cueron Partner.
            </p>
          </div>

          <div className="border rounded-lg p-4 text-left space-y-2">
            <h3 className="font-semibold">What's next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Our team will review your application</li>
              <li>• We'll contact you within 24-48 hours</li>
              <li>• Complete the onboarding process</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Questions? Email us at{' '}
            <a href="mailto:partners@cueron.com" className="underline">
              partners@cueron.com
            </a>
          </p>

          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2">
            Partner Registration
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Register Your Agency</h1>
          <p className="text-muted-foreground">Join the Cueron Partner network</p>
        </div>

        {/* Registration Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Our team will contact you within 24-48 hours to complete the setup.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup className="space-y-4">
              {/* Agency Name */}
              <Field>
                <FieldLabel>Agency Name</FieldLabel>
                <Input
                  type="text"
                  placeholder="Enter agency name"
                  value={formData.agencyName}
                  onChange={(e) => handleInputChange('agencyName', e.target.value)}
                  required
                />
              </Field>

              {/* Contact Person */}
              <Field>
                <FieldLabel>Contact Person</FieldLabel>
                <Input
                  type="text"
                  placeholder="Your full name"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  required
                />
              </Field>

              {/* Email */}
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </Field>

              {/* Phone */}
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </Field>

              {/* City */}
              <Field>
                <FieldLabel>City</FieldLabel>
                <Input
                  type="text"
                  placeholder="Primary city of operations"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </Field>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={
                  isLoading ||
                  !formData.agencyName ||
                  !formData.contactPerson ||
                  !formData.email ||
                  !formData.phone ||
                  !formData.city
                }
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}
