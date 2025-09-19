'use client';

import { useState, useEffect } from 'react';

interface Asset {
  id: string;
  name: string;
  source: string;
}

interface Banner {
  id: string;
  assets: Asset[];
  channels: {
    id: string;
    code: string;
  }[];
}

interface ThreeLayoutBannerProps {
  banners: Banner[];
}

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return windowWidth;
};

export function ThreeLayoutBanner({ banners }: ThreeLayoutBannerProps) {
  // Handle missing banners safely
  if (!banners || banners.length < 3) {
    return null;
  }

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768; // Tailwind's md breakpoint is 768px

  const [leftBannerIndex, setLeftBannerIndex] = useState(0);
  const [topRightBannerIndex, setTopRightBannerIndex] = useState(
    1 % banners.length,
  );
  const [bottomRightBannerIndex, setBottomRightBannerIndex] = useState(
    2 % banners.length,
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll effect for each banner section
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMobile) {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        setLeftBannerIndex((prev) => (prev + 1) % banners.length);
        setTopRightBannerIndex((prev) => (prev + 1) % banners.length);
        setBottomRightBannerIndex((prev) => (prev + 1) % banners.length);
      }
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [banners.length, isMobile]);

  const goToNextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPreviousSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isMobile) {
    return (
      <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mt-6 mb-12 relative">
        <div className="w-full h-48 sm:h-64 overflow-hidden rounded-lg relative">
          {banners.map((banner, index) => (
            <img
              key={banner.id}
              src={banner.assets[0]?.source || '/placeholder.svg'}
              alt={banner.assets[0]?.name || 'Banner'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goToPreviousSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full z-10"
        >
          &lt;
        </button>
        <button
          onClick={goToNextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full z-10"
        >
          &gt;
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-gray-400'
              }`}
            ></button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mt-6 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mx-auto">
        {/* Left Big Banner */}
        <div className="lg:col-span-2 h-full relative">
          <div className="w-full h-full overflow-hidden rounded-lg">
            <img
              src={
                banners[leftBannerIndex].assets[0]?.source || '/placeholder.svg'
              }
              alt={banners[leftBannerIndex].assets[0]?.name || 'Banner'}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          </div>
        </div>

        {/* Right Side - 2 Small Stacked Banners */}
        <div className="flex flex-col gap-4">
          {/* Top Right Banner */}
          <div className="h-3/4 relative">
            <div className="w-full h-full overflow-hidden rounded-lg">
              <img
                src={
                  banners[topRightBannerIndex].assets[0]?.source ||
                  '/placeholder.svg'
                }
                alt={banners[topRightBannerIndex].assets[0]?.name || 'Banner'}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="h-1/3 relative">
            <div className="w-full h-full overflow-hidden rounded-lg">
              <img
                src={
                  banners[bottomRightBannerIndex].assets[0]?.source ||
                  '/placeholder.svg'
                }
                alt={
                  banners[bottomRightBannerIndex].assets[0]?.name || 'Banner'
                }
                className="w-full h-full object-cover transition-opacity duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
