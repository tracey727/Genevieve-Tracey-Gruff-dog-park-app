/*
  Store billing bridge contract.
  Web/Vercel uses configured Stripe Payment Links.
  A future Android/iOS wrapper must expose purchase(productId) and restore().
  No external Stripe link is opened when channel=apple or channel=google.
*/
window.GenevieveNativeBilling = window.GenevieveNativeBilling || {
  isAvailable() {
    return Boolean(window.webkit?.messageHandlers?.genevieveBilling || window.AndroidBilling);
  },
  purchase(productId) {
    if (window.webkit?.messageHandlers?.genevieveBilling) {
      window.webkit.messageHandlers.genevieveBilling.postMessage({action:"purchase",productId});
      return true;
    }
    if (window.AndroidBilling?.purchase) {
      window.AndroidBilling.purchase(productId);
      return true;
    }
    return false;
  },
  restore() {
    if (window.webkit?.messageHandlers?.genevieveBilling) {
      window.webkit.messageHandlers.genevieveBilling.postMessage({action:"restore"});
      return true;
    }
    if (window.AndroidBilling?.restore) {
      window.AndroidBilling.restore();
      return true;
    }
    return false;
  }
};
