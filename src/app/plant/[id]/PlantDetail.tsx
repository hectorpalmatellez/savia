'use client';
import {
  Container,
  Title,
  Text,
  Image,
  SimpleGrid,
  Card,
  Badge,
  Stack,
  Divider,
} from '@mantine/core';
import { PlantData } from '@/data/plants';

export default function PlantDetail({ plant }: { plant: PlantData }) {
  return (
    <Container size="xs" py="xl">
      <Stack gap="md">
        <Image
          src={plant.image || 'https://placehold.co/600x400?text=Sin+Foto'}
          radius="lg"
          alt={plant.common_name}
        />

        <Stack gap={2}>
          <Title order={1} c="green.9">
            {plant.common_name}
          </Title>
          {plant.scientific_name && (
            <Text c="dimmed" fz="sm" fs="italic">
              {plant.scientific_name}
            </Text>
          )}
        </Stack>

        <Badge color="green" variant="light" size="lg">
          📍 {plant.location} {plant.placement ? `• ${plant.placement}` : ''}
        </Badge>

        <Divider label="Requerimientos" labelPosition="center" />

        <SimpleGrid cols={2}>
          <Card withBorder radius="md">
            <Text fw={700} size="xs" c="blue" tt="uppercase">
              💧 Riego
            </Text>
            <Text size="md">{plant.requirements.water}</Text>
          </Card>

          <Card withBorder radius="md">
            <Text fw={700} size="xs" c="orange" tt="uppercase">
              ☀️ Luz
            </Text>
            <Text size="md">{plant.requirements.light}</Text>
          </Card>

          {/* Conditional Requirements */}
          {plant.requirements.humidity && (
            <Card withBorder radius="md">
              <Text fw={700} size="xs" c="cyan" tt="uppercase">
                ☁️ Humedad
              </Text>
              <Text size="md">{plant.requirements.humidity}</Text>
            </Card>
          )}

          {plant.requirements.soil && (
            <Card withBorder radius="md">
              <Text fw={700} size="xs" c="brown" tt="uppercase">
                🪴 Suelo
              </Text>
              <Text size="md">{plant.requirements.soil}</Text>
            </Card>
          )}
        </SimpleGrid>

        {/* Care History Section */}
        {plant.care?.last_watered && (
          <Card withBorder padding="sm" radius="md" bg="gray.0">
            <Text size="xs" fw={500} c="dimmed">
              Último riego registrado:
            </Text>
            <Text size="sm" fw={700}>
              {plant.care.last_watered}
            </Text>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
