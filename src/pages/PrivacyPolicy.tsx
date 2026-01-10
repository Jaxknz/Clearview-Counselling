import './PrivacyPolicy.css'

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Clearview Counselling ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our counselling services platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Account credentials (email and password)</li>
            <li>Intake questionnaire responses</li>
            <li>Appointment booking information</li>
            <li>Payment information (processed through third-party payment processors)</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our platform, we automatically collect certain information, including:</p>
          <ul>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referral sources</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our counselling services</li>
            <li>Process your appointments and manage your account</li>
            <li>Send you appointment confirmations, reminders, and updates</li>
            <li>Process payments for services</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Comply with legal obligations and protect our rights</li>
            <li>Analyze usage patterns to improve our platform</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          
          <h3>4.1 Firebase Services</h3>
          <p>
            We use Google Firebase for authentication and data storage. Your information is stored 
            securely in Firebase Authentication and Cloud Firestore databases. Firebase implements 
            industry-standard security measures to protect your data.
          </p>
          <p>
            For more information about Firebase's privacy and security practices, please visit: 
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
              Firebase Privacy Information
            </a>
          </p>

          <h3>4.2 Payment Processing</h3>
          <p>
            Payment information is processed through third-party payment processors:
          </p>
          <ul>
            <li>
              <strong>PayPal:</strong> When you use PayPal, your payment information is handled by PayPal 
              according to their privacy policy. We do not store your full payment card details.
              <a href="https://www.paypal.com/us/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">
                PayPal Privacy Policy
              </a>
            </li>
            <li>
              <strong>Wise:</strong> When you use Wise, your payment information is handled by Wise 
              according to their privacy policy. We do not store your payment account details.
              <a href="https://wise.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                Wise Privacy Policy
              </a>
            </li>
          </ul>

          <h3>4.3 Hosting</h3>
          <p>
            Our platform is hosted on Netlify. Netlify provides hosting services and may collect 
            certain information about your use of our platform. For more information, see: 
            <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">
              Netlify Privacy Policy
            </a>
          </p>

          <h3>4.4 Security Measures</h3>
          <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication mechanisms</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
          </ul>
        </section>

        <section>
          <h2>5. Information Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform (e.g., Firebase, Netlify, payment processors)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>Consent:</strong> With your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Update or correct your personal information through your account settings</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal information</li>
            <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
          </ul>
          <p>To exercise these rights, please contact us at the information provided below.</p>
        </section>

        <section>
          <h2>7. Cookies and Tracking Technologies</h2>
          <p>
            Our platform may use cookies and similar tracking technologies to enhance your experience. 
            You can control cookie preferences through your browser settings. Please note that disabling 
            cookies may affect the functionality of our platform.
          </p>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly 
            collect personal information from children. If you believe we have collected information 
            from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country 
            of residence. These countries may have data protection laws that differ from those in your 
            country. By using our services, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section>
          <h2>10. Retention of Information</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes 
            outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
            Your continued use of our services after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
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

export default PrivacyPolicy

