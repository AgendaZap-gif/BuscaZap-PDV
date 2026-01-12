/**
 * Google Maps Integration - DISABLED
 * 
 * This module was previously using Manus Forge API as a proxy.
 * To re-enable, integrate with Google Maps API directly.
 * 
 * Original backup: map.ts.backup
 * 
 * Example integration:
 * 
 * 1. Get API key from Google Cloud Console
 * 2. Enable Maps JavaScript API, Places API, Geocoding API
 * 3. Use @googlemaps/google-maps-services-js package
 * 
 * import { Client } from "@googlemaps/google-maps-services-js";
 * 
 * const client = new Client({});
 * const response = await client.geocode({
 *   params: {
 *     address: "1600 Amphitheatre Parkway, Mountain View, CA",
 *     key: process.env.GOOGLE_MAPS_API_KEY!,
 *   },
 * });
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

export async function geocode(address: string): Promise<GeocodingResult> {
  throw new Error("Google Maps is disabled. Please integrate with Google Maps API directly.");
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  throw new Error("Google Maps is disabled. Please integrate with Google Maps API directly.");
}
