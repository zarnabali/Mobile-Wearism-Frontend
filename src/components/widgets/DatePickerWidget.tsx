import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  mode?: 'date' | 'datetime' | 'time';
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePickerWidget: React.FC<DatePickerWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = 'Select date',
  mode = 'date',
  minimumDate,
  maximumDate,
}) => {
  const pad = (num: number) => num.toString().padStart(2, '0');

  const parseValueToDate = (input: string): Date | null => {
    if (!input) return null;

    if (mode === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [year, month, day] = input.split('-').map((part) => Number(part));
      const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }

    if (mode === 'time' && /^\d{2}:\d{2}$/.test(input)) {
      const [hour, minute] = input.split(':').map((part) => Number(part));
      const base = new Date();
      base.setHours(hour, minute, 0, 0);
      return base;
    }

    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const initialDate = parseValueToDate(value) || new Date();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parseValueToDate(value));
  const [tempDate, setTempDate] = useState<Date>(initialDate);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [tempHour, setTempHour] = useState<number>(initialDate.getHours());
  const [tempMinute, setTempMinute] = useState<number>(initialDate.getMinutes());
  const [viewMode, setViewMode] = useState<'calendar' | 'picker'>('calendar');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  useEffect(() => {
    const parsed = parseValueToDate(value);
    const base = parsed || new Date();

    setSelectedDate(parsed);
    setTempDate(base);
    setTempHour(base.getHours());
    setTempMinute(base.getMinutes());
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [value]);

  const minDate = useMemo(() => {
    if (!minimumDate) return null;
    const d = new Date(minimumDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minimumDate]);

  const maxDate = useMemo(() => {
    if (!maximumDate) return null;
    const d = new Date(maximumDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maximumDate]);

  const sameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) {
      return placeholder;
    }

    if (mode === 'time') {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (mode === 'datetime') {
      return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatValueForSubmit = (date: Date) => {
    if (mode === 'time') {
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    if (mode === 'date') {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    return date.toISOString();
  };

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; currentMonth: boolean }> = [];
    const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startDayIndex = firstDayOfMonth.getDay();

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - startDayIndex);

    for (let i = 0; i < 42; i += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        currentMonth: date.getMonth() === visibleMonth.getMonth(),
      });
    }

    return days;
  }, [visibleMonth]);

  const calendarWeeks = useMemo(() => {
    const weeks: Array<Array<{ date: Date; currentMonth: boolean }>> = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleSelectDay = (day: Date, isCurrentMonth: boolean) => {
    const nextVisibleMonth = new Date(day.getFullYear(), day.getMonth(), 1);
    if (!isCurrentMonth) {
      setVisibleMonth(nextVisibleMonth);
    }

    const base = new Date(tempDate || new Date());
    base.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    if (mode === 'date') {
      base.setHours(0, 0, 0, 0);
    } else {
      base.setHours(tempHour, tempMinute, 0, 0);
    }
    setTempDate(base);
  };

  const adjustHour = (delta: number) => {
    setTempHour((prev) => {
      const next = (prev + delta + 24) % 24;
      setTempDate((prevDate) => {
        const updated = new Date(prevDate || new Date());
        updated.setHours(next, tempMinute, 0, 0);
        return updated;
      });
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    setTempMinute((prev) => {
      const next = (prev + delta + 60) % 60;
      setTempDate((prevDate) => {
        const updated = new Date(prevDate || new Date());
        updated.setHours(tempHour, next, 0, 0);
        return updated;
      });
      return next;
    });
  };

  const handleToday = () => {
    const today = new Date();
    if (mode === 'date') {
      today.setHours(0, 0, 0, 0);
    } else {
      today.setSeconds(0, 0);
    }
    setTempDate(today);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setTempHour(today.getHours());
    setTempMinute(today.getMinutes());
  };

  const handleConfirm = (overrideDate?: Date) => {
    const workingDate = new Date(overrideDate || tempDate || new Date());

    if (mode === 'time') {
      workingDate.setHours(tempHour, tempMinute, 0, 0);
    } else if (mode === 'datetime') {
      workingDate.setHours(tempHour, tempMinute, 0, 0);
    } else {
      workingDate.setHours(0, 0, 0, 0);
    }

    setSelectedDate(new Date(workingDate));
    setTempDate(new Date(workingDate));
    if (mode === 'date') {
      setTempHour(0);
      setTempMinute(0);
    } else {
      setTempHour(workingDate.getHours());
      setTempMinute(workingDate.getMinutes());
    }
    onChangeText(formatValueForSubmit(workingDate));
    setIsExpanded(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    const now = new Date();
    if (mode === 'date') {
      now.setHours(0, 0, 0, 0);
    } else {
      now.setSeconds(0, 0);
    }
    setTempDate(now);
    setTempHour(now.getHours());
    setTempMinute(now.getMinutes());
    onChangeText('');
    setIsExpanded(false);
  };

  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
    const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;
    const years: number[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year);
    }
    return years;
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(visibleMonth);
    newDate.setFullYear(year);
    setVisibleMonth(newDate);
    const updatedTempDate = new Date(tempDate);
    updatedTempDate.setFullYear(year);
    // Adjust day if it's invalid for the new year (e.g., Feb 29 in non-leap year)
    const daysInMonth = new Date(year, updatedTempDate.getMonth() + 1, 0).getDate();
    if (updatedTempDate.getDate() > daysInMonth) {
      updatedTempDate.setDate(daysInMonth);
    }
    setTempDate(updatedTempDate);
    setShowYearDropdown(false);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(visibleMonth);
    newDate.setMonth(month);
    setVisibleMonth(newDate);
    const updatedTempDate = new Date(tempDate);
    updatedTempDate.setMonth(month);
    // Adjust day if it's invalid for the new month (e.g., Feb 31 -> Feb 28/29)
    const daysInMonth = new Date(updatedTempDate.getFullYear(), month + 1, 0).getDate();
    if (updatedTempDate.getDate() > daysInMonth) {
      updatedTempDate.setDate(daysInMonth);
    }
    setTempDate(updatedTempDate);
    setShowMonthDropdown(false);
  };

  const handleDaySelect = (day: number) => {
    const updatedTempDate = new Date(tempDate);
    updatedTempDate.setDate(day);
    if (mode === 'date') {
      updatedTempDate.setHours(0, 0, 0, 0);
    } else {
      updatedTempDate.setHours(tempHour, tempMinute, 0, 0);
    }
    setTempDate(updatedTempDate);
    setShowDayDropdown(false);
  };

  const getAvailableDays = (): number[] => {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const testDate = new Date(year, month, day);
      if (!isDateDisabled(testDate)) {
        days.push(day);
      }
    }
    return days;
  };

  const getAvailableMonths = (): Array<{ value: number; label: string }> => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map((label, index) => ({ value: index, label }));
  };

  const monthLabel = visibleMonth.toLocaleString([], {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="mb-5">
      {label && (
        <Text className="text-white text-base font-semibold mb-2">
          {label}
          {required && <Text className="text-red-400"> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.8}
        className={`flex-row items-center rounded-xl px-4 py-4 bg-gray-800/60 border ${
          error ? 'border-red-500/60' : 'border-gray-700/50'
        }`}
      >
        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
        <Text className={`flex-1 text-white ml-3 ${selectedDate ? '' : 'text-gray-400'}`}>
          {formatDisplayDate(selectedDate)}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}

      {isExpanded && (
        <View className="mt-4 bg-gray-900/90 border border-gray-700/60 rounded-2xl p-4">
          {mode !== 'time' && (
            <>
              {/* View Toggle and Today Button */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row" style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded-lg border ${
                      viewMode === 'calendar'
                        ? 'bg-blue-600/30 border-blue-500/50'
                        : 'bg-gray-800/60 border-gray-700/40'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        viewMode === 'calendar' ? 'text-blue-400' : 'text-gray-400'
                      }`}
                    >
                      Calendar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('picker')}
                    className={`px-4 py-2 rounded-lg border ${
                      viewMode === 'picker'
                        ? 'bg-blue-600/30 border-blue-500/50'
                        : 'bg-gray-800/60 border-gray-700/40'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        viewMode === 'picker' ? 'text-blue-400' : 'text-gray-400'
                      }`}
                    >
                      Date Picker
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleToday}
                  className="px-4 py-2 rounded-lg bg-blue-600/30 border border-blue-500/40"
                  activeOpacity={0.8}
                >
                  <Text className="text-blue-400 text-sm font-semibold">Today</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <View>
                  {/* Month/Year Navigation */}
                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      onPress={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-800/80 items-center justify-center border border-gray-700/60"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Text className="text-white font-semibold text-base">{monthLabel}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-800/80 items-center justify-center border border-gray-700/60"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Calendar Grid */}
                  <View className="flex-row justify-between mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <Text key={day} className="text-gray-400 text-xs flex-1 text-center">
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View className="mt-1">
                    {calendarWeeks.map((week, weekIndex) => (
                      <View key={`week-${weekIndex}`} className="flex-row">
                        {week.map(({ date, currentMonth }) => {
                          const disabled = isDateDisabled(date);
                          const isActive = sameDay(date, tempDate);
                          const isSaved = sameDay(date, selectedDate);
                          const isToday = sameDay(date, new Date());

                          return (
                            <TouchableOpacity
                              key={date.toISOString()}
                              disabled={disabled}
                              onPress={() => handleSelectDay(date, currentMonth)}
                              className={`flex-1 aspect-square mx-[2px] my-[1px] rounded-xl items-center justify-center ${
                                disabled
                                  ? 'bg-gray-800/30'
                                  : isActive
                                  ? 'bg-blue-600 border border-blue-400'
                                  : currentMonth
                                  ? 'bg-gray-800/70 border border-gray-700/40'
                                  : 'bg-gray-800/40 border border-gray-700/20'
                              }`}
                              activeOpacity={0.8}
                            >
                              <Text
                                className={`text-xs ${
                                  disabled
                                    ? 'text-gray-600'
                                    : isActive
                                    ? 'text-white font-semibold'
                                    : currentMonth
                                    ? 'text-white'
                                    : 'text-gray-500'
                                }`}
                              >
                                {date.getDate()}
                              </Text>
                              {isToday && !disabled && !isActive && (
                                <View className="w-1 h-1 rounded-full bg-blue-400 mt-1" />
                              )}
                              {isSaved && !isActive && (
                                <View className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Date Picker View (Dropdowns) */}
              {viewMode === 'picker' && (
                <View>
                  {/* Year Dropdown */}
                  <View className="mb-4">
                    <Text className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                      Year
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowYearDropdown(!showYearDropdown);
                        setShowMonthDropdown(false);
                        setShowDayDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700/60"
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-semibold text-base">
                        {tempDate.getFullYear()}
                      </Text>
                      <Ionicons
                        name={showYearDropdown ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    {showYearDropdown && (
                      <View className="mt-2 bg-gray-800/90 rounded-xl border border-gray-700/60 max-h-48">
                        <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 4 }}>
                          {getAvailableYears().map((year) => {
                            const isSelected = year === tempDate.getFullYear();
                            const isCurrentYear = year === new Date().getFullYear();
                            return (
                              <TouchableOpacity
                                key={year}
                                onPress={() => handleYearSelect(year)}
                                className={`px-4 py-3 border-b border-gray-700/40 ${
                                  isSelected
                                    ? 'bg-blue-600/30'
                                    : isCurrentYear
                                    ? 'bg-blue-600/10'
                                    : ''
                                }`}
                                activeOpacity={0.8}
                              >
                                <Text
                                  className={`${
                                    isSelected
                                      ? 'text-blue-400 font-bold'
                                      : isCurrentYear
                                      ? 'text-blue-300 font-semibold'
                                      : 'text-white'
                                  }`}
                                >
                                  {year}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Month Dropdown */}
                  <View className="mb-4">
                    <Text className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                      Month
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowMonthDropdown(!showMonthDropdown);
                        setShowYearDropdown(false);
                        setShowDayDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700/60"
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-semibold text-base">
                        {tempDate.toLocaleString([], { month: 'long' })}
                      </Text>
                      <Ionicons
                        name={showMonthDropdown ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    {showMonthDropdown && (
                      <View className="mt-2 bg-gray-800/90 rounded-xl border border-gray-700/60 max-h-48">
                        <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 4 }}>
                          {getAvailableMonths().map(({ value, label }) => {
                            const isSelected = value === tempDate.getMonth();
                            return (
                              <TouchableOpacity
                                key={value}
                                onPress={() => handleMonthSelect(value)}
                                className={`px-4 py-3 border-b border-gray-700/40 ${
                                  isSelected ? 'bg-blue-600/30' : ''
                                }`}
                                activeOpacity={0.8}
                              >
                                <Text
                                  className={`${
                                    isSelected ? 'text-blue-400 font-bold' : 'text-white'
                                  }`}
                                >
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Day Dropdown */}
                  <View className="mb-0">
                    <Text className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                      Day
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDayDropdown(!showDayDropdown);
                        setShowYearDropdown(false);
                        setShowMonthDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700/60"
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-semibold text-base">
                        {tempDate.getDate()}
                      </Text>
                      <Ionicons
                        name={showDayDropdown ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    {showDayDropdown && (
                      <View className="mt-2 bg-gray-800/90 rounded-xl border border-gray-700/60 max-h-48">
                        <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 4 }}>
                          {getAvailableDays().map((day) => {
                            const isSelected = day === tempDate.getDate();
                            return (
                              <TouchableOpacity
                                key={day}
                                onPress={() => handleDaySelect(day)}
                                className={`px-4 py-3 border-b border-gray-700/40 ${
                                  isSelected ? 'bg-blue-600/30' : ''
                                }`}
                                activeOpacity={0.8}
                              >
                                <Text
                                  className={`${
                                    isSelected ? 'text-blue-400 font-bold' : 'text-white'
                                  }`}
                                >
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          {(mode === 'time' || mode === 'datetime') && (
            <View className="mt-4">
              <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
                Select Time
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center justify-between bg-gray-800/80 rounded-xl border border-gray-700/60">
                    <TouchableOpacity
                      onPress={() => adjustHour(-1)}
                      className="w-12 h-12 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">
                      {tempHour.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => adjustHour(1)}
                      className="w-12 h-12 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-up" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-xs mt-2 text-center">Hour</Text>
                </View>

                <View className="w-10 items-center">
                  <Text className="text-white text-xl font-semibold">:</Text>
                </View>

                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between bg-gray-800/80 rounded-xl border border-gray-700/60">
                    <TouchableOpacity
                      onPress={() => adjustMinute(-1)}
                      className="w-12 h-12 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">
                      {tempMinute.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => adjustMinute(1)}
                      className="w-12 h-12 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-up" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-xs mt-2 text-center">Minute</Text>
                </View>
              </View>
            </View>
          )}

          <View className="bg-blue-600/20 rounded-xl p-4 mt-4 border border-blue-500/30">
            <Text className="text-gray-300 text-xs uppercase tracking-wider mb-1">
              Selected
            </Text>
            <Text className="text-white font-semibold text-base">
              {formatDisplayDate(selectedDate || tempDate)}
            </Text>
          </View>

          <View className="flex-row mt-4" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleClear}
              className="flex-1 bg-gray-800/80 rounded-xl py-3 items-center border border-gray-700/60"
              activeOpacity={0.8}
            >
              <Text className="text-gray-200 font-semibold text-sm">Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleConfirm()}
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center border border-blue-500/40"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default DatePickerWidget;

