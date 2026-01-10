import './PrivacyPolicy.css'

function TermsAndConditions() {
  return (
    <div className="legal-page">
      <div className="legal-content">
        <h1>Terms and Conditions</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using the Clearview Counselling platform ("Service"), you agree to be bound 
            by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not 
            use our Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Clearview Counselling provides an online platform for scheduling and managing counselling 
            appointments. The Service includes:
          </p>
          <ul>
            <li>User account creation and management</li>
            <li>Appointment scheduling and booking</li>
            <li>Intake questionnaire forms</li>
            <li>Payment processing for counselling services</li>
            <li>Communication tools for appointment management</li>
          </ul>
        </section>

        <section>
          <h2>3. Account Registration and Security</h2>
          
          <h3>3.1 Account Creation</h3>
          <p>
            To use certain features of our Service, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
          </ul>

          <h3>3.2 Account Suspension or Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account at any time if you violate 
            these Terms or engage in fraudulent, abusive, or illegal activity.
          </p>
        </section>

        <section>
          <h2>4. Use of Service</h2>
          
          <h3>4.1 Permitted Use</h3>
          <p>You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit any malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Impersonate any person or entity</li>
            <li>Collect or harvest information about other users</li>
          </ul>

          <h3>4.2 User Content</h3>
          <p>
            You are responsible for all content you submit through the Service, including intake 
            questionnaire responses and appointment notes. You grant us a license to use, store, 
            and process this content to provide our services.
          </p>
        </section>

        <section>
          <h2>5. Appointment Booking and Cancellation</h2>
          
          <h3>5.1 Booking Appointments</h3>
          <p>
            Appointments can be booked through the Service. All appointments are subject to 
            availability and confirmation. We reserve the right to refuse or cancel any appointment 
            at our discretion.
          </p>

          <h3>5.2 Cancellation Policy</h3>
          <p>
            You may cancel or reschedule appointments through the Service. Please refer to our 
            cancellation policy for specific terms regarding refunds and fees. Failure to attend 
            a confirmed appointment without prior cancellation may result in fees.
          </p>

          <h3>5.3 Changes to Appointments</h3>
          <p>
            We reserve the right to reschedule or cancel appointments due to unforeseen circumstances. 
            We will make reasonable efforts to notify you of any changes.
          </p>
        </section>

        <section>
          <h2>6. Payment Terms</h2>
          
          <h3>6.1 Payment Processing</h3>
          <p>
            Payments are processed through third-party payment processors (PayPal and Wise). 
            By making a payment, you agree to the terms and conditions of the respective payment 
            processor. We are not responsible for the actions or policies of these third-party services.
          </p>

          <h3>6.2 Pricing</h3>
          <p>
            All prices are displayed in the currency specified on the Service. We reserve the right 
            to modify pricing at any time. You will be charged at the rate displayed at the time of booking.
          </p>

          <h3>6.3 Refunds</h3>
          <p>
            Refund policies are determined on a case-by-case basis. Contact us for information about 
            refunds for cancelled or rescheduled appointments. Refunds, if approved, will be processed 
            through the original payment method.
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            The Service, including its design, text, graphics, logos, and software, is owned by 
            Clearview Counselling or its licensors and is protected by copyright, trademark, and 
            other intellectual property laws. You may not reproduce, distribute, or create derivative 
            works without our express written permission.
          </p>
        </section>

        <section>
          <h2>8. Third-Party Services</h2>
          <p>
            Our Service integrates with third-party services, including:
          </p>
          <ul>
            <li>
              <strong>Firebase (Google):</strong> For authentication and data storage. 
              By using our Service, you agree to Firebase's Terms of Service.
            </li>
            <li>
              <strong>PayPal:</strong> For payment processing. By using PayPal, you agree to PayPal's 
              User Agreement and Privacy Policy.
            </li>
            <li>
              <strong>Wise:</strong> For payment processing. By using Wise, you agree to Wise's 
              Terms of Service and Privacy Policy.
            </li>
            <li>
              <strong>Netlify:</strong> For hosting services. Our platform is hosted on Netlify's infrastructure.
            </li>
          </ul>
          <p>
            We are not responsible for the privacy practices, content, or services of these third-party 
            providers. Your use of third-party services is subject to their respective terms and conditions.
          </p>
        </section>

        <section>
          <h2>9. Disclaimers and Limitations of Liability</h2>
          
          <h3>9.1 Service Availability</h3>
          <p>
            We strive to provide continuous access to our Service but do not guarantee uninterrupted 
            or error-free operation. The Service is provided "as is" and "as available" without warranties 
            of any kind, either express or implied.
          </p>

          <h3>9.2 Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, Clearview Counselling shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages, or any loss of profits 
            or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, 
            or other intangible losses resulting from your use of the Service.
          </p>

          <h3>9.3 No Medical Advice</h3>
          <p>
            The Service is a platform for scheduling appointments. It does not provide medical, 
            psychological, or counselling advice. Any information provided through the Service is 
            for scheduling purposes only and should not be considered as professional advice.
          </p>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Clearview Counselling, its officers, 
            directors, employees, and agents from and against any claims, liabilities, damages, losses, 
            and expenses (including legal fees) arising from your use of the Service, violation of these 
            Terms, or infringement of any rights of another party.
          </p>
        </section>

        <section>
          <h2>11. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
            without regard to its conflict of law provisions. Any disputes arising from these Terms or 
            the Service shall be resolved through binding arbitration or in the courts of [Your Jurisdiction].
          </p>
        </section>

        <section>
          <h2>12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material 
            changes by posting the updated Terms on this page and updating the "Last Updated" date. 
            Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2>13. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
            shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2>14. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you 
            and Clearview Counselling regarding the use of the Service and supersede all prior agreements 
            and understandings.
          </p>
        </section>

        <section>
          <h2>15. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>Email: [Your Contact Email]</li>
            <li>Phone: [Your Contact Phone]</li>
            <li>Address: [Your Business Address]</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default TermsAndConditions

