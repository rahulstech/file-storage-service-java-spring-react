import { useMutation } from "@tanstack/react-query";
import type { UserLogInRequest, UserLogInResponse } from "../models";
import { api } from '../services/api';
import { useAuthContext } from "../contexts/AuthContext";

export function useUserLogIn() {
    const { setUser } = useAuthContext();
    return useMutation<UserLogInResponse, Error, UserLogInRequest>({
        mutationFn: (body: UserLogInRequest)=> api.userLogIn(body),
        onSuccess(data: UserLogInResponse) {
            setUser(data)
        },
    });
}