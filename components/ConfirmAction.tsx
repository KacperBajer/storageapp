"use client";
import { checkPassword } from "@/lib/users";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  handleClose: () => void;
  action: () => void;
  name: string
};

const ConfirmAction = ({ handleClose, action, name }: Props) => {
  const [password, setPassword] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

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
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const isValidPassword = await checkPassword(password)
    if(!isValidPassword) {
      toast.error('incorrect password')
      return
    }
    action()
    handleClose()
  }

  return (
    <div className="fixed top-0 left-0 z-[60] w-full h-screen flex justify-center items-center bg-black/30">
      <div
        className="rounded-md p-4 w-[300px] bg-dark-300 border border-dark-200"
        ref={boxRef}
      >
        <form onSubmit={handleSubmit}>
          <p className="text-center text-xl mb-1 font-semibold">Authentication required</p>
          <p className="text-center mb-3 text-sm text-gray-300">To confirm {name} action please enter your password!</p>
          <input
            type="password"
            className="appearance-none outline-none rounded-md border border-dark-200 py-1.5 px-4 bg-transparent w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full mt-2 bg-blue-600 rounded-md py-1.5"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmAction;
