'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User } from 'next-auth';
import { Button } from './button';
import { Menu, X } from 'lucide-react';

function Navbar() {
   const { data: session } = useSession();
   const user: User = session?.user as User;
   const [menuOpen, setMenuOpen] = useState(false);
   const [profileOpen, setProfileOpen] = useState(false);

   return (
      <nav className='p-4 md:p-6 shadow-md bg-white sticky top-0 z-50'>
         <div className='container mx-auto flex items-center justify-between'>
            {/* Logo */}
            <Link href='/' className='text-2xl font-bold'>
               JEEForces
            </Link>

            {/* Hamburger Menu (Mobile) */}
            <button
               className='md:hidden p-2'
               onClick={() => setMenuOpen(!menuOpen)}
            >
               {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Nav Links (Desktop) */}
            <ul
               className={`${
                  menuOpen ? 'block' : 'hidden'
               } md:flex space-x-6 absolute md:static bg-white md:bg-transparent w-full md:w-auto left-0 top-16 md:top-auto p-4 md:p-0 shadow-md md:shadow-none z-40`}
            >
               <li>
                  <Link href='/' className='hover:text-blue-600'>
                     Home
                  </Link>
               </li>
               <li>
                  <Link href='/contests' className='hover:text-blue-600'>
                     Contests
                  </Link>
               </li>
               <li>
                  <Link href='/problems' className='hover:text-blue-600'>
                     Problems
                  </Link>
               </li>
               <li>
                  <Link href='/leaderboard' className='hover:text-blue-600'>
                     Leaderboard
                  </Link>
               </li>
               <li>
                  <Link href='/discussions' className='hover:text-blue-600'>
                     Discussions
                  </Link>
               </li>
            </ul>

            {/* User Profile (Desktop) */}
            {session ? (
               <div className='relative'>
                  <button
                     className='flex items-center space-x-2 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition'
                     onClick={() => setProfileOpen(!profileOpen)}
                  >
                     <img
                        src={user?.image || '/default-avatar.png'}
                        alt='User Avatar'
                        className='w-8 h-8 rounded-full'
                     />
                     <span>{user?.name || user?.email}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                     <div className='absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg'>
                        <Link href='/dashboard' className='block px-4 py-2 hover:bg-gray-100'>
                           Profile
                        </Link>
                        <button
                           onClick={() => signOut()}
                           className='block w-full text-left px-4 py-2 hover:bg-gray-100'
                        >
                           Logout
                        </button>
                     </div>
                  )}
               </div>
            ) : (
               <Link href='/sign-in'>
                  <Button>Login</Button>
               </Link>
            )}
         </div>
      </nav>
   );
}

export default Navbar;
