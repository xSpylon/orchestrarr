import { useIntegrationEditor } from '@/hooks/use_integration_editor';
import { IntegrationField } from '@/components/IntegrationField/IntegrationField';
import { Button } from '@/components/Button/Button';
import type { IntegrationEditorProps } from './IntegrationEditor.types';
import styles from './IntegrationEditor.module.scss';
import { useLocale } from '@/lib/i18n';

export function IntegrationEditor(props: IntegrationEditorProps) {
  const { t } = useLocale();
  const editor = useIntegrationEditor(props);
  const { serviceKey, definition, onCancel } = props;
  if (!definition) return <p className="empty-state">{t('services.integrationNotFound')}</p>;
  const { name } = definition;

  return <form id="integration-editor-form" className={`integration-editor ${styles.editor}`} onSubmit={editor.submit}>
    <p className="drawer-intro">{t('services.editorIntro', undefined, { name })}</p>
    {editor.hasUrl ? <label><span>{name} URL</span><input type="url" value={editor.url} onChange={(event) => editor.setUrl(event.target.value)} placeholder={`http://${serviceKey}:8080`} autoComplete="off" /><small>{t('services.whereRunning', undefined, { name })}</small></label> : null}
    {definition.fields.map(([key, label]) => <IntegrationField key={key} fieldKey={key} label={t(`integration.field.${serviceKey}.${key}`, label)} value={editor.credentials[key] || ''} onChange={(value) => editor.setCredential(key, value)} />)}
    <div className={`drawer-actions ${styles.actions}`}><Button type="button" onClick={() => void editor.testConnection()} disabled={editor.testing || editor.loadingConfiguration}>{editor.testing ? t('services.testingConnection') : editor.loadingConfiguration ? t('services.loadingSettings') : t('services.testConnection')}</Button><span className={styles.spacer} /><Button type="button" onClick={onCancel}>{t('common.cancel')}</Button><Button variant="solid" type="submit" disabled={editor.saving}>{editor.saving ? t('common.saving') : t('services.saveNamed', undefined, { name })}</Button></div>
  </form>;
}
