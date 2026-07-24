/**
 * Pure builder: LogosRx order data -> LifeFile `POST /order` payload.
 *
 * Everything here is deterministic and side-effect free (unit tested in
 * `payload.test.ts`). Inputs are assumed to have passed the order service's
 * Zod validation; this layer handles wire formatting only — field caps from
 * the LifeFile spec, phone normalization, omission of empty optionals, and
 * practice stamping.
 */

import { capped, normalizePhone, stateCode } from "./normalize";
import type {
  LifeFileOrderPayload,
  LifeFilePatient,
  LifeFilePrescriber,
  LifeFileRx,
  LifeFileShipping,
} from "./types";

export interface BuildPrescriberInput {
  npi: string;
  firstName: string;
  lastName: string;
  licenseState?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface BuildPatientInput {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: string;
  dateOfBirth: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phoneHome?: string | null;
  phoneMobile?: string | null;
  phoneWork?: string | null;
  email?: string | null;
}

export interface BuildShippingInput {
  recipientType: "clinic" | "patient";
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  serviceId?: number | null;
}

export interface BuildRxInput {
  lfProductId: number;
  drugName: string;
  drugStrength?: string | null;
  drugForm?: string | null;
  directions: string;
  quantity?: string | null;
  quantityUnits?: string | null;
  daysSupply?: number | null;
  refills?: number | null;
  dateWritten: string;
  scheduleCode?: string | null;
  clinicalDifferenceStatement?: string | null;
  foreignRxNumber?: string | null;
}

export interface BuildOrderInput {
  /** Unique integer message id in our system (the order row id). */
  messageId: number;
  /** Our foreign-system order id (LGS-...), echoed on LifeFile's side. */
  referenceId: string;
  memo?: string | null;
  /**
   * LifeFile practice id. The order service currently always passes null —
   * portal practice IDs often fail LifeFile's API-network check. Kept on the
   * builder for tests and a future opt-in once IDs are confirmed on network 1949.
   */
  practiceId?: number | null;
  payorType: "doc" | "pat";
  prescriber: BuildPrescriberInput;
  patient: BuildPatientInput;
  shipping: BuildShippingInput;
  rxs: BuildRxInput[];
  /** Injectable clock for deterministic tests. */
  now?: Date;
}

function buildPrescriber(input: BuildPrescriberInput): LifeFilePrescriber {
  return {
    npi: input.npi.trim(),
    lastName: capped(input.lastName, 30) ?? "",
    firstName: capped(input.firstName, 30),
    licenseState: stateCode(input.licenseState),
    licenseNumber: capped(input.licenseNumber, 50),
    phone: normalizePhone(input.phone) ?? undefined,
    email: capped(input.email, 100),
  };
}

function buildPatient(input: BuildPatientInput): LifeFilePatient {
  return {
    lastName: capped(input.lastName, 30) ?? "",
    firstName: capped(input.firstName, 30) ?? "",
    middleName: capped(input.middleName, 20),
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    address1: capped(input.address1, 60),
    address2: capped(input.address2, 60),
    city: capped(input.city, 100),
    state: stateCode(input.state),
    zip: capped(input.zip, 10),
    phoneHome: normalizePhone(input.phoneHome) ?? undefined,
    phoneMobile: normalizePhone(input.phoneMobile) ?? undefined,
    phoneWork: normalizePhone(input.phoneWork) ?? undefined,
    email: capped(input.email, 100),
  };
}

function buildShipping(input: BuildShippingInput): LifeFileShipping {
  return {
    recipientType: input.recipientType,
    recipientFirstName: capped(input.recipientFirstName, 30),
    recipientLastName: capped(input.recipientLastName, 30),
    recipientPhone: normalizePhone(input.recipientPhone) ?? undefined,
    recipientEmail: capped(input.recipientEmail, 100),
    addressLine1: capped(input.addressLine1, 60),
    addressLine2: capped(input.addressLine2, 60),
    city: capped(input.city, 100),
    state: stateCode(input.state),
    zipCode: capped(input.zipCode, 10),
    service: input.serviceId ?? undefined,
  };
}

function buildRx(input: BuildRxInput): LifeFileRx {
  return {
    rxType: "new",
    drugName: capped(input.drugName, 254) ?? "",
    drugStrength: capped(input.drugStrength, 254),
    drugForm: capped(input.drugForm, 255),
    lfProductID: input.lfProductId,
    foreignRxNumber: capped(input.foreignRxNumber, 50),
    quantity: capped(input.quantity, 45),
    quantityUnits: capped(input.quantityUnits, 45),
    directions: input.directions.trim(),
    refills: input.refills ?? 0,
    dateWritten: input.dateWritten,
    daysSupply: input.daysSupply ?? undefined,
    scheduleCode: capped(input.scheduleCode, 1),
    clinicalDifferenceStatement: capped(
      input.clinicalDifferenceStatement,
      65_535,
    ),
  };
}

/** Strip `undefined` values so optionals are omitted from the JSON body. */
function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Copy of the payload safe for DB persistence: the prescription PDF is
 * replaced with a short marker so `orders.raw_request` stays small (the PDF
 * is ~50-200 KB of base64 and can always be re-rendered from the order data).
 */
export function redactPayloadForStorage(
  payload: LifeFileOrderPayload,
): LifeFileOrderPayload {
  if (!payload.order.document) return payload;
  return {
    ...payload,
    order: {
      ...payload.order,
      document: {
        pdfBase64: `<omitted: ${payload.order.document.pdfBase64.length} base64 chars>`,
      },
    },
  };
}

export function buildLifeFileOrderPayload(
  input: BuildOrderInput,
): LifeFileOrderPayload {
  const sentTime = (input.now ?? new Date()).toISOString();

  const payload: LifeFileOrderPayload = {
    message: {
      id: input.messageId,
      sentTime,
    },
    order: {
      general: {
        memo: capped(input.memo, 120),
        referenceId: capped(input.referenceId, 200),
      },
      prescriber: buildPrescriber(input.prescriber),
      ...(input.practiceId != null
        ? { practice: { id: input.practiceId } }
        : {}),
      patient: buildPatient(input.patient),
      shipping: buildShipping(input.shipping),
      billing: { payorType: input.payorType },
      rxs: input.rxs.map(buildRx),
    },
  };

  return compact(payload);
}
