import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getCollections } from '~/providers/collections/collections';
import { getActiveCustomer } from '~/providers/customer/customer';
import { useActiveOrder } from '~/utils/use-active-order';
import { useState, useEffect } from 'react';

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* {isSignedIn ? (
        <Header
          onCartIconClick={() => setOpen(!open)}
          cartQuantity={activeOrder?.totalQuantity ?? 0}
          isSignedIn={isSignedIn}
          collections={collections}
        />
      ) : (
        <Navbar />
      )} */}
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-black">
            Terms and Conditions
          </h1>
          <div className="space-y-5 text-gray-800 text-base leading-relaxed">
            <p>
              <strong>Kaaikani application</strong> is an online sales platform
              for fresh fruits and vegetables. Customers can place orders
              through the app a day in advance, with delivery made to their
              doorstep the next day. We prioritize privacy and security of your
              personal information.
            </p>
            <p>
              <strong>Personnel Data Collection and Usage:</strong> <br />
              <strong>Login and Password:</strong> Each customer creates an
              account with unique login credentials for security purposes.
              <br />
              <strong>Address:</strong> Kaaikani Application collects addresses
              to deliver products directly to customers.
              <br />
              <strong>Bank Details:</strong> Bank details are collected for
              online payment through credit/debit cards, Gpay, Phonepe, and
              internet banking. We do not share personal data with any third
              party without permission.
            </p>
            <p>
              <strong>Children's Privacy:</strong> The application does not
              target individuals under 13 years of age, and we do not collect
              personal information from children.
            </p>
            <p>
              <strong>Policy Updates:</strong> We may update our policies
              periodically. Changes will be communicated by posting the updated
              policy on this page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
