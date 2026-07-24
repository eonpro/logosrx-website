"use client";

import { useEffect, useRef } from "react";
import { fieldClass } from "./primitives";
import { googleMapsApiKey, loadGoogleMaps } from "@/lib/maps/load-google-maps";
import {
  parsePlaceAddress,
  type ParsedPlaceAddress,
} from "@/lib/maps/parse-place-address";

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (parsed: ParsedPlaceAddress) => void;
  autoComplete?: string;
};

/**
 * Practice street-address input with Google Places Autocomplete when
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set. Falls back to a plain text field
 * otherwise so onboarding still works without the key.
 */
export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onPlaceSelect,
  autoComplete = "street-address",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!googleMapsApiKey()) return;
    const input = inputRef.current;
    if (!input) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps?.places || !inputRef.current) return;

        autocomplete = new maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const parsed = parsePlaceAddress(place?.address_components);
          if (!parsed) return;
          onChangeRef.current(parsed.addressLine1);
          onPlaceSelectRef.current(parsed);
        });
      })
      .catch(() => {
        // Autocomplete is progressive enhancement; plain typing still works.
      });

    return () => {
      cancelled = true;
      if (listener) listener.remove();
      // Detach pac-container bindings Google attaches to the input.
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        ref={inputRef}
        aria-label={label}
        className={fieldClass}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
