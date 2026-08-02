'use client';

import { useState } from 'react';
import {
  Button,
  Checkbox,
  FileInput,
  Grid,
  Group,
  Image,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  LOCATION_OPTIONS,
  STATUS_OPTIONS,
  emptyPlantForm,
} from '@/data/plant-form';
import type { PlantFormInput } from '@/data/plant-form';
import { uploadPhoto } from './actions';

interface PlantFormProps {
  initial: PlantFormInput | undefined;
  busy: boolean;
  onSubmit: (input: PlantFormInput) => void;
  onCancel: () => void;
  parentOptions: { value: string; label: string }[];
}

type FormValues = Omit<PlantFormInput, 'price'> & { price: string };

export default function PlantForm({
  initial,
  busy,
  onSubmit,
  onCancel,
  parentOptions,
}: PlantFormProps) {
  const form = useForm<FormValues>({
    initialValues: {
      ...(initial ?? emptyPlantForm()),
      price: initial?.price === undefined ? '' : String(initial.price),
    },
    validate: {
      name: value => (value.trim() ? null : 'El nombre es obligatorio'),
      price: value => {
        if (!value.trim()) return null;
        if (!/^\d+$/.test(value.trim())) {
          return 'Usa solo números';
        }
        return null;
      },
    },
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = form.onSubmit(values => {
    const digits = values.price.trim();
    onSubmit({
      ...values,
      price: digits ? Number(digits) : undefined,
    });
  });

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setUploading(true);
    setUploadError(null);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.set('file', file);
    const result = await uploadPhoto(formData);

    setUploading(false);
    if (!result.ok) {
      setUploadError(result.error);
      setPreview(null);
      return;
    }
    form.setFieldValue('photo', result.filename);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={12}>
            <Select
              label="Planta madre (propagación)"
              placeholder="Ninguna — planta original"
              data={parentOptions}
              clearable
              searchable
              nothingFoundMessage="No se encontró la planta"
              {...form.getInputProps('parentId')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Nombre"
              placeholder="Monstera"
              withAsterisk
              {...form.getInputProps('name')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Nombre científico (Latin)"
              placeholder="Monstera deliciosa"
              {...form.getInputProps('latin')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Tipo"
              placeholder="Interior / Exterior"
              {...form.getInputProps('type')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Categoría"
              placeholder="Tropical"
              {...form.getInputProps('category')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Fecha de compra"
              type="date"
              {...form.getInputProps('date')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Ubicación"
              data={LOCATION_OPTIONS}
              clearable
              {...form.getInputProps('location')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Orientación"
              placeholder="Norte / Este / Suelo…"
              {...form.getInputProps('orientation')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Origen"
              placeholder="Kenaz, Regalo…"
              {...form.getInputProps('origin')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Estado"
              data={STATUS_OPTIONS}
              clearable
              {...form.getInputProps('status')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Stack gap="xs">
              <TextInput
                label="Foto (nombre de archivo)"
                placeholder="20260516_131049.jpg"
                {...form.getInputProps('photo')}
              />
              <FileInput
                label="Subir foto a ./img"
                placeholder="Elegir archivo…"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleFileChange}
                disabled={busy || uploading}
                leftSection={uploading ? <Loader size={14} /> : undefined}
              />
              {uploadError && (
                <Text size="xs" c="red">
                  {uploadError}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Se comprime, se guarda en ./img y se publica en Blob.
              </Text>
              {preview && (
                <Image
                  src={preview}
                  h={80}
                  w="auto"
                  fit="cover"
                  radius="sm"
                  alt="Vista previa"
                />
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Precio (CLP)"
              placeholder="12990"
              leftSection="$"
              inputMode="numeric"
              {...form.getInputProps('price')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Checkbox
              mt="md"
              label="Tiene sensor"
              {...form.getInputProps('sensor', { type: 'checkbox' })}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" color="green" loading={busy}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
