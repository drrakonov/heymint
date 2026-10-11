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
      className="w-full px-2 py-2 bg-surface focus:border-2 rounded-sm border-border focus:outline-none" />
    </div>
}