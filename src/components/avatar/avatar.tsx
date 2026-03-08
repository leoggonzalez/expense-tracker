import "./avatar.scss";

import React from "react";

type AvatarProps = {
  name: string;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return "--";
}

export function Avatar({ name }: AvatarProps): React.ReactElement {
  const initials = getInitials(name);

  return (
    <span className="avatar" aria-label={name} title={name}>
      {initials}
    </span>
  );
}
