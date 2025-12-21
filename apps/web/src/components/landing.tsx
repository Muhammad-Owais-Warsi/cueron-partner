'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-semibold">Cueron Partner</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
            </nav>

            {/* Sign In – visible on ALL screens */}
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            B2B HVAC Service Platform
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Streamline Your HVAC Service Operations Across India
          </h1>

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect agencies with skilled engineers, manage service requests efficiently, and grow
            your HVAC business with our comprehensive partner platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/engineer">Become an Engineer</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">Create Agency</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Free to start • No setup fees • 24/7 support
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Scale Your HVAC Business
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools agencies and engineers need to collaborate
              effectively across India.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ['📱', 'Mobile & Web Access', 'Dedicated mobile app for engineers and web dashboard'],
              ['🗺️', 'Real-time Tracking', 'Live location tracking with Google Maps'],
              ['💳', 'Secure Payments', 'Integrated Razorpay payments'],
              ['📊', 'Analytics & Reports', 'Detailed business insights'],
              ['🔔', 'Smart Notifications', 'Push notifications and SMS updates'],
              ['👥', 'Team Management', 'Manage engineers and assignments'],
            ].map(([icon, title, desc]) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span>{icon}</span>
                    </div>
                    {title}
                  </CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your HVAC Business?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join agencies and engineers already using Cueron Partner across India.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Get Started Today</Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <Separator className="mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 Cueron. All rights reserved.</p>
            <p>Built for the future of HVAC services in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
