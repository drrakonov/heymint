import { Link } from "react-router-dom"
type BottomWarningProps = {
    label: string;
    buttonText: string;
    to: string
}

export function BottomWarning({label, buttonText, to}: BottomWarningProps) {
    return <div className="flex justify-center py-3 text-sm text-text-secondary">
      <div>
        {label}
      </div>
      <Link className="cursor-pointer pl-1 font-semibold text-primary hover:underline" to={to}>
        {buttonText}
      </Link>
    </div>
}
