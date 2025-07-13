# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your AI Chat application using Better Auth and Convex.

## Prerequisites

- A Google Cloud Console account
- Access to your Convex dashboard
- The application already has Better Auth configured

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Fill in the following details:

#### Authorized JavaScript origins:
```
http://localhost:5173
http://127.0.0.1:5173
https://your-production-domain.com
```

#### Authorized redirect URIs:
```
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
https://your-production-domain.com/auth/callback
```

### 1.3 Get Your Credentials
After creating the OAuth client, you'll receive:
- **Client ID** (e.g., `123456789-abcdef.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abcdefghijklmnop`)

## Step 2: Configure Environment Variables

### 2.1 Frontend Environment Variables
Add the following to your `app/.env` file:

```env
# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2.2 Convex Environment Variables
You need to set these environment variables in your Convex dashboard:

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Navigate to **Settings** > **Environment Variables**
4. Add the following variables:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 3: Verify Configuration

### 3.1 Backend Configuration
The Google OAuth configuration is already enabled in your Convex backend:

```typescript
// convex/convex/auth.ts
socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
},
```

### 3.2 Frontend Configuration
The social providers are configured in your root component:

```typescript
// app/src/routes/__root.tsx
<AuthUIProviderTanstack
    // ... other props
    social={{
        providers: ["google"]
    }}
    // ... other props
>
```

### 3.3 Auth Client Configuration
The OIDC client plugin is already added to your auth client:

```typescript
// app/src/lib/auth/client.ts
export const authClient = createAuthClient({
    baseURL: environment.VITE_SITE_URL,
    plugins: [
        // ... other plugins
        oidcClient(),
        // ... other plugins
    ],
});
```

## Step 4: Test the Integration

### 4.1 Start the Development Server
```bash
# Start the Convex development server
cd convex
pnpm dev

# In another terminal, start the frontend
cd app
pnpm dev
```

### 4.2 Test Google Sign-In
1. Navigate to `http://localhost:5173/auth/sign-in`
2. You should see a "Sign in with Google" button
3. Click the button and complete the OAuth flow
4. You should be redirected back to your application and signed in

## Step 5: Production Deployment

### 5.1 Update Google OAuth Settings
1. Go back to Google Cloud Console
2. Update your OAuth 2.0 client settings
3. Add your production domain to **Authorized JavaScript origins**
4. Add your production callback URL to **Authorized redirect URIs**

### 5.2 Deploy to Production
1. Deploy your Convex functions
2. Deploy your frontend application
3. Ensure all environment variables are set in production

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in Google Console matches exactly with your callback URL
   - Check that the protocol (http/https) matches

2. **"Client ID not found" error**
   - Verify that `GOOGLE_CLIENT_ID` is set in your Convex environment variables
   - Check that the client ID is correct and not truncated

3. **"Client secret is invalid" error**
   - Verify that `GOOGLE_CLIENT_SECRET` is set in your Convex environment variables
   - Ensure the client secret is copied correctly

4. **Google sign-in button not appearing**
   - Check that the social providers are configured in the AuthUIProviderTanstack
   - Verify that the OIDC client plugin is included in the auth client

### Debug Steps

1. Check the browser console for any JavaScript errors
2. Check the Convex function logs for backend errors
3. Verify that all environment variables are properly set
4. Ensure the Google+ API is enabled in your Google Cloud project

## Security Considerations

1. **Never commit secrets to version control**
   - Keep your `.env` file in `.gitignore`
   - Use Convex environment variables for backend secrets

2. **Use HTTPS in production**
   - Google OAuth requires HTTPS for production domains
   - Ensure your production environment uses SSL

3. **Regularly rotate secrets**
   - Periodically update your Google OAuth client secret
   - Update the corresponding environment variables

## Next Steps

Once Google OAuth is working, you can:

1. Add additional social providers (GitHub, Discord, etc.)
2. Customize the OAuth flow with additional scopes
3. Implement account linking for existing users
4. Add organization support for OAuth users

## Support

If you encounter issues:

1. Check the [Better Auth documentation](https://better-auth.com)
2. Review the [Convex Better Auth documentation](https://docs.convex.dev/auth/better-auth)
3. Check the [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)