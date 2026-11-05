import { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { styles } from './CommunityEventsCalendar.styles';
import { IconButton } from '../../../components/IconButton';
import type { CommunityEvent } from '../events.types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

interface CommunityEventsCalendarProps {
  events: CommunityEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function getCalendarDays(month: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstOfMonth.getDay() + dayCount) / 7) * 7;
  const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - firstOfMonth.getDay());

  return Array.from(
    { length: cellCount },
    (_, index) =>
      new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index),
  );
}

function isSameDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function hasEvent(date: Date, events: CommunityEvent[]) {
  return events.some((event) => {
    const startsAt = new Date(event.startTime);
    return isSameDate(date, startsAt);
  });
}

export function CommunityEventsCalendar({
  events,
  selectedDate,
  onSelectDate,
}: CommunityEventsCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  function changeMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

    setVisibleMonth(nextMonth);
    onSelectDate(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDate.getDate(), lastDay),
      ),
    );
  }

  function selectDate(date: Date) {
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onSelectDate(date);
  }

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </Text>
        <View style={styles.navigation}>
          <IconButton
            accessibilityLabel="Previous month"
            buttonStyle={styles.navigationButton}
            iconSource={
              require('../../../../assets/community/chevron-left.png') as ImageSourcePropType
            }
            iconStyle={styles.navigationIcon}
            onPress={() => changeMonth(-1)}
          />
          <IconButton
            accessibilityLabel="Next month"
            buttonStyle={styles.navigationButton}
            iconSource={
              require('../../../../assets/community/chevron-right.png') as ImageSourcePropType
            }
            iconStyle={styles.navigationIcon}
            onPress={() => changeMonth(1)}
          />
        </View>
      </View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={styles.weekday}>
            {weekday}
          </Text>
        ))}
      </View>
      <View style={styles.days}>
        {calendarDays.map((date) => {
          const isSelected = isSameDate(date, selectedDate);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const accessibilityDate = `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

          return (
            <View
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              style={styles.daySlot}
            >
              <Pressable
                accessibilityLabel={`Select ${accessibilityDate}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => selectDate(date)}
                style={({ pressed }) => [
                  styles.dayButton,
                  isSelected && styles.selectedDay,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !isCurrentMonth && styles.outsideMonth,
                    isSelected && styles.selectedDayNumber,
                    hasEvent(date, events) && styles.eventDayNumber,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {hasEvent(date, events) ? (
                  <Image
                    accessible={false}
                    accessibilityIgnoresInvertColors
                    source={
                      require('../../../../assets/community/event-dot.png') as ImageSourcePropType
                    }
                    style={styles.eventDot}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
