import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreateListingForm } from './CreateListingForm';

describe('CreateListingForm', () => {
  it('does not submit missing required values and shows field errors', () => {
    const onSubmit = jest.fn(() => Promise.resolve(true));
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
    const onSubmit = jest.fn(() => Promise.resolve(true));
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
});
