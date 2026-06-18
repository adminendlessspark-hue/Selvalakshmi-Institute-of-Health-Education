import React from 'react';

export function Privacy() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-slate-800">
      <h1 className="text-3xl font-serif font-bold text-sage-900 mb-6">Privacy Policy</h1>
      <div className="prose max-w-none prose-sage">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>This Privacy Policy describes how Selvalakshmi Institute of Health Education ("we", "us", or "our") collects, uses, and discloses your information when you use our website and services.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">1. Information We Collect</h2>
        <p>We may collect personal information such as your name, email address, phone number, and physical address when you register for courses, webinars, or contact us.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and communicate with you about courses and webinars.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processing via third-party gateways) or comply with the law.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Email: info@selvalakshmihealtheducation.in</li>
          <li>Phone: +91 8072 887 131</li>
          <li>Address: 3, Vivekananda road, P. N. Pudur, Coimbatore - 641041.</li>
        </ul>
      </div>
    </div>
  );
}
