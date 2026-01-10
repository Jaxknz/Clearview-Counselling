function TermsAndConditions() {
  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="max-w-4xl mx-auto bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Terms and Conditions</h1>
        <p className="text-text-light italic mb-8 pb-6 border-b-2 border-border">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            By accessing or using the Clearview Counselling platform ("Service"), you agree to be bound 
            by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not 
            use our Service.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">2. Description of Service</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Clearview Counselling provides an online platform for scheduling and managing counselling 
            appointments. The Service includes:
          </p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">User account creation and management</li>
            <li className="mb-2 text-text-dark">Appointment scheduling and booking</li>
            <li className="mb-2 text-text-dark">Intake questionnaire forms</li>
            <li className="mb-2 text-text-dark">Payment processing for counselling services</li>
            <li className="mb-2 text-text-dark">Communication tools for appointment management</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">3. Account Registration and Security</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">3.1 Account Creation</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            To use certain features of our Service, you must create an account. You agree to:
          </p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Provide accurate, current, and complete information during registration</li>
            <li className="mb-2 text-text-dark">Maintain and promptly update your account information</li>
            <li className="mb-2 text-text-dark">Maintain the security of your account credentials</li>
            <li className="mb-2 text-text-dark">Accept responsibility for all activities under your account</li>
            <li className="mb-2 text-text-dark">Notify us immediately of any unauthorized access or security breach</li>
          </ul>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">3.2 Account Suspension or Termination</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            We reserve the right to suspend or terminate your account at any time if you violate 
            these Terms or engage in fraudulent, abusive, or illegal activity.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">4. Use of Service</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.1 Permitted Use</h3>
          <p className="leading-[1.8] text-text-dark mb-4">You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Use the Service for any illegal or unauthorized purpose</li>
            <li className="mb-2 text-text-dark">Violate any applicable laws or regulations</li>
            <li className="mb-2 text-text-dark">Infringe upon the rights of others</li>
            <li className="mb-2 text-text-dark">Transmit any malicious code, viruses, or harmful content</li>
            <li className="mb-2 text-text-dark">Attempt to gain unauthorized access to the Service or related systems</li>
            <li className="mb-2 text-text-dark">Interfere with or disrupt the Service or servers</li>
            <li className="mb-2 text-text-dark">Impersonate any person or entity</li>
            <li className="mb-2 text-text-dark">Collect or harvest information about other users</li>
          </ul>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.2 User Content</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            You are responsible for all content you submit through the Service, including intake 
            questionnaire responses and appointment notes. You grant us a license to use, store, 
            and process this content to provide our services.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">5. Appointment Booking and Cancellation</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">5.1 Booking Appointments</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            Appointments can be booked through the Service. All appointments are subject to 
            availability and confirmation. We reserve the right to refuse or cancel any appointment 
            at our discretion.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">5.2 Cancellation Policy</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            You may cancel or reschedule appointments through the Service. Please refer to our 
            cancellation policy for specific terms regarding refunds and fees. Failure to attend 
            a confirmed appointment without prior cancellation may result in fees.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">5.3 Changes to Appointments</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            We reserve the right to reschedule or cancel appointments due to unforeseen circumstances. 
            We will make reasonable efforts to notify you of any changes.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">6. Payment Terms</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">6.1 Payment Processing</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            Payments are processed through third-party payment processors (PayPal and Wise). 
            By making a payment, you agree to the terms and conditions of the respective payment 
            processor. We are not responsible for the actions or policies of these third-party services.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">6.2 Pricing</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            All prices are displayed in the currency specified on the Service. We reserve the right 
            to modify pricing at any time. You will be charged at the rate displayed at the time of booking.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">6.3 Refunds</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            Refund policies are determined on a case-by-case basis. Contact us for information about 
            refunds for cancelled or rescheduled appointments. Refunds, if approved, will be processed 
            through the original payment method.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">7. Intellectual Property</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            The Service, including its design, text, graphics, logos, and software, is owned by 
            Clearview Counselling or its licensors and is protected by copyright, trademark, and 
            other intellectual property laws. You may not reproduce, distribute, or create derivative 
            works without our express written permission.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">8. Third-Party Services</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Our Service integrates with third-party services, including:
          </p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">Firebase (Google):</strong> For authentication and data storage. 
              By using our Service, you agree to Firebase's Terms of Service.
            </li>
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">PayPal:</strong> For payment processing. By using PayPal, you agree to PayPal's 
              User Agreement and Privacy Policy.
            </li>
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">Wise:</strong> For payment processing. By using Wise, you agree to Wise's 
              Terms of Service and Privacy Policy.
            </li>
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">Netlify:</strong> For hosting services. Our platform is hosted on Netlify's infrastructure.
            </li>
          </ul>
          <p className="leading-[1.8] text-text-dark mb-4">
            We are not responsible for the privacy practices, content, or services of these third-party 
            providers. Your use of third-party services is subject to their respective terms and conditions.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">9. Disclaimers and Limitations of Liability</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">9.1 Service Availability</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            We strive to provide continuous access to our Service but do not guarantee uninterrupted 
            or error-free operation. The Service is provided "as is" and "as available" without warranties 
            of any kind, either express or implied.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">9.2 Limitation of Liability</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            To the maximum extent permitted by law, Clearview Counselling shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages, or any loss of profits 
            or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, 
            or other intangible losses resulting from your use of the Service.
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">9.3 No Medical Advice</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            The Service is a platform for scheduling appointments. It does not provide medical, 
            psychological, or counselling advice. Any information provided through the Service is 
            for scheduling purposes only and should not be considered as professional advice.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">10. Indemnification</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            You agree to indemnify, defend, and hold harmless Clearview Counselling, its officers, 
            directors, employees, and agents from and against any claims, liabilities, damages, losses, 
            and expenses (including legal fees) arising from your use of the Service, violation of these 
            Terms, or infringement of any rights of another party.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">11. Governing Law and Dispute Resolution</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
            without regard to its conflict of law provisions. Any disputes arising from these Terms or 
            the Service shall be resolved through binding arbitration or in the courts of [Your Jurisdiction].
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">12. Changes to Terms</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            We reserve the right to modify these Terms at any time. We will notify you of material 
            changes by posting the updated Terms on this page and updating the "Last Updated" date. 
            Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">13. Severability</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
            shall remain in full force and effect.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">14. Entire Agreement</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you 
            and Clearview Counselling regarding the use of the Service and supersede all prior agreements 
            and understandings.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">15. Contact Information</h2>
          <p className="leading-[1.8] text-text-dark mb-4">If you have any questions about these Terms, please contact us:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Email: [Your Contact Email]</li>
            <li className="mb-2 text-text-dark">Phone: [Your Contact Phone]</li>
            <li className="mb-2 text-text-dark">Address: [Your Business Address]</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default TermsAndConditions

