import React from 'react';
import { Link } from '@remix-run/react';
import {
  CheckCircle,
  Truck,
  Heart,
  Star,
  Award,
  Leaf,
  Globe,
  Clock,
  Users,
  Package,
  Shield,
} from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen mt-20 bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#f48c06] via-[#ffba08] to-[#faa307] py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/pattern.png')] bg-center"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Our Sweet Journey
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Crafting Delicious Memories Through Premium Snacks and Sweets
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-[#fff9f0] p-8 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#e63946]/10 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-[#e63946]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To create delightful snacking experiences by offering premium
                quality sweets and snacks made with the finest ingredients.
                We're committed to bringing joy to every bite while maintaining
                the highest standards of taste and quality.
              </p>
            </div>
            <div className="bg-[#fff9f0] p-8 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#e63946]/10 rounded-full flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-[#e63946]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To be recognized as a leading brand in the snacks and sweets
                industry, known for our innovative flavors, exceptional quality,
                and the ability to bring people together through our delicious
                products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-[#fff9f0]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-1 bg-[#e63946]/10 text-[#e63946] rounded-full text-sm font-medium mb-4">
              OUR STORY
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Our Sweet Beginning
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              As part of the Kaaikani family, we're excited to bring our
              expertise in quality products to the world of snacks and sweets.
              With our successful track record of serving 20,000+ customers
              through our Kaaikani app and website (kaaikanistore.com), we're
              now channeling our passion into creating irresistible snack
              experiences. Our journey in the FMCG sector since 2023 has taught
              us the importance of quality, innovation, and customer
              satisfaction.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <a
                href="https://play.google.com/store/apps/details?id=com.kaaikani.kaaikani&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 text-[#e63946] border border-[#e63946]  rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <img src="/play-store.png" alt="Google Play" className="h-6" />
                Get Kaaikani App
              </a>
              <a
                href="https://kaaikanistore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2  text-white  rounded-full bg-[#e63946] hover:bg-[#d62839] transition-colors"
              >
                Visit Kaaikani Store
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center w-36">
                <div className="text-3xl font-bold text-[#e63946] mb-2">
                  2023
                </div>
                <div className="text-sm text-gray-600">Founded</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center w-36">
                <div className="text-3xl font-bold text-[#e63946] mb-2">
                  200+
                </div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center w-36">
                <div className="text-3xl font-bold text-[#e63946] mb-2">
                  20K+
                </div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center w-36">
                <div className="text-3xl font-bold text-[#e63946] mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: (
                  <CheckCircle className="w-12 h-12 text-[#e63946] mb-4 mx-auto" />
                ),
                title: 'Premium Quality',
                description:
                  'We use only the finest ingredients for our snacks and sweets, ensuring every bite is a delightful experience.',
              },
              {
                icon: (
                  <Truck className="w-12 h-12 text-[#e63946] mb-4 mx-auto" />
                ),
                title: 'Fast Delivery',
                description:
                  'Get your favorite snacks delivered fresh to your doorstep with our reliable shipping.',
              },
              {
                icon: (
                  <Heart className="w-12 h-12 text-[#e63946] mb-4 mx-auto" />
                ),
                title: 'Made with Love',
                description:
                  'Every snack is prepared with care and attention to detail, just for you.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <span className="inline-block px-4 py-1 bg-[#e63946]/10 text-[#e63946] rounded-full text-sm font-medium mb-4">TESTIMONIALS</span>
            <h2 className="text-3xl font-bold text-gray-800 mb-12">What Our Customers Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The best snacks I've ever had! The quality is unmatched and delivery is always on time.",
                  author: "Sarah M.",
                  rating: 5
                },
                {
                  quote: "I love the variety and the fact that they use high-quality, natural ingredients. My whole family is obsessed!",
                  author: "James L.",
                  rating: 5
                },
                {
                  quote: "Exceptional customer service and the snacks are absolutely delicious. Highly recommend!",
                  author: "Priya K.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-[#fff9f0] p-6 rounded-xl">
                  <div className="flex justify-center mb-4 text-[#ffd700]">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                  <p className="font-medium text-gray-800">— {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* Values Section */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <span className="inline-block px-4 py-1 bg-[#e63946]/10 text-[#e63946] rounded-full text-sm font-medium mb-4">
              OUR VALUES
            </span>
            <h2 className="text-3xl font-bold text-gray-800 mb-12">
              What We Stand For
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <Leaf className="w-8 h-8 text-[#e63946] mb-4 mx-auto" />
                  ),
                  title: 'Sustainability',
                  description:
                    "We're committed to eco-friendly practices and sustainable sourcing.",
                },
                {
                  icon: (
                    <Heart className="w-8 h-8 text-[#e63946] mb-4 mx-auto" />
                  ),
                  title: 'Passion',
                  description:
                    'We pour our hearts into creating snacks that bring people together.',
                },
                {
                  icon: (
                    <Shield className="w-8 h-8 text-[#e63946] mb-4 mx-auto" />
                  ),
                  title: 'Integrity',
                  description:
                    "We believe in transparency and doing what's right, always.",
                },
              ].map((value, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-[#e63946]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
