type SubHeadingProps = {
  label: React.ReactNode;
};

export function SubHeading({ label }: SubHeadingProps) {
  return <div className="text-text-secondary text-sm lg:text-lg pt-2 px-4 pb-4">
    {label}
  </div>
}