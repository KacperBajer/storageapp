"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa6";
import { File, Permissions } from "@/lib/types";
import { FaShareAltSquare } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

type Props = {
  position: { top: number; left: number };
  handleClose: () => void;
  file: File & Permissions;
  setShowDownloadPopup: (e: File) => void;
  setShowConfirmAction: (e: any) => void
  setShowSharePopup: (e: File) => void
};

const MoreBox = ({
  position,
  handleClose,
  file,
  setShowDownloadPopup,
  setShowConfirmAction,
  setShowSharePopup,
}: Props) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const download = async (id: string, type: "file" | "folder") => {
    const a = document.createElement("a");
    a.href = `/api/download?id=${id}&type=${type}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-30 w-full h-screen">
        <div
          ref={boxRef}
          style={{ top: position.top, left: position.left - 100 }}
          className="absolute p-1 bg-dark-300 rounded-md border-2 flex flex-col gap-0.5 border-dark-200 w-fit text-xs text-gray-200"
        >
          <button
            onClick={() => {
              if (file.type === "file") {
                download(file.id, file.type);
              } else {
                setShowDownloadPopup(file);
                handleClose();
              }
            }}
            className="px-3 py-1.5 w-full text-left hover:cursor-pointer hover:bg-dark-100 rounded-md hover:text-white transition-all duration-200 flex gap-2 items-center"
          >
            <FaDownload className="text-green-500 text-lg" />
            <p>Download</p>
          </button>
          {file.can_manage && <button onClick={() => {
            setShowSharePopup(file)
            handleClose()
          }} className="px-3 py-1.5 w-full text-left hover:cursor-pointer hover:bg-dark-100 rounded-md hover:text-white transition-all duration-200 flex gap-2 items-center">
            <FaShareAltSquare className="text-violet-600 text-lg" />
            <p>Share</p>
          </button>}
         {file.can_delete && <button onClick={() => {
            setShowConfirmAction({action: 'delete', file: file})
            handleClose()
          }} className="px-3 py-1.5 w-full text-left hover:cursor-pointer hover:bg-dark-100 rounded-md hover:text-white transition-all duration-200 flex gap-2 items-center">
            <FaTrash className="text-red-600 text-lg" />
            <p>Delete</p>
          </button>}
        </div>
      </div>
    </>
  );
};

export default MoreBox;
