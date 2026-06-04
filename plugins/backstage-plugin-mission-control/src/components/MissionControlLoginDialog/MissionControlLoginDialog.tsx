import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

interface MissionControlLoginDialogProps {
  open: boolean;
  baseUrl: string;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function MissionControlLoginDialog({
  open,
  baseUrl,
  onClose,
  onLoginSuccess,
}: MissionControlLoginDialogProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!open) return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/whoami`, {
          credentials: 'include',
        });
        if (res.ok) {
          onLoginSuccess();
        }
      } catch {
        // Network error — keep polling
      }
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [open, baseUrl, onLoginSuccess]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Sign in to Mission Control
        <IconButton
          aria-label="close"
          onClick={onClose}
          style={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ padding: 0, height: '70vh' }}>
        <iframe
          src={`${baseUrl}/login`}
          title="Mission Control Login"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
}
