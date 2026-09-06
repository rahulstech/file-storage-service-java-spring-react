import { useMutation } from "@tanstack/react-query";
import type { RegisterUserRequest, UserLogInResponse } from "../models";
import {api} from '../services/api';

export function useRegisterUser() {
    return useMutation<UserLogInResponse, Error, RegisterUserRequest>({
        mutationFn: (body: RegisterUserRequest) => api.registerUser(body)
    })
}