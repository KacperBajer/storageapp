"use client";
import { File, Permissions } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import React, { useState } from "react";
import { FaFolder } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { FaFile } from "react-icons/fa";
import MoreBox from "./MoreBox";
import DownloadPopup from "./DownloadPopup";
import ConfirmAction from "./ConfirmAction";
import { deleteFile } from "@/lib/files";
import { toast } from "react-toastify";

type Props = {
  files: (File & Permissions)[] ;
  folderId?: string
};

const FilesTable = ({ files, folderId }: Props) => {
  const [showMoreBox, setShowMoreBox] = useState<File & Permissions | null>(null);
  const [showDownloadPopup, setShowDownloadPopup] = useState<File | null>(null);
  const [showConfirmAction, setShowConfirmAction] = useState<boolean | any>(false)
  const [moreBoxPosition, setMoreBoxPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const download = async (id: string) => {
    const a = document.createElement("a");
    a.href = `/api/download?id=${id}&type=file`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMoreClick = (event: React.MouseEvent, file: File & Permissions) => {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    setShowMoreBox(file);
    setMoreBoxPosition({  
      top: buttonRect.top + window.scrollY + 20,
      left: buttonRect.left + window.scrollX,
    });
  };

  const deleteFunc = async (id: string, type: "file" | "folder") => {
      const res = await deleteFile(id, type, folderId);
      if (res.status === "error") {
        toast.error(res.error || "Something went wrong");
        return;
      }
      toast.success("Deleted");
    };

  return (
    <>
      {showMoreBox && (
        <MoreBox
          file={showMoreBox}
          handleClose={() => setShowMoreBox(null)}
          position={moreBoxPosition as { top: number; left: number }}
          setShowDownloadPopup={setShowDownloadPopup}
          setShowConfirmAction={setShowConfirmAction}
        />
      )}
      {showDownloadPopup && <DownloadPopup
        folder={showDownloadPopup}
        handleClose={() => setShowDownloadPopup(null)}
      />}
      {showConfirmAction && <ConfirmAction name={showConfirmAction.action} handleClose={() => setShowConfirmAction(false)} action={() => deleteFunc(showConfirmAction.file.id, showConfirmAction.file.type)} />}

      <div className="overflow-auto hideScrollbar">
        <div className="flex flex-col relative max-h-[calc(100vh-180px)] min-w-[600px]">
          <section className="flex border-b border-dark-200 items-center bg-dark-300 py-2 text-sm text-gray-300">
            <div className="w-[50px] flex justify-center">
              <div className="p-1.5 rounded-md bg-black/60">
                <FaFolder />
              </div>
            </div>
            <div className="w-[50px] flex flex-1">
              <p>Name</p>
            </div>
            <div className="w-[150px] flex justify-center">
              <p>Type</p>
            </div>
            <div className="w-[150px] flex justify-center">
              <p>Uploaded</p>
            </div>
            <div className="w-[50px] flex justify-center">
              <div className="p-1.5 rounded-md bg-black/60 hover:cursor-pointer">
                <IoIosMore />
              </div>
            </div>
          </section>
          {files?.map((item, index) => (
            <div
              key={item.id}
              className={`flex ${
                files.length !== index + 1 && "border-b border-dark-200"
              } items-center`}
            >
              <div className="w-[50px] flex justify-center py-2">
                <div className="p-1.5 rounded-md bg-dark-300">
                  {item.type === "folder" ? (
                    <FaFolder className="text-green-600" />
                  ) : (
                    <FaFile className="text-blue-600" />
                  )}
                </div>
              </div>
              {item.type === "folder" ? (
                <Link
                  href={`/folder/${item.id}`}
                  className="w-[50px] flex flex-1 py-2"
                >
                  <p className="font-semibold">{item.name}</p>
                </Link>
              ) : (
                <button
                  onClick={() => download(item.id)}
                  className="w-[50px] flex flex-1 py-2"
                >
                  <p className="font-semibold">{item.name}</p>
                </button>
              )}
              <div className="w-[150px] flex justify-center py-2">
                <div className="py-1.5 px-4 rounded-md bg-black/60">
                  <p
                    className={`uppercase font-medium ${
                      item.type === "folder"
                        ? "text-green-600"
                        : "text-blue-600"
                    } select-none text-sm`}
                  >
                    {item.type}
                  </p>
                </div>
              </div>
              <div className="w-[150px] flex justify-center py-2">
                <p>{formatDate(item.created_at)}</p>
              </div>
              <div className="w-[50px] flex justify-center py-2">
                <button onClick={(e) => handleMoreClick(e, item)} className="p-1.5 rounded-md bg-black/60 hover:cursor-pointer">
                  <IoIosMore />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FilesTable;
