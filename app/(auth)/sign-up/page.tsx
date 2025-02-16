import SignUpForm from '@/components/SignUpForm'
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className='flex flex-col w-[300px]'>
        <p className='font-semibold text-2xl text-center mb-3'>Sign Up</p>
        <p className='text-center text-sm text-gray-400 mb-5'>Please enter your data to sign up and access your dashboard.</p>
        <SignUpForm />
        <p className='text-sm text-center text-gray-400 mt-2'>Do you have an account? <Link className='text-blue-500' href={'/sign-in'}>Sign In!</Link></p>
    </div>
  )
}

export default page