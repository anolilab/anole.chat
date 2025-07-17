# Polar Integration with Convex

This project uses the official `@convex-dev/polar` package to integrate Polar (subscription management platform) with Convex.

## Features

- **Product Management**: Store and retrieve Polar products
- **Subscription Management**: Handle subscription creation, updates, and cancellations
- **Customer Management**: Create and manage customers in Polar
- **Webhook Processing**: Secure webhook handling with signature verification
- **Checkout Sessions**: Create checkout sessions for subscription purchases
- **Real-time Updates**: Automatic synchronization with Polar via webhooks

## Setup

### 1. Environment Variables

Add the following environment variables to your Convex environment:

```bash
# Required
POLAR_ORGANIZATION_ID=your_organization_id
POLAR_ACCESS_TOKEN=your_access_token
POLAR_WEBHOOK_SECRET=your_webhook_secret

# Optional
POLAR_SUCCESS_URL=https://yourdomain.com/success
POLAR_CANCEL_URL=https://yourdomain.com/cancel
```

### 2. Polar Configuration

The integration is configured in `convex/convex/polar.ts`:

```typescript
export const polarConfig = polar({
    organizationId: process.env.POLAR_ORGANIZATION_ID!,
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    webhookPath: "/webhooks/polar",
    successUrl: process.env.POLAR_SUCCESS_URL || "https://yourdomain.com/success",
    cancelUrl: process.env.POLAR_CANCEL_URL || "https://yourdomain.com/cancel",
});
```

### 3. Database Schema

The integration automatically creates the following tables:

- `polarProducts`: Store product information
- `polarSubscriptions`: Store subscription data
- `polarCustomers`: Store customer information
- `polarWebhookEvents`: Store webhook events for debugging

## Usage

### Frontend Components

#### SubscriptionManager Component

```tsx
import { SubscriptionManager } from "@/components/polar";

function MyPage() {
    return <SubscriptionManager userId="user_id" />;
}
```

#### useSubscription Hook

```tsx
import { useSubscription } from "@/hooks/useSubscription";

function MyComponent() {
    const { 
        hasActiveSubscription, 
        subscribe, 
        cancel, 
        activeSubscription 
    } = useSubscription(userId);

    const handleSubscribe = () => {
        subscribe("product_id");
    };

    return (
        <div>
            {hasActiveSubscription ? (
                <button onClick={cancel}>Cancel Subscription</button>
            ) : (
                <button onClick={handleSubscribe}>Subscribe</button>
            )}
        </div>
    );
}
```

### Backend Functions

The `@convex-dev/polar` package provides the following functions:

#### Queries
- `getProducts()`: Get all available products
- `getProduct(id)`: Get a specific product
- `getSubscriptions(userId)`: Get user's subscriptions
- `getSubscription(id)`: Get a specific subscription
- `getCustomer(userId)`: Get customer information
- `getCustomerSubscriptions(userId)`: Get customer's subscriptions

#### Mutations
- `createCustomer(data)`: Create a new customer
- `updateCustomer(data)`: Update customer information
- `createCheckoutSession(data)`: Create a checkout session
- `cancelSubscription(data)`: Cancel a subscription
- `reactivateSubscription(data)`: Reactivate a canceled subscription

#### Actions
- `syncProducts()`: Sync products from Polar
- `syncSubscriptions()`: Sync subscriptions from Polar
- `syncCustomers()`: Sync customers from Polar

## Webhook Configuration

The integration automatically handles webhooks at `/webhooks/polar`. Configure this endpoint in your Polar dashboard:

1. Go to your Polar organization settings
2. Navigate to Webhooks
3. Add a new webhook with URL: `https://your-convex-deployment.convex.cloud/webhooks/polar`
4. Select the events you want to receive (recommended: all events)
5. Copy the webhook secret and add it to your environment variables

## Example Implementation

### Creating a Subscription

```tsx
import { useMutation } from "convex/react";
import { api } from "@anole/convex/api";

function SubscribeButton({ productId, userId }) {
    const createCheckout = useMutation(api.polar.createCheckoutSession);

    const handleSubscribe = async () => {
        const checkoutUrl = await createCheckout({
            productId,
            userId,
            successUrl: `${window.location.origin}/success`,
            cancelUrl: `${window.location.origin}/cancel`,
        });
        window.location.href = checkoutUrl;
    };

    return <button onClick={handleSubscribe}>Subscribe</button>;
}
```

### Checking Subscription Status

```tsx
import { useQuery } from "convex/react";
import { api } from "@anole/convex/api";

function SubscriptionStatus({ userId }) {
    const subscriptions = useQuery(api.polar.getCustomerSubscriptions, { userId });
    const activeSubscription = subscriptions?.find(sub => sub.status === "active");

    if (activeSubscription) {
        return <div>Active subscription until {new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}</div>;
    }

    return <div>No active subscription</div>;
}
```

## Error Handling

The integration includes comprehensive error handling:

- Webhook signature verification
- Automatic retry for failed operations
- Detailed error logging
- Graceful fallbacks for missing data

## Best Practices

1. **Always verify webhook signatures** (handled automatically)
2. **Use environment variables** for sensitive configuration
3. **Handle loading states** in your UI components
4. **Implement proper error handling** for user-facing operations
5. **Test webhook processing** in development
6. **Monitor webhook events** for debugging

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Check webhook URL and secret
2. **Products not syncing**: Verify access token permissions
3. **Checkout not working**: Ensure success/cancel URLs are configured
4. **Subscription status not updating**: Check webhook event processing

### Debugging

Check the `polarWebhookEvents` table for webhook processing logs:

```typescript
// Query webhook events
const events = await ctx.db.query("polarWebhookEvents").collect();
```

## Support

For issues with the `@convex-dev/polar` package:
- Check the [Convex documentation](https://docs.convex.dev/components/polar)
- Visit the [Convex Discord](https://discord.gg/convex)
- Review the [Polar documentation](https://docs.polar.sh/)