import CreateDirectory from "@/components/CreateDirectory";
import FilePath from "@/components/FilePath";
import FilesTable from "@/components/FilesTable";
import FileUploader from "@/components/FileUploader";
import Header from "@/components/Header";
import { getFiles } from "@/lib/files";
import { getFolderPermissions } from "@/lib/permissions";
import { getUser } from "@/lib/users";
import { redirect } from "next/navigation";
import React from "react";

const page = async ({ params }: { params?: Promise<any> }) => {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const { folderid } = await params;
  const permissions = await getFolderPermissions(folderid);
  if (!permissions.can_read) redirect("/");
  console.log(permissions)
  const files = (await getFiles(folderid)) || [];

  return (
    <div className="flex flex-col h-screen w-full pr-4 py-4">
      <Header user={user} />
      <div className="flex flex-col flex-1 px-4 pt-4 bg-black/35 rounded-md mt-4">
        <div className="flex justify-between items-center mb-4">
          <FilePath folderId={folderid} />
          <div className="flex items-center gap-2"> 
            {permissions.can_write && <CreateDirectory folderId={folderid} />}
            {permissions.can_write && <FileUploader folderId={folderid} />}
          </div>
        </div>
        <FilesTable user={user} files={files} folderId={folderid} />
      </div>
    </div>
  );
};

export default page;
