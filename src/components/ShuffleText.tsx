import { useEffect, useRef, useState, useCallback } from "react";

interface ShuffleTextProps {
  text: string;
  className?: string;
  charSpeed?: number;
  revealDelay?: number;
  characters?: string;
}

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

const ShuffleText = ({
  text,
  className = "",
  charSpeed = 30,
  revealDelay = 50,
  characters = DEFAULT_CHARS,
}: ShuffleTextProps) => {
  const [displayText, setDisplayText] = useState(text);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const scramble = useCallback(() => {
    let revealedCount = 0;
    const totalLength = text.length;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        const chars = text.split("").map((char, i) => {
          if (char === " ") return " ";
          if (i < revealedCount) return text[i];
          return characters[Math.floor(Math.random() * characters.length)];
        });
        return chars.join("");
      });

      revealedCount += 1;
      if (revealedCount > totalLength) {
        clearInterval(intervalRef.current);
        setDisplayText(text);
      }
    }, revealDelay);
  }, [text, characters, revealDelay]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          setTimeout(scramble, 200);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scramble, isVisible]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {displayText}
    </span>
  );
};

export default ShuffleText;
