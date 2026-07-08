import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentButtonProps {
  amount: number; // Amount in rupees
  title: string;
  className?: string;
  label?: string;
}

export function PaymentButton({ amount, title, className = "", label = "Pay Now" }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      // Call our backend API to create an order
      const response = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, title }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || "Failed to create Razorpay order");
      }

      // Get Razorpay Key ID from server
      const keyResponse = await fetch("/api/razorpay-key");
      const keyData = await keyResponse.json();
      
      if (!keyData.key) {
         throw new Error("Razorpay Key ID not configured on server.");
      }

      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Selvalakshmi Foundation",
        description: title,
        order_id: orderData.id,
        handler: function (response: any) {
          // Redirect to success page or handle successful payment
          window.location.hash = `#/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#0d9488" // teal-600
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setError(response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="group relative flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-teal-400 disabled:shadow-none min-w-[200px]"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5 transition-transform group-hover:scale-110" />
        )}
        <span>{loading ? "Processing..." : label}</span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center max-w-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

