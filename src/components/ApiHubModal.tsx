import React, { useState } from 'react';
import { X, Code, Copy, Check, Terminal, Key, Server, Globe, Play, Radio, ShieldCheck } from 'lucide-react';

interface ApiHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHubModal: React.FC<ApiHubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'WEBHOOK' | 'ENDPOINTS' | 'KEYS' | 'TESTER'>('WEBHOOK');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customApiUrl, setCustomApiUrl] = useState<string>('https://api.korapay.com/merchant/api/v1');
  const [testEndpoint, setTestEndpoint] = useState<string>('/v1/webhooks/kora');
  const [testMethod, setTestMethod] = useState<string>('POST');
  const [webhookEvent, setWebhookEvent] = useState<'charge.success' | 'transfer.success' | 'transfer.failed'>('charge.success');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const liveWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/v1/webhooks/kora` : '/v1/webhooks/kora';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateWebhookCall = async () => {
    setIsLoading(true);
    setTestResponse('Sending request to /v1/webhooks/kora...');

    let samplePayload: any = {};

    if (webhookEvent === 'charge.success') {
      samplePayload = {
        event: 'charge.success',
        data: {
          reference: `KPY-DEP-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: 250,
          currency: 'GHS',
          status: 'success',
          customer: {
            name: 'Kwame Mensah',
            email: 'kwame@mikpal.com',
          },
        },
      };
    } else if (webhookEvent === 'transfer.success') {
      samplePayload = {
        event: 'transfer.success',
        data: {
          reference: `KPY-WTH-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: 120,
          currency: 'USD',
          status: 'success',
          recipient: { name: 'Sipho Ndlovu' },
        },
      };
    } else {
      samplePayload = {
        event: 'transfer.failed',
        data: {
          reference: `KPY-WTH-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: 50,
          currency: 'KES',
          status: 'failed',
          reason: 'Insufficient bank routing validation',
        },
      };
    }

    try {
      const res = await fetch('/v1/webhooks/kora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-korapay-signature': 'test_signature_override',
        },
        body: JSON.stringify(samplePayload),
      });

      const data = await res.json().catch(() => ({ status: res.status, text: res.statusText }));
      setTestResponse(
        JSON.stringify(
          {
            httpStatus: res.status,
            ok: res.ok,
            responseBody: data,
            sentPayload: samplePayload,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      setTestResponse(
        JSON.stringify(
          {
            error: 'Failed to connect to local server endpoint',
            message: err.message,
          },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 max-w-3xl w-full overflow-hidden flex flex-col my-8 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F26522]/20 text-[#F26522] rounded-2xl border border-[#F26522]/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">MIKPAL Developer & Kora Webhook Hub</h3>
              <p className="text-xs text-slate-400">
                Live backend Node.js / Express webhook listener active at <code className="text-[#F26522]">/v1/webhooks/kora</code>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 text-xs font-bold text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('WEBHOOK')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'WEBHOOK' ? 'border-[#F26522] text-[#F26522]' : 'border-transparent hover:text-slate-200'}`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Kora Webhook Route</span>
          </button>
          <button
            onClick={() => setActiveTab('ENDPOINTS')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${activeTab === 'ENDPOINTS' ? 'border-[#F26522] text-[#F26522]' : 'border-transparent hover:text-slate-200'}`}
          >
            API Contracts
          </button>
          <button
            onClick={() => setActiveTab('KEYS')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${activeTab === 'KEYS' ? 'border-[#F26522] text-[#F26522]' : 'border-transparent hover:text-slate-200'}`}
          >
            Credentials & URL
          </button>
          <button
            onClick={() => setActiveTab('TESTER')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${activeTab === 'TESTER' ? 'border-[#F26522] text-[#F26522]' : 'border-transparent hover:text-slate-200'}`}
          >
            Live Webhook Simulator
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto font-sans">

          {/* TAB 0: KORA WEBHOOK (NEW & PRIMARY) */}
          {activeTab === 'WEBHOOK' && (
            <div className="space-y-5 text-xs">
              
              {/* Webhook Endpoint Banner */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Live Korapay Webhook Endpoint URL
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    HTTP 200 READY
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-teal-300 font-bold">
                  <span className="truncate">{liveWebhookUrl}</span>
                  <button
                    onClick={() => handleCopy(liveWebhookUrl, 'webhook-url')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 shrink-0 flex items-center gap-1 text-xs font-sans"
                  >
                    {copiedKey === 'webhook-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Paste this exact URL into your <strong>Korapay Merchant Dashboard &gt; Settings &gt; Webhook URL</strong>.
                </p>
              </div>

              {/* Implementation Logic Code Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Active Route Handler (server.ts)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">HMAC SHA256 Signature Verification</span>
                </div>

                <pre className="p-4 bg-slate-950 rounded-2xl text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`// Express Webhook Route Mounted at /v1/webhooks/kora
app.post('/v1/webhooks/kora', async (req, res) => {
  const koraSignature = req.headers['x-korapay-signature'];
  const event = req.body;

  // 1. VERIFY SIGNATURE (HMAC SHA256)
  const isValid = verifyKoraSignature(req.body, koraSignature, process.env.KORA_SECRET_KEY);
  if (!isValid) {
    return res.status(401).send('Unauthorized webhook signature');
  }

  // 2. HANDLE PAYMENT EVENTS
  switch (event.event) {
    case 'charge.success':
      const userEmail = event.data.customer.email;
      const amountPaid = event.data.amount;
      const currency = event.data.currency; // e.g. "GHS"
      await creditUserBalance(userEmail, amountPaid, currency);
      break;

    case 'transfer.success':
      await updateWithdrawalStatus(event.data.reference, 'SUCCESS');
      break;

    case 'transfer.failed':
      await refundUserBalance(event.data.reference);
      break;
  }

  // 3. ALWAYS RESPOND WITH 200 OK
  res.status(200).json({ status: 'success' });
});`}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 1: ENDPOINTS */}
          {activeTab === 'ENDPOINTS' && (
            <div className="space-y-4 text-xs">
              <p className="text-xs text-slate-300">
                The frontend components are engineered to map directly to these Korapay / MIKPAL RESTful JSON payload structures:
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
                    <span className="font-bold text-slate-200">/v1/webhooks/kora</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Receives charge.success, transfer.success, and transfer.failed event callbacks.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
                    <span className="font-bold text-slate-200">/virtual-bank-account</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Creates NGN/KES local virtual bank account or USD Bank of the Lakes account holder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYS & CONFIG */}
          {activeTab === 'KEYS' && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">API Base URL Binding</label>
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 focus:ring-2 focus:ring-[#F26522] outline-none"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium block">Kora Secret Key</span>
                    <span className="font-mono font-bold text-amber-400">sk_test_mikpal_default_key</span>
                  </div>
                  <button
                    onClick={() => handleCopy('sk_test_mikpal_default_key', 'sk')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                  >
                    {copiedKey === 'sk' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TESTER */}
          {activeTab === 'TESTER' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-2">
                  Select Event Payload to Dispatch to <code className="text-[#F26522]">/v1/webhooks/kora</code>:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setWebhookEvent('charge.success')}
                    className={`p-3 rounded-xl border text-center transition font-bold ${
                      webhookEvent === 'charge.success'
                        ? 'bg-[#F26522] border-[#F26522] text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    charge.success
                  </button>

                  <button
                    onClick={() => setWebhookEvent('transfer.success')}
                    className={`p-3 rounded-xl border text-center transition font-bold ${
                      webhookEvent === 'transfer.success'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    transfer.success
                  </button>

                  <button
                    onClick={() => setWebhookEvent('transfer.failed')}
                    className={`p-3 rounded-xl border text-center transition font-bold ${
                      webhookEvent === 'transfer.failed'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    transfer.failed
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-mono text-[11px]">Target: POST /v1/webhooks/kora</span>
                <button
                  onClick={handleSimulateWebhookCall}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isLoading ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
                </button>
              </div>

              {testResponse && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-emerald-400 overflow-x-auto text-[11px]">
                  <pre>{testResponse}</pre>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
          >
            Close Developer Hub
          </button>
        </div>

      </div>
    </div>
  );
};

