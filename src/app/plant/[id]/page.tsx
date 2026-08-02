import { getPlantById } from '@/data/store';
import { notFound } from 'next/navigation';
import PlantDetailPageClient from './PlantDetailPageClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plant = getPlantById(id);

  if (!plant) {
    console.log(`Plant ID "${id}" not found`);
    notFound();
  }

  return <PlantDetailPageClient plant={plant} plantId={id} />;
}
