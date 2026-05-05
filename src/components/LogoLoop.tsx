import { ReactNode } from "react";

interface LogoLoopProps {
  children: ReactNode[];
  speed?: number;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  className?: string;
}

const LogoLoop = ({
  children,
  speed = 30,
  pauseOnHover = true,
  direction = "left",
  className = "",
}: LogoLoopProps) => {
  const animationDirection = direction === "left" ? "normal" : "reverse";

  return (
    <div
      className={`logo-loop-container overflow-hidden ${className}`}
      style={{ maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)" }}
    >
      <div
        className={`logo-loop-track flex items-center gap-12 w-max ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
        style={{
          animation: `logo-scroll ${speed}s linear infinite`,
          animationDirection: animationDirection,
        }}
      >
        {children}
        {children}
        {children}
      </div>
    </div>
  );
};

export default LogoLoop;
