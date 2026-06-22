import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Award,
  Briefcase,
  Building2,
  ChevronDown,
  Clock,
  Globe,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Kitchen & Culinary": <Utensils className="w-5 h-5" />,
  "Front Office": <Building2 className="w-5 h-5" />,
  "Housekeeping": <Star className="w-5 h-5" />,
  "Food & Beverage": <Award className="w-5 h-5" />,
  "Security": <Shield className="w-5 h-5" />,
  "Spa & Wellness": <Heart className="w-5 h-5" />,
  "Sales & Marketing": <TrendingUp className="w-5 h-5" />,
  "Finance": <Briefcase className="w-5 h-5" />,
  "Human Resources": <Users className="w-5 h-5" />,
  "Information Technology": <Globe className="w-5 h-5" />,
  "Management": <GraduationCap className="w-5 h-5" />,
};

const BENEFITS = [
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Opportunities",
    description: "Access to career opportunities across 8,000+ Marriot properties worldwide.",
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    title: "Learning & Development",
    description: "Continuous training programs, mentorship, and professional certifications.",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Health & Wellness",
    description: "Comprehensive health insurance, gym access, and wellness programs.",
  },
  {
    icon: <Star className="w-8 h-8" />,
    title: "Bonvoy Benefits",
    description: "Exclusive Marriot Bonvoy member discounts on stays, dining, and experiences.",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Career Growth",
    description: "Clear advancement paths with performance-based promotions and rewards.",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Diverse Community",
    description: "Join a team of 180,000+ associates from over 140 countries worldwide.",
  },
];

