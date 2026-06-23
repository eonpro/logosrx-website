import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 py-20 sm:py-28">
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-2">
        Website Privacy Policy
      </h1>
      <p className="text-navy/60 text-sm italic mb-8">
        Tradeline SH, Inc d/b/a Logos Pharmacy
      </p>

      <div className="prose prose-navy max-w-none space-y-6 text-navy/70 text-sm leading-relaxed">
        <p>
          <strong>Effective Date:</strong> 01/01/2026
          <br />
          <strong>Last Updated:</strong> 05/21/2026
        </p>

        <p>
          This Privacy Policy describes how Tradeline SH, Inc d/b/a Logos Pharmacy
          (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our,&rdquo; or the
          &ldquo;Pharmacy&rdquo;) collects, uses, and discloses information when you visit
          our website, place an order, or otherwise interact with us. Protected health
          information (&ldquo;PHI&rdquo;) handled in our capacity as a licensed pharmacy and
          HIPAA covered entity is governed by our separate Notice of Privacy Practices,
          which appears beginning on the second part of this document.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Section 1 &ndash; What Information We Collect
        </h2>
        <p>
          When you purchase a product or service from us, as part of the buying and selling
          process, we collect the personal information you provide, such as your name,
          shipping and billing address, email address, telephone number, date of birth, and
          payment information.
        </p>
        <p>
          As a licensed pharmacy, we may also collect health-related information necessary
          to dispense patient-specific compounded medications, including prescription
          information, allergies, and information received from your prescribing provider or
          telehealth partner. Health information you provide in connection with a
          prescription is treated as PHI and is governed by our Notice of Privacy Practices.
        </p>
        <p>
          When you browse our website, we automatically receive your computer&rsquo;s
          internet protocol (IP) address, which helps us learn about your browser and
          operating system.
        </p>
        <p>
          <strong>Email and SMS marketing (if applicable):</strong> With your permission, we
          may send you communications about the Pharmacy, new products, and other updates.
        </p>

        <h2 className="text-lg font-semibold text-navy">Section 2 &ndash; Consent</h2>
        <h3 className="text-base font-semibold text-navy">
          How do you obtain my consent?
        </h3>
        <p>
          When you provide us with personal information to complete a transaction, verify
          your payment method, place an order, arrange for delivery, or return a purchase,
          we imply that you consent to our collecting it and using it for that specific
          reason only.
        </p>
        <p>
          If we ask for your personal information for a secondary reason, such as marketing,
          we will either ask you directly for your express consent or provide you with an
          opportunity to decline.
        </p>
        <h3 className="text-base font-semibold text-navy">How do I withdraw my consent?</h3>
        <p>
          If, after you opt in, you change your mind, you may withdraw your consent for us
          to contact you, or for the continued collection, use, or disclosure of your
          information, at any time, by contacting us using the information at the end of this
          document. Withdrawal of consent for marketing does not affect collection or use of
          information necessary to fill your prescriptions or comply with applicable pharmacy
          law.
        </p>

        <h2 className="text-lg font-semibold text-navy">Section 3 &ndash; Disclosure</h2>
        <p>
          We may disclose your personal information if we are required to do so by law or if
          you violate our Terms of Service. Disclosures of protected health information are
          made only as permitted by our Notice of Privacy Practices and applicable law,
          including HIPAA and the Florida pharmacy regulations under which we are licensed.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Section 4 &ndash; Third-Party Services
        </h2>
        <p>
          In general, the third-party providers we use will only collect, use, and disclose
          your information to the extent necessary to allow them to perform the services
          they provide to us.
        </p>
        <p>
          Certain third-party service providers, such as payment gateways and other payment
          transaction processors, have their own privacy policies regarding the information
          we are required to provide to them for your purchase-related transactions. We
          recommend that you read their privacy policies to understand how your personal
          information will be handled.
        </p>
        <p>
          Certain providers may be located in, or have facilities located in, a jurisdiction
          different from yours or ours. If you elect to proceed with a transaction that
          involves a third-party service provider, your information may become subject to the
          laws of the jurisdiction(s) in which that provider or its facilities are located.
        </p>
        <p>
          Once you leave our website or are redirected to a third-party website or
          application, you are no longer governed by this Privacy Policy or our Terms of
          Service.
        </p>
        <h3 className="text-base font-semibold text-navy">Links</h3>
        <p>
          When you click links on our website, they may direct you away from our site. We
          are not responsible for the privacy practices of other sites and encourage you to
          read their privacy statements.
        </p>
        <h3 className="text-base font-semibold text-navy">Google Analytics</h3>
        <p>
          Our website uses Google Analytics to help us learn about who visits our site and
          what pages are viewed.
        </p>

        <h2 className="text-lg font-semibold text-navy">Section 5 &ndash; Security</h2>
        <p>
          To protect your personal information, we take reasonable precautions and follow
          industry best practices to ensure it is not inappropriately lost, misused,
          accessed, disclosed, altered, or destroyed.
        </p>
        <p>
          If you provide us with credit card information, it is encrypted using secure socket
          layer technology (SSL) and stored with AES-256 encryption. Although no method of
          transmission over the Internet or electronic storage is 100% secure, we follow all
          applicable PCI-DSS requirements and implement additional generally accepted
          industry standards. As a HIPAA covered entity, we also maintain administrative,
          physical, and technical safeguards designed to protect electronic protected health
          information.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Section 6 &ndash; Age of Consent
        </h2>
        <p>
          By using this site, you represent that you are at least the age of majority in your
          state or province of residence, or that you are the age of majority in your state
          or province of residence and have given us your consent to allow any of your minor
          dependents to use this site.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Section 7 &ndash; Changes to This Privacy Policy
        </h2>
        <p>
          We reserve the right to modify this Privacy Policy at any time, so please review it
          frequently. Changes and clarifications take effect immediately upon posting on the
          website. If we make material changes to this policy, we will notify you here so you
          are aware of what information we collect, how we use it, and under what
          circumstances we use or disclose it.
        </p>
        <p>
          If our Pharmacy is acquired or merged with another company, your information may be
          transferred to the new owners so that we may continue to provide products and
          services to you, subject to applicable law.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Section 8 &ndash; SMS / Text Messaging Disclosure
        </h2>
        <p>
          No mobile information will be shared with third parties or affiliates for marketing
          or promotional purposes. All other categories exclude text message originator
          opt-in data and consent; this information will not be shared with any third
          parties.
        </p>

        <h2 className="text-lg font-semibold text-navy">
          Questions and Contact Information
        </h2>
        <p>
          If you would like to access, correct, amend, or delete any personal information we
          have about you, register a complaint, or simply want more information, please
          contact our Privacy Compliance Officer:
        </p>
        <p className="not-prose">
          Tradeline SH, Inc d/b/a Logos Pharmacy
          <br />
          Attn: Privacy Compliance Officer
          <br />
          7543 W. Waters Ave &ndash; Tampa, FL 33615
          <br />
          <a href="tel:+18555646779" className="text-magenta hover:underline">
            855-564-6779
          </a>
          <br />
          <a href="mailto:legal@logosrx.com" className="text-magenta hover:underline">
            legal@logosrx.com
          </a>
        </p>

        <hr className="my-12 border-navy/10" />

        <h2 className="text-2xl font-bold text-navy">Notice of Privacy Practices</h2>
        <p className="text-navy/60 text-sm italic">
          Tradeline SH, Inc d/b/a Logos Pharmacy
        </p>
        <p className="font-semibold text-navy">
          THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED
          AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.
        </p>
        <p>
          <strong>Effective Date:</strong> 01/01/2026
        </p>

        <h3 className="text-base font-semibold text-navy">Your Rights</h3>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Get a copy of your paper or electronic medical record</li>
          <li>Correct your paper or electronic medical record</li>
          <li>Request confidential communications</li>
          <li>Ask us to limit the information we share</li>
          <li>Get a list of those with whom we&rsquo;ve shared your information</li>
          <li>Get a copy of this privacy notice</li>
          <li>Choose someone to act for you</li>
          <li>File a complaint if you believe your privacy rights have been violated</li>
        </ul>

        <h3 className="text-base font-semibold text-navy">Your Choices</h3>
        <p>You have some choices in the way that we use and share information when we:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Tell family and friends about your condition</li>
          <li>Provide disaster relief</li>
          <li>Market our services</li>
          <li>Raise funds</li>
        </ul>

        <h3 className="text-base font-semibold text-navy">Our Uses and Disclosures</h3>
        <p>We may use and share your information as we:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Treat you / dispense your medications</li>
          <li>Run our organization</li>
          <li>Bill for your services</li>
          <li>Help with public health and safety issues</li>
          <li>Comply with the law</li>
          <li>Respond to organ and tissue donation requests</li>
          <li>Work with a medical examiner or funeral director</li>
          <li>
            Address workers&rsquo; compensation, law enforcement, and other government
            requests
          </li>
          <li>Respond to lawsuits and legal actions</li>
        </ul>

        <h3 className="text-base font-semibold text-navy">Your Rights &ndash; Explained</h3>
        <h4 className="font-semibold text-navy">
          Get an electronic or paper copy of your medical record
        </h4>
        <p>
          You can ask to see or get an electronic or paper copy of your medical record and
          other health information we have about you. Ask us how to do this. We will provide
          a copy or a summary of your health information, usually within 30 days of your
          request. We may charge a reasonable, cost-based fee.
        </p>
        <h4 className="font-semibold text-navy">Ask us to correct your medical record</h4>
        <p>
          You can ask us to correct health information about you that you think is incorrect
          or incomplete. We may say &ldquo;no&rdquo; to your request, but we will tell you why
          in writing within 60 days.
        </p>
        <h4 className="font-semibold text-navy">Request confidential communications</h4>
        <p>
          You can ask us to contact you in a specific way (for example, home or office phone)
          or to send mail to a different address. We will say &ldquo;yes&rdquo; to all
          reasonable requests.
        </p>
        <h4 className="font-semibold text-navy">Ask us to limit what we use or share</h4>
        <p>
          You can ask us not to use or share certain health information for treatment,
          payment, or our operations. We are not required to agree, and we may say
          &ldquo;no&rdquo; if it would affect your care. If you pay for a service or health
          care item out-of-pocket in full, you can ask us not to share that information for
          the purpose of payment or our operations with your health insurer. We will say
          &ldquo;yes&rdquo; unless a law requires us to share that information.
        </p>
        <h4 className="font-semibold text-navy">
          Get a list of those with whom we&rsquo;ve shared information
        </h4>
        <p>
          You can ask for a list (accounting) of the times we&rsquo;ve shared your health
          information for the six years prior to the date you ask, who we shared it with, and
          why. We will provide one accounting a year for free but will charge a reasonable,
          cost-based fee if you ask for another within 12 months.
        </p>
        <h4 className="font-semibold text-navy">Get a copy of this privacy notice</h4>
        <p>
          You can ask for a paper copy of this notice at any time. We will provide you with a
          paper copy promptly.
        </p>
        <h4 className="font-semibold text-navy">Choose someone to act for you</h4>
        <p>
          If you have given someone medical power of attorney or if someone is your legal
          guardian, that person can exercise your rights and make choices about your health
          information. We will verify their authority before taking any action.
        </p>
        <h4 className="font-semibold text-navy">
          File a complaint if you feel your rights are violated
        </h4>
        <p>
          You can file a complaint with us or with the U.S. Department of Health and Human
          Services Office for Civil Rights:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Mail: 200 Independence Avenue, S.W., Washington, D.C. 20201</li>
          <li>
            Phone:{" "}
            <a href="tel:+18776966775" className="text-magenta hover:underline">
              1-877-696-6775
            </a>
          </li>
          <li>
            Online:{" "}
            <a
              href="https://www.hhs.gov/ocr/privacy/hipaa/complaints"
              className="text-magenta hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.hhs.gov/ocr/privacy/hipaa/complaints
            </a>
          </li>
        </ul>
        <p>We will not retaliate against you for filing a complaint.</p>

        <h3 className="text-base font-semibold text-navy">Your Choices &ndash; Explained</h3>
        <p>
          For certain health information, you can tell us your choices about what we share.
          If you have a clear preference for how we share your information in the situations
          described below, talk to us. Tell us what you want us to do, and we will follow
          your instructions.
        </p>
        <p>In these cases, you have both the right and choice to tell us to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Share information with family or others involved in your care</li>
          <li>Share information in a disaster relief situation</li>
        </ul>
        <p>
          If you are unable to communicate (for example, if you are unconscious), we may go
          ahead and share your information if we believe it is in your best interest or to
          prevent a serious and imminent threat.
        </p>
        <p>
          In these cases we never share your information unless you give us written
          permission:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Marketing purposes</li>
          <li>Sale of your information</li>
          <li>Most sharing of psychotherapy notes</li>
        </ul>

        <h3 className="text-base font-semibold text-navy">
          How We Typically Use or Share Your Health Information
        </h3>
        <h4 className="font-semibold text-navy">Treat you / dispense your medications</h4>
        <p>
          We can use your health information and share it with professionals who are treating
          you. Example: A prescriber sends us a prescription and relevant clinical
          information so we can compound and dispense a patient-specific medication.
        </p>
        <h4 className="font-semibold text-navy">Run our organization</h4>
        <p>
          We use your health information to run our pharmacy, improve your care, and contact
          you when necessary.
        </p>
        <h4 className="font-semibold text-navy">Bill for your services</h4>
        <p>
          We can use and share your information to bill and obtain payment from health plans
          or other entities. Example: We provide your insurer with the information necessary
          to pay for services, where applicable.
        </p>

        <h3 className="text-base font-semibold text-navy">
          Other Permitted Uses and Disclosures
        </h3>
        <p>We may also use or share your information for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Public health and safety, including preventing disease, product recalls,
            reporting adverse reactions, reporting abuse or domestic violence, and reducing
            threats to health or safety
          </li>
          <li>Research, where permitted</li>
          <li>Legal compliance</li>
          <li>Organ and tissue donation</li>
          <li>Medical examiner or funeral director</li>
          <li>Workers&rsquo; compensation and government functions</li>
          <li>Legal actions or subpoenas</li>
        </ul>

        <h3 className="text-base font-semibold text-navy">Our Responsibilities</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            We are required by law to maintain the privacy and security of your protected
            health information.
          </li>
          <li>
            We will let you know promptly if a breach occurs that may have compromised the
            privacy or security of your information.
          </li>
          <li>
            We must follow the duties and privacy practices described in this notice and give
            you a copy of it.
          </li>
          <li>
            We will not use or share your information other than as described here unless you
            tell us we can in writing. If you tell us we can, you may change your mind at any
            time by letting us know in writing.
          </li>
        </ul>
        <p>
          For more information, see:{" "}
          <a
            href="https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html"
            className="text-magenta hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html
          </a>
        </p>

        <h3 className="text-base font-semibold text-navy">Changes to This Notice</h3>
        <p>
          We can change the terms of this notice, and the changes will apply to all
          information we have about you. The new notice will be available upon request, in
          our office, and on our website.
        </p>

        <h3 className="text-base font-semibold text-navy">Contact for Privacy Matters</h3>
        <p>
          If you have questions about this Notice of Privacy Practices, or to exercise any of
          the rights described above, contact our Privacy Compliance Officer (HIPAA Privacy
          Officer):
        </p>
        <p className="not-prose">
          Tradeline SH, Inc d/b/a Logos Pharmacy
          <br />
          Attn: Privacy Officer
          <br />
          7543 W. Waters Ave &ndash; Tampa, FL 33615
          <br />
          <a href="tel:+18555646779" className="text-magenta hover:underline">
            855-564-6779
          </a>
          <br />
          <a href="mailto:legal@logosrx.com" className="text-magenta hover:underline">
            legal@logosrx.com
          </a>
        </p>
      </div>
    </div>
  );
}
