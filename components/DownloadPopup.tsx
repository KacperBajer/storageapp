"use client";
import { createZip, deleteZip, getZips } from "@/lib/files";
import { File, Zip } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";

type Props = {
  handleClose: () => void;
  folder: File;
};

const DownloadPopup = ({ folder, handleClose }: Props) => {
  const [data, setData] = useState<Zip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCreate, setIsLoadingCreate] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null);

  const getData = async () => {
    const res = await getZips(folder.id)
    setData(res)
    setIsLoading(false)
  }

  const deleteFunc = async (id: string) => {
    const res = await deleteZip(id)
    if(res.status === 'error') {
      toast.error(res.error || "Something went wrong")
      return
    }
    toast.success('Zip deleted')
    getData()
  }

  const create = async () => {
    setIsLoadingCreate(true)
    const res = await createZip(folder.id)
    if(res.status === 'error') {
      toast.error(res.error || "Something went wrong")
      setIsLoadingCreate(false)
      return
    }
    toast.success('Zip created')
    setIsLoadingCreate(false)
    getData()
  }

  useEffect(() => {
     getData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if(isLoading) {
    return <div className="fixed top-0 left-0 z-30 w-full h-screen flex justify-center items-center bg-black/30"></div>
  }

  return (
    <div className="fixed top-0 left-0 z-30 w-full h-screen flex justify-center items-center bg-black/30">
      <div
        className="rounded-md flex flex-col items-center p-4 w-[300px] bg-dark-300 border border-dark-200"
        ref={boxRef}
      >
        <p className="text-3xl font-semibold text-center mb-5">Zips</p>
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
             <p>{formatDate(item.created_at)}</p>
             <button className="bg-black rounded-md p-2.5">
              <FaDownload className="text-green-500" />
             </button>
             <button onClick={() => deleteFunc(item.id)} className="bg-black rounded-md p-2.5">
              <FaTrash className="text-red-500" />
             </button>
            </div>
          ))}
        </div>
        <button
          onClick={create}
          className="px-4 mt-4 bg-blue-600 rounded-md py-1.5"
        >
          {isLoadingCreate ? 'Creating...' : 'Create new zip'}
        </button>
      </div>
    </div>
  );
};

export default DownloadPopup;
