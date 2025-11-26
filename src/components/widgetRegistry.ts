import React from 'react';
import TextInputWidget from './widgets/TextInputWidget';
import EmailInputWidget from './widgets/EmailInputWidget';
import PhoneInputWidget from './widgets/PhoneInputWidget';
import AddressInputWidget from './widgets/AddressInputWidget';
import NumberInputWidget from './widgets/NumberInputWidget';
import DropdownWidget from './widgets/DropdownWidget';
import ButtonWidget from './widgets/ButtonWidget';
import DatePickerWidget from './widgets/DatePickerWidget';
import FileUploadWidget from './widgets/FileUploadWidget';
import LookupWidget from './widgets/LookupWidget';
import TextAreaWidget from './widgets/TextAreaWidget';

export type WidgetType =
  | 'TextInput'
  | 'EmailInput'
  | 'PhoneInput'
  | 'AddressInput'
  | 'NumberInput'
  | 'Dropdown'
  | 'Button'
  | 'DatePicker'
  | 'FileUpload'
  | 'Lookup'
  | 'TextArea';

export const WidgetRegistry: Record<string, React.ComponentType<any>> = {
  TextInput: TextInputWidget,
  EmailInput: EmailInputWidget,
  PhoneInput: PhoneInputWidget,
  AddressInput: AddressInputWidget,
  Address: AddressInputWidget, // Alias for AddressInput
  NumberInput: NumberInputWidget,
  Dropdown: DropdownWidget,
  Select: DropdownWidget, // Alias for Dropdown
  Button: ButtonWidget,
  DatePicker: DatePickerWidget,
  DateTimePicker: DatePickerWidget, // Alias for DatePicker with datetime mode
  FileUpload: FileUploadWidget,
  File: FileUploadWidget, // Alias for FileUpload
  Lookup: LookupWidget,
  TextArea: TextAreaWidget,
  Textarea: TextAreaWidget, // Alias for TextArea
};

export const registerWidget = (name: string, component: React.ComponentType<any>) => {
  WidgetRegistry[name] = component;
};

export const getWidget = (type: string): React.ComponentType<any> | null => {
  return WidgetRegistry[type] || null;
};

