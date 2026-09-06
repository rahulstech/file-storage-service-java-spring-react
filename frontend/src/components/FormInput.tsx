import { useCallback } from "react";

interface FormInputProp {
    label: string,
    name: string
    type: string,
    value: string,
    onChange: (newValue: string)=> void,
    errorText?: string,
    supportText?: string,
}


function FormInput({
    label,
    type = "text",
    value,
    onChange,
    errorText,
    supportText,
    name,
}: FormInputProp) {

    const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>)=> {
        const value = e.target.value;
        onChange(value);
    }, [onChange])

    return (
        <div>
            <label
                htmlFor={name}
                className="block text-sm font-medium text-drive-text-subtle mb-2"
            >
                {label}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={handleValueChange}
                className={`
                    w-full h-11 px-3
                    rounded-lg
                    border
                    bg-drive-surface
                    text-drive-text
                    outline-none
                    transition
                    focus:ring-2 focus:ring-drive-primary/20
                    ${
                        errorText
                            ? "border-red-500"
                            : "border-drive-border focus:border-drive-primary"
                    }
                `}
            />

            {supportText && (
                <p className="mt-2 text-xs leading-5 text-drive-text-muted">
                    {supportText}
                </p>
            )}

            {/* Fixed space for error */}
            <div className="min-h-6 pt-1">
                {errorText && (
                    <p className="text-sm text-red-600">
                        {errorText}
                    </p>
                )}
            </div>
        </div>
    );
}

export default FormInput;
