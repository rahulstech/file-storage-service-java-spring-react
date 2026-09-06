import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AxiosError } from "axios";

import FormInput from "../../components/FormInput";
import { useUserLogIn } from "../../hooks";
import type { FieldState, UserLogInRequest } from "../../models";
import { useAuthContext } from "../../contexts/AuthContext";
import { ToastType, useToast } from "../../components/Toast";


interface PageState {
    email: FieldState;
    password: FieldState;
}


const initialPageState = {
    email: {
        value: "",
    },
    password: {
        value: "",
    },
} satisfies PageState;


function UserLogInPage() {
    const [pageState, setPageState] = useState<PageState>(initialPageState);

    const {
        mutateAsync,
        isError,
        error,
        isPending,
    } = useUserLogIn();

    const { isAuthenticated } = useAuthContext();

    const { showToast } = useToast();

    const handleChange = (name: string, value: string) => {
        setPageState((prev) => ({
            ...prev,
            [name]: {
                value,
            },
        }));
    };


    const validate = () => {
        const errors: Record<string, string> = {};

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!pageState.email.value.trim()) {
            errors.email = "Email is required.";
        } else if (!emailRegex.test(pageState.email.value)) {
            errors.email = "Enter a valid email address.";
        }


        // Password
        if (!pageState.password.value) {
            errors.password = "Password is required.";
        }


        setPageState((prev) => ({
            ...prev,

            email: {
                ...prev.email,
                ...(errors.email
                    ? { error: errors.email }
                    : {}),
            },

            password: {
                ...prev.password,
                ...(errors.password
                    ? { error: errors.password }
                    : {}),
            },
        }));

        return Object.keys(errors).length === 0;
    };


    const handleSubmit = useCallback(
        async (e: React.SubmitEvent) => {
            e.preventDefault();

            if (!validate()) {
                return;
            }

            const request = {
                email: pageState.email.value,
                password: pageState.password.value,
            } satisfies UserLogInRequest;

            try {
                await mutateAsync(request);
            } catch (error) {
                // TanStack Query exposes the error through `isError` / `error`.
                // No additional handling is required here unless you want
                // field-specific or custom error messages.
            }
        },
        [pageState,mutateAsync]
    );

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
                    User Log In
                </h1>


                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-8"
                >

                    {/* Email */}
                    <FormInput
                        name="email"
                        label="Email"
                        type="email"
                        value={pageState.email.value}
                        errorText={pageState.email.error}
                        onChange={(value) =>
                            handleChange("email", value)
                        }
                    />


                    {/* Password */}
                    <div className="mt-2">
                        <FormInput
                            name="password"
                            label="Password"
                            type="password"
                            value={pageState.password.value}
                            errorText={pageState.password.error}
                            onChange={(value) =>
                                handleChange("password", value)
                            }
                        />
                    </div>


                    {/* Login */}
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
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                        disabled={isPending}
                    >
                        {isPending ? "Logging In..." : "Log In"}
                    </button>

                </form>


                {/* Register */}
                <p className="mt-6 text-center text-sm text-drive-text-muted">
                    Don't have an account?{" "}

                    <Link
                        to="/register"
                        className="
                            text-drive-primary
                            hover:underline
                            font-medium
                        "
                    >
                        Register
                    </Link>
                </p>

            </div>
        </main>
    );
}

export default UserLogInPage;