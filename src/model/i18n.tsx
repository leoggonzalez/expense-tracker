import { I18n, TranslateOptions } from 'i18n-js';
import React, { ReactElement } from 'react';

import en from '../locales/en.json';

type Interpolate = (i18n: I18n, message: string, options: TranslateOptions) => string | React.ReactElement;
interface CustomI18n extends Omit<I18n, 'interpolate'> {
  interpolate: Interpolate;
}

export const i18n = new I18n({ en }) as CustomI18n;
i18n.locale = 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.transformKey = (key: string) => key;
i18n.interpolate = (i18n, message, options) => {
  options = Object.keys(options).reduce((buffer, key) => {
    buffer[i18n.transformKey(key)] = options[key];
    return buffer;
  }, {} as TranslateOptions);
  const matches = message.match(i18n.placeholder);

  if (!matches) {
    return message;
  }

  // split original message into parts with the matches as separators
  const parts: Array<string | ReactElement> = message.split(i18n.placeholder);

  matches.forEach((match) => {
    let value: string;
    const placeholder = match as string;
    const name = placeholder.replace(i18n.placeholder, '$1');

    if (options[name] !== undefined && options[name] !== null) {
      if (typeof options[name] === 'string') {
        value = options[name].toString().replace(/\$/gm, '_#$#_');
      } else {
        value = options[name];
      }
    } else if (name in options) {
      value = i18n.nullPlaceholder(i18n, placeholder, message, options);
    } else {
      value = i18n.missingPlaceholder(i18n, placeholder, message, options);
    }

    const index = parts.findIndex((part) => part === name);

    if (typeof options[name] === 'string') {
      parts[index] = value;
    } else {
      parts[index] = <React.Fragment key={index}>{value}</React.Fragment>;
    }
  });

  if (parts.every((part) => typeof part === 'string')) {
    return parts.join('');
  } else {
    return <>{parts}</>;
  }
};

export const formatterLocale = 'de';

export function formatError(error: string): string {
  const errorMessage = i18n.t(`errors.${error}`);

  if (errorMessage.includes('missing') && errorMessage.includes('translation')) {
    return error;
  }
  return errorMessage;
}