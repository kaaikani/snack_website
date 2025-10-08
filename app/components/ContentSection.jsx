import {
  LifebuoyIcon,
  NewspaperIcon,
  PhoneIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid';

const cards = [
  {
    name: 'Sales',
    description:
      'Delicious snacks at unbeatable prices. Bulk orders made simple and affordable.',
    icon: PhoneIcon,
    color: 'from-amber-800  to-[#FF6B6B]',
    bgColor: 'bg-[#ffedc7]/80',
    borderColor: 'border-amber-800 /30',
  },
  {
    name: 'Technical Support',
    description:
      "We're here to help anytime. Quick support for all your snacking needs.",
    icon: LifebuoyIcon,
    color: 'from-[#fb6331] to-[#fbc531]',
    bgColor: 'bg-[#ffedc7]/80',
    borderColor: 'border-[#fb6331]/30',
  },
  {
    name: 'Orders',
    description:
      'Order fresh, tasty snacks in just a click. Fast delivery right to your door',
    icon: NewspaperIcon,
    color: 'from-[#FFD93D] to-[#fbc531]',
    bgColor: 'bg-[#ffedc7]/80',
    borderColor: 'border-[#FFD93D]/30',
  },
];

const features = [
  '24/7 Customer Support',
  'Fast & Reliable Delivery',
  'Premium Quality Snacks',
  'Bulk Order Discounts',
];

export default function ContentSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* <img
          alt="snacks image"
          src="snacks 5.jpg"
          className="h-full w-full object-cover object-right md:object-center"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/85 to-white/90" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-semibold uppercase text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]">
            Your Snack Journey
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-800  to-[#fb6331]">
              Starts Here
            </span>
          </h1>

          <p className="text-xl text-[#1F0322]/80 max-w-3xl mx-auto leading-relaxed">
            Experience the perfect blend of quality, convenience, and
            exceptional service. From premium snacks to lightning-fast delivery,
            we've got your cravings covered.
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 p-3 rounded-lg bg-[#ffedc7]/90 backdrop-blur-sm border border-amber-800 /20 shadow-sm"
            >
              <CheckCircleIcon className="h-5 w-5 text-amber-800  flex-shrink-0" />
              <span className="text-sm font-medium text-[#1F0322]">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.name}
              className={`relative overflow-hidden rounded-2xl ${card.bgColor} border-2 ${card.borderColor} p-8`}
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-transparent rounded-2xl" />
              </div>

              {/* Icon Container */}
              <div className="relative mb-6">
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${card.color} shadow-lg`}
                >
                  <card.icon className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-2xl font-bold text-[#1F0322] mb-4">
                  {card.name}
                </h3>
                <p className="text-[#1F0322]/80 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
