"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Real-Time Trading",
      description: "Execute trades with real-time market data and instant order execution.",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Bank-level security with encryption and two-factor authentication.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Ultra-low latency trading platform built for speed and performance.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive charts, indicators, and market analysis tools.",
    },
    {
      icon: Globe,
      title: "Global Markets",
      description: "Access stocks, ETFs, and options from markets worldwide.",
    },
    {
      icon: TrendingUp,
      title: "Portfolio Management",
      description: "Track your investments and optimize your portfolio performance.",
    },
  ];

  const stats = [
    { value: "1M+", label: "Active Users" },
    { value: "$50B+", label: "Trading Volume" },
    { value: "99.9%", label: "Uptime" },
    { value: "150+", label: "Countries" },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-card/80 backdrop-blur-md">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-gradient shadow-blue-glow">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-blue-accent">QUANTUM TRADE NEXUS</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/signin"
              className="text-sm sm:text-base text-blue-accent hover:text-blue-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signin"
              className="px-3 sm:px-4 py-2 rounded-lg bg-blue-gradient text-white text-sm sm:text-base font-medium hover:shadow-blue-glow transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6"
            >
              Trade Smarter,{" "}
              <span className="bg-blue-gradient bg-clip-text text-transparent">
                Invest Better
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-blue-accent/70 mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
            >
              The modern trading platform designed for both beginners and professionals.
              Access real-time market data, advanced analytics, and seamless trading
              experience.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/signin"
                className="group flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-blue-gradient text-white font-semibold text-base sm:text-lg hover:shadow-blue-glow transition-all w-full sm:w-auto justify-center"
              >
                Start Trading Now
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/markets"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg border border-dark-border bg-dark-card text-blue-accent font-semibold text-base sm:text-lg hover:border-blue-primary hover:bg-dark-hover transition-all w-full sm:w-auto text-center"
              >
                Explore Markets
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-dark/20 via-transparent to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 border-y border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-blue-accent/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Trade
            </h2>
            <p className="text-lg sm:text-xl text-blue-accent/70 max-w-2xl mx-auto">
              Powerful tools and features to help you make informed trading decisions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg border border-dark-border bg-dark-card p-5 sm:p-6 hover:border-blue-primary hover:shadow-blue-glow transition-all"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-gradient mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-accent mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-blue-accent/70">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-dark-border bg-dark-card p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-gradient opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Start Trading?
              </h2>
              <p className="text-lg sm:text-xl text-blue-accent/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join thousands of traders and investors who trust QUANTUM TRADE NEXUS for their
                trading needs.
              </p>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-blue-gradient text-white font-semibold text-base sm:text-lg hover:shadow-blue-glow transition-all"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-card px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-gradient">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-blue-accent">QUANTUM TRADE NEXUS</span>
            </Link>
            <div className="text-xs sm:text-sm text-blue-accent/70">
              © 2024 QUANTUM TRADE NEXUS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


