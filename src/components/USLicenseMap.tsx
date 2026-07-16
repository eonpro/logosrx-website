import {
  DC_CIRCLE,
  SEPARATOR_PATH,
  US_MAP_STATE_NAMES,
  US_MAP_VIEWBOX,
  US_STATE_PATHS,
} from "@/data/us-map-paths";
import { LICENSED_CODES, STATE_LICENSES } from "@/data/licenses";

const LICENSED_FILL = "var(--color-navy)";
const UNLICENSED_FILL = "#E2E1DD";

function licenseTitle(code: string): string {
  const license = STATE_LICENSES.find((l) => l.code === code);
  return license
    ? `${license.name} — License ${license.licenseNumber}`
    : `${US_MAP_STATE_NAMES[code] ?? code} — not licensed`;
}

/**
 * Static US choropleth: licensed jurisdictions in brand navy, the rest light
 * gray. Pure SVG (no client JS); native `<title>` tooltips surface the license
 * number on hover. DC's outline is invisible at map scale, so it also gets the
 * standard oversized circle marker.
 */
export default function USLicenseMap() {
  const dcLicensed = LICENSED_CODES.has("DC");

  return (
    <svg
      viewBox={US_MAP_VIEWBOX}
      role="img"
      aria-label={`Map of the United States highlighting the ${STATE_LICENSES.length} jurisdictions where Logos RX holds a pharmacy license`}
      className="h-auto w-full"
    >
      <g stroke="#FFFFFF" strokeWidth={1}>
        {Object.entries(US_STATE_PATHS).map(([code, d]) => (
          <path
            key={code}
            d={d}
            fill={LICENSED_CODES.has(code) ? LICENSED_FILL : UNLICENSED_FILL}
          >
            <title>{licenseTitle(code)}</title>
          </path>
        ))}
      </g>
      {/* Divider around the Alaska / Hawaii insets */}
      <path d={SEPARATOR_PATH} fill="none" stroke="#B0B0B0" strokeWidth={2} />
      {/* DC callout marker */}
      <circle
        cx={DC_CIRCLE.cx}
        cy={DC_CIRCLE.cy}
        r={DC_CIRCLE.r}
        fill={dcLicensed ? LICENSED_FILL : UNLICENSED_FILL}
        stroke="#FFFFFF"
        strokeWidth={1}
      >
        <title>{licenseTitle("DC")}</title>
      </circle>
    </svg>
  );
}
