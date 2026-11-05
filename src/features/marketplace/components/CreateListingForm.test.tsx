import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreateListingForm } from './CreateListingForm';
import type { MarketplaceListing } from '../types';

function comparable(id: string, title: string, price: number): MarketplaceListing {
  return {
    id,
    sellerId: 'seller-1',
    title,
    description: '',
    category: 'general',
    price,
    condition: null,
    status: 'active',
    images: [],
    createdAt: '2026-11-05T12:00:00.000Z',
    updatedAt: '2026-11-05T12:00:00.000Z',
    seller: {
      userId: 'seller-1',
      username: 'sam',
      displayName: 'Sam',
      avatar: null,
      wsuVerified: true,
    },
  };
}

describe('CreateListingForm', () => {
  it('does not submit missing required values and shows field errors', () => {
    const onSubmit = jest.fn((_input: unknown) => Promise.resolve(true));
    const { getByRole, getByText } = render(
      <CreateListingForm error={null} onCancel={jest.fn()} onSubmit={onSubmit} saving={false} />,
    );

    fireEvent.press(getByRole('button', { name: 'Publish listing' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText('Enter a listing title.')).toBeTruthy();
    expect(getByText('Enter a description.')).toBeTruthy();
    expect(
      getByText('Enter a price from $0 to $99,999,999.99 with up to 2 decimal places.'),
    ).toBeTruthy();
  });

  it('submits validated values and closes only after successful creation', async () => {
    const onCancel = jest.fn();
    const onSubmit = jest.fn((_input: unknown) => Promise.resolve(true));
    const { getByLabelText, getByRole } = render(
      <CreateListingForm error={null} onCancel={onCancel} onSubmit={onSubmit} saving={false} />,
    );

    fireEvent.changeText(getByLabelText('Listing title'), 'Desk lamp');
    fireEvent.changeText(getByLabelText('Listing description'), 'Works well');
    fireEvent.changeText(getByLabelText('Listing price'), '12.50');
    fireEvent.press(getByRole('button', { name: 'Publish listing' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Desk lamp',
        description: 'Works well',
        price: 12.5,
        category: 'general',
        condition: null,
      });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('preserves entered values and displays server errors on failure', async () => {
    const onCancel = jest.fn();
    const onSubmit = jest.fn(() => Promise.resolve(false));
    const { getByLabelText, getByRole, getByText } = render(
      <CreateListingForm
        error="You must be signed in to create a listing."
        onCancel={onCancel}
        onSubmit={onSubmit}
        saving={false}
      />,
    );

    fireEvent.changeText(getByLabelText('Listing title'), 'Desk lamp');
    fireEvent.changeText(getByLabelText('Listing description'), 'Works well');
    fireEvent.changeText(getByLabelText('Listing price'), '12.50');
    fireEvent.press(getByRole('button', { name: 'Publish listing' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(getByText('You must be signed in to create a listing.')).toBeTruthy();
    expect(getByLabelText('Listing title').props.value).toBe('Desk lamp');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables submission while a create request is in progress', () => {
    const onSubmit = jest.fn(() => Promise.resolve(true));
    const { getByRole } = render(
      <CreateListingForm error={null} onCancel={jest.fn()} onSubmit={onSubmit} saving />,
    );

    expect(getByRole('button', { name: 'Publishing…' }).props.accessibilityState).toEqual({
      disabled: true,
    });
    fireEvent.press(getByRole('button', { name: 'Publishing…' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('suggests a price from similar listings and fills it in on Use', () => {
    const lamps = [
      comparable('a', 'Desk lamp', 15),
      comparable('b', 'Desk lamp with bulb', 20),
      comparable('c', 'LED desk lamp', 25),
    ];
    const { getByLabelText, getByRole, getByText, queryByRole } = render(
      <CreateListingForm
        comparableListings={lamps}
        error={null}
        onCancel={jest.fn()}
        onSubmit={jest.fn((_input: unknown) => Promise.resolve(true))}
        saving={false}
      />,
    );

    // Hidden until the title points at comparable listings.
    expect(queryByRole('button', { name: /Use suggested price/ })).toBeNull();
    fireEvent.changeText(getByLabelText('Listing title'), 'Desk lamp');

    expect(getByText('Similar listings: $18–$23, typically $20 (3 similar)')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Use suggested price $20' }));
    expect(getByLabelText('Listing price').props.value).toBe('20');
  });
});
