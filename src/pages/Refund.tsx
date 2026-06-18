import React from 'react';

export function Refund() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-slate-800">
      <h1 className="text-3xl font-serif font-bold text-sage-900 mb-6">Cancellation and Refund Policy</h1>
      <div className="prose max-w-none prose-sage">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>At Selvalakshmi Institute of Health Education, we strive to ensure our students have a rewarding experience while exploring and evaluating our courses and live webinars. This policy outlines our cancellation and refund processes.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">1. Cancellations</h2>
        <p>You may cancel your enrollment in a course or webinar prior to its start date. If you cancel more than 48 hours before the scheduled start time, you may be eligible for a refund or credit toward a future program.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">2. Refund Eligibility</h2>
        <ul className="list-disc pl-6 mb-6">
          <li><strong>Live Webinars:</strong> Refunds are only available if requested at least 48 hours prior to the live session. Once the webinar has started or access links have been delivered, no refunds will be issued.</li>
          <li><strong>Pre-recorded Courses:</strong> Refunds are only considered within 7 days of purchase, provided that you have not completed more than 10% of the course content.</li>
        </ul>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">3. Process for Requesting a Refund</h2>
        <p>To request a refund, please contact us at <strong>info@selvalakshmihealtheducation.in</strong> with your registration details and reason for the request. We will review the request and notify you of the approval or rejection within 5-7 business days.</p>
        
        <h2 className="text-xl font-bold mt-6 mb-3 text-sage-800">4. Processing Refunds</h2>
        <p>If your refund is approved, we will initiate a refund to your original method of payment (e.g., credit card, bank account, or UPI) within a certain amount of days, depending on your card issuer's policies.</p>
      </div>
    </div>
  );
}
