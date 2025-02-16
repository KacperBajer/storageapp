'use client'
import React from 'react'
import CustomInput from './CustomInput'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createUser } from '@/lib/users';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const schema = z.object({
    username: z.string().min(1, "Enter username"),
    email: z.string().email({
        message: "Enter valid email",
    }).transform(s => s.toLowerCase()),
    password: z.string().min(7, "Enter a password (minimum 7 characters)"),
    confirmPassword: z.string().min(1, "Confirm password"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
});

export type RegisterSchemaData = z.infer<typeof schema>;

const SignUpForm = () => {

    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: RegisterSchemaData) => {
        try {
            const register = await createUser(data.email, data.username, data.password)
            if(register.status === 'error') {
                toast.error(register.error || 'Something went wrong')
                return
            }
            toast.success('Account has been successfully created')
            router.push('/')
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col gap-2 text-sm'>
            <CustomInput
                placeholder='Username'
                type='text'
                name='username'
                register={register}
                error={errors.username && errors.username.message}
            />
            <CustomInput
                placeholder='Email'
                type='email'
                name='email'
                register={register}
                error={errors.email && errors.email.message}
            />
            <CustomInput
                register={register}
                error={errors.password && errors.password.message}
                name='password'
                placeholder='Password'
                type='password'
            />
            <CustomInput
                register={register}
                error={errors.confirmPassword && errors.confirmPassword.message}
                name='confirmPassword'
                placeholder='Confirm password'
                type='password'
            />
            <button type='submit' className='w-full mt-1 bg-blue-600 rounded-md py-1.5'>Sign Up</button>
        </form>
    )
}

export default SignUpForm