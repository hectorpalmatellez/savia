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
          plants.map(plant => (
            <Card
              key={plant.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
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

              <Group justify="space-between" mt="md" mb="xs">
                {/* Fallback to the ID if common_name is missing */}
                <Text fw={700}>{plant.common_name || `ID: ${plant.id}`}</Text>
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
          ))
        )}
      </SimpleGrid>
    </Container>
  );
}
