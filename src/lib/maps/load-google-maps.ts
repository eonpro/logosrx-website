/**
 * Lazily loads the Maps JavaScript API (Places library) once per page.
 * Safe to call from client components; no-ops when the key is missing.
 */

declare global {
  interface Window {
    __logosGoogleMapsPromise?: Promise<typeof google.maps>;
  }
}

export function googleMapsApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

async function ensurePlacesLibrary(): Promise<typeof google.maps> {
  if (!window.google?.maps) {
    throw new Error("Google Maps namespace missing after script load");
  }
  if (window.google.maps.importLibrary) {
    await window.google.maps.importLibrary("places");
  }
  if (!window.google.maps.places) {
    throw new Error("Google Places library unavailable");
  }
  return window.google.maps;
}

export function loadGoogleMaps(): Promise<typeof google.maps | null> {
  const key = googleMapsApiKey();
  if (!key || typeof window === "undefined") return Promise.resolve(null);

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__logosGoogleMapsPromise) {
    return window.__logosGoogleMapsPromise;
  }

  window.__logosGoogleMapsPromise = new Promise((resolve, reject) => {
    const finish = () => {
      ensurePlacesLibrary().then(resolve).catch(reject);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-logos-google-maps="1"]',
    );
    if (existing) {
      if (window.google?.maps) {
        finish();
        return;
      }
      existing.addEventListener("load", finish);
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.dataset.logosGoogleMaps = "1";
    script.onload = finish;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return window.__logosGoogleMapsPromise;
}
