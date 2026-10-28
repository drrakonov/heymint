type AuthButtonProps = {
    label: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
}
export function AuthBotton({ label, onClick, disabled = false }: AuthButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            type="button"
            className="mint-button mb-2 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45">
            {label}
        </button>
    )
}
