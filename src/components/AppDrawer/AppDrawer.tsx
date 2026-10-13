import { DetailDrawer } from '@/components/DetailDrawer/DetailDrawer';
import { IntegrationEditor } from '@/components/IntegrationEditor/IntegrationEditor';
import { ItemDetails } from '@/components/ItemDetails/ItemDetails';
import { Toast } from '@/components/Toast/Toast';
import { integrationDefinitions } from '@/pages/ServicesPage/ServicesPage';
import { displayText } from '@/helpers/format';
import type { AppDrawerProps } from './AppDrawer.types';

/** The side drawer: a service's connection editor or an item's details, with its own toast above the modal. */
export function AppDrawer({ item, editingService, toastMessage, technicalDetails, onClose, onSaved, onToast, onTest, onAction }: AppDrawerProps) {
  const definition = editingService ? integrationDefinitions.find((entry) => entry.key === editingService) : undefined;
  const title = editingService ? `Edit ${definition?.name || 'service'}` : item?.title ? displayText(item.title) : String(item?.name || 'Item details');
  return <DetailDrawer title={title} open={Boolean(item || editingService)} onClose={onClose}>
    {editingService ? <IntegrationEditor serviceKey={editingService} definition={definition} onToast={onToast} onTest={onTest} onSaved={onSaved} onCancel={onClose} /> : item ? <ItemDetails item={item} technicalDetails={technicalDetails} onAction={onAction} onToast={onToast} onClose={onClose} /> : null}
    <Toast message={toastMessage} />
  </DetailDrawer>;
}
