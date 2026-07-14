/* Optional Supabase REST adapter. The app remains local-first when public credentials are blank. */
window.GenevieveBackend = (() => {
  const cfg = window.GENEVIEVE_CONFIG || {};
  const enabled = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  function headers(extra={}) {
    return {"apikey":cfg.supabaseAnonKey,"Authorization":`Bearer ${cfg.supabaseAnonKey}`,"Content-Type":"application/json",...extra};
  }
  async function health() {
    if (!enabled) return {enabled:false,ok:false,message:"Backend credentials are not configured."};
    try {
      const r = await fetch(`${cfg.supabaseUrl}/rest/v1/parks?select=id&limit=1`, {headers:headers()});
      return {enabled:true,ok:r.ok,message:r.ok?"Supabase REST endpoint responded.":`Backend returned HTTP ${r.status}.`};
    } catch (error) { return {enabled:true,ok:false,message:error.message}; }
  }
  return {enabled,health};
})();
