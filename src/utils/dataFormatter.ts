import { DataBinding } from '../lib/types';

export function formatDataValue(value: unknown, binding: DataBinding): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  const { format, prefix = '', suffix = '', dateFormat, currencySymbol = '$', decimalPlaces = 2 } = binding;

  switch (format) {
    case 'currency': {
      const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(numValue)) return stringValue;
      return `${prefix}${currencySymbol}${numValue.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
    }

    case 'date': {
      const date = new Date(stringValue);
      if (isNaN(date.getTime())) return stringValue;

      if (dateFormat) {
        return `${prefix}${formatDate(date, dateFormat)}${suffix}`;
      }
      return `${prefix}${date.toLocaleDateString()}${suffix}`;
    }

    case 'number': {
      const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(numValue)) return stringValue;
      return `${prefix}${numValue.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
    }

    case 'percentage': {
      const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      if (isNaN(numValue)) return stringValue;
      return `${prefix}${numValue.toFixed(decimalPlaces)}%${suffix}`;
    }

    case 'none':
    default:
      return `${prefix}${stringValue}${suffix}`;
  }
}

function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('YY', String(year).slice(-2))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatMultipleBindings(
  dataRow: Record<string, unknown>,
  bindings: DataBinding[],
  separator: string = ' '
): string {
  return bindings
    .map(binding => {
      const value = dataRow[binding.field];
      return formatDataValue(value, binding);
    })
    .filter(v => v !== '')
    .join(separator);
}
