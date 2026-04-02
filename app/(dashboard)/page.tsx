'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ChefHat,
  Clock,
  Globe,
  HeartHandshake,
  LineChart,
  MessageSquare,
  Scissors,
  Shield,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Waves,
  Zap,
} from 'lucide-react';
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  TypewriterChat,
} from '@/components/animations';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-base font-semibold text-gray-900 pr-4">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 text-sm text-gray-600 -mt-1">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const faqData = [
  {
    q: 'How do customers book through AI?',
    a: 'When a customer asks ChatGPT, Claude, or Gemini for a recommendation (e.g., "find me a restaurant in Amsterdam"), AiBooker provides your business data and real-time availability. The AI handles the entire conversation and booking — the customer never leaves the chat.',
  },
  {
    q: 'Does AiBooker handle payments?',
    a: 'No. AiBooker only handles the booking flow. All payments, confirmation emails, and post-booking communication are handled by your existing booking partner (Jimani, Zenchef, etc.).',
  },
  {
    q: 'Which booking systems are supported?',
    a: 'We currently support Jimani with Zenchef integration coming soon. Any booking software can integrate via our webhook API.',
  },
  {
    q: 'What happens if two people try to book the same slot?',
    a: 'AiBooker uses a 300-second booking hold. When a customer starts booking, the slot is held for 5 minutes. If they don\'t complete, the slot is released automatically.',
  },
  {
    q: 'Can I control what AI says about my business?',
    a: 'Yes! In your dashboard under Settings > Business Information, you can specify exactly what your business is, when AI should recommend you, your atmosphere, popular dishes, and even when AI should NOT recommend you.',
  },
  {
    q: 'Is there a contract or commitment?',
    a: 'No contracts. Pay monthly at €12.95 per location. Cancel anytime. Start with a 14-day free trial — no credit card required.',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to know about AiBooker.</p>
          </div>
        </FadeIn>
        <div className="space-y-3">
          {faqData.map((item, i) => (
            <FAQItem
              key={i}
              question={item.q}
              answer={item.a}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-500 text-white font-bold text-sm">
                ai
              </div>
              <span className="text-xl font-bold text-gray-900">AiBooker</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#how-it-works" className="hover:text-gray-900">How it works</a>
              <a href="#features" className="hover:text-gray-900">Features</a>
              <a href="#industries" className="hover:text-gray-900">Industries</a>
              <a href="#pricing" className="hover:text-gray-900">Pricing</a>
              <a href="#faq" className="hover:text-gray-900">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700 mb-6">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Booking Platform
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                  Let AI book for
                  <span className="block text-orange-500">your customers</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.35}>
                <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                  AiBooker connects your restaurant, salon, or business to AI
                  platforms like ChatGPT, Claude, and Gemini. Customers can search,
                  find, and complete bookings &mdash; all without leaving their AI
                  assistant.
                </p>
              </FadeIn>
              <FadeIn delay={0.5}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="rounded-full bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full text-lg px-8"
                    >
                      See how it works
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  14-day free trial &middot; No credit card required &middot;
                  &euro;12.95/month
                </p>
              </FadeIn>
            </div>
            <ScaleIn delay={0.4} className="mt-12 lg:mt-0 lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <span>ChatGPT</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-gray-700 text-sm">
                    &ldquo;Find me a nice Italian restaurant in Amsterdam for
                    Saturday evening, 4 people&rdquo;
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    I found 3 great options:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                      <div>
                        <p className="font-medium">La Piazza Amsterdam</p>
                        <p className="text-gray-500 text-xs">Italian &middot; &euro;&euro;&euro; &middot; 4.6&#9733;</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Available</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                      <div>
                        <p className="font-medium">Ristorante Milano</p>
                        <p className="text-gray-500 text-xs">Italian &middot; &euro;&euro; &middot; 4.3&#9733;</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Available</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">Shall I book La Piazza for Saturday 19:30?</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-gray-700 text-sm">
                    &ldquo;Yes, book it! Name: Jan de Vries, email: jan@example.com&rdquo;
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-700">Booked! La Piazza, Sat 19:30, 4 guests</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Confirmation sent to jan@example.com</p>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* Trusted By / Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" staggerDelay={0.15}>
            {[
              { value: '3', label: 'AI Platforms Supported' },
              { value: '300s', label: 'Booking Hold Guarantee' },
              { value: '5 min', label: 'Availability Sync' },
              { value: '24/7', label: 'AI Never Sleeps' },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How AiBooker works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to make your business bookable through AI.
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-3 gap-12" staggerDelay={0.2}>
            {[
              {
                icon: Store,
                step: '1',
                title: 'Connect your booking system',
                desc: 'Your booking partner (Jimani, Zenchef, etc.) activates AiBooker for your business. Your menu, availability, and business info sync automatically.',
              },
              {
                icon: Bot,
                step: '2',
                title: 'AI finds your business',
                desc: 'When someone asks ChatGPT, Claude, or Gemini for a restaurant, salon, or activity — your business shows up with real-time availability.',
              },
              {
                icon: CalendarCheck,
                step: '3',
                title: 'Booking completed via AI',
                desc: 'The customer books directly inside the AI chat. A 300-second hold secures the slot. Payment and confirmation go through your existing system.',
              },
            ].map((item, i) => (
              <StaggerItem key={i} className="text-center">
                <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-orange-100 text-orange-600 mx-auto mb-6">
                  <item.icon className="h-10 w-10" />
                  <span className="absolute -top-2 -right-2 flex items-center justify-center h-7 w-7 rounded-full bg-orange-500 text-white text-xs font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform to manage your AI-powered bookings.
            </p>
          </div>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            {[
              { icon: Globe, title: 'Multi-Platform AI', desc: 'Works with ChatGPT, Claude, and Gemini. Your business is visible across all major AI assistants.' },
              { icon: Zap, title: 'Real-Time Availability', desc: 'Availability syncs every 5 minutes from your booking partner. No double bookings, ever.' },
              { icon: Shield, title: 'Secure Booking Hold', desc: '300-second booking hold ensures the slot stays reserved while the customer confirms.' },
              { icon: MessageSquare, title: 'AI Attribution Tracking', desc: 'See which AI platform, search query, and conversation led to each booking.' },
              { icon: Store, title: 'Partner Dashboard', desc: 'View reservations, manage booking types, opening hours, and business information.' },
              { icon: CalendarCheck, title: 'Partner-Side Payments', desc: 'Payments and confirmations are handled by your existing booking system. AiBooker just connects.' },
              { icon: Clock, title: 'Opening Hours Management', desc: 'Set opening hours per day, per month, per year. AI knows exactly when you are available.' },
              { icon: LineChart, title: 'Booking Analytics', desc: 'Track bookings by platform, see trends, and understand where your AI customers come from.' },
              { icon: HeartHandshake, title: 'Multiple Partners', desc: 'Connect with Jimani, Zenchef, and more booking software partners through one integration.' },
            ].map((feature, i) => (
              <StaggerItem key={i}>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100 text-orange-600 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Built for every booking business</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you run a restaurant, salon, or activity center &mdash; if it can be booked, AI can book it.
            </p>
          </div>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.15}>
            {[
              { icon: UtensilsCrossed, title: 'Restaurants', desc: 'Table reservations for lunch, dinner, private dining, and group events.' },
              { icon: Scissors, title: 'Salons & Spas', desc: 'Hair appointments, beauty treatments, massages, and wellness bookings.' },
              { icon: Waves, title: 'Activities', desc: 'Swimming pools, escape rooms, tours, and experience bookings.' },
              { icon: ChefHat, title: 'Food & Delivery', desc: 'Takeaway orders, food courts, catering, and meal prep services.' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 mx-auto mb-4">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How AI Sees Your Business */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <FadeIn direction="right">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                AI understands your business
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                AiBooker feeds rich context about your business to AI platforms.
                Not just a name and address &mdash; but what makes you special.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'What is this business and what can customers book?',
                  'When should AI recommend you (and when not)?',
                  'What atmosphere, cuisine, and audience do you serve?',
                  'What are your most popular dishes or services?',
                  'Real-time availability and opening hours',
                  'Price range, guest sizes, and special features',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg className="h-3 w-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn direction="left" delay={0.2} className="mt-12 lg:mt-0">
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <p className="text-xs font-mono text-gray-400 mb-3">AI context for &ldquo;La Piazza Amsterdam&rdquo;</p>
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">What is this business?</p>
                    <p className="text-gray-700">Authentic Italian restaurant with terrace in Amsterdam De Pijp.</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">When to recommend?</p>
                    <p className="text-gray-700">Italian food, romantic dinner, nice terrace for lunch.</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">Best for</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['Date night', 'Business dinner', 'Friends', 'Tourists'].map((tag) => (
                        <span key={tag} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">Popular dishes</p>
                    <p className="text-gray-700">Truffle pasta, Margherita from wood-fired oven, Tiramisu</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-orange-600 mb-1">Available tonight</p>
                    <div className="flex gap-2 mt-1">
                      {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((t) => (
                        <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Your AI booking dashboard</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              See every AI booking, track which platform brings the most customers,
              and manage your business profile.
            </p>
          </div>
          {/* Two-column: left = chart + platforms, right = bookings table */}
          <FadeIn>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-2">
                {/* Left column */}
                <div className="p-6 md:border-r border-gray-200">
                  {/* Weekly chart */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">325</p>
                        <p className="text-xs text-gray-500">AI bookings this week</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <div className="flex gap-1.5 h-24 items-end mb-1">
                    {[
                      { h: 40, label: 'Mon' },
                      { h: 55, label: 'Tue' },
                      { h: 35, label: 'Wed' },
                      { h: 65, label: 'Thu' },
                      { h: 50, label: 'Fri' },
                      { h: 45, label: 'Sat' },
                      { h: 35, label: 'Sun' },
                    ].map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-orange-200 hover:bg-orange-400 transition-colors rounded-t cursor-default" style={{ height: `${d.h}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <span key={d} className="flex-1 text-center text-xs text-gray-400">{d}</span>
                    ))}
                  </div>

                  {/* Platform breakdown */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Reservations per AI platform</span>
                      </div>
                      <span className="text-xs text-gray-500">78% fill rate</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'ChatGPT', pct: 50, color: 'bg-orange-500' },
                        { name: 'Claude', pct: 30, color: 'bg-orange-400' },
                        { name: 'Gemini', pct: 20, color: 'bg-orange-300' },
                      ].map((p) => (
                        <div key={p.name}>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{p.name}</span><span>{p.pct}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className={`h-2 rounded-full ${p.color} transition-all`} style={{ width: `${p.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column: Today's bookings */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <CalendarCheck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Today&apos;s AI Bookings</p>
                      <p className="text-xs text-gray-500">12 reservations today</p>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {[
                      { time: '17:00', name: 'Lisa Smit', guests: 2, status: 'Confirmed', platform: 'ChatGPT' },
                      { time: '18:00', name: 'Jan de Vries', guests: 4, status: 'Confirmed', platform: 'ChatGPT' },
                      { time: '18:30', name: 'Emma Bakker', guests: 3, status: 'Confirmed', platform: 'Gemini' },
                      { time: '19:00', name: 'Lucas Meijer', guests: 2, status: 'Pending', platform: 'Claude' },
                      { time: '19:30', name: 'Sophie Jansen', guests: 2, status: 'Confirmed', platform: 'Claude' },
                      { time: '20:00', name: 'Pieter van den Berg', guests: 6, status: 'Pending', platform: 'ChatGPT' },
                      { time: '20:30', name: 'Anna Visser', guests: 4, status: 'Confirmed', platform: 'Gemini' },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center text-sm py-3 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500 w-14 text-xs">{b.time}</span>
                        <span className="text-gray-900 font-medium flex-1">{b.name}</span>
                        <span className="text-gray-400 text-xs mr-3">{b.guests}p</span>
                        <span className="text-gray-400 text-xs mr-3 hidden sm:inline">{b.platform}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'Confirmed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials / Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What AI can do for your business</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Real examples of how customers interact with AI to find and book businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              {
                query: 'Find me a restaurant for Saturday in Amsterdam',
                platform: 'ChatGPT',
                result: 'La Piazza Amsterdam — booked for 4 people at 19:30',
                icon: UtensilsCrossed,
              },
              {
                query: 'I am bored, what can I do now in London?',
                platform: 'Claude',
                result: 'Escape Room London Bridge — 2 tickets booked for 15:00',
                icon: Sparkles,
              },
              {
                query: 'I need a haircut tomorrow morning near me',
                platform: 'Gemini',
                result: 'Studio Kapper — appointment at 10:30 with Alex',
                icon: Scissors,
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500">{item.platform}</span>
                </div>
                <div className="bg-white rounded-lg p-3 mb-3 border border-gray-100">
                  <p className="text-sm text-gray-700 italic">&ldquo;{item.query}&rdquo;</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">{item.result}</p>
                    <p className="text-xs text-gray-500 mt-1">Fully booked via AI &mdash; no website visit needed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Booking Partners */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-medium text-orange-300 mb-6">
                <HeartHandshake className="h-4 w-4" />
                For Booking Software Partners
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Offer AI bookings to all your clients
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                If you build booking software (like Jimani or Zenchef), integrate
                AiBooker to give all your restaurant and salon clients instant
                AI visibility. One integration, unlimited clients.
              </p>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'API integration', desc: 'Simple webhook-based onboarding' },
                  { label: 'Per-client activation', desc: 'Each client toggles AI on/off' },
                  { label: 'Auto-sync', desc: 'Availability, menus, and profiles' },
                  { label: 'Revenue share', desc: 'Earn from each subscription' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Simple pricing</h2>
            <p className="mt-4 text-lg text-gray-600">One plan. Everything included. 14-day free trial.</p>
          </div>
          <ScaleIn className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-orange-500 shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Left: Plan & CTA */}
              <div className="md:w-5/12 p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 mb-4 w-fit">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AiBooker</h3>
                <div className="mt-3">
                  <span className="text-5xl font-bold text-gray-900">&euro;12.95</span>
                  <span className="text-gray-500 ml-2">/ month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">per location &middot; 14-day free trial</p>
                <div className="mt-6">
                  <Link href="/sign-up">
                    <Button className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-3">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-400 text-center mt-3">No credit card required</p>
                </div>
              </div>
              {/* Right: Features */}
              <div className="md:w-7/12 p-8 md:p-10 bg-gray-50 md:border-l border-t md:border-t-0 border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-5">Everything included:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Visible on ChatGPT, Claude & Gemini',
                    'Real-time availability sync',
                    'Unlimited AI bookings',
                    'Booking attribution dashboard',
                    'Opening hours management',
                    'Partner integration (Jimani, Zenchef)',
                    'Booking hold mechanism (300s)',
                    'Email & phone support',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start text-sm text-gray-700">
                      <svg className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to get booked by AI?
          </h2>
          <p className="mt-4 text-lg text-orange-100 max-w-2xl mx-auto">
            Join restaurants, salons, and businesses that are already getting
            bookings through AI assistants. Start your 14-day free trial today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-full bg-white text-orange-600 hover:bg-orange-50 text-lg px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full text-white border-white hover:bg-orange-600 text-lg px-8"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-500 text-white font-bold text-xs">ai</div>
                <span className="text-lg font-bold text-white">AiBooker</span>
              </div>
              <p className="text-sm">AI-powered booking platform for restaurants, salons, and more.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#industries" className="hover:text-white">Industries</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} AiBooker. All rights reserved.</p>
            <div className="flex gap-4 text-sm">
              <span>Integrations: Jimani &middot; Zenchef (coming soon)</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
