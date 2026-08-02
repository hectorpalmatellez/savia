'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlantData } from '@/data/plants';
import { setCachedPlants } from '@/data/cache';
import {
  Container,
  SimpleGrid,
  Card,
  CardSection,
  Box,
  Badge,
  Group,
  Button,
  Text,
  Stack,
  TextInput,
  SegmentedControl,
} from '@mantine/core';

interface HomePageClientProps {
  plants: PlantData[];
  error: string | null;
}

export default function HomePageClient({ plants, error }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [sensorFilter, setSensorFilter] = useState('Todos');

  useEffect(() => {
    // Cache plants when page loads
    if (plants.length > 0) {
      setCachedPlants(plants);
    }
  }, [plants]);

  const filteredPlants = plants.filter(plant => {
    const query = searchQuery.toLowerCase();
    const nameMatch = plant.common_name?.toLowerCase().includes(query) ?? false;
    const scientificMatch =
      plant.scientific_name?.toLowerCase().includes(query) ?? false;
    const searchMatch = query ? nameMatch || scientificMatch : true;

    let statusMatch = true;
    if (statusFilter === 'Vivas') {
      statusMatch = plant.status === 'Viva';
    } else if (statusFilter === 'Muertas') {
      statusMatch = plant.status === 'Muerta';
    }

    let sensorMatch = true;
    if (sensorFilter === 'Con sensor') {
      sensorMatch = plant.sensor === true;
    } else if (sensorFilter === 'Sin sensor') {
      sensorMatch = !plant.sensor;
    }

    return searchMatch && statusMatch && sensorMatch;
  });

  if (error && plants.length === 0) {
    return (
      <Container size="md" py="xl">
        <Text c="red">Error loading plants: {error}</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Group mb="xl">
        <TextInput
          placeholder="Buscar plantas por nombre o nombre científico..."
          value={searchQuery}
          onChange={event => setSearchQuery(event.currentTarget.value)}
          size="md"
          radius="md"
          style={{ flex: 1 }}
        />
        <SegmentedControl
          data={['Todas', 'Vivas', 'Muertas']}
          value={statusFilter}
          onChange={setStatusFilter}
          size="md"
          radius="md"
        />
        <SegmentedControl
          data={['Todos', 'Con sensor', 'Sin sensor']}
          value={sensorFilter}
          onChange={setSensorFilter}
          size="md"
          radius="md"
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {filteredPlants.length === 0 ? (
          <Text c="dimmed">No plants available</Text>
        ) : (
          filteredPlants.map(plant => (
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
                <Link href={`/plant/${plant.id}`}>
                  <Box pos="relative" h={160}>
                    <Image
                      src={
                        plant.image ||
                        'https://placehold.co/600x400?text=No+Photo'
                      }
                      fill
                      unoptimized={!plant.image}
                      sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
                      alt={plant.common_name || 'Planta'}
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                </Link>
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
