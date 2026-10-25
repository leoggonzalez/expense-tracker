"use client";

import "@/components/space_edit_form/space_edit_form.scss";

import React, { useState } from "react";

import {
  SpaceMembersEditor,
  type MemberDraft,
} from "@/components/space_members_editor/space_members_editor";
import type { MemberInput } from "@/lib/transaction_split";

import type { SpaceTypeInput } from "@/actions/spaces";
import { updateSpace } from "@/actions/spaces";
import { Button, Input, Select, useNavigationProgress } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

interface SpaceEditFormProps {
  initialMembers: MemberInput[];
  spaceId: string;
  initialName: string;
  initialType: SpaceTypeInput;
  initialPaymentDueDay: number | null;
  initialPeriodEndDay: number | null;
}

export function SpaceEditForm({
  initialMembers,
  spaceId,
  initialName,
  initialType,
  initialPaymentDueDay,
  initialPeriodEndDay,
}: SpaceEditFormProps): React.ReactElement {
  const [members, setMembers] = useState<MemberDraft[]>(
    initialMembers.map((member) => ({ ...member, key: member.id! })),
  );
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<SpaceTypeInput>(initialType);
  const [paymentDueDay, setPaymentDueDay] = useState(
    initialPaymentDueDay ? String(initialPaymentDueDay) : "",
  );
  const [periodEndDay, setPeriodEndDay] = useState(
    initialPeriodEndDay ? String(initialPeriodEndDay) : "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { push } = useNavigationProgress();
  const isCreditCard = type === "credit_card";
  const isLegacyCard =
    initialType === "credit_card" && initialPeriodEndDay === null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateSpace(spaceId, {
      members: members.map(({ id, name }) => ({ id, name })),
      name,
      type,
      paymentDueDay: isCreditCard ? Number(paymentDueDay) : null,
      periodEndDay:
        isCreditCard && periodEndDay.trim() ? Number(periodEndDay) : null,
    });

    if (!result.success) {
      setError(result.error || "space_detail_page.update_failed");
      setIsLoading(false);
      return;
    }

    setSuccess("space_detail_page.update_success");
    setIsLoading(false);
    push(`/spaces/${spaceId}`);
  };

  return (
    <div className="space-edit-form">
      <form onSubmit={handleSubmit}>
        <Stack gap={16}>
          <Input
            label={i18n.t("spaces_page.space_name")}
            value={name}
            onChange={setName}
            placeholder={i18n.t("spaces_page.space_name_placeholder") as string}
            required
            size="lg"
            surface="subtle"
            labelTone="secondary"
          />

          <Select
            label={i18n.t("spaces_page.space_type")}
            value={type || ""}
            onChange={(value) => {
              const nextType = value === "credit_card" ? "credit_card" : null;

              setType(nextType);

              if (nextType !== "credit_card") {
                setPaymentDueDay("");
                setPeriodEndDay("");
              }
            }}
            options={[
              {
                value: "",
                label: i18n.t("spaces_page.space_type_regular"),
              },
              {
                value: "credit_card",
                label: i18n.t("spaces_page.space_type_credit_card"),
              },
            ]}
            size="lg"
            surface="subtle"
            labelTone="secondary"
          />

          {isCreditCard ? (
            <Stack gap={8}>
              <Stack line gap={12} fullWidth>
                <div className="space-edit-form__half-field">
                  <Input
                    label={i18n.t("spaces_page.payment_due_day")}
                    type="number"
                    value={paymentDueDay}
                    onChange={setPaymentDueDay}
                    placeholder="25"
                    required
                    min={1}
                    max={31}
                    step={1}
                    size="lg"
                    surface="subtle"
                    labelTone="secondary"
                    fullWidth
                  />
                </div>
                <div className="space-edit-form__half-field">
                  <Input
                    label={i18n.t("spaces_page.period_end_day")}
                    type="number"
                    value={periodEndDay}
                    onChange={setPeriodEndDay}
                    placeholder="23"
                    required={!isLegacyCard}
                    min={1}
                    max={31}
                    step={1}
                    size="lg"
                    surface="subtle"
                    labelTone="secondary"
                    fullWidth
                  />
                </div>
              </Stack>
              <Text element="p" type="caption" color="secondary">
                {i18n.t(
                  isLegacyCard && !periodEndDay.trim()
                    ? "spaces_page.credit_card_legacy_period_hint"
                    : "spaces_page.credit_card_period_hint",
                )}
              </Text>
            </Stack>
          ) : null}

          <SpaceMembersEditor
            members={members}
            onChange={setMembers}
            disabled={isLoading}
          />

          {error ? (
            <Text element="p" color="danger">
              {i18n.t(error)}
            </Text>
          ) : null}
          {success ? (
            <Text element="p" color="success">
              {i18n.t(success)}
            </Text>
          ) : null}

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? i18n.t("space_detail_page.saving")
              : i18n.t("space_detail_page.save")}
          </Button>
        </Stack>
      </form>
    </div>
  );
}
