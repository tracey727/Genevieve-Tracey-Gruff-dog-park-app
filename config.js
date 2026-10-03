/* Public runtime configuration only. Never put Stripe secret keys in this file. */
window.GENEVIEVE_CONFIG = Object.freeze({
  supportEmail: 'tracey@genevieveapp.com.au',
  website: 'https://genevieveapp.com.au',
  paymentLinks: Object.freeze({
    standardMonthly: '',
    concessionMonthly: '',
    standardAnnual: '',
    concessionAnnual: ''
  })
});
