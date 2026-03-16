import { PlantData } from './plants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.API_KEY;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Type for raw API response
interface ApiPlantRecord {
  _row: number;
  ID: string;
  Name?: string;
  Type?: string;
  Latin?: string | null;
  Date?: string | null;
  Location?: string | null;
  Orientation?: string | null;
  Origin?: string | null;
}

interface ApiResponse {
  success: boolean;
  data: ApiPlantRecord[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    format: string;
  };
}

/**
 * Maps API response format to PlantData format
 */
function mapApiPlantToPlantData(apiPlant: ApiPlantRecord): PlantData {
  return {
    id: apiPlant.ID,
    common_name: apiPlant.Name || 'Unknown Plant',
    scientific_name: apiPlant.Latin || undefined,
    location: (apiPlant.Location || 'Living Room') as
      | 'Living Room'
      | 'Bedroom'
      | 'Kitchen',
    placement: apiPlant.Orientation || undefined,
    requirements: {
      light: apiPlant.Type === 'Interior' ? 'Indirect' : 'Bright',
      water: 'Weekly',
      humidity: undefined,
      soil: undefined,
    },
    care:
      apiPlant.Date && apiPlant.Date.trim()
        ? { last_watered: new Date(apiPlant.Date) }
        : undefined,
    image: undefined,
  };
}

/**
 * Fetches all plants from the API
 */
export async function fetchPlants(): Promise<PlantData[]> {
  try {
    const response = await fetch(`${API_URL}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    return (data.data || []).map(apiPlant => mapApiPlantToPlantData(apiPlant));
  } catch (error) {
    console.error('Error fetching plants from API:', error);
    throw error;
  }
}

/**
 * Fetches a single plant by ID from the API
 * Since the API returns all plants, we fetch all and find by ID
 */
export async function fetchPlantById(id: string): Promise<PlantData | null> {
  try {
    const response = await fetch(`${API_URL}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    // Find the plant by ID in the response
    const apiPlant = (data.data || []).find(plant => plant.ID === id);
    return apiPlant ? mapApiPlantToPlantData(apiPlant) : null;
  } catch (error) {
    console.error(`Error fetching plant ${id} from API:`, error);
    throw error;
  }
}
