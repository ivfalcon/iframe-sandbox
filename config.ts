export const ACCOUNT_KEY = "29283C4A4CB5F5502758B24F99D1848A";
export const THN_SCRIPT_BASE =
  "https://www.thehotelsnetwork.com/js/hotel_price_widget.js";

export interface Property {
  propertyId: string;
  hotelId: string;
  label: string;
  bookingEngineFile: string;
  hasThnScript: boolean;
}

export const PROPERTIES: Record<string, Property> = {
  "1015553": {
    propertyId: "1015553",
    hotelId: "1091125",
    label: "Same Property",
    bookingEngineFile: "booking-engine.html",
    hasThnScript: true,
  },
  "1015538": {
    propertyId: "1015538",
    hotelId: "1091113",
    label: "Other Property",
    bookingEngineFile: "booking-engine-other.html",
    hasThnScript: true,
  },
  "9999999": {
    propertyId: "9999999",
    hotelId: "",
    label: "No THN Script",
    bookingEngineFile: "booking-engine-noscript.html",
    hasThnScript: false,
  },
};

export const TOP_FRAME_PROPERTY = PROPERTIES["1015553"];
