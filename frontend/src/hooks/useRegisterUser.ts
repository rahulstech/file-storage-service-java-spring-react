import { useMutation } from "@tanstack/react-query";
import type { RegisterUserRequest, UserLogInResponse } from "../models";
import {api} from '../services/api';
import { useAuthContext } from "../contexts/AuthContext";

export function useRegisterUser() {
    const { setUser } = useAuthContext()
    return useMutation<UserLogInResponse, Error, RegisterUserRequest>({
        mutationFn: (body: RegisterUserRequest) => api.registerUser(body),
        onSuccess(data: UserLogInResponse) {
            setUser(data)
        }
    })
}