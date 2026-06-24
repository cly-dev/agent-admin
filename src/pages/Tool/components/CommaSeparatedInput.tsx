import { Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  formatCommaSeparatedList,
  parseCommaSeparatedList,
} from '../toolAgentMetadata';

const { TextArea } = Input;

type CommaSeparatedInputProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
};

function valueKey(values: string[] | undefined): string {
  return (values ?? []).join('\0');
}

export default function CommaSeparatedInput({
  value,
  onChange,
  disabled,
  placeholder,
  multiline = false,
}: CommaSeparatedInputProps) {
  const [text, setText] = useState(() => formatCommaSeparatedList(value));
  const lastExternalKey = useRef(valueKey(value));

  useEffect(() => {
    const key = valueKey(value);
    if (key !== lastExternalKey.current) {
      lastExternalKey.current = key;
      setText(formatCommaSeparatedList(value));
    }
  }, [value]);

  const handleChange = (nextText: string) => {
    setText(nextText);
    const parsed = parseCommaSeparatedList(nextText);
    lastExternalKey.current = valueKey(parsed);
    onChange?.(parsed);
  };

  if (multiline) {
    return (
      <TextArea
        rows={2}
        className="app-input"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
      />
    );
  }

  return (
    <Input
      className="app-input"
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => handleChange(event.target.value)}
    />
  );
}
