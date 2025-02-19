"use client";
import { createDirectory } from "@/lib/files";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  folderId: string;
  handleClose: () => void;
};

const CreateDirectoryPopup = ({ folderId, handleClose }: Props) => {
  const [name, setName] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await createDirectory(folderId, name);
      if (res.status === "error") {
        toast.error(res.error || "Something went wrong");
        return;
      }
      toast.success("Directory created");
      handleClose();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
            handleClose()
        }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };

}, [])

  return (
    <div className="fixed top-0 left-0 z-30 w-full h-screen flex justify-center items-center bg-black/30">
      <form onSubmit={create}>
        <div
          className="rounded-md p-4 bg-dark-300 border border-dark-200"
          ref={boxRef}
        >
          <input
            type="text"
            className="appearance-none outline-none rounded-md border border-dark-200 py-1.5 px-4 bg-transparent w-full"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            className="w-full mt-2 bg-blue-600 rounded-md py-1.5"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDirectoryPopup;
