"use client";

import React from "react";

import "@/components/space_members_editor/space_members_editor.scss";
import { Button, Input } from "@/components";
import { Icon, Stack, Text } from "@/elements";
import type { MemberInput } from "@/lib/transaction_split";
import { i18n } from "@/model/i18n";

export interface MemberDraft extends MemberInput {
  key: string;
}

interface SpaceMembersEditorProps {
  members: MemberDraft[];
  onChange: (members: MemberDraft[]) => void;
  disabled: boolean;
}

export function SpaceMembersEditor({
  members,
  onChange,
  disabled,
}: SpaceMembersEditorProps): React.ReactElement {
  return (
    <div className="space-members-editor">
      <Stack gap={12}>
        <Text element="h2" type="body-medium">
          {i18n.t("space_members.title")}
        </Text>
        {members.map((member, index) => (
          <div className="space-members-editor__row" key={member.key}>
            <Input
              ariaLabel={String(
                i18n.t("space_members.name", {
                  number: String(index + 1),
                }),
              )}
              placeholder={String(
                i18n.t("space_members.name", {
                  number: String(index + 1),
                }),
              )}
              value={member.name}
              onChange={(name) =>
                onChange(
                  members.map((item) =>
                    item.key === member.key ? { ...item, name } : item,
                  ),
                )
              }
              required
              disabled={disabled}
              size="lg"
              surface="subtle"
              fullWidth
            />
            <Button
              type="button"
              variant="danger"
              disabled={disabled}
              ariaLabel={String(
                i18n.t("space_members.remove", { number: String(index + 1) }),
              )}
              startIcon={<Icon name="minus" size={18} />}
              onClick={() =>
                onChange(members.filter((item) => item.key !== member.key))
              }
            >
              {null}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || members.length >= 100}
          startIcon={<Icon name="plus" size={18} />}
          onClick={() =>
            onChange([...members, { key: crypto.randomUUID(), name: "" }])
          }
        >
          {i18n.t("space_members.add")}
        </Button>
      </Stack>
    </div>
  );
}
