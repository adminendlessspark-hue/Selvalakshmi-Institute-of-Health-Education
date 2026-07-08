import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

export function PaymentResult({ status }: { status: "success" | "cancel" }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center relative">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Payment Successful!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for your payment. Your registration is now completed successfully. 
            </p>
            {sessionId && (
              <p className="text-xs text-slate-400 font-mono break-all bg-slate-50 p-2 rounded mb-6">
                Ref: {sessionId}
              </p>
            )}
            <Link
              to="/login"
              className="block w-full bg-teal-600 text-white font-medium py-3 rounded-md hover:bg-teal-700 transition"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Payment Cancelled</h2>
            <p className="text-slate-600 mb-8">
              Your payment process was cancelled or failed. Your registration details were saved, but you may need to try paying again to access course features.
            </p>
            <div className="flex gap-4">
              <Link
                to="/register"
                className="flex-1 bg-slate-100 text-slate-700 font-medium py-3 rounded-md hover:bg-slate-200 transition"
              >
                Back to Register
              </Link>
              <Link
                to="/login"
                className="flex-1 bg-teal-600 text-white font-medium py-3 rounded-md hover:bg-teal-700 transition"
              >
                Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
