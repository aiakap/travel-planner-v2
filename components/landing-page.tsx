import React from "react";
import { Compass, Users, Sparkles, ArrowRight, Globe2, Heart, Star } from "lucide-react";
import AuthButton from "@/components/auth-button";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section - Full Bleed */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Hero Image */}
        <Image
          src="/luxury-hotel-room.png"
          alt="Bespoke Travel Experiences"
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay Gradient */}
        <div 
          className="absolute inset-0" 
          style={{ background: 'var(--hero-overlay)' }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
                Experiences Crafted for You
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Discover journeys curated by experts and shaped by people who travel like you
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <AuthButton
                  isLoggedIn={false}
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-4 rounded-lg font-medium transition-smooth shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </AuthButton>
                
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-8 py-4 rounded-lg font-medium transition-smooth border border-white/30"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-smooth">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Personalized</h3>
              <p className="text-slate-600">
                AI-powered recommendations that adapt to your unique travel style and preferences
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-smooth">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Expert Curated</h3>
              <p className="text-slate-600">
                Experiences designed by travel experts and influencers who know destinations best
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-smooth">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Effortlessly Organized</h3>
              <p className="text-slate-600">
                Keep every detail of your journey in one place, from flights to reservations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Travel with Your People Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Travel with Your People
            </h2>
            <p className="text-xl text-slate-600">
              Connect with fellow travelers, join group trips, and share unforgettable experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-50 p-8 rounded-2xl hover:bg-slate-100 transition-smooth cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Users className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Join Group Trips</h3>
              <p className="text-slate-600">
                Discover and join curated group experiences led by expert guides
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl hover:bg-slate-100 transition-smooth cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Heart className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Follow Curators</h3>
              <p className="text-slate-600">
                Get inspired by travel influencers and experts who share your interests
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl hover:bg-slate-100 transition-smooth cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Globe2 className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Create Your Own</h3>
              <p className="text-slate-600">
                Plan and share your own trips, inviting friends to join the adventure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated by Experts Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Curated by Those Who Know
            </h2>
            <p className="text-xl text-white/80">
              Learn from travelers, influencers, and local experts
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: "Curator One", specialty: "Luxury Escapes", image: "/curator-1.jpg" },
              { name: "Curator Two", specialty: "Adventure Seeker", image: "/curator-2.jpg" },
              { name: "Curator Three", specialty: "Wine Country Expert", image: "/curator-3.jpg" },
              { name: "Curator Four", specialty: "Cultural Explorer", image: "/curator-4.jpg" },
            ].map((curator, i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-white/30 transition-smooth">
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <Star className="w-12 h-12 text-white/50" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{curator.name}</h3>
                <p className="text-sm text-white/60">{curator.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to Begin?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of travelers crafting their perfect journeys
            </p>
            <AuthButton
              isLoggedIn={false}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-lg px-10 py-5 rounded-lg font-medium transition-smooth shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </AuthButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex flex-col mb-4">
                <span className="text-2xl font-display tracking-wide">Bespoke</span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/60 -mt-1">
                  Experiences
                </span>
              </div>
              <p className="text-white/60 text-sm">
                Personalized travel experiences crafted for you
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/trips" className="hover:text-white transition-smooth">My Trips</Link></li>
                <li><Link href="/globe" className="hover:text-white transition-smooth">Explore Globe</Link></li>
                <li><Link href="/chat" className="hover:text-white transition-smooth">AI Chat</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-smooth">About</a></li>
                <li><a href="#" className="hover:text-white transition-smooth">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-smooth">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-smooth">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-smooth">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-smooth">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} Bespoke Experiences. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
