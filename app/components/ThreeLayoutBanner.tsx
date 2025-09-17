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

export function ThreeLayoutBanner({ banners }: ThreeLayoutBannerProps) {
  // Handle missing banners safely
  if (!banners || banners.length < 3) {
    return null;
  }

  // State for tracking current banner index for each section with different initial offsets
  const [leftBannerIndex, setLeftBannerIndex] = useState(0);
  const [topRightBannerIndex, setTopRightBannerIndex] = useState(
    1 % banners.length,
  );
  const [bottomRightBannerIndex, setBottomRightBannerIndex] = useState(
    2 % banners.length,
  );

  // Auto-scroll effect for each banner section
  useEffect(() => {
    const interval = setInterval(() => {
      setLeftBannerIndex((prev) => (prev + 1) % banners.length);
      setTopRightBannerIndex((prev) => (prev + 1) % banners.length);
      setBottomRightBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [banners.length]);

  return (
    <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mt-6 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
        {/* Left Big Banner */}
        <div className="md:col-span-2 h-full relative">
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
