import { PlantData } from './plants';
import { plants } from './plants-data';

/**
 * Reads all plants from the generated data module.
 * The source of truth is db/Plants.csv; regenerate with `pnpm sync:data`.
 */
export function getPlants(): PlantData[] {
  return plants;
}

/**
 * Looks up a plant by its explicit ID (CSV ID column). Falls back to the
 * CSV row number so pre-ID links still resolve.
 */
export function getPlantById(id: string): PlantData | null {
  return (
    plants.find(plant => plant.id === id) ??
    plants.find(plant => String(plant.row) === id) ??
    null
  );
}
