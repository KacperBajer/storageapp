import React from 'react'

type Props = {
    isActive: boolean
    onToggle: () => void
    isDisabled?: boolean
}

const ToggleButton = ({isActive, onToggle, isDisabled = false}: Props) => {
    return (
        <label className={`inline-flex items-center ${!isDisabled && 'cursor-pointer'}`}>
            <input type="checkbox" value="" className="sr-only peer" checked={isActive} onChange={onToggle} disabled={isDisabled} />
            <div className={`relative w-11 h-6 peer-focus:outline-none outline-none peer-focus:ring-blue-800 rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600 peer-checked:bg-blue-600`}></div>
        </label>
    )
}

export default ToggleButton