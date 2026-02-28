"use client";

import React, { useState, useRef, useEffect } from "react";
import "./autocomplete.scss";

export interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function Autocomplete({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  className = "",
}: AutocompleteProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredOptions(filtered);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`autocomplete ${className}`.trim()} ref={containerRef}>
      {label && (
        <label className="autocomplete__label">
          {label}
          {required && <span className="autocomplete__required">*</span>}
        </label>
      )}
      <div className="autocomplete__input-wrapper">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="autocomplete__input"
          autoComplete="off"
        />
        {isOpen && filteredOptions.length > 0 && (
          <ul className="autocomplete__dropdown">
            {filteredOptions.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="autocomplete__option"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
