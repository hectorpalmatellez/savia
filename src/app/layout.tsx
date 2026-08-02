// src/app/layout.tsx
import '@mantine/core/styles.css';
import {
  ColorSchemeScript,
  MantineProvider,
  createTheme,
  AppShell,
  AppShellHeader,
  AppShellMain, // Named export is safer
  Container,
  Group,
  Text,
  Badge,
} from '@mantine/core';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const theme = createTheme({
  primaryColor: 'green',
  fontFamily: 'Inter, sans-serif',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {/* header={{ height: 60 }} reserves the space at the top */}
          <AppShell header={{ height: 60 }} padding="md">
            <AppShellHeader>
              <Container size="md" h="100%">
                <Group h="100%" justify="space-between">
                  {/* FIX: Use standard Next.js Link and style the text inside */}
                  <Link href="/" style={{ textDecoration: 'none' }}>
                    <Text
                      fw={900}
                      c="green.9"
                      fz="lg"
                      style={{ letterSpacing: '-1px' }}
                    >
                      SAVIA
                    </Text>
                  </Link>

                  <Group gap="xs">
                    <Badge color="green" variant="light" size="sm">
                      Mi Jardín
                    </Badge>
                    <ThemeToggle />
                  </Group>
                </Group>
              </Container>
            </AppShellHeader>

            {/* Using AppShellMain as a named export is safer with Turbopack */}
            <AppShellMain>{children}</AppShellMain>
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}
