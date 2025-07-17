type AuthButtonProps = {
    label: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}
export function AuthBotton({ label, onClick }: AuthButtonProps) {
    return (
        <button
            onClick={onClick}
            type="button"
            className=" w-full text-black bg-primary hover:bg-accent focus:outline-non font-semibold rounded-lg text-sm px-5 py-2.5 me-2 mb-2">
            {label}
        </button>
    )
}