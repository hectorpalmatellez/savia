'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Modal,
  MultiSelect,
  Paper,
  RangeSlider,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  csvFieldsToPlantForm,
  emptyPlantForm,
  formatPrice,
} from '@/data/plant-form';
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
  category: string;
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
    category: form.category,
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
  const [propagating, setPropagating] = useState<RowView | null>(null);
  const [deleting, setDeleting] = useState<RowView | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hideDead, setHideDead] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [sensorFilter, setSensorFilter] = useState<boolean | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const plants = useMemo(() => rows.map(toRowView), [rows]);

  const priceBounds = useMemo(() => {
    const prices = plants
      .map(plant => plant.form.price)
      .filter((price): price is number => price !== undefined);
    if (prices.length === 0) return null;
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [plants]);

  const [prevPriceBounds, setPrevPriceBounds] = useState(priceBounds);
  if (prevPriceBounds !== priceBounds) {
    setPrevPriceBounds(priceBounds);
    setPriceRange(null);
  }

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(plants.map(plant => plant.location)))
        .filter(Boolean)
        .map(location => ({ value: location, label: location })),
    [plants],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(plants.map(plant => plant.form.category)))
        .filter(Boolean)
        .map(category => ({ value: category, label: category })),
    [plants],
  );

  const filtersActive =
    locationFilter.length > 0 ||
    sensorFilter !== null ||
    categoryFilter.length > 0 ||
    priceRange !== null;

  const visiblePlants = plants.filter(plant => {
    if (hideDead && plant.status === 'Muerta') return false;
    if (locationFilter.length > 0 && !locationFilter.includes(plant.location)) {
      return false;
    }
    if (sensorFilter !== null && plant.sensor !== sensorFilter) return false;
    if (
      categoryFilter.length > 0 &&
      !categoryFilter.includes(plant.form.category)
    ) {
      return false;
    }
    if (
      priceRange &&
      (plant.form.price === undefined ||
        plant.form.price < priceRange[0] ||
        plant.form.price > priceRange[1])
    ) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setLocationFilter([]);
    setSensorFilter(null);
    setCategoryFilter([]);
    setPriceRange(null);
  };

  const parentName = (parentId?: string) =>
    parentId
      ? plants.find(plant => String(plant.id) === parentId)?.name
      : undefined;

  const parentOptions = (excludeId?: number, orphanId?: string) => {
    const options = plants
      .filter(plant => plant.id !== excludeId)
      .map(plant => ({ value: String(plant.id), label: plant.name }));
    if (orphanId && !options.some(option => option.value === orphanId)) {
      options.push({ value: orphanId, label: `ID ${orphanId}` });
    }
    return options;
  };

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
    setPropagating(null);
    router.refresh();
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Administrar plantas</Title>
          <Text size="sm" c="dimmed">
            Edita db/Plants.csv y regenera los datos (
            {hideDead || filtersActive
              ? `${visiblePlants.length} de ${plants.length}`
              : plants.length}{' '}
            plantas)
          </Text>
        </div>
        <Group>
          <Switch
            label="Ocultar muertas"
            checked={hideDead}
            onChange={event => setHideDead(event.currentTarget.checked)}
            styles={{ label: { cursor: 'pointer' } }}
          />
          {!readOnly && (
            <Button onClick={() => setCreating(true)} color="green">
              Nueva planta
            </Button>
          )}
        </Group>
      </Group>

      <Paper withBorder p="md" mb="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={600}>Filtros</Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              Limpiar filtros
            </Button>
          </Group>
          <Group align="flex-end" grow>
            <MultiSelect
              label="Ubicación"
              placeholder="Todas"
              data={locationOptions}
              value={locationFilter}
              onChange={setLocationFilter}
              clearable
              searchable
              nothingFoundMessage="Sin resultados"
            />
            <Select
              label="Sensor"
              placeholder="Todos"
              data={[
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' },
              ]}
              value={sensorFilter === null ? null : String(sensorFilter)}
              onChange={value =>
                setSensorFilter(value === null ? null : value === 'true')
              }
              clearable
            />
            <MultiSelect
              label="Categoría"
              placeholder="Todas"
              data={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              clearable
              searchable
              nothingFoundMessage="Sin resultados"
            />
          </Group>
          {priceBounds && (
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Precio: {formatPrice(priceRange?.[0] ?? priceBounds[0])} –{' '}
                {formatPrice(priceRange?.[1] ?? priceBounds[1])}
              </Text>
              <RangeSlider
                min={priceBounds[0]}
                max={priceBounds[1]}
                step={100}
                value={priceRange ?? priceBounds}
                onChange={setPriceRange}
                label={formatPrice}
              />
            </Stack>
          )}
        </Stack>
      </Paper>

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
            <Table.Th>Madre</Table.Th>
            <Table.Th>Foto</Table.Th>
            {!readOnly && <Table.Th ta="right">Acciones</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visiblePlants.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={readOnly ? 8 : 9}>
                <Text c="dimmed" ta="center" py="md">
                  Sin plantas que coincidan con los filtros.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
          {visiblePlants.map(plant => (
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
                {parentName(plant.form.parentId) ? (
                  <Text size="xs" c="dimmed">
                    {parentName(plant.form.parentId)}
                  </Text>
                ) : (
                  ''
                )}
              </Table.Td>
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
                      color="teal"
                      onClick={() => setPropagating(plant)}
                    >
                      Propagar
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
          parentOptions={parentOptions()}
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
            parentOptions={parentOptions(editing.id, editing.form.parentId)}
            busy={busy}
            onSubmit={input =>
              run(() => updatePlant(editing.id, input), 'Planta actualizada.')
            }
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        opened={propagating !== null}
        onClose={() => setPropagating(null)}
        title={`Propagar desde «${propagating?.name ?? ''}»`}
        size="lg"
      >
        {propagating && (
          <PlantForm
            key={`propagate-${propagating.id}`}
            initial={{
              ...emptyPlantForm(),
              name: `${propagating.name} (corte)`,
              status: 'Viva',
              parentId: String(propagating.id),
            }}
            parentOptions={parentOptions()}
            busy={busy}
            onSubmit={input =>
              run(() => createPlant(input), 'Propagación creada.')
            }
            onCancel={() => setPropagating(null)}
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
