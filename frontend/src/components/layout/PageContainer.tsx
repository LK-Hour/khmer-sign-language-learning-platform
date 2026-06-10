import { Container } from "@mui/material";

type PageContainerProps = {
  children: React.ReactNode;
  component?: React.ElementType;
  sx?: React.ComponentProps<typeof Container>["sx"];
};

/**
 * Standard page wrapper — always use `maxWidth="xl"`.
 *
 * @example
 * <PageContainer>
 *   <Grid container spacing={2}>...</Grid>
 * </PageContainer>
 */
export default function PageContainer({
  children,
  component = "main",
  sx,
}: PageContainerProps) {
  return (
    <Container
      component={component}
      maxWidth="xl"
      sx={{
        flex: 1,
        width: "100%",
        py: { xs: 3, md: 4, lg: 6 },
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
