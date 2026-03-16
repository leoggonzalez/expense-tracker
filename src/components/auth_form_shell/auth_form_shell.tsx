import "./auth_form_shell.scss";

import React from "react";

import { Box } from "@/elements";

type AuthFormShellProps = {
  children: React.ReactNode;
};

export function AuthFormShell({
  children,
}: AuthFormShellProps): React.ReactElement {
  return (
    <div className="auth-form-shell">
      <div className="auth-form-shell__card">
        <Box padding={24} maxWidth={480}>
          {children}
        </Box>
      </div>
    </div>
  );
}
