"use client";
import { File } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { FaFolder } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { FaFile } from "react-icons/fa";
import { downloadFile } from "@/lib/download";

type Props = {
  files: File[];
};

const FilesTable = ({ files }: Props) => {
  const download = async (id: string, name: string) => {
    try {
      const response = await downloadFile(id);
      if(!response) return
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="overflow-auto hideScrollbar">
      <div className="flex flex-col relative max-h-[calc(100vh-180px)] min-w-[600px]">
        <div className="flex border-b sticky top-0 border-dark-200 items-center bg-[#0b0b0b] py-2 text-sm text-gray-300">
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
        </div>
        {files?.map((item, index) => (
          <div
            key={item.id}
            className={`flex ${
              files.length !== index + 1 && "border-b border-dark-200"
            } items-center`}
          >
            <div className="w-[50px] flex justify-center py-2">
              <div className="p-1.5 rounded-md bg-black/60">
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
                onClick={() => download(item.id, item.name)}
                className="w-[50px] flex flex-1 py-2"
              >
                <p className="font-semibold">{item.name}</p>
              </button>
            )}
            <div className="w-[150px] flex justify-center py-2">
              <div className="py-1.5 px-4 rounded-md bg-black/60">
                <p
                  className={`uppercase font-medium ${
                    item.type === "folder" ? "text-green-600" : "text-blue-600"
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
              <div className="p-1.5 rounded-md bg-black/60 hover:cursor-pointer">
                <IoIosMore />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilesTable;
