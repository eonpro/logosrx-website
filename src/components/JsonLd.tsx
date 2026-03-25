import { CONTACT, HOURS, SITE } from "@/lib/constants";

function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Pharmacy", "LocalBusiness"],
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    telephone: CONTACT.phone,
    email: CONTACT.email,
    faxNumber: CONTACT.fax,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address.street,
      addressLocality: CONTACT.address.city,
      addressRegion: CONTACT.address.state,
      postalCode: CONTACT.address.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
        description: "Retail",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "19:00",
        description: "Online",
      },
    ],
    areaServed: "United States",
    slogan: SITE.tagline,
    knowsAbout: [
      "503A Compounding Pharmacy",
      "Sterile Compounding",
      "Non-Sterile Compounding",
      "Personalized Medication",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "LegitScript Approved Pharmacy",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "NABP Accredited",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "Customer Service",
      availableLanguage: "English",
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
        description: `Chat Support: ${HOURS.chat}`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function JsonLd() {
  return <LocalBusinessSchema />;
}
