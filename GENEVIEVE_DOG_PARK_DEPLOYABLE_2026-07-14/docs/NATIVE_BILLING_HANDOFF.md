# Native Store Billing Handoff

The Vercel/GitHub build is a web/PWA application. It cannot itself execute Apple StoreKit or Google Play Billing transactions.

The included `native-billing-bridge.js` defines the browser-side contract expected from a future native wrapper:

- `purchase(productId)`
- `restore()`

## Apple wrapper

Expose `window.webkit.messageHandlers.genevieveBilling` and handle messages containing:

```json
{"action":"purchase","productId":"genevieve_dogpark_standard_monthly"}
```

Use StoreKit 2, verify transactions, finish transactions, restore current entitlements and send verified entitlement state to a secure backend.

## Android wrapper

Expose an `AndroidBilling` JavaScript interface with:

- `purchase(String productId)`
- `restore()`

Use a currently supported Google Play Billing Library, query products from Play, launch the billing flow, acknowledge purchases, verify purchase tokens on a secure backend and respond to subscription lifecycle changes.

## Security boundary

Never grant premium access solely because JavaScript says a purchase succeeded. Premium entitlement must be based on a provider-verified transaction stored by the secure backend.
