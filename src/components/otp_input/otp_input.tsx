"use client";

import "./otp_input.scss";

import React, { useEffect, useRef } from "react";

type OtpInputProps = {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  required?: boolean;
};

export function OtpInput({
  label,
  value,
  onChange,
  length = 6,
  disabled = false,
  required = false,
}: OtpInputProps): React.ReactElement {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const focusIndex = (index: number) => {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  };

  const commitValue = (next: string) => {
    onChange(next.replace(/\D/g, "").slice(0, length));
  };

  const handleChange = (index: number, nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, "");

    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      commitValue(nextDigits.join(""));
      return;
    }

    const nextDigits = [...digits];
    const incoming = sanitized.slice(0, length);

    if (incoming.length > 1) {
      incoming.split("").forEach((digit, offset) => {
        if (index + offset < length) {
          nextDigits[index + offset] = digit;
        }
      });
      commitValue(nextDigits.join(""));
      focusIndex(Math.min(index + incoming.length - 1, length - 1));
      return;
    }

    nextDigits[index] = incoming;
    commitValue(nextDigits.join(""));

    if (index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");

    if (!pasted) {
      return;
    }

    event.preventDefault();
    commitValue(pasted);
    focusIndex(Math.min(pasted.length - 1, length - 1));
  };

  return (
    <div className="otp-input">
      <label className="otp-input__label">
        {label}
        {required && <span className="otp-input__required">*</span>}
      </label>
      <div className="otp-input__boxes" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className="otp-input__box"
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            maxLength={6}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            aria-label={`Digit ${index + 1}`}
            disabled={disabled}
            required={required && index === 0}
          />
        ))}
      </div>
    </div>
  );
}
