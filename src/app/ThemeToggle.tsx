'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant="light"
      color="green"
      size="lg"
      radius="md"
      onClick={() => toggleColorScheme()}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? '☀️' : '🌙'}
    </ActionIcon>
  );
}
