# Polar Integration for Convex

This module provides a complete integration between Polar (subscription management platform) and Convex, allowing you to handle subscriptions, payments, and webhooks seamlessly.

## Features

- **Product Management**: Store and retrieve Polar products
- **Subscription Management**: Handle subscription creation, updates, and cancellations
- **Customer Management**: Create and manage customers in Polar
- **Webhook Processing**: Secure webhook handling with signature verification
- **Checkout Sessions**: Create checkout sessions for subscription purchases
- **Utility Functions**: Helper functions for subscription status checks

## Setup

### 1. Environment Variables

Add the following environment variables to your Convex environment:

```bash
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_SUCCESS_URL="https://yourdomain.com/success?checkout_id={CHECKOUT_ID}"
```

### 2. Webhook Configuration

In your Polar dashboard, configure the webhook endpoint:

```
URL: https://your-convex-deployment.convex.cloud/webhooks/polar
Events: subscription.created, subscription.updated, subscription.canceled
```

## Database Schema

The integration creates the following tables:

### `polarProducts`
Stores Polar product information:
- `id`: Polar product ID
- `name`: Product name
- `description`: Product description
- `price`: Product price
- `currency`: Price currency
- `interval`: Billing interval (month/year)
- `active`: Whether the product is active
- `metadata`: Additional product metadata (JSON string)
- `createdAt`, `updatedAt`: Timestamps

### `polarSubscriptions`
Stores subscription information:
- `id`: Polar subscription ID
- `customerId`: Polar customer ID
- `productId`: Polar product ID
- `status`: Subscription status
- `currentPeriodStart`, `currentPeriodEnd`: Billing period
- `cancelAtPeriodEnd`: Whether to cancel at period end
- `canceledAt`, `endedAt`: Cancellation timestamps
- `metadata`: Additional subscription metadata (JSON string)
- `userId`: Associated user ID
- `createdAt`, `updatedAt`: Timestamps

### `polarCustomers`
Stores customer information:
- `id`: Polar customer ID
- `email`: Customer email
- `name`: Customer name
- `metadata`: Additional customer metadata (JSON string)
- `userId`: Associated user ID
- `createdAt`, `updatedAt`: Timestamps

### `polarWebhookEvents`
Stores webhook events for debugging:
- `id`: Event ID
- `type`: Event type
- `data`: Event payload (JSON string)
- `processed`: Whether the event has been processed
- `processedAt`: Processing timestamp
- `createdAt`: Event timestamp

## API Reference

### Public Queries

#### `getProducts()`
Returns all active Polar products.

#### `getProduct(productId: string)`
Returns a specific Polar product by ID.

#### `getUserSubscription(userId: Id<"users">)`
Returns the active subscription for a user.

### Public Mutations

#### `createCustomer(userId: Id<"users">, email: string, name?: string)`
Creates a new customer in Polar and stores the information locally.

#### `createCheckoutSession(userId: Id<"users">, productId: string, successUrl: string, cancelUrl: string)`
Creates a checkout session for subscription purchase.

### Utility Functions

#### `hasActiveSubscription(userId: Id<"users">)`
Returns whether a user has an active subscription.

#### `getSubscriptionWithProduct(userId: Id<"users">)`
Returns subscription details with associated product information.

#### `isSubscriptionExpired(userId: Id<"users">)`
Returns whether a user's subscription has expired.

#### `getDaysUntilExpiry(userId: Id<"users">)`
Returns the number of days until subscription expiry.

## Usage Examples

### Creating a Checkout Session

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const createCheckout = useMutation(api.polar.createCheckoutSession);

const handleSubscribe = async () => {
    const result = await createCheckout({
        userId: currentUserId,
        productId: "prod_123",
        successUrl: "https://yourapp.com/success",
        cancelUrl: "https://yourapp.com/cancel",
    });
    
    // Redirect to checkout
    window.location.href = result.url;
};
```

### Checking Subscription Status

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const hasSubscription = useQuery(api.polar.hasActiveSubscription, {
    userId: currentUserId,
});

if (hasSubscription) {
    // User has active subscription
    console.log("User is subscribed!");
}
```

### Getting Subscription Details

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const subscriptionData = useQuery(api.polar.getSubscriptionWithProduct, {
    userId: currentUserId,
});

if (subscriptionData) {
    console.log("Subscription:", subscriptionData.subscription);
    console.log("Product:", subscriptionData.product);
}
```

## Webhook Processing

The integration automatically processes the following webhook events:

- `subscription.created`: Creates a new subscription record
- `subscription.updated`: Updates an existing subscription record
- `subscription.canceled`: Marks a subscription as canceled

Webhook events are stored in the `polarWebhookEvents` table for debugging purposes.

## Security

- Webhook signatures are verified using HMAC-SHA256
- All webhook processing is done asynchronously to prevent timeouts
- Environment variables are validated at runtime

## Error Handling

The integration includes comprehensive error handling:

- Invalid webhook signatures are rejected
- Missing environment variables are logged
- Database operations are wrapped in try-catch blocks
- Failed webhook processing is logged for debugging

## Best Practices

1. **Always check subscription status** before providing premium features
2. **Use the utility functions** for common subscription checks
3. **Handle webhook failures gracefully** by monitoring the `polarWebhookEvents` table
4. **Test webhook processing** in development using Polar's webhook testing tools
5. **Monitor subscription expiry** and notify users before their subscription expires

## Troubleshooting

### Webhook Not Receiving Events
- Verify the webhook URL is correct in Polar dashboard
- Check that the webhook secret matches your environment variable
- Ensure the webhook endpoint is publicly accessible

### Subscription Not Syncing
- Check the `polarWebhookEvents` table for failed events
- Verify that the customer exists in both Polar and your database
- Ensure the user ID is correctly associated with the customer

### Environment Variables
- Make sure all required environment variables are set in Convex
- Verify the Polar access token has the necessary permissions
- Check that the webhook secret matches your Polar configuration