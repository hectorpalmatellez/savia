'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { csvFieldsToPlantForm, formatPrice } from '@/data/plant-form';
import type { PlantFormInput } from '@/data/plant-form';
import PlantForm from './PlantForm';
import { createPlant, deletePlant, updatePlant } from './actions';
import type { ActionResult } from './actions';

interface AdminPageClientProps {
  rows: string[][];
  error: string | null;
  readOnly: boolean;
}

interface RowView {
  id: number;
  name: string;
  status: string;
  location: string;
  price: string;
  sensor: boolean;
  photo: string;
  form: PlantFormInput;
}

function toRowView(row: string[]): RowView {
  const form = csvFieldsToPlantForm(row.slice(1));
  return {
    id: Number(row[0]),
    name: form.name,
    status: form.status,
    location: form.location,
    price: form.price !== undefined ? formatPrice(form.price) : '',
    sensor: form.sensor,
    photo: form.photo,
    form,
  };
}

const statusColor = (status: string) =>
  status === 'Viva' ? 'green' : status === 'Débil' ? 'yellow' : 'red';

export default function AdminPageClient({
  rows,
  error,
  readOnly,
}: AdminPageClientProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RowView | null>(null);
  const [deleting, setDeleting] = useState<RowView | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const plants = rows.map(toRowView);

  async function run(
    action: () => Promise<ActionResult>,
    successMessage: string,
  ) {
    setBusy(true);
    setFeedback(null);
    setWarnings([]);
    const result = await action();
    setBusy(false);

    if (!result.ok) {
      setFeedback(result.error);
      return;
    }

    setFeedback(successMessage);
    setWarnings(result.warnings);
    setCreating(false);
    setEditing(null);
    setDeleting(null);
    router.refresh();
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Administrar plantas</Title>
          <Text size="sm" c="dimmed">
            Edita db/Plants.csv y regenera los datos ({plants.length} plantas)
          </Text>
        </div>
        {!readOnly && (
          <Button onClick={() => setCreating(true)} color="green">
            Nueva planta
          </Button>
        )}
      </Group>

      {readOnly && (
        <Alert color="yellow" mb="md">
          El modo edición solo está disponible en desarrollo local (pnpm dev).
          En producción esta vista es de solo lectura.
        </Alert>
      )}

      {error && (
        <Alert color="red" mb="md">
          Error leyendo db/Plants.csv: {error}
        </Alert>
      )}

      {feedback && (
        <Alert
          color={feedback.startsWith('Error') ? 'red' : 'green'}
          mb="md"
          onClose={() => setFeedback(null)}
          withCloseButton
        >
          {feedback}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert color="yellow" mb="md">
          <Stack gap={2}>
            {warnings.map((warning, index) => (
              <Text key={index} size="sm">
                {warning}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Ubicación</Table.Th>
            <Table.Th>Precio</Table.Th>
            <Table.Th>Sensor</Table.Th>
            <Table.Th>Foto</Table.Th>
            {!readOnly && <Table.Th ta="right">Acciones</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {plants.map(plant => (
            <Table.Tr key={plant.id}>
              <Table.Td>{plant.id}</Table.Td>
              <Table.Td fw={500}>{plant.name}</Table.Td>
              <Table.Td>
                {plant.status && (
                  <Badge color={statusColor(plant.status)} variant="light">
                    {plant.status}
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>{plant.location}</Table.Td>
              <Table.Td>{plant.price}</Table.Td>
              <Table.Td>{plant.sensor ? 'Sí' : 'No'}</Table.Td>
              <Table.Td>
                {plant.photo ? (
                  <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                    {plant.photo}
                  </Text>
                ) : (
                  ''
                )}
              </Table.Td>
              {!readOnly && (
                <Table.Td ta="right">
                  <Group gap="xs" justify="flex-end">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => setEditing(plant)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => setDeleting(plant)}
                    >
                      Eliminar
                    </Button>
                  </Group>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={creating}
        onClose={() => setCreating(false)}
        title="Nueva planta"
        size="lg"
      >
        <PlantForm
          key="create"
          initial={undefined}
          busy={busy}
          onSubmit={input => run(() => createPlant(input), 'Planta creada.')}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={`Editar planta ${editing?.id ?? ''}`}
        size="lg"
      >
        {editing && (
          <PlantForm
            key={`edit-${editing.id}`}
            initial={editing.form}
            busy={busy}
            onSubmit={input =>
              run(() => updatePlant(editing.id, input), 'Planta actualizada.')
            }
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar planta"
      >
        {deleting && (
          <Stack gap="md">
            <Text>
              ¿Eliminar «{deleting.name}» (ID {deleting.id})? Los IDs de las
              demás plantas no cambian.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button
                color="red"
                loading={busy}
                onClick={() =>
                  run(() => deletePlant(deleting.id), 'Planta eliminada.')
                }
              >
                Eliminar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
