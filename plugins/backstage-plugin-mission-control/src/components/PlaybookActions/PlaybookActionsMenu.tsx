import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemText, CircularProgress } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { useApi } from '@backstage/core-plugin-api';
import { missionControlApiRef, RunnablePlaybook } from '../../api/types';
import { PlaybookRunDialog } from './PlaybookRunDialog';

interface Props {
  configId: string;
  onRunSubmitted: () => void;
}

export function PlaybookActionsMenu({ configId, onRunSubmitted }: Props) {
  const api = useApi(missionControlApiRef);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [playbooks, setPlaybooks] = useState<RunnablePlaybook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedPlaybook, setSelectedPlaybook] = useState<RunnablePlaybook>();

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (playbooks.length > 0) return;
    setLoading(true);
    setError(undefined);
    try {
      setPlaybooks(await api.getPlaybooksForConfig(configId));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load playbooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pb: RunnablePlaybook) => {
    setAnchorEl(null);
    setSelectedPlaybook(pb);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PlayArrowIcon />}
        onClick={handleOpen}
      >
        Run Playbook
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {loading && (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        )}
        {error && <MenuItem disabled><ListItemText primary={error} /></MenuItem>}
        {!loading && !error && playbooks.length === 0 && (
          <MenuItem disabled><ListItemText primary="No playbooks available" /></MenuItem>
        )}
        {playbooks.map(pb => (
          <MenuItem key={pb.id} onClick={() => handleSelect(pb)}>
            <ListItemText
              primary={pb.title ?? pb.name}
              secondary={pb.category}
            />
          </MenuItem>
        ))}
      </Menu>
      {selectedPlaybook && (
        <PlaybookRunDialog
          playbook={selectedPlaybook}
          configId={configId}
          onClose={() => setSelectedPlaybook(undefined)}
          onSubmitted={() => {
            setSelectedPlaybook(undefined);
            onRunSubmitted();
          }}
        />
      )}
    </>
  );
}
