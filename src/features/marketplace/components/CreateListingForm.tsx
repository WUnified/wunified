import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { styles } from './CreateListingForm.styles';
import { Colors } from '../../../constants/colors';
import { toCreateListingInput, validateListingForm } from '../listingForm';
import type { ListingFormErrors, ListingFormValues } from '../listingForm';
import { getMarketplaceCategoryLabel } from '../presentation';
import { MARKETPLACE_CATEGORIES } from '../types';
import type { CreateMarketplaceListingInput } from '../types';

interface CreateListingFormProps {
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: CreateMarketplaceListingInput) => Promise<boolean>;
}

const INITIAL_VALUES: ListingFormValues = {
  title: '',
  description: '',
  price: '',
  category: 'general',
  condition: '',
};

export function CreateListingForm({ saving, error, onCancel, onSubmit }: CreateListingFormProps) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ListingFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const updateValue = <Key extends keyof ListingFormValues>(
    key: Key,
    value: ListingFormValues[Key],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    const validationErrors = validateListingForm(values);
    setFieldErrors(validationErrors);

    const input = toCreateListingInput(values);
    if (!input) {
      return;
    }

    const wasCreated = await onSubmit(input);
    if (wasCreated) {
      onCancel();
    }
  };

  const handleFieldChange = <Key extends keyof ListingFormValues>(
    key: Key,
    value: ListingFormValues[Key],
  ) => {
    updateValue(key, value);
    if (hasAttemptedSubmit) {
      setFieldErrors(validateListingForm({ ...values, [key]: value }));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create listing</Text>
      <Text style={styles.fieldLabel}>Title</Text>
      <TextInput
        accessibilityLabel="Listing title"
        editable={!saving}
        maxLength={100}
        onChangeText={(value) => handleFieldChange('title', value)}
        placeholder="What are you selling?"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        value={values.title}
      />
      {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        accessibilityLabel="Listing description"
        editable={!saving}
        multiline
        onChangeText={(value) => handleFieldChange('description', value)}
        placeholder="Add useful details for buyers"
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, styles.descriptionInput]}
        value={values.description}
      />
      {fieldErrors.description ? (
        <Text style={styles.fieldError}>{fieldErrors.description}</Text>
      ) : null}

      <Text style={styles.fieldLabel}>Price</Text>
      <TextInput
        accessibilityLabel="Listing price"
        editable={!saving}
        inputMode="decimal"
        keyboardType="decimal-pad"
        onChangeText={(value) => handleFieldChange('price', value)}
        placeholder="0.00"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        value={values.price}
      />
      {fieldErrors.price ? <Text style={styles.fieldError}>{fieldErrors.price}</Text> : null}

      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.categoryChoices}>
        {MARKETPLACE_CATEGORIES.map((category) => {
          const isSelected = category === values.category;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={category}
              onPress={() => handleFieldChange('category', category)}
              style={[styles.categoryChoice, isSelected && styles.categoryChoiceSelected]}
            >
              <Text
                style={[
                  styles.categoryChoiceLabel,
                  isSelected && styles.categoryChoiceLabelSelected,
                ]}
              >
                {getMarketplaceCategoryLabel(category)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>
        Condition <Text style={styles.optionalLabel}>Optional</Text>
      </Text>
      <TextInput
        accessibilityLabel="Listing condition, optional"
        editable={!saving}
        maxLength={80}
        onChangeText={(value) => handleFieldChange('condition', value)}
        placeholder="e.g. Like new"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        value={values.condition}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.pressed]}
        >
          <Text style={styles.submitLabel}>{saving ? 'Publishing…' : 'Publish listing'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
