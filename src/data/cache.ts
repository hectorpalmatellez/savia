import { PlantData } from './plants';

const PLANTS_CACHE_KEY = 'savia_plants_cache';

/**
 * Stores fetched plants in localStorage for client-side access
 */
export function setCachedPlants(plants: PlantData[]): void {
  try {
    localStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants));
  } catch (error) {
    console.warn('Failed to cache plants in localStorage:', error);
  }
}

/**
 * Retrieves cached plants from localStorage
 */
export function getCachedPlants(): PlantData[] | null {
  try {
    const cached = localStorage.getItem(PLANTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to retrieve cached plants:', error);
    return null;
  }
}

/**
 * Clears the plants cache
 */
export function clearCachedPlants(): void {
  try {
    localStorage.removeItem(PLANTS_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear plants cache:', error);
  }
}

/**
 * Gets a plant by ID from cache, or null if not found
 */
export function getCachedPlantById(id: string): PlantData | null {
  const plants = getCachedPlants();
  if (!plants) return null;
  return plants.find(plant => plant.id === id) || null;
}
