'use client';

import { useSyncExternalStore } from 'react';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const dark = mounted && colorScheme === 'dark';

  return (
    <ActionIcon
      variant="light"
      color="green"
      size="lg"
      radius="md"
      onClick={() => toggleColorScheme()}
      aria-label={
        mounted
          ? dark
            ? 'Cambiar a modo claro'
            : 'Cambiar a modo oscuro'
          : 'Cambiar modo'
      }
    >
      {mounted ? (dark ? '☀️' : '🌙') : null}
    </ActionIcon>
  );
}
