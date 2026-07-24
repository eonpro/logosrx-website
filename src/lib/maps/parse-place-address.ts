export type ParsedPlaceAddress = {
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  /** Unit/suite when Google returns a subpremise; often empty. */
  addressSuite?: string;
};

function component(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false,
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return short ? match.short_name : match.long_name;
}

/** Maps Google Places address_components into our clinic address fields. */
export function parsePlaceAddress(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): ParsedPlaceAddress | null {
  if (!components?.length) return null;

  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const addressLine1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  if (!addressLine1) return null;

  const addressCity =
    component(components, "locality") ||
    component(components, "sublocality_level_1") ||
    component(components, "sublocality") ||
    component(components, "neighborhood") ||
    component(components, "administrative_area_level_3");

  const addressState = component(
    components,
    "administrative_area_level_1",
    true,
  ).toUpperCase();

  const addressZip = component(components, "postal_code");
  const suite = component(components, "subpremise");

  return {
    addressLine1,
    addressCity,
    addressState,
    addressZip,
    ...(suite ? { addressSuite: suite } : {}),
  };
}
