/**
 * Marketing Services Agreement (MSA) content — the document partners execute
 * before they can use the partner portal.
 *
 * This module is intentionally free of server-only imports so it can be shared
 * by the client signing UI, the server sign action (hashing + snapshot), the
 * read-only executed view, the admin view, and the print view.
 *
 * The body below is the full, legal-approved Marketing Services Agreement. The
 * signer supplies the blanks (entity name, state of organization, principal
 * place of business); the effective date defaults to the signing date. When the
 * text changes, BUMP `MSA_VERSION` so the change is captured as a new,
 * separately-signed version (already-signed partners keep their prior executed
 * snapshot in `partner_agreements`).
 */

/** Bump on any change to the rendered text. Drives re-signing + dedupe. */
export const MSA_VERSION = "2025-1.0";
export const MSA_TITLE = "Marketing Services Agreement";

/** The pharmacy party (fixed). From the executed template. */
export const MSA_PHARMACY_PARTY =
  "Tradeline SH Inc d/b/a Logos Pharmacy, a Florida corporation and licensed 503A pharmacy with its principal place of business at 7543 W. Waters Ave, Tampa, FL 33615 (\u201CLogos\u201D or the \u201CPharmacy\u201D)";

/** Values the signer supplies (the blanks on the template). */
export interface MsaFieldValues {
  /** Effective date (defaults to the signing date). */
  effectiveDate: string;
  /** Marketing Company legal entity name. */
  legalEntityName: string;
  /** Marketing Company principal place of business. */
  entityAddress?: string;
  /** State in which the Marketing Company is organized (an LLC, per template). */
  entityState?: string;
}

export interface MsaSection {
  /** Optional heading (numbered section title). */
  heading?: string;
  /** Body paragraphs. */
  paragraphs: string[];
}

const BLANK = "________________";

function orFill(value: string | undefined, placeholder = BLANK): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : placeholder;
}

/**
 * Returns the agreement as structured sections with the signer's values
 * interpolated. Used both for on-screen rendering and (joined to plain text)
 * for hashing + the immutable snapshot.
 */
