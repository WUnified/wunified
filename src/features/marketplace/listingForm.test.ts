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
  it('requires a title, description, and valid non-negative price', () => {
    expect(
      validateListingForm({ ...validValues, title: ' ', description: '', price: '-1' }),
    ).toEqual({
      title: 'Enter a listing title.',
      description: 'Enter a description.',
      price: 'Enter a price from $0 to $99,999,999.99 with up to 2 decimal places.',
    });
    expect(validateListingForm({ ...validValues, price: 'Infinity' }).price).toBe(
      'Enter a price from $0 to $99,999,999.99 with up to 2 decimal places.',
    );
  });

  it('accepts the database maximum price', () => {
    expect(validateListingForm({ ...validValues, price: '99999999.99' }).price).toBeUndefined();
  });

  it.each(['100000000', '99999999.991', '1.234'])('rejects unsupported price %s', (price) => {
    expect(validateListingForm({ ...validValues, price }).price).toBe(
      'Enter a price from $0 to $99,999,999.99 with up to 2 decimal places.',
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
