/* Public runtime configuration only. Never put Stripe secret keys in this file. */
window.GENEVIEVE_CONFIG = Object.freeze({
  supportEmail: 'tracey@genevieveapp.com.au',
  website: 'https://genevieveapp.com.au',
  stripeMode: 'live',
  paymentLinks: Object.freeze({
    standardMonthly: 'https://buy.stripe.com/3cI6oI3IadEnefWfQW1wY0h',
    concessionMonthly: 'https://buy.stripe.com/5kQ7sMa6y7fZ4Fm48e1wY0d',
    standardAnnual: '',
    concessionAnnual: ''
  })
});
