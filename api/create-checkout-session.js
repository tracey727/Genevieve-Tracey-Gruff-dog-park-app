const PLANS=Object.freeze({
  standardMonthly:{name:'GENEVIEVE Dog Park — Standard Monthly',amount:1499,interval:'month'},
  concessionMonthly:{name:'GENEVIEVE Dog Park — Concession Monthly',amount:1049,interval:'month'},
  standardAnnual:{name:'GENEVIEVE Dog Park — Standard Annual',amount:11999,interval:'year'},
  concessionAnnual:{name:'GENEVIEVE Dog Park — Concession Annual',amount:8300,interval:'year'}
});

function originFromRequest(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  if(!host) return 'https://genevieve-tracey-gruff-dog-park-app-opal.vercel.app';
  return `${proto}://${host}`;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.STRIPE_SECRET_KEY) return res.status(503).json({error:'Secure payments are being connected. Please try again shortly.'});

  let body=req.body;
  if(typeof body==='string'){
    try{body=JSON.parse(body)}catch{body={}}
  }
  const planKey=String(body?.planKey||'');
  const plan=PLANS[planKey];
  if(!plan) return res.status(400).json({error:'Unknown membership plan.'});

  const origin=originFromRequest(req);
  const form=new URLSearchParams();
  form.set('mode','subscription');
  form.set('success_url',`${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url',`${origin}/?payment=cancelled`);
  form.set('payment_method_collection','always');
  form.set('line_items[0][price_data][currency]','aud');
  form.set('line_items[0][price_data][product_data][name]',plan.name);
  form.set('line_items[0][price_data][product_data][description]','GENEVIEVE App™ Dog Park Membership');
  form.set('line_items[0][price_data][recurring][interval]',plan.interval);
  form.set('line_items[0][price_data][unit_amount]',String(plan.amount));
  form.set('line_items[0][quantity]','1');
  form.set('subscription_data[trial_period_days]','30');
  form.set('allow_promotion_codes','true');
  form.set('metadata[genevieve_plan]',planKey);
  form.set('subscription_data[metadata][genevieve_plan]',planKey);

  try{
    const stripeResponse=await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST',
      headers:{
        Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body:form
    });
    const data=await stripeResponse.json();
    if(!stripeResponse.ok||!data?.url){
      console.error('Stripe checkout session error',data?.error?.type||'unknown');
      return res.status(502).json({error:'Secure checkout could not start. No charge was made.'});
    }
    return res.status(200).json({url:data.url});
  }catch(error){
    console.error('Stripe checkout unavailable',error?.message||error);
    return res.status(502).json({error:'Secure checkout is temporarily unavailable. No charge was made.'});
  }
}
