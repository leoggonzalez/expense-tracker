import "./account_form_page.scss";

import React from "react";

import { AppLink, Hero } from "@/components";
import { Stack, Text } from "@/elements";

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
    <div className="account-form-page">
      <Stack gap={24}>
        <Hero icon="accounts" title={title} pattern="account_form">
          <Text as="p" size="sm" color="inverse">
            {subtitle}
          </Text>
        </Hero>

        <div className="account-form-page__panel">{children}</div>

        <div className="account-form-page__back-link">
          <AppLink href={backHref}>{backLabel}</AppLink>
        </div>
      </Stack>
    </div>
  );
}
