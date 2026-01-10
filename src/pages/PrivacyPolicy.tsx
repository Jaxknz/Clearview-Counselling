function PrivacyPolicy() {
  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="max-w-4xl mx-auto bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-text-light italic mb-8 pb-6 border-b-2 border-border">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">1. Introduction</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Clearview Counselling ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our counselling services platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">2.1 Personal Information</h3>
          <p className="leading-[1.8] text-text-dark mb-4">We collect information that you provide directly to us, including:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Name, email address, and phone number</li>
            <li className="mb-2 text-text-dark">Account credentials (email and password)</li>
            <li className="mb-2 text-text-dark">Intake questionnaire responses</li>
            <li className="mb-2 text-text-dark">Appointment booking information</li>
            <li className="mb-2 text-text-dark">Payment information (processed through third-party payment processors)</li>
          </ul>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">2.2 Automatically Collected Information</h3>
          <p className="leading-[1.8] text-text-dark mb-4">When you use our platform, we automatically collect certain information, including:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Browser type and version</li>
            <li className="mb-2 text-text-dark">Device information</li>
            <li className="mb-2 text-text-dark">IP address</li>
            <li className="mb-2 text-text-dark">Pages visited and time spent on pages</li>
            <li className="mb-2 text-text-dark">Referral sources</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">3. How We Use Your Information</h2>
          <p className="leading-[1.8] text-text-dark mb-4">We use the information we collect to:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Provide, maintain, and improve our counselling services</li>
            <li className="mb-2 text-text-dark">Process your appointments and manage your account</li>
            <li className="mb-2 text-text-dark">Send you appointment confirmations, reminders, and updates</li>
            <li className="mb-2 text-text-dark">Process payments for services</li>
            <li className="mb-2 text-text-dark">Respond to your inquiries and provide customer support</li>
            <li className="mb-2 text-text-dark">Comply with legal obligations and protect our rights</li>
            <li className="mb-2 text-text-dark">Analyze usage patterns to improve our platform</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">4. Data Storage and Security</h2>
          
          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.1 Firebase Services</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            We use Google Firebase for authentication and data storage. Your information is stored 
            securely in Firebase Authentication and Cloud Firestore databases. Firebase implements 
            industry-standard security measures to protect your data.
          </p>
          <p className="leading-[1.8] text-text-dark mb-4">
            For more information about Firebase's privacy and security practices, please visit: 
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline">
              Firebase Privacy Information
            </a>
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.2 Payment Processing</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            Payment information is processed through third-party payment processors:
          </p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">PayPal:</strong> When you use PayPal, your payment information is handled by PayPal 
              according to their privacy policy. We do not store your full payment card details.{' '}
              <a href="https://www.paypal.com/us/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline">
                PayPal Privacy Policy
              </a>
            </li>
            <li className="mb-2 text-text-dark">
              <strong className="text-text-dark font-semibold">Wise:</strong> When you use Wise, your payment information is handled by Wise 
              according to their privacy policy. We do not store your payment account details.{' '}
              <a href="https://wise.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline">
                Wise Privacy Policy
              </a>
            </li>
          </ul>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.3 Hosting</h3>
          <p className="leading-[1.8] text-text-dark mb-4">
            Our platform is hosted on Netlify. Netlify provides hosting services and may collect 
            certain information about your use of our platform. For more information, see: 
            <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline">
              Netlify Privacy Policy
            </a>
          </p>

          <h3 className="text-xl md:text-lg font-semibold text-text-dark mt-6 mb-3">4.4 Security Measures</h3>
          <p className="leading-[1.8] text-text-dark mb-4">We implement appropriate technical and organizational measures to protect your personal information, including:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark">Encryption of data in transit and at rest</li>
            <li className="mb-2 text-text-dark">Secure authentication mechanisms</li>
            <li className="mb-2 text-text-dark">Regular security assessments</li>
            <li className="mb-2 text-text-dark">Access controls and authentication</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">5. Information Sharing and Disclosure</h2>
          <p className="leading-[1.8] text-text-dark mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform (e.g., Firebase, Netlify, payment processors)</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Legal Requirements:</strong> When required by law, court order, or government regulation</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Consent:</strong> With your explicit consent</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">6. Your Rights and Choices</h2>
          <p className="leading-[1.8] text-text-dark mb-4">You have the following rights regarding your personal information:</p>
          <ul className="ml-6 mb-4 leading-[1.8]">
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Access:</strong> Request access to your personal information</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Correction:</strong> Update or correct your personal information through your account settings</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Deletion:</strong> Request deletion of your account and personal information</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Data Portability:</strong> Request a copy of your data in a portable format</li>
            <li className="mb-2 text-text-dark"><strong className="text-text-dark font-semibold">Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
          </ul>
          <p className="leading-[1.8] text-text-dark mb-4">To exercise these rights, please contact us at the information provided below.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Our platform may use cookies and similar tracking technologies to enhance your experience. 
            You can control cookie preferences through your browser settings. Please note that disabling 
            cookies may affect the functionality of our platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">8. Children's Privacy</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Our services are not intended for individuals under the age of 18. We do not knowingly 
            collect personal information from children. If you believe we have collected information 
            from a child, please contact us immediately.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">9. International Data Transfers</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            Your information may be transferred to and processed in countries other than your country 
            of residence. These countries may have data protection laws that differ from those in your 
            country. By using our services, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">10. Retention of Information</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            We retain your personal information for as long as necessary to fulfill the purposes 
            outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">11. Changes to This Privacy Policy</h2>
          <p className="leading-[1.8] text-text-dark mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
            Your continued use of our services after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-3xl md:text-2xl font-bold text-text-dark mt-8 mb-4">12. Contact Us</h2>
          <p className="leading-[1.8] text-text-dark mb-4">If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
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

export default PrivacyPolicy

