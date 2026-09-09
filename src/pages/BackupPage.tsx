import { Download, FileJson, FileSpreadsheet, Merge, ShieldCheck, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collectionBackupService } from '../app/dependencies';
import { ConfirmButton } from '../components/ConfirmButton';
import { CloudAccountCard } from '../components/CloudAccountCard';
import type { BackupPreview, ImportMode } from '../services/CollectionBackupService';
import { useI18n } from '../i18n';

export function BackupPage() {
  const { language, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const [preview, setPreview] = useState<BackupPreview>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const download = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportBackup = async () => {
    setBusy(true); setError('');
    try {
      download(JSON.stringify(await collectionBackupService.exportCollection(), null, 2), `living-dex-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      setMessage(t('backupExported', 'Backup exported successfully.'));
    } catch { setError(t('backupExportError', 'Could not export the collection.')); }
    finally { setBusy(false); }
  };

  const exportCsv = async () => {
    setBusy(true); setError('');
    try {
      download(await collectionBackupService.exportCsv(), `living-dex-collection-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
      setMessage(t('csvExported', 'CSV exported successfully.'));
    } catch { setError(t('csvExportError', 'Could not export CSV.')); }
    finally { setBusy(false); }
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    setError(''); setMessage('');
    try { setPreview(collectionBackupService.parse(await file.text())); }
    catch { setPreview(undefined); setError(t('backupReadError', 'Could not read this backup. Check that the file is a valid Living Dex backup.')); }
    finally { if (inputRef.current) inputRef.current.value = ''; }
  };

  const importBackup = async (mode: ImportMode) => {
    if (!preview) return;
    setBusy(true); setError('');
    try {
      await collectionBackupService.importCollection(preview.backup, mode);
      await client.invalidateQueries({ queryKey: ['collection'] });
      setMessage(mode === 'merge' ? t('backupMerged', 'Backup merged with your collection.') : t('backupReplaced', 'Collection replaced from backup.'));
      setPreview(undefined);
    } catch { setError(t('backupImportError', 'Could not import this backup.')); }
    finally { setBusy(false); }
  };

  return <>
    <div className="page-head"><div><span className="eyebrow">{t('dataSafety', 'DATA SAFETY')}</span><h1>{t('backupTitle', 'Backup & restore')}</h1><p>{t('backupDescription', 'Keep a portable copy of the collection stored on this device.')}</p></div></div>
    <div className="backup-grid">
      <section className="panel backup-card"><div className="backup-icon"><Download /></div><h2>{t('exportTitle', 'Export collection')}</h2><p>{t('exportDescription', 'Download a versioned JSON backup containing only your collection entries.')}</p><div className="button-row"><button className="primary" onClick={exportBackup} disabled={busy}><Download size={18} /> {t('exportBackup', 'Export backup')}</button><button className="secondary-action" onClick={exportCsv} disabled={busy}><FileSpreadsheet size={18} /> {t('exportCsv', 'Export CSV')}</button></div></section>
      <section className="panel backup-card"><div className="backup-icon"><Upload /></div><h2>{t('importTitle', 'Import backup')}</h2><p>{t('importDescription', 'Select a Living Dex JSON file. Nothing changes until you review and confirm it.')}</p><input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={event => readFile(event.target.files?.[0])} /><button className="secondary-action" onClick={() => inputRef.current?.click()} disabled={busy}><FileJson size={18} /> {t('selectJson', 'Select JSON file')}</button></section>
    </div>
    <CloudAccountCard />
    {error && <div className="notice error" role="alert">{error}</div>}
    {message && <div className="notice success" role="status"><ShieldCheck size={18} />{message}</div>}
    {preview && <section className="panel backup-preview"><div><span className="eyebrow">{t('importPreview', 'IMPORT PREVIEW')}</span><h2>{preview.species} {t('species', 'species')} · {preview.totalQuantity} Pokémon</h2><p>{preview.entries} {t('aggregatedEntries', 'aggregated entries')} · {t('exportedAt', 'exported')} {new Date(preview.backup.exportedAt).toLocaleString(language)}</p>{preview.duplicates > 0 && <p className="notice warning">{preview.duplicates} {t('duplicatesDetected', 'duplicate records detected; quantities will be consolidated.')}</p>}</div><div className="backup-preview-actions"><ConfirmButton className="secondary-action" dialogLabel={t('confirmation','Confirmation')} title={t('mergeCollectionQuestion', 'Merge this backup with the current collection?')} description={t('mergeCollectionDescription', 'Backup entries will be combined with the entries stored on this device. Matching quantities will be consolidated.')} confirmLabel={t('merge', 'Merge collection')} disabled={busy} onConfirm={() => importBackup('merge')}><Merge size={17} /> {t('merge', 'Merge collection')}</ConfirmButton><ConfirmButton className="primary" title={t('replaceCollectionQuestion', 'Replace the current collection?')} description={t('replaceCollectionDescription', 'All entries currently stored on this device will be replaced by this backup. Export your current collection first if needed.')} confirmLabel={t('replaceCollection', 'Replace collection')} disabled={busy} onConfirm={() => importBackup('replace')}><Upload size={17} /> {t('replaceCollection', 'Replace collection')}</ConfirmButton></div></section>}
  </>;
}
