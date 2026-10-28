type InputBoxProps = {
  placeholder: string;
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function InputBox({type, placeholder, value, onChange}: InputBoxProps) {
    return <div className="py-2">
      <input placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      className="glass-input w-full px-4 py-2" />
    </div>
}
