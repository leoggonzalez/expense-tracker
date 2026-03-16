import "./account_form_page.scss";

import React from "react";

import { AppLink, Container } from "@/components";
import { Icon, Stack, Text } from "@/elements";

type AccountFormPageProps = {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
};

export function AccountFormPage({
  title,
  subtitle,
  backHref,
  backLabel,
  children,
}: AccountFormPageProps): React.ReactElement {
  return (
    <Container>
      <div className="account-form-page">
        <Stack gap={24}>
          <section className="account-form-page__hero">
            <div className="account-form-page__hero-pattern" aria-hidden="true" />
            <Stack gap={10}>
              <span className="account-form-page__hero-icon">
                <Icon name="accounts" size={20} />
              </span>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {title}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {subtitle}
              </Text>
            </Stack>
          </section>

          <div className="account-form-page__panel">{children}</div>

          <div className="account-form-page__back-link">
            <AppLink href={backHref}>{backLabel}</AppLink>
          </div>
        </Stack>
      </div>
    </Container>
  );
}
