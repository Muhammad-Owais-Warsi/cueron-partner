'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER: Fixed "Sign In" button visibility for mobile */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Cueron Partner</span>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </a>
            </nav>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION: Optimized for Portrait Phones */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              B2B HVAC Service Platform
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-6 px-2">
              Streamline Your HVAC Service Operations Across India
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed px-4">
              Connect agencies with skilled engineers and manage service requests efficiently.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-6">
              <Button size="lg" className="w-full sm:w-auto h-12" asChild>
                <Link href="/engineer">Become an Engineer</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12" asChild>
                <Link href="/register">Create Agency</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Free to start • No setup fees • 24/7 support
            </p>
          </div>
        </section>

        {/* FEATURES: Grid collapses beautifully on mobile */}
        <section id="features" className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
                Tools built for Indian HVAC market collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Feature cards remain as you had them, now responsive */}
              {[
                {
                  title: 'Mobile & Web',
                  icon: '📱',
                  color: 'bg-blue-500',
                  desc: 'App for engineers, dashboard for agencies.',
                },
                {
                  title: 'Real-time Tracking',
                  icon: '🗺️',
                  color: 'bg-green-500',
                  desc: 'Live location with Google Maps.',
                },
                {
                  title: 'Secure Payments',
                  icon: '💳',
                  color: 'bg-purple-500',
                  desc: 'Integrated Razorpay transactions.',
                },
                {
                  title: 'Analytics',
                  icon: '📊',
                  color: 'bg-orange-500',
                  desc: 'Insights for business growth.',
                },
                {
                  title: 'Notifications',
                  icon: '🔔',
                  color: 'bg-red-500',
                  desc: 'Push and SMS updates.',
                },
                {
                  title: 'Team Management',
                  icon: '👥',
                  color: 'bg-teal-500',
                  desc: 'Manage your engineer network.',
                },
              ].map((f, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div
                        className={`w-10 h-10 ${f.color} rounded-lg flex items-center justify-center shrink-0`}
                      >
                        <span className="text-white">{f.icon}</span>
                      </div>
                      {f.title}
                    </CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER: Fixed for Smartphone Portrait */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="font-bold flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-primary rounded text-[10px] flex items-center justify-center text-white">
                C
              </div>
              Cueron
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering HVAC partnerships across India.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Support</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>Help Center</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-center text-[10px] text-muted-foreground">
          © 2025 Cueron. Built for India.
        </p>
      </footer>
    </div>
  );
}