export function msaSections(values: MsaFieldValues): MsaSection[] {
  const company = orFill(values.legalEntityName);
  const address = orFill(values.entityAddress);
  const state = orFill(values.entityState);
  const effective = orFill(values.effectiveDate);

  return [
    {
      paragraphs: [
        `This Marketing Services Agreement (this \u201CAgreement\u201D) is entered into and made effective as of ${effective} (the \u201CEffective Date\u201D), by and between:`,
        `${MSA_PHARMACY_PARTY}; and`,
        `${company}, a ${state} limited liability company with its principal place of business at ${address} (\u201CMarketing Company\u201D or \u201CContractor\u201D).`,
        "Logos and the Marketing Company are each referred to as a \u201CParty\u201D and collectively as the \u201CParties.\u201D",
      ],
    },
    {
      heading: "Recitals",
      paragraphs: [
        "WHEREAS, Logos operates a state-licensed compounding pharmacy and desires to engage the Marketing Company to provide certain general advertising, brand development, and marketing support services described herein;",
        "WHEREAS, the Marketing Company represents that it has the experience and capability to provide such services and desires to provide them to Logos on the terms set forth below; and",
        "WHEREAS, the Parties intend that all compensation under this Agreement be a fixed, fair-market-value fee for bona fide marketing services that does not vary with, and is not determined by, the volume or value of any business, prescriptions, orders, or referrals generated, and that this Agreement comply with all applicable federal and state healthcare laws;",
        "NOW, THEREFORE, in consideration of the mutual covenants and promises set forth herein, and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:",
      ],
    },
    {
      heading: "1. Engagement and Scope of Services",
      paragraphs: [
        "1.1 Engagement. Logos hereby engages the Marketing Company, and the Marketing Company accepts such engagement, to provide the marketing services described in Section 1.2 (the \u201CServices\u201D), on a non-exclusive basis, subject to the terms and conditions of this Agreement.",
        "1.2 Description of Services. The Services shall consist of general, non-clinical marketing and brand-support services as mutually agreed by the Parties in writing from time to time, which may include brand development, creative and content development, advertising design, general audience digital and social media marketing, website and infrastructure support, and similar promotional services. Specific deliverables, timelines, and the corresponding fees shall be set forth in one or more written statements of work or service schedules executed by both Parties and incorporated herein by reference (each, a \u201CService Schedule\u201D).",
        "1.3 Standard of Performance. The Marketing Company shall perform all Services in a professional and workmanlike manner, consistent with generally accepted industry standards, and in compliance with all applicable laws, regulations, and Logos\u2019s reasonable written policies provided to the Marketing Company.",
        "1.4 Advertising Compliance. All advertising, marketing, and promotional materials created or disseminated by the Marketing Company that reference Logos, its services, or its products shall be truthful, non-misleading, and compliant with applicable federal and state laws and regulations, including those governing the advertising of pharmacy and healthcare services. The Marketing Company shall not make any claims regarding Logos\u2019s products or services without Logos\u2019s prior written approval. Logos shall have the right to review and approve, in advance, all materials that reference Logos prior to publication or distribution.",
        "1.5 No Targeting of Federal Healthcare Program Business. The Services shall be limited to the promotion of cash-pay and commercially-insured offerings only. The Marketing Company shall not direct, market, or solicit business in a manner intended to generate, and the compensation payable hereunder is not intended to induce, any business reimbursable in whole or in part by any federal or state healthcare program, including Medicare, Medicaid, TRICARE, or any other government payor.",
      ],
    },
    {
      heading: "2. Compensation",
      paragraphs: [
        "2.1 Fixed Fee. In consideration for the Services, Logos shall pay the Marketing Company a fixed fee in the amount and on the schedule set forth in the applicable Service Schedule (the \u201CFee\u201D). The Fee shall be a fixed, flat amount (whether stated as a one-time, monthly, or per-deliverable amount) that is set in advance and consistent with fair market value for the Services actually rendered.",
        "2.2 Fair Market Value; No Volume- or Value-Based Compensation. The Parties expressly acknowledge and agree that the Fee:",
        "(a) has been determined through arm\u2019s-length negotiation and represents fair market value for the Services;",
        "(b) is fixed in advance and does not, in whole or in part, take into account, vary with, or otherwise reflect the volume or value of any business, referrals, prescriptions, orders, patients, or other items or services generated between the Parties or for which payment may be made by any payor; and",
        "(c) is not contingent upon, and shall not be calculated as a percentage of, any revenue, sales, profits, enterprise value, sale proceeds, or other financial performance of Logos.",
        "2.3 Invoicing and Payment. The Marketing Company shall invoice Logos for the Fee in accordance with the applicable Service Schedule. Logos shall pay each undisputed, properly submitted invoice within thirty (30) days of receipt. The Marketing Company shall be responsible for all of its own costs and expenses incurred in performing the Services unless otherwise expressly agreed in writing.",
        "2.4 No Equity, Profit-Sharing, or Transaction Interest. The Marketing Company shall have no right to, and this Agreement shall not be construed to grant, any equity interest, ownership interest, profit-sharing right, success fee, transaction fee, carried interest, or any claim to the proceeds of any sale, merger, acquisition, financing, or other transaction involving Logos or any of its assets. The Marketing Company\u2019s sole compensation under this Agreement is the Fee set forth in Section 2.1.",
      ],
    },
    {
      heading: "3. Regulatory Compliance",
      paragraphs: [
        "3.1 Compliance with Law. Each Party shall comply with all federal, state, and local laws, regulations, and rules applicable to its performance under this Agreement, including, without limitation, the federal Anti-Kickback Statute (42 U.S.C. \u00A7 1320a-7b(b)), the Eliminating Kickbacks in Recovery Act (18 U.S.C. \u00A7 220), the federal physician self-referral law (\u201CStark Law,\u201D 42 U.S.C. \u00A7 1395nn), the Florida Patient Brokering Act (Fla. Stat. \u00A7 817.505), and applicable guidance issued by the Office of Inspector General (OIG) and the Centers for Medicare & Medicaid Services (CMS).",
        "3.2 No Inducement for Referrals. Nothing in this Agreement shall be construed to require, and the Fee is not intended as remuneration for, the referral of patients or business, the recommendation or arranging for the purchase of any item or service, or any other activity that would violate any applicable healthcare law. The Marketing Company is not engaged to, and shall not, make patient-specific recommendations, influence prescriber decisions, or steer patients to Logos.",
        "3.3 Independent Compliance Obligations. Logos retains sole and independent responsibility for all clinical, licensure, dispensing, and regulatory obligations of the Pharmacy. The Marketing Company shall have no authority over, and no responsibility for, any clinical operation, licensure obligation, or patient treatment decision.",
        "3.4 HIPAA. The Services are not expected to involve the use or disclosure of protected health information (\u201CPHI\u201D) as defined under the Health Insurance Portability and Accountability Act of 1996 (\u201CHIPAA\u201D). The Marketing Company shall not access, use, or disclose any PHI in connection with the Services. In the event the Services would require the Marketing Company to create, receive, maintain, or transmit PHI on behalf of Logos, the Parties shall first enter into a separate, written Business Associate Agreement in compliance with HIPAA before any such activity occurs.",
        "3.5 Reformation for Compliance. If any governmental authority or change in law renders any provision of this Agreement non-compliant with applicable healthcare laws, the Parties shall negotiate in good faith to amend the affected provision to the minimum extent necessary to achieve compliance while preserving the economic and business intent of the Parties. If the Parties cannot agree on a compliant amendment within thirty (30) days, either Party may terminate this Agreement upon written notice without penalty.",
      ],
    },
    {
      heading: "4. Term and Termination",
      paragraphs: [
        "4.1 Term. This Agreement shall commence on the Effective Date and continue for an initial term of one (1) year, unless earlier terminated as provided herein. Thereafter, this Agreement shall automatically renew for successive one (1) year terms unless either Party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.",
        "4.2 Termination for Convenience. Either Party may terminate this Agreement, with or without cause, upon thirty (30) days\u2019 prior written notice to the other Party.",
        "4.3 Termination for Cause. Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice of the breach. Logos may terminate immediately upon written notice if it reasonably determines that continued performance would violate any applicable law or regulation.",
        "4.4 Effect of Termination. Upon termination, the Marketing Company shall promptly cease all Services, return or destroy Logos\u2019s Confidential Information as directed, and deliver any work product for which payment has been made. Logos shall pay the Marketing Company for Services properly rendered and undisputed amounts accrued through the effective date of termination. No further amounts shall be owed.",
      ],
    },
    {
      heading: "5. Independent Contractor; No Partnership",
      paragraphs: [
        "The Marketing Company is an independent contractor. Nothing in this Agreement shall be construed to create a partnership, joint venture, agency, employment, fiduciary, or shared-ownership relationship between the Parties. Neither Party shall have authority to bind the other, and each Party shall be solely responsible for its own personnel, taxes, and obligations. This Agreement is, and shall be interpreted and administered solely as, a commercially reasonable, fee-for-service marketing arrangement under applicable healthcare laws.",
      ],
    },
    {
      heading: "6. Ownership of Work Product",
      paragraphs: [
        "All deliverables, materials, content, and work product created by the Marketing Company specifically for Logos under this Agreement and paid for by Logos (the \u201CWork Product\u201D) shall be the exclusive property of Logos upon payment. The Marketing Company hereby assigns to Logos all right, title, and interest in and to such Work Product. The Marketing Company retains ownership of its pre-existing tools, templates, and general know-how, and grants Logos a perpetual, non-exclusive license to use the same to the extent embedded in the Work Product.",
      ],
    },
    {
      heading: "7. Confidentiality",
      paragraphs: [
        "Each Party acknowledges that it may gain access to certain non-public, confidential, or proprietary information of the other Party, including business plans, trade secrets, vendor contracts, pricing strategies, marketing data, and technology systems (\u201CConfidential Information\u201D). Each Party agrees to:",
        "(a) maintain all Confidential Information in strict confidence;",
        "(b) use such information solely to perform its obligations under this Agreement; and",
        "(c) not disclose such information to any third party without the prior written consent of the disclosing Party.",
        "This obligation shall survive termination of this Agreement for a period of five (5) years and shall not apply to information that: (a) was publicly available at the time of disclosure; (b) becomes publicly available through no fault of the receiving Party; (c) was independently developed without use of the Confidential Information; or (d) is required to be disclosed by law, provided the receiving Party gives the disclosing Party reasonable notice and an opportunity to seek a protective order.",
      ],
    },
    {
      heading: "8. Representations and Warranties",
      paragraphs: [
        "Each Party represents and warrants that: (a) it has full legal power and authority to enter into and perform this Agreement; (b) the individual executing this Agreement on its behalf is duly authorized to do so; (c) this Agreement constitutes a legal, valid, and binding obligation enforceable against it in accordance with its terms; and (d) its performance under this Agreement does not and will not violate any law or any agreement to which it is a party. The Marketing Company further represents that neither it nor any of its personnel is currently excluded, debarred, or otherwise ineligible to participate in any federal or state healthcare program.",
      ],
    },
    {
      heading: "9. Indemnification",
      paragraphs: [
        "Each Party (the \u201CIndemnifying Party\u201D) shall indemnify, defend, and hold harmless the other Party (the \u201CIndemnified Party\u201D), and its officers, directors, employees, agents, and affiliates, from and against any and all third-party claims, demands, damages, liabilities, losses, costs, and expenses (including reasonable attorneys\u2019 fees) arising out of or resulting from:",
        "(a) any breach of this Agreement by the Indemnifying Party;",
        "(b) any gross negligence, willful misconduct, or unlawful act by the Indemnifying Party or its personnel; or",
        "(c) any failure by the Indemnifying Party to comply with applicable federal, state, or local laws and regulations in connection with its obligations under this Agreement.",
        "This indemnification obligation shall survive termination of this Agreement.",
      ],
    },
    {
      heading: "10. Limitation of Liability",
      paragraphs: [
        "Except for breaches of confidentiality, indemnification obligations, or a Party\u2019s gross negligence or willful misconduct, neither Party shall be liable to the other for any indirect, incidental, consequential, special, or punitive damages, and each Party\u2019s aggregate liability arising out of or relating to this Agreement shall not exceed the total Fees paid or payable under this Agreement during the twelve (12) months preceding the event giving rise to the claim.",
      ],
    },
    {
      heading: "11. Dispute Resolution",
      paragraphs: [
        "In the event of any dispute, controversy, or claim arising out of or relating to this Agreement, the Parties shall first attempt in good faith to resolve the dispute through non-binding mediation conducted in the State of Florida under the rules of the American Arbitration Association (\u201CAAA\u201D). If the dispute is not resolved within thirty (30) days after the commencement of mediation, the dispute shall be submitted to binding arbitration under the AAA\u2019s Commercial Arbitration Rules, conducted in Hillsborough County, Florida, before a single arbitrator. The arbitrator\u2019s decision shall be final and binding and enforceable in any court of competent jurisdiction. Each Party shall bear its own legal fees and costs unless the arbitrator determines otherwise in the final award.",
      ],
    },
    {
      heading: "12. Miscellaneous",
      paragraphs: [
        "12.1 Governing Law. This Agreement and all matters arising out of or relating to it shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict-of-law rules.",
        "12.2 Entire Agreement. This Agreement, together with any Service Schedules, constitutes the entire understanding between the Parties with respect to its subject matter and supersedes all prior agreements, understandings, or representations, whether oral or written. No amendment, modification, or waiver shall be valid unless in writing and signed by both Parties.",
        "12.3 Assignment. The Marketing Company shall not assign or transfer this Agreement, in whole or in part, without the prior written consent of Logos. Logos may assign this Agreement to an affiliate or successor in connection with a reorganization, merger, or sale of substantially all of its assets.",
        "12.4 Notices. All notices under this Agreement shall be in writing and delivered to the addresses set forth above (or such other address as a Party may designate in writing) by personal delivery, nationally recognized overnight courier, or certified mail, return receipt requested.",
        "12.5 Severability. If any provision of this Agreement is held invalid or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, or if it cannot be so modified, severed, and the remaining provisions shall continue in full force and effect.",
        "12.6 Prevailing Party. In the event either Party initiates legal action or arbitration to enforce this Agreement, the prevailing Party shall be entitled to recover its reasonable attorneys\u2019 fees and costs.",
        "12.7 Survival. The provisions of Sections 2.4, 3, 5, 6, 7, 9, 10, 11, and 12, and any other provision that by its nature should survive, shall survive termination or expiration of this Agreement.",
        "12.8 Counterparts. This Agreement may be executed in counterparts, including by electronic signature, each of which shall be deemed an original and all of which together shall constitute one instrument.",
      ],
    },
    {
      heading: "Execution",
      paragraphs: [
        "IN WITNESS WHEREOF, the Parties have executed this Marketing Services Agreement as of the Effective Date.",
        `LOGOS (PHARMACY): Tradeline SH Inc d/b/a Logos Pharmacy. By: __________________  Name: __________________  Title: __________________  Date: __________________`,
        `MARKETING COMPANY: ${company}. By: __________________  Name: __________________  Title: __________________  Date: __________________`,
        "The Marketing Company's authorized signatory executes this Agreement electronically below; the signer's name, title, signature, date, and IP address are recorded with this document.",
      ],
    },
  ];
}

/**
 * Renders the agreement to a stable plain-text string for hashing and for the
 * immutable snapshot stored at signing. Stable across runs for identical
 * inputs (no timestamps), so the hash is reproducible.
 */
export function renderMsaText(values: MsaFieldValues): string {
  const lines: string[] = [`${MSA_TITLE} (v${MSA_VERSION})`, ""];
  for (const section of msaSections(values)) {
    if (section.heading) {
      lines.push(section.heading);
    }
    for (const p of section.paragraphs) {
      lines.push(p);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
