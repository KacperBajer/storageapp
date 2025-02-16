'use client'
import React from 'react'
import CustomInput from './CustomInput'
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { loginUser } from '@/lib/users';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const schema = z.object({
    email: z.string().email({
        message: "Enter valid email",
    }).transform(s => s.toLowerCase()),
    password: z.string().min(1, "Enter password"),
});

export type LoginSchemaData = z.infer<typeof schema>;
const SignInForm = () => {

    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: LoginSchemaData) => {
        try {
            const login = await loginUser(data.email, data.password)
            if (login.status === 'error') {
                toast.error(login.error || 'Something went wrong')
                return
            }
            toast.success('Successfully logged in')
            router.push('/')
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col gap-2 text-sm'>
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
            <button type='submit' className='w-full mt-1 bg-blue-600 rounded-md py-1.5'>Sign In</button>
        </form>
    )
}

export default SignInForm