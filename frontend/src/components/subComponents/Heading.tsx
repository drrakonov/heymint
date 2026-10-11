type HeadingProps = {
  label: React.ReactNode;
};

export function Heading({ label }: HeadingProps) {
    return <div className="font-bold text-2xl md:text-3xl lg:text-4xl pt-6">
      {label}
    </div>
}