'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PlantData } from '@/data/plants';
import { setCachedPlants } from '@/data/cache';
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

interface HomePageClientProps {
  plants: PlantData[];
  error: string | null;
}

export default function HomePageClient({ plants, error }: HomePageClientProps) {
  useEffect(() => {
    // Cache plants when page loads
    if (plants.length > 0) {
      setCachedPlants(plants);
    }
  }, [plants]);

  if (error && plants.length === 0) {
    return (
      <Container size="md" py="xl">
        <Text c="red">Error loading plants: {error}</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {plants.length === 0 ? (
          <Text c="dimmed">No plants available</Text>
        ) : (
          plants
            .filter(plant => plant.sensor === true)
            .map(plant => (
            <Card
              key={plant.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
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

              <Stack
                gap="md"
                mt="md"
                mb="xl"
                style={{ flex: 1, justifyContent: 'space-between' }}
              >
                <div>
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Text fw={700}>
                        {plant.common_name || `ID: ${plant.id}`}
                      </Text>
                      {plant.scientific_name && (
                        <Text size="xs" c="dimmed" fs="italic">
                          {plant.scientific_name}
                        </Text>
                      )}
                    </div>
                    <Group gap="xs">
                      {plant.status && (
                        <Badge
                          color={
                            plant.status === 'Viva'
                              ? 'green'
                              : plant.status === 'Débil'
                                ? 'yellow'
                                : 'red'
                          }
                          variant="light"
                          size="sm"
                        >
                          {plant.status}
                        </Badge>
                      )}
                      <Badge color="blue" variant="light">
                        {plant.location || 'Sin ubicación'}
                      </Badge>
                    </Group>
                  </Group>

                  {plant.category && (
                    <Text size="xs" fw={500} mb="xs">
                      📂 {plant.category}
                    </Text>
                  )}

                  {plant.placement && (
                    <Text size="xs" c="dimmed" mb="xs">
                      📍 {plant.placement}
                    </Text>
                  )}

                  <Stack gap={4}>
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
                    {plant.requirements?.humidity && (
                      <Text size="sm" c="dimmed">
                        🌫️ Humedad:{' '}
                        <strong>{plant.requirements.humidity}</strong>
                      </Text>
                    )}
                    {plant.requirements?.soil && (
                      <Text size="sm" c="dimmed">
                        🌱 Suelo: <strong>{plant.requirements.soil}</strong>
                      </Text>
                    )}
                  </Stack>
                </div>
              </Stack>

              <Link
                href={`/plant/${plant.id}`}
                style={{ textDecoration: 'none', marginTop: 'auto' }}
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
          ))
        )}
      </SimpleGrid>
    </Container>
  );
}
