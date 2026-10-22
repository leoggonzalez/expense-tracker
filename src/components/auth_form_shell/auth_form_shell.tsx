import "@/components/auth_form_shell/auth_form_shell.scss";

import React from "react";

import { Box, Stack } from "@/elements";

interface AuthFormShellProps {
  children: React.ReactNode;
}

export function AuthFormShell({
  children,
}: AuthFormShellProps): React.ReactElement {
  return (
    <div className="auth-form-shell">
      <Stack align="center" justify="center" fullWidth fullHeight>
        <div className="auth-form-shell__card">
          <Box padding={24} maxWidth={480}>
            <div className="auth-form-shell__content">{children}</div>
          </Box>
        </div>
      </Stack>
    </div>
  );
}
