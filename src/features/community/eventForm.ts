import type { CreateEventInput } from '../../lib/db';

export interface EventFormValues {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

export const EMPTY_EVENT_FORM: EventFormValues = {
  title: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
};

function toLocalIso(dateValue: string, timeValue: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date.toISOString();
}

export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {};
  if (!values.title.trim()) errors.title = 'Enter an event title.';
  if (!values.description.trim()) errors.description = 'Enter an event description.';
  if (!values.location.trim()) errors.location = 'Enter an event location.';
  if (!toLocalIso(values.startDate, values.startTime)) {
    errors.startDate = 'Enter a valid start date and time.';
    errors.startTime = 'Use YYYY-MM-DD and 24-hour HH:MM.';
  }

  const hasEndDate = Boolean(values.endDate.trim());
  const hasEndTime = Boolean(values.endTime.trim());
  if (hasEndDate !== hasEndTime) {
    errors.endDate = 'Enter both end date and time, or leave both blank.';
    errors.endTime = 'Enter both end date and time, or leave both blank.';
  } else if (hasEndDate && hasEndTime) {
    const start = toLocalIso(values.startDate, values.startTime);
    const end = toLocalIso(values.endDate, values.endTime);
    if (!end) {
      errors.endDate = 'Enter a valid end date and time.';
      errors.endTime = 'Use YYYY-MM-DD and 24-hour HH:MM.';
    } else if (start && new Date(end).getTime() < new Date(start).getTime()) {
      errors.endDate = 'End date and time must be at or after the start.';
      errors.endTime = 'End date and time must be at or after the start.';
    }
  }

  return errors;
}

export function toCreateEventInput(values: EventFormValues): CreateEventInput | null {
  if (Object.keys(validateEventForm(values)).length > 0) return null;

  const startTime = toLocalIso(values.startDate, values.startTime);
  if (!startTime) return null;

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    startTime,
    endTime: values.endDate.trim() ? toLocalIso(values.endDate, values.endTime) : null,
  };
}
