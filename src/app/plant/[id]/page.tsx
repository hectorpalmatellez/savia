import { fetchPlantById } from '@/data/api';
import { notFound } from 'next/navigation';
import PlantDetailPageClient from './PlantDetailPageClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let plant = null;

  try {
    plant = await fetchPlantById(id);
  } catch (error) {
    console.error(`Error fetching plant ${id}:`, error);
  }

  if (!plant) {
    console.log(`Plant ID "${id}" not found`);
    notFound();
  }

  return <PlantDetailPageClient plant={plant} plantId={id} />;
}
