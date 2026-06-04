import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Typography,
} from '@material-ui/core';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';
import { missionControlApiRef, RunnablePlaybook, PlaybookParam } from '../../api/types';

interface Props {
  playbook: RunnablePlaybook;
  configId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function PlaybookRunDialog({ playbook, configId, onClose, onSubmitted }: Props) {
  const api = useApi(missionControlApiRef);
  const alertApi = useApi(alertApiRef);
  const [params, setParams] = useState<PlaybookParam[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await api.getPlaybookParams(playbook.id, configId);
        if (!cancelled) setParams(fetched);
      } catch {
        if (!cancelled) setParams(playbook.parameters ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, playbook.id, configId, playbook.parameters]);

  useEffect(() => {
    const defaults: Record<string, any> = {};
    for (const p of params) {
      if (p.default !== undefined) defaults[p.name] = p.default;
    }
    setValues(defaults);
  }, [params]);

  const setValue = (name: string, value: any) =>
    setValues(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.submitPlaybookRun(playbook.id, configId, values);
      alertApi.post({ message: `Playbook "${playbook.title ?? playbook.name}" started`, severity: 'success' });
      onSubmitted();
    } catch (e: any) {
      alertApi.post({ message: e.message ?? 'Failed to run playbook', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (param: PlaybookParam) => {
    const options = param.properties?.options as { label: string; value: string }[] | undefined;

    if (param.type === 'checkbox') {
      return (
        <FormControlLabel
          key={param.name}
          control={
            <Checkbox
              checked={Boolean(values[param.name])}
              onChange={e => setValue(param.name, e.target.checked)}
            />
          }
          label={param.label}
        />
      );
    }

    if (param.type === 'list' && options) {
      return (
        <TextField
          key={param.name}
          select
          fullWidth
          margin="dense"
          label={param.label}
          required={param.required}
          value={values[param.name] ?? ''}
          onChange={e => setValue(param.name, e.target.value)}
          helperText={param.description}
        >
          {options.map(o => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    const unsupported = !['text', 'code', 'list', 'checkbox'].includes(param.type);
    return (
      <TextField
        key={param.name}
        fullWidth
        margin="dense"
        label={param.label}
        required={param.required}
        multiline={param.type === 'code'}
        rows={param.type === 'code' ? 4 : undefined}
        value={values[param.name] ?? ''}
        onChange={e => setValue(param.name, e.target.value)}
        helperText={unsupported ? `Type "${param.type}" — enter value as text` : param.description}
      />
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Run: {playbook.title ?? playbook.name}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : params.length === 0 ? (
          <Typography variant="body2">No parameters required.</Typography>
        ) : (
          params.map(renderField)
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={submitting || loading}
        >
          {submitting ? <CircularProgress size={20} /> : 'Run'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
