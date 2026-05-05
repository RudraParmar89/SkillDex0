import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsMarquee from "@/components/StatsMarquee";
import ResumeGallerySection from "@/components/ResumeGallerySection";
import ResumeScanner from "@/components/ResumeScanner";
import JobBoard from "@/components/JobBoard";
import PricingPlans from "@/components/PricingPlans";
import SiteFooter from "@/components/SiteFooter";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id || "home");
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const navigateTo = (section: string) => {
    if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar activeSection={activeSection} onNavigate={navigateTo} />
      <section id="home">
        <HeroSection />
        <StatsMarquee />
      </section>
      <section id="gallery">
        <ResumeGallerySection />
      </section>
      <section id="scanner">
        <ResumeScanner />
      </section>
      <section id="jobs">
        <JobBoard />
      </section>
      <section id="plans">
        <PricingPlans />
      </section>
      <section id="about">
        <SiteFooter onNavigate={navigateTo} />
      </section>
    </div>
  );
};

export default Index;
