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
  Eye,
  Lock,
  Database,
  Mail,
  Phone,
  MapPin,
  Users,
  Settings,
  Bell,
  Truck,
  Package,
  Clock,
  XCircle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export async function loader({ request }: { request: Request }) {
  const collections = await getCollections(request, { take: 20 });
  const activeCustomer = await getActiveCustomer({ request });
  return json({ collections, activeCustomer });
}

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-lg text-[#1F0322]/70 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information when you use our
            South Indian sweets and snacks platform.
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
                  <h2 className="text-2xl font-bold">Information We Collect</h2>
                </div>
                <div className="ml-11 space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Personal Information
                      </h3>
                      <p className="text-base leading-relaxed">
                        When you create an account or place an order, we
                        collect:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>
                          Name and contact information (email, phone number)
                        </li>
                        <li>Delivery address and billing information</li>
                        <li>
                          Payment details (processed securely through
                          third-party providers)
                        </li>
                        <li>Account preferences and order history</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Usage Information
                      </h3>
                      <p className="text-base leading-relaxed">
                        We automatically collect information about how you use
                        our platform:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>Device information and browser type</li>
                        <li>IP address and location data</li>
                        <li>Pages visited and time spent on our site</li>
                        <li>Search queries and product preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    How We Use Your Information
                  </h2>
                </div>
                <div className="ml-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Order Processing & Delivery
                      </h3>
                      <p className="text-base leading-relaxed">
                        We use your information to process orders, arrange
                        delivery, and provide customer support.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Communication</h3>
                      <p className="text-base leading-relaxed">
                        We may send you order confirmations, delivery updates,
                        promotional offers, and important service announcements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Service Improvement
                      </h3>
                      <p className="text-base leading-relaxed">
                        We analyze usage patterns to improve our platform,
                        personalize your experience, and develop new features.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <h2 className="text-2xl font-bold">Information Sharing</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-base leading-relaxed">
                    We do not sell, trade, or rent your personal information to
                    third parties. We may share your information only in the
                    following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base ml-4">
                    <li>
                      <strong>Service Providers:</strong> With trusted partners
                      who help us operate our platform (payment processors,
                      delivery services, email providers)
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law
                      or to protect our rights and safety
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In case of merger,
                      acquisition, or sale of business assets
                    </li>
                    <li>
                      <strong>Consent:</strong> When you explicitly give us
                      permission to share your information
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <h2 className="text-2xl font-bold">Data Security</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Protection Measures
                      </h3>
                      <p className="text-base leading-relaxed">
                        We implement industry-standard security measures to
                        protect your personal information:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>SSL encryption for all data transmission</li>
                        <li>Secure servers with regular security updates</li>
                        <li>Limited access to personal information</li>
                        <li>Regular security audits and monitoring</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#ffedc7]/50 p-4 rounded-lg border border-amber-800 /20">
                    <p className="text-sm font-medium text-[#1F0322]">
                      <strong>Note:</strong> While we strive to protect your
                      information, no method of transmission over the internet
                      is 100% secure. We cannot guarantee absolute security.
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
                  <h2 className="text-2xl font-bold">Cookies & Tracking</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-base leading-relaxed">
                    We use cookies and similar technologies to enhance your
                    experience:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base ml-4">
                    <li>
                      <strong>Essential Cookies:</strong> Required for basic
                      platform functionality
                    </li>
                    <li>
                      <strong>Analytics Cookies:</strong> Help us understand how
                      you use our platform
                    </li>
                    <li>
                      <strong>Preference Cookies:</strong> Remember your
                      settings and preferences
                    </li>
                    <li>
                      <strong>Marketing Cookies:</strong> Used to show relevant
                      advertisements
                    </li>
                  </ul>
                  <p className="text-base leading-relaxed">
                    You can control cookie settings through your browser
                    preferences. However, disabling certain cookies may affect
                    platform functionality.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">6</span>
                  </div>
                  <h2 className="text-2xl font-bold">Your Rights</h2>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-base leading-relaxed">
                    You have the following rights regarding your personal
                    information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-base ml-4">
                    <li>
                      <strong>Access:</strong> Request a copy of your personal
                      information
                    </li>
                    <li>
                      <strong>Correction:</strong> Update or correct inaccurate
                      information
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your
                      personal information
                    </li>
                    <li>
                      <strong>Portability:</strong> Receive your data in a
                      structured format
                    </li>
                    <li>
                      <strong>Objection:</strong> Opt-out of certain data
                      processing activities
                    </li>
                    <li>
                      <strong>Restriction:</strong> Limit how we process your
                      information
                    </li>
                  </ul>
                  <p className="text-base leading-relaxed">
                    To exercise these rights, please contact us using the
                    information provided below.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">7</span>
                  </div>
                  <h2 className="text-2xl font-bold">Data Retention</h2>
                </div>
                <div className="ml-11">
                  <p className="text-base leading-relaxed">
                    We retain your personal information for as long as necessary
                    to provide our services and fulfill the purposes outlined in
                    this policy. Account information is typically retained for
                    the duration of your account plus a reasonable period for
                    legal and business purposes. You may request deletion of
                    your account and associated data at any time.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">8</span>
                  </div>
                  <h2 className="text-2xl font-bold">Children's Privacy</h2>
                </div>
                <div className="ml-11">
                  <p className="text-base leading-relaxed">
                    Our platform is not intended for children under 13 years of
                    age. We do not knowingly collect personal information from
                    children under 13. If we become aware that we have collected
                    personal information from a child under 13, we will take
                    steps to delete such information promptly.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">9</span>
                  </div>
                  <h2 className="text-2xl font-bold">Policy Updates</h2>
                </div>
                <div className="ml-11">
                  <p className="text-base leading-relaxed">
                    We may update this privacy policy from time to time to
                    reflect changes in our practices or legal requirements. We
                    will notify you of any material changes by posting the
                    updated policy on this page and updating the "Last updated"
                    date. We encourage you to review this policy periodically.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">10</span>
                  </div>
                  <h2 className="text-2xl font-bold">Shipping & Delivery</h2>
                </div>
                <div className="ml-11 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Order Processing
                      </h3>
                      <p className="text-base leading-relaxed">
                        All orders are processed within 1–2 business days
                        (excluding weekends and holidays) after receiving your
                        order confirmation email. You will receive another
                        notification when your order has shipped.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Domestic Shipping (Within Country)
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>
                          <strong>Delivery Time:</strong> 3–5 business days
                          after dispatch
                        </li>
                        <li>
                          <strong>Shipping Charges:</strong> Calculated at
                          checkout based on your location and order weight
                        </li>
                        <li>
                          <strong>Courier Partners:</strong> We use trusted
                          courier services to ensure fast and reliable delivery
                          across all regions.
                        </li>
                      </ul>
                      <p className="text-base leading-relaxed mt-2">
                        <strong>Please note:</strong> Delivery delays can
                        occasionally occur due to unforeseen circumstances such
                        as weather, public holidays, or courier service
                        interruptions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        International Shipping
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>
                          <strong>Delivery Time:</strong> 3–7 business days
                          after dispatch
                        </li>
                        <li>
                          <strong>Shipping Charges:</strong> Calculated at
                          checkout based on destination, package weight, and
                          shipping method
                        </li>
                        <li>
                          <strong>Customs & Duties:</strong> International
                          orders may be subject to import duties, taxes, and
                          fees, which are the responsibility of the customer.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Order Tracking</h3>
                      <p className="text-base leading-relaxed">
                        Once your order has shipped, you will receive a
                        confirmation email containing your tracking number. You
                        can use this number to check the delivery status
                        directly on the courier's website.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 11 */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-800  to-[#fb6331] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">11</span>
                  </div>
                  <h2 className="text-2xl font-bold">Cancellation Policy</h2>
                </div>
                <div className="ml-11 space-y-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Cancellation Before Shipping
                      </h3>
                      <p className="text-base leading-relaxed">
                        You have the right to cancel your order at any time
                        before it has been shipped. We understand that
                        circumstances may change, and we want to make the
                        cancellation process as smooth as possible for you.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>
                          <strong>Time Window:</strong> Orders can be cancelled
                          anytime before the shipping confirmation email is sent
                          to you
                        </li>
                        <li>
                          <strong>Processing Time:</strong> Cancellation
                          requests are typically processed within 24 hours of
                          receipt
                        </li>
                        <li>
                          <strong>Automatic Cancellation:</strong> If your order
                          has not yet entered the processing stage, you may be
                          able to cancel it directly from your account dashboard
                        </li>
                        <li>
                          <strong>Manual Cancellation:</strong> For orders that
                          have entered processing, please contact our customer
                          service team immediately
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-amber-800  mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Refund Process</h3>
                      <p className="text-base leading-relaxed">
                        When you cancel an order before shipping, you are
                        entitled to a refund of the amount paid:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-base ml-4 mt-2">
                        <li>
                          <strong>Refund Method:</strong> Refunds will be
                          processed to the original payment method used for the
                          order
                        </li>
                        <li>
                          <strong>Processing Time:</strong> Refunds typically
                          appear in your account within 5–10 business days,
                          depending on your bank or payment provider
                        </li>
                        <li>
                          <strong>Shipping Charges:</strong> If applicable,
                          shipping charges will also be refunded in full when
                          cancelling before shipment
                        </li>
                        <li>
                          <strong>Confirmation:</strong> You will receive an
                          email confirmation once your cancellation has been
                          processed and refund initiated
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-gradient-to-r from-[#ffedc7] to-[#ffedc7]/50 p-6 rounded-xl border border-amber-800 /20">
                <h3 className="text-xl font-bold text-[#1F0322] mb-3">
                  Contact Us
                </h3>
                <p className="text-base leading-relaxed text-[#1F0322]/80 mb-4">
                  If you have any questions about this privacy policy or our
                  data practices, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-800  flex-shrink-0" />
                    <span>
                      <strong>Email:</strong>southmithai@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-800  flex-shrink-0" />
                    <span>
                      <strong>Phone:</strong> 1800 309 4983
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
