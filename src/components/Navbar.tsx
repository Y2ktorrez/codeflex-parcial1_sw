"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { EditIcon, CloudUploadIcon, ZapIcon, User2Icon } from "lucide-react";
import { Button } from "./ui/button";
import { CreateProjectDialog } from "./ProjectDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <ZapIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono">
            code<span className="text-primary">flex</span>.ai
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <Link href="/sketch" className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors">
                <EditIcon size={16} />
                <span>Sketch</span>
              </Link>

              <Link href="/diagram" className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors">
                <CloudUploadIcon size={16} />
                <span>Upload Diagram</span>
              </Link>

              <CreateProjectDialog />

              {/* MENÚ DE USUARIO */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                  >
                    <User2Icon size={18} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-medium">
                    {user?.username}
                  </DropdownMenuLabel>
                  <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:text-white hover:bg-primary/10"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
