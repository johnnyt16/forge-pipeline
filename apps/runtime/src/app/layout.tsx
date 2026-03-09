export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout is minimal — each site page renders its own <html> with config-driven styles
  return children;
}
