'use client';
import {
  Container,
  Title,
  Text,
  Image,
  Card,
  Badge,
  Stack,
  Group,
  AspectRatio,
  Button,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlantData } from '@/data/plants';
import { useEffect, useState } from 'react';
import EXIF from 'exif-js';

const formatDate = (dateString: Date | string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'long' });
  const year = date.getFullYear();
  return `${day} de ${month}, ${year}`;
};

export default function PlantDetail({ plant }: { plant: PlantData }) {
  const [photoDate, setPhotoDate] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (plant.image) {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = plant.image;
      img.onload = function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        EXIF.getData(img as any, () => {
          const dateStr =
            EXIF.getTag(img, 'DateTimeOriginal') ||
            EXIF.getTag(img, 'CreateDate') ||
            EXIF.getTag(img, 'ModifyDate');

          if (dateStr) {
            // EXIF date format is usually "YYYY:MM:DD HH:MM:SS"
            // We want to show the date only
            const parts = dateStr.split(' ');
            if (parts.length > 0) {
              const datePart = parts[0].replace(/:/g, '-');
              const [year, month, day] = datePart.split('-');
              if (year && month && day) {
                const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
                setPhotoDate(formatDate(dateObj));
              } else {
                setPhotoDate(datePart);
              }
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
                  : '💀 '}
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
          {plant.image && (
            <Button variant="subtle" size="compact-xs" onClick={open}>
              Ver imagen completa
            </Button>
          )}
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
          {(plant.category || plant.type) && (
            <Text c="dimmed" fz="xs" fw={500}>
              📂 {[plant.category, plant.type].filter(Boolean).join(' • ')}
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
                  : '💀 '}
              {plant.status}
            </Badge>
          )}
        </Stack>


        {/* Acquisition Section */}
        {(plant.origin || plant.price || plant.purchase_date) && (
          <Card withBorder padding="sm" radius="md" bg="gray.0">
            <Text size="xs" fw={500} c="dimmed" mb={5}>
              Datos de adquisición:
            </Text>
            <Stack gap={2}>
              {plant.purchase_date && (
                <Text size="sm" fw={500}>
                  📅 Fecha: <Text component="span" fw={700}>{formatDate(plant.purchase_date)}</Text>
                </Text>
              )}
              {plant.origin && (
                <Text size="sm" fw={500}>
                  🏷️ Origen: <Text component="span" fw={700}>{plant.origin}</Text>
                </Text>
              )}
              {plant.price && (
                <Text size="sm" fw={500}>
                  💰 Precio: <Text component="span" fw={700}>{plant.price}</Text>
                </Text>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
