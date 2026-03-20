import {
  getArchivedSpacesCurrentMonthSummary,
  unarchiveSpace,
} from "@/actions/spaces";
import { AppLink, Avatar, Button, Container, Currency } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const spaces = await getArchivedSpacesCurrentMonthSummary();

  async function handleUnarchiveAction(formData: FormData): Promise<void> {
    "use server";

    const spaceId = String(formData.get("spaceId") || "");

    if (!spaceId) {
      return;
    }

    await unarchiveSpace(spaceId);
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("spaces_page.archived_spaces")}
        </Text>

        {spaces.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">
              {i18n.t("spaces_page.empty_archived_state")}
            </Text>
          </Card>
        ) : (
          <Stack gap={16}>
            {spaces.map((space) => (
              <Card key={space.id} padding={16}>
                <Stack
                  direction="row"
                  align="center"
                  justify="space-between"
                  gap={12}
                >
                  <Stack direction="row" align="center" gap={12}>
                    <Avatar name={space.name} />
                    <Stack gap={4}>
                      <Text size="md" weight="semibold">
                        {space.name}
                      </Text>
                      <Currency
                        value={space.currentMonthTotal}
                        size="sm"
                        weight="bold"
                      />
                    </Stack>
                  </Stack>

                  <form action={handleUnarchiveAction}>
                    <input type="hidden" name="spaceId" value={space.id} />
                    <Button type="submit">
                      {i18n.t("spaces_page.unarchive")}
                    </Button>
                  </form>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        <AppLink href="/spaces">
          {i18n.t("spaces_page.back_to_spaces")}
        </AppLink>
      </Stack>
    </Container>
  );
}
