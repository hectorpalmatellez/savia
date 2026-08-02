import { getPlants } from '@/data/store';
import HomePageClient from './HomePageClient';

export default function HomePage() {
  const allPlants = getPlants().map((plant, index) => ({
    ...plant,
    id: plant.id || index.toString(),
  }));

  return <HomePageClient plants={allPlants} error={null} />;
}
