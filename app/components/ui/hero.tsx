'use client';

import LazyImage from '../lazy-video';
import { Button } from './button';

export function Hero() {
  const buttonNew = (
    // Change: Updated button colors from lime to amber
    <Button
      asChild
      className="rounded-full bg-amber-500 px-6 text-black hover:bg-amber-400"
    >
      <a
        href="https://wa.me/919894681385?text=Hello%2C%20SouthMithai."
        target="_blank"
        rel="noopener noreferrer"
      >
        Chat With Us
      </a>
    </Button>
  );

  return (
    <section className="relative isolate overflow-hidden">
      <div className="container mx-auto px-4 ">
        <div className="flex flex-col items-center justify-center py-14 sm:py-20">
          <div className="my-5  flex flex-col items-center gap-2">
            {/* I've also slightly increased the logo size for better impact */}
            <img
              src="/KaaiKani-Logo.png"
              alt="Kaaikani Logo"
              width={96}
              height={96}
              className="h-16 w-full"
            />

            {/* I've changed the text to be more active and adjusted the color */}
            <p className="text-sm uppercase tracking-[0.25em] text-amber-600/90">
              Proudly Presents
            </p>
          </div>
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {/* Change: Updated headline text */}
            <span className="block">TRADITIONAL SWEETS</span>
            {/* Change: Updated headline color and drop shadow */}
            <span className="block text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]">
              DELIVERED FRESH
            </span>
            <span className="block">TO YOUR DOOR</span>
          </h1>
          <div className="mt-6">{buttonNew}</div>

          {/* Phone grid mimic */}
          <div className="mt-10 grid w-full gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {/* Change: Using the new snackData below */}
            {snackData.map((p, i) => {
              const visibility =
                i <= 2
                  ? 'block'
                  : i === 3
                  ? 'hidden md:block'
                  : i === 4
                  ? 'hidden xl:block'
                  : 'hidden';

              return (
                <div key={i} className={visibility}>
                  <PhoneCard
                    title={p.title}
                    sub={p.sub}
                    tone={p.tone}
                    imageSrc={p.imageSrc}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneCard({
  title = 'Sweets',
  sub = 'Deliciously handcrafted.',
  tone = 'authentic',
  imageSrc,
}: {
  title?: string;
  sub?: string;
  tone?: string;
  imageSrc?: string;
}) {
  return (
    <div className="relative rounded-[28px] glass-border bg-neutral-900 p-2">
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-2xl bg-black">
        <LazyImage
          src={imageSrc ?? ''}
          alt={`${title} - ${sub}`}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative z-10 p-3">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
          <div className="space-y-1 px-1">
            <div className="text-3xl font-bold leading-snug text-white/90">
              {title}
            </div>
            <p className="text-xs text-white/70">{sub}</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
              {/* Change: Updated the default tag text and color */}
              {tone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Change: Renamed phoneData to snackData and updated all content
const snackData = [
  {
    title: 'Festive Laddus',
    sub: 'Hand-rolled with pure ghee & love.',
    tone: 'Celebration',
    imageSrc:
      'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/snacks/4.jpg',
  },
  {
    title: 'Freshly Made',
    sub: 'Prepared daily, delivered fresh.',
    tone: 'Freshness',
    imageSrc:
      'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/snacks/1.jpg',
  },
  {
    title: 'Share the Joy',
    sub: 'Perfect for gifting and parties.',
    tone: 'Gifting',
    imageSrc:
      'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/snacks/3.jpg',
  },
  {
    title: 'Authentic Taste',
    sub: 'Traditional recipes passed down generations.',
    tone: 'Tradition',
    imageSrc:
      'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/snacks/2.jpg',
  },
  {
    title: 'Our Collection',
    sub: 'Explore our wide range of sweets.',
    tone: 'Variety',
    imageSrc:
      'https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/snacks/5.jpg',
  },
];
