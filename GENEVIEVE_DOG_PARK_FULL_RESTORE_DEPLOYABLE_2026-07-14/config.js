/* Public deployment configuration. Never put secret keys, Apple secrets, Google service-account keys or Stripe secret keys in this file. */
window.GENEVIEVE_CONFIG = Object.freeze({
  version: "2026.07.14.3",
  appName: "GENEVIEVE App™ Dog Park",
  businessName: "GENEVIEVE App™",
  legalOperator: "Tracey Ann Kennedy trading as GENEVIEVE App™",

  /* COMPLETE THESE BEFORE PUBLIC STORE OR PAID LAUNCH */
  publicSupportEmail: "",
  publicWebsiteUrl: "",
  publicSupportPhone: "",
  publicBusinessAddress: "",

  /* Optional public Supabase credentials only. Never use the service-role key here. */
  supabaseUrl: "",
  supabaseAnonKey: "",

  /* web | apple | google. URL parameter ?channel= overrides this for testing. */
  defaultChannel: "web",

  products: [
    {id:"genevieve_dogpark_standard_monthly",name:"Standard Monthly",priceLabel:"A$14.99",periodLabel:"each month",audience:"General membership",trialLabel:"30 days free for eligible new subscribers",stripePaymentLink:""},
    {id:"genevieve_dogpark_concession_monthly",name:"Concession Monthly",priceLabel:"A$10.49",periodLabel:"each month",audience:"Eligible concession members — verification process required",trialLabel:"30 days free for eligible new subscribers",stripePaymentLink:""},
    {id:"genevieve_dogpark_standard_annual",name:"Standard Annual",priceLabel:"A$119.99",periodLabel:"each year",audience:"General membership",trialLabel:"30 days free for eligible new subscribers",stripePaymentLink:""},
    {id:"genevieve_dogpark_concession_annual",name:"Concession Annual",priceLabel:"A$83.00",periodLabel:"each year",audience:"Eligible concession members — verification process required",trialLabel:"30 days free for eligible new subscribers",stripePaymentLink:""}
  ]
});
