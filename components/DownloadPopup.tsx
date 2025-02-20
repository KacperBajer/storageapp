"use client";
import { createZip, getZips } from "@/lib/files";
import { File, Zip } from "@/lib/types";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  handleClose: () => void;
  folder: File;
};

const DownloadPopup = ({ folder, handleClose }: Props) => {
  const [data, setData] = useState<Zip[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null);

  const getData = async () => {
    const res = await getZips(folder.id)
    setData(res)
  }

  const create = async () => {
    setIsLoading(true)
    const res = await createZip(folder.id)
    if(res.status === 'error') {
      toast.error(res.error || "Something went wrong")
      setIsLoading(false)
      return
    }
    toast.success('Zip created')
    setIsLoading(false)
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

  return (
    <div className="fixed top-0 left-0 z-30 w-full h-screen flex justify-center items-center bg-black/30">
      <div
        className="rounded-md flex flex-col items-center p-4 w-[300px] bg-dark-300 border border-dark-200"
        ref={boxRef}
      >
        <button
          onClick={create}
          className="px-4 mt-2 bg-blue-600 rounded-md py-1.5"
        >
          {isLoading ? 'Creating...' : 'Create new zip'}
        </button>
      </div>
    </div>
  );
};

export default DownloadPopup;
