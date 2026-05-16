import { PlantData } from './plants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.API_KEY;

// Vercel Blob storage base URL for plant images
const BLOB_BASE_URL = 'https://bfvid4lplyqsxghx.public.blob.vercel-storage.com/plants/';

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Type for raw API response
interface ApiPlantRecord {
  _row: number;
  ID?: string;
  Name?: string;
  Type?: string;
  Category?: string | null;
  Latin?: string | null;
  Date?: string | null;
  Location?: string | null;
  Orientation?: string | null;
  Origin?: string | null;
  Status?: string | null;
  Photo?: string | null;
  Sensor?: string | null;
  Precio?: string | null;
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
function mapApiPlantToPlantData(apiPlant: ApiPlantRecord, index: number): PlantData {
  return {
    id: apiPlant.ID || index.toString(),
    row: apiPlant._row,
    common_name: apiPlant.Name || 'Unknown Plant',
    scientific_name: apiPlant.Latin || undefined,
    category: apiPlant.Category || undefined,
    type: apiPlant.Type || undefined,
    origin: apiPlant.Origin || undefined,
    price: apiPlant.Precio || undefined,
    location: (apiPlant.Location === 'Balcón' ||
    apiPlant.Location === 'Dormitorio' ||
    apiPlant.Location === 'Living'
      ? apiPlant.Location === 'Dormitorio'
        ? 'Dormitorio'
        : (apiPlant.Location as
            | 'Living Room'
            | 'Bedroom'
            | 'Kitchen'
            | 'Balcón')
      : 'Living Room') as
      | 'Living Room'
      | 'Bedroom'
      | 'Kitchen'
      | 'Dormitorio'
      | 'Balcón',
    placement: apiPlant.Orientation || undefined,
    status:
      (apiPlant.Status as 'Viva' | 'Débil' | 'Muerta' | null | undefined) ||
      undefined,
    purchase_date:
      apiPlant.Date && apiPlant.Date.trim()
        ? new Date(apiPlant.Date)
        : undefined,
    /**
     * The full path to an image is constructed by adding the BLOB_BASE_URL prefix
     * to the file name provided in the ApiPlantRecord.Photo property.
     * Example: https://bfvid4lplyqsxghx.public.blob.vercel-storage.com/plants/20260316_131049.jpg
     */
    image: apiPlant.Photo ? `${BLOB_BASE_URL}${apiPlant.Photo}` : undefined,
    sensor: apiPlant.Sensor === 'TRUE',
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

    return (data.data || []).map((apiPlant, index) => mapApiPlantToPlantData(apiPlant, index));
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

    // Find the plant by index in the response since ID is removed
    const index = parseInt(id, 10);
    const apiPlants = data.data || [];
    const apiPlant = !isNaN(index) && index >= 0 && index < apiPlants.length ? apiPlants[index] : undefined;
    return apiPlant ? mapApiPlantToPlantData(apiPlant, index) : null;
  } catch (error) {
    console.error(`Error fetching plant ${id} from API:`, error);
    throw error;
  }
}
