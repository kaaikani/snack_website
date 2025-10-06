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
          {/* Wave Layer 1 - Background wave (slowest) */}
          <g className="wave-move-1">
            <path
              fill="#fef3c7"
              fillOpacity="0.2"
              d="M0,60 Q300,90 600,60 T1200,60 Q1500,90 1800,60 T2400,60 L2400,0 L0,0 Z"
            />
          </g>

          {/* Wave Layer 2 - Middle wave (medium speed) */}
          <g className="wave-move-2">
            <path
              fill="#fef3c7"
              fillOpacity="0.4"
              d="M0,45 Q300,75 600,45 T1200,45 Q1500,75 1800,45 T2400,45 L2400,0 L0,0 Z"
            />
          </g>

          {/* Wave Layer 3 - Front wave (fastest) */}
          <g className="wave-move-3">
            <path
              fill="#fef3c7"
              fillOpacity="0.7"
              d="M0,30 Q300,60 600,30 T1200,30 Q1500,60 1800,30 T2400,30 L2400,0 L0,0 Z"
            />
          </g>
        </svg>
      </div>

      {/* Inline Styles for Animation */}
      <style>
        {`
          @keyframes wave-slide {
            0% { 
              transform: translateX(0);
            }
            100% { 
              transform: translateX(-50%);
            }
          }

          .wave-move-1 {
            animation: wave-slide 20s linear infinite;
          }

          .wave-move-2 {
            animation: wave-slide 15s linear infinite;
          }

          .wave-move-3 {
            animation: wave-slide 10s linear infinite;
          }
        `}
      </style>

      {/* Main Footer Content */}
      <div className="relative z-10 pt-32 md:pt-44 ">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-bold">Your Brand</h3>
              <p className="text-sm text-amber-100 leading-relaxed">
                Creating amazing experiences for our customers with quality and care.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200">Quick Links</h4>
              <nav className="flex flex-col gap-3">
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  Home
                </a>
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  About Us
                </a>
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  Services
                </a>
              
              </nav>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200">Support</h4>
              <nav className="flex flex-col gap-3">
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  Help Center
                </a>
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </a>
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  Terms of Service
                </a>
                <a href="#" className="text-amber-100 hover:text-white transition-colors text-sm">
                  FAQ
                </a>
              </nav>
            </div>

            {/* Contact */}
            <div id="contact" className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-amber-200">Get in Touch</h4>
              <div className="flex flex-col gap-3 text-sm text-amber-100">
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>contact@example.com</p>
                <p>(123) 456-7890</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-amber-700/30">
            <p className="text-center text-sm text-amber-200">
              © {new Date().getFullYear()} Your Brand. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}