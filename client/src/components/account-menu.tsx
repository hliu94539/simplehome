import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, KeyRound, Trash2, LogOut } from "lucide-react";

interface AccountMenuProps {
  user: User;
  onSettingsClick?: () => void;
}

export default function AccountMenu({ user, onSettingsClick }: AccountMenuProps) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // Clear local state regardless of server response
    }
    queryClient.clear();
    navigate("/");
  };

  const displayName = user.name || user.email;
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 p-0"
            title={displayName}
          >
            {initials}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium leading-none truncate">{displayName}</p>
              {user.name && (
                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {onSettingsClick && (
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteAccount(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password dialog — UI shell, backend wired in PR 2 */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your account password. You'll need to enter your current password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="cp-current">Current password</Label>
              <Input id="cp-current" type="password" placeholder="••••••••" disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cp-new">New password</Label>
              <Input id="cp-new" type="password" placeholder="••••••••" disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cp-confirm">Confirm new password</Label>
              <Input id="cp-confirm" type="password" placeholder="••••••••" disabled />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancel
            </Button>
            <Button disabled title="Coming in a future update">
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account dialog — UI shell, backend wired in PR 3 */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="da-password">Enter your password to confirm</Label>
              <Input id="da-password" type="password" placeholder="••••••••" disabled />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteAccount(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled title="Coming in a future update">
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
