import { describe, expect, it } from '@jest/globals';

import { toCreateListingInput, validateListingForm } from './listingForm';
import type { ListingFormValues } from './listingForm';

const validValues: ListingFormValues = {
  title: ' Desk lamp ',
  description: ' Working condition. ',
  price: '12.50',
  category: 'general',
  condition: ' Like new ',
};

describe('listing form validation', () => {
  it('requires a title, description, and finite non-negative price', () => {
    expect(
      validateListingForm({ ...validValues, title: ' ', description: '', price: '-1' }),
    ).toEqual({
      title: 'Enter a listing title.',
      description: 'Enter a description.',
      price: 'Enter a valid price of $0 or more.',
    });
    expect(validateListingForm({ ...validValues, price: 'Infinity' }).price).toBe(
      'Enter a valid price of $0 or more.',
    );
  });

  it('trims text fields and converts valid form values to the backend input', () => {
    expect(validateListingForm(validValues)).toEqual({});
    expect(toCreateListingInput(validValues)).toEqual({
      title: 'Desk lamp',
      description: 'Working condition.',
      price: 12.5,
      category: 'general',
      condition: 'Like new',
    });
  });

  it('allows an empty optional condition', () => {
    expect(toCreateListingInput({ ...validValues, condition: '  ' })?.condition).toBeNull();
  });
});
