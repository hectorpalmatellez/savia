'use client';

import { useEffect } from 'react';
import { PlantData } from '@/data/plants';
import { setCachedPlants } from '@/data/cache';
import PlantDetail from './PlantDetail';

interface PlantDetailPageClientProps {
  plant: PlantData | null;
  plantId: string;
}

/**
 * Client wrapper for plant detail page that handles caching
 */
export default function PlantDetailPageClient({
  plant,
  plantId,
}: PlantDetailPageClientProps) {
  useEffect(() => {
    // When plant data is loaded, cache it for potential future use
    if (plant) {
      // Get existing cache
      const cached = localStorage.getItem('savia_plants_cache');
      const plants = cached ? JSON.parse(cached) : [];

      // Update cache with this plant (avoid duplicates)
      const index = plants.findIndex((p: PlantData) => p.id === plant.id);
      if (index >= 0) {
        plants[index] = plant;
      } else {
        plants.push(plant);
      }

      setCachedPlants(plants);
    }
  }, [plant]);

  if (!plant) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Plant not found. ID: {plantId}</p>
      </div>
    );
  }

  return <PlantDetail plant={plant} />;
}
