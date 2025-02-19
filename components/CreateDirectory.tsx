import React from 'react'
import { FaFolder } from "react-icons/fa";

type Props = {
  folderId: string
}

const CreateDirectory = ({folderId}: Props) => {
  return (
    <div className='bg-black/60 p-2 rounded-md'>
      <FaFolder className="text-green-600" />
    </div>
  )
}

export default CreateDirectory