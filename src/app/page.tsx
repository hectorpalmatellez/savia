'use client'; // Keeping it client-side for the MVP to avoid serialization issues

import Link from 'next/link';
import { PLANT_DATA } from '@/data/plants';
import {
  Container,
  SimpleGrid,
  Card,
  CardSection,
  Image,
  Badge,
  Group,
  Button,
  Text,
  Stack,
} from '@mantine/core';

export default function HomePage() {
  // 1. Transform the data and log it to debug
  const allPlants = Object.keys(PLANT_DATA).map(id => {
    const data = PLANT_DATA[id];
    console.log(`Cargando planta: ${id}`, data); // Check your browser console (F12)
    return {
      id,
      ...data,
    };
  });

  return (
    <Container size="md" py="xl">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {allPlants.map(plant => (
          <Card key={plant.id} shadow="sm" padding="lg" radius="md" withBorder>
            {/* Image with a guaranteed height */}
            <CardSection>
              <Image
                src={
                  plant.image || 'https://placehold.co/600x400?text=No+Photo'
                }
                height={160}
                alt={plant.common_name || 'Planta'}
              />
            </CardSection>

            <Group justify="space-between" mt="md" mb="xs">
              {/* Fallback to the ID if common_name is missing */}
              <Text fw={700}>{plant.common_name || `ID: ${plant.id}`}</Text>
              <Badge color="green" variant="light">
                {plant.location || 'Sin ubicación'}
              </Badge>
            </Group>

            <Stack gap={4} mb="md">
              <Text size="sm" c="dimmed">
                ☀️ Luz:{' '}
                <strong>
                  {plant.requirements?.light || 'No especificada'}
                </strong>
              </Text>
              <Text size="sm" c="dimmed">
                💧 Riego:{' '}
                <strong>
                  {plant.requirements?.water || 'No especificado'}
                </strong>
              </Text>
            </Stack>

            <Link
              href={`/plant/${plant.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Button
                component="div" // Necessary to avoid nested anchor tags
                color="green.8"
                fullWidth
                radius="md"
              >
                Ver Detalles
              </Button>
            </Link>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
