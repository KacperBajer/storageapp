import React, { InputHTMLAttributes } from 'react'

type Props = {
    name: string
    error?: string
    register: any
} & InputHTMLAttributes<HTMLInputElement>

const CustomInput = ({name, value, error, register, ...props}: Props) => {
  return (
    <div>
        <input 
            id={name}
            name={name}
            {...props}
            {...register(name, { required: true })}
            className='appearance-none outline-none rounded-md border border-dark-200 py-1.5 px-4 bg-transparent w-full'
        />
        {error && <p className='ml-1 mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  )
}

export default CustomInput