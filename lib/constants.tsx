import { FaFile } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { FaShareAltSquare } from "react-icons/fa";
import { FaDatabase } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";


export const SideBarLinks = [
    {
        path: '/',
        title: 'Files',
        icon: <FaFile />
    },
    {
        path: '/trash',
        title: 'Trash',
        icon: <FaTrash />
    },
    {
        path: '/shares',
        title: 'Shares',
        icon: <FaShareAltSquare />
    },
    {
        path: '/statistics',
        title: 'Statistics',
        icon: <FaDatabase />
    },
    {
        path: '/settings',
        title: 'Settings',
        icon: <IoSettingsSharp />
    },
]