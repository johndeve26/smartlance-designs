"use client";

import { useEffect, useState } from "react";

export function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const article = document.getElementById("article-body");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress((scrolled / total) * 100);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-accent transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
