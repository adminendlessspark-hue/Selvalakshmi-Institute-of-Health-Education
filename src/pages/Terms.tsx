import React from 'react';

export function Terms() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-slate-800">
      <h1 className="text-3xl font-serif font-bold text-sage-900 mb-6">Terms and Conditions</h1>
      <div className="prose max-w-none prose-sage">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>Please read these Terms and Conditions carefully before using our website and services operated by Selvalakshmi Institute of Health Education.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">1. Acceptance of Terms</h2>
        <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">2. Webinar and Course Access</h2>
        <p>Upon registration and full payment (if applicable), we grant you limited, non-exclusive access to our educational materials, courses, and webinars for personal, non-commercial use only.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">3. Intellectual Property</h2>
        <p>The service and its original content, features, and functionality are and will remain the exclusive property of Selvalakshmi Institute of Health Education and its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">4. User Accounts</h2>
        <p>When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">5. Limitation of Liability</h2>
        <p>In no event shall Selvalakshmi Institute of Health Education be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of our services.</p>
      </div>
    </div>
  );
}
