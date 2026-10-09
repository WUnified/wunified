import type { CreateMarketplaceListingInput } from './types';

export interface ListingFormValues {
  title: string;
  description: string;
  price: string;
  category: CreateMarketplaceListingInput['category'];
  condition: string;
}

export type ListingFormErrors = Partial<Record<'title' | 'description' | 'price', string>>;

const MAX_PRICE_INTEGER = '99999999';
const PRICE_ERROR = 'Enter a price from $0 to $99,999,999.99 with up to 2 decimal places.';

function isValidPrice(value: string): boolean {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match || !Number.isFinite(Number(value))) {
    return false;
  }

  const integerPart = match[1].replace(/^0+(?=\d)/, '');
  const fractionalPart = match[2] ?? '';
  const isWithinIntegerLimit =
    integerPart.length < MAX_PRICE_INTEGER.length ||
    (integerPart.length === MAX_PRICE_INTEGER.length && integerPart <= MAX_PRICE_INTEGER);

  return isWithinIntegerLimit && fractionalPart.length <= 2;
}

export function validateListingForm(values: ListingFormValues): ListingFormErrors {
  const errors: ListingFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Enter a listing title.';
  }

  if (!values.description.trim()) {
    errors.description = 'Enter a description.';
  }

  if (!isValidPrice(values.price)) {
    errors.price = PRICE_ERROR;
  }

  return errors;
}

export function toCreateListingInput(
  values: ListingFormValues,
): CreateMarketplaceListingInput | null {
  if (Object.keys(validateListingForm(values)).length > 0) {
    return null;
  }

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    category: values.category,
    condition: values.condition.trim() || null,
  };
}
