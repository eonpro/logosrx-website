/**
 * Wire types for the LifeFile order API (v1.241015.0). Field names and
 * constraints mirror LifeFile's API reference exactly — see the payload
 * builder for how internal data is normalized into this shape.
 */

export interface LifeFilePrescriber {
  npi: string;
  lastName: string;
  firstName?: string;
  licenseState?: string;
  licenseNumber?: string;
  dea?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  fax?: string;
  email?: string;
}

export interface LifeFilePatient {
  lastName: string;
  firstName: string;
  middleName?: string;
  /** m | f | a (animal) | u (unknown) */
  gender: string;
  /** yyyy-mm-dd */
  dateOfBirth: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phoneHome?: string;
  phoneMobile?: string;
  phoneWork?: string;
  email?: string;
}

export interface LifeFileShipping {
  recipientType: "clinic" | "patient";
  recipientLastName?: string;
  recipientFirstName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  /** Account-specific LifeFile shipping-service code. */
  service?: number;
}

export interface LifeFileRx {
  rxType?: "new" | "refill";
  drugName: string;
  drugStrength?: string;
  drugForm?: string;
  lfProductID?: number;
  foreignRxNumber?: string;
  quantity?: string;
  quantityUnits?: string;
  directions?: string;
  refills?: number;
  /** yyyy-mm-dd */
  dateWritten?: string;
  daysSupply?: number;
  scheduleCode?: string;
  clinicalDifferenceStatement?: string;
}

export interface LifeFileOrderPayload {
  message: {
    /** Unique message id in our system (we use the order row id). */
    id: number;
    sentTime: string;
  };
  order: {
    general?: {
      memo?: string;
      referenceId?: string;
    };
    /**
     * Human-readable prescription PDF (base64). LifeFile requires it for
     * controlled substances; we attach it to every order so the pharmacy
     * always has a printable script.
     */
    document?: { pdfBase64: string };
    prescriber: LifeFilePrescriber;
    practice?: { id: number };
    patient: LifeFilePatient;
    shipping: LifeFileShipping;
    billing?: { payorType: "pat" | "doc" };
    rxs: LifeFileRx[];
  };
}

/** LifeFile's uniform response envelope: branch on `type`, not HTTP status. */
export interface LifeFileResponseBody {
  type: "success" | "error";
  message?: string;
  data?: unknown;
}

export type LifeFileSubmitResult =
  | {
      ok: true;
      /** LifeFile's order id, extracted from the response `data`. */
      lfOrderId: string;
      raw: unknown;
    }
  | {
      ok: false;
      /**
       * - `rejected`  — LifeFile answered with `type: "error"` (business
       *   rejection; do not retry blindly).
       * - `transport` — network/timeout/unparseable response (retryable).
       * - `config`    — client not configured (missing env); nothing was sent.
       */
      kind: "rejected" | "transport" | "config";
      /** Short human-readable reason, safe to store and show to support. */
      message: string;
      raw?: unknown;
      httpStatus?: number;
    };

export interface LifeFileClient {
  submitOrder(payload: LifeFileOrderPayload): Promise<LifeFileSubmitResult>;
}
