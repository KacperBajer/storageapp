import React from 'react'

const page = async ({ params }: { params?: Promise<any> }) => {

  const {id} = await params

  return (
    <div>page</div>
  )
}

export default page