const FAQS = [
  {
    q: "How do I apply for a position?",
    a: "Click 'Apply Now' on any job listing, create your account or log in, and complete the multi-step application form. You'll need to upload your CV and relevant documents.",
  },
  {
    q: "What documents do I need to submit?",
    a: "You'll need to upload your CV/resume, a recent passport-sized photo, and a copy of your passport or national ID. Additional certificates relevant to the position are welcome.",
  },
  {
    q: "How long does the recruitment process take?",
    a: "Our typical recruitment process takes 2–4 weeks from application submission to final decision. You can track your application status in real-time through your dashboard.",
  },
  {
    q: "Can I apply for multiple positions?",
    a: "Yes, you may apply for multiple positions that match your skills and experience. Each application is reviewed independently.",
  },
  {
    q: "Will I be notified about my application status?",
    a: "Absolutely. You'll receive in-app notifications and email updates whenever your application status changes or when the recruitment team sends you a message.",
  },
  {
    q: "Is prior hotel experience required?",
    a: "Requirements vary by position. Some roles require specific experience, while others are open to motivated candidates with transferable skills. Check each job listing for details.",
  },
  {
    q: "Are positions open to international applicants?",
    a: "Yes, we welcome applications from candidates worldwide. Successful international candidates will be supported with work permit and relocation guidance.",
  },
  {
    q: "What is the work culture like at Marriot Bonvoy Copenhagen?",
    a: "We foster an inclusive, respectful, and high-performance culture. Our team is passionate about delivering exceptional guest experiences while supporting each other's growth.",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: jobs = [] } = trpc.jobs.list.useQuery();
  const { data: announcements = [] } = trpc.announcements.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Group jobs by category
  const categories = ["All", ...Array.from(new Set(jobs.map((j) => j.category))).sort()];
  const filteredJobs =
    selectedCategory === "All" ? jobs : jobs.filter((j) => j.category === selectedCategory);

  const jobsByCategory = jobs.reduce(
    (acc, job) => {
      if (!acc[job.category]) acc[job.category] = 0;
      acc[job.category]++;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 brand-gradient rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-primary leading-tight">
                Marriot Bonvoy
              </div>
              <div className="text-xs text-muted-foreground leading-tight">Copenhagen Careers</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#jobs" className="text-foreground/70 hover:text-primary transition-colors">
              Open Positions
            </a>
            <a href="#benefits" className="text-foreground/70 hover:text-primary transition-colors">
              Benefits
            </a>
            <a href="#faq" className="text-foreground/70 hover:text-primary transition-colors">
              FAQ
            </a>
            <a href="#contact" className="text-foreground/70 hover:text-primary transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    My Dashboard
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button size="sm" className="brand-gradient text-white border-0">
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="brand-gradient text-white border-0">
                  Sign In / Register
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80')`,
          }}
        />
        <div className="hero-overlay absolute inset-0" />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          {announcements.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-6 animate-fade-in-up">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              {announcements[0].title}
            </div>
          )}
          <h1 className="font-serif text-5xl md:text-7xl font-semibold mb-6 animate-fade-in-up leading-tight">
            Begin Your Journey
            <span className="block text-accent">at Marriot Bonvoy</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in-up animate-delay-100">
            Join our world-class team in Copenhagen and be part of an extraordinary hospitality
            experience that spans the globe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-delay-200">
            <a href="#jobs">
              <Button
                size="lg"
                className="gold-gradient text-foreground font-semibold border-0 hover:opacity-90 transition-opacity px-8"
              >
                Explore Positions
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </a>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm px-8"
                >
                  Create Account
                </Button>
              </a>
            )}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 animate-fade-in-up animate-delay-300">
            {[
              { value: "25+", label: "Open Positions" },
              { value: "8,000+", label: "Global Properties" },
              { value: "180K+", label: "Team Members" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-sm text-white/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/60" />
        </div>
      </section>

      {/* ─── Job Categories Overview ─────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-semibold text-primary mb-3">
              Departments & Categories
            </h2>
            <p className="text-muted-foreground">
              Discover opportunities across all areas of hotel operations
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(jobsByCategory).map(([category, count]) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-border hover:border-primary hover:shadow-md transition-all group text-center"
              >
                <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  {CATEGORY_ICONS[category] ?? <Briefcase className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{category}</span>
                <Badge variant="secondary" className="text-xs">
                  {count} {count === 1 ? "role" : "roles"}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Job Listings ─────────────────────────────────────────────────────── */}
      <section id="jobs" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold text-primary mb-4">
              Open Positions
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We are actively hiring across multiple departments. Find the role that matches your
              passion and expertise.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "brand-gradient text-white shadow-md"
                    : "bg-white border border-border text-foreground/70 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
                {cat !== "All" && jobsByCategory[cat] && (
                  <span className="ml-1 opacity-70">({jobsByCategory[cat]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Job Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      {CATEGORY_ICONS[job.category] ?? <Briefcase className="w-5 h-5" />}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize bg-primary/10 text-primary border-0"
                    >
                      {job.employmentType}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{job.category}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </div>
                  {job.description && (
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {isAuthenticated ? (
                      <Link href={`/apply/${job.id}`} className="flex-1">
                        <Button size="sm" className="w-full brand-gradient text-white border-0">
                          Apply Now
                        </Button>
                      </Link>
                    ) : (
                      <a href={getLoginUrl()} className="flex-1">
                        <Button size="sm" className="w-full brand-gradient text-white border-0">
                          Apply Now
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No positions found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Benefits ─────────────────────────────────────────────────────────── */}
      <section id="benefits" className="py-20 brand-gradient text-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold mb-4">Why Join Our Team?</h2>
            <p className="text-white/70 max-w-xl mx-auto">
              We invest in our people because exceptional hospitality starts with exceptional
              associates.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="w-14 h-14 gold-gradient rounded-xl flex items-center justify-center text-foreground mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How to Apply ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold text-primary mb-4">
              How to Apply
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our application process is straightforward and transparent.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign in with your Manus account to get started.",
                icon: <Users className="w-6 h-6" />,
              },
              {
                step: "02",
                title: "Choose Position",
                desc: "Browse and select the role that matches your skills.",
                icon: <Briefcase className="w-6 h-6" />,
              },
              {
                step: "03",
                title: "Submit Application",
                desc: "Complete the form and upload your documents.",
                icon: <Award className="w-6 h-6" />,
              },
              {
                step: "04",
                title: "Track Progress",
                desc: "Monitor your application status in real-time.",
                icon: <TrendingUp className="w-6 h-6" />,
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-border" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                    {item.icon}
                  </div>
                  <div className="font-serif text-4xl font-bold text-primary/10 absolute -top-2 left-1/2 -translate-x-1/2">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about joining our team.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-lg px-4 bg-white"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-muted/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-semibold text-primary mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground">
              Have questions? Our recruitment team is here to help.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto">
            {[
              {
                icon: <Mail className="w-6 h-6" />,
                title: "Email Us",
                value: "careers.copenhagen@marriot.com",
                sub: "We respond within 24 hours",
              },
              {
                icon: <Phone className="w-6 h-6" />,
                title: "Call Us",
                value: "+45 33 96 00 00",
                sub: "Mon–Fri, 9:00–17:00 CET",
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: "Visit Us",
                value: "Copenhagen, Denmark",
                sub: "Marriot Bonvoy Hotel",
              },
            ].map((contact) => (
              <Card key={contact.title} className="text-center border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    {contact.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{contact.title}</h3>
                  <p className="text-primary font-medium text-sm mb-1">{contact.value}</p>
                  <p className="text-xs text-muted-foreground">{contact.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-16 brand-gradient text-white">
          <div className="container text-center">
            <h2 className="font-serif text-3xl font-semibold mb-4">
              Ready to Start Your Career Journey?
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Join thousands of hospitality professionals who have built their careers with Marriot
              Bonvoy.
            </p>
            <a href={getLoginUrl()}>
              <Button
                size="lg"
                className="gold-gradient text-foreground font-semibold border-0 hover:opacity-90 px-10"
              >
                Apply Today
              </Button>
            </a>
          </div>
        </section>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-foreground text-background/80 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">M</span>
              </div>
              <div>
                <div className="font-serif text-base font-semibold text-background">
                  Marriot Bonvoy Copenhagen
                </div>
                <div className="text-xs text-background/50">Recruitment Portal</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a href="#jobs" className="hover:text-background transition-colors">
                Positions
              </a>
              <a href="#benefits" className="hover:text-background transition-colors">
                Benefits
              </a>
              <a href="#faq" className="hover:text-background transition-colors">
                FAQ
              </a>
              <a href="#contact" className="hover:text-background transition-colors">
                Contact
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-background/50">
              <Clock className="w-3 h-3" />
              © {new Date().getFullYear()} Marriot International. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
