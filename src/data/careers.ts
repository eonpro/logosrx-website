export interface Benefit {
  number: number;
  title: string;
  description: string;
}

export interface JobPosition {
  title: string;
  department: string;
  location: string;
  shift: string;
}

export const benefits: Benefit[] = [
  {
    number: 1,
    title: "Health, Vision & Dental",
    description:
      "Healthy employees are happy employees. Our team members receive comprehensive health, vision, and dental coverage.",
  },
  {
    number: 2,
    title: "Paid Time Off",
    description:
      "We offer generous paid time off so our employees can always feel recharged and refreshed.",
  },
  {
    number: 3,
    title: "Training & Certifications",
    description:
      "We offer training and certification programs to help our employees further their expertise in compounding pharmacy.",
  },
  {
    number: 4,
    title: "Growth Opportunity",
    description:
      "We want our employees to grow and flourish. That's why we never stop learning and developing new skills.",
  },
  {
    number: 5,
    title: "Free Medications",
    description:
      "The health of our team members is paramount. We offer free medication to our employees to keep them feeling their best.",
  },
  {
    number: 6,
    title: "Supportive Culture",
    description:
      "We foster a collaborative environment where every team member feels valued, supported, and empowered to do their best work.",
  },
];

export const openPositions: JobPosition[] = [
  {
    title: "Pharmacist",
    department: "Pharmacy",
    location: "Tampa, FL",
    shift: "First Shift",
  },
  {
    title: "Pharmacy Technician — Sterile Compounding",
    department: "Lab",
    location: "Tampa, FL",
    shift: "First Shift",
  },
  {
    title: "Pharmacy Technician — Fulfillment",
    department: "Pharmacy",
    location: "Tampa, FL",
    shift: "Second Shift",
  },
  {
    title: "Customer Service Representative",
    department: "Customer Service",
    location: "Tampa, FL",
    shift: "First Shift",
  },
  {
    title: "Quality Assurance Specialist",
    department: "Quality",
    location: "Tampa, FL",
    shift: "First Shift",
  },
];
