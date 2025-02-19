"use client";
import { createDirectory } from "@/lib/files";
import React, { useState } from "react";
import { FaFolder } from "react-icons/fa";
import CreateDirectoryPopup from "./CreateDirectoryPopup";

type Props = {
  folderId: string;
};

const CreateDirectory = ({ folderId }: Props) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      {showPopup && <CreateDirectoryPopup folderId={folderId} handleClose={() => setShowPopup(false)} />}
      <button
        onClick={() => setShowPopup(true)}
        className="bg-black/60 p-2.5 rounded-md"
      >
        <FaFolder className="text-green-600" />
      </button>
    </>
  );
};

export default CreateDirectory;
