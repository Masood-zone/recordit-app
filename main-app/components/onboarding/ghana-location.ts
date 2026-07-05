export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const

export const GHANA_CITIES_BY_REGION: Record<string, string[]> = {
  Ahafo: ["Goaso", "Hwidiem", "Kenyasi", "Mim"],
  Ashanti: ["Kumasi", "Obuasi", "Ejisu", "Konongo", "Mampong"],
  Bono: ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi"],
  "Bono East": ["Techiman", "Atebubu", "Kintampo", "Nkoranza"],
  Central: ["Cape Coast", "Kasoa", "Winneba", "Mankessim", "Elmina"],
  Eastern: ["Koforidua", "Akim Oda", "Nkawkaw", "Suhum", "Somanya"],
  "Greater Accra": ["Accra", "Tema", "Madina", "Ashaiman", "Adenta"],
  "North East": ["Nalerigu", "Walewale", "Gambaga"],
  Northern: ["Tamale", "Yendi", "Savelugu", "Bimbilla"],
  Oti: ["Dambai", "Nkwanta", "Kete Krachi"],
  Savannah: ["Damongo", "Bole", "Salaga"],
  "Upper East": ["Bolgatanga", "Bawku", "Navrongo", "Zebilla"],
  "Upper West": ["Wa", "Lawra", "Tumu", "Jirapa"],
  Volta: ["Ho", "Hohoe", "Keta", "Sogakope"],
  Western: ["Sekondi-Takoradi", "Tarkwa", "Axim", "Prestea"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Enchi"],
}

export const OTHER_LOCATION_VALUE = "__OTHER__"
