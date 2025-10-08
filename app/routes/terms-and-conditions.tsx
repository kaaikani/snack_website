import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getCollections } from '~/providers/collections/collections';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useActiveOrder } from '~/utils/use-active-order';
import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import {
  ArrowLeft,
  Shield,
  Truck,
  CreditCard,
  Users,
  Clock,
} from 'lucide-react';

export async function loader({ request }: { request: Request }) {
  const collections = await getCollections(request, { take: 20 });
  const activeCustomer = await getActiveCustomer({ request });
  return json({ collections, activeCustomer });
}

export default function TermsAndConditions() {
  const { collections, activeCustomer } = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const { activeOrder, refresh } = useActiveOrder();
  const [isSignedIn, setIsSignedIn] = useState(
    !!activeCustomer?.activeCustomer?.id,
  );

  useEffect(() => {
    setIsSignedIn(!!activeCustomer?.activeCustomer?.id);
    refresh();
    // eslint-disable-next-line
  }, [activeCustomer]);

  return (
    <div className="min-h-screen mt-20 bg-gradient-to-br from-[#ffedc7] via-white to-[#ffedc7]">
      {/* Header */}

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1F0322] mb-4">
            Terms & Conditions
          </h1>
          <p className="text-lg text-[#1F0322]/70 max-w-2xl mx-auto">
            Welcome to our South Mithai sweets and snacks platform. Please read
            these terms carefully before using our services.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-800 /10 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="space-y-8 text-[#1F0322]">
              {/* Section 1 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-2xl font-bold">Acceptance of Terms</h2>
                </div>
                <p className="text-base leading-relaxed ml-11">
                  By accessing and using our South Indian sweets and snacks
                  platform, you accept and agree to be bound by the terms and
                  provision of this agreement. If you do not agree to abide by
                  the above, please do not use this service.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-2xl font-bold">Product Information</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-base leading-relaxed">
                    We specialize in authentic South Indian sweets, snacks, and
                    traditional delicacies including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base ml-4">
                    <li>Traditional sweets </li>
                    <li>Savory snacks </li>
                    <li>Festival specials and seasonal items</li>
                    <li>Custom orders for special occasions</li>
                  </ul>
                  <p className="text-base leading-relaxed">
                    All products are made with premium ingredients and
                    traditional recipes. Product images are for reference only
                    and actual products may vary slightly.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <h2 className="text-2xl font-bold">Orders & Payment</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Payment Methods</h3>
                      <p className="text-base leading-relaxed">
                        We accept all major credit/debit cards, UPI payments,
                        net banking, and digital wallets. All transactions are
                        secured with SSL encryption.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Order Processing
                      </h3>
                      <p className="text-base leading-relaxed">
                        Orders are processed within 24-48 hours. Custom orders
                        may take longer. You will receive confirmation via
                        email/SMS.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <h2 className="text-2xl font-bold">Delivery & Shipping</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Delivery Areas</h3>
                      <p className="text-base leading-relaxed">
                        We deliver across major cities in India. Delivery
                        charges vary by location and order value. Free delivery
                        available on orders above ₹500.
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffedc7]/50 p-4 rounded-lg border border-amber-800 /20">
                    <p className="text-sm font-medium text-[#1F0322]">
                      <strong>Note:</strong> Fresh sweets are packed in
                      food-grade containers to maintain quality during transit.
                      We recommend consuming within 3-5 days of delivery.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">5</span>
                  </div>
                  <h2 className="text-2xl font-bold">Returns & Refunds</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-base leading-relaxed">
                    Due to the perishable nature of our products, we have a
                    limited return policy:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base ml-4">
                    <li>Returns accepted within 24 hours of delivery</li>
                    <li>Products must be in original packaging and unopened</li>
                    <li>Quality issues will be addressed immediately</li>
                    <li>Refunds processed within 5-7 business days</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">6</span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    Customer Responsibilities
                  </h2>
                </div>
                <div className="ml-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-base leading-relaxed">
                        Customers are responsible for providing accurate
                        delivery information, being available for delivery, and
                        ensuring proper storage of products upon receipt.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">7</span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    Limitation of Liability
                  </h2>
                </div>
                <div className="ml-11">
                  <p className="text-base leading-relaxed">
                    Our liability is limited to the value of the products
                    purchased. We are not responsible for any indirect,
                    incidental, or consequential damages arising from the use of
                    our products or services.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">8</span>
                  </div>
                  <h2 className="text-2xl font-bold">Modifications</h2>
                </div>
                <div className="ml-11">
                  <p className="text-base leading-relaxed">
                    We reserve the right to modify these terms at any time.
                    Changes will be posted on this page with an updated revision
                    date. Continued use of our services constitutes acceptance
                    of the modified terms.
                  </p>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-gradient-to-r from-[#ffedc7] to-[#ffedc7]/50 p-6 rounded-xl border border-amber-800 /20">
                <h3 className="text-xl font-bold text-[#1F0322] mb-3">
                  Contact Information
                </h3>
                <p className="text-base leading-relaxed text-[#1F0322]/80">
                  For any questions regarding these terms and conditions, please
                  contact us at:
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <strong>Email:</strong> southmithai@gmail.com
                  </p>
                  <p>
                    <strong>Phone:</strong> 1800 309 4983
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
