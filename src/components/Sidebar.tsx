// components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarContent } from './SidebarContent'; // Import the new component

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <TooltipProvider delayDuration={100}>
            {/* --- MODIFIED: Added `hidden md:block` here to hide the entire desktop sidebar on mobile --- */}
            <aside
                className={cn(
                    "sticky top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out hidden md:block",
                    isCollapsed ? "w-[60px]" : "w-[280px] lg:w-[320px]"
                )}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute top-3 z-10 h-7 w-7 rounded-full",
                                isCollapsed ? "right-1/2 translate-x-1/2" : "right-3"
                            )}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                            <span className="sr-only">{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    </TooltipContent>
                </Tooltip>

                {/* Render the core content */}
                <div className="h-full overflow-y-auto overflow-x-hidden pt-12">
                  <SidebarContent isCollapsed={isCollapsed} />
                </div>
            </aside>
        </TooltipProvider>
    );
}