'use client';

import React, { useState } from 'react';
import { transliterateText } from '@/lib/transliterate';

interface PhoneticInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  value: string;
  onChangeValue: (val: string) => void;
  helpText?: string;
  enablePhonetic?: boolean;
}

export default function PhoneticInput({
  label,
  required,
  value,
  onChangeValue,
  helpText,
  enablePhonetic = true,
  placeholder,
  ...props
}: PhoneticInputProps) {
  const [isPhoneticOn, setIsPhoneticOn] = useState(enablePhonetic);
  const [rawInput, setRawInput] = useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawInput(raw);

    if (isPhoneticOn) {
      const nepali = transliterateText(raw);
      onChangeValue(nepali);
    } else {
      onChangeValue(raw);
    }
  };

  const togglePhonetic = () => {
    const nextState = !isPhoneticOn;
    setIsPhoneticOn(nextState);
    if (nextState) {
      onChangeValue(transliterateText(rawInput || value));
    } else {
      onChangeValue(rawInput || value);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {enablePhonetic && (
          <button
            type="button"
            onClick={togglePhonetic}
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all ${
              isPhoneticOn
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-400'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            🇳🇵 Phonetic Nepali: {isPhoneticOn ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      <input
        {...props}
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder || (isPhoneticOn ? "Type in Roman English (e.g. 'Binod Shah' -> 'बिनोद शाह')" : '')}
        className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {isPhoneticOn && (
        <p className="text-[11px] text-purple-400 font-medium">
          💡 Type English letters (e.g., <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">Binod Shah</code>) ➔ automatically converts to <strong className="text-emerald-400">बिनोद शाह</strong>
        </p>
      )}

      {helpText && <p className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</p>}
    </div>
  );
}
