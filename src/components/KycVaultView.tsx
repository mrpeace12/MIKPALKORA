import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COUNTRIES } from '../data/mockData';
import { ShieldCheck, Lock, UploadCloud, CheckCircle2, FileText, Camera, AlertTriangle, ArrowRight } from 'lucide-react';

interface KycVaultViewProps {
  user: UserProfile;
  onUpdateKycDoc: (docName: string, docNum: string) => void;
}

export const KycVaultView: React.FC<KycVaultViewProps> = ({ user, onUpdateKycDoc }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [docNumberInput, setDocNumberInput] = useState<string>('');
  const [livenessStatus, setLivenessStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [livenessTask, setLivenessTask] = useState<string>('Center face in frame');

  const countryInfo = COUNTRIES[user.country];
  const isVerified = user.kycStatus === 'VERIFIED';

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0].name);
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploadSuccess(true);
      }, 1500);
    }
  };

  const startLivenessScan = () => {
    setLivenessStatus('SCANNING');
    setLivenessTask('Slowly blink your eyes...');
    setTimeout(() => {
      setLivenessTask('Turn head slightly right...');
      setTimeout(() => {
        setLivenessTask('Verifying 3D micro-expressions...');
        setTimeout(() => {
          setLivenessStatus('SUCCESS');
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleSubmitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumberInput) {
      alert(`Please enter your ${countryInfo.kycDocName} number`);
      return;
    }
    onUpdateKycDoc(countryInfo.kycDocName, docNumberInput);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Regional Identity & Compliance Vault</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-slate-200">
              {countryInfo.flag} {countryInfo.name} Session
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict country-isolated document vault. Displays verified badges corresponding strictly to your registered region.
          </p>
        </div>

        {isVerified ? (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tier-2 Verified</span>
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Tier 0 - Verification Required</span>
          </span>
        )}
      </div>

      {/* ISOLATION NOTICE BANNER */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-amber-300">Absolute Regional Isolation Active</h4>
          <p className="text-slate-300 leading-relaxed">
            Your identity profile is locked to <strong>{countryInfo.name} ({countryInfo.code})</strong>. Cross-exposure of document requirements (e.g., Ghana Card on Nigerian profile or NIN on Ghanaian profile) is strictly prohibited.
          </p>
        </div>
      </div>

      {/* UNVERIFIED STATE FORM OR VERIFIED CARDS GRID */}
      {!isVerified ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Complete {countryInfo.name} Identity Verification</h3>
              <p className="text-xs text-slate-500">Provide your official {countryInfo.kycDocName} to unlock full virtual banking privileges.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitKyc} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>{countryInfo.kycDocName} Number</span>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {countryInfo.code} Government Requirement
                </span>
              </label>
              <input
                type="text"
                required
                value={docNumberInput}
                onChange={(e) => setDocNumberInput(e.target.value)}
                placeholder={countryInfo.kycDocFormat}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-[#F26522] outline-none"
              />
            </div>

            {/* Biometric Scan */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Biometric Liveness Verification
              </label>
              
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#F26522]" />
                  <span className="text-xs font-medium text-slate-700">
                    {livenessStatus === 'SUCCESS' ? 'Biometric Micro-Expressions Verified!' : livenessTask}
                  </span>
                </div>

                {livenessStatus === 'IDLE' && (
                  <button
                    type="button"
                    onClick={startLivenessScan}
                    className="px-3.5 py-1.5 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Start Scan
                  </button>
                )}

                {livenessStatus === 'SCANNING' && (
                  <span className="text-xs font-bold text-teal-600 animate-pulse">Scanning...</span>
                )}

                {livenessStatus === 'SUCCESS' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <span>Submit Identity Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* VERIFIED REGIONAL DOCUMENTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Main Document Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Identity</span>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active & Verified
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-[#00796B] rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{countryInfo.kycDocName}</h4>
                <p className="text-xs text-slate-500">{countryInfo.kycDocFormat}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Doc Reference:</span>
                <span className="font-bold text-slate-900">
                  {user.kycDocuments?.[0]?.docNumber || 'VERIFIED-ID-881'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verified On:</span>
                <span className="font-bold text-slate-900">{user.kycDocuments?.[0]?.verifiedAt || '2026-03-01'}</span>
              </div>
            </div>
          </div>

          {/* Liveness Check Status Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Biometric Compliance</span>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Liveness Check Passed
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-[#F26522] rounded-2xl">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">3D Facial Micro-Expression Scan</h4>
                <p className="text-xs text-slate-500">Anti-spoofing presentation attack detection</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Biometric Score:</span>
                <span className="font-bold text-emerald-600">99.4% Match</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Method:</span>
                <span className="font-bold text-slate-900">Active Liveness SDK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORTING DOCUMENT UPLOAD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#F26522]" />
          <span>Upload Supporting Proof of Address / Documents</span>
        </h3>
        <p className="text-xs text-slate-500">
          Upload recent utility bill or bank statement in PDF or JPEG for high-tier limits in {countryInfo.name}.
        </p>

        <label className="border-2 border-dashed border-slate-300 hover:border-[#F26522] bg-slate-50 hover:bg-orange-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 block">
          <UploadCloud className="w-8 h-8 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Click to select file or drag & drop</span>
          <span className="text-[11px] text-slate-400">PDF, JPG or PNG (max. 10MB)</span>
          <input type="file" onChange={handleSimulateUpload} className="hidden" accept="image/*,application/pdf" />
        </label>

        {uploading && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-semibold flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
            <span>Encrypting and uploading file to Korapay Identity Vault...</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Document {selectedFile} successfully uploaded and queued for audit!</span>
          </div>
        )}
      </div>

    </div>
  );
};

