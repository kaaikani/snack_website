import {
  LifebuoyIcon,
  NewspaperIcon,
  PhoneIcon,
} from '@heroicons/react/20/solid';

const cards = [
  {
    name: 'Sales',
    description:
      'Delicious snacks at unbeatable prices. Bulk orders made simple and affordable.',
    icon: PhoneIcon,
  },
  {
    name: 'Technical Support',
    description:
      'We’re here to help anytime. Quick support for all your snacking needs.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Orders',
    description:
      'Order fresh, tasty snacks in just a click. Fast delivery right to your door',
    icon: NewspaperIcon,
  },
];

export default function ContentSection() {
  return (
    <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
      <img
        alt=""
        src="snacks 5.jpg"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-right md:object-center"
      />
      <div className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
        />
      </div>
      <div className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 gap-x-4 rounded-xl bg-blue-100 p-6 ring-1 ring-inset ring-white/10">
          <h2 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
            Support center
          </h2>
          <p className="mt-6 text-lg leading-8 text-black">
            Our support center is dedicated to ensuring smooth and hassle-free
            service. From bulk snack orders to delivery updates, our team is
            here to assist you. Reach out anytime, and we’ll provide quick,
            reliable solutions..
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.name}
              className="flex gap-x-4 rounded-xl bg-blue-100 p-6 ring-1 ring-inset ring-white/10"
            >
              <card.icon
                aria-hidden="true"
                className="h-7 w-5 flex-none text-indigo-400"
              />
              <div className="text-base leading-7">
                <h3 className="font-semibold text-black">{card.name}</h3>
                <p className="mt-2 text-black">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
