import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { styles } from './CreateCommunityEventForm.styles';
import { Colors } from '../../../constants/colors';
import type { CreateEventInput } from '../../../lib/db';
import { EMPTY_EVENT_FORM, toCreateEventInput, validateEventForm } from '../eventForm';
import type { EventFormErrors, EventFormValues } from '../eventForm';

interface CreateCommunityEventFormProps {
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: CreateEventInput) => Promise<boolean>;
}

export function CreateCommunityEventForm({
  saving,
  error,
  onCancel,
  onSubmit,
}: CreateCommunityEventFormProps) {
  const [values, setValues] = useState(EMPTY_EVENT_FORM);
  const [fieldErrors, setFieldErrors] = useState<EventFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  function updateValue<Key extends keyof EventFormValues>(key: Key, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    if (hasAttemptedSubmit) {
      setFieldErrors(validateEventForm({ ...values, [key]: value }));
    }
  }

  async function handleSubmit() {
    setHasAttemptedSubmit(true);
    const nextErrors = validateEventForm(values);
    setFieldErrors(nextErrors);
    const input = toCreateEventInput(values);
    if (!input) return;

    if (await onSubmit(input)) onCancel();
  }

  function renderInput(
    key: keyof EventFormValues,
    label: string,
    placeholder: string,
    required: boolean,
    multiline = false,
  ) {
    const accessibilityLabel = `${label}${required ? '' : ', optional'}`;
    return (
      <View>
        <Text style={styles.fieldLabel}>
          {label}
          {!required ? <Text style={styles.optionalLabel}> (Optional)</Text> : null}
        </Text>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          autoCorrect={false}
          editable={!saving}
          inputMode="text"
          multiline={multiline}
          onChangeText={(value) => updateValue(key, value)}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDim}
          style={[styles.input, multiline && styles.descriptionInput]}
          value={values[key]}
        />
        {fieldErrors[key] ? <Text style={styles.fieldError}>{fieldErrors[key]}</Text> : null}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text accessibilityRole="header" style={styles.title}>
        Create event
      </Text>
      {renderInput('title', 'Title', 'Event name', true)}
      {renderInput('description', 'Description', 'What is happening?', true, true)}
      {renderInput('location', 'Location', 'Where is it?', true)}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          {renderInput('startDate', 'Start date', 'YYYY-MM-DD', true)}
        </View>
        <View style={styles.dateField}>
          {renderInput('startTime', 'Start time', 'HH:MM', true)}
        </View>
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          {renderInput('endDate', 'End date', 'YYYY-MM-DD', false)}
        </View>
        <View style={styles.dateField}>{renderInput('endTime', 'End time', 'HH:MM', false)}</View>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.serverError}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Submit new event"
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
        >
          <Text style={styles.submitLabel}>{saving ? 'Creating…' : 'Create event'}</Text>
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
