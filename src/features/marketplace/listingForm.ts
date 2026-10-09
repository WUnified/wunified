import type { CreateMarketplaceListingInput } from './types';

export interface ListingFormValues {
  title: string;
  description: string;
  price: string;
  category: CreateMarketplaceListingInput['category'];
  condition: string;
}

export type ListingFormErrors = Partial<Record<'title' | 'description' | 'price', string>>;

export function validateListingForm(values: ListingFormValues): ListingFormErrors {
  const errors: ListingFormErrors = {};
  const parsedPrice = Number(values.price);

  if (!values.title.trim()) {
    errors.title = 'Enter a listing title.';
  }

  if (!values.description.trim()) {
    errors.description = 'Enter a description.';
  }

  if (!values.price.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
    errors.price = 'Enter a valid price of $0 or more.';
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
