"use client";

import "./space_edit_form.scss";

import React, { useState } from "react";

import type {
  CreditCardPaymentTimingInput,
  SpaceTypeInput,
} from "@/actions/spaces";
import { updateSpace } from "@/actions/spaces";
import { Button, Input, Select, useNavigationProgress } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type SpaceEditFormProps = {
  spaceId: string;
  initialName: string;
  initialType: SpaceTypeInput;
  initialPaymentDueDay: number | null;
  initialPaymentTiming: CreditCardPaymentTimingInput;
};

export function SpaceEditForm({
  spaceId,
  initialName,
  initialType,
  initialPaymentDueDay,
  initialPaymentTiming,
}: SpaceEditFormProps): React.ReactElement {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<SpaceTypeInput>(initialType);
  const [paymentDueDay, setPaymentDueDay] = useState(
    initialPaymentDueDay ? String(initialPaymentDueDay) : "",
  );
  const [paymentTiming, setPaymentTiming] =
    useState<CreditCardPaymentTimingInput>(
      initialPaymentTiming || "previous_month",
    );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { push } = useNavigationProgress();
  const isCreditCard = type === "credit_card";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateSpace(spaceId, {
      name,
      type,
      paymentDueDay: isCreditCard ? Number(paymentDueDay) : null,
      paymentTiming: isCreditCard ? paymentTiming : null,
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
                setPaymentTiming("previous_month");
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
              <Stack direction="row" gap={12} fullWidth>
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
                  <Select
                    label={i18n.t("spaces_page.payment_timing")}
                    value={paymentTiming || ""}
                    onChange={(value) => {
                      setPaymentTiming(
                        value === "same_month" || value === "previous_month"
                          ? value
                          : null,
                      );
                    }}
                    options={[
                      {
                        value: "previous_month",
                        label: i18n.t(
                          "spaces_page.payment_timing_previous_month",
                        ),
                      },
                      {
                        value: "same_month",
                        label: i18n.t("spaces_page.payment_timing_same_month"),
                      },
                    ]}
                    required
                    size="lg"
                    surface="subtle"
                    labelTone="secondary"
                  />
                </div>
              </Stack>
              <Text size="sm" color="secondary">
                {i18n.t("spaces_page.payment_due_day_hint")}
              </Text>
            </Stack>
          ) : null}

          {error ? <Text color="danger">{i18n.t(error)}</Text> : null}
          {success ? <Text color="success">{i18n.t(success)}</Text> : null}

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
