type InputBoxProps = {
  placeholder: string;
  type: string
};

export function InputBox({type, placeholder}: InputBoxProps) {
    return <div className="py-2">
      <input placeholder={placeholder}
      type={type}
      className="w-full px-2 py-2 bg-surface focus:border-2 rounded-sm border-border focus:outline-none" />
    </div>
}