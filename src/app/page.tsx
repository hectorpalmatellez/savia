import { fetchPlants } from '@/data/api';
import { PlantData } from '@/data/plants';
import HomePageClient from './HomePageClient';

export const revalidate = 60;

export default async function HomePage() {
  let allPlants: PlantData[] = [];
  let error: string | null = null;

  try {
    const plants = await fetchPlants();
    allPlants = plants.map((plant, index) => ({
      ...plant,
      id: plant.id || `plant-${index}`,
    }));
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error fetching plants';
    console.error('Error fetching plants:', error);
  }

  return <HomePageClient plants={allPlants} error={error} />;
}
