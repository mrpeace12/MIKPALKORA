import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  DB: D1Database; SESSIONS: KVNamespace; RATE_LIMIT: KVNamespace; ASSETS: Fetcher;
  APP_NAME: string; APP_URL: string; KORAPAY_BASE_URL: string; KORAPAY_SECRET_KEY: string;
  KORAPAY_PUBLIC_KEY: string; KORAPAY_WEBHOOK_SECRET: string; JWT_PRIVATE_KEY: string;
  JWT_PUBLIC_KEY: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string; RESEND_API_KEY: string;
}
interface User {
  id: string; email: string; username: string | null; full_name: string | null; display_name: string | null;
  phone: string | null; country: string; currency: string; password_hash: string | null; email_verified: number;
  avatar_url: string | null; kyc_verified: number; kyc_verified_name: string | null; pin_hash: string | null;
  pin_attempts: number; pin_locked_until: number; biometrics_enabled: number; daily_limit: number;
  is_frozen: number; frozen_reason: string | null; frozen_at: string | null; created_at: string; updated_at: string;
}
interface JwtPayload { sub: string; email: string; username: string | null; exp: number; iat: number; }
const CURRENCIES = ['GHS','NGN','KES','USD','ZAR','UGX','TZS','RWF','GBP','CAD'] as const;
type Currency = typeof CURRENCIES[number];
const COUNTRIES = [{code:'GH',name:'Ghana',flag:'🇬🇭',currency:'GHS',symbol:'₵'},{code:'NG',name:'Nigeria',flag:'🇳🇬',currency:'NGN',symbol:'₦'},{code:'KE',name:'Kenya',flag:'🇰🇪',currency:'KES',symbol:'KSh'},{code:'ZA',name:'South Africa',flag:'🇿🇦',currency:'ZAR',symbol:'R'},{code:'UG',name:'Uganda',flag:'🇺🇬',currency:'UGX',symbol:'USh'},{code:'TZ',name:'Tanzania',flag:'🇹🇿',currency:'TZS',symbol:'TSh'},{code:'RW',name:'Rwanda',flag:'🇷🇼',currency:'RWF',symbol:'FRw'},{code:'US',name:'United States',flag:'🇺🇸',currency:'USD',symbol:'$'},{code:'GB',name:'United Kingdom',flag:'🇬🇧',currency:'GBP',symbol:'£'},{code:'CA',name:'Canada',flag:'🇨🇦',currency:'CAD',symbol:'C$'}];
const PAYMENT_CHANNELS = {visa:{name:'Visa',color:'#1A1F71'},mastercard:{name:'Mastercard',color:'#EB001B'},mtn_momo:{name:'MTN MoMo',color:'#FFCC00'},telecel_cash:{name:'Telecel Cash',color:'#E60000'},m_pesa:{name:'M-Pesa',color:'#41B549'},airtel_money:{name:'Airtel Money',color:'#E40000'}};
const MAX_PIN_ATTEMPTS=5,PIN_LOCKOUT_MS=30*60*1000,SESSION_TTL=7*24*60*60,JWT_TTL_MS=7*24*60*60*1000;
const TRANSFER_CHANNELS=['momo','ach','eft'] as const,PAYOUT_CHANNELS=['momo','ach','eft','card'] as const;
const MIN_AMOUNT=100,MAX_AMOUNT=1_000_000_000,MAX_BODY_SIZE=10*1024;
function toCents(d:number):number { return Math.round(d*100); }
function fromCents(c:number):number { return Math.round(c)/100; }
function formatCents(c:number,cur:string):string { return `${fromCents(c).toFixed(2)} ${cur}`; }
const app = new Hono<{ Bindings: Env }>();
app.use('*', async (c, next) => { const m = cors({origin:c.env.APP_URL||'*',allowMethods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowHeaders:['Content-Type','Authorization'],credentials:true}); await m(c, next); });
app.use('*', async (c, next) => { if (parseInt(c.req.header('Content-Length')||'0') > MAX_BODY_SIZE) return c.json({error:'Request body too large. Max 10KB.'},413); await next(); });
app.onError((err:any,c) => { console.error('Unhandled error:',err); return c.json({error:'An internal error occurred.'},500); });
app.notFound((c) => { if (c.req.path.startsWith('/api/')||c.req.path.startsWith('/v1/')) return c.json({error:'Endpoint not found'},404); return c.env.ASSETS.fetch(c.req.raw); });
function validateEmail(e:string):boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validatePin(p:string):boolean { return /^\d{4}$/.test(p); }
function validateAmount(a:any):number|null { const n=typeof a==='string'?parseFloat(a):a; if(typeof n!=='number'||!isFinite(n)||isNaN(n)||n<0.01||n>10_000_000) return null; return toCents(n); }
function validateCurrency(c:string):c is Currency { return (CURRENCIES as readonly string[]).includes(c); }
function sanitizeUsername(u:string):string { return u.toLowerCase().replace(/[^a-z0-9_]/g,''); }
function getClientIP(c:any):string { return c.req.header('CF-Connecting-IP')||c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()||''; }
async function calculateFee(env:Env,amountCents:number,transactionType:string='all'):Promise<number> { if(transactionType==='p2p_send'||transactionType==='p2p_receive') return 0; const rule=await env.DB.prepare(`SELECT fee_amount,fee_type,fee_percent FROM fee_rules WHERE is_active=1 AND min_amount<=? AND (max_amount IS NULL OR max_amount>=?) AND (transaction_type=? OR transaction_type='all') ORDER BY min_amount DESC LIMIT 1`).bind(amountCents,amountCents,transactionType).first<any>(); if(!rule) return 0; if(rule.fee_type==='percentage') return Math.round(amountCents*(rule.fee_percent/100)); return rule.fee_amount; }
function validatePhone(p:string):boolean { return /^\+\d{8,15}$/.test(p); }
async function createNotification(env:Env,uid:string,type:string,title:string,msg:string,ref?:string,amt?:number,cur?:string):Promise<void> { await env.DB.prepare('INSERT INTO notifications (id,user_id,type,title,message,reference,amount,currency) VALUES (?,?,?,?,?,?,?,?)').bind(generateId('not_'),uid,type,title,msg,ref||null,amt||null,cur||null).run(); }
async function hashPassword(p:string,s='mikpal_salt_v1'):Promise<string> { const d=new TextEncoder().encode(p+s); const h=await crypto.subtle.digest('SHA-256',d); return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function hashPin(p:string,s:string):Promise<string> { const d=new TextEncoder().encode(p+s+'pin_salt_v1'); const h=await crypto.subtle.digest('SHA-256',d); return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
function generateToken(l=32):string { const a=new Uint8Array(l); crypto.getRandomValues(a); return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join(''); }
function generateId(p=''):string { return p+crypto.randomUUID(); }
function generateReference():string { return `MPL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,8)}`.toUpperCase(); }
function b64url(i:string|ArrayBuffer):string { if(typeof i==='string') return btoa(i).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,''); return btoa(String.fromCharCode(...new Uint8Array(i))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,''); }
function b64urlDecode(s:string):Uint8Array { return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)); }
async function importPrivateKey(j:any):Promise<CryptoKey> { return crypto.subtle.importKey('jwk',j,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']); }
async function importPublicKey(j:any):Promise<CryptoKey> { return crypto.subtle.importKey('jwk',j,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']); }
async function signJWT(p:Omit<JwtPayload,'iat'>,k:string):Promise<string> { const j=JSON.parse(k); const key=await importPrivateKey(j); const fp:JwtPayload={...p,iat:Date.now()}; const h={alg:'RS256',typ:'JWT',kid:j.kid||'MIKPAL-KEY-1'}; const d=`${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(fp))}`; const s=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(d)); return `${d}.${b64url(s)}`; }
async function verifyJWT(t:string,k:string):Promise<JwtPayload|null> { try { const p=t.split('.'); if(p.length!==3) return null; const [h,pb,sb]=p; const d=`${h}.${pb}`; const key=await importPublicKey(JSON.parse(k)); const v=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64urlDecode(sb),new TextEncoder().encode(d)); if(!v) return null; const pl:JwtPayload=JSON.parse(atob(pb.replace(/-/g,'+').replace(/_/g,'/'))); if(pl.exp&&Date.now()>pl.exp) return null; return pl; } catch { return null; } }
async function createSession(env:Env,uid:string,ip:string):Promise<string> { const t=generateToken(32); const th=await hashPassword(t); await env.SESSIONS.put(`session:${t}`,JSON.stringify({user_id:uid,expires_at:Date.now()+JWT_TTL_MS}),{expirationTtl:SESSION_TTL}); await env.DB.prepare('INSERT INTO sessions (id,user_id,token_hash,ip_address,expires_at) VALUES (?,?,?,?,?)').bind(generateId('ses_'),uid,th,ip,Date.now()+JWT_TTL_MS).run(); return t; }
async function verifySession(env:Env,t:string):Promise<{user_id:string}|null> { if(!t) return null; const kv=await env.SESSIONS.get(`session:${t}`); if(kv) { const p=JSON.parse(kv); if(Date.now()>p.expires_at) { await env.SESSIONS.delete(`session:${t}`); return null; } return {user_id:p.user_id}; } const th=await hashPassword(t); const s=await env.DB.prepare('SELECT user_id,expires_at FROM sessions WHERE token_hash=? AND expires_at>?').bind(th,Date.now()).first<any>(); if(!s) return null; await env.SESSIONS.put(`session:${t}`,JSON.stringify({user_id:s.user_id,expires_at:s.expires_at}),{expirationTtl:SESSION_TTL}); return {user_id:s.user_id}; }
async function destroySession(env:Env,t:string):Promise<void> { await env.SESSIONS.delete(`session:${t}`); const th=await hashPassword(t); await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(th).run(); }
async function authMiddleware(c:any,next:any) { const ah=c.req.header('Authorization'); if(!ah||!ah.startsWith('Bearer ')) return c.json({error:'Unauthorized'},401); const t=ah.substring(7); let uid:string; const jp=await verifyJWT(t,c.env.JWT_PUBLIC_KEY); if(jp) uid=jp.sub; else { const s=await verifySession(c.env,t); if(!s) return c.json({error:'Invalid or expired session'},401); uid=s.user_id; } const u=await c.env.DB.prepare('SELECT id,email,username,is_frozen,frozen_reason FROM users WHERE id=?').bind(uid).first<any>(); if(!u) return c.json({error:'User not found'},401); if(u.is_frozen) return c.json({error:`Account frozen: ${u.frozen_reason||'Contact support'}`},403); c.set('user',{id:u.id,email:u.email,username:u.username}); await next(); }
async function checkRateLimit(env:Env,k:string,l:number,w:number):Promise<boolean> { const kk=`rl:${k}`; const c=await env.RATE_LIMIT.get(kk); const n=c?parseInt(c):0; if(n>=l) return false; await env.RATE_LIMIT.put(kk,String(n+1),{expirationTtl:w}); return true; }
async function audit(env:Env,uid:string|null,a:string,ip:string,d?:any):Promise<void> { await env.DB.prepare('INSERT INTO audit_log (id,user_id,action,ip_address,details) VALUES (?,?,?,?,?)').bind(generateId('aud_'),uid,a,ip,d?JSON.stringify(d):null).run(); }
async function sendEmail(env:Env,to:string,subject:string,html:string):Promise<boolean> { try { const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:'MIKPAL <noreply@mikpal.com>',to,subject,html})}); return res.ok; } catch { return false; } }
async function getOrCreateWallet(env:Env,uid:string,cur:string):Promise<{id:string,balance:number}> { let w=await env.DB.prepare('SELECT id,balance FROM wallets WHERE user_id=? AND currency=?').bind(uid,cur).first<any>(); if(!w) { const wid=generateId('wal_'); await env.DB.prepare('INSERT INTO wallets (id,user_id,currency,balance,locked_balance) VALUES (?,?,?,0,0)').bind(wid,uid,cur).run(); w={id:wid,balance:0}; } return w; }
async function getUserById(env:Env,uid:string):Promise<User|null> { return await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(uid).first<User>(); }
async function getUserByUsername(env:Env,u:string):Promise<any> { return await env.DB.prepare('SELECT id,username,full_name,currency FROM users WHERE username=?').bind(u.toLowerCase()).first(); }
async function getWalletBalance(env:Env,uid:string,cur:string):Promise<{walletId:string,balance:number,locked:number}|null> { const w=await env.DB.prepare('SELECT id,balance,locked_balance FROM wallets WHERE user_id=? AND currency=?').bind(uid,cur).first<any>(); if(!w) return null; return {walletId:w.id,balance:w.balance||0,locked:w.locked_balance||0}; }
async function getTotalBalance(env:Env,uid:string):Promise<number> { const r=await env.DB.prepare('SELECT COALESCE(SUM(balance),0) as total FROM wallets WHERE user_id=?').bind(uid).first<any>(); return r?.total||0; }
async function getDailyOutgoingTotal(env:Env,uid:string):Promise<number> { const ts=new Date().toISOString().split('T')[0]+' 00:00:00'; const r=await env.DB.prepare(`SELECT COALESCE(SUM(amount+fee),0) as total FROM transactions WHERE user_id=? AND status='success' AND type IN ('transfer','payout','p2p_send') AND created_at>=?`).bind(uid,ts).first<any>(); return r?.total||0; }
async function verifyPinForTransaction(env:Env,uid:string,pin:string):Promise<{valid:boolean,error?:string}> { const u=await getUserById(env,uid); if(!u) return {valid:false,error:'User not found'}; if(u.pin_locked_until&&u.pin_locked_until>Date.now()) { const m=Math.ceil((u.pin_locked_until-Date.now())/60000); return {valid:false,error:`PIN locked. Try again in ${m} minutes.`}; } if(!u.pin_hash) return {valid:false,error:'No PIN set. Please set a 4-digit PIN first.'}; const ph=await hashPin(pin,uid); if(ph!==u.pin_hash) { const na=u.pin_attempts+1; if(na>=MAX_PIN_ATTEMPTS) { await env.DB.prepare('UPDATE users SET pin_attempts=0,pin_locked_until=? WHERE id=?').bind(Date.now()+PIN_LOCKOUT_MS,uid).run(); return {valid:false,error:'Too many failed attempts. PIN locked for 30 minutes.'}; } await env.DB.prepare('UPDATE users SET pin_attempts=? WHERE id=?').bind(na,uid).run(); return {valid:false,error:`Incorrect PIN. ${MAX_PIN_ATTEMPTS-na} attempts remaining.`}; } if(u.pin_attempts>0) await env.DB.prepare('UPDATE users SET pin_attempts=0 WHERE id=?').bind(uid).run(); return {valid:true}; }
async function validateOutgoingTransaction(env:Env,uid:string,amtC:number,feeC:number):Promise<{ok:boolean,error?:string}> { const u=await getUserById(env,uid); if(!u) return {ok:false,error:'User not found'}; if(!u.kyc_verified) return {ok:false,error:'KYC verification is required before sending money. Please complete KYC in your profile.'}; const dt=await getDailyOutgoingTotal(env,uid); if(dt+amtC+feeC>u.daily_limit) { const r=Math.max(0,u.daily_limit-dt); return {ok:false,error:`Daily limit is ${formatCents(u.daily_limit,u.currency)}. You have ${formatCents(r,u.currency)} remaining today.`}; } return {ok:true}; }
async function safeUserWithBalance(env:Env,u:User) { const tb=await getTotalBalance(env,u.id); return {id:u.id,email:u.email,username:u.username,full_name:u.full_name,display_name:u.display_name,phone:u.phone,country:u.country,currency:u.currency,email_verified:!!u.email_verified,avatar_url:u.avatar_url,kyc_verified:!!u.kyc_verified,kyc_verified_name:u.kyc_verified_name,has_pin:!!u.pin_hash,biometrics_enabled:!!u.biometrics_enabled,balance:fromCents(tb),daily_limit:fromCents(u.daily_limit),is_frozen:!!u.is_frozen,created_at:u.created_at}; }
function safeUser(u:User) { return {id:u.id,email:u.email,username:u.username,full_name:u.full_name,display_name:u.display_name,phone:u.phone,country:u.country,currency:u.currency,email_verified:!!u.email_verified,avatar_url:u.avatar_url,kyc_verified:!!u.kyc_verified,kyc_verified_name:u.kyc_verified_name,has_pin:!!u.pin_hash,biometrics_enabled:!!u.biometrics_enabled,daily_limit:fromCents(u.daily_limit),is_frozen:!!u.is_frozen,created_at:u.created_at}; }
app.post('/api/auth/signup', async (c) => {
  const ip = getClientIP(c);
  if (!(await checkRateLimit(c.env, `signup:${ip}`, 100, 3600))) return c.json({ error: 'Too many signup attempts. Try again later.' }, 429);
  const { email, password, full_name, username, phone, country } = await c.req.json();
  if (!email || !password || !full_name) return c.json({ error: 'Email, password, and full name are required' }, 400);
  if (!validateEmail(email)) return c.json({ error: 'Invalid email address' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);
  const emailLower = email.toLowerCase();
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(emailLower).first();
  if (existing) return c.json({ error: 'An account with this email already exists' }, 409);
  let finalUsername: string | null = null;
  if (username) { finalUsername = sanitizeUsername(username); if (finalUsername.length < 3) return c.json({ error: 'Username must be at least 3 characters' }, 400); const ex = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(finalUsername).first(); if (ex) return c.json({ error: 'That username is already taken' }, 409); }
  const userId = generateId('usr_'); const passwordHash = await hashPassword(password);
  const userCountry = country || 'Ghana'; const userCurrency = (COUNTRIES.find(co => co.name === userCountry) || COUNTRIES[0]).currency;
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO users (id, email, username, password_hash, full_name, phone, country, currency, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)').bind(userId, emailLower, finalUsername, passwordHash, full_name, phone || null, userCountry, userCurrency),
    c.env.DB.prepare('INSERT INTO wallets (id, user_id, currency, balance, locked_balance) VALUES (?, ?, ?, 0, 0)').bind(generateId('wal_'), userId, userCurrency),
  ]);
  const verifyToken = generateToken(32);
  await c.env.DB.prepare('INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, ?)').bind(generateId('tok_'), userId, verifyToken, 'email_verify', Date.now() + 24*60*60*1000).run();
  const verifyUrl = `${c.env.APP_URL}/verify-email?token=${verifyToken}`;
  await sendEmail(c.env, emailLower, 'Verify your MIKPAL account', `<h2>Welcome to MIKPAL!</h2><p>Please verify your email:</p><a href="${verifyUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Verify Email</a><p>Expires in 24 hours.</p>`);
  const token = await createSession(c.env, userId, ip);
  const jwt = await signJWT({ sub: userId, email: emailLower, username: finalUsername, exp: Date.now() + JWT_TTL_MS }, c.env.JWT_PRIVATE_KEY);
  const user = await getUserById(c.env, userId);
  await audit(c.env, userId, 'signup', ip);
  return c.json({ user: safeUser(user!), token: jwt, sessionToken: token, emailVerificationRequired: true }, 201);
});
app.post('/api/auth/signin', async (c) => {
  const ip = getClientIP(c);
  if (!(await checkRateLimit(c.env, `signin:${ip}`, 100, 3600))) return c.json({ error: 'Too many login attempts. Try again later.' }, 429);
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);
  const passwordHash = await hashPassword(password);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND password_hash = ?').bind(email.toLowerCase(), passwordHash).first<User>();
  if (!user) return c.json({ error: 'Invalid email or password' }, 401);
  const token = await createSession(c.env, user.id, ip);
  const jwt = await signJWT({ sub: user.id, email: user.email, username: user.username, exp: Date.now() + JWT_TTL_MS }, c.env.JWT_PRIVATE_KEY);
  await audit(c.env, user.id, 'login', ip);
  return c.json({ user: safeUser(user), token: jwt, sessionToken: token });
});
app.post('/api/auth/google', async (c) => {
  const ip = getClientIP(c); const { credential } = await c.req.json();
  if (!credential) return c.json({ error: 'Google credential is required' }, 400);
  const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!googleRes.ok) return c.json({ error: 'Invalid Google token' }, 401);
  const googleUser: any = await googleRes.json();
  if (googleUser.aud !== c.env.GOOGLE_CLIENT_ID) return c.json({ error: 'Google token audience mismatch' }, 401);
  let oauthAccount = await c.env.DB.prepare("SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_account_id = ?").bind(googleUser.sub).first<any>();
  let userId: string; let user: User | null;
  if (oauthAccount) { userId = oauthAccount.user_id; user = await getUserById(c.env, userId); }
  else { user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(googleUser.email).first<User>();
    if (user) { userId = user.id; } else { userId = generateId('usr_'); const username = googleUser.email.split('@')[0] + '_' + generateToken(4); const userCurrency = 'GHS';
      await c.env.DB.batch([
        c.env.DB.prepare('INSERT INTO users (id, email, username, email_verified, avatar_url, currency) VALUES (?, ?, ?, 1, ?, ?)').bind(userId, googleUser.email, username, googleUser.picture || null, userCurrency),
        c.env.DB.prepare('INSERT INTO wallets (id, user_id, currency, balance, locked_balance) VALUES (?, ?, ?, 0, 0)').bind(generateId('wal_'), userId, userCurrency),
      ]);
      user = await getUserById(c.env, userId);
    }
    await c.env.DB.prepare("INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id) VALUES (?, ?, 'google', ?)").bind(generateId('oau_'), userId, googleUser.sub).run();
  }
  const token = await createSession(c.env, userId, ip);
  const jwt = await signJWT({ sub: userId, email: user!.email, username: user!.username, exp: Date.now() + JWT_TTL_MS }, c.env.JWT_PRIVATE_KEY);
  await audit(c.env, userId, 'google_login', ip);
  return c.json({ user: safeUser(user!), token: jwt, sessionToken: token });
});
app.post('/api/auth/verify-email', async (c) => {
  const { token } = await c.req.json(); if (!token) return c.json({ error: 'Token is required' }, 400);
  const authToken = await c.env.DB.prepare("SELECT * FROM auth_tokens WHERE token = ? AND type = 'email_verify' AND used = 0 AND expires_at > ?").bind(token, Date.now()).first<any>();
  if (!authToken) return c.json({ error: 'Invalid or expired token' }, 400);
  await c.env.DB.batch([ c.env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(authToken.user_id), c.env.DB.prepare('UPDATE auth_tokens SET used = 1 WHERE id = ?').bind(authToken.id) ]);
  return c.json({ success: true, message: 'Email verified successfully' });
});
app.post('/api/auth/forgot-password', async (c) => {
  const ip = getClientIP(c);
  if (!(await checkRateLimit(c.env, `forgot:${ip}`, 3, 3600))) return c.json({ error: 'Too many reset attempts. Try again later.' }, 429);
  const { email } = await c.req.json(); if (!email) return c.json({ error: 'Email is required' }, 400);
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first<any>();
  if (!user) return c.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  const resetToken = generateToken(32);
  await c.env.DB.prepare("INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, 'password_reset', ?)").bind(generateId('tok_'), user.id, resetToken, Date.now() + 60*60*1000).run();
  const resetUrl = `${c.env.APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail(c.env, email, 'Reset your MIKPAL password', `<h2>Password Reset</h2><a href="${resetUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a><p>Expires in 1 hour.</p>`);
  await audit(c.env, user.id, 'password_reset_request', ip);
  return c.json({ success: true, message: 'If the email exists, a reset link has been sent' });
});
app.post('/api/auth/reset-password', async (c) => {
  const { token, password } = await c.req.json();
  if (!token || !password) return c.json({ error: 'Token and new password are required' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);
  const authToken = await c.env.DB.prepare("SELECT * FROM auth_tokens WHERE token = ? AND type = 'password_reset' AND used = 0 AND expires_at > ?").bind(token, Date.now()).first<any>();
  if (!authToken) return c.json({ error: 'Invalid or expired token' }, 400);
  const passwordHash = await hashPassword(password);
  await c.env.DB.batch([ c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, authToken.user_id), c.env.DB.prepare('UPDATE auth_tokens SET used = 1 WHERE id = ?').bind(authToken.id) ]);
  await audit(c.env, authToken.user_id, 'password_reset', getClientIP(c));
  return c.json({ success: true, message: 'Password reset successfully' });
});
app.get('/api/auth/me', authMiddleware, async (c) => { const user = c.get('user'); const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404); return c.json({ user: await safeUserWithBalance(c.env, dbUser) }); });
app.post('/api/auth/signout', authMiddleware, async (c) => { const user = c.get('user'); const ah = c.req.header('Authorization'); const token = ah?.substring(7) || ''; await destroySession(c.env, token); await audit(c.env, user.id, 'logout', getClientIP(c)); return c.json({ success: true }); });
app.get('/api/profile', authMiddleware, async (c) => { const user = c.get('user'); const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404); return c.json({ user: await safeUserWithBalance(c.env, dbUser) }); });
app.put('/api/profile', authMiddleware, async (c) => {
  const user = c.get('user'); const { display_name, currency, phone, country, username } = await c.req.json();
  if (currency && !validateCurrency(currency)) return c.json({ error: 'Unsupported currency' }, 400);
  if (username) { const cu = sanitizeUsername(username); if (cu.length < 3) return c.json({ error: 'Username must be at least 3 characters' }, 400); const ex = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?').bind(cu, user.id).first(); if (ex) return c.json({ error: 'That username is already taken' }, 409); }
  const updates: string[] = []; const values: any[] = [];
  if (display_name !== undefined) { updates.push('display_name = ?'); values.push(display_name); }
  if (currency) { updates.push('currency = ?'); values.push(currency); }
  if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
  if (country) { updates.push('country = ?'); values.push(country); }
  if (username) { updates.push('username = ?'); values.push(sanitizeUsername(username)); }
  updates.push("updated_at = datetime('now')");
  if (values.length > 0) { values.push(user.id); await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run(); }
  const updatedUser = await getUserById(c.env, user.id); return c.json({ user: await safeUserWithBalance(c.env, updatedUser!) });
});
app.put('/api/profile/password', authMiddleware, async (c) => {
  const user = c.get('user'); const { current_password, new_password } = await c.req.json();
  if (!current_password || !new_password) return c.json({ error: 'Current and new passwords are required' }, 400);
  if (new_password.length < 8) return c.json({ error: 'New password must be at least 8 characters' }, 400);
  const currentHash = await hashPassword(current_password);
  const dbUser = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first<any>();
  if (dbUser.password_hash !== currentHash) return c.json({ error: 'Current password is incorrect' }, 401);
  const newHash = await hashPassword(new_password);
  await c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(newHash, user.id).run();
  await audit(c.env, user.id, 'password_change', getClientIP(c)); return c.json({ message: 'Password updated successfully' });
});
app.put('/api/profile/pin', authMiddleware, async (c) => {
  const user = c.get('user'); const { current_pin, new_pin } = await c.req.json();
  if (!new_pin || !validatePin(new_pin)) return c.json({ error: 'New PIN must be exactly 4 digits' }, 400);
  const dbUser = await getUserById(c.env, user.id);
  if (dbUser!.pin_hash) { if (!current_pin) return c.json({ error: 'Current PIN is required' }, 400); const cph = await hashPin(current_pin, user.id); if (cph !== dbUser!.pin_hash) return c.json({ error: 'Current PIN is incorrect' }, 401); }
  const newPinHash = await hashPin(new_pin, user.id);
  await c.env.DB.prepare("UPDATE users SET pin_hash = ?, pin_attempts = 0, pin_locked_until = 0, updated_at = datetime('now') WHERE id = ?").bind(newPinHash, user.id).run();
  await audit(c.env, user.id, 'pin_change', getClientIP(c)); return c.json({ message: 'PIN updated successfully' });
});
app.post('/api/profile/pin/verify', authMiddleware, async (c) => {
  const user = c.get('user'); const { pin } = await c.req.json();
  if (!pin || !validatePin(pin)) return c.json({ error: 'PIN must be exactly 4 digits' }, 400);
  const result = await verifyPinForTransaction(c.env, user.id, pin);
  if (!result.valid) return c.json({ error: result.error }, 401); return c.json({ verified: true });
});
app.put('/api/profile/biometrics', authMiddleware, async (c) => {
  const user = c.get('user'); const { enabled } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET biometrics_enabled = ?, updated_at = datetime('now') WHERE id = ?").bind(enabled ? 1 : 0, user.id).run();
  return c.json({ biometrics_enabled: !!enabled });
});
app.post('/api/profile/kyc', authMiddleware, async (c) => {
  const user = c.get('user'); const { document_type, document_number, full_name } = await c.req.json();
  if (!document_type || !document_number) return c.json({ error: 'Document type and number are required' }, 400);
  const dbUser = await getUserById(c.env, user.id); const verifiedName = full_name || dbUser!.full_name || '';
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET kyc_verified = 1, kyc_verified_name = ?, kyc_document_type = ?, kyc_document_number = ?, full_name = ?, updated_at = datetime('now') WHERE id = ?").bind(verifiedName, document_type, document_number, verifiedName, user.id),
    c.env.DB.prepare("INSERT INTO kyc_verifications (id, user_id, status, document_type, document_number, verified_at) VALUES (?, ?, 'verified', ?, ?, datetime('now'))").bind(generateId('kyc_'), user.id, document_type, document_number),
  ]);
  await audit(c.env, user.id, 'kyc_submit', getClientIP(c), { document_type });
  return c.json({ message: 'KYC verification successful', kyc_verified: true, verified_name: verifiedName });
});
app.get('/api/dashboard', authMiddleware, async (c) => {
  const user = c.get('user'); const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404);
  const totalBalanceCents = await getTotalBalance(c.env, user.id);
  const recentTx = await c.env.DB.prepare('SELECT id, type, channel, amount, fee, currency, status, reference, description, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').bind(user.id).all();
  const vaCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM virtual_accounts WHERE user_id = ? AND is_active = 1').bind(user.id).first<any>();
  const cardCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cards WHERE user_id = ? AND is_active = 1').bind(user.id).first<any>();
  const wallets = await c.env.DB.prepare('SELECT id, currency, balance, locked_balance FROM wallets WHERE user_id = ? ORDER BY currency').bind(user.id).all();
  const countryInfo = COUNTRIES.find(co => co.currency === dbUser.currency) || COUNTRIES[0];
  const walletsDecimal = (wallets.results || []).map((w: any) => ({ ...w, balance: fromCents(w.balance || 0), locked_balance: fromCents(w.locked_balance || 0) }));
  const recentTxDecimal = (recentTx.results || []).map((t: any) => ({ ...t, amount: fromCents(t.amount || 0), fee: fromCents(t.fee || 0) }));
  return c.json({ user: { id: dbUser.id, email: dbUser.email, username: dbUser.username, full_name: dbUser.full_name, display_name: dbUser.display_name, kyc_verified: !!dbUser.kyc_verified, kyc_verified_name: dbUser.kyc_verified_name, country: dbUser.country, currency: dbUser.currency, currency_symbol: countryInfo.symbol, country_flag: countryInfo.flag, balance: fromCents(totalBalanceCents), daily_limit: fromCents(dbUser.daily_limit) }, wallets: walletsDecimal, recent_transactions: recentTxDecimal, virtual_accounts_count: vaCount?.count || 0, cards_count: cardCount?.count || 0, payment_channels: PAYMENT_CHANNELS, supported_countries: COUNTRIES });
});
app.get('/api/wallets', authMiddleware, async (c) => { const user = c.get('user'); const wallets = await c.env.DB.prepare('SELECT id, currency, balance, locked_balance FROM wallets WHERE user_id = ? ORDER BY currency').bind(user.id).all(); const walletsDecimal = (wallets.results || []).map((w: any) => ({ ...w, balance: fromCents(w.balance || 0), locked_balance: fromCents(w.locked_balance || 0) })); return c.json({ wallets: walletsDecimal }); });
app.post('/api/wallets', authMiddleware, async (c) => { const user = c.get('user'); const { currency } = await c.req.json(); if (!currency || !validateCurrency(currency)) return c.json({ error: 'Invalid currency' }, 400); const wallet = await getOrCreateWallet(c.env, user.id, currency); return c.json({ wallet }); });
app.get('/api/transactions', authMiddleware, async (c) => { const user = c.get('user'); const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); const offset = parseInt(c.req.query('offset') || '0'); const result = await c.env.DB.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(user.id, limit, offset).all(); return c.json({ transactions: result.results || [], count: result.results?.length || 0 }); });
app.get('/api/transactions/:id', authMiddleware, async (c) => { const user = c.get('user'); const txId = c.req.param('id'); const tx = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').bind(txId, user.id).first(); if (!tx) return c.json({ error: 'Transaction not found' }, 404); return c.json({ transaction: tx }); });
app.post('/api/transactions/transfer', authMiddleware, async (c) => {
  const user = c.get('user'); const ip = getClientIP(c);
  const { pin, channel, amount, currency, recipient_name, recipient_account, recipient_bank, description, idempotency_key } = await c.req.json();
  if (!channel || !(TRANSFER_CHANNELS as readonly string[]).includes(channel)) return c.json({ error: 'Invalid transfer channel. Use: momo, ach, or eft.' }, 400);
  const amtCents = validateAmount(amount); if (amtCents === null) return c.json({ error: 'Invalid amount' }, 400);
  const pinCheck = await verifyPinForTransaction(c.env, user.id, pin); if (!pinCheck.valid) return c.json({ error: pinCheck.error }, 401);
  const feeCents = await calculateFee(c.env, amtCents, 'transfer'); const totalDebitCents = amtCents + feeCents;
  const validation = await validateOutgoingTransaction(c.env, user.id, amtCents, feeCents); if (!validation.ok) return c.json({ error: validation.error }, 403);
  if (idempotency_key) { const ex = await c.env.DB.prepare('SELECT id, reference, status FROM transactions WHERE idempotency_key = ?').bind(idempotency_key).first<any>(); if (ex) return c.json({ message: 'Transfer already processed', reference: ex.reference, idempotent: true }); }
  const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404);
  const txCurrency = currency || dbUser.currency; if (!validateCurrency(txCurrency)) return c.json({ error: 'Invalid currency' }, 400);
  const walletInfo = await getWalletBalance(c.env, user.id, txCurrency); if (!walletInfo) return c.json({ error: `No ${txCurrency} wallet found` }, 400);
  if (walletInfo.balance < totalDebitCents) return c.json({ error: `Insufficient balance. Need ${formatCents(totalDebitCents, txCurrency)} (incl. fee ${formatCents(feeCents, txCurrency)}), have ${formatCents(walletInfo.balance, txCurrency)}` }, 400);
  const txId = generateId('tx_'); const reference = generateReference();
  await c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, recipient_account, recipient_bank, pin_verified, idempotency_key) VALUES (?, ?, 'transfer', ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, 1, ?)`).bind(txId, user.id, channel, amtCents, feeCents, txCurrency, reference, description || `Transfer via ${channel.toUpperCase()}`, recipient_name, recipient_account, recipient_bank, idempotency_key || null).run();
  const lockResult = await c.env.DB.prepare("UPDATE wallets SET balance = balance - ?, locked_balance = locked_balance + ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId, totalDebitCents).run();
  if (!lockResult.meta.changes || lockResult.meta.changes === 0) { await c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId).run(); return c.json({ error: 'Insufficient balance at execution time. Please retry.' }, 409); }
  try {
    const korapayRes = await fetch(`${c.env.KORAPAY_BASE_URL}/merchant/api/v1/disbursements/card`, { method: 'POST', headers: { 'Authorization': `Bearer ${c.env.KORAPAY_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, amount: amtCents, currency: txCurrency, customer: { name: recipient_name, email: dbUser.email }, destination: { type: channel, account_number: recipient_account, bank_code: recipient_bank } }) });
    const korapayData: any = await korapayRes.json();
    if (!korapayRes.ok) { await c.env.DB.batch([ c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId), c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId) ]); await audit(c.env, user.id, 'transfer_failed', ip, { txId, reference, error: korapayData }); return c.json({ error: 'Transfer failed at payment provider', details: korapayData?.message || 'Unknown error' }, 502); }
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE wallets SET locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, walletInfo.walletId),
      c.env.DB.prepare("UPDATE transactions SET status = 'success', updated_at = datetime('now') WHERE id = ?").bind(txId),
      c.env.DB.prepare(`INSERT INTO gateway_transactions (reference, user_id, amount, currency, payment_method, provider, provider_reference, status) VALUES (?, ?, ?, ?, ?, 'korapay', ?, 'success')`).bind(reference, user.id, amtCents, txCurrency, channel, korapayData?.data?.reference || null),
      c.env.DB.prepare(`INSERT INTO settlement_history (id, user_id, transaction_id, amount, fee, settlement_type, destination_details, status, korapay_reference, korapay_response, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'))`).bind(generateId('set_'), user.id, txId, amtCents, feeCents, channel, JSON.stringify({ recipient_name, recipient_account, recipient_bank }), korapayData?.data?.reference || null, JSON.stringify(korapayData)),
    ]);
    const newBalance = await getWalletBalance(c.env, user.id, txCurrency);
    await audit(c.env, user.id, 'transfer', ip, { txId, reference, amount: amtCents, fee: feeCents, currency: txCurrency, channel });
    await createNotification(c.env, user.id, 'transfer_sent', 'Transfer Sent', `Your transfer of ${formatCents(amtCents, txCurrency)} via ${channel.toUpperCase()} was successful. Reference: ${reference}`, reference, amtCents, txCurrency);
    await sendEmail(c.env, dbUser.email, 'Transfer successful', `<h2>Transfer of ${formatCents(amtCents, txCurrency)}</h2><p>Channel: ${channel.toUpperCase()}</p><p>Reference: ${reference}</p><p>Status: Success</p>`);
    return c.json({ message: 'Transfer initiated successfully', transaction_id: txId, reference, amount: fromCents(amtCents), fee: fromCents(feeCents), currency: txCurrency, new_balance: fromCents(newBalance?.balance ?? 0), status: 'success' });
  } catch (err: any) {
    await c.env.DB.batch([ c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId), c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId) ]);
    await audit(c.env, user.id, 'transfer_error', ip, { txId, reference, error: err.message });
    await createNotification(c.env, user.id, 'transfer_failed', 'Transfer Failed', `Your transfer of ${formatCents(amtCents, txCurrency)} failed. Funds refunded. Reference: ${reference}`, reference, amtCents, txCurrency);
    return c.json({ error: 'Payment provider error. Funds refunded.', details: err.message }, 502);
  }
});
app.post('/api/transactions/payout', authMiddleware, async (c) => {
  const user = c.get('user'); const ip = getClientIP(c);
  const { pin, channel, amount, currency, recipient_name, recipient_account, recipient_bank, description, idempotency_key } = await c.req.json();
  if (!channel || !(PAYOUT_CHANNELS as readonly string[]).includes(channel)) return c.json({ error: 'Invalid payout channel. Use: momo, ach, eft, or card.' }, 400);
  const amtCents = validateAmount(amount); if (amtCents === null) return c.json({ error: 'Invalid amount' }, 400);
  const pinCheck = await verifyPinForTransaction(c.env, user.id, pin); if (!pinCheck.valid) return c.json({ error: pinCheck.error }, 401);
  const feeCents = await calculateFee(c.env, amtCents, 'payout'); const totalDebitCents = amtCents + feeCents;
  const validation = await validateOutgoingTransaction(c.env, user.id, amtCents, feeCents); if (!validation.ok) return c.json({ error: validation.error }, 403);
  if (idempotency_key) { const ex = await c.env.DB.prepare('SELECT id, reference, status FROM transactions WHERE idempotency_key = ?').bind(idempotency_key).first<any>(); if (ex) return c.json({ message: 'Payout already processed', reference: ex.reference, idempotent: true }); }
  const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404);
  const txCurrency = currency || dbUser.currency; if (!validateCurrency(txCurrency)) return c.json({ error: 'Invalid currency' }, 400);
  const walletInfo = await getWalletBalance(c.env, user.id, txCurrency); if (!walletInfo) return c.json({ error: `No ${txCurrency} wallet found` }, 400);
  if (walletInfo.balance < totalDebitCents) return c.json({ error: `Insufficient balance. Need ${formatCents(totalDebitCents, txCurrency)} (incl. fee ${formatCents(feeCents, txCurrency)}), have ${formatCents(walletInfo.balance, txCurrency)}` }, 400);
  const txId = generateId('tx_'); const reference = generateReference();
  await c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, recipient_account, recipient_bank, pin_verified, idempotency_key) VALUES (?, ?, 'payout', ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, 1, ?)`).bind(txId, user.id, channel, amtCents, feeCents, txCurrency, reference, description || `Payout via ${channel.toUpperCase()}`, recipient_name, recipient_account, recipient_bank, idempotency_key || null).run();
  const lockResult = await c.env.DB.prepare("UPDATE wallets SET balance = balance - ?, locked_balance = locked_balance + ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId, totalDebitCents).run();
  if (!lockResult.meta.changes || lockResult.meta.changes === 0) { await c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId).run(); return c.json({ error: 'Insufficient balance at execution time. Please retry.' }, 409); }
  try {
    const korapayRes = await fetch(`${c.env.KORAPAY_BASE_URL}/merchant/api/v1/disbursements/card`, { method: 'POST', headers: { 'Authorization': `Bearer ${c.env.KORAPAY_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, amount: amtCents, currency: txCurrency, customer: { name: recipient_name, email: dbUser.email }, destination: { type: channel, account_number: recipient_account, bank_code: recipient_bank } }) });
    const korapayData: any = await korapayRes.json();
    if (!korapayRes.ok) { await c.env.DB.batch([ c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId), c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId) ]); await audit(c.env, user.id, 'payout_failed', ip, { txId, reference, error: korapayData }); return c.json({ error: 'Payout failed at payment provider', details: korapayData?.message || 'Unknown error' }, 502); }
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE wallets SET locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, walletInfo.walletId),
      c.env.DB.prepare("UPDATE transactions SET status = 'success', updated_at = datetime('now') WHERE id = ?").bind(txId),
      c.env.DB.prepare(`INSERT INTO gateway_transactions (reference, user_id, amount, currency, payment_method, provider, provider_reference, status) VALUES (?, ?, ?, ?, ?, 'korapay', ?, 'success')`).bind(reference, user.id, amtCents, txCurrency, channel, korapayData?.data?.reference || null),
      c.env.DB.prepare(`INSERT INTO settlement_history (id, user_id, transaction_id, amount, fee, settlement_type, destination_details, status, korapay_reference, korapay_response, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'))`).bind(generateId('set_'), user.id, txId, amtCents, feeCents, channel, JSON.stringify({ recipient_name, recipient_account, recipient_bank }), korapayData?.data?.reference || null, JSON.stringify(korapayData)),
    ]);
    const newBalance = await getWalletBalance(c.env, user.id, txCurrency);
    await audit(c.env, user.id, 'payout', ip, { txId, reference, amount: amtCents, fee: feeCents, currency: txCurrency, channel });
    await createNotification(c.env, user.id, 'payout_sent', 'Payout Sent', `Your payout of ${formatCents(amtCents, txCurrency)} via ${channel.toUpperCase()} was successful. Reference: ${reference}`, reference, amtCents, txCurrency);
    await sendEmail(c.env, dbUser.email, 'Payout successful', `<h2>Payout of ${formatCents(amtCents, txCurrency)}</h2><p>Channel: ${channel.toUpperCase()}</p><p>Reference: ${reference}</p><p>Status: Success</p>`);
    return c.json({ message: 'Payout initiated successfully', transaction_id: txId, reference, amount: fromCents(amtCents), fee: fromCents(feeCents), currency: txCurrency, new_balance: fromCents(newBalance?.balance ?? 0), status: 'success' });
  } catch (err: any) {
    await c.env.DB.batch([ c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, locked_balance = locked_balance - ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebitCents, totalDebitCents, walletInfo.walletId), c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', txId) ]);
    await audit(c.env, user.id, 'payout_error', ip, { txId, reference, error: err.message });
    await createNotification(c.env, user.id, 'payout_failed', 'Payout Failed', `Your payout of ${formatCents(amtCents, txCurrency)} failed. Funds refunded. Reference: ${reference}`, reference, amtCents, txCurrency);
    return c.json({ error: 'Payment provider error. Funds refunded.', details: err.message }, 502);
  }
});
app.post('/api/p2p/lookup', authMiddleware, async (c) => {
  const { username } = await c.req.json(); if (!username) return c.json({ error: 'Username is required' }, 400);
  const cleanUsername = sanitizeUsername(username); const sender = c.get('user');
  const senderUser = await getUserById(c.env, sender.id);
  if (senderUser?.username === cleanUsername) return c.json({ error: 'You cannot send money to yourself' }, 400);
  const recipient = await getUserByUsername(c.env, cleanUsername);
  if (!recipient) return c.json({ error: 'No MIKPAL user found with that username' }, 404);
  return c.json({ recipient: { username: recipient.username, full_name: recipient.full_name, currency: recipient.currency } });
});
app.post('/api/p2p/transfer', authMiddleware, async (c) => {
  const sender = c.get('user'); const ip = getClientIP(c);
  const { pin, recipient_username, amount, currency, description, idempotency_key } = await c.req.json();
  const pinCheck = await verifyPinForTransaction(c.env, sender.id, pin); if (!pinCheck.valid) return c.json({ error: pinCheck.error }, 401);
  const amtCents = validateAmount(amount); if (amtCents === null) return c.json({ error: 'Invalid amount' }, 400);
  const feeCents = await calculateFee(c.env, amtCents, 'p2p_send'); const totalDebitCents = amtCents + feeCents;
  const validation = await validateOutgoingTransaction(c.env, sender.id, amtCents, feeCents); if (!validation.ok) return c.json({ error: validation.error }, 403);
  const cleanUsername = sanitizeUsername(recipient_username || ''); if (!cleanUsername) return c.json({ error: 'Recipient username is required' }, 400);
  const recipient = await getUserByUsername(c.env, cleanUsername); if (!recipient) return c.json({ error: 'Recipient not found' }, 404);
  if (recipient.id === sender.id) return c.json({ error: 'You cannot send money to yourself' }, 400);
  const senderUser = await getUserById(c.env, sender.id); const txCurrency = currency || senderUser!.currency;
  if (!validateCurrency(txCurrency)) return c.json({ error: 'Invalid currency' }, 400);
  if (recipient.currency !== txCurrency) return c.json({ error: `Currency mismatch. Recipient uses ${recipient.currency}. P2P transfers require matching currencies.` }, 400);
  if (idempotency_key) { const ex = await c.env.DB.prepare('SELECT id, reference FROM ledger_entries WHERE idempotency_key = ?').bind(idempotency_key).first<any>(); if (ex) return c.json({ message: 'Transfer already processed', reference: ex.reference, idempotent: true }); }
  const senderWalletInfo = await getWalletBalance(c.env, sender.id, txCurrency); if (!senderWalletInfo) return c.json({ error: `No ${txCurrency} wallet found` }, 400);
  if (senderWalletInfo.balance < totalDebitCents) return c.json({ error: `Insufficient balance. Need ${formatCents(totalDebitCents, txCurrency)} (incl. fee ${formatCents(feeCents, txCurrency)}), have ${formatCents(senderWalletInfo.balance, txCurrency)}` }, 400);
  const recipientWallet = await getOrCreateWallet(c.env, recipient.id, txCurrency);
  const ledgerId = generateId('led_'); const reference = generateReference(); const senderTxId = generateId('tx_'); const recipientTxId = generateId('tx_'); const feeTxId = generateId('tx_');
  const debitResult = await c.env.DB.prepare("UPDATE wallets SET balance = balance - ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?").bind(totalDebitCents, senderWalletInfo.walletId, totalDebitCents).run();
  if (!debitResult.meta.changes || debitResult.meta.changes === 0) return c.json({ error: 'Insufficient balance at execution time. Please retry.' }, 409);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(amtCents, recipientWallet.id),
    c.env.DB.prepare(`INSERT INTO ledger_entries (id, sender_id, recipient_id, amount, fee, currency, status, reference, idempotency_key, pin_verified, note) VALUES (?, ?, ?, ?, ?, ?, 'success', ?, ?, 1, ?)`).bind(ledgerId, sender.id, recipient.id, amtCents, feeCents, txCurrency, reference, idempotency_key || null, description || null),
    c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, pin_verified, idempotency_key) VALUES (?, ?, 'p2p_send', 'p2p', ?, ?, ?, 'success', ?, ?, ?, 1, ?)`).bind(senderTxId, sender.id, amtCents, feeCents, txCurrency, reference, description || `P2P transfer to @${recipient.username}`, `@${recipient.username}`, idempotency_key || null),
    c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, pin_verified) VALUES (?, ?, 'p2p_receive', 'p2p', ?, 0, ?, 'success', ?, ?, ?, 0)`).bind(recipientTxId, recipient.id, amtCents, txCurrency, reference, `P2P transfer from @${senderUser!.username || senderUser!.email}`, `@${senderUser!.username || senderUser!.email}`),
    c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, pin_verified) VALUES (?, ?, 'fee', 'system', ?, 0, ?, 'success', ?, 'Transaction fee', 1)`).bind(feeTxId, sender.id, feeCents, txCurrency, reference),
  ]);
  await audit(c.env, sender.id, 'p2p_transfer', ip, { reference, amount: amtCents, fee: feeCents, currency: txCurrency, recipient: recipient.username });
  await createNotification(c.env, recipient.id, 'p2p_received', 'Money Received', `You received ${formatCents(amtCents, txCurrency)} from @${senderUser!.username || senderUser!.email}`, reference, amtCents, txCurrency);
  await sendEmail(c.env, recipient.email || '', 'You received money on MIKPAL', `<h2>You received ${formatCents(amtCents, txCurrency)}</h2><p>From: @${senderUser!.username || senderUser!.email}</p><p>Reference: ${reference}</p>`);
  const newBalance = await getWalletBalance(c.env, sender.id, txCurrency);
  return c.json({ message: 'P2P transfer successful', reference, transaction_id: senderTxId, amount: fromCents(amtCents), fee: fromCents(feeCents), currency: txCurrency, recipient: { username: recipient.username, full_name: recipient.full_name }, new_balance: fromCents(newBalance?.balance ?? 0), status: 'success' });
});
app.get('/api/p2p/history', authMiddleware, async (c) => {
  const user = c.get('user'); const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); const offset = parseInt(c.req.query('offset') || '0');
  const result = await c.env.DB.prepare(`SELECT le.*, s.username as sender_username, s.full_name as sender_name, r.username as recipient_username, r.full_name as recipient_name FROM ledger_entries le JOIN users s ON le.sender_id = s.id JOIN users r ON le.recipient_id = r.id WHERE le.sender_id = ? OR le.recipient_id = ? ORDER BY le.created_at DESC LIMIT ? OFFSET ?`).bind(user.id, user.id, limit, offset).all();
  return c.json({ transfers: result.results || [], count: result.results?.length || 0 });
});
app.post('/api/deposit/initiate', authMiddleware, async (c) => {
  const user = c.get('user'); const { amount, currency, paymentMethod } = await c.req.json();
  const amtCents = validateAmount(amount); if (amtCents === null) return c.json({ error: 'Invalid amount' }, 400);
  if (!currency || !validateCurrency(currency)) return c.json({ error: 'Invalid currency' }, 400);
  if (!paymentMethod) return c.json({ error: 'Payment method is required' }, 400);
  const reference = `MIK_${generateToken(12)}`; const dbUser = await getUserById(c.env, user.id);
  await c.env.DB.prepare(`INSERT INTO gateway_transactions (reference, user_id, amount, currency, payment_method, status) VALUES (?, ?, ?, ?, ?, 'pending')`).bind(reference, user.id, amtCents, currency, paymentMethod).run();
  try {
    const korapayRes = await fetch(`${c.env.KORAPAY_BASE_URL}/merchant/api/v1/charge/initialize`, { method: 'POST', headers: { 'Authorization': `Bearer ${c.env.KORAPAY_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, amount: amtCents, currency, customer: { email: dbUser!.email }, channels: [paymentMethod], redirect_url: `${c.env.APP_URL}/deposit/callback?reference=${reference}` }) });
    const korapayData: any = await korapayRes.json();
    if (!korapayRes.ok) { await c.env.DB.prepare('UPDATE gateway_transactions SET status = ? WHERE reference = ?').bind('failed', reference).run(); return c.json({ error: 'Payment initialization failed', details: korapayData }, 400); }
    return c.json({ reference, paymentUrl: korapayData?.data?.checkout_url, message: 'Deposit initiated' });
  } catch (err: any) { await c.env.DB.prepare('UPDATE gateway_transactions SET status = ? WHERE reference = ?').bind('failed', reference).run(); return c.json({ error: 'Payment provider error', details: err.message }, 502); }
});
app.get('/api/deposit/verify/:reference', authMiddleware, async (c) => {
  const user = c.get('user'); const reference = c.req.param('reference'); if (!reference) return c.json({ error: 'Reference is required' }, 400);
  const gatewayTx = await c.env.DB.prepare('SELECT status, user_id, amount, currency FROM gateway_transactions WHERE reference = ? AND user_id = ?').bind(reference, user.id).first<any>();
  if (!gatewayTx) return c.json({ error: 'Deposit not found' }, 404);
  if (gatewayTx.status === 'success') return c.json({ status: 'success', reference, message: 'Deposit already processed' });
  if (gatewayTx.status === 'failed') return c.json({ status: 'failed', reference, message: 'Deposit failed' });
  try {
    const korapayRes = await fetch(`${c.env.KORAPAY_BASE_URL}/merchant/api/v1/charge/${reference}`, { method: 'GET', headers: { 'Authorization': `Bearer ${c.env.KORAPAY_SECRET_KEY}` } });
    if (!korapayRes.ok) return c.json({ status: 'pending', reference, message: 'Could not verify with payment provider' });
    const korapayData: any = await korapayRes.json(); const chargeStatus = korapayData?.data?.status || korapayData?.status;
    if (chargeStatus === 'success') {
      const amtCents = gatewayTx.amount; if (!amtCents || amtCents <= 0) return c.json({ error: 'Invalid amount' }, 400);
      const wallet = await getOrCreateWallet(c.env, user.id, gatewayTx.currency);
      await c.env.DB.batch([
        c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('success', reference),
        c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(amtCents, wallet.id),
        c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, webhook_reference) VALUES (?, ?, 'deposit', 'korapay', ?, 0, ?, 'success', ?, 'Korapay deposit (verified)', ?)`).bind(generateId('tx_'), user.id, amtCents, gatewayTx.currency, reference, reference),
      ]);
      await createNotification(c.env, user.id, 'deposit', 'Deposit Verified', `Your deposit of ${formatCents(amtCents, gatewayTx.currency)} was verified and credited. Reference: ${reference}`, reference, amtCents, gatewayTx.currency);
      const newBalance = await getWalletBalance(c.env, user.id, gatewayTx.currency);
      return c.json({ status: 'success', reference, amount: fromCents(amtCents), currency: gatewayTx.currency, new_balance: fromCents(newBalance?.balance ?? 0) });
    } else if (chargeStatus === 'failed') { await c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('failed', reference).run(); return c.json({ status: 'failed', reference, message: 'Deposit failed at payment provider' }); }
    return c.json({ status: 'pending', reference, message: 'Deposit still pending' });
  } catch (err: any) { return c.json({ status: 'pending', reference, message: 'Could not verify — try again later' }); }
});
async function handleKorapayWebhook(c: any) {
  const rawBody = await c.req.text(); let body: any;
  try { body = JSON.parse(rawBody); } catch { return c.json({ error: 'Invalid JSON body' }, 400); }
  const signature = c.req.header('x-korapay-signature') || c.req.header('X-Korapay-Signature') || '';
  if (c.env.KORAPAY_WEBHOOK_SECRET) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(c.env.KORAPAY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    if (signature !== expectedSig) return c.json({ error: 'Invalid webhook signature' }, 401);
  }
  const { event, data } = body; const reference = data?.reference || data?.tx_ref;
  if (!reference) return c.json({ error: 'No reference in webhook' }, 400);
  const existing = await c.env.DB.prepare('SELECT id, processed FROM webhook_events WHERE reference = ?').bind(reference).first<any>();
  if (existing) return c.json({ success: true, message: 'Already processed' });
  await c.env.DB.prepare(`INSERT INTO webhook_events (id, event_type, reference, processed, payload) VALUES (?, ?, ?, 0, ?)`).bind(generateId('wh_'), event, reference, rawBody).run();
  if (event === 'charge.success') {
    const tx = await c.env.DB.prepare('SELECT user_id, amount, currency FROM gateway_transactions WHERE reference = ?').bind(reference).first<any>();
    if (tx) {
      const amtCents = tx.amount; if (!amtCents || amtCents <= 0) return c.json({ error: 'Invalid amount' }, 400);
      const wallet = await getOrCreateWallet(c.env, tx.user_id, tx.currency);
      await c.env.DB.batch([
        c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('success', reference),
        c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(amtCents, wallet.id),
        c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, webhook_reference) VALUES (?, ?, 'deposit', 'korapay', ?, 0, ?, 'success', ?, 'Korapay deposit', ?)`).bind(generateId('tx_'), tx.user_id, amtCents, tx.currency, reference, reference),
        c.env.DB.prepare('UPDATE webhook_events SET processed = 1 WHERE reference = ?').bind(reference),
        c.env.DB.prepare(`INSERT INTO audit_log (id, user_id, action, details) VALUES (?, ?, 'deposit', ?)`).bind(generateId('aud_'), tx.user_id, JSON.stringify({ reference, amount: amtCents, currency: tx.currency })),
      ]);
      const depUser = await getUserById(c.env, tx.user_id);
      if (depUser) { await createNotification(c.env, tx.user_id, 'deposit', 'Deposit Successful', `Your deposit of ${formatCents(amtCents, tx.currency)} was successful. Reference: ${reference}`, reference, amtCents, tx.currency); await sendEmail(c.env, depUser.email, 'Deposit successful', `<h2>Deposit of ${formatCents(amtCents, tx.currency)}</h2><p>Reference: ${reference}</p><p>Status: Success</p>`); }
      return c.json({ success: true, message: 'Deposit processed', reference, amount: fromCents(amtCents), currency: tx.currency });
    }
  } else if (event === 'charge.failed') {
    await c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('failed', reference).run();
    await c.env.DB.prepare('UPDATE webhook_events SET processed = 1 WHERE reference = ?').bind(reference).run();
    return c.json({ success: true, message: 'Failure recorded' });
  } else if (event === 'disbursement.success' || event === 'payout.success') {
    const tx = await c.env.DB.prepare(`SELECT id, user_id, amount, fee, currency, status, type FROM transactions WHERE reference = ? AND type IN ('payout', 'transfer')`).bind(reference).first<any>();
    if (tx && tx.status === 'pending') {
      await c.env.DB.prepare("UPDATE transactions SET status = 'success', updated_at = datetime('now') WHERE id = ?").bind(tx.id).run();
      await c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('success', reference).run();
      await createNotification(c.env, tx.user_id, tx.type === 'payout' ? 'payout_sent' : 'transfer_sent', `${tx.type === 'payout' ? 'Payout' : 'Transfer'} Confirmed`, `Your ${tx.type} of ${fromCents(tx.amount).toFixed(2)} ${tx.currency} has been confirmed. Reference: ${reference}`, reference, tx.amount, tx.currency);
    }
    await c.env.DB.prepare('UPDATE webhook_events SET processed = 1 WHERE reference = ?').bind(reference).run();
    return c.json({ success: true, message: 'Disbursement success processed', reference });
  } else if (event === 'disbursement.failed' || event === 'payout.failed') {
    const tx = await c.env.DB.prepare(`SELECT id, user_id, amount, fee, currency, status, type FROM transactions WHERE reference = ? AND type IN ('payout', 'transfer')`).bind(reference).first<any>();
    if (tx && tx.status === 'success') {
      const totalDebit = tx.amount + tx.fee; const walletInfo = await getWalletBalance(c.env, tx.user_id, tx.currency);
      if (walletInfo) {
        await c.env.DB.batch([
          c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebit, walletInfo.walletId),
          c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('reversed', tx.id),
          c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('failed', reference),
        ]);
        await createNotification(c.env, tx.user_id, tx.type === 'payout' ? 'payout_failed' : 'transfer_failed', `${tx.type === 'payout' ? 'Payout' : 'Transfer'} Failed — Refunded`, `Your ${tx.type} of ${fromCents(tx.amount).toFixed(2)} ${tx.currency} failed. ${fromCents(totalDebit).toFixed(2)} ${tx.currency} refunded. Reference: ${reference}`, reference, tx.amount, tx.currency);
        const failUser = await getUserById(c.env, tx.user_id);
        if (failUser) await sendEmail(c.env, failUser.email, `${tx.type === 'payout' ? 'Payout' : 'Transfer'} failed — funds refunded`, `<h2>${tx.type === 'payout' ? 'Payout' : 'Transfer'} Failed</h2><p>Amount: ${fromCents(tx.amount).toFixed(2)} ${tx.currency}</p><p>Funds refunded.</p><p>Reference: ${reference}</p>`);
        await audit(c.env, tx.user_id, `${tx.type}_reversed`, '', { reference, amount: tx.amount, refunded: totalDebit });
      }
    } else if (tx && tx.status === 'pending') {
      const totalDebit = tx.amount + tx.fee; const walletInfo = await getWalletBalance(c.env, tx.user_id, tx.currency);
      if (walletInfo) {
        await c.env.DB.batch([
          c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(totalDebit, walletInfo.walletId),
          c.env.DB.prepare("UPDATE transactions SET status = ?, updated_at = datetime('now') WHERE id = ?").bind('failed', tx.id),
          c.env.DB.prepare("UPDATE gateway_transactions SET status = ?, updated_at = datetime('now') WHERE reference = ?").bind('failed', reference),
        ]);
        await createNotification(c.env, tx.user_id, tx.type === 'payout' ? 'payout_failed' : 'transfer_failed', `${tx.type === 'payout' ? 'Payout' : 'Transfer'} Failed — Refunded`, `Your ${tx.type} of ${fromCents(tx.amount).toFixed(2)} ${tx.currency} failed. ${fromCents(totalDebit).toFixed(2)} ${tx.currency} refunded. Reference: ${reference}`, reference, tx.amount, tx.currency);
      }
    }
    await c.env.DB.prepare('UPDATE webhook_events SET processed = 1 WHERE reference = ?').bind(reference).run();
    return c.json({ success: true, message: 'Disbursement failure processed — funds refunded', reference });
  }
  await c.env.DB.prepare('UPDATE webhook_events SET processed = 1 WHERE reference = ?').bind(reference).run();
  return c.json({ success: true, message: `Event ${event} received` });
}
app.post('/api/webhooks/korapay', async (c) => { return handleKorapayWebhook(c); });
app.post('/v1/webhooks/korapay', async (c) => { return handleKorapayWebhook(c); });
app.get('/api/virtual-accounts', authMiddleware, async (c) => { const user = c.get('user'); const result = await c.env.DB.prepare('SELECT * FROM virtual_accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC').bind(user.id).all(); return c.json({ accounts: result.results || [] }); });
app.post('/api/virtual-accounts', authMiddleware, async (c) => {
  const user = c.get('user'); const dbUser = await getUserById(c.env, user.id); if (!dbUser) return c.json({ error: 'User not found' }, 404);
  const bankName = 'Providus Bank'; const accountName = (dbUser.full_name || dbUser.email).toUpperCase(); const accountNumber = String(Math.floor(8000000000 + Math.random() * 999999999)); const routingNumber = '021000021'; const swiftCode = 'PVBNGNGL'; const accountId = generateId('va_');
  await c.env.DB.prepare('INSERT INTO virtual_accounts (id, user_id, bank_name, account_name, account_number, routing_number, swift_code, provider) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(accountId, user.id, bankName, accountName, accountNumber, routingNumber, swiftCode, 'kora').run();
  await audit(c.env, user.id, 'virtual_account_create', getClientIP(c));
  return c.json({ message: 'Virtual account created', account: { id: accountId, bank_name: bankName, account_name: accountName, account_number: accountNumber, routing_number: routingNumber, swift_code: swiftCode } }, 201);
});
app.get('/api/cards', authMiddleware, async (c) => { const user = c.get('user'); const result = await c.env.DB.prepare('SELECT id, card_type, last4, expiry_month, expiry_year, cardholder_name, is_active, created_at FROM cards WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC').bind(user.id).all(); return c.json({ cards: result.results || [] }); });
app.post('/api/cards', authMiddleware, async (c) => {
  const user = c.get('user'); const { card_type, last4, expiry_month, expiry_year, cardholder_name } = await c.req.json();
  if (!card_type || !last4) return c.json({ error: 'Card type and last 4 digits are required' }, 400);
  const validTypes = ['visa', 'mastercard', 'virtual']; if (!validTypes.includes(card_type)) return c.json({ error: 'Invalid card type' }, 400);
  if (!/^\d{4}$/.test(last4)) return c.json({ error: 'Last 4 must be exactly 4 digits' }, 400);
  const cardId = generateId('card_');
  await c.env.DB.prepare('INSERT INTO cards (id, user_id, card_type, last4, expiry_month, expiry_year, cardholder_name) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(cardId, user.id, card_type, last4, expiry_month, expiry_year, cardholder_name).run();
  return c.json({ message: 'Card added', card_id: cardId }, 201);
});
app.delete('/api/cards', authMiddleware, async (c) => { const user = c.get('user'); const { card_id } = await c.req.json(); if (!card_id) return c.json({ error: 'Card ID is required' }, 400); await c.env.DB.prepare('UPDATE cards SET is_active = 0 WHERE id = ? AND user_id = ?').bind(card_id, user.id).run(); return c.json({ message: 'Card removed' }); });
app.post('/api/account/freeze', authMiddleware, async (c) => {
  const user = c.get('user'); const { reason } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET is_frozen = 1, frozen_reason = ?, frozen_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(reason || 'Self-frozen by user', user.id).run();
  await audit(c.env, user.id, 'account_freeze', getClientIP(c), { reason });
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  return c.json({ message: 'Account frozen. You have been logged out of all devices.' });
});
app.post('/api/account/unfreeze', async (c) => {
  const { email, verification_code } = await c.req.json(); if (!email || !verification_code) return c.json({ error: 'Email and verification code are required' }, 400);
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND is_frozen = 1').bind(email.toLowerCase()).first<any>(); if (!user) return c.json({ error: 'No frozen account found with that email' }, 404);
  const authToken = await c.env.DB.prepare("SELECT * FROM auth_tokens WHERE user_id = ? AND type = 'email_verify' AND token = ? AND used = 0 AND expires_at > ?").bind(user.id, verification_code, Date.now()).first<any>(); if (!authToken) return c.json({ error: 'Invalid or expired verification code' }, 400);
  await c.env.DB.batch([ c.env.DB.prepare("UPDATE users SET is_frozen = 0, frozen_reason = NULL, frozen_at = NULL, updated_at = datetime('now') WHERE id = ?").bind(user.id), c.env.DB.prepare('UPDATE auth_tokens SET used = 1 WHERE id = ?').bind(authToken.id) ]);
  await audit(c.env, user.id, 'account_unfreeze', getClientIP(c)); return c.json({ message: 'Account unfrozen. You can now log in.' });
});
app.post('/api/account/unfreeze/request', async (c) => {
  const { email } = await c.req.json(); if (!email) return c.json({ error: 'Email is required' }, 400);
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND is_frozen = 1').bind(email.toLowerCase()).first<any>(); if (!user) return c.json({ success: true, message: 'If a frozen account exists, a code has been sent' });
  const verifyToken = generateToken(8);
  await c.env.DB.prepare("INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, 'email_verify', ?)").bind(generateId('tok_'), user.id, verifyToken, Date.now() + 60*60*1000).run();
  await sendEmail(c.env, email, 'Unfreeze your MIKPAL account', `<h2>Account Unfreeze</h2><p>Your verification code is: <strong>${verifyToken}</strong></p><p>Expires in 1 hour.</p>`);
  return c.json({ success: true, message: 'If a frozen account exists, a code has been sent' });
});
app.post('/api/transactions/:id/reverse', authMiddleware, async (c) => {
  const user = c.get('user'); const ip = getClientIP(c); const txId = c.req.param('id'); const { pin, reason } = await c.req.json();
  const pinCheck = await verifyPinForTransaction(c.env, user.id, pin); if (!pinCheck.valid) return c.json({ error: pinCheck.error }, 401);
  const tx = await c.env.DB.prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ? AND type = 'p2p_send' AND status = 'success'").bind(txId, user.id).first<any>(); if (!tx) return c.json({ error: 'Transaction not found or not reversible' }, 404);
  const ledger = await c.env.DB.prepare('SELECT * FROM ledger_entries WHERE reference = ? AND sender_id = ? AND status = ?').bind(tx.reference, user.id, 'success').first<any>(); if (!ledger) return c.json({ error: 'Ledger entry not found' }, 404);
  const recipientId = ledger.recipient_id; const amt = ledger.amount; const fee = ledger.fee; const totalRefund = amt + fee; const txCurrency = ledger.currency;
  const recipientWallet = await getWalletBalance(c.env, recipientId, txCurrency); if (!recipientWallet || recipientWallet.balance < amt) return c.json({ error: 'Recipient has insufficient balance to reverse' }, 400);
  const senderWallet = await getWalletBalance(c.env, user.id, txCurrency); if (!senderWallet) return c.json({ error: 'Your wallet not found' }, 400);
  const debitRecipient = await c.env.DB.prepare("UPDATE wallets SET balance = balance - ?, updated_at = datetime('now') WHERE id = ? AND balance >= ?").bind(amt, recipientWallet.walletId, amt).run();
  if (!debitRecipient.meta.changes || debitRecipient.meta.changes === 0) return c.json({ error: 'Recipient has insufficient balance for reversal' }, 409);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").bind(totalRefund, senderWallet.walletId),
    c.env.DB.prepare("UPDATE transactions SET status = 'reversed', reversed_by = ?, reversed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(user.id, tx.id),
    c.env.DB.prepare("UPDATE transactions SET status = 'reversed', reversed_by = ?, reversed_at = datetime('now'), updated_at = datetime('now') WHERE reference = ? AND type = 'p2p_receive'").bind(user.id, tx.reference),
    c.env.DB.prepare("UPDATE ledger_entries SET status = 'reversed' WHERE reference = ?").bind(tx.reference),
    c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, pin_verified) VALUES (?, ?, 'reversal', 'system', ?, 0, ?, 'success', ?, 'P2P transfer reversed', ?, 1)`).bind(generateId('tx_'), user.id, amt, txCurrency, `REV-${tx.reference}`, `@${ledger.recipient_id}`),
    c.env.DB.prepare(`INSERT INTO transactions (id, user_id, type, channel, amount, fee, currency, status, reference, description, recipient_name, pin_verified) VALUES (?, ?, 'reversal', 'system', ?, 0, ?, 'success', ?, 'P2P transfer reversed (debited)', ?, 0)`).bind(generateId('tx_'), recipientId, amt, txCurrency, `REV-${tx.reference}`, `@${user.username || user.email}`),
  ]);
  await createNotification(c.env, user.id, 'reversal', 'Transfer Reversed', `Your P2P transfer of ${fromCents(amt).toFixed(2)} ${txCurrency} has been reversed. ${fromCents(totalRefund).toFixed(2)} ${txCurrency} refunded. Reference: ${tx.reference}`, tx.reference, amt, txCurrency);
  const recipientUser = await getUserById(c.env, recipientId);
  if (recipientUser) { await createNotification(c.env, recipientId, 'reversal', 'Transfer Reversed', `A P2P transfer of ${fromCents(amt).toFixed(2)} ${txCurrency} from @${user.username || user.email} has been reversed. ${fromCents(amt).toFixed(2)} ${txCurrency} debited.`, tx.reference, amt, txCurrency); await sendEmail(c.env, recipientUser.email, 'Transfer reversed', `<h2>P2P Transfer Reversed</h2><p>Amount: ${fromCents(amt).toFixed(2)} ${txCurrency}</p><p>Reversed by: @${user.username || user.email}</p><p>Reason: ${reason || 'Not specified'}</p>`); }
  await audit(c.env, user.id, 'transaction_reversal', ip, { txId, reference: tx.reference, amount: amt, recipient: recipientId, reason });
  const newBalance = await getWalletBalance(c.env, user.id, txCurrency);
  return c.json({ message: 'Transaction reversed successfully', reference: tx.reference, reversed_amount: fromCents(amt), fee_refunded: fromCents(fee), currency: txCurrency, new_balance: fromCents(newBalance?.balance ?? 0), status: 'reversed' });
});
app.get('/api/notifications', authMiddleware, async (c) => {
  const user = c.get('user'); const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); const offset = parseInt(c.req.query('offset') || '0'); const unreadOnly = c.req.query('unread') === 'true';
  const query = unreadOnly ? 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?' : 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const result = await c.env.DB.prepare(query).bind(user.id, limit, offset).all();
  const unreadResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').bind(user.id).first<any>();
  return c.json({ notifications: result.results || [], unread_count: unreadResult?.count || 0 });
});
app.put('/api/notifications/:id/read', authMiddleware, async (c) => { const user = c.get('user'); const notifId = c.req.param('id'); await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(notifId, user.id).run(); return c.json({ success: true }); });
app.put('/api/notifications/read-all', authMiddleware, async (c) => { const user = c.get('user'); await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').bind(user.id).run(); return c.json({ success: true }); });
app.delete('/api/notifications/:id', authMiddleware, async (c) => { const user = c.get('user'); const notifId = c.req.param('id'); await c.env.DB.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').bind(notifId, user.id).run(); return c.json({ success: true }); });
app.get('/api/health', (c) => { return c.json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' }); });
export default app;
