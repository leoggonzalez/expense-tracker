"use client";

import "./error_details_panel.scss";

import React, { useId, useState } from "react";

import { Button } from "@/components/button/button";

type ErrorDetailsPanelProps = {
  label: string;
  content: string;
};

export function ErrorDetailsPanel({
  label,
  content,
}: ErrorDetailsPanelProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="error-details-panel">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        ariaLabel={label}
      >
        {label}
      </Button>

      <div
        id={panelId}
        className={[
          "error-details-panel__content",
          isOpen && "error-details-panel__content--open",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={!isOpen}
      >
        <div className="error-details-panel__content-inner">
          <pre className="error-details-panel__pre">{content}</pre>
        </div>
      </div>
    </div>
  );
}
