// app/components/SweetTreatsSection.tsx

'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from '@remix-run/react';
import type { CollectionsQuery } from '~/generated/graphql';

// A simple "Reveal" component for the title animation.
// You can create this in a separate file, e.g., app/components/Reveal.tsx
function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

type Collection = CollectionsQuery['collections']['items'][number];

export function SweetTreatsSection({ collections }: { collections: Collection[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // This smoothly moves the strip horizontally as you scroll the page vertically
const x = useTransform(scrollYProgress, [0, 1], ['1%', '-10%']);
  return (
    <section ref={containerRef} className="py-20 lg:py-28 overflow-hidden bg-amber-50/50">
      <Reveal>
        <div className="text-center mb-12 px-4">
          <h2 className="text-4xl sm:text-5xl font-semibold text-stone-800">Sweet Treats</h2>
          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto mt-2">
            Explore our curated collections of indulgent desserts and handcrafted candies.
          </p>
        </div>
      </Reveal>

      <div className="relative">
        <motion.div
          className="flex gap-6 md:gap-8 px-6 md:px-8"
          style={{ x }} // This applies the automatic scroll effect
          drag="x" // This makes the strip draggable
          dragConstraints={{ left: -1000, right: 1000 }} // Adjust drag limits as needed
          dragElastic={0.1}
        >
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              className="flex-shrink-0 w-64 md:w-80 group cursor-pointer"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/collections/${collection.slug}`} prefetch="intent">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={`${collection.featuredAsset?.preview}?w=400&h=500&format=webp`}
                    alt={collection.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <motion.div
                      className="text-center text-white"
                      initial={{ opacity: 0.9 }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-2xl md:text-3xl font-semibold tracking-wide drop-shadow-md">
                        {collection.name}
                      </h3>
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-stone-500">← Drag to explore →</p>
      </div>
    </section>
  );
}