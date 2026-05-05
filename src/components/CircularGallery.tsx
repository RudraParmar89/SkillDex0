import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryItem {
  image: string;
  title: string;
  subtitle?: string;
}

interface CircularGalleryProps {
  items: GalleryItem[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

const CircularGallery = ({
  items,
  autoPlay = true,
  interval = 3000,
  className = "",
}: CircularGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (autoPlay && !isHovered) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }, interval);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, isHovered, interval, items.length]);

  const getPosition = (index: number) => {
    const diff = (index - activeIndex + items.length) % items.length;
    const total = items.length;
    const angle = (diff / total) * 360;

    // Map to a semi-circular arc
    const rad = (angle - 90) * (Math.PI / 180);
    const radiusX = 280;
    const radiusY = 80;
    const x = Math.cos(rad) * radiusX;
    const y = Math.sin(rad) * radiusY;
    const scale = diff === 0 ? 1.15 : 0.65 + (1 - Math.abs(Math.sin(rad))) * 0.2;
    const zIndex = diff === 0 ? 10 : 5 - Math.abs(diff);
    const opacity = diff === 0 ? 1 : 0.5 + (1 - Math.abs(Math.sin(rad))) * 0.3;

    return { x, y, scale, zIndex, opacity };
  };

  return (
    <div
      className={`relative w-full flex flex-col items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-[340px] w-full max-w-[700px] flex items-center justify-center overflow-visible mx-auto">
        {items.map((item, index) => {
          const pos = getPosition(index);
          return (
            <motion.div
              key={index}
              animate={{
                x: pos.x,
                y: pos.y,
                scale: pos.scale,
                opacity: pos.opacity,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              style={{ zIndex: pos.zIndex }}
              className="absolute cursor-pointer"
              onClick={() => setActiveIndex(index)}
            >
              <div className="w-[180px] h-[240px] rounded-xl overflow-hidden border border-border shadow-lg bg-card">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active item label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center mt-4"
        >
          <p className="font-display font-semibold text-foreground text-lg">{items[activeIndex].title}</p>
          {items[activeIndex].subtitle && (
            <p className="text-sm text-muted-foreground">{items[activeIndex].subtitle}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex gap-2 mt-4">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-primary w-6" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CircularGallery;
