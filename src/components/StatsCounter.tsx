"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 5000, suffix: "+", label: "Trusted Providers" },
  { text: "Multi", label: "State Licensed" },
  { value: 500000, suffix: "+", label: "Prescriptions Filled" },
  { value: 10, suffix: "+", label: "Years in Business" },
];

function AnimatedNumber({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, target]);

  const formatted = target >= 1000 ? count.toLocaleString() : count;

  return (
    <span className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}

export default function StatsCounter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-white py-16 sm:py-20 border-b border-beige">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-2">
                {"value" in stat && stat.value !== undefined ? (
                  <AnimatedNumber target={stat.value} suffix={stat.suffix ?? ""} inView={inView} />
                ) : (
                  <span>{stat.text}</span>
                )}
              </p>
              <p className="text-sm sm:text-base text-navy/50 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
