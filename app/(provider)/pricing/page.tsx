import { checkoutAction, customerPortalAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { getTeamForUser } from '@/lib/db/queries';

// Prices are fresh for one hour max
export const revalidate = 3600;

const features = [
  'Visible on ChatGPT, Claude & Gemini',
  'Real-time availability sync',
  'Unlimited AI bookings',
  'Booking attribution dashboard',
  'Opening hours & booking types management',
  'Partner integration (Jimani, Zenchef)',
  'Secure booking hold (300s)',
  'Email & phone support',
];

export default async function PricingPage() {
  let prices: any[] = [];
  let products: any[] = [];

  try {
    [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);
  } catch (e) {
    // Stripe not configured yet — show static pricing
  }

  const team = await getTeamForUser();
  const isSubscribed = team?.subscriptionStatus === 'active' || team?.subscriptionStatus === 'trialing';

  const aibookerProduct = products.find((p) => p.name === 'AiBooker') ||
    products.find((p) => p.name === 'Base') ||
    products[0];

  const aibookerPrice = aibookerProduct
    ? prices.find((p) => p.productId === aibookerProduct.id)
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="mt-2 text-gray-600">Manage your subscription plan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Left: Plan info */}
          <div className="md:w-1/2 p-8 md:border-r border-gray-200">
            {isSubscribed ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 mb-4">
                {team.subscriptionStatus === 'trialing' ? 'Free Trial' : 'Active'}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 mb-4">
                Current Plan
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">AiBooker</h2>
            <p className="text-sm text-gray-500 mt-1">per location</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">
                &euro;{aibookerPrice ? (aibookerPrice.unitAmount / 100).toFixed(2) : '12.95'}
              </span>
              <span className="text-gray-500 ml-2">
                / {aibookerPrice?.interval || 'month'}
              </span>
            </div>
            {isSubscribed ? (
              <p className="mt-2 text-sm text-gray-500">
                {team.subscriptionStatus === 'trialing'
                  ? 'Your free trial is active'
                  : 'Your subscription is active'}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                14-day free trial &middot; Cancel anytime
              </p>
            )}

            <div className="mt-8">
              {isSubscribed ? (
                <form action={customerPortalAction}>
                  <SubmitButton label="Manage Subscription" />
                </form>
              ) : aibookerPrice ? (
                <form action={checkoutAction}>
                  <input type="hidden" name="priceId" value={aibookerPrice.id} />
                  <SubmitButton />
                </form>
              ) : (
                <p className="text-sm text-gray-500">
                  Stripe products not configured yet.
                </p>
              )}
            </div>
          </div>

          {/* Right: Features */}
          <div className="md:w-1/2 p-8 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Everything included
            </h3>
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
