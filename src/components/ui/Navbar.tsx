'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth'; // Renamed to avoid conflict with Lucide icon
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose, // Added SheetClose
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react'; // Imported specific icons
import { usePathname } from 'next/navigation'; 
import { ThemeToggle } from '../theme-toggle';

// Helper function for initials (if not globally available)
const getInitials = (name: string = '') => {
    // Handle potential email fallback or empty name
    const validName = name?.includes('@') ? name.split('@')[0] : name;
    return validName
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'; // Default fallback
};

// Define navigation links
const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/contests', label: 'Contests' },
    { href: '/problems', label: 'Problems' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/discussions', label: 'Discussions' },
];

export default function Navbar() { // Changed component name to follow conventions
    const { data: session } = useSession();
    // Ensure user type includes potential custom fields like 'username' and 'avatar'
    const user = session?.user as NextAuthUser & { username?: string; avatar?: string };
    const pathname = usePathname(); // Get current path

    return (
        <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container mx-auto flex h-16 items-center justify-between px-4 md:px-6'>
                {/* Logo */}
                <Link href='/' className='text-xl font-bold tracking-tight text-primary mr-4'>
                    JEEForces
                </Link>

                {/* Desktop Navigation */}
                <div className='hidden md:flex items-center gap-1 flex-grow'>
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                             <Button
                                variant="ghost"
                                className={`text-sm font-medium transition-colors ${
                                    pathname === link.href
                                        ? 'text-primary' // Active style
                                        : 'text-muted-foreground hover:text-primary' // Default style
                                }`}
                            >
                                {link.label}
                            </Button>
                        </Link>
                    ))}
                </div>

                {/* Mobile Navigation Trigger & Auth Section */}
                <div className='flex items-center gap-3'>
                     {/* Auth Section (Login Button or User Dropdown) */}
                     {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='ghost'
                                    className='relative h-9 w-9 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0'
                                    aria-label="User menu" // Accessibility
                                >
                                    <Avatar className='h-9 w-9'>
                                        <AvatarImage
                                            src={user?.avatar || undefined} // Pass undefined if null/empty
                                            alt={user?.username || user?.name || 'User Avatar'}
                                        />
                                        <AvatarFallback>
                                            {getInitials(user?.username || user?.name || user?.email || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-56' align='end' forceMount>
                                <DropdownMenuLabel className='font-normal'>
                                    <div className='flex flex-col space-y-1'>
                                        <p className='text-sm font-medium leading-none'>
                                            {user?.username || user?.name || 'User'}
                                        </p>
                                        <p className='text-xs leading-none text-muted-foreground'>
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href='/dashboard'>
                                        <LayoutDashboard className='mr-2 h-4 w-4' />
                                        <span>Dashboard</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                     <Link href='/dashboard/settings'> {/* Assuming settings is under dashboard */}
                                        <UserIcon className='mr-2 h-4 w-4' />
                                        <span>Profile Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600 focus:bg-red-100/50">
                                    <LogOut className='mr-2 h-4 w-4' />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href='/sign-in'>
                             <Button size="sm">Login</Button>
                        </Link>
                    )}
                    <ThemeToggle />

                    {/* Mobile Menu Trigger */}
                    <div className='md:hidden'>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                    <Menu className='h-6 w-6' />
                                    <span className='sr-only'>Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side='left' className='w-full max-w-xs sm:max-w-sm'>
                                <SheetHeader className="mb-6">
                                    <SheetTitle>
                                        <Link href='/' className='text-xl font-bold text-primary'>
                                             JEEForces
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className='flex flex-col space-y-3'>
                                    {navLinks.map((link) => (
                                        <SheetClose asChild key={link.href}>
                                        <Link href={link.href} className="w-full">
                                            <Button
                                                variant="ghost"
                                                className={`w-full justify-start text-base ${
                                                    pathname === link.href
                                                        ? 'text-primary font-semibold bg-muted'
                                                        : 'text-muted-foreground hover:text-primary'
                                                }`}
                                            >
                                                {link.label}
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                    ))}
                                </div>
                                {/* Optional: Add Login/Logout in mobile sheet footer */}
                                {/* <div className="mt-auto pt-6 border-t">
                                    {session ? (
                                        <Button variant="destructive" className="w-full" onClick={() => signOut()}>Logout</Button>
                                    ) : (
                                         <SheetClose asChild>
                                            <Link href="/sign-in" className="w-full">
                                                <Button className="w-full">Login</Button>
                                            </Link>
                                        </SheetClose>
                                    )}
                                </div> */}
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}