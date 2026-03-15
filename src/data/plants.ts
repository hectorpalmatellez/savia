export interface PlantData {
    common_name: string;
    scientific_name?: string; // Optional
    location: string;         // e.g., "Living Room"
    placement?: string;       // e.g., "North Window"
    requirements: {
        light: string;
        water: string;
        humidity?: string;      // Optional
        soil?: string;          // Optional
    };
    care?: {
        last_watered?: string;  // ISO Date string
        last_fertilized?: string;
    };
    image?: string;
}

export const PLANT_DATA: Record<string, PlantData> = {
    "monstera-001": {
        common_name: "Monstera",
        scientific_name: "Monstera deliciosa",
        location: "Living Room",
        placement: "Near the balcony door",
        requirements: {
            light: "Bright Indirect",
            water: "Weekly",
            humidity: "60%+"
        },
        care: { last_watered: "2026-03-10" },
        image: "/images/monstera.jpg"
    },
    "snake-plant-01": {
        common_name: "Snake Plant",
        location: "Bedroom",
        requirements: { light: "Low", water: "Every 3 weeks" },
        // Notice scientific_name and care are missing here - the UI will handle it!
    }
};
