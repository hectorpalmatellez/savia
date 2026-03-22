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
  Group,
  AspectRatio,
  Button,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlantData } from '@/data/plants';
import { useEffect, useState } from 'react';
import EXIF from 'exif-js';

export default function PlantDetail({ plant }: { plant: PlantData }) {
  const [photoDate, setPhotoDate] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (plant.image) {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = plant.image;
      img.onload = function () {
        EXIF.getData(img as any, function (this: any) {
          const allExif = EXIF.getAllTags(this);
          console.log('EXIF data:', allExif);
          const dateStr =
            EXIF.getTag(this, 'DateTimeOriginal') ||
            EXIF.getTag(this, 'CreateDate') ||
            EXIF.getTag(this, 'ModifyDate');

          if (dateStr) {
            // EXIF date format is usually "YYYY:MM:DD HH:MM:SS"
            // We want to show the date only
            const parts = dateStr.split(' ');
            if (parts.length > 0) {
              const datePart = parts[0].replace(/:/g, '-');
              setPhotoDate(datePart);
            }
          }
        });
      };
    }
  }, [plant.image]);

  return (
    <Container size="xs" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Badge
            color={plant.sensor ? 'green' : 'gray'}
            variant="light"
            size="sm"
            leftSection={plant.sensor ? '📡' : '🚫'}
          >
            Sensor {plant.sensor ? 'Activo' : 'Inactivo'}
          </Badge>
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
              {plant.status === 'Viva'
                ? '✅ '
                : plant.status === 'Débil'
                  ? '⚠️ '
                  : '❌ '}
              {plant.status}
            </Badge>
          )}
        </Group>

        <AspectRatio ratio={1}>
          <Image
            src={plant.image || 'https://placehold.co/600x400?text=Sin+Foto'}
            radius="lg"
            alt={plant.common_name}
          />
        </AspectRatio>

        <Group justify="space-between" align="center" mt={-10}>
          {photoDate ? (
            <Text size="xs" c="dimmed" ml={5}>
              📷 Foto tomada el: {photoDate}
            </Text>
          ) : (
            <div />
          )}
          <Button variant="subtle" size="compact-xs" onClick={open}>
            Ver imagen completa
          </Button>
        </Group>

        <Modal
          opened={opened}
          onClose={close}
          title={plant.common_name}
          size="xl"
          centered
        >
          <Image
            src={plant.image || 'https://placehold.co/600x400?text=Sin+Foto'}
            alt={plant.common_name}
            radius="md"
          />
        </Modal>

        <Stack gap={2}>
          <Title order={1} c="green.9">
            {plant.common_name}
          </Title>
          {plant.scientific_name && (
            <Text c="dimmed" fz="sm" fs="italic">
              {plant.scientific_name}
            </Text>
          )}
          {plant.category && (
            <Text c="dimmed" fz="xs" fw={500}>
              📂 {plant.category}
            </Text>
          )}
        </Stack>

        <Stack gap={2}>
          <Badge color="blue" variant="light" size="lg">
            📍 {plant.location} {plant.placement ? `• ${plant.placement}` : ''}
          </Badge>
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
              size="lg"
            >
              {plant.status === 'Viva'
                ? '✅ '
                : plant.status === 'Débil'
                  ? '⚠️ '
                  : '❌ '}
              {plant.status}
            </Badge>
          )}
        </Stack>

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
              {new Date(plant.care.last_watered).toLocaleDateString()}
            </Text>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
