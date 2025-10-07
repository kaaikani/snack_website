"use client"

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-amber-900 to-amber-950 text-white overflow-hidden">
      {/* Animated Wave Divider */}
      <div className="absolute -top-[1px] left-0 right-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-[200%] h-[100px] md:h-[140px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
        >
          {/* Wave Layers */}
          <g className="wave-move-1">
            <path fill="#fef3c7" fillOpacity="0.2" d="M0,60 Q300,90 600,60 T1200,60 Q1500,90 1800,60 T2400,60 L2400,0 L0,0 Z" />
          </g>
          <g className="wave-move-2">
            <path fill="#fef3c7" fillOpacity="0.4" d="M0,45 Q300,75 600,45 T1200,45 Q1500,75 1800,45 T2400,45 L2400,0 L0,0 Z" />
          </g>
          <g className="wave-move-3">
            <path fill="#fef3c7" fillOpacity="0.7" d="M0,30 Q300,60 600,30 T1200,30 Q1500,60 1800,30 T2400,30 L2400,0 L0,0 Z" />
          </g>
        </svg>
      </div>

      {/* Inline Styles for Animation */}
      <style>
        {`
          @keyframes wave-slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .wave-move-1 { animation: wave-slide 20s linear infinite; }
          .wave-move-2 { animation: wave-slide 15s linear infinite; }
          .wave-move-3 { animation: wave-slide 10s linear infinite; }
        `}
      </style>

      {/* Main Footer Content */}
      <div className="relative z-10 pt-32 md:pt-44">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Brand Section (Column 1) */}
            <div className="lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="p-2 bg-amber-900/30  inline-block">
                <img 
                  src="https://s3.ap-south-1.amazonaws.com/cdn.kaaikani.co.in/southmithai(1).png" 
                  alt="SOUTH MITTHAI LOGO" 
                  className="h-14 w-auto"
                />
              </div>
              <p className="mt-4 text-sm text-amber-100 leading-relaxed max-w-xs">
South Mithai delivers authentic, traditional South Indian sweets and savory snacks right to your door. Each item is handcrafted with care, using cherished, generations-old recipes for a truly genuine taste. Order online to experience the perfect blend of tradition and freshness for any occasion.              </p>
            </div>

            {/* Links Wrapper (Columns 2 & 3) */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
                {/* Quick Links */}
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200 mb-4">Quick Links</h4>
                  <nav className="space-y-3">
                    <a href="/" className="block text-amber-100 hover:text-white transition-colors text-sm">Home</a>
                    <a href="/about" className="block text-amber-100 hover:text-white transition-colors text-sm">About Us</a>
                  </nav>
                </div>

                {/* Support */}
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200 mb-4">Support</h4>
                  <nav className="space-y-3">
                    <a href="/privacy-policy" className="block text-amber-100 hover:text-white transition-colors text-sm">Privacy Policy</a>
                    <a href="/terms-and-conditions" className="block text-amber-100 hover:text-white transition-colors text-sm">Terms of Service</a>
                  </nav>
                </div>

                {/* Contact */}
                <div id="contact">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200 mb-4">Get in Touch</h4>
                  <address className="not-italic space-y-3 text-sm text-amber-100">
                    <p className="leading-normal">No.4d-1, Montfort Nagar,<br />Dindigul main road,<br />Pirattiyur, Trichy - 620009</p>
                    <p className="mt-2"><a href="mailto:southmithai@gmail.com" className="hover:text-white transition-colors">southmithai@gmail.com</a></p>
                    <p><a href="tel:18003094983" className="hover:text-white transition-colors">1800 309 4983</a></p>
                  </address>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 mt-12 border-t border-amber-700/30">
            <p className="text-center text-sm text-amber-200">
              © {new Date().getFullYear()} South Mithai. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}