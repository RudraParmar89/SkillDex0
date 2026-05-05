import { motion } from "framer-motion";
import CircularGallery from "./CircularGallery";
import resumeModern from "@/assets/resume-modern.jpg";
import resumeCreative from "@/assets/resume-creative.jpg";
import resumeMinimal from "@/assets/resume-minimal.jpg";
import resumeExecutive from "@/assets/resume-executive.jpg";
import resumeTech from "@/assets/resume-tech.jpg";

const galleryItems = [
  { image: resumeModern, title: "Modern Professional", subtitle: "Clean & corporate-ready" },
  { image: resumeCreative, title: "Creative Portfolio", subtitle: "Stand out with color" },
  { image: resumeMinimal, title: "Minimalist Elegant", subtitle: "Less is more" },
  { image: resumeExecutive, title: "Executive Dark", subtitle: "Premium leadership style" },
  { image: resumeTech, title: "Tech Developer", subtitle: "Code-inspired design" },
];

const ResumeGallerySection = () => {
  return (
    <section className="relative py-20 px-4 bg-secondary/30 border-t border-border overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-medium tracking-[0.2em] text-primary uppercase">Inspiration</span>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mt-2">
            Best Resume Formats
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Explore top-performing resume templates that pass ATS systems with high scores
          </p>
        </motion.div>

        <CircularGallery items={galleryItems} autoPlay interval={3500} />
      </div>
    </section>
  );
};

export default ResumeGallerySection;
