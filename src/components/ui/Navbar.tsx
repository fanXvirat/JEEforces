// components/ui/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
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
import { Menu, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../theme-toggle';
import { SidebarContent } from '@/components/SidebarContent'; // Import the new SidebarContent

const getInitials = (name: string = '') => {
    const validName = name?.includes('@') ? name.split('@')[0] : name;
    return validName
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
};

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/contests', label: 'Contests' },
    { href: '/problems', label: 'Problems' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/discussions', label: 'Discussions' },
    { href: 'about', label: 'About' },
    { href : '/feedback', label: 'Feedback' },
];

export default function Navbar() {
    const { data: session } = useSession();
    const user = session?.user as NextAuthUser & { username?: string; avatar?: string };
    const pathname = usePathname();

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
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-primary'
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
                                    aria-label="User menu"
                                >
                                    <Avatar className='h-9 w-9'>
                                        <AvatarImage
                                            src={user?.avatar || undefined}
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
                                     <Link href='/dashboard/settings'>
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
                            {/* --- MODIFIED: Added flex-col and scrollable content for SidebarContent --- */}
                            <SheetContent side='left' className='w-full max-w-xs sm:max-w-sm flex flex-col'>
                                <SheetHeader className="mb-6">
                                    <SheetTitle>
                                        <Link href='/' className='text-xl font-bold text-primary'>
                                             JEEForces
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>
                                {/* Main Nav Links */}
                                <div className='flex flex-col space-y-3 pb-6 border-b'>
                                    {navLinks.map((link) => (
                                        <SheetClose asChild key={link.href}>
                                        <Link href={link.href} className="w-full">
                                            <Button
                                                variant="ghost"
                                                className={`w-full justify-start text-base ${ // Using text-base for better mobile readability
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
                                {/* Sidebar Content for Mobile - now scrollable */}
                                <div className="flex-1 overflow-y-auto pt-6">
                                  <SidebarContent /> {/* Render SidebarContent here, no `isCollapsed` needed for mobile sheet */}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}