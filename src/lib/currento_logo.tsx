import React from "react";

type CurrentoLogoProps = {
  size?: number;
};

export function CurrentoLogo({
  size = 48,
}: CurrentoLogoProps): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="14" fill="var(--color-primary)" />
      <path
        d="M31.761 13.814c3.422 1.436 5.86 4.755 5.86 8.646v1.143h-5.106V22.47c0-3.205-2.57-5.781-5.739-5.781h-4.033c-4.544 0-8.219 3.692-8.219 8.261 0 4.568 3.675 8.26 8.219 8.26h11.16v3.875h-11.16c-6.702 0-12.132-5.455-12.132-12.135 0-6.681 5.43-12.136 12.132-12.136h4.033c1.743 0 3.422.361 4.985 1.001Z"
        fill="var(--color-success)"
      />
      <path
        d="M22.387 21.489h15.012a2.424 2.424 0 1 1 0 4.848H22.387a2.424 2.424 0 1 1 0-4.848Z"
        fill="var(--color-brand-highlight)"
      />
    </svg>
  );
}
