import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import FormInput from "../../components/FormInput";
import { useRegisterUser } from "../../hooks";
import type { RegisterUserRequest } from "../../models";
import { useAuthContext } from "../../contexts/AuthContext";
import { AxiosError } from "axios";
import { ToastType, useToast } from "../../components/Toast";

interface FieldState {
    value: any,
    error?: string
}

interface PageState {
    name: FieldState,
    email: FieldState,
    password: FieldState
}

const initialPageState = {
    name: {
        value: "",
    },
    email: {
        value: "",
    },
    password: {
        value: "",
    },
} satisfies PageState;


function RegisterUserPage() {
    const [pageState, setPageState] = useState<PageState>(initialPageState);
    const { mutateAsync, isError, error, isPending } = useRegisterUser();
    const { isAuthenticated } = useAuthContext();
    const { showToast } = useToast()

    const handleChange = useCallback((name: string, value: string) => {
        setPageState((prev) => ({
            ...prev,
            [name]: {
                value,
            },
        }));
    }, [setPageState]);

    const validate = () => {
        const errors: Record<string,string> = {};

        console.log(`pageState: ${JSON.stringify(pageState)}`)

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!pageState.email.value.trim()) {
            errors.email = "Email is required.";
        } else if (!emailRegex.test(pageState.email.value)) {
            errors.email = "Enter a valid email address.";
        }

        // Password
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/;

        if (!pageState.password.value.trim()) {
            errors.password = "Password is required.";
        } else if (!passwordRegex.test(pageState.password.value)) {
            errors.password = "Password does not meet the required criteria.";
        }

        // Name
        const nameRegex = /^[\p{L}\p{N} \t]+$/u;;

        if (!pageState.name.value.trim()) {
            errors.name = "Name is required.";
        } else if (!nameRegex.test(pageState.name.value)) {
            errors.name = "Name can contain only letters and numbers.";
        }

        setPageState((prev) => ({
            ...prev,
            name: {
                ...prev.name,
                ...(errors.name ? { error: errors.name } : {}),
            },
            email: {
                ...prev.email,
                ...(errors.email ? { error: errors.email } : {}),
            },
            password: {
                ...prev.password,
                ...(errors.password ? { error: errors.password } : {}),
            },
        }));

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = useCallback(async (e: React.SubmitEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        const request = {
            name: pageState.name.value,
            email: pageState.email.value,
            password: pageState.password.value,
        } satisfies RegisterUserRequest;

        await mutateAsync(request);

    },[pageState, mutateAsync]);

    useEffect(()=> {
        if (isError) {
            if (error instanceof AxiosError) {
                const statusCode = error.status

                if (error.response) {
                    const { reasons, message } = error.response.data as any;

                    if (statusCode == 400 && reasons) {
                        const { email, password } = reasons as any;
                        setPageState((prev)=> ({
                            ...prev,
                            email: {
                                ...prev.email,
                                ...(email ? { error: email } : {}),
                            },
                            password: {
                                ...prev.password,
                                ...(password ? { error: password } : {}),
                            }
                        }))
                    }
                    else if (message) {
                        showToast(message, ToastType.DANGER, { label: 'Ok' })
                    }
                    else {
                        showToast(error.message || 'something error occurred', ToastType.DANGER, { label: 'Ok' });
                    }
                }
            }
            else {
                showToast(error.message || 'something error occurred', ToastType.DANGER, { label: 'Ok' });
            }
        }
    }, [isError, error, showToast, setPageState])

    if (isAuthenticated) {
        return <Navigate to='/' replace />
    }

    return (
        <main className="min-h-screen bg-drive-bg flex items-center justify-center px-4 py-8">
            <div
                className="
                    w-full max-w-md
                    bg-drive-surface
                    rounded-2xl
                    shadow-lg
                    border border-drive-border
                    px-7 py-8
                    sm:px-9 sm:py-9
                "
            >
                <h1 className="text-center text-2xl font-medium text-drive-text">
                    Register New User
                </h1>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-8"
                >
                    <FormInput
                        name="name"
                        label="Name"
                        type="text"
                        value={pageState.name.value}
                        errorText={pageState.name.error}
                        onChange={(v) => handleChange('name', v)}
                    />

                    <div className="mt-2">
                        <FormInput
                            name="email"
                            label="Email"
                            type="email"
                            value={pageState.email.value}
                            errorText={pageState.email.error}
                            onChange={(v) => handleChange('email',v)}
                        />
                    </div>

                    <div className="mt-2">
                        <FormInput
                            name="password"
                            label="Password"
                            type="password"
                            value={pageState.password.value}
                            errorText={pageState.password.error}
                            onChange={(v) => handleChange('password', v)}
                            supportText="
                                8–16 characters, with at least one uppercase
                                letter, one lowercase letter, one number, and
                                one special character.
                            "
                        />
                    </div>

                    <button
                        type="submit"
                        className="
                            w-full h-11
                            mt-3
                            rounded-lg
                            bg-drive-primary
                            hover:bg-drive-primary-hover
                            text-white
                            font-medium
                            transition-colors
                            cursor-pointer
                            focus:outline-none
                            focus:ring-2
                            focus:ring-drive-primary/30
                        "
                        disabled={isPending}
                    >
                        Register
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-drive-text-muted">
                    have account?{" "}
                    <Link to="/login" className="text-drive-primary hover:underline font-medium">
                        LogIn
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default RegisterUserPage;